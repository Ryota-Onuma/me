import { expect, test, type Page } from '@playwright/test';

const settlePage = async (page: Page, selector: string) => {
    await page.locator(selector).first().waitFor({ state: 'visible' });
    await page.evaluate(async () => {
        await Promise.all(Array.from(document.images).map(image => image.decode().catch(() => undefined)));
    });
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
};

test.describe('reference room visual snapshots', () => {
    test.skip(({ browserName }) => browserName !== 'chromium', 'One rendering engine owns the visual baselines.');

    test('entrance at desktop width', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/');
        await settlePage(page, '.retro-shelf');
        await expect(page).toHaveScreenshot('entrance-1440.png', { fullPage: true, animations: 'disabled', maxDiffPixelRatio: 0.02 });
    });

    test('entrance at mobile width', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');
        await settlePage(page, '.retro-shelf');
        await expect(page).toHaveScreenshot('entrance-390.png', { fullPage: true, animations: 'disabled', maxDiffPixelRatio: 0.02 });
    });

    test('three archive indexes', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        for (const [path, name] of [
            ['/blog', 'technical-index-1440.png'],
            ['/scrap', 'scrap-index-1440.png'],
            ['/library', 'library-index-1440.png'],
        ] as const) {
            await page.goto(path);
            await settlePage(page, '.retro-index-entry');
            await expect(page).toHaveScreenshot(name, { fullPage: false, animations: 'disabled', maxDiffPixelRatio: 0.02 });
        }
    });

    test('article and theme index at desktop width', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/blog/concrete-abstract-thinking');
        await settlePage(page, '.retro-article');
        await expect(page).toHaveScreenshot('article-detail-1440.png', { fullPage: false, animations: 'disabled', maxDiffPixelRatio: 0.02 });

        await page.goto('/themes');
        await settlePage(page, '.retro-index-entry');
        await expect(page).toHaveScreenshot('theme-index-1440.png', { fullPage: false, animations: 'disabled', maxDiffPixelRatio: 0.02 });
    });

    test('article and 404 at narrow widths', async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 720 });
        await page.goto('/blog/concrete-abstract-thinking');
        await settlePage(page, '.retro-article');
        await expect(page).toHaveScreenshot('article-detail-320.png', { fullPage: false, animations: 'disabled', maxDiffPixelRatio: 0.02 });

        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/missing-archive-record');
        await settlePage(page, '.retro-not-found');
        await expect(page).toHaveScreenshot('not-found-390.png', { fullPage: false, animations: 'disabled', maxDiffPixelRatio: 0.02 });
    });
});
