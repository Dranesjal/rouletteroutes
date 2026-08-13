import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads with correct title and hero', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Roulette Routes Roamers/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('nav links are present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /wandelingen/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /over/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /inloggen/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /word roamer/i })).toBeVisible();
  });

  test('CTA links to wandelingen', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /bekijk wandelingen/i }).first();
    await expect(cta).toBeVisible();
  });

  test('no broken images', async ({ page }) => {
    const failedImages: string[] = [];
    page.on('response', (res) => {
      if (res.request().resourceType() === 'image' && !res.ok()) {
        failedImages.push(res.url());
      }
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(failedImages).toHaveLength(0);
  });
});
