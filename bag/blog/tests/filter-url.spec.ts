import { expect, test } from '@playwright/test';

test.describe('URL-backed archive filters', () => {
    test('restores shared search URLs for Blog, Scrap, and Library', async ({ page }) => {
        await page.goto('/blog?q=思考法');
        await expect(page.getByRole('searchbox')).toBeVisible();
        await expect(page.getByRole('searchbox')).toHaveValue('思考法');
        await expect(page.getByRole('heading', { name: /具体.*抽象/ })).toBeVisible();
        await expect(page.locator('.retro-lead')).toContainText(/全\d+件中\d+件/);

        await page.goto('/scrap?q=ask');
        await expect(page.getByRole('searchbox')).toBeVisible();
        await expect(page.getByRole('searchbox')).toHaveValue('ask');
        await expect(page.getByRole('heading', { name: 'askの使い方' })).toBeVisible();
        await expect(page.locator('.retro-lead')).toContainText(/全\d+件中\d+件/);

        await page.goto('/library?q=アジャイル&status=reading&sort=rating-high');
        await expect(page.getByRole('searchbox')).toBeVisible();
        await expect(page.getByRole('searchbox')).toHaveValue('アジャイル');
        await expect(page.getByRole('heading', { name: /アジャイルな見積り/ })).toBeVisible();
        await expect(page.locator('.retro-lead')).toContainText(/全\d+冊中\d+冊/);

        await page.getByRole('button', { name: '絞り込みを解除' }).click();
        await expect(page).toHaveURL(/\/library$/);
        await expect(page.getByRole('searchbox')).toHaveValue('');
    });

    test('restores deliberate facet changes with Back and Forward', async ({ page }) => {
        await page.goto('/library?status=reading');
        await expect(page.getByRole('heading', { name: /アジャイルな見積り/ })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'ドメイン駆動設計をはじめよう' })).toHaveCount(0);

        await page.locator('.retro-filter-panel').getByText('テーマ・分類で絞る').click();
        await page.getByRole('button', { name: '読了' }).click();
        await expect(page).toHaveURL(/\/library\?status=completed$/);
        await expect(page.getByRole('heading', { name: /アジャイルな見積り/ })).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'ドメイン駆動設計をはじめよう' })).toBeVisible();

        await page.goBack();
        await expect(page).toHaveURL(/\/library\?status=reading$/);
        await expect(page.getByRole('heading', { name: /アジャイルな見積り/ })).toBeVisible();

        await page.goForward();
        await expect(page).toHaveURL(/\/library\?status=completed$/);
        await expect(page.getByRole('heading', { name: 'ドメイン駆動設計をはじめよう' })).toBeVisible();
    });
});
