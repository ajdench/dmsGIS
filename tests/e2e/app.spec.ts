import { test, expect } from '@playwright/test';

test('loads the app shell', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.topbar')).toBeVisible();
  await expect(page.locator('.map-canvas')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Layers' })).toBeVisible();
});
