import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should have the correct page title', async ({ page }) => {
        await expect(page).toHaveTitle(/ryota\.onuma\.dev/);
    });

    test('should display the main heading', async ({ page }) => {
        const heading = page.getByRole('heading', { name: 'Ryota Onuma' });
        await expect(heading).toBeVisible();
    });

    test('should display job title', async ({ page }) => {
        await expect(page.getByText('Software Engineer')).toBeVisible();
    });

    test('should display personal bio', async ({ page }) => {
        await expect(page.getByText('Stay curious.')).toBeVisible();
    });

    test('should contain at least one social link', async ({ page }) => {
        const socialLinks = page.locator('a[target="_blank"]');
        const count = await socialLinks.count();

        expect(count).toBeGreaterThanOrEqual(1);
    });
});
