import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should navigate to the technical notes page and update URL', async ({ page }) => {
        await page.getByRole('navigation', { name: '主なページ' }).getByRole('link', { name: '技術ノート' }).click();

        await expect(page).toHaveURL(/\/blog/);
    });

    test('should display the technical notes heading after navigation', async ({ page }) => {
        await page.getByRole('navigation', { name: '主なページ' }).getByRole('link', { name: '技術ノート' }).click();

        await expect(page.getByRole('heading', { name: '技術ノート' })).toBeVisible();
    });

    test('should navigate to the notes page and update URL', async ({ page }) => {
        await page.getByRole('navigation', { name: '主なページ' }).getByRole('link', { name: '雑記帳' }).click();

        await expect(page).toHaveURL(/\/scrap/);
    });

    test('should display the notes page heading after navigation', async ({ page }) => {
        await page.getByRole('navigation', { name: '主なページ' }).getByRole('link', { name: '雑記帳' }).click();

        await expect(page.getByRole('heading', { name: '雑記帳' })).toBeVisible();
    });

    test('should navigate back to Home using logo', async ({ page }) => {
        await page.goto('/blog');

        await page.click('header >> text=ryota.onuma');

        await expect(page).toHaveURL('/');
    });
});
