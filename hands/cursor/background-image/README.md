# Background Image (Unsafe Mode Only) — ワークベンチ直接改変

VS Code/Cursor の内部CSS を直接改変してワークベンチ全体に背景画像を適用する拡張です。

⚠️ **重要な制約とリスク**
- **配布・公開は禁止**。個人のローカル環境でのみ使用してください
- VS Code/Cursor の内部ファイル（CSS）を直接書き換えます
- アップデートや整合性チェックで破綻・警告が表示される可能性があります
- 再起動やアップデート時に設定が消える場合があります

## 機能

- ワークベンチ全体への背景画像適用（CSS直接改変）
- ローカル画像の選択（`file://` または `data:` のみ）
- 透明度・サイズ・位置の調整
- HTTP/HTTPS画像の指定も可能（URLまたはローカル埋め込み）
- 適用・除去の安全な操作

## コマンド

- `Background Image (Unsafe): Set Unsafe Background Image`（`backgroundImage.unsafe.setImage`）
- `Background Image (Unsafe): Apply Unsafe Background`（`backgroundImage.unsafe.apply`）
- `Background Image (Unsafe): Remove Unsafe Background`（`backgroundImage.unsafe.remove`）
- `Background Image (Unsafe): Open Workbench CSS Path`（`backgroundImage.unsafe.openCssPath`）

## 使用手順

1. Settings で `backgroundImage.unsafe.image` に画像パスを設定、または
2. コマンド「Set Unsafe Background Image」で画像を選択
3. コマンド「Apply Unsafe Background」を実行
4. 初回は警告ダイアログで「同意して続行」を選択
5. VS Code を再起動すると背景画像がワークベンチ全体に表示
6. 除去する場合は「Remove Unsafe Background」を実行後、再起動

## 設定

- `backgroundImage.unsafe.enabled`: Unsafe モード有効化（既定 false）
- `backgroundImage.unsafe.image`: Unsafe モード用画像パス（`file://` または `data:` のみ）
- `backgroundImage.unsafe.opacity`: 透明度（0〜1、既定 0.12）
- `backgroundImage.unsafe.size`: サイズ（`cover` | `contain` | `auto`、既定 `cover`）
- `backgroundImage.unsafe.position`: 位置（既定 `center`）
- `backgroundImage.unsafe.repeat`: リピート（既定 `no-repeat`）
- `backgroundImage.unsafe.workbenchCssPath`: CSS パス手動指定（自動検出失敗時）
- `backgroundImage.unsafe.embedImage`: data: URL 埋め込み（既定 true）
- `backgroundImage.unsafe.suppressBannerAfterRemove`: 除去後の警告表示を抑制（既定 true）

## 設定例（settings.json）

Unsafe Mode（ワークベンチ全体背景）
```jsonc
{
  "backgroundImage.unsafe.enabled": true,
  "backgroundImage.unsafe.image": "file:///Users/yourname/Pictures/wallpapers/bg.jpg",
  "backgroundImage.unsafe.opacity": 0.12,
  "backgroundImage.unsafe.size": "cover",
  "backgroundImage.unsafe.position": "center",
  "backgroundImage.unsafe.embedImage": true
}
```

Windows の場合
```jsonc
{
  "backgroundImage.unsafe.enabled": true,
  "backgroundImage.unsafe.image": "file:///C:/Users/yourname/Pictures/wallpapers/bg.jpg",
  "backgroundImage.unsafe.opacity": 0.12,
  "backgroundImage.unsafe.size": "cover",
  "backgroundImage.unsafe.position": "center"
}
```

data:URL を使う場合
```jsonc
{
  "backgroundImage.unsafe.enabled": true,
  "backgroundImage.unsafe.image": "data:image/png;base64,iVBORw0KGgoAAA...",
  "backgroundImage.unsafe.opacity": 0.1,
  "backgroundImage.unsafe.size": "cover",
  "backgroundImage.unsafe.position": "center"
}
```

## セキュリティ制約

- 許可プロトコルは `file://` と `data:` のみ（設定上）
- URL入力時は `http://`、`https://` も受け入れ（ローカル使用前提）
- パストラバーサル（`../`, `..\\`）防止
- 画像拡張子ホワイトリスト（jpg/jpeg/png/gif/webp/bmp/svg）

## インストール

1) VSIX から（推奨）
- `npm run package` で `background-image-*.vsix` を生成
- VS Code/Cursor: Extensions → メニュー「Install from VSIX...」

2) デバッグ実行
- このフォルダを開き、`F5` で Extension Development Host 起動

## ビルド/テスト

- `npm install`
- `npm run compile`
- `npm test`
- `npm run package`

mise を使う場合:

- `mise run build`
- `mise run test`
- `mise run package`

## トラブルシューティング

### CSS ファイルが見つからない
- 「Open Workbench CSS Path」コマンドで自動検出を試行
- 失敗する場合は `backgroundImage.unsafe.workbenchCssPath` に手動でパスを設定

### 適用後に警告が表示される
- VS Code/Cursor の整合性チェックが働いている
- `suppressBannerAfterRemove` 設定で警告を抑制可能

### ファイル権限エラー
- macOS: Cursor を管理者権限で実行
- Windows: VS Code を管理者として実行
- Linux: sudo でファイル権限を変更

## 注意事項

- 本拡張は**ローカル使用専用**です
- マーケットプレイスへの公開は禁止されています
- VS Code/Cursor のアップデート時に設定が失われる可能性があります
- システムファイルを改変するため自己責任でご利用ください

## ライセンス

本リポジトリの `LICENSE` を参照してください。