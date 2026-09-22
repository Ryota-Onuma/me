import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should have the correct page title', async ({ page }) => {
        await expect(page).toHaveTitle(/ryota\.onuma\.dev/);
    });

    test('should display the main heading', async ({ page }) => {
        const heading = page.getByRole('heading', { name: 'ryota.onuma.dev' });
        await expect(heading).toBeVisible();
    });

    test('should describe the site in Japanese', async ({ page }) => {
        await expect(page.getByText('技術のメモと、読んだ本。')).toBeVisible();
    });

    test('keeps the homepage limited to recent updates', async ({ page }) => {
        await expect(page.locator('.homepage-updates > li')).toHaveCount(5);
        await expect(page.getByRole('heading')).toHaveText(['ryota.onuma.dev', '更新履歴']);
        await expect(page.getByRole('link', { name: /^GitHub/ })).toHaveCount(1);
    });

    test('should contain at least one social link', async ({ page }) => {
        const socialLinks = page.locator('a[target="_blank"]');
        const count = await socialLinks.count();

        expect(count).toBeGreaterThanOrEqual(1);
    });
});
