import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('axiomlab.mirror', JSON.stringify({
      version: 1,
      createdAt: Date.now(),
      onboarded: true,
      profile: {},
      settings: {},
      events: [],
    }))
  })
})

test('a real reasoning case can be committed and resolved', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Reasoning Workbench Bring/ }).click()
  await page.getByRole('button', { name: 'Start a reasoning case' }).click()

  await page.getByLabel('What claim are you evaluating?').fill('Did the new signup form cause the conversion drop?')
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByLabel(/What did you directly observe/).fill('Conversions fell 12%\nTraffic volume was unchanged')
  await page.getByLabel(/What are you inferring/).fill('The new form may be blocking some users')
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByLabel(/Alternatives/).fill('The form introduced friction\nThe traffic mix changed')
  await page.getByLabel(/What assumptions/).fill('Analytics events are firing correctly')
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByLabel(/What next check/).fill('Compare completion by browser before and after the release.')
  await page.getByLabel('Your current conclusion or next move').fill('Inspect browser completion before reverting.')
  await page.getByRole('button', { name: 'Commit this reasoning' }).click()

  await expect(page.getByText('Committed', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Review reasoning' }).click()
  await expect(page.getByRole('heading', { name: 'Did the new signup form cause the conversion drop?' })).toBeVisible()
  await expect(page.getByText('Locked at commitment so the original reasoning cannot be rewritten after the outcome.')).toBeVisible()
  await page.getByRole('button', { name: 'Back to cases' }).click()

  await page.getByRole('button', { name: 'Resolve outcome' }).click()
  await page.getByRole('radio', { name: 'Held up' }).click()
  await page.getByLabel('What actually happened?').fill('The browser split exposed a Safari-only form failure.')
  await page.getByLabel(/What should future-you update/).fill('Check segmented completion before blaming traffic quality.')
  await page.getByRole('button', { name: 'Save outcome' }).click()

  await expect(page.getByText('Resolved', { exact: true })).toBeVisible()
  await expect(page.getByText(/Safari-only form failure/)).toBeVisible()
})

