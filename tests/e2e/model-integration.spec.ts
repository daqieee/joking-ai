import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'

const modelCases = [
  {
    id: 'pelican-pro',
    name: '鹈鹕 PRO',
    levels: ['瘦', '中', '肥', '很肥', '特别肥', '超级无敌肥', '拟真'],
  },
  {
    id: 'random-number',
    name: '随机数模型',
    levels: ['随机', '很随机', '极其随机', '绝对随机', '量子随机', '命运的骰子', '拟真'],
  },
  {
    id: 'teapot-gpt',
    name: 'TeapotGPT',
    levels: ['温水', '微沸', '沸腾', '高压', '锅炉超频', '宇宙茶道', '拟真'],
  },
] as const

const ggufPattern = /\.gguf(?:\?|$)/i
const modelResourcePattern =
  /\.(?:gguf|wasm)(?:\?|$)|wllama|huggingface\.co|\bhf\.co|xethub|cdn-lfs|raw\.githubusercontent\.com/i
const resourcesByPage = new WeakMap<Page, string[]>()

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

async function start(page: Page, prompt: string) {
  await page.getByRole('textbox', { name: '消息', exact: true }).fill(prompt)
  await page.getByRole('button', { name: '发送消息', exact: true }).click()
}

async function waitForReply(page: Page, count: number, timeout = 15_000) {
  await expect(page.locator('.assistant-message:not(.pending-message)')).toHaveCount(count, {
    timeout,
  })
  await expect(page.getByRole('button', { name: '停止生成', exact: true })).toHaveCount(0)
}

async function snapshot(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('joking-ai.chats.v1')!))
}

test.beforeEach(async ({ page }) => {
  const resources: string[] = []
  resourcesByPage.set(page, resources)
  page.on('request', (request) => {
    if (modelResourcePattern.test(request.url())) resources.push(request.url())
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
})

test('offers only three models, their seven levels, and preserves level ids and drafts', async ({
  page,
}) => {
  const input = page.getByRole('textbox', { name: '消息', exact: true })
  await input.fill('这是跨模型保留的草稿')
  await page.getByRole('button', { name: /^选择模型：/ }).click()
  const models = page.getByRole('listbox', { name: '选择模型', exact: true })
  await expect(models.getByRole('option')).toHaveCount(3)
  for (const oldName of ['杠精 Pro', '废话大师', '职场嘴替', '猫言猫语']) {
    await expect(models.getByRole('option', { name: new RegExp(oldName) })).toHaveCount(0)
  }
  await page.keyboard.press('Escape')
  for (const model of modelCases) {
    await selectModel(page, model.name)
    await page.getByRole('button', { name: /^推理强度：/ }).click()
    const options = page.getByRole('listbox', { name: '推理强度', exact: true }).getByRole('option')
    await expect(options).toHaveCount(7)
    for (const [index, label] of model.levels.entries()) {
      await expect(options.nth(index).locator('strong')).toContainText(label)
    }
    await page.keyboard.press('Escape')
    await expect(input).toHaveValue('这是跨模型保留的草稿')
  }
  await selectLevel(page, 2)
  await selectModel(page, '鹈鹕 PRO')
  await expect(page.getByRole('button', { name: '推理强度：肥', exact: true })).toBeVisible()
  await selectModel(page, '随机数模型')
  await expect(page.getByRole('button', { name: '推理强度：极其随机', exact: true })).toBeVisible()
  await selectLevel(page, 5)
  await selectModel(page, 'TeapotGPT')
  await expect(page.getByRole('button', { name: '推理强度：宇宙茶道', exact: true })).toBeVisible()
  await selectLevel(page, 6)
  await selectModel(page, '鹈鹕 PRO')
  await expect(page.getByRole('button', { name: '推理强度：拟真', exact: true })).toBeVisible()
  expect(resourcesByPage.get(page)).toEqual([])
  await expect(input).toHaveValue('这是跨模型保留的草稿')
  await expect(page.locator('.user-message')).toHaveCount(0)
})

for (const model of modelCases) {
  test(`${model.name}: all six simulated levels finish without model resources or model-domain requests`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000)
    const modelRequests = resourcesByPage.get(page)!
    if (model.id === 'random-number') {
      await page.addInitScript(() => {
        const original = crypto.getRandomValues.bind(crypto)
        let calls = 0
        Object.defineProperty(window, '__randomSourceCalls', { get: () => calls })
        crypto.getRandomValues = ((array: Uint32Array) => {
          calls += 1
          return original(array)
        }) as typeof crypto.getRandomValues
      })
      await page.reload()
    }
    await selectModel(page, model.name)
    for (let index = 0; index < 6; index += 1) {
      await selectLevel(page, index)
      await start(page, `为${model.levels[index]}档整一个活`)
      if (index > 0) {
        await expect(page.locator('.simulation-stage').last()).toBeVisible()
        await expect(page.locator('.simulation-stage').last()).toHaveAttribute(
          'data-level',
          String(index + 1),
        )
        await expect(page.getByText('模拟演出 · 非真实推理', { exact: true }).last()).toBeVisible()
      }
      if (index === 5) {
        await page.screenshot({
          path: testInfo.outputPath(`${model.id}-simulation-stage.png`),
          fullPage: true,
        })
      }
      await waitForReply(page, index + 1)
      const reply = page.locator('.assistant-message:not(.pending-message)').last()
      await expect(reply.locator('.message-mode')).toHaveText(model.levels[index])
      await expect(reply.locator('.mock-label')).toContainText('MOCK')
      if (model.id === 'random-number') {
        await expect(reply.locator('.message-text')).toHaveText(/^(?:100|[1-9]?\d)$/)
      } else if (model.id === 'pelican-pro') {
        const preview = reply.locator('iframe[title="鹈鹕 HTML 预览"]')
        await expect(preview).toHaveAttribute('sandbox', '')
        await expect(preview).toHaveAttribute('srcdoc', /鹈鹕/)
      } else {
        await expect(reply.locator('.message-text')).toContainText('418')
      }
    }
    expect(modelRequests).toEqual([])
    const saved = await snapshot(page)
    const messages = saved.conversations[0].messages.filter(
      (message: { role: string }) => message.role === 'assistant',
    )
    expect(messages).toHaveLength(6)
    expect(messages.map((message: { reasoningId: string }) => message.reasoningId)).toEqual([
      'low',
      'medium',
      'high',
      'extra',
      'extreme',
      'absurd',
    ])
    expect(messages.every((message: { modelId: string }) => message.modelId === model.id)).toBe(
      true,
    )
    expect(
      messages.every((message: { provider: string }) => message.provider === 'simulation'),
    ).toBe(true)
    expect(
      messages.every(
        (message: { format: string }) =>
          message.format === (model.id === 'pelican-pro' ? 'html' : 'text'),
      ),
    ).toBe(true)
    expect(
      messages
        .slice(1)
        .every(
          (message: { stage?: { simulated: boolean; steps: string[] } }) =>
            message.stage?.simulated === true && message.stage.steps.length > 0,
        ),
    ).toBe(true)
    if (model.id === 'random-number') {
      expect(
        messages.every((message: { content: string }) =>
          /^(?:100|[1-9]?\d)$/.test(message.content),
        ),
      ).toBe(true)
      expect(
        await page.evaluate(
          () => (window as unknown as { __randomSourceCalls: number }).__randomSourceCalls,
        ),
      ).toBeGreaterThanOrEqual(6)
    } else if (model.id === 'pelican-pro') {
      const contents = messages.map((message: { content: string }) => message.content)
      expect(new Set(contents).size).toBe(1)
      const href = await page
        .getByRole('link', { name: /预设文件/ })
        .last()
        .getAttribute('href')
      expect(href).toMatch(/^\/joking-ai\/assets\/[^/]+\.html$/)
      const preset = await page.request.get(href!)
      expect(preset.status()).toBe(200)
      expect(preset.headers()['content-type']).toContain('text/html')
      expect(await preset.body()).toEqual(Buffer.from(contents[0], 'utf8'))
    } else {
      expect(new Set(messages.map((message: { content: string }) => message.content)).size).toBe(1)
    }
    await page.reload()
    await expect(
      page.getByRole('button', { name: `选择模型：${model.name}`, exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: `推理强度：${model.levels[5]}`, exact: true }),
    ).toBeVisible()
    await expect(page.locator('.assistant-message:not(.pending-message)')).toHaveCount(6)
    await expect(page.locator('.assistant-message').last().locator('.message-mode')).toHaveText(
      model.levels[5],
    )
    const restored = await snapshot(page)
    expect(
      restored.conversations[0].messages.filter(
        (message: { role: string }) => message.role === 'assistant',
      ),
    ).toEqual(messages)
    if (model.id === 'pelican-pro') {
      await expect(page.locator('iframe[title="鹈鹕 HTML 预览"]')).toHaveCount(6)
      await page.screenshot({ path: testInfo.outputPath('pelican-simulated.png'), fullPage: true })
    }
    expect(modelRequests).toEqual([])
  })
}

test('keeps malicious restored HTML isolated and removes frame navigation and external resources', async ({
  page,
}) => {
  const externalRequests: string[] = []
  const dialogs: string[] = []
  page.on('request', (request) => {
    if (/unsafe-preview\.invalid|escape-preview/.test(request.url()))
      externalRequests.push(request.url())
  })
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message())
    await dialog.dismiss()
  })
  await page.evaluate(() => {
    const now = Date.now()
    const content = `<!doctype html><html><head>
      <meta http-equiv="refresh" content="0;url=https://unsafe-preview.invalid/refresh">
      <style>@import url('https://unsafe-preview.invalid/style');body{background:url('https://unsafe-preview.invalid/bg')}\\3c /style>\\3c meta http-equiv="refresh" content="0;url=/joking-ai/escape-preview"></style>
      </head><body><h1>安全预览测试</h1>
      <script>parent.document.body.dataset.compromised='yes';alert('executed')</script>
      <img src="https://unsafe-preview.invalid/image" onerror="alert('img')">
      <iframe src="https://unsafe-preview.invalid/frame"></iframe>
      <a href="https://unsafe-preview.invalid/navigation" target="_top">危险导航</a>
      <form action="https://unsafe-preview.invalid/form"><button type="submit">提交</button></form>
      <svg xmlns="http://www.w3.org/2000/svg" onload="alert('svg')"><a href="https://unsafe-preview.invalid/svg"><text>SVG导航</text></a></svg>
      </body></html>`
    localStorage.setItem(
      'joking-ai.chats.v1',
      JSON.stringify({
        version: 1,
        activeId: 'unsafe-html',
        modelId: 'pelican-pro',
        reasoningId: 'low',
        conversations: [
          {
            id: 'unsafe-html',
            title: '隔离测试',
            createdAt: now,
            updatedAt: now,
            modelId: 'pelican-pro',
            reasoningId: 'low',
            messages: [
              {
                id: 'html-response',
                role: 'assistant',
                content,
                createdAt: now,
                modelId: 'pelican-pro',
                reasoningId: 'low',
                format: 'html',
                provider: 'simulation',
              },
            ],
          },
        ],
      }),
    )
  })
  await page.reload()
  const preview = page.locator('iframe[title="鹈鹕 HTML 预览"]')
  await expect(preview).toBeVisible()
  await expect(preview).toHaveAttribute('sandbox', '')
  const srcdoc = await preview.getAttribute('srcdoc')
  expect(srcdoc).toMatch(/Content-Security-Policy/i)
  expect(srcdoc).toMatch(/default-src\s+'none'/)
  expect(srcdoc).not.toMatch(
    /<script\b|<iframe\b|<form\b|<meta\b[^>]*http-equiv=["']refresh|\bhref=["']https?:/i,
  )
  const frame = page.frameLocator('iframe[title="鹈鹕 HTML 预览"]')
  await expect(frame.locator('meta[http-equiv="refresh" i]')).toHaveCount(0)
  await expect(frame.getByRole('heading', { name: '安全预览测试' })).toBeVisible()
  await frame.getByText('危险导航', { exact: true }).click()
  await page.waitForTimeout(500)
  expect(new URL(page.url()).pathname).toBe('/joking-ai/')
  expect(
    page
      .frames()
      .filter((frame) => frame.parentFrame())
      .map((frame) => frame.url()),
  ).toEqual(['about:srcdoc'])
  expect(await preview.evaluate((node) => (node as HTMLIFrameElement).contentDocument)).toBeNull()
  expect(await page.locator('body').getAttribute('data-compromised')).toBeNull()
  expect(externalRequests).toEqual([])
  expect(dialogs).toEqual([])
})

test('discloses real-mode download size, reports failed downloads and allows a fresh generation', async ({
  page,
}) => {
  test.setTimeout(90_000)
  let downloads = 0
  await page.route(ggufPattern, async (route) => {
    downloads += 1
    await route.fulfill({ status: 503, body: 'intentional model-download failure' })
  })
  await selectModel(page, '随机数模型')
  await selectLevel(page, 6)
  await expect(page.getByRole('note').filter({ hasText: /GGUF/ })).toContainText(/\d.*(?:KB|MB|B)/i)
  expect(downloads).toBe(0)
  await start(page, '执行一次真正的数字推理')
  await expect.poll(() => downloads).toBeGreaterThan(0)
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: /下载|加载|模型|失败/ })
      .first(),
  ).toBeVisible({ timeout: 45_000 })
  await expect(page.getByRole('button', { name: '停止生成', exact: true })).toHaveCount(0)
  await expect(page.locator('.assistant-message:not(.pending-message)')).toHaveCount(0)
  await selectLevel(page, 0)
  await start(page, '失败后继续模拟')
  await waitForReply(page, 1)
  await expect(page.locator('.assistant-message .message-text')).toHaveText(/^(?:100|[1-9]?\d)$/)
  const saved = await snapshot(page)
  const replies = saved.conversations[0].messages.filter(
    (message: { role: string }) => message.role === 'assistant',
  )
  expect(replies).toHaveLength(1)
  expect(replies[0].reasoningId).toBe('low')
})

test('retries a failed real download with actual GGUF and WASM and restores its inference metadata', async ({
  page,
}) => {
  test.setTimeout(120_000)
  let allowDownload = false
  let failedRequests = 0
  let actualGgufResponses = 0
  page.on('response', (response) => {
    if (ggufPattern.test(response.url()) && response.ok()) actualGgufResponses += 1
  })
  await page.route(ggufPattern, async (route) => {
    if (allowDownload) await route.continue()
    else {
      failedRequests += 1
      await route.fulfill({ status: 503, body: 'intentional initial download failure' })
    }
  })
  await selectModel(page, '随机数模型')
  await selectLevel(page, 6)
  await start(page, '首次下载故意失败，提示词以数字结束123')
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: /下载|加载|模型|失败/ })
      .first(),
  ).toBeVisible({ timeout: 45_000 })
  expect(failedRequests).toBeGreaterThan(0)
  allowDownload = true
  await page.getByRole('button', { name: '重试生成', exact: true }).click()
  await waitForReply(page, 1, 60_000)
  expect(actualGgufResponses).toBeGreaterThan(0)
  expect(resourcesByPage.get(page)!.some((url) => /\.wasm(?:\?|$)/i.test(url))).toBe(true)
  const reply = page.locator('.assistant-message:not(.pending-message)')
  await expect(reply.locator('.message-text')).toHaveText(/^(?:100|[1-9]?\d)$/)
  await expect(reply.locator('.mock-label')).not.toContainText('MOCK')
  const saved = await snapshot(page)
  const assistant = saved.conversations[0].messages.find(
    (message: { role: string }) => message.role === 'assistant',
  )
  expect(assistant.provider).toBe('wllama')
  expect(assistant.reasoningId).toBe('real')
  expect(assistant.format).toBe('text')
  expect(
    saved.conversations[0].messages.filter((message: { role: string }) => message.role === 'user'),
  ).toHaveLength(1)
  await page.reload()
  await expect(page.getByRole('button', { name: '推理强度：拟真', exact: true })).toBeVisible()
  await expect(page.locator('.assistant-message .message-text')).toHaveText(assistant.content)
  await expect(page.locator('.assistant-message .mock-label')).not.toContainText('MOCK')
})

test('cancels a real download, isolates old progress after a new chat and can generate again', async ({
  page,
}) => {
  test.setTimeout(120_000)
  let downloads = 0
  let release = () => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(ggufPattern, async (route) => {
    downloads += 1
    if (downloads > 1) {
      await route.continue()
      return
    }
    await gate
    await route.fulfill({ status: 503, body: 'released obsolete request' }).catch(() => {})
  })
  try {
    await selectModel(page, '随机数模型')
    await selectLevel(page, 6)
    await start(page, '取消后不得写入')
    await expect.poll(() => downloads).toBe(1)
    await expect(page.locator('.pending-message')).toContainText(/GGUF|下载|推理/)
    await page.getByRole('button', { name: '停止生成', exact: true }).click()
    await expect(page.locator('.pending-message')).toHaveCount(0)
    await page.getByRole('button', { name: '新建对话', exact: true }).click()
    release()
    await start(page, '新对话再次执行真实推理')
    await waitForReply(page, 1, 60_000)
    await page.waitForTimeout(500)
    await expect(
      page.getByRole('alert').filter({ hasText: /released obsolete|下载失败/ }),
    ).toHaveCount(0)
    await expect(page.locator('.assistant-message .message-text')).toHaveText(/^(?:100|[1-9]?\d)$/)
    const saved = await snapshot(page)
    const old = saved.conversations.find((chat: { title: string }) =>
      chat.title.includes('取消后不得写入'),
    )
    expect(old.messages).toHaveLength(1)
    expect(old.messages[0].role).toBe('user')
    const active = saved.conversations.find((chat: { id: string }) => chat.id === saved.activeId)
    expect(active.messages[1].provider).toBe('wllama')
    expect(active.messages[1].reasoningId).toBe('real')
    await page.reload()
    await expect(page.locator('.assistant-message')).toHaveCount(1)
    await expect(page.locator('.user-message')).toHaveCount(1)
  } finally {
    release()
  }
})

test('switching chats cancels an active real download before an old error can affect the new chat', async ({
  page,
}) => {
  let started = false
  let release = () => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(ggufPattern, async (route) => {
    started = true
    await gate
    await route.abort('failed').catch(() => {})
  })
  try {
    await selectModel(page, '随机数模型')
    await selectLevel(page, 6)
    await start(page, '切走中的模型下载')
    await expect.poll(() => started).toBe(true)
    await page.getByRole('button', { name: '新建对话', exact: true }).click()
    release()
    await selectModel(page, 'TeapotGPT')
    await selectLevel(page, 0)
    await start(page, '这是新对话')
    await waitForReply(page, 1)
    await expect(page.getByRole('article', { name: 'TeapotGPT的回复', exact: true })).toContainText(
      '418',
    )
    const saved = await snapshot(page)
    const old = saved.conversations.find((chat: { title: string }) =>
      chat.title.includes('切走中的模型下载'),
    )
    expect(old.messages).toHaveLength(1)
    await expect(page.locator('.assistant-message')).toHaveCount(1)
  } finally {
    release()
  }
})

test('three-model menus, seven-level menus, lab and replies fit 320px without axe violations', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.getByRole('button', { name: /^选择模型：/ }).click()
  const models = page.getByRole('listbox', { name: '选择模型', exact: true })
  await expect(models.getByRole('option')).toHaveCount(3)
  const modelBox = await models.boundingBox()
  expect(modelBox!.x).toBeGreaterThanOrEqual(0)
  expect(modelBox!.x + modelBox!.width).toBeLessThanOrEqual(320)
  expect(modelBox!.y).toBeGreaterThanOrEqual(0)
  expect(modelBox!.y + modelBox!.height).toBeLessThanOrEqual(740)
  await page.screenshot({ path: testInfo.outputPath('models-menu-320.png'), fullPage: true })
  await models.getByRole('option', { name: /^TeapotGPT/ }).click()
  await page.getByRole('button', { name: /^推理强度：/ }).click()
  const levels = page.getByRole('listbox', { name: '推理强度', exact: true })
  await expect(levels.getByRole('option')).toHaveCount(7)
  const levelBox = await levels.boundingBox()
  expect(levelBox!.x).toBeGreaterThanOrEqual(0)
  expect(levelBox!.x + levelBox!.width).toBeLessThanOrEqual(320)
  expect(levelBox!.y).toBeGreaterThanOrEqual(0)
  expect(levelBox!.y + levelBox!.height).toBeLessThanOrEqual(740)
  await page.screenshot({ path: testInfo.outputPath('levels-menu-320.png'), fullPage: true })
  await levels.getByRole('option').last().scrollIntoViewIfNeeded()
  await expect(levels.getByRole('option').last()).toBeInViewport()
  await levels.getByRole('option').last().click()
  await expect(page.getByRole('button', { name: '推理强度：拟真', exact: true })).toBeVisible()
  await selectLevel(page, 4)
  await start(page, '来一杯咖啡')
  await waitForReply(page, 1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([])
  await page.screenshot({ path: testInfo.outputPath('models-320.png'), fullPage: true })
})
