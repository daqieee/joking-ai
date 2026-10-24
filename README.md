# Joking AI

一本正经，胡说八道。A surprisingly serious platform for ridiculously unserious AI models.

中文整活聊天工作台，使用 React + TypeScript + Vite，可部署到 GitHub Pages，无需后端或 API Key。只提供鹈鹕 PRO、随机数模型与 TeapotGPT，分别有六档本地模拟和一档浏览器 GGUF 推理。界面明确区分 `MOCK` 与实际推理。

**想添加自己的搞笑 AI？** 从 [AI 接口与模型接入指南](docs/model-adapter-guide.md) 开始，运行 [TeapotGPT 开发示例](examples/teapot/index.html)，再按 [贡献指南](CONTRIBUTING.md) 提交 PR。指南包含当前浏览器 TypeScript API、累计回调、取消处理，以及新增模型需要修改的实际文件。

## 本地开发

需要 Node.js 22.12+，推荐 Node.js 24。项目固定在 `/joking-ai/` 子路径运行。

```bash
npm ci
npm run dev
```

工作台位于 `http://localhost:5173/joking-ai/`；Teapot 接口示例位于 `http://localhost:5173/joking-ai/examples/teapot/`，可直接试用模拟与真实 GGUF 推理。示例仅由 Vite 开发服务提供，当前生产构建不发布此页面。

生产构建与预览：

```bash
npm test
npm run test:models
npm run build
npm run preview
```

## 模型与档位

三款模型各有七档，默认选择“鹈鹕 PRO / 中”。前六档通过本地预设过程和动画增加仪式感，最终结果遵守同一规则；这些文案是娱乐演出，**不是模型思维链，也不下载或运行 GGUF / WASM**。

| 档位 | 鹈鹕 PRO   | 随机数模型 | TeapotGPT |
| ---- | ---------- | ---------- | --------- |
| 1    | 瘦         | 随机       | 温水      |
| 2    | 中         | 很随机     | 微沸      |
| 3    | 肥         | 极其随机   | 沸腾      |
| 4    | 很肥       | 绝对随机   | 高压      |
| 5    | 特别肥     | 量子随机   | 锅炉超频  |
| 6    | 超级无敌肥 | 命运的骰子 | 宇宙茶道  |
| 7    | 拟真       | 拟真       | 拟真      |

- **鹈鹕 PRO**：过程从骑行准备逐步升级到承重分析、结构警告、路线重规划与临界质量警告。前六档始终返回同一份[静态 HTML](src/assets/pelican.html)，预览下的“预设文件”链接可打开同站文件；输入和档位不会修改最终页面。拟真档加载 167,846,208 字节的上游 v2 GGUF，在浏览器中生成 HTML。预览使用隔离 iframe，禁止脚本与网络，支持查看和复制源代码。完整生成能力以实际验收记录为准。
- **随机数模型**：从直接掷数到概率分析、交叉验证、量子坍缩与命运推演；前六档通过 `crypto.getRandomValues` 与拒绝采样得到 0～100 的整数，最终正文只有数字。拟真档实际运行 425,888 字节的上游手写微型 GGUF，由其等概率 logits 和采样器选数；没有训练，不理解问题。
- **TeapotGPT**：从温水升至宇宙茶道，前六档固定返回同一条 HTTP 418 茶壶回复。上游是规则与词库应用，没有神经模型权重；本站拟真档是**自行手写的 102,016 字节 GGUF**，经 wllama 前向计算输出 `418` 拒绝。该模型并非上游模型，没有训练，不具备语义理解。

上游链接、采样设置、许可、实现边界与本机验收结果见 [模型集成说明](docs/model-integration.md)；第三方文件与许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 许可与第三方归属

本站原创代码、文档、静态预设与独立 Teapot 权重及生成器采用 [MIT License](LICENSE)，Copyright (c) 2026 Joking AI contributors。模型、图标与运行时分别沿用各自的许可；完整项目名称、版本、版权与许可正文见[第三方许可页](https://daqieee.github.io/joking-ai/licenses/)及 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。页面文本随站打包，打开它不会加载模型。

鹈鹕原始权重采用 Apache-2.0，本站提供许可全文及单独的 [NOTICE](NOTICE) 归属说明；Lucide 保留 ISC 通知，Feather 来源部分同时保留 MIT 通知。NOTICE 明确区分上游模型与本站六档静态预设，本站 MIT 不替换第三方条款。

## 浏览器内实际推理

选中“拟真”后，输入区会显示下载大小与运行说明；发送消息才开始下载。模型通过 wllama / llama.cpp 在 Worker 中执行 CPU 单线程推理，兼容 GitHub Pages 的普通静态托管。项目不依赖跨域隔离响应头、服务器模型进程或外部推理 API，也不把提示词发送给推理服务。

首次下载需要网络。模型来源不可达、CORS、浏览器能力或可用内存不足时会显示错误并提供重试；停止、新建或切换对话会取消本轮任务。加载失败不会伪装成拟真成功。鹈鹕需要长上下文和较多运行内存，单线程 CPU 生成整页可能很慢；下载大小不等于运行内存。旧模型卡的网页长度和上下文建议不代表当前 v2 权重的实测结果，详见验收说明。

## 当前功能

- 响应式侧栏、手机抽屉、灵感卡片、三款模型实验室与各自七档。
- 输入、发送、换行、分阶段模拟、实际下载/推理状态、停止生成、回复/源码复制；兼容中文输入法。
- 本地聊天记录保存模型、档位和消息格式/执行模式；支持新建、搜索、恢复和删除。切换对话会使旧任务失效。
- 最多保存最近 50 段对话，每段最多 100 条消息；输入上限 4000 个 UTF-16 码元。存储不可用时提示用户，并允许继续当前会话。
- 记录存于当前浏览器 `localStorage`。清除浏览器数据会删除记录；暂不支持账户、云同步或文件上传。

## 文件结构

```text
.github/workflows/deploy.yml  # 检查、浏览器回归与 GitHub Pages 部署
docs/model-integration.md    # 三源研究、档位、运行边界与实测结果
docs/model-adapter-guide.md  # 浏览器 API 契约、新模型逐项接入指南
examples/teapot/             # 直接复用 generateReply 的开发示例
CONTRIBUTING.md              # fork、验证与提交 PR
public/                     # 本地品牌、运行时及微型模型资源
scripts/                    # 运行时资源准备与真实推理 smoke
src/
  App.tsx                   # 工作台布局与导航状态
  components/               # 输入、选择器、消息、模拟剧场与安全预览
  assets/pelican.html        # 前六档共享的静态鹈鹕页面
  config/models.ts          # 三款模型与各自七档
  config/licenses.ts        # 随站发布的项目、归属及完整许可文本
  hooks/useChat.ts          # 调度、流式回复、失败和取消隔离
  lib/mock.ts               # 本地模拟 provider
  lib/inference.ts          # 拟真入口，按需加载浏览器推理
  lib/storage.ts            # 记录校验、持久化与异常恢复
tests/e2e/                  # 桌面/手机生产构建验收
playwright.config.ts        # Chromium 项目与静态预览服务
vite.config.ts              # 固定 base: /joking-ai/
THIRD_PARTY_NOTICES.md       # 上游、文件与许可说明
LICENSE                     # 本站原创部分的 MIT 标准许可
NOTICE                      # 本站许可范围与鹈鹕归属说明
```

## 测试

```bash
npm test
npm run test:models
npm run build
npx playwright install chromium
npm run test:e2e
npm run format:check
```

端到端测试运行生产构建，先执行 `build`。Linux 缺少依赖时可用 `npx playwright install --with-deps chromium`；已有兼容 Chromium 时可通过 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定路径。

原有基础回归已迁移到三模型，继续覆盖发送、持久化、模型切换、停止生成、中文输入法、多行、长度、文本安全、复制、弹窗、焦点、存储恢复和窄屏。扩展验收涵盖三款模型的七档、旧人格不可选、18 种模拟组合零模型资源与模型域名请求、六档静态 HTML 字节一致、安全 iframe、真实下载失败与重试、取消后的真实再次推理，以及 320px 菜单布局。桌面与 Pixel 7 参数模拟均执行；这不是实体手机测试。axe 自动检查覆盖 WCAG A/AA，但不能代替人工可访问性检查。

失败与取消测试只拦截故障请求，之后放行真实本地 GGUF，验证 wllama 能恢复生成；成功推理不由假响应代替。独立的 `node scripts/smoke-inference.mjs` 另行记录真实输出与耗时，`--pelican` 可运行大模型检查。最新命令、环境、通过项和未验证部分统一记录在[模型集成说明](docs/model-integration.md#本站验收结果)。

## 部署到 GitHub Pages

1. 将项目提交并推送到 `daqieee/joking-ai` 的 `main` 分支。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。
3. 工作流 **Verify and deploy to GitHub Pages** 会先安装依赖、运行单元测试、构建与桌面/手机端到端测试，再发布 `dist/`。Pull request 仅检查；推送 `main` 或手动运行才发布。
4. 部署成功后访问 [Joking AI](https://daqieee.github.io/joking-ai/)。部署状态以 Actions 与实际线上访问为准。

Vite `base` 保持 `/joking-ai/`，图标、WASM 与模型资源均须相对此路径解析。工作台与 `/joking-ai/licenses/` 许可证页使用静态 HTML 入口，刷新不依赖额外 SPA 404 配置。无需配置模型密钥或后端环境变量。

从本地恢复文件接续远端 Git 历史的具体步骤见[发布准备](docs/release-plan.md)。
