import { test, expect } from '@playwright/test';

test.describe('Over ons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/over');
    await page.waitForLoadState('networkidle');
  });

  test('page loads with club intro', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Roulette Routes Roamers/i);
  });

  test('no em dashes on page', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('—');
  });

  test('contains routes description', async ({ page }) => {
    await expect(page.getByText(/diverse routes/i).first()).toBeVisible();
  });
});
