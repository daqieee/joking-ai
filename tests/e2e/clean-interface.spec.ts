import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('clean interface keeps theatre collapsed, supports switching and persists the choice', async ({
  page,
}) => {
  await page.goto('./')
  await expect(page.getByRole('button', { name: '纯净版', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.locator('.clean-welcome')).toBeVisible()
  await page.getByRole('button', { name: /^选择模型：/ }).click()
  await page.getByRole('option', { name: /^TeapotGPT/ }).click()
  await page.getByRole('textbox', { name: '消息', exact: true }).fill('帮我把周一变成周五')
  await page.getByRole('button', { name: '发送消息', exact: true }).click()
  const pending = page.locator('.pending-message .clean-stage')
  await expect(pending).toBeVisible()
  await expect(pending).not.toHaveAttribute('open')
  const completed = page.locator('.assistant-message:not(.pending-message) .clean-stage')
  await expect(completed).toBeVisible({ timeout: 20000 })
  await expect(completed).not.toHaveAttribute('open')
  await expect(page.locator('.stage-scene')).toHaveCount(0)
  await completed.locator('summary').click()
  await expect(completed).toHaveAttribute('open')
  await expect(completed.getByText('以上为预设娱乐台词，不是模型思维链。')).toBeVisible()
  await completed.locator('summary').click()
  await expect(completed).not.toHaveAttribute('open')
  await page.reload()
  await expect(page.getByRole('button', { name: '纯净版', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(completed).not.toHaveAttribute('open')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(
    results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  ).toEqual([])
  await page.getByRole('button', { name: '经典版', exact: true }).click()
  await expect(page.locator('.stage-scene')).toBeVisible()
  await page.getByRole('button', { name: '纯净版', exact: true }).click()
  await expect(completed).not.toHaveAttribute('open')
})

for (const saved of ['clean', 'classic', 'invalid']) {
  test(`respects saved interface choice: ${saved}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('joking-ai.interface', value), saved)
    await page.goto('./')
    await expect(
      page.getByRole('button', { name: saved === 'classic' ? '经典版' : '纯净版', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true')
  })
}

test('defaults to clean when browser storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException('Storage disabled', 'SecurityError')
    }
  })
  await page.goto('./')
  await expect(page.getByRole('button', { name: '纯净版', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: '经典版', exact: true }).click()
  await expect(page.getByRole('button', { name: '经典版', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('remembers an explicit classic choice after reloading', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '经典版', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: '经典版', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})
