# T. Maruyama Portfolio

クラウド（主に AWS）と生成 AI / 個人開発まわりの活動をまとめた、シンプルなポートフォリオサイトです。  
GitHub Pages のユーザーサイト（`https://<username>.github.io/`）としてホストする前提の構成になっています。

- 公開サイト例: `https://tmaru-eng.github.io/`
- 使用技術: HTML / CSS（バニラのみ）

---

## リポジトリ構成

```text
.
├── index.html             # ポートフォリオ本体（単一ページ）
├── fetch-contrib.js       # GitHub Activity/リポジトリ数を取得するスクリプト
├── data/
│   ├── contributions.json # 取得済みスナップショット（HTML から fetch 用）
│   └── contributions.js   # window.CONTRIB_DATA として埋め込む JS（file:// 用）
├── githooks/
│   └── pre-commit         # コミット前に fetch-contrib を実行し生成物を add
├── .env.template          # GITHUB_TOKEN のサンプル（このファイルは公開可）
├── .gitignore             # .env などを除外
└── README.md              # このファイル（外部からも閲覧可能）
```

`index.html` だけで完結する静的サイトです。ビルド工程はありません。
ただし GitHub Activity/リポジトリ数の表示は `data/` 配下の JSON/JS を参照するため、更新時にスクリプトを実行します（後述）。

---

## ローカルでの確認方法

### 1. クローン

```bash
git clone git@github.com:tmaru-eng/tmaru-eng.github.io.git
cd tmaru-eng.github.io
```

※ HTTPS を使う場合は

```bash
git clone https://github.com/tmaru-eng/tmaru-eng.github.io.git
cd tmaru-eng.github.io
```

### 2. ブラウザで開く

最も簡単な方法は、`index.html` を直接ブラウザで開く方法です。

- Finder / Explorer から `index.html` をダブルクリック
- あるいは、ブラウザで `File > Open` から `index.html` を指定

ローカルで簡易サーバーを立てたい場合（任意）:

```bash
# Python 3 系の場合
python -m http.server 8000

# http://localhost:8000/index.html にアクセス
```

---

## GitHub Pages へのデプロイ手順

ユーザーサイトとして公開する前提の手順です。

### 事前準備

- GitHub アカウント名: `<username>`（例: `tmaru-eng`）
- リポジトリ名: `<username>.github.io`  
  例: `tmaru-eng.github.io`

> まだ作成していない場合は、GitHub 上で `New repository` から  
> 名前を `<username>.github.io` にして Public リポジトリを作成してください。

### 1. 変更の反映（ローカル）

`index.html` を編集したら、以下でコミットします。

```bash
git status

git add index.html
git commit -m "Update portfolio"
git push origin main    # デフォルトブランチが main の場合
# または
git push origin master  # デフォルトブランチが master の場合
```

### 2. GitHub Pages の設定

ブラウザで GitHub を開き、対象リポジトリ（例: `tmaru-eng.github.io`）の設定を行います。

1. リポジトリ上部の `Settings` タブを開く
2. 左側メニューから `Pages` を選択
3. 「Source」を以下のように設定
   - `Deploy from a branch`
   - Branch: `main`（または `master`）
   - Folder: `/ (root)`
4. `Save` をクリック

数十秒〜数分程度でデプロイが反映されます。

- 公開 URL: `https://<username>.github.io/`  
  例: `https://tmaru-eng.github.io/`

---

## 更新フロー（運用）

以降の更新は、基本的に次の流れで行います。

1. `index.html` を編集
2. ローカルで見た目を確認（ブラウザで開く or `python -m http.server` 等）
3. （必要に応じて）Activity/リポジトリ数を更新

```bash
# .env に GITHUB_TOKEN=... を用意（private repo 数も含めるなら repo スコープの PAT）
node fetch-contrib.js  # data/contributions.json / contributions.js が更新されます
```

4. Git でコミット・プッシュ

```bash
git status
git add index.html data/contributions.json data/contributions.js
git commit -m "Update portfolio section"   # メッセージは適宜変更
git push origin main                       # または master
```

5. 数十秒～数分後に GitHub Pages 上のサイトが自動更新される

---

## 注意事項（公開範囲について）

- このリポジトリ（`<username>.github.io`）に含まれるファイルは、  
  GitHub Pages によってインターネット上に公開されます。
- **機密情報や公開したくないコード・設定ファイルは、このリポジトリに含めないでください。**
  - 個人開発のソースコードや検証用コードは、別の private リポジトリで管理し、
    公開したい内容だけをこのポートフォリオにリンクする形を推奨します。
- `data/` 配下は生成物ですが、GitHub Activity/リポジトリ数を表示するためにコミット対象に含めています（公開して問題ない集計情報のみ）。
- private リポジトリ数・プライベート貢献数も数値として掲載しています。数値のみで個人情報は含みませんが、公開されることを認識してください。
- README 自体も公開されるため、トークン値などの秘密情報を書かないようにしてください。

---

## GitHub Activity / リポジトリ数の更新方法

`fetch-contrib.js` が GitHub GraphQL API を叩き、`data/contributions.json` と `data/contributions.js` を生成します。

### 事前準備（必要な GitHub 権限）
- `.env` に `GITHUB_TOKEN=...` をセット（クラシック PAT 推奨）
  - 公開分のみ表示で十分: `read:user`
  - private repo 数も合算したい: `read:user` + `repo`
  - プロフィール設定で「Include private contributions…」をオンにしておくと、プライベート貢献も合算されます

### 実行

```bash
node fetch-contrib.js
```

生成されるファイル:
- `data/contributions.json`（HTML から fetch する用）
- `data/contributions.js`（`file://` 直開きでも読めるよう window.CONTRIB_DATA で埋め込み）

### コミット例

```bash
git add index.html data/contributions.json data/contributions.js
git commit -m "Update activity snapshot"
git push origin main
```

### 備考
- プライベート分をリアルタイム取得する API はないため、このスナップショットを push タイミングで更新する運用です。

---

## pre-commit で自動更新する場合

`githooks/pre-commit` を使うことで、コミット前に自動で `fetch-contrib.js` を実行し、生成物を add するようにできます。

1. 実行権限を付与  
   ```bash
   chmod +x githooks/pre-commit
   ```
2. hooks パスを設定（初回のみ）  
   ```bash
   git config core.hooksPath githooks
   ```
3. `.env` に `GITHUB_TOKEN=...` を用意（private repo 数も含めるなら `repo` スコープ）  
   - トークンが無い/Node が無い場合はフック内でスキップします。

以後、`git commit ...` 時に自動で contributions が更新され、`data/contributions.{json,js}` が add されます。

---

## 現状と拡張メモ
- 現状: 単一の `index.html` で構成した静的ポートフォリオ。GitHub Activity/リポジトリ数は push 時に取得したスナップショットを表示。
- 公開範囲: 本リポジトリ配下のファイルはすべて公開（private数・貢献数も数値で表示）。秘密情報は含めない運用を徹底。
- 拡張アイデア（任意）:
  - Works のカードを増やす／順序の入れ替え
  - Skills を具体的なツール・言語で補足
  - 画像アセット（アイコン、背景）を `assets/` に追加してビジュアルを強化
  - 将来的に React/Vite などへ移行し、ビルド成果物のみをこのリポジトリに配置する運用

---

## 今後の拡張メモ（任意）

- `Works / Projects` セクションに、代表的な GitHub リポジトリやプロダクトを追加
- `Skills` に具体的な言語・フレームワークを追記
- 必要に応じて
  - アイコン画像やヘッダー画像を `assets/` ディレクトリに追加し、`index.html` から参照
  - 将来的に React / Vite / SSG などに移行し、そのビルド成果物だけをこのリポジトリに配置する構成に変更
