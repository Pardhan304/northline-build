import { expect, test } from '@playwright/test';

test.describe('Public pages & Admin guard E2E', () => {
  test('renders public pages cleanly without horizontal overflow and supports navigation', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const overflowHome = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflowHome).toBe(false);

    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto('/projects');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto('/contact');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByLabel(/^name/i)).toBeVisible();
    await expect(page.getByLabel(/^email/i)).toBeVisible();

    const overflowContact = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflowContact).toBe(false);
  });

  test('validates contact form inputs client-side before submission', async ({ page }) => {
    await page.goto('/contact');
    await page.getByRole('button', { name: /submit enquiry/i }).click();
    await expect(page.getByText(/please enter your full name/i)).toBeVisible();
    await expect(page.getByText(/please enter a valid email address/i)).toBeVisible();
  });

  test('renders admin login and redirects unauthenticated dashboard access to login', async ({
    page,
  }) => {
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Authentication is required.',
          error: { code: 'UNAUTHORIZED', details: [] },
        }),
      });
    });

    await page.goto('/admin/dashboard');
    await page.waitForURL('**/admin/login');
    await expect(page.getByRole('heading', { name: /administrator sign in/i })).toBeVisible();
  });
});
