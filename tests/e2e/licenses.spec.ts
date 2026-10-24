import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import type { Page } from '@playwright/test'

async function openSidebar(page: Page) {
  const menu = page.getByRole('button', { name: '打开侧边栏', exact: true })
  if (await menu.isVisible()) await menu.click()
}

test('opens licenses from the sidebar and returns to the saved conversation', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: /^选择模型：/ }).click()
  await page.getByRole('option', { name: /^TeapotGPT/ }).click()
  await page.getByRole('button', { name: /^推理强度：/ }).click()
  await page
    .getByRole('listbox', { name: '推理强度', exact: true })
    .getByRole('option')
    .first()
    .click()
  await page.getByRole('textbox', { name: '消息', exact: true }).fill('认真保留这一段脑洞')
  await page.getByRole('button', { name: '发送消息', exact: true }).click()
  await expect(page.getByRole('article', { name: 'TeapotGPT的回复', exact: true })).toBeVisible()
  const stored = await page.evaluate(() => localStorage.getItem('joking-ai.chats.v1'))

  await openSidebar(page)
  const entry = page.locator('aside').getByRole('link', { name: '开源许可', exact: true })
  await expect(entry).toHaveAttribute('href', '/joking-ai/licenses/')
  await entry.click()
  await expect(page).toHaveURL(/\/joking-ai\/licenses\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('开源许可与版权')
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('开源许可与版权')
  await page.locator('header').getByRole('link', { name: '返回聊天', exact: true }).click()
  await expect(page).toHaveURL(/\/joking-ai\/$/)
  await expect(page.locator('.user-message-content')).toHaveText('认真保留这一段脑洞')
  await expect(page.getByRole('article', { name: 'TeapotGPT的回复', exact: true })).toContainText(
    '418',
  )
  expect(await page.evaluate(() => localStorage.getItem('joking-ai.chats.v1'))).toBe(stored)
})

test('direct access and refresh show complete attributions without loading model runtimes', async ({
  page,
}, testInfo) => {
  const forbiddenRequests: string[] = []
  const errors: string[] = []
  const failedResources: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 400) failedResources.push(response.url())
  })
  page.on('request', (request) => {
    if (/\.(?:gguf|wasm)(?:\?|$)|\/wllama|\/inference[^/]*\.js(?:\?|$)/i.test(request.url())) {
      forbiddenRequests.push(request.url())
    }
  })
  const response = await page.goto('licenses/')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle('开源许可与版权 — Joking AI')
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('开源许可与版权')
  expect(await page.locator('script[type="module"]').getAttribute('src')).toMatch(
    /^\/joking-ai\/assets\/licenses-[\w-]+\.js$/,
  )

  await page.getByText('查看本站 MIT 许可全文', { exact: true }).click()
  await expect(page.locator('#site-license pre')).toContainText('Permission is hereby granted')
  await expect(page.locator('#site-license pre')).toContainText('Joking AI contributors')
  const pelican = page.locator('#project-pelican-pro')
  await expect(pelican).toContainText('Apache-2.0')
  await expect(pelican).toContainText('0v0ai')
  await pelican.getByText('Apache License 2.0 全文', { exact: true }).click()
  await expect(pelican.locator('pre').first()).toBeVisible()
  await expect(pelican.locator('pre').first()).toContainText('END OF TERMS AND CONDITIONS')
  const lucide = page.locator('#project-lucide-react')
  await expect(lucide.locator('.license-badge')).toHaveText(/ISC.*MIT/)
  await expect(lucide).toContainText('Cole Bemis')
  await expect(lucide).toContainText('Lucide Contributors')
  await lucide.getByText('Lucide ISC License 全文', { exact: true }).click()
  await lucide.getByText('Feather 来源部分 MIT License 全文', { exact: true }).click()
  await expect(lucide.locator('pre').first()).toBeVisible()
  await expect(lucide.locator('pre').first()).toContainText('Permission to use, copy, modify')
  await expect(lucide.locator('pre').last()).toBeVisible()
  await expect(lucide.locator('pre').last()).toContainText('Copyright (c) Cole Bemis 2013-2022')
  await expect(lucide.locator('pre').last()).toContainText('Permission is hereby granted')
  await lucide.screenshot({
    path: `handoff/validation/licenses-lucide-${testInfo.project.name}.png`,
  })
  await expect(page.locator('#pelican-notice pre')).toBeVisible()
  await expect(page.locator('#pelican-notice pre')).toContainText('0v0ai')
  await expect(page.locator('#pelican-notice pre')).toContainText('Apache')
  await expect(page.getByRole('link', { name: '下载 NOTICE', exact: true })).toHaveAttribute(
    'download',
    'NOTICE',
  )
  await page.locator('#pelican-notice').screenshot({
    path: `handoff/validation/licenses-notice-${testInfo.project.name}.png`,
  })

  expect(forbiddenRequests).toEqual([])
  expect(errors).toEqual([])
  expect(failedResources).toEqual([])
  // Capture the useful default layout, with the full legal documents collapsed.
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.evaluate(() => scrollTo(0, 0))
  await page.screenshot({
    path: `handoff/validation/licenses-${testInfo.project.name}.png`,
  })
})

test('serves the original license documents as exact standalone text files', async ({
  request,
}) => {
  const files = [
    { url: 'LICENSE', source: 'LICENSE' },
    { url: 'NOTICE', source: 'NOTICE' },
    { url: 'THIRD_PARTY_NOTICES.md', source: 'THIRD_PARTY_NOTICES.md' },
    {
      url: 'models/LICENSE-pelican-Apache-2.0.txt',
      source: 'public/models/LICENSE-pelican-Apache-2.0.txt',
    },
  ]
  for (const file of files) {
    const response = await request.get(file.url)
    expect(response.status(), file.url).toBe(200)
    expect(response.headers()['content-type'], file.url).not.toContain('text/html')
    expect(await response.text(), file.url).toBe(await readFile(file.source, 'utf8'))
  }
  expect(existsSync('dist/examples/teapot/index.html')).toBe(false)
})

test('keeps the 320px license page and expanded legal texts accessible without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('licenses/')
  await page.evaluate(() => {
    document.querySelectorAll('details').forEach((details) => {
      details.open = true
    })
  })
  const violations = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(
    violations.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
    })),
  ).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const textOverflows = await page
    .locator('pre')
    .evaluateAll((blocks) =>
      blocks
        .filter((block) => block.scrollWidth > block.clientWidth)
        .map((block) => block.textContent?.slice(0, 70)),
    )
  expect(textOverflows).toEqual([])
  await page
    .getByRole('navigation', { name: '许可页目录' })
    .getByRole('link', { name: '原始文件' })
    .click()
  await expect(page).toHaveURL(/#original-files$/)
  await expect(page.getByRole('heading', { name: '原始文件', exact: true })).toBeInViewport()
})
