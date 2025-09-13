# Repository Guidelines

本書はこのリポジトリで開発に参加するための最小ガイドです。曖昧さを避け、短く具体的に記します。AGENTS.local.md が存在する場合はそちらを優先します。

## プロジェクト構成・モジュール
- `src/extension.ts`: エントリ。コマンド登録/活性化。
- `src/webviewProvider.ts`: WebView 提供・描画。
- `src/backgroundManager.ts`: 背景画像の状態管理。
- `src/configManager.ts`: 設定の取得/検証。
- `src/utils/`: `imageValidator.ts`/`pathSanitizer.ts`/`cssGenerator.ts` 等のユーティリティ。
- `src/unsafeWorkbenchPatcher.ts`: Unsafe モード（自己責任）。
- `src/test/suite/*.test.ts`: Mocha テスト。
- `media/` アイコン、`resources/` 追加リソース、`out/` ビルド成果物。

## ビルド・テスト・開発コマンド
- `npm install`: 依存取得。
- `npm run compile`: TypeScript コンパイル（`out/`）。
- `npm run watch`: 監視ビルド。
- `npm run lint`: ESLint 実行。
- `npm test`: VS Code 拡張テスト（Mocha）。
- `npm run package`: VSIX 生成（公開禁止のガード付き）。
- mise 利用例: `mise run build | test | package`。

## コーディング規約・命名
- 言語: TypeScript（`strict: true`）。ターゲット ES2020、CommonJS。
- インデント: 2 スペース。セミコロンあり。1 ファイル 1 責務（KISS）。
- 命名: クラス `PascalCase`、変数/関数 `camelCase`、ファイル `camelCase.ts`（例: `backgroundManager.ts`）。
- Lint: ESLint（`no-eval`/`no-implied-eval`/`no-new-func`、`console` は `console.error` のみ許容）。
- 依存: 不要追加を避ける。標準/既存依存で解決。

## テスト指針
- フレームワーク: Mocha + Node `assert`。
- 追加ロジックには最低 1 テストを同時追加。
- 配置: `src/test/suite/<対象>.test.ts`。
- 実行: `npm test`（事前に `npm run compile` 実行推奨）。

## コミット・PR ガイドライン
- コミット: Conventional Commits を推奨（例: `feat: add slideshow shuffle`）。
- PR には以下を含める:
  - 目的/背景、関連 Issue、変更点の要約
  - スクリーンショット/録画（UI 挙動がある場合）
  - 動作確認手順、影響範囲、リスク
  - チェックリスト: `npm run lint`/`npm run compile`/`npm test` OK、セキュリティ制約遵守

## セキュリティと公開
- 許可プロトコル: `file://` と `data:` のみ。HTTP/HTTPS 不可。
- 動的実行/外部ネットワーク禁止。パストラバーサル/未許可拡張子は拒否。
- これはローカル専用拡張。マーケットプレイス公開は禁止（`scripts/publish-guard.js`、`private: true`）。

