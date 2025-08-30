Ubiquitous Language / ユビキタス言語（task-manage）

本プロジェクトで用いる主要な用語を日英併記で定義します（開発者・ユーザー間の共通語彙）。

## Core Entities / コアエンティティ

| 用語 | 英語 | 説明 | English Description |
|------|------|------|-------------------|
| Task | タスク | 作業単位（カンバンで管理する項目）。状態は `todo` / `doing` / `done`。`order` は同一ステータス内における並び順（小さいほど上） | A unit of work tracked on the Kanban board. Status in {todo, doing, done}. `order` defines in-column ordering (smaller first) |
| Attempt | 作業ブランチ | タスクに紐づく開発用ブランチ。指定ベースから作成し、エージェント実行やPRに結びつく | A bounded try for a Task, tied to a Git branch created from a base branch; can own executions and a PR |
| Execution (Process) | 実行（プロセス） | エージェントを任意プロンプトで1回走らせた記録。ログを逐次SSE配信 | A single agent run with a prompt; logs are streamed via SSE |
| Profile | プロファイル | エージェント起動コマンドなどの実行設定。`profiles.json` に保存 | Agent launch configuration (CLI + flags), persisted in profiles.json |

## Git, Branch, PR / Git・ブランチ・PR

| 用語 | 英語 | 説明 | English Description |
|------|------|------|-------------------|
| Repository | リポジトリ | ローカルGit作業ディレクトリ | Local Git worktree path |
| Base Branch | ベースブランチ | 作業ブランチの起点（タスクごとに必ず指定） | Branch from which an Attempt's feature branch is created; required per task |
| Feature Branch | フィーチャーブランチ | 作業ブランチとして新規作成するブランチ。`feature/` 始まり | Newly created branch for an Attempt, always prefixed with `feature/` |
| Push | プッシュ | ブランチを `origin` へ送信（UIのPushボタンで明示実行） | Send the branch to origin, invoked explicitly from the UI |
| Pull Request (PR) | プルリクエスト | 試行ブランチをベースブランチへ統合する提案。`gh` CLIで作成 | Proposal to merge the Attempt branch into the base branch; created via gh CLI |
| Merge | マージ | PRの取り込み（もしくは直接マージ） | Integration of the branch into the base (usually via PR merge) |
| Branch Status | ブランチ状態 | ローカルでの ahead/behind（ベース比較）、リモートでの ahead/behind（origin比較）、未コミット変更の有無 | Local ahead/behind vs base, remote ahead/behind vs origin, and uncommitted changes |
| Commits Ahead | 先行コミット数 | ベースやリモートに対して「進んでいる」コミット数 | Commits present only on the compared branch (ahead) |
| Commits Behind | 遅れ（behind）コミット数 | ベースやリモートに対して「遅れている」コミット数 | Commits missing locally but present on base/remote (behind) |

## Agent and Logs / エージェントとログ

| 用語 | 英語 | 説明 | English Description |
|------|------|------|-------------------|
| Coding Agent | コーディングエージェント | 外部CLI型の開発支援エージェント（Claude Code, Cursor CLI, Codex CLI など） | External CLI-based coding agents (Claude Code, Cursor CLI, Codex CLI) |
| Prompt | プロンプト | エージェントに与える作業指示文 | Instruction text passed to an agent execution |
| Log | ログ | 実行の標準出力・標準エラーの記録 | Recorded stdout/stderr of an execution |
| SSE (Server-Sent Events) | サーバー送信イベント | 実行ログや状態をクライアントへ逐次配信する機構 | Streaming channel used to push logs/state to the UI |

## UI and Workflow / UIとワークフロー

| 用語 | 英語 | 説明 | English Description |
|------|------|------|-------------------|
| Kanban Board | カンバンボード | タスクを状態列で可視化するUI | UI that visualizes tasks by status columns |
| Column | 列 | `未着手(todo)`・`進行中(doing)`・`完了(done)` の3列 | Three columns: todo, doing, done |
| Drag and Drop (DnD) | ドラッグ＆ドロップ | タスクの列移動や並び替え操作 | Reordering and moving tasks across columns |
| Agent Run Button | エージェント実行ボタン | プロンプトとプロファイルを選び、実行・停止・ログ閲覧・PR作成を操作 | UI entry to run/stop an agent and view logs or create a PR |
| Push Button | Pushボタン | 作業ブランチを明示的に `origin` へPush | Explicitly pushes the Attempt branch to origin |
| Task Details Drawer | タスク詳細ドロワー | 右側ペインでタスク情報・作業ブランチ・ブランチ状態・操作を集約 | Right-side drawer aggregating task info, attempts, branch status, and actions |

## Configuration and Persistence / 設定と永続化

| 用語 | 英語 | 説明 | English Description |
|------|------|------|-------------------|
| Profiles JSON | プロファイル設定 | `data/profiles.json` に保存されるエージェント設定配列 | List of agent profiles stored in `data/profiles.json` |
| Tasks JSON | タスク保存 | `data/tasks.json` にタスクを保存 | Tasks persisted in `data/tasks.json` |
| Attempts JSON | 作業ブランチ保存 | `data/attempts.json` に作業ブランチ情報を保存 | Attempts persisted in `data/attempts.json` |
| Executions Store | 実行保管 | `data/executions/` に実行メタ（index.json）とログ（*.jsonl）を保存 | Executions metadata and logs stored under `data/executions/` |
| ID | 識別子 | 時間ベース+ランダムの可読ID（例: `YYYYMMDDhhmmss-xxxxxx`） | K-sortable-like ID composed of timestamp and random suffix |

## Invariants / 不変条件（重要）

| 不変条件 | English Invariant |
|----------|------------------|
| 作業ブランチごとにベースブランチ指定は必須 | Base branch is required per Attempt |
| 新規作業ブランチは常に `feature/` 始まり | New Attempt branch prefix |
| PushはUI操作で明示的に行う（自動Pushしない） | Push is explicit |
| 実行は作業ブランチに関連付け可能（attempt_id指定） | Executions can bind to Attempts |
| `todo < doing < done` をグローバルソート規則として用いる | Global sort ranks statuses as todo < doing < done |
