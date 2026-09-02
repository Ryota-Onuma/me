import { test, expect } from '@playwright/test';

test.describe('Shared theme archive', () => {
    test('lists themes and connects Blog, Scrap, and Library records', async ({ page }) => {
        await page.goto('/themes');
        await expect(page.getByRole('heading', { name: 'テーマ' })).toBeVisible();

        await page.getByRole('link', { name: 'Database' }).first().click();
        await expect(page).toHaveURL(/\/themes\/database$/);
        await expect(page.getByRole('heading', { name: 'Database' })).toBeVisible();
        await expect(page.getByText('PostgreSQL: 空間局所性')).toBeVisible();
        await expect(page.getByText('Database Design and Implementation')).toBeVisible();
    });

    test('shows related records on a finished Blog page', async ({ page }) => {
        await page.goto('/blog/concrete-abstract-thinking');
        await expect(page.getByRole('heading', { name: '関連する記録' })).toBeVisible();
        await expect(page.getByRole('link', { name: /具体⇄抽象.*トレーニング/ })).toHaveAttribute('href', '/library/concrete-abstract-training');
    });

    test('does not show a meaningless Scrap status filter when all statuses match', async ({ page }) => {
        await page.goto('/scrap');
        await page.locator('.retro-filter-panel').getByText('雑記を検索・絞り込む').click();
        await expect(page.getByText('状態：')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'English', exact: true })).toBeVisible();
    });
});
