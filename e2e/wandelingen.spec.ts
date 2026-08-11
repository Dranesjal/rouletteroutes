import { test, expect } from '@playwright/test';

test.describe('Wandelingen', () => {
  test('page loads with at least one hike', async ({ page }) => {
    await page.goto('/wandelingen');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // At least one hike card should render
    const cards = page.locator('article, [data-testid="hike-card"], a[href^="/wandelingen/"]');
    await expect(cards.first()).toBeVisible();
  });

  test('Hoge Veluwe hike is listed as upcoming', async ({ page }) => {
    await page.goto('/wandelingen');
    await expect(page.getByText(/Hoge Veluwe/i)).toBeVisible();
  });

  test('hike detail page loads from list', async ({ page }) => {
    await page.goto('/wandelingen');
    await page.getByText(/Hoge Veluwe/i).first().click();
    await expect(page).toHaveURL(/hoge-veluwe/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('hike detail shows practical info', async ({ page }) => {
    await page.goto('/wandelingen/hoge-veluwe-okt-2026');
    await expect(page.getByText(/Vertrekpunt/i)).toBeVisible();
    await expect(page.getByText(/Wandelkilometerboekje/i)).toBeVisible();
  });

  test('hike detail CTA links to aanmelden', async ({ page }) => {
    await page.goto('/wandelingen/hoge-veluwe-okt-2026');
    const cta = page.getByRole('link', { name: /aanmelden/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', /aanmelden/);
  });
});
