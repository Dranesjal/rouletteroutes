import { test, expect } from '@playwright/test';

test.describe('Aanmelden form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/aanmelden?wandeling=hoge-veluwe-okt-2026');
    // Wacht tot de hike-fetch via /api/hikes klaar is
    await page.waitForLoadState('networkidle');
  });

  test('form renders with required fields', async ({ page }) => {
    // Naam-veld is altijd zichtbaar
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    // E-mailadres-veld
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    // Telefoon
    await expect(page.locator('input[placeholder*="06"]').or(page.locator('input[placeholder*="telefoon"]')).or(page.locator('label').filter({ hasText: /telefoon/i }).locator('..').locator('input'))).toBeVisible();
  });

  test('submit without required fields shows validation', async ({ page }) => {
    await page.getByRole('button', { name: /aanmelden/i }).click();
    // Browser-validatie houdt de submit tegen, we blijven op de pagina
    await expect(page.getByRole('button', { name: /aanmelden/i })).toBeVisible();
  });

  test('wandelboekje checkbox is visible for Veluwe', async ({ page }) => {
    await expect(page.getByText(/Wandelkilometerboekje/i)).toBeVisible();
  });

  test('lunch checkbox shows dietary field when checked', async ({ page }) => {
    const lunchText = page.getByText(/Ik doe mee met de lunch/i);
    await expect(lunchText).toBeVisible();

    // Klik de lunch-checkbox
    await lunchText.click();

    // Dieetwensen-veld verschijnt
    await expect(page.getByText(/Dieetwensen/i)).toBeVisible();
  });

  test('email confirmation mismatch shows error', async ({ page }) => {
    // Vul naam in
    await page.locator('input[placeholder*="naam"]').or(page.locator('input[placeholder*="Naam"]')).fill('Test Roamer');

    // Vul e-mailadressen in (eerste = email, tweede = bevestiging)
    const emailInputs = page.locator('input[type="email"]');
    await emailInputs.first().fill('test@example.com');
    await emailInputs.nth(1).fill('other@example.com');

    await page.getByRole('button', { name: /aanmelden/i }).click();

    await expect(page.getByText(/komen niet overeen/i)).toBeVisible({ timeout: 10_000 });
  });
});
