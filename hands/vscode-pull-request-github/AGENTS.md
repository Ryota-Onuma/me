# Repository Guidelines

## プロジェクト構成とモジュール整理
- `src/` は拡張本体の TypeScript ロジック。`src/github/` が GraphQL・REST クライアント、`src/view/` が VS Code ビュー、`src/test/` に Node/Electron テスト。
- `webviews/` は React ベースの Webview UI。スタイリングや共有フックは `webviews/common/` に集約。
- `resources/` は画像やロゴ、`common/` は拡張と Webview 双方で使うユーティリティ。
- ビルド成果物は `dist/`（生成物）と `out/`（テスト前処理）に生成されるため、手動編集は禁止。
- 設計メモや仕様は `documentation/` 配下に整理し、更新時は関連モジュールからリンクを張る。

## ビルド・テスト・開発コマンド
- `yarn install` 依存取得。Node 18 系互換を前提にロックファイルを尊重。
- `yarn compile` 開発ビルド、`yarn bundle` 本番ビルド。対象の `dist/` を再生成。
- `yarn watch` / `yarn watch:web` はホットリロード。UI 開発時は後者を推奨。
- `yarn test` は CLI テストエントリ、内部で `yarn test:preprocess` → `node out/src/test/runTests.js` を実行。
- ブラウザ向けは `yarn browsertest`、静的チェックは `yarn lint` と `yarn lint:browser` を両方通す。

## コーディングスタイルと命名規約
- TypeScript/TSX が標準。`tsfmt.json` 定義に従いタブインデント（4 幅、スペース禁止）。
- ESLint（`.eslintrc.js`・`.eslintrc.browser.json`）と `yarn hygiene` をフォーマット前提として実行。
- ファイル命名は機能ベースのケバブケース、クラスは PascalCase、内部関数・変数は camelCase。
- GraphQL 定義は `.gql` を `src/github/` に配置し、変更時は `yarn test:preprocess-gql` で同期。
- 定数は `constants.ts` へ、実験フラグは `src/experimentationService.ts` を経由する。

## テスト指針
- Mocha + @vscode/test-electron が既定。新規ロジックは最低 1 件の `*.test.ts` を `src/test/<領域>/` に追加。
- 既存リグレッションは `src/test/common/` のモックを再利用し、不要なネットワーク呼び出しを避ける。
- ブラウザ互換性は `src/test/browser/` に配置し、`yarn browsertest` を CI と同一条件で実行。
- 失敗再現には `npm config set script-shell "$(which zsh)"` で環境差異を抑制。
- カバレッジ閾値は公式に定義なし。クリティカルパスは 100% を目標とし、未達は PR で根拠を提示。

## コミット・Pull Request ガイドライン
- コミットメッセージは命令形 + 簡潔説明 + `(#issue)`。例: `Fix empty state in IssueOverview (#7800)`。
- 複数変更は `git rebase -i` で論理単位へ分割。フォーマット後に `yarn lint && yarn test` をローカルで完了させる。
- PR 説明は「概要」「検証手順」「影響範囲」を明記し、関連 Issue を `Fixes #` でリンク。
- UI 変更は `webviews/` スクリーンショットまたは Loom を添付。設定追加は `package.nls.json` も更新。
- レビュワーが追跡しやすいよう、Draft では TODO をチェックリスト化し、完了後 Ready for Review に変更。

## 自動レビュー支援
- コマンド `pr.runAutomatedReview` で Codex CLI / Claude Code を用いたレビュープロセスを起動。PR ビューのコンテキストメニューとコマンドパレットから実行可能。
- 既定プロバイダや CLI パスは `githubPullRequests.reviewAssistant.*` 設定で管理 (`defaultProvider`, `promptForProvider`, `codex/claude.command`, `codex/claude.args`)。
- 出力は「PR Automated Review」出力チャネルに集約。CLI が非ゼロ終了した場合はチャンネルログと CLI 標準エラーを確認する。

## セキュリティと構成メモ
- 機密情報は OS 資格情報ストアで取得。`.env` や平文キーの追加は禁止。
- 脆弱性報告は `SECURITY.md` のフローに従い GitHub セキュリティポータルから送付。
- GitHub Enterprise 連携を検証する際は、テスト用ホストを `src/env/enterprise.json` に仮登録し、実データは投入しない。
