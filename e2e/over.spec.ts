import { test, expect } from '@playwright/test';

test.describe('Over ons', () => {
  test('page loads with club intro', async ({ page }) => {
    await page.goto('/over');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/Roulette Routes Roamers/i)).toBeVisible();
  });

  test('no em dashes on page', async ({ page }) => {
    await page.goto('/over');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('—');
  });

  test('contains routes description', async ({ page }) => {
    await page.goto('/over');
    await expect(page.getByText(/diverse routes/i)).toBeVisible();
  });
});
