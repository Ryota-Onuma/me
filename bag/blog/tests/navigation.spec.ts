import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should navigate to Blog page and update URL', async ({ page }) => {
        await page.click('nav >> text=Blog');

        await expect(page).toHaveURL(/\/blog/);
    });

    test('should display Blog page heading after navigation', async ({ page }) => {
        await page.click('nav >> text=Blog');

        await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();
    });

    test('should navigate to Scrap page and update URL', async ({ page }) => {
        await page.click('nav >> text=Scrap');

        await expect(page).toHaveURL(/\/scrap/);
    });

    test('should display Scrap page heading after navigation', async ({ page }) => {
        await page.click('nav >> text=Scrap');

        await expect(page.getByRole('heading', { name: 'Scrap' })).toBeVisible();
    });

    test('should navigate back to Home using logo', async ({ page }) => {
        await page.goto('/blog');

        await page.click('header >> text=Ryota Onuma');

        await expect(page).toHaveURL('/');
    });
});
