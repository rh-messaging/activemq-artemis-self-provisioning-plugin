import { test, expect } from '@playwright/test';
import { login } from '../fixtures/auth';

const username = 'kubeadmin';
const password = process.env.KUBEADMIN_PASSWORD || 'kubeadmin';

test.describe('Create Restricted Broker via UI', () => {
  test('logs in, navigates to brokers, enables restricted mode and verifies create button is disabled', async ({
    page,
  }) => {
    // Login
    await login(page, username, password);

    // Navigate to all-namespaces brokers page
    await page.goto('/k8s/all-namespaces/brokers', {
      waitUntil: 'load',
    });
    await page.waitForLoadState('domcontentloaded');

    // Ensure Brokers page loaded - wait for heading
    await expect(
      page.locator('h1, [data-test="resource-title"]', { hasText: /Brokers/i }),
    ).toBeVisible({ timeout: 30000 });

    // Click Create Broker (button or anchor)
    const createBrokerButton = page
      .locator('button, a')
      .filter({ hasText: /^Create Broker$/i })
      .first();
    await createBrokerButton.scrollIntoViewIfNeeded();
    await createBrokerButton.click();

    // Wait for the form to load
    await page.waitForLoadState('domcontentloaded');

    // Fill CR Name with a unique value
    const brokerName = `e2e-restricted-broker-${Date.now()}`;
    const nameInput = page.locator(
      '#horizontal-form-name, input[name="horizontal-form-name"]',
    );
    await expect(nameInput).toBeVisible();
    await nameInput.clear();
    await nameInput.fill(brokerName);

    // Wait for the form to be fully loaded by checking for the "Restricted mode" label
    await expect(page.locator('text=Restricted mode')).toBeVisible({
      timeout: 10000,
    });

    // Find the restricted mode switch - it's an input with id="restricted-mode"
    const restrictedSwitch = page.locator(
      'input#restricted-mode[type="checkbox"]',
    );

    // Scroll into view and wait for it to be visible
    await restrictedSwitch.scrollIntoViewIfNeeded();
    await expect(restrictedSwitch).toBeVisible({ timeout: 10000 });

    // Verify switch is initially unchecked
    await expect(restrictedSwitch).not.toBeChecked();

    // Click the label associated with the switch (more reliable than clicking the input directly)
    const switchLabel = page.locator('label[for="restricted-mode"]');
    await switchLabel.click();

    // Wait for confirmation modal to appear
    await expect(
      page.locator('text=/Switch to\\/from restricted mode?/i'),
    ).toBeVisible({ timeout: 10000 });

    // Verify the warning message is displayed
    await expect(
      page.locator(
        'text=/Enabling\\/disabling the restricted mode will reinitialize your settings/i',
      ),
    ).toBeVisible();

    // Click the Continue button to confirm
    const continueButton = page
      .locator('button.pf-m-danger')
      .filter({ hasText: /Continue/i });
    await expect(continueButton).toBeVisible();
    await continueButton.click();

    // Wait for modal to close
    await expect(
      page.locator('text=/Switch to\\/from restricted mode?/i'),
    ).not.toBeVisible({ timeout: 10000 });

    // Verify the switch is now checked
    await expect(restrictedSwitch).toBeChecked({ timeout: 5000 });

    // Verify that the Create button is disabled when restricted mode is enabled
    // This is because restricted brokers cannot be created yet (as per areMandatoryValuesSetRestricted returning false)
    const createButton = page
      .locator('button')
      .filter({ hasText: /^Create$/i })
      .first();

    await expect(createButton).toBeDisabled();

    // Verify that the version selector is also disabled in restricted mode
    const versionSelect = page.locator('select[aria-label="FormSelect Input"]');
    await expect(versionSelect).toBeDisabled();
  });
});
