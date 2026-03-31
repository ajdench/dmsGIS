import { test, expect } from '@playwright/test';

test('loads the app shell', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.topbar-strip')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open' })).toBeVisible();
  await expect(page.locator('.map-canvas')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Overlays' })).toBeVisible();
});
