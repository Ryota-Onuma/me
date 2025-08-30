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

### 作業ブランチ（Attempts）

- `GET    /api/attempts?task_id=...` … タスクに紐づく作業ブランチ一覧
- `POST   /api/attempts` … 作業ブランチの作成（pushは自動で行わない／UIから実行）
  - 本文: `{ task_id, profile, repo_path, base_branch }`
  - UIの既定値: base_branch は `main` を初期入力（ただしAPI上は必須）
  - `GET    /api/attempts/{id}` … 作業ブランチ情報の取得
  - `POST   /api/attempts/{id}/pr` … PR 作成（`gh` CLI 使用）
    - 本文: `{ title?, body?, base_branch? }`
  - `GET    /api/attempts/{id}/status` … ブランチ状態の取得
    - 応答: `{ base_branch_name, commits_behind, commits_ahead, remote_commits_behind?, remote_commits_ahead?, has_uncommitted_changes }`
  - `POST   /api/attempts/{id}/push` … origin に push（upstream 未設定なら `-u` 付き）

実行開始時に `attempt_id` を指定すると、実行が作業ブランチに紐づきます。

ステータスは `todo`（未着手）、`doing`（進行中）、`done`（完了）を使用します。

## メモ

- ファイル永続化のため、実運用では SQLite などに置き換え可能です。
- サーバーは同 origin で `web/` を配信するため CORS はゆるく設定しています。
- 作業ブランチとPR作成には `git` と `gh` CLI が必要です。`origin` リモートが設定済であること、`gh auth login` 済であることを前提としています。
- 新規ブランチは `feature/` プレフィックスで作成されます（例: `feature/abcd1234-20250101-120000`）。push タイミングは UI の Push ボタンで明示的に行います。
