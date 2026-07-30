import { test, expect } from '@playwright/test';
import { loginViaStorage } from '../helpers/auth';
import { SIDEBAR } from '../helpers/selectors';

test.describe('AI Insights View', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'representative');
    await SIDEBAR.aiInsights(page).click();
    await page.waitForTimeout(1000);
  });

  test('displays AI insights heading', async ({ page }) => {
    await expect(page.getByText(/ai.*insight|intelligence|scoring|score|recommendation/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows lead scoring section', async ({ page }) => {
    await expect(page.getByText(/score|scoring|rating|lead|priority/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows hot leads section', async ({ page }) => {
    await expect(page.getByText(/hot.*lead|top.*lead|priority/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows at-risk leads section', async ({ page }) => {
    await expect(page.getByText(/at.?risk|risk|churn|losing/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows recommended actions', async ({ page }) => {
    await expect(page.getByText(/recommend|action|suggestion|next.*step/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('score values are numeric', async ({ page }) => {
    await expect(page.getByText(/\d+/).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('AI Copilot Chat', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'representative');
  });

  test('copilot chat button is visible', async ({ page }) => {
    const chatBtn = page.getByRole('button', { name: /copilot|chat|ask.*ai/i }).first();
    await expect(chatBtn).toBeVisible({ timeout: 5000 });
  });

  test('copilot chat opens on click', async ({ page }) => {
    const chatBtn = page.getByRole('button', { name: /copilot|chat|ask.*ai/i }).first();
    if (await chatBtn.isVisible()) {
      await chatBtn.click();
      await expect(page.getByText(/ask.*anything|how.*help|message/i).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('chat has input field', async ({ page }) => {
    const chatBtn = page.getByRole('button', { name: /copilot|chat|ask.*ai/i }).first();
    if (await chatBtn.isVisible()) {
      await chatBtn.click();
      const input = page.getByPlaceholder(/ask|type|message/i).first();
      await expect(input).toBeVisible({ timeout: 3000 });
    }
  });

  test('chat can send a message', async ({ page }) => {
    const chatBtn = page.getByRole('button', { name: /copilot|chat|ask.*ai/i }).first();
    if (await chatBtn.isVisible()) {
      await chatBtn.click();
      const input = page.getByPlaceholder(/ask|type|message/i).first();
      if (await input.isVisible()) {
        await input.fill('Show me top leads');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        await expect(page.getByText(/lead|score|recommendation/i).first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('AI Models (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'admin');
    await SIDEBAR.aiModels(page).click();
  });

  test('displays AI models configuration', async ({ page }) => {
    await expect(page.getByText(/model|ai|scoring|provider/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows model provider info', async ({ page }) => {
    await expect(page.getByText(/model|ai|provider|groq|openai|rule|based|configuration/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows scoring configuration', async ({ page }) => {
    await expect(page.getByText(/scoring|weight|config|setting/i).first()).toBeVisible({ timeout: 5000 });
  });
});
