import { expect, test } from '@playwright/test';

test('loads article thumbnails in the index and detail, including the default image', async ({ page }) => {
    await page.goto('/blog');

    const article = page.locator('.retro-work-card', { has: page.getByRole('heading', { name: /負荷テスト/ }) }).first();
    const thumbnail = article.locator('.retro-entry-image img');
    await expect(thumbnail).toHaveAttribute('src', /buysell-load-testing\.png/);
    await expect.poll(() => thumbnail.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(article.locator('.retro-entry-image')).toHaveAttribute('href', await article.locator('h2 a').getAttribute('href') || '');

    await page.goto('/blog/concrete-abstract-thinking');
    const detailImage = page.locator('.retro-detail-hero > img');
    await expect(detailImage).toHaveAttribute('src', /default_blog\.png/);
    await expect.poll(() => detailImage.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
});

test('keeps article thumbnails and book covers visible on narrow screens', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });

    for (const [path, imageSelector] of [
        ['/blog', '.retro-work-card .retro-entry-image img'],
        ['/library', '.retro-book-card > img'],
        ['/blog/concrete-abstract-thinking', '.retro-detail-hero > img'],
        ['/library/domain-driven-design-intro', '.retro-book-hero > img'],
    ] as const) {
        await page.goto(path);
        const image = page.locator(imageSelector).first();
        await expect(image).toBeVisible();
        await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    }
});
