import { test, expect } from './fixtures.js';

test('creates, copies and opens a persisted link at the local destination', async ({ page, context, app }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: app.origin });
  await page.goto(app.origin);
  await page.getByLabel('Destination URL', { exact: true }).fill(app.destination);
  await page.getByRole('button', { name: 'Create short link' }).click();
  const result = page.getByLabel('Your short link', { exact: true });
  await expect(result).toHaveValue(new RegExp(`^${app.origin}/r/[A-Za-z0-9_-]{12}$`));
  const shortUrl = await result.inputValue();
  await page.getByRole('button', { name: 'Copy short link' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Link copied.' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(shortUrl);
  await page.getByRole('link', { name: 'Open short link' }).click();
  await expect(page).toHaveURL(app.destination);
  await expect(page.getByRole('heading', { name: 'Destination reached' })).toBeVisible();
});

test('rejects an unsupported protocol and clears the error when edited', async ({ page, app }) => {
  await page.goto(app.origin);
  const input = page.getByLabel('Destination URL', { exact: true });
  const invalid = app.destination.replace('http:', 'ftp:');
  await input.fill(invalid);
  await page.getByRole('button', { name: 'Create short link' }).click();
  await expect(page.getByRole('alert')).toHaveText('Enter an HTTP or HTTPS URL without credentials (maximum 2048 characters).');
  await expect(input).toHaveValue(invalid);
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Your short link', { exact: true })).toHaveCount(0);
  await input.fill(app.destination);
  await expect(page.getByRole('alert')).toBeEmpty();
});

test('shows a real 404 for a missing short link', async ({ page, app }) => {
  const response = await page.goto(`${app.origin}/r/missing12345`);
  expect(response?.status()).toBe(404);
  await expect(page.locator('body')).toHaveText('Short link not found.');
});

test('selects the link for manual copying when browser policy denies clipboard access', async ({ page, app }) => {
  await page.route(app.origin + '/', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), 'permissions-policy': 'clipboard-write=()' } });
  });
  await page.goto(app.origin);
  await page.getByLabel('Destination URL', { exact: true }).fill(app.destination);
  await page.getByRole('button', { name: 'Create short link' }).click();
  await page.getByRole('button', { name: 'Copy short link' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Automatic copy is unavailable.' })).toBeVisible();
  const result = page.getByLabel('Your short link', { exact: true });
  await expect(result).toBeFocused();
  expect(await result.evaluate((input: HTMLInputElement) => [input.selectionStart, input.selectionEnd]))
    .toEqual([0, (await result.inputValue()).length]);
  await expect(page.getByRole('status').filter({ hasText: 'Link copied.' })).toHaveCount(0);
});
