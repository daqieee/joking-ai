# Joking AI — 本地接续说明

请先阅读本文件、[README.md](README.md) 与[模型集成说明](docs/model-integration.md)。项目是外观专业、内容搞笑的中文 AI 聊天网站；本轮只保留三款模型，实际验收状态集中记录在模型集成说明中。

## 当前实现

- 技术栈：React 19、TypeScript、Vite、Lucide；Vitest、Playwright、axe 和 Prettier 用于验证。
- 风格：浅色工作台、鼠尾草绿点缀、响应式侧栏与中文整活文案。
- 仅三款模型：鹈鹕 PRO（`pelican-pro`）、随机数模型（`random-number`）、TeapotGPT（`teapot-gpt`）；默认鹈鹕 PRO / 中。旧四个人格不能再选择，旧记录保留原 modelId 并标为“已移除模型”。
- 三款各有七档，前六档是本地预设阶段与动画，第七档“拟真”才在发送时加载 GGUF / WASM；只选择拟真不会下载。
- 鹈鹕前六档最终返回同一份 `src/assets/pelican.html`，打包后可通过“预设文件”链接访问同站静态文件；输入与档位不能修改最终 HTML。随机前六档用 `crypto.getRandomValues` 和拒绝采样，Teapot 前六档使用同一条 418 预设回复。档位差别集中在伪过程和动画复杂度。
- 浏览器实际推理使用 wllama / llama.cpp 的 CPU 单线程 Worker，无后端或模型密钥。适配普通 GitHub Pages，不要求 COOP/COEP 响应头。
- 鹈鹕拟真使用 167,846,208 字节的上游 v2 权重，revision 固定为 `6981d554c08a3727d960c9dbbd345af887f643e9`；旧卡 63,617 字节、28,472 token 和 32K 建议不代表当前 v2 实测。只声明已经测得的能力。生成 HTML 用无脚本、无网络的隔离 iframe 预览，CSS 转义也不能注入 meta refresh。
- 随机数最终正文只含 0～100 的整数，阶段文案保存在独立元数据中。
- Teapot 上游是 MIT 许可的规则与词库应用，没有神经模型权重。本站拟真为独立手写的 102,016 字节 GGUF，真实前向计算输出 `418` 拒绝，未训练、不具备语义理解，不能称为上游 Teapot 模型。
- 聊天记录保存在当前浏览器 `localStorage`，支持恢复、搜索和删除；保存模型、档位、内容格式与执行模式。切换、新建对话或停止生成会使旧请求失效。
- Vite base 必须保持 `/joking-ai/`，用于 GitHub Pages 仓库子路径。
- 本站原创部分采用根目录 `LICENSE` 的 MIT；`NOTICE` 单独记录本站许可范围与鹈鹕归属。`/joking-ai/licenses/` 以 `src/config/licenses.ts` 列出三款模型来源、本站 Teapot、运行时和图标的版权及完整许可，Lucide ISC 与 Feather MIT 一并保留。新增资源时同步该表、`THIRD_PARTY_NOTICES.md` 与必要的 `NOTICE`；查看许可证页不会加载模型。

## 本地运行

安装 Node.js 24（至少 22.12），在本目录运行：

```bash
npm ci
npm run dev
```

应用路径是 `/joking-ai/`。不需要 `.env` 或 API Key。实际推理首次下载需要网络；下载来源、精确大小、校验及许可由 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 说明。

## 验证

```bash
npm test
npm run test:models
npm run build
npx playwright install chromium
npm run test:e2e
npm run format:check
```

端到端测试使用生产构建，所以先运行 build。Linux 缺少浏览器依赖时可用 `npx playwright install --with-deps chromium`；已有兼容 Chromium 时可通过 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定路径。

原有 11 条基础回归已迁移到三款模型，扩展测试另有 10 条，桌面和 Pixel 7 参数模拟合计 42 项。覆盖仅三款可选、七档、18 种模拟组合零 GGUF / WASM / wllama 及模型域名请求、六档静态 HTML 字节一致、安全 iframe（包括 CSS 转义 meta refresh）、元数据刷新恢复、真实下载失败/取消后再次真实生成，以及 320px / axe。故障请求可被拦截，成功推理须放行真实 GGUF，不能用 mock 代替。

浏览器产物写入 `test-results/playwright/`，独立真实推理写入 `test-results/inference/`；不要让 Playwright 默认清空整个 `test-results/`。使用 `node scripts/smoke-inference.mjs` 验证微型模型，`--pelican` 检查实际鹈鹕权重。若环境限制系统临时目录，可把当前命令的 TEMP / TMP 指向项目内 `node_modules/.cache/vitest-temp/`；不要修改全局环境变量。

此前压缩包里的“11 单元测试、22 浏览器测试通过”是第一阶段迁移前的记录，不能替代本轮验收。当前真实通过项与未验证内容见[模型集成说明的验收结果](docs/model-integration.md#本站验收结果)。

2026-10-24 最终已通过 30 项单元测试、42 项桌面 / 手机 E2E、最终进度文案调整后的 4 项真实重试 / 取消恢复复核、模型资源校验与生产构建。鹈鹕真实权重已验证部分 HTML 输出和停止后恢复；尚未完成整页、30K 输出、32K 长序列或远程权重全量下载验收。

## Git 与部署

目标仓库为 [daqieee/joking-ai](https://github.com/daqieee/joking-ai)，正式地址为 [Joking AI](https://daqieee.github.io/joking-ai/)。GitHub Pages 的 Source 已是 GitHub Actions，工作流 `.github/workflows/deploy.yml` 先执行检查，再部署 `dist/`。2026-10-24 的[发布运行 40048570024](https://github.com/daqieee/joking-ai/actions/runs/40048570024) 中 `verify` 与 `deploy` 均成功。正式站点已人工验收首页、鹈鹕“中”档模拟与预设静态文件、首页卡片模型联动、七档菜单；随机数拟真实际输出 `89` 并显示 GGUF 标识，Teapot 拟真完整输出 `418 · I'm a teapot.` 及中文自制权重说明，刷新后消息、模型与拟真元数据保持。详细范围见[线上发布验收](docs/model-integration.md#线上发布验收)，不包含鹈鹕远程权重全量下载或完整 HTML 生成。

如果从旧压缩包恢复，注意压缩包不携带 `.git`，不要覆盖克隆仓库的 Git 元数据。旧 `EXPORT_MANIFEST.json` 仅用于核对第一阶段压缩包，后续修改不再与其哈希一致。

2026-10-23 接续时本目录没有 `.git`，远端 `main` 为 `fcbe3398a8fc6b82eee8e7e7be6563cebf534cdc`，只有 README。2026-10-24 已接续原历史并提交、推送实现提交 `00c4929033938e4bd70e62933ed891e7bb54837d`，该实现已经部署。保留远端历史的恢复方案与本轮发布记录见[发布记录](docs/release-plan.md)。最终截图与机器可读 E2E 报告保存在 `handoff/validation/`，旧 `handoff/screenshots/` 属于早期版本，交接产物由 `.gitignore` 排除。
