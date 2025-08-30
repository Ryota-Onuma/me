Ubiquitous Language / ユビキタス言語（task-manage）

本プロジェクトで用いる主要な用語を日英併記で定義します（開発者・ユーザー間の共通語彙）。

Core Entities / コアエンティティ
- Task / タスク: 作業単位（カンバンで管理する項目）。状態は `todo` / `doing` / `done`。EN: A unit of work tracked on the Kanban board with status lifecycle.
- Attempt / 試行: あるタスクに紐づく作業トライ。指定されたベースブランチから作る機能用ブランチ上で行い、エージェント実行やPRに結びつく。EN: A bounded try for a Task, tied to a Git branch created from a base branch; can own executions and a PR.
- Execution (Process) / 実行（プロセス）: エージェントを任意プロンプトで1回走らせた記録。ログを逐次SSE配信。EN: A single agent run with a prompt; logs are streamed via SSE.
- Profile / プロファイル: エージェント起動コマンドなどの実行設定。`profiles.json` に保存。EN: Agent launch configuration (CLI + flags), persisted in profiles.json.

Git, Branch, PR / Git・ブランチ・PR
- Repository / リポジトリ: ローカルGit作業ディレクトリ。EN: Local Git worktree path.
- Base Branch / ベースブランチ: 試行の起点ブランチ（タスクごとに必ず指定）。EN: Branch from which an Attempt’s feature branch is created; required per task.
- Feature Branch / フィーチャーブランチ: 試行で新規作成するブランチ。`feature/` で始まる命名規則。EN: Newly created branch for an Attempt, always prefixed with `feature/`.
- Push / プッシュ: ブランチを `origin` へ送信（UIのPushボタンで明示実行）。EN: Send the branch to origin, invoked explicitly from the UI.
- Pull Request (PR) / プルリクエスト: 試行ブランチをベースブランチへ統合する提案。`gh` CLIで作成。EN: Proposal to merge the Attempt branch into the base branch; created via gh CLI.
- Merge / マージ: PRの取り込み（もしくは直接マージ）。EN: Integration of the branch into the base (usually via PR merge).
- Branch Status / ブランチ状態: ローカルでの ahead/behind（ベース比較）、リモートでの ahead/behind（origin比較）、未コミット変更の有無。EN: Local ahead/behind vs base, remote ahead/behind vs origin, and uncommitted changes.
- Commits Ahead / 先行コミット数: ベースやリモートに対して「進んでいる」コミット数。EN: Commits present only on the compared branch (ahead).
- Commits Behind / 遅れ（behind）コミット数: ベースやリモートに対して「遅れている」コミット数。EN: Commits missing locally but present on base/remote (behind).

Agent and Logs / エージェントとログ
- Coding Agent / コーディングエージェント: 外部CLI型の開発支援エージェント（Claude Code, Cursor CLI, Codex CLI など）。EN: External CLI-based coding agents (Claude Code, Cursor CLI, Codex CLI).
- Prompt / プロンプト: エージェントに与える作業指示文。EN: Instruction text passed to an agent execution.
- Log / ログ: 実行の標準出力・標準エラーの記録。EN: Recorded stdout/stderr of an execution.
- SSE (Server-Sent Events) / サーバー送信イベント: 実行ログや状態をクライアントへ逐次配信する機構。EN: Streaming channel used to push logs/state to the UI.

UI and Workflow / UIとワークフロー
- Kanban Board / カンバンボード: タスクを状態列で可視化するUI。EN: UI that visualizes tasks by status columns.
- Column / 列: `未着手(todo)`・`進行中(doing)`・`完了(done)` の3列。EN: Three columns: todo, doing, done.
- Drag and Drop (DnD) / ドラッグ＆ドロップ: タスクの列移動や並び替え操作。EN: Reordering and moving tasks across columns.
- Agent Run Button / エージェント実行ボタン: プロンプトとプロファイルを選び、実行・停止・ログ閲覧・PR作成を操作。EN: UI entry to run/stop an agent and view logs or create a PR.
- Push Button / Pushボタン: 試行ブランチを明示的に `origin` へPush。EN: Explicitly pushes the Attempt branch to origin.

Configuration and Persistence / 設定と永続化
- Profiles JSON / プロファイル設定: `data/profiles.json` に保存されるエージェント設定配列。EN: List of agent profiles stored in `data/profiles.json`.
- Tasks JSON / タスク保存: `data/tasks.json` にタスクを保存。EN: Tasks persisted in `data/tasks.json`.
- Attempts JSON / 試行保存: `data/attempts.json` に試行を保存。EN: Attempts persisted in `data/attempts.json`.
- Executions Store / 実行保管: `data/executions/` に実行メタ（index.json）とログ（*.jsonl）を保存。EN: Executions metadata and logs stored under `data/executions/`.
- ID / 識別子: 時間ベース+ランダムの可読ID（例: `YYYYMMDDhhmmss-xxxxxx`）。EN: K-sortable-like ID composed of timestamp and random suffix.

Invariants / 不変条件（重要）
- Base branch is required per Attempt / 試行ごとにベースブランチ指定は必須。
- New Attempt branch prefix / 新規試行のブランチは常に `feature/` 始まり。
- Push is explicit / PushはUI操作で明示的に行う（自動Pushしない）。
- Executions can bind to Attempts / 実行は試行に関連付け可能（attempt_id指定）。
