# Marp Slides

`mise` を使って Marp ベースのスライドを管理するための最小構成です。

## 使い方

1. 必要なツールをセットアップ: `mise install`
2. 依存をインストール: `mise run setup`
3. プレビューサーバー: `mise run preview`
4. PDF 出力 (dist/pdf): `mise run pdf`
5. HTML 出力 (dist/html): `mise run html`
6. 生成物削除: `mise run clean`

スライドは `slides/` 配下に Markdown (`.md`) で配置します。生成物は用途ごとに `dist/` 以下へ整理されます。

## サンプル

`slides/example.md` に簡単なサンプルを用意しています。必要に応じて差し替えてください。
