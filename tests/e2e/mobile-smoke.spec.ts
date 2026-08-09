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

test('the mobile shell navigates and can build a daily session', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'First: find your starting line' })).toBeVisible()

  for (const tab of ['Practice', 'Path', 'Coach', 'Progress', 'Today']) {
    await page.getByRole('button', { name: tab, exact: true }).click()
    await expect(page.getByRole('button', { name: tab, exact: true })).toHaveAttribute('aria-current', 'page')
  }

  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: 'Math 8', exact: true }).click()
  await expect(page.getByText('California Grade 8 (CA CCSSM)', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await expect(page.getByRole('button', { name: /Get ready for Algebra I \(HS\)/ })).toBeVisible()
  await page.getByRole('button', { name: 'Today', exact: true }).click()

  await page.getByRole('button', { name: /Skip.*start a session conservatively/ }).click()
  await expect(page.getByRole('heading', { name: 'Quick check-in' })).toBeVisible()
  await page.getByRole('button', { name: 'Build my session' }).click()
  await expect(page.getByRole('button', { name: 'Begin' })).toBeVisible()

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  expect(errors).toEqual([])
})
