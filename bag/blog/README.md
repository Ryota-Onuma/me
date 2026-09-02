This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 公開型パーソナルプラットフォーム

このサイトは、完成したBlogだけでなく、学習途中のScrapと読書ログも残していく個人アーカイブです。3種類の記録は共通のテーマ（`Database`、`English`、`Thinking` など）で横断できます。テーマ一覧は `/themes` です。

Markdownのfrontmatterでは、既存の`tags`を残したまま、必要な記録だけ`themes`を明示できます。明示しない場合は既存タグとタイトルから安全に推測されます。

```yaml
themes: ["Database"]
updated: "2026-09-02"              # 作成日とは別の最終更新日（任意）
sourceScraps: ["query-notes"]      # Blogの場合
sourceBooks: ["sql-practice-guide"]
related: ["other-record-slug"]
```

Scrapの状態は既存の`open`/`closed`を後方互換で扱い、必要になった記録だけ`growing`、`evergreen`、`archived`、`published`へ移行できます。すべて同じ状態のときは状態フィルターを表示しません。

メモのない書籍もLibraryの一覧には残りますが、空の詳細ページは生成せず、書籍情報の外部ページへリンクします。

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
