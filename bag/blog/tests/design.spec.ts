import { test, expect } from '@playwright/test';

test.describe('Retro design behavior', () => {
    test('uses the document frame and link language of a late-1990s Japanese homepage', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByRole('link', { name: 'ryota.onuma.dev ホーム' })).toBeVisible();
        await expect(page.getByText('Welcome to my homepage!')).toBeVisible();
        await expect(page.getByRole('contentinfo').getByRole('link', { name: 'GitHub' })).toBeVisible();

        const homeLink = page.locator('.retro-index').getByRole('link', { name: '技術ノート' });
        await expect(homeLink).toHaveAttribute('href', '/blog');
        expect(await homeLink.evaluate(element => getComputedStyle(element).textDecorationLine))
            .toContain('underline');

        const appearance = await page.evaluate(() => {
            const bodyStyle = getComputedStyle(document.body);
            const shellStyle = getComputedStyle(document.querySelector('.site-shell')!);
            const logoStyle = getComputedStyle(document.querySelector('.retro-logo')!);
            const profileImageStyle = getComputedStyle(document.querySelector('.retro-profile img')!);

            return {
                canvas: bodyStyle.backgroundColor,
                backgroundImage: bodyStyle.backgroundImage,
                shellWidth: shellStyle.width,
                shellShadow: shellStyle.boxShadow,
                logoFont: logoStyle.fontFamily,
                imageFilter: profileImageStyle.filter,
            };
        });

        expect(appearance.canvas).toBe('rgb(192, 192, 192)');
        expect(appearance.backgroundImage).toBe('none');
        // 720px is intentional: a complete document fits within an 800px SVGA browser.
        expect(appearance.shellWidth).toBe('720px');
        expect(appearance.shellShadow).toBe('none');
        expect(appearance.logoFont).not.toContain('Arial Black');
        expect(appearance.imageFilter).toBe('none');
    });

    test('keeps the homepage within a narrow mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');

        const hasHorizontalOverflow = await page.evaluate(
            () => document.documentElement.scrollWidth > document.documentElement.clientWidth
        );

        expect(hasHorizontalOverflow).toBe(false);
        await expect(page.locator('.retro-profile')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Ryota Onumaのホームページ' })).toBeVisible();
    });

    test('keeps search controls secondary and article rows as native links', async ({ page }) => {
        await page.goto('/blog');

        const filterPanel = page.locator('.retro-filter-panel');
        await expect(filterPanel).not.toHaveAttribute('open', '');
        await filterPanel.getByText('記事を検索・絞り込む').click();
        await expect(page.getByRole('searchbox')).toBeVisible();

        const firstArticleLink = page.locator('.retro-list > li h2 a').first();
        await expect(firstArticleLink).toHaveAttribute('href', /.+/);
        expect(await firstArticleLink.evaluate(element => getComputedStyle(element).textDecorationLine))
            .toContain('underline');
    });

    test('keeps books without notes in the index and links them externally', async ({ page }) => {
        await page.goto('/library');

        const bookLink = page.getByRole('link', { name: /ソフトウェア設計の結合バランス/ });
        await expect(bookLink).toHaveAttribute('href', /^https:/);
        await expect(bookLink).toHaveAttribute('target', '_blank');
    });

    test('uses the rendered Japanese heading IDs in the table of contents', async ({ page }) => {
        await page.goto('/blog/concrete-abstract-thinking');

        await expect(page.locator('main h1')).toHaveCount(1);
        await expect(page.locator('.retro-article h2').first()).toBeVisible();

        const tocLink = page.getByRole('navigation', { name: '目次' }).getByRole('link').first();
        const href = await tocLink.getAttribute('href');
        if (!href) throw new Error('The first table-of-contents link has no href.');
        const headingId = href.slice(1);

        expect(href).toContain('具体');
        expect(await page.evaluate(id => Boolean(document.getElementById(id)), headingId)).toBe(true);

        await tocLink.click();
        await expect.poll(() => page.evaluate(() => decodeURIComponent(location.hash.slice(1))))
            .toBe(headingId);
    });

    test('searches the fields promised by the blog and Scrap controls', async ({ page }) => {
        await page.goto('/blog');
        await page.locator('.retro-filter-panel').getByText('記事を検索・絞り込む').click();
        await page.getByRole('searchbox').fill('思考法');
        await expect(page.getByRole('heading', { name: /具体.*抽象/ })).toBeVisible();

        await page.goto('/scrap');
        await page.locator('.retro-filter-panel').getByText('雑記を検索・絞り込む').click();
        await page.getByRole('searchbox').fill('English');
        await expect(page.getByRole('heading', { name: /Shadowing Practice/ }).first()).toBeVisible();
    });

    test('keeps one page h1 and offsets headings inside Scrap posts', async ({ page }) => {
        await page.goto('/scrap/ask');

        await expect(page.locator('main h1')).toHaveCount(1);
        await expect(page.locator('.retro-article h1')).toHaveCount(0);
        await expect(page.locator('.retro-article h2', { hasText: 'askの使い方' })).toBeVisible();
    });

    test('uses one static social image for Open Graph and X', async ({ page }) => {
        await page.goto('/');

        const openGraphImage = await page.locator('meta[property="og:image"]').getAttribute('content');
        const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute('content');
        expect(openGraphImage).toBe('https://ryota.onuma.dev/og.png');
        expect(twitterImage).toBe(openGraphImage);
    });

    test('keeps one page heading without modern reading-progress chrome', async ({ page }) => {
        await page.goto('/blog/buysell-zenn-elasticsearch-join-field');

        await expect(page.locator('.retro-progress')).toHaveCount(0);
        await expect(page.locator('main h1')).toHaveCount(1);
        await expect(page.getByRole('link', { name: /元記事を外部サイトで読む/ })).toHaveAttribute('href', /^https:/);

        await page.goto('/library/domain-driven-design-intro');
        await expect(page.locator('.retro-progress')).toHaveCount(0);
    });

    test('uses plain document headings, native-looking controls, and a light-gray code listing', async ({ page }) => {
        await page.goto('/blog');

        const sectionHeading = page.locator('.retro-section-heading');
        await expect(sectionHeading.locator('.retro-entry-mark')).toHaveCount(0);
        expect(await sectionHeading.evaluate(element => getComputedStyle(element).boxShadow)).toBe('none');

        const filterPanel = page.locator('.retro-filter-panel');
        await filterPanel.getByText('記事を検索・絞り込む').click();
        const selectedButton = filterPanel.getByRole('button', { name: 'すべて' });
        expect(await selectedButton.evaluate(element => getComputedStyle(element).color)).toBe('rgb(0, 0, 0)');

        await page.goto('/blog/markdown-syntax-guide');
        const codeBlock = page.locator('.retro-code-block').first();
        await expect(codeBlock).toBeVisible();
        expect(await codeBlock.evaluate(element => getComputedStyle(element).backgroundColor))
            .toBe('rgb(230, 230, 230)');
        expect(await page.locator('.retro-detail-hero').evaluate(element => getComputedStyle(element).boxShadow))
            .toBe('none');
    });

    test('keeps code copy, Mermaid, link cards, and embeds functional', async ({ page }) => {
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'clipboard', {
                configurable: true,
                value: { writeText: async () => undefined },
            });
        });
        await page.goto('/blog/markdown-syntax-guide');

        const copyButton = page.getByRole('button', { name: 'コピー' }).first();
        await expect(copyButton).toBeVisible();
        await copyButton.click();
        await expect(copyButton).toHaveText('コピー済み');
        await expect(page.locator('.retro-mermaid')).toBeVisible();
        await expect(page.locator('.retro-alert').first()).toBeVisible();
        const details = page.locator('.retro-details').first();
        await expect(details).toBeVisible();
        await details.locator(':scope > summary').click();
        await expect(details).toHaveAttribute('open', '');
        await expect(page.locator('.retro-link-card')).toBeVisible();
        await expect(page.locator('.retro-github-card')).toHaveAttribute('href', /github\.com/);
        await expect(page.locator('.retro-video-embed iframe')).toHaveAttribute('src', /youtube\.com\/embed/);
    });

    test('keeps Library search, status, sort, tags, ratings, and external links', async ({ page }) => {
        await page.goto('/library');
        const filterPanel = page.locator('.retro-filter-panel');
        await filterPanel.getByText('本を検索・絞り込む').click();

        await page.getByRole('searchbox').fill('アジャイル');
        await expect(page.getByRole('heading', { name: /アジャイルな見積り/ })).toBeVisible();
        await page.getByRole('searchbox').fill('');

        await filterPanel.getByRole('button', { name: '読書中' }).click();
        await expect(page.getByRole('heading', { name: /アジャイルな見積り/ })).toBeVisible();
        await filterPanel.getByRole('button', { name: 'すべて' }).first().click();

        await filterPanel.getByRole('combobox').selectOption('rating-high');
        await expect(page.locator('.retro-book-card .retro-rating').first()).toContainText('★★★★★');
        await filterPanel.getByRole('button', { name: 'Thinking' }).click();
        await expect(page.locator('.retro-book-card .retro-card-themes').first()).toContainText('Thinking');

        await page.goto('/library/domain-driven-design-intro');
        await expect(page.getByText('★★★★★ (5/5)')).toBeVisible();
        await expect(page.getByRole('link', { name: /外部サイトで見る/ })).toHaveAttribute('href', /^https:/);
    });

    test('keeps external articles and the RSS 2.0 feed', async ({ page, request }) => {
        await page.goto('/blog');
        const externalArticle = page.locator('.retro-list > li h2 a[target="_blank"]').first();
        await expect(externalArticle).toHaveAttribute('href', /^https:/);
        await expect(externalArticle).toContainText('［外部］');

        const response = await request.get('/feed.xml');
        expect(response.ok()).toBe(true);
        expect(response.headers()['content-type']).toContain('application/rss+xml');
        const xml = await response.text();
        expect(xml).toContain('<rss version="2.0">');
        expect(xml).toContain('<item>');
    });

    test('exposes current location and a working skip link', async ({ page }) => {
        await page.goto('/blog');

        const currentLocation = page.locator('.retro-header nav [aria-current="page"]');
        await expect(currentLocation).toHaveText('技術ノート');
        await expect(currentLocation).not.toHaveAttribute('href');

        const skipLink = page.getByRole('link', { name: '本文へスキップ' });
        await skipLink.focus();
        await expect(skipLink).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.locator('#main-content')).toBeFocused();
    });

    test('uses native links for adjacent article navigation', async ({ page }) => {
        await page.goto('/blog/concrete-abstract-thinking');

        const adjacentLinks = page.getByRole('navigation', { name: '記事間の移動' }).getByRole('link');
        await expect(adjacentLinks.first()).toHaveAttribute('href', /.+/);
    });

    test('keeps wide Markdown tables inside their own scroller on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 720 });
        await page.goto('/library/domain-driven-design-intro');

        const tableWrapper = page.locator('.retro-article .table-wrapper').first();
        await expect(tableWrapper).toBeVisible();
        await expect(tableWrapper.locator('table')).toBeVisible();
        expect(await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
        )).toBe(true);
    });

    test('does not present ordinary Scrap chapters as timestamped posts', async ({ page }) => {
        await page.goto('/scrap/ask');

        await expect(page.getByText('timestamp unknown')).toHaveCount(0);
        await expect(page.getByRole('navigation', { name: '目次' })).toBeVisible();
        await expect(page.locator('.retro-thread')).toHaveCount(1);
    });

    test('uses page-specific metadata and canonical URLs', async ({ page }) => {
        await page.goto('/blog/concrete-abstract-thinking');

        const title = await page.title();
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
        await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', title);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
            'href',
            'https://ryota.onuma.dev/blog/concrete-abstract-thinking'
        );

        await page.goto('/scrap/ask');
        await expect(page).toHaveTitle(/askの使い方/);
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /askの使い方/);
        await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute('content', /2026-01-04/);
        await expect(page.locator('meta[property="article:author"]')).toHaveAttribute('content', 'https://ryota.onuma.dev/');
        await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
        await expect(page.locator('meta[name="twitter:image"]')).toHaveCount(0);
        expect(await page.locator('script[type="application/ld+json"]').textContent()).toContain('BlogPosting');
    });
});
