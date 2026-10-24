import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'

async function openSidebar(page: Page) {
  const menu = page.getByRole('button', { name: '打开侧边栏', exact: true })
  if (await menu.isVisible()) await menu.click()
}

async function selectModel(page: Page, name: string) {
  await page.getByRole('button', { name: /^选择模型：/ }).click()
  await page.getByRole('option', { name: new RegExp(`^${name}`) }).click()
}

async function selectLevel(page: Page, index: number) {
  await page.getByRole('button', { name: /^推理强度：/ }).click()
  await page
    .getByRole('listbox', { name: '推理强度', exact: true })
    .getByRole('option')
    .nth(index)
    .click()
}

async function send(page: Page, message: string) {
  const replies = page.locator('.assistant-message:not(.pending-message)')
  const previous = await replies.count()
  await page.getByRole('textbox', { name: '消息', exact: true }).fill(message)
  await page.getByRole('button', { name: '发送消息', exact: true }).click()
  await expect(replies).toHaveCount(previous + 1, { timeout: 15_000 })
  await expect(page.getByRole('button', { name: '停止生成', exact: true })).toHaveCount(0)
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
})

test('has no automatically detected WCAG A/AA violations in the main workflows', async ({
  page,
}) => {
  const scan = async () => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(
      results.violations.map((violation) => ({
        id: violation.id,
        nodes: violation.nodes.map((node) => ({
          target: node.target,
          summary: node.failureSummary,
        })),
      })),
    ).toEqual([])
  }
  await scan()
  await page.getByRole('button', { name: /^选择模型：/ }).click()
  await scan()
  await page.keyboard.press('Escape')
  await selectModel(page, 'TeapotGPT')
  await selectLevel(page, 0)
  await send(page, '帮我把周一变成周五')
  await scan()
  await openSidebar(page)
  await page.getByRole('button', { name: '模型实验室' }).click()
  await scan()
})

test('loads the production build at the Pages subpath without broken resources', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  const broken: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 400) broken.push(response.url())
  })
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('一本正经')
  await expect(page.getByText('模拟模式', { exact: true })).toBeVisible()
  expect(await page.locator('script[type="module"]').getAttribute('src')).toMatch(
    /^\/joking-ai\/assets\//,
  )
  expect((await page.request.get('favicon.svg')).status()).toBe(200)
  expect(errors).toEqual([])
  expect(broken).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('welcome.png'), fullPage: true })
})

test('sends a suggested prompt and restores the conversation after reload', async ({ page }) => {
  const input = page.getByRole('textbox', { name: '消息', exact: true })
  await expect(page.getByRole('button', { name: '发送消息' })).toBeDisabled()
  await selectModel(page, 'TeapotGPT')
  const firstBatch = await page.locator('.prompt-card .prompt-text').allTextContents()
  let suggestedText = ''
  for (let batch = 0; batch < 2; batch += 1) {
    const suggestions = page.locator('.prompt-card')
    await expect(suggestions).toHaveCount(4)
    for (const [index, model] of ['鹈鹕 PRO', '随机数模型', 'TeapotGPT', '随机数模型'].entries()) {
      if (index === 3) await selectModel(page, model)
      const suggestion = suggestions.nth(index)
      suggestedText = (await suggestion.locator('.prompt-text').textContent())!
      await suggestion.click()
      await expect(input).toHaveValue(suggestedText)
      await expect(input).toBeFocused()
      await expect(
        page.getByRole('button', { name: `选择模型：${model}`, exact: true }),
      ).toBeVisible()
      await expect(page.locator('.user-message')).toHaveCount(0)
    }
    if (batch === 0) {
      await page.getByRole('button', { name: '换一批', exact: true }).click()
      expect(await page.locator('.prompt-card .prompt-text').allTextContents()).not.toEqual(
        firstBatch,
      )
      await expect(input).toHaveValue(suggestedText)
      await expect(
        page.getByRole('button', { name: '选择模型：随机数模型', exact: true }),
      ).toBeVisible()
    }
  }
  await selectLevel(page, 0)
  await expect(input).toHaveValue(suggestedText)
  await page.getByRole('button', { name: '发送消息' }).click()
  const reply = page.getByRole('article', { name: '随机数模型的回复', exact: true })
  await expect(reply.locator('.message-text')).toHaveText(/^(?:100|[1-9]?\d)$/)
  await expect(input).toHaveValue('')
  await page.reload()
  await expect(page.locator('.user-message-content')).toHaveText(suggestedText)
  await expect(page.getByRole('article', { name: '随机数模型的回复', exact: true })).toHaveCount(1)
})

test('model and intensity selections change the stage and persist', async ({ page }) => {
  const input = page.getByRole('textbox', { name: '消息', exact: true })
  await input.fill('今天要上班吗')
  await selectModel(page, '随机数模型')
  await selectLevel(page, 5)
  await expect(input).toHaveValue('今天要上班吗')
  await expect(page.locator('.user-message')).toHaveCount(0)
  await send(page, '今天要上班吗')
  const reply = page.getByRole('article', { name: '随机数模型的回复', exact: true })
  await expect(reply.locator('.message-text')).toHaveText(/^(?:100|[1-9]?\d)$/)
  await expect(reply.locator('.message-mode')).toHaveText('命运的骰子')
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('joking-ai.chats.v1')!))
  expect(saved.conversations[0].messages[1].stage.steps.length).toBeGreaterThanOrEqual(6)
  await page.reload()
  await expect(page.getByRole('button', { name: '选择模型：随机数模型' })).toBeVisible()
  await expect(page.getByRole('button', { name: '推理强度：命运的骰子' })).toBeVisible()
})

test('creates, searches, reopens and deletes independent conversations', async ({ page }) => {
  await selectModel(page, 'TeapotGPT')
  await selectLevel(page, 0)
  await send(page, '第一段对话：周一不上班')
  await page.getByRole('button', { name: '新建对话', exact: true }).click()
  await send(page, '第二段对话：周五早点走')
  await openSidebar(page)
  await page.getByRole('textbox', { name: '搜索聊天记录' }).fill('周一')
  await expect(page.locator('.history-item')).toHaveCount(1)
  await page.getByRole('button', { name: '第一段对话：周一不上班', exact: true }).click()
  await expect(page.getByRole('article', { name: '你的消息', exact: true })).toContainText(
    '第一段对话',
  )
  await expect(page.getByRole('article', { name: '你的消息', exact: true })).not.toContainText(
    '第二段对话',
  )
  await openSidebar(page)
  await page.getByRole('button', { name: '清空搜索' }).click()
  const history = page.locator('.history-item').filter({ hasText: '第二段对话' })
  await history.hover()
  await history.getByRole('button', { name: /删除对话/ }).click()
  await page.reload()
  await openSidebar(page)
  await expect(page.locator('.history-item')).toHaveCount(1)
})

test('stops generation and prevents delayed replies from leaking into a new chat', async ({
  page,
}) => {
  await selectModel(page, 'TeapotGPT')
  await selectLevel(page, 5)
  await page.getByRole('textbox', { name: '消息', exact: true }).fill('这条回复不要生成')
  await page.getByRole('button', { name: '发送消息' }).click()
  await page.getByRole('button', { name: '停止生成' }).click()
  await expect(page.locator('.assistant-message')).toHaveCount(0)
  await page.getByRole('textbox', { name: '消息', exact: true }).fill('切走后也不要生成')
  await page.getByRole('button', { name: '发送消息' }).click()
  await page.getByRole('button', { name: '新建对话', exact: true }).click()
  // Wait beyond the longest authored simulation to catch a stale completion.
  await page.waitForTimeout(5500)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('.assistant-message')).toHaveCount(0)
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('joking-ai.chats.v1')!))
  expect(saved.conversations[0].messages).toHaveLength(2)
  expect(
    saved.conversations[0].messages.every((message: { role: string }) => message.role === 'user'),
  ).toBe(true)
})

test('supports multiline input, ignores IME Enter and blocks blank or overlong messages', async ({
  page,
}) => {
  await selectModel(page, 'TeapotGPT')
  await selectLevel(page, 0)
  const input = page.getByRole('textbox', { name: '消息', exact: true })
  await input.fill('   ')
  await expect(page.getByRole('button', { name: '发送消息' })).toBeDisabled()
  await input.fill('你好')
  await input.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', isComposing: true })
  await expect(page.locator('.user-message')).toHaveCount(0)
  await input.press('End')
  await input.press('Shift+Enter')
  await input.pressSequentially('world')
  await expect(input).toHaveValue('你好\nworld')
  await input.press('Enter')
  await expect(page.locator('.user-message-content')).toHaveText('你好\nworld')
  await expect(page.getByRole('article', { name: 'TeapotGPT的回复', exact: true })).toBeVisible()
  await input.fill('A'.repeat(4001))
  await expect(page.getByRole('button', { name: '发送消息' })).toBeDisabled()
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText('超出 4000 字限制')).toBeVisible()
  await input.fill(`${'A'.repeat(4000)} `)
  await input.press('Enter')
  await expect(input).toHaveValue(`${'A'.repeat(4000)} `)
  await expect(page.locator('.user-message')).toHaveCount(1)
})

test('shows user text literally and copies the exact local response', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await selectModel(page, 'TeapotGPT')
  await selectLevel(page, 0)
  await send(page, '<img src=x onerror=alert(1)>')
  await expect(page.locator('.user-message-content')).toHaveText('<img src=x onerror=alert(1)>')
  await expect(page.locator('.message img')).toHaveCount(0)
  const expected = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('joking-ai.chats.v1')!)
    return saved.conversations[0].messages[1].content as string
  })
  await page.getByRole('button', { name: '复制回复', exact: true }).click()
  await expect(page.getByText('已复制', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected)
})

test('opens the three-model lab, selects a model and exposes help', async ({
  page,
  context,
}, testInfo) => {
  await page.getByRole('button', { name: /3 位 整活搭子/ }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.lab-model-card')).toHaveCount(3)
  for (const oldName of ['杠精 Pro', '废话大师', '职场嘴替', '猫言猫语']) {
    await expect(dialog.getByRole('button', { name: new RegExp(oldName) })).toHaveCount(0)
  }
  for (const model of [
    {
      name: '鹈鹕 PRO',
      url: 'https://huggingface.co/0v0ai/0u0-pelican-pro-0.2B-GGUF',
      license: 'Apache-2.0',
    },
    {
      name: '随机数模型',
      url: 'https://github.com/lijie-gh/a-random-number-model',
      license: 'MIT',
    },
    {
      name: 'TeapotGPT',
      url: 'https://github.com/namishsaxena/teapot-gpt',
      license: 'MIT',
    },
  ]) {
    const card = dialog.locator('.lab-model-card').filter({ hasText: model.name })
    const source = card.getByRole('link', { name: `查看 ${model.name} 原项目（新标签页）` })
    await expect(source).toHaveAttribute('href', model.url)
    await expect(source).toHaveAttribute('target', '_blank')
    await expect(source).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(card.locator('.lab-card-source')).toContainText(`上游 · ${model.license}`)
    await context.route(model.url, (route) =>
      route.fulfill({ contentType: 'text/html', body: '<title>原项目</title>' }),
    )
    const [sourcePage] = await Promise.all([page.waitForEvent('popup'), source.click()])
    await expect(sourcePage).toHaveURL(model.url)
    await sourcePage.close()
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('.lab-model-card.is-selected h3')).toContainText('鹈鹕 PRO')
  }
  await dialog.evaluate((node) => {
    node.scrollTop = 0
  })
  await page.screenshot({
    path: `handoff/validation/lab-sources-${testInfo.project.name}.png`,
    fullPage: true,
  })
  await dialog.getByRole('button', { name: /TeapotGPT/ }).click()
  await expect(page.getByRole('button', { name: '选择模型：TeapotGPT' })).toBeVisible()
  await openSidebar(page)
  await page.getByRole('button', { name: '使用指南' }).click()
  await expect(page.getByRole('dialog')).toContainText('最多保留 50 段对话')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const mobileMenu = page.getByRole('button', { name: '打开侧边栏', exact: true })
  if (await mobileMenu.isVisible()) await expect(mobileMenu).toBeFocused()
  else await expect(page.getByRole('button', { name: '使用指南' })).toBeFocused()
})

test('recovers from corrupted storage and remains usable when persistence is denied', async ({
  page,
}) => {
  await page.evaluate(() => localStorage.setItem('joking-ai.chats.v1', 'corrupted'))
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    }
  })
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('浏览器暂时无法保存记录')
  await selectModel(page, 'TeapotGPT')
  await selectLevel(page, 0)
  await send(page, '存不了也要开心')
  await expect(page.getByRole('article', { name: 'TeapotGPT的回复', exact: true })).toContainText(
    '418',
  )
})

test('keeps the interface and both pickers within a narrow 320px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.getByRole('button', { name: /^选择模型：/ }).click()
  const modelBox = await page.getByRole('listbox', { name: '选择模型', exact: true }).boundingBox()
  expect(modelBox!.x).toBeGreaterThanOrEqual(0)
  expect(modelBox!.x + modelBox!.width).toBeLessThanOrEqual(320)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /^推理强度：/ }).click()
  const reasoningBox = await page
    .getByRole('listbox', { name: '推理强度', exact: true })
    .boundingBox()
  expect(reasoningBox!.x).toBeGreaterThanOrEqual(0)
  expect(reasoningBox!.x + reasoningBox!.width).toBeLessThanOrEqual(320)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.keyboard.press('Escape')
  await openSidebar(page)
  await expect(page.getByRole('dialog', { name: '对话侧边栏' })).toBeVisible()
  await expect(page.getByRole('button', { name: '收起侧边栏', exact: true })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('link', { name: 'Joking AI 首页' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: '打开侧边栏', exact: true })).toBeFocused()
})
