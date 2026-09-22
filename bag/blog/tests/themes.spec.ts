import { test, expect } from '@playwright/test';

test.describe('Shared theme archive', () => {
    test('lists themes and connects Blog and Library records', async ({ page }) => {
        await page.goto('/themes');
        await expect(page.getByRole('heading', { name: 'テーマ' })).toBeVisible();

        await page.getByRole('link', { name: 'Database' }).first().click();
        await expect(page).toHaveURL(/\/themes\/database$/);
        await expect(page.getByRole('heading', { name: 'Database', exact: true })).toBeVisible();
        await expect(page.getByText('PostgreSQL: 空間局所性')).toBeVisible();
        await expect(page.getByText('Database Design and Implementation')).toBeVisible();
    });

    test('shows related records on a finished Blog page', async ({ page }) => {
        await page.goto('/blog/concrete-abstract-thinking');
        await expect(page.getByRole('heading', { name: '同じ引き出し' })).toBeVisible();
        await expect(page.getByRole('link', { name: /具体⇄抽象.*トレーニング/ })).toHaveAttribute('href', '/library/concrete-abstract-training');
    });
});
