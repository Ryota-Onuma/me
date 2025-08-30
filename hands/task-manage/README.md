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
  - `attempts.json`: 試行
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

### mise での利用（おすすめ）

`task-manage/mise.toml` を用意しています。mise を導入済みなら以下のコマンドが使えます。

- サーバー起動: `cd task-manage && mise run dev`
- サーバー起動して自動でブラウザを開く: `mise run dev.open`
- 競合ポート(:8888)がある場合に強制開放して起動: `DEV_KILL=1 mise run dev.open`
- サーバー停止(:8888 を解放): `mise run dev.stop`
- 停止してから再起動: `mise run dev.restart`
- UIを開く: `mise run open`
- タスク作成: `mise run task:create TITLE="タイトル" DESC="説明"`
- 試行作成: `mise run attempt:new TASK=task_id PROFILE=claude-code REPO=/path/to/repo BASE=main`
- 試行のPush: `mise run attempt:push ID=attempt_id`
- ブランチ状態: `mise run attempt:status ID=attempt_id`
- PR作成: `mise run attempt:pr ID=attempt_id TITLE="PRタイトル"`
- 実行開始(API): `mise run exec:start PROFILE=claude-code PROMPT="..." [CWD=/repo] [ATTEMPT=attempt_id]`
- 実行ログSSE: `mise run exec:stream ID=execution_id`
- プロファイル編集: `mise run profiles:edit`
- フォーマット: `mise run fmt`（Go+Web+Frontend）
- Lint: `mise run lint`（go vet + prettier check）
- ビルド: `mise run build`
- テスト: `mise run test`
- チェック一括: `mise run check`

フロントエンド補助:

- 開発: `mise run web:dev`
- ビルド: `mise run web:build`

NodeやGoはmiseのtoolsでバージョン固定（go=1.25, node=20）しています。必要に応じて `mise install` を実行してください。
初回は `mise run setup:data` で `data/` 配下を作成しておくとスムーズです。

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

### プロファイル設定

- `PUT    /api/profiles` … プロファイル一括保存（配列）
  - 例: `[{"label":"claude-code","command":["npx","-y","@anthropic-ai/claude-code@latest"]}]`

UI 上部の「設定」で JSON を直接編集・保存できます。

### 試行（Attempts）

- `GET    /api/attempts?task_id=...` … タスクに紐づく試行一覧
- `POST   /api/attempts` … 試行作成とブランチ作成（pushは自動で行わない／UIから実行）
  - 本文: `{ task_id, profile, repo_path, base_branch }`
  - UIの既定値: base_branch は `main` を初期入力（ただしAPI上は必須）
  - `GET    /api/attempts/{id}` … 試行情報の取得
  - `POST   /api/attempts/{id}/pr` … PR 作成（`gh` CLI 使用）
    - 本文: `{ title?, body?, base_branch? }`
  - `GET    /api/attempts/{id}/status` … ブランチ状態の取得
    - 応答: `{ base_branch_name, commits_behind, commits_ahead, remote_commits_behind?, remote_commits_ahead?, has_uncommitted_changes }`
  - `POST   /api/attempts/{id}/push` … origin に push（upstream 未設定なら `-u` 付き）

実行開始時に `attempt_id` を指定すると、実行が試行に紐づきます。

ステータスは `todo`（未着手）、`doing`（進行中）、`done`（完了）を使用します。

## メモ

- ファイル永続化のため、実運用では SQLite などに置き換え可能です。
- サーバーは同 origin で `web/` を配信するため CORS はゆるく設定しています。
- 試行とPR作成には `git` と `gh` CLI が必要です。`origin` リモートが設定済であること、`gh auth login` 済であることを前提としています。
- 新規ブランチは `feature/` プレフィックスで作成されます（例: `feature/abcd1234-20250101-120000`）。push タイミングは UI の Push ボタンで明示的に行います。
