# Background Image — 安全な背景画像プレビュー（WebView）

VS Code/Cursor のシステムファイルを一切改変せず、公式 API だけで背景画像を安全に扱う拡張です。描画は拡張の WebView 上で行われ、メインのワークベンチや CSS/JS には触れません。

## 機能

- ローカル画像の選択（`file://` または `data:` のみ）
- 透明度・サイズ・位置の調整
- Activity Bar の「Background Image」ビューで即時プレビュー
- フルプレビュー（エディタ領域のパネルに最大化表示）
- スライドショー（複数画像のローテーション）
- 完全サンドボックス（CSP適用・外部ネットワーク未使用）

## コマンド

- `Background Image: Set Background Image`（`backgroundImage.setImage`）
- `Background Image: Remove Background`（`backgroundImage.removeImage`）
- `Background Image: Background Settings`（`backgroundImage.openSettings`）
- `Background Image: Open Full Preview`（`backgroundImage.openPreviewPanel`）
- `Background Image: Toggle Slideshow`（`backgroundImage.toggleSlideshow`）

### 🚨 Unsafe Mode（ローカル限定・自己責任）

バージョン 1.0.7 から、**ローカル限定**でワークベンチ全体に背景画像を適用する「unsafe モード」が利用可能です。

⚠️ **重要な制約とリスク**
- **配布・公開は禁止**。個人のローカル環境でのみ使用してください
- VS Code/Cursor の内部ファイル（CSS）を直接書き換えます
- アップデートや整合性チェックで破綻・警告が表示される可能性があります
- 再起動やアップデート時に設定が消える場合があります

#### Unsafe Mode コマンド

- `Background Image (Unsafe): Apply Unsafe Background`（`backgroundImage.unsafe.apply`）
- `Background Image (Unsafe): Remove Unsafe Background`（`backgroundImage.unsafe.remove`）
- `Background Image (Unsafe): Open Workbench CSS Path`（`backgroundImage.unsafe.openCssPath`）

#### 使用手順

1. Settings で `backgroundImage.unsafe.image` に画像パスを設定
2. コマンド「Apply Unsafe Background」を実行
3. 初回は警告ダイアログで「同意して続行」を選択
4. VS Code を再起動すると背景画像がワークベンチ全体に表示
5. 除去する場合は「Remove Unsafe Background」を実行後、再起動

## 設定

- `backgroundImage.imagePath`: 画像パス（`file://` か `data:` のみ）
- `backgroundImage.opacity`: 0〜0.8（既定 0.1）
- `backgroundImage.size`: `cover` | `contain` | `auto`（既定 `cover`）
- `backgroundImage.position`: CSS background-position（既定 `center`）
- `backgroundImage.slideshow.enabled`: スライドショーON/OFF（既定 false）
- `backgroundImage.slideshow.images`: 画像リスト（`file://` または `data:` のみ）
- `backgroundImage.slideshow.interval`: 画像切替間隔（秒、3〜3600、既定30）
- `backgroundImage.slideshow.shuffle`: シャッフル（既定 false）

### Unsafe Mode 設定

- `backgroundImage.unsafe.enabled`: Unsafe モード有効化（既定 false）
- `backgroundImage.unsafe.image`: Unsafe モード用画像パス（`file://` または `data:` のみ）
- `backgroundImage.unsafe.opacity`: 透明度（0〜1、既定 0.12）
- `backgroundImage.unsafe.size`: サイズ（`cover` | `contain` | `auto`、既定 `cover`）
- `backgroundImage.unsafe.position`: 位置（既定 `center`）
- `backgroundImage.unsafe.repeat`: リピート（既定 `no-repeat`）
- `backgroundImage.unsafe.workbenchCssPath`: CSS パス手動指定（自動検出失敗時）
- `backgroundImage.unsafe.embedImage`: data: URL 埋め込み（既定 true）

### 設定例（settings.json）

macOS / Linux（ユーザー設定）
```jsonc
{
  "backgroundImage.imagePath": "file:///Users/yourname/Pictures/wallpapers/forest.jpg",
  "backgroundImage.opacity": 0.12,
  "backgroundImage.size": "cover",
  "backgroundImage.position": "center"
}
```

Windows（ユーザー設定）
```jsonc
{
  "backgroundImage.imagePath": "file:///C:/Users/yourname/Pictures/wallpapers/forest.jpg",
  "backgroundImage.opacity": 0.12,
  "backgroundImage.size": "contain",
  "backgroundImage.position": "center"
}
```

ワークスペース（.vscode/settings.json）
```jsonc
{
  "backgroundImage.imagePath": "file:///absolute/path/to/your/project/assets/bg.webp",
  "backgroundImage.opacity": 0.1,
  "backgroundImage.size": "cover",
  "backgroundImage.position": "center"
}
```

data:URL を使う場合（パス持ち歩き不要）
```jsonc
{
  "backgroundImage.imagePath": "data:image/png;base64,iVBORw0KGgoAAA...",
  "backgroundImage.opacity": 0.1,
  "backgroundImage.size": "cover",
  "backgroundImage.position": "center"
}
```

スライドショー（複数画像をローテーション）
```jsonc
{
  "backgroundImage.slideshow.enabled": true,
  "backgroundImage.slideshow.images": [
    "file:///Users/yourname/Pictures/wallpapers/1.jpg",
    "file:///Users/yourname/Pictures/wallpapers/2.jpg",
    "data:image/png;base64,iVBORw0KGgoAAA..."
  ],
  "backgroundImage.slideshow.interval": 20,
  "backgroundImage.slideshow.shuffle": true
}
```

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

注意
- 許可プロトコルは `file://` と `data:` のみ（`http/https` は不可）
- パストラバーサル（`../`, `..\\`）や未許可拡張子（jpg/jpeg/png/gif/webp 以外）は拒否
- 迷ったらコマンド「Background Image: Set Background Image」で選択すると安全な `file://` に自動変換

## セキュリティ

- システム/インストールディレクトリの改変なし
- `child_process`/`sudo`/`eval`/外部ネットワーク 未使用
- パストラバーサル防止・拡張子ホワイトリスト（jpg/jpeg/png/gif/webp）
- CSP: `default-src 'none'; img-src <webview> file: data:; style-src 'unsafe-inline'; script-src 'nonce-...'; connect-src 'none'`

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

## 既知の制約

- 本拡張はワークベンチ全体の背景変更は行いません（安全性のため）。背景は拡張の WebView / フルプレビューパネル内でのみ表示されます。

## ライセンス

本リポジトリの `LICENSE` を参照してください。
