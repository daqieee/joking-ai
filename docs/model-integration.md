# 三款整活模型的接入与验收

核对日期：2026-10-24。本站只提供鹈鹕 PRO、随机数模型和 TeapotGPT；每款前六档是本地预设过程与动画，第七档“拟真”才加载 GGUF 并在浏览器内执行推理。无后端、无模型 API Key，站点 base 固定为 `/joking-ai/`。

## 上游来源与实现边界

| 模型       | 来源                                                                                                                                                  | 本站实现                                                                                                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 鹈鹕 PRO   | [0v0ai/0u0-pelican-pro-0.2B-GGUF](https://huggingface.co/0v0ai/0u0-pelican-pro-0.2B-GGUF)，Apache-2.0                                                 | 前六档返回本站的同一份静态 HTML；拟真使用 `0u0-pelican-pro-v2-Q4_K_M.gguf`，167,846,208 字节，固定 revision `6981d554c08a3727d960c9dbbd345af887f643e9`。由真实权重生成 HTML，不用预设页面冒充推理结果。 |
| 随机数模型 | [lijie-gh/a-random-number-model](https://github.com/lijie-gh/a-random-number-model)，MIT                                                              | 前六档用浏览器 `crypto.getRandomValues` 与拒绝采样选出 0～100；拟真使用上游手写、零训练的 `random-num100-Q4_K_M.gguf`，425,888 字节，在 wllama 中前向计算和采样。                                       |
| TeapotGPT  | [namishsaxena/teapot-gpt](https://github.com/namishsaxena/teapot-gpt)，[LICENSE](https://github.com/namishsaxena/teapot-gpt/blob/main/LICENSE) 为 MIT | 上游通过规则、分类及词库回复，未提供神经模型权重；本站前六档用同一条 418 预设回复。拟真运行本站独立手写的 `joking-teapot-v1-f32.gguf`，102,016 字节，不是上游模型，没有训练、不具备语义理解。           |

鹈鹕模型卡仍描述较早的 `0u0-鹈鹕PRO-Q4_K_M.gguf`、63,617 字节页面、28,472 个输出 token 和 32,768 上下文建议；这些是旧上游报告，不能当成当前 v2 权重的已验证配置。本站直接读取 v2 GGUF 得到训练上下文 16,384；其 16 层、16 个 KV head、每 head 64 维意味着 32K 上下文的 f16 KV 缓存本身约需 2 GiB，尚未计入模型和计算缓冲。完整输出长度、可用上下文与实际内存应以当前权重实测为准。[上游模型卡](https://huggingface.co/0v0ai/0u0-pelican-pro-0.2B-GGUF)

随机数拟真保留全部 101 个候选：`temperature=1`、`top_p=1`、`top_k=101`、`min_p=0`、`repeat_penalty=1`，presence / frequency penalty 均为 0。使用固定 BOS 输入，避免把用户末尾的数字当成已经生成的答案而立即 EOS。上游的均匀性检验不是本站统计结果；本站只记录真实生成与合法范围验收。[上游采样说明](https://github.com/lijie-gh/a-random-number-model#lm-studio--其它前端)

Teapot 上游的“418 个参数”是作品设定，其[回复选择实现](https://github.com/namishsaxena/teapot-gpt/blob/main/lib/selectResponse.ts) 不进行神经模型推理。本站极小 GGUF 的权重与词表由脚本直接构造，wllama 生成 `418` 拒绝正文；不能称为将上游 Teapot 模型转换成 GGUF。README 的玩笑许可说明也不替代实际 MIT LICENSE。

运行时使用固定版本的 [wllama 3.8.1](https://github.com/ngxson/wllama)，即 llama.cpp 的 WebAssembly 绑定。本站在 Worker 中执行 CPU 单线程推理，不要求 GitHub Pages 提供 COOP / COEP 响应头。模型和运行时文件、SHA-256 及许可见 [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)。

## 七档设计

三模型共享稳定 id：`low / medium / high / extra / extreme / absurd / real`，跨模型切换保留同一 id。默认是 `pelican-pro / medium`。

| id      | 鹈鹕 PRO                             | 随机数模型               | TeapotGPT                    |
| ------- | ------------------------------------ | ------------------------ | ---------------------------- |
| low     | 瘦：直接呈现骑行页面                 | 随机：直接掷数           | 温水：轻声拒绝               |
| medium  | 中：骑车准备                         | 很随机：2～3 个模拟阶段  | 微沸：检查茶壶身份           |
| high    | 肥：承重分析与动画                   | 极其随机：严肃概率分析   | 沸腾：召开茶叶会议           |
| extra   | 很肥：自行车结构警告                 | 绝对随机：模拟交叉验证   | 高压：咖啡越界报告           |
| extreme | 特别肥：多阶段重规划路线             | 量子随机：模拟量子坍缩   | 锅炉超频：全厨房茶化         |
| absurd  | 超级无敌肥：长篇伪过程与临界质量警告 | 命运的骰子：严肃命运推演 | 宇宙茶道：宇宙茶道委员会     |
| real    | 拟真：上游 GGUF 生成 HTML            | 拟真：上游 GGUF 采样整数 | 拟真：本站手写 GGUF 输出 418 |

前六档只改变过程台词、阶段数量和动画复杂度，结果规则保持一致：

- 鹈鹕六档的最终 `Message.content` 完全相同，与 [src/assets/pelican.html](../src/assets/pelican.html) 字节一致。Vite 同时把它打包为 `/joking-ai/assets/pelican-<hash>.html`，回复下的“预设文件”链接指向同站静态文件；用户输入不进入这份 HTML。
- 随机数的最终正文始终只含一个 0～100 的整数。前六档用拒绝采样去除 32 位随机数直接取模 101 的偏差；过程保存在独立 `stage` 元数据中。
- Teapot 六档的最终正文是同一条 `418 · 我是一把茶壶。…` 预设回复，输入和档位不会改变结果。

界面将过程标为“模拟演出 · 非真实推理”；这些是本站撰写的娱乐台词，不是模型思维链。模拟路径不下载权重、不加载 WASM、不启动 wllama，也不访问模型域名。

## 下载、取消与 HTML 预览

选中拟真时只展示下载大小与说明，发送消息才开始下载。随机与 Teapot 权重随站点发布；鹈鹕权重从固定 Hugging Face revision 下载。推理在设备中进行，不调用外部推理 API。首次下载需要网络；断网、来源 CORS、浏览器能力或内存不足会显示错误，并允许重试，不会伪装成真实成功。

停止、切换模型或档位、新建、切换及删除当前会话会使旧任务失效。旧进度、错误与 token 不得写入新会话。下载取消后可以再次运行真实推理；若拟真已经生成部分内容，停止会保留带“未完成”标识的正文，不把截断内容标为完整输出。

鹈鹕页面通过 `iframe srcdoc` 预览。空 `sandbox` 不授予脚本、同源或顶层导航权限，CSP 禁止外部资源；净化过程移除脚本、事件处理器、表单、子框架、外链和 meta refresh。只能展示允许的静态 HTML / CSS / SVG，上游页面中依赖脚本与网络的交互不属于此预览能力。源代码可独立查看和复制。

本地记录保存模型、档位、正文、格式、provider、模拟阶段和未完成标识，最多 50 段会话，每段 100 条消息。存储不可用时提示用户并允许继续当前会话。

## 验收方法

```bash
npm run format:check
npm test
npm run test:models
npm run build
npx playwright install chromium
npm run test:e2e
node scripts/smoke-inference.mjs
node scripts/smoke-inference.mjs --pelican
node scripts/smoke-inference.mjs --pelican-only
```

端到端测试使用生产构建的 `/joking-ai/` 子路径，执行 Chromium 桌面与 Pixel 7 参数模拟。基础回归覆盖两批首页卡片填入问题并切换对应模型、通用卡片保留当前模型、换一批保留草稿，以及发送、记录、停止、输入法、换行、长度、文本安全、复制、弹窗、焦点、存储异常和 320px 布局；扩展测试覆盖仅三款可选、每款七档、18 种模拟组合零模型资源及模型域名请求、静态 HTML 完全一致、过程与最终正文分离、安全 iframe、刷新元数据、下载失败、重试与取消隔离。

故障测试只伪造 503 或延迟以触发错误、取消，随后放行站内真实 GGUF；成功必须来自真实 WASM 推理。独立 smoke 也加载实际权重、执行前向计算并记录输出与耗时。若鹈鹕只生成前缀或被取消，只报告该范围，不声称整页完成或字节复现通过。Pixel 7 是浏览器设备参数模拟，不是实体手机；axe 自动检查也不替代人工可访问性验收。

## 本站验收结果

2026-10-24 本机最终验收环境为 Windows、Node.js 24.19.0、npm 11.17.0、Chromium 156.0.8078.4；wllama 3.8.1 使用 CPU 单线程。桌面视口为 1440×900，手机为 Pixel 7 参数模拟，并另查 320px 窄屏。

| 项目                                 | 状态           | 证据与限制                                                                                                                                          |
| ------------------------------------ | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 格式、单元测试、TypeScript、生产构建 | 通过           | `format:check` 通过，4 个单元测试文件 / 30 项通过，最终源码重新构建成功                                                                             |
| 微型模型资源与可复现构建             | 通过           | `test:models` 核对 Teapot 重建字节一致及两份权重的大小、SHA-256；鹈鹕本地完整权重另通过大小与 SHA-256 核对                                          |
| 桌面及手机参数模拟 E2E               | 42 / 42 通过   | 21 项 × 2，100.9 秒；0 失败、0 跳过、0 flaky。覆盖两批首页卡片与三模型七档、18 种模拟组合及原有交互回归                                             |
| 最终运行时文案变更后的增量 E2E       | 4 / 4 通过     | 最后仅改进度文案和注释后重新构建，桌面 / 手机的真实下载失败重试与取消后恢复再次通过，6.4 秒                                                         |
| 关键界面人工查看                     | 通过           | 桌面首页、鹈鹕预设、随机数剧场；手机首页、鹈鹕预设、茶壶剧场与 320px 菜单，布局和文字可读，8 张截图保存在 `handoff/validation/`                     |
| 随机 GGUF 真实浏览器推理             | 已完成         | 实际输出 54（225 ms），切换 Teapot 后再次输出 44（304 ms）；不构成分布统计检验                                                                      |
| 本站 Teapot GGUF 真实浏览器推理      | 已完成         | 241 ms，完整输出 `418 · I'm a teapot.` 及中文自制模型说明；仍是未训练的手写权重                                                                     |
| 真实取消后恢复                       | 通过           | 下载取消 251 ms 返回 AbortError 后 Teapot 成功；鹈鹕 10 秒窗口停止在截止后 7 ms 返回、保留部分输出，随后 Teapot 真实生成再次成功                    |
| 鹈鹕 v2 GGUF 真实浏览器推理          | 部分输出已验证 | 完整真实权重通过本地 HTTP 传输，90 秒内生成 3,795 个 UTF-8 字节，首段输出 3,022 ms；停止在 90,010 ms 返回 AbortError，`incomplete=true`；整页未完成 |
| 鹈鹕上游浏览器 CORS                  | 前缀检查通过   | 固定 revision 的真实浏览器请求返回 206、`bytes 0-3/167846208` 与 `GGUF`，最终 CDN 允许跨域；未完成远程 168 MB 全量下载或远程文件哈希核对            |
| GitHub Pages 在线部署                | 未执行         | 本地生产预览不等于线上部署，发布后另行核对                                                                                                          |

完整 E2E 报告为 `handoff/validation/e2e-report.json`，最终增量报告为 `handoff/validation/e2e-final-runtime-report.json`。测试临时目录仅为 `test-results/playwright/`，未清理独立推理证据目录。早期 `handoff/screenshots/` 不是本轮截图。

独立真实推理来自 `test-results/inference/report.json` 的 2026-10-24 01:06:54 UTC 记录（`ok=true`）。其中 10 秒鹈鹕窗口生成 366 个 UTF-8 字节 / 361 个 UTF-16 码元，首段输出 2,939 ms；`pelicanModelFinished=false` 明确表示没有自然完成。90 秒较长输出和对应 HTML 分别保存在 `pelican-report.json`、`pelican-output.html`；上游前缀检查在 `upstream-report.json`。这些 `ok=true` 表示有界生成、取消与恢复符合检查预期，不能解释为整页生成通过。

鹈鹕本轮配置为 `n_ctx=32768`、`max_tokens=30000`、Q8 KV 缓存及 flash attention。32K 分配和前缀生成已运行，但 GGUF 训练上下文为 16K；尚未验证 30K 输出、32K 长序列、完整 HTML、实际内存峰值或逐字节复现。回调次数和“文本片段”不是输出 token 数。用于 smoke 的本地权重通过完整 SHA-256 校验；生产构建仍使用固定的上游 HTTPS 地址。
