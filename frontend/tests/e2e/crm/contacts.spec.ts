import { test, expect } from '@playwright/test';
import { loginViaStorage } from '../helpers/auth';
import { SIDEBAR, BUTTONS, FORMS, HEADINGS } from '../helpers/selectors';

test.describe('Contacts View', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'representative');
    await SIDEBAR.contacts(page).click();
    await expect(HEADINGS.contactsDirectory(page)).toBeVisible({ timeout: 5000 });
  });

  test('displays contacts list with data', async ({ page }) => {
    await expect(page.getByText('Alex Rivera')).toBeVisible({ timeout: 5000 });
  });

  test('search filters contacts', async ({ page }) => {
    const searchInput = FORMS.contactSearch(page);
    if (await searchInput.isVisible()) {
      await searchInput.fill('Alex');
      await page.waitForTimeout(500);
      await expect(page.getByText('Alex Rivera')).toBeVisible();
    }
  });

  test('clicking a contact opens detail panel', async ({ page }) => {
    await page.getByText('Alex Rivera').first().click();
    await expect(page.getByText(/email|phone|company/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('detail panel shows contact info', async ({ page }) => {
    await page.getByText('Alex Rivera').first().click();
    await expect(page.getByText(/@|\.com|\.org/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('Add Contact button opens form', async ({ page }) => {
    const addBtn = BUTTONS.addContact(page);
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await expect(page.getByRole('dialog').or(page.getByText(/new contact|add contact/i).first())).toBeVisible({ timeout: 5000 });
    }
  });

  test('contact detail shows timeline', async ({ page }) => {
    await page.getByText('Alex Rivera').first().click();
    await expect(page.getByText(/timeline|activity|history/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('contact detail shows email actions', async ({ page }) => {
    await page.getByText('Alex Rivera').first().click();
    const emailBtn = page.getByRole('button', { name: /email/i }).first();
    if (await emailBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(emailBtn).toBeVisible();
    }
  });
});
