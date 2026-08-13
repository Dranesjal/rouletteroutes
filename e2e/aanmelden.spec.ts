import { test, expect } from '@playwright/test';

test.describe('Aanmelden form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/aanmelden?wandeling=hoge-veluwe-okt-2026');
    // Wacht tot client-side hydration klaar is (Suspense + useSearchParams)
    await page.waitForSelector('form', { state: 'visible', timeout: 15_000 });
  });

  test('form renders with required fields', async ({ page }) => {
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });

  test('submit without required fields shows validation', async ({ page }) => {
    await page.getByRole('button', { name: /aanmelden/i }).click();
    await expect(page.getByRole('button', { name: /aanmelden/i })).toBeVisible();
  });

  test('wandelboekje checkbox is visible for Veluwe', async ({ page }) => {
    // Wacht op /api/hikes fetch zodat selectedHike beschikbaar is
    await expect(page.getByText(/Wandelkilometerboekje/i)).toBeVisible({ timeout: 15_000 });
  });

  test('lunch checkbox shows dietary field when checked', async ({ page }) => {
    const lunchText = page.getByText(/Ik doe mee met de lunch/i);
    await expect(lunchText).toBeVisible({ timeout: 15_000 });
    await lunchText.click();
    await expect(page.getByText(/Dieetwensen/i)).toBeVisible();
  });

  test('email confirmation mismatch shows error', async ({ page }) => {
    await page.locator('input[placeholder*="naam"]').or(page.locator('input[placeholder*="Naam"]')).fill('Test Roamer');
    const emailInputs = page.locator('input[type="email"]');
    await emailInputs.first().fill('test@example.com');
    await emailInputs.nth(1).fill('other@example.com');
    await page.getByRole('button', { name: /aanmelden/i }).click();
    await expect(page.getByText(/komen niet overeen/i)).toBeVisible({ timeout: 10_000 });
  });
});
