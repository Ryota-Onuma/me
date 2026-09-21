ryota.onuma.dev は、技術ノート・雑記帳・読書記録をテーマでつなぐ個人アーカイブです。

## 公開型パーソナルプラットフォーム

このサイトは、完成したBlogだけでなく、学習途中のScrapと読書ログも残していく個人アーカイブです。3種類の記録は共通のテーマ（`Database`、`English`、`Thinking` など）で横断できます。テーマ一覧は `/themes` です。

Markdownのfrontmatterでは、既存の`tags`を残したまま、公開するすべての記録に`themes`を明示します。

公開する記録では `themes` と ISO 形式の日付を必須にしています。frontmatter、画像、URL、関連slugに不整合がある場合は、コンテンツを黙って除外せずビルドを失敗させます。

```yaml
themes: ["Database"]
updated: "2026-09-02"              # 作成日とは別の最終更新日（任意）
sourceScraps: ["query-notes"]      # Blogの場合
sourceBooks: ["sql-practice-guide"]
related: ["other-record-slug"]
internalOnly: true                # 表示検証用。直接URL以外の公開導線から除外
```

Scrapの状態は既存の`open`/`closed`を後方互換で扱い、必要になった記録だけ`growing`、`evergreen`、`archived`、`published`へ移行できます。すべて同じ状態のときは状態フィルターを表示しません。

メモのない書籍もLibraryの一覧には残りますが、空の詳細ページは生成せず、書籍情報の外部ページへリンクします。

外部記事は、本文がある記録だけ内部の導入ページを生成し、本文がない記録は一覧から元記事へ直接リンクします。

## プロダクト方針と計測

主な読者は、データベース、ソフトウェア設計、チーム開発の実務を調べるエンジニアです。完成した技術ノートだけでなく、雑記帳と読書記録を共通テーマでつなぎ、考えが育つ過程もたどれることを目指します。

North Star は **Engaged Learning Session**（60秒以上滞在し、同一セッションで2件目の有意味なコンテンツへ進んだ訪問）です。補助指標として、ホームから最初のコンテンツへの遷移率、テーマ内回遊率、関連記事クリック率、RSSクリック率、28日再訪率を使います。

UIは `ryota:analytics` のブラウザイベントを発火するだけで、特定の計測サービスへ依存しません。イベント属性に本文、検索語、個人情報を含めないでください。

## Getting Started

開発サーバーを起動します。

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

品質確認は次のコマンドで行います。

```bash
npm run lint
npx vitest run
npm run test:e2e
npm run build
```

## 構成

- `src/app` — App Routerのページ、metadata、RSS、sitemap
- `src/components` — 1990年代風の文書UIと小さなインタラクティブ部品
- `src/lib/contentValidation.ts` — frontmatter、URL、画像、関連slugのビルド時検証
- `src/hooks` — URLと同期する検索・絞り込み
