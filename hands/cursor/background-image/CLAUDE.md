# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

VS Code/Cursor用の背景画像拡張機能。システムファイルを改変せず、公式APIのみでWebViewベースの安全な背景画像表示を実現。

**重要**: この拡張は個人ローカル使用限定。マーケットプレイス公開は禁止。

## 開発コマンド

### 基本開発フロー
```bash
npm install      # 初回セットアップ
npm run compile  # TypeScriptコンパイル
npm run watch    # 開発時のファイル監視
npm run lint     # ESLint実行
npm test         # テスト実行
```

### パッケージング
```bash
npm run package  # VSIX生成（ローカル配布用）
```

### mise使用時（推奨）
```bash
mise run build   # コンパイル
mise run test    # テスト
mise run package # パッケージング
```

### デバッグ
- VS CodeでF5キー → Extension Development Host起動

## アーキテクチャ

### 主要ファイル構成
- `src/extension.ts` - エントリーポイント、コマンド登録
- `src/webviewProvider.ts` - メインのWebViewプロバイダー
- `src/backgroundManager.ts` - 背景画像管理ロジック
- `src/configManager.ts` - VS Code設定管理
- `src/unsafeWorkbenchPatcher.ts` - Unsafe Mode（ワークベンチ直接改変）
- `src/utils/` - セキュリティバリデーション、CSS生成等

### TypeScript設定
- Target: ES2020、CommonJS、strict mode
- コンパイル出力: `out/` ディレクトリ

## セキュリティ制約（必須遵守）

### プロトコル制限
- `file://` と `data:` のみ許可
- HTTP/HTTPS等は禁止

### コード制約
- `eval`, `new Function` 等の動的実行禁止
- 外部ネットワーク通信禁止
- パストラバーサル防止必須

### 公開防止
- `scripts/publish-guard.js` が公開を自動ブロック
- `package.json` の `private: true` 必須

## タスク完了時チェックリスト

1. `npm run lint` - ESLintエラーなし
2. `npm run compile` - コンパイル成功
3. `npm test` - テスト通過
4. セキュリティ制約遵守確認
5. F5でExtension Development Host動作確認