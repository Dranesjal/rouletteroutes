import { test, expect } from '@playwright/test';

test.describe('Wandelingen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wandelingen');
    await page.waitForLoadState('networkidle');
  });

  test('page loads with at least one hike', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const cards = page.locator('a[href^="/wandelingen/"]');
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
  });

  test('Hoge Veluwe hike is listed as upcoming', async ({ page }) => {
    await expect(page.getByText(/Hoge Veluwe/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('hike detail page loads from list', async ({ page }) => {
    await page.getByText(/Hoge Veluwe/i).first().click();
    await expect(page).toHaveURL(/hoge-veluwe/);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('hike detail shows practical info', async ({ page }) => {
    await page.goto('/wandelingen/hoge-veluwe-okt-2026');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Vertrekpunt/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Wandelkilometerboekje/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('hike detail CTA links to aanmelden', async ({ page }) => {
    await page.goto('/wandelingen/hoge-veluwe-okt-2026');
    await page.waitForLoadState('networkidle');
    const cta = page.getByRole('link', { name: /aanmelden/i });
    await expect(cta).toBeVisible({ timeout: 10_000 });
    await expect(cta).toHaveAttribute('href', /aanmelden/);
  });
});
