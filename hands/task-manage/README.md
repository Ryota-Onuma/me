# task-manage

Kanban 風のタスク管理アプリの最小実装です。vibe-kanban を参考にしつつ、
- フロントエンド: 日本語 UI（静的 HTML/JS）
- バックエンド: Go（標準ライブラリのみ、JSON ファイルに永続化）

開発しやすさ重視のミニマム構成です。外部依存はありません。

## 構成

- `backend/`: Go 製 API サーバー（CORS 対応、静的ファイル配信）
- `web/`: 日本語 UI のシングルページ（ドラッグ＆ドロップ対応）
  - 2025-08: React + TypeScript（Vite）で再実装。ビルド成果物を配置します。
  - ソースは `frontend/` にあります（開発時は Vite を利用）。
- `data/`: 永続化データ
  - `tasks.json`: タスク
  - `profiles.json`: エージェントプロファイル
- `attempts.json`: 作業ブランチ
  - `executions/`: 実行インデックスとログ

## 起動方法

1. Go 1.25 を用意します。
2. サーバーを起動します。

   ```bash
   cd task-manage/backend
   go run .
   ```

3. ブラウザで `http://localhost:8888/` を開きます。

### React フロントエンドの開発/ビルド

UI は Vite（React + TypeScript）を使用しています。開発に Node 20 が必要です。

- 開発サーバー（API は `:8888` にプロキシ）

  ```bash
  cd task-manage/frontend
  npm install
  npm run dev
  ```

- ビルド（成果物は `task-manage/web/` に出力され、Go サーバーが配信）

  ```bash
  cd task-manage/frontend
  npm run build
  ```

### mise での利用（ローカル最小）

`task-manage/mise.toml` はローカル用に最小化しています。使うのは次の3つだけです。

- 同時起動: `cd task-manage && mise run dev`
- Lint: `mise run lint`（Go: vet、Frontend: ESLint）
- フォーマット: `mise run fmt`（Go: go fmt、Frontend: Prettier）

Node と Go は mise の tools（go=1.25, node=20）で固定しています。初回は必要に応じて `mise install` を実行してください。

## API 概要（主要）

- `GET    /api/tasks` … 全タスク取得
- `POST   /api/tasks` … タスク作成 `{ title, description?, status? }`
- `PATCH  /api/tasks/{id}` … タスク更新（タイトル、説明、ステータス）
- `DELETE /api/tasks/{id}` … タスク削除
- `POST   /api/tasks/{id}/move` … 並び替え＆列移動 `{ to_status, to_index }`

### エージェント実行

- `GET    /api/profiles` … 利用可能なエージェント一覧（claude-code, cursor, codex）
- `POST   /api/executions` … 実行開始 `{ profile, prompt, cwd? }`
- `GET    /api/executions/{id}` … 実行の状態とログ（スナップショット）
- `GET    /api/executions/{id}/stream` … SSE ストリーム（stdout/stderr/status）
- `POST   /api/executions/{id}/kill` … 実行停止

補足:

- 「エージェントを実行」モーダルで、対象試行に紐づくタスクの「説明」欄がプロンプトの初期値として自動入力されます（空欄の場合のみ）。
- 同モーダルの「履歴」タブから、
  - 実行中のプロセスには「再接続」でログ表示を再開できます。
  - 過去の実行は「再開」で当時のプロフィール・プロンプト・ディレクトリ（および可能なら attempt_id）を読み込み、設定した上で手動で「実行」できます。

### プロファイル設定

- `PUT    /api/profiles` … プロファイル一括保存（配列）
  - 例: `[{"label":"claude-code","command":["npx","-y","@anthropic-ai/claude-code@latest"]}]`

UI 上部の「設定」で JSON を直接編集・保存できます。

### 作業ブランチ（Attempts） — git worktree 採用

- `GET    /api/attempts?task_id=...` … タスクに紐づく作業ブランチ一覧
- `POST   /api/attempts` … 作業ブランチの作成（git worktree を生成）
  - 本文: `{ task_id, repo_path, base_branch, branch }`
  - 備考: Attempt 作成ではエージェントは指定しません（実行時に選択）
  - `GET    /api/attempts/{id}` … 作業ブランチ情報の取得
  - `POST   /api/attempts/{id}/pr` … PR 作成（`gh` CLI 使用）
    - 本文: `{ title?, body?, base_branch? }`
    - ボディ未指定時は `PULL_REQUEST_TEMPLATE.md` を優先適用（`.github/`, ルート, `docs/` を順に探索）。無ければ最小テンプレを使用。
  - `GET    /api/attempts/{id}/status` … ブランチ状態の取得（worktree の `HEAD` 基準で behind/ahead/未コミットを判定）
  - `POST   /api/attempts/{id}/push` … origin に push（upstream 未設定なら `-u` 付き）
  - `POST   /api/attempts/{id}/difit` … difitビューワを起動（ブラウザが自動で開きます）
    - クエリ: `worktree=1` で未コミットも含める、`remote=origin` で `origin/base` と比較、`no_open=1` でブラウザを開かない
  - `GET    /api/attempts/{id}/worktree/status` … { path, exists, branch, locked }
  - `POST   /api/attempts/{id}/worktree/remove?keep_branch=1` … worktree削除（ブランチ保持/削除選択）
  - `POST   /api/attempts/{id}/worktree/recreate` … worktree再作成
  - `POST   /api/attempts/{id}/lock` … { locked } を切替
  - `POST   /api/attempts/gc` … 各リポジトリで `git worktree prune`

Attempt には `worktree_path` が含まれ、エージェント実行の既定カレントディレクトリとして使用します。実行時に `attempt_id` を指定すると、その Attempt にログが紐づきます。

ステータスは `todo`（未着手）、`doing`（進行中）、`done`（完了）を使用します。

## メモ

- ファイル永続化のため、実運用では SQLite などに置き換え可能です。
- サーバーは同 origin で `web/` を配信するため CORS はゆるく設定しています。
- 作業ブランチとPR作成には `git` と `gh` CLI が必要です。`origin` リモートが設定済であること、`gh auth login` 済であることを前提としています。
- 新規ブランチは `feature/` プレフィックスで作成されます（例: `feature/abcd1234-20250101-120000`）。push タイミングは UI の Push ボタンで明示的に行います。
### difit の前提インストール

- 前提: `difit` が PATH にあること（推奨: `npm i -g difit` もしくは `mise run install.difit`）。
- 以降は npx を使わずローカルバイナリのみを起動（オフライン可）。
- UI からは Diff モーダルの「difitで開く」ボタンで起動できます。

### 旧データの移行（attempts.profile → 実行履歴）

- `POST /api/admin/migrate_attempts` で、古い `data/attempts.json` に残る `profile` を「ダミー実行履歴」として復元します。
