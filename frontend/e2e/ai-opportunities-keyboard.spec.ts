import { expect, test } from '@playwright/test'

test('keyboard interaction in AI opportunities claims flow', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'AI Opportunities' }).click()
  await page.getByRole('button', { name: 'Ask My Claims' }).click()

  await page
    .getByRole('button', { name: 'Show all claims for diabetes management in Q4 2024' })
    .click()

  const sqlToggle = page.getByRole('button', { name: 'Generated SQL' })
  await expect(sqlToggle).toBeVisible()
  await sqlToggle.focus()
  await page.keyboard.press('Enter')

  await expect(page.getByText('SELECT c.claim_id')).toBeVisible()
})
