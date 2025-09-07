# Repository Guidelines

本ドキュメントは、このリポジトリの貢献者向けガイドです。短く、具体的に、再現可能に作業してください。

## Project Structure & Module Organization

- `src/app/` Next.js App Router（UI, pages, API 入口）
- `src/server/` Hono ベースのサーバ層（`hono/`, `service/`）
- `src/lib/` 共通ユーティリティと Zod スキーマ（会話スキーマ群）
- `src/components/ui/` 再利用 UI（shadcn パターン）
- `docs/` 開発ドキュメント、`scripts/` ビルド/リリース補助
- `dist/` ビルド成果物（手編集禁止）、`.next/` は一時生成物

## Build, Test, and Development Commands

- `pnpm dev` 開発サーバ起動（Turbopack, PORT=3400）
- `pnpm typecheck` TypeScript 型検査（noEmit）
- `pnpm lint` Biome による整形/静的解析（チェック）
- `pnpm fix` Biome の自動修正（書き換え含む）
- `pnpm test` / `pnpm test:watch` Vitest 実行
- `pnpm build` Next.js standalone ビルド（`dist/standalone` 生成）
- `pnpm start` CLI エントリ `dist/index.js` を起動

Node: `>= 20.12.0`、Package Manager: `pnpm@10.x` を使用。

## Coding Style & Naming Conventions

- フォーマッタ/リンタ: Biome（ESLint/Prettier 不要）
- 文字列はダブルクォート、インデントはスペース2、TS は strictest 設定
- React コンポーネント: `PascalCase.tsx`、フック: `useCamelCase.ts`
- サービス/ユーティリティ: `camelCase.ts`、定数: `SCREAMING_SNAKE_CASE`
- 生成物（`dist/`, `.next/`）は手修正しないこと

## Testing Guidelines

- テスト: Vitest。配置は隣接 `*.test.ts(x)` または `__tests__/` を推奨
- 主要ロジック（パーサ、イベント、サービス）は単体テスト必須
- モックで I/O を隔離し、副作用は明示
- 目標: 変更箇所に対する実質カバレッジの確保（数値ゲート未設定）

## Commit & Pull Request Guidelines

- コミット: Conventional Commits（例: `feat: …`, `fix: …`, `chore: …`）
- PR には概要・動機・変更点・確認方法を簡潔に記載
- UI 変更はスクリーンショット/録画を添付、関連 Issue をリンク
- CI/ビルドが通り、`pnpm lint && pnpm typecheck && pnpm test` を事前実行

## Security & Configuration Tips

- 環境変数: `PORT`（既定 3400）。秘密情報はコミットしない
- データ参照: `~/.claude/projects/`（読み取りのみ）。パスは設定で切替不可想定

## Agent-Specific Instructions

- 既存方針を尊重: KISS/SOLID、不要な依存追加禁止、変更は最小
- 参照/検索は `rg` を優先。編集は `apply_patch` を使用
- 追加後は `pnpm fix` → `pnpm build` の順で検証（可能な範囲で）

