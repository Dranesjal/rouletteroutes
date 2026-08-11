import { test, expect } from '@playwright/test';

test.describe('Aanmelden form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/aanmelden?wandeling=hoge-veluwe-okt-2026');
  });

  test('form renders with required fields', async ({ page }) => {
    await expect(page.getByLabel(/naam/i)).toBeVisible();
    await expect(page.getByLabel(/e-mail/i).first()).toBeVisible();
    await expect(page.getByLabel(/telefoon/i)).toBeVisible();
  });

  test('submit without required fields shows validation', async ({ page }) => {
    await page.getByRole('button', { name: /aanmelden/i }).click();
    // Browser native or custom validation should prevent submission
    // Check that we are still on the aanmelden page (not success state)
    await expect(page.getByRole('button', { name: /aanmelden/i })).toBeVisible();
  });

  test('wandelboekje checkbox is visible for Veluwe', async ({ page }) => {
    await expect(page.getByText(/Wandelkilometerboekje/i)).toBeVisible();
    const checkbox = page.getByRole('checkbox').first();
    await expect(checkbox).toBeVisible();
  });

  test('lunch checkbox shows dietary field when checked', async ({ page }) => {
    // Lunch checkbox
    const lunchCheckbox = page.getByText(/Ik doe mee met de lunch/i);
    await expect(lunchCheckbox).toBeVisible();

    // Dietary field should not be visible yet
    const dietaryLabel = page.getByText(/Dieetwensen/i);
    // Click the lunch checkbox
    await page.getByText(/Ik doe mee met de lunch/i).click();

    // After checking, dietary input should appear
    await expect(dietaryLabel).toBeVisible();
  });

  test('email confirmation mismatch shows error', async ({ page }) => {
    await page.getByLabel(/naam/i).fill('Test Roamer');
    const emailFields = page.getByLabel(/e-mail/i);
    await emailFields.first().fill('test@example.com');
    await emailFields.nth(1).fill('other@example.com');
    await page.getByRole('button', { name: /aanmelden/i }).click();
    await expect(page.getByText(/komen niet overeen/i)).toBeVisible();
  });
});
