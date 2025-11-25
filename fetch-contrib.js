#!/usr/bin/env node
/**
 * Fetch "contributions in the last year" (public + private) for the authenticated user.
 * - Requires GITHUB_TOKEN (env or .env) with read:user scope.
 * - Writes data/contributions.json for the static site to consume.
 */

import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN.trim();

  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    const line = content
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("GITHUB_TOKEN="));
    if (line) {
      const [, val] = line.split("=");
      if (val) return val.trim();
    }
  }
  return null;
}

const token = loadToken();
if (!token) {
  console.error("GITHUB_TOKEN is required (env or .env).");
  process.exit(1);
}

const query = `
  query {
    viewer {
      repositories(
        privacy: PUBLIC
        ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]
      ) {
        totalCount
      }
      privateRepos: repositories(
        privacy: PRIVATE
        ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]
      ) {
        totalCount
      }
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              color
            }
          }
        }
      }
    }
  }
`;

const body = JSON.stringify({ query });
const options = {
  hostname: "api.github.com",
  path: "/graphql",
  method: "POST",
  headers: {
    "User-Agent": "contrib-fetcher",
    Authorization: `bearer ${token}`,
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  },
};

const req = https.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    if (res.statusCode !== 200) {
      console.error("GitHub API error:", res.statusCode, data);
      process.exit(1);
    }
    const json = JSON.parse(data);
    const calendar =
      json?.data?.viewer?.contributionsCollection?.contributionCalendar;
    const reposPublic = json?.data?.viewer?.repositories?.totalCount ?? null;
    const reposPrivate = json?.data?.viewer?.privateRepos?.totalCount ?? null;
    const total = calendar?.totalContributions;
    if (typeof total !== "number" || !calendar?.weeks) {
      console.error("Failed to read totalContributions from response.");
      process.exit(1);
    }

    const outDir = path.join(__dirname, "data");
    const outPath = path.join(outDir, "contributions.json");
    fs.mkdirSync(outDir, { recursive: true });
    const payload = {
      totalContributions: total,
      fetchedAt: new Date().toISOString(),
      source: "GitHub GraphQL contributionsCollection.contributionCalendar",
      repositories: {
        public: reposPublic,
        private: reposPrivate,
        total:
          typeof reposPublic === "number" && typeof reposPrivate === "number"
            ? reposPublic + reposPrivate
            : null,
      },
      calendar,
    };
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));

    // JS 形式でも保存しておくことで、file:// で開いても参照できるようにする
    const jsPath = path.join(outDir, "contributions.js");
    const jsContent = `window.CONTRIB_DATA = ${JSON.stringify(payload, null, 2)};`;
    fs.writeFileSync(jsPath, jsContent);

    console.log(
      `Saved totalContributions=${total} (private含む) -> ${path.relative(
        __dirname,
        outPath
      )}`
    );
  });
});

req.on("error", (err) => {
  console.error("Request error:", err);
  process.exit(1);
});

req.write(body);
req.end();
