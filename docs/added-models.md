# 新增三款真实整活小模型

核对日期：2026-11-10。本站从三款扩展为六款，保留原有默认模型、聊天记录、原三款行为和七档结构。所有新增模型前六档都是明确标注的本站预设；只有第七档执行真实权重，不使用预设文字替代失败的推理。

## Acedia 摸鱼助手

- 发布者：[embeputer/acedia-1-gguf](https://huggingface.co/embeputer/acedia-1-gguf)。基于 HuggingFaceTB/SmolLM2-135M-Instruct 的真实 135M LoRA 微调，定位为懒散整活助手。模型与 base 声明 Apache-2.0。
- 固定 revision `2f1784c2a9d7fdfe31eb72c576ec245ffd99ba18`，文件 `acedia1v3-q4_k_m.gguf`，105,453,984 bytes，SHA-256 `2371c959a0afae96bfe9a0075996a1e055667563b86c37a0bf7999dbb26e356a`。文件已下载并校验，与 Hugging Face LFS hash 一致。
- 沿用 wllama 3.8.1 CPU 单线程。4096 context，最多 120 个输出 token；ChatML 当前单轮输入，本站娱乐角色 system 提示。temperature 0.7、top-k 40、top-p 0.9，停止于 ChatML 边界或 EOS。输入超过 600 个 Unicode 字符时明确报错，不截断。无历史上下文。
- 英文优先，可能重复、胡说或自信错答。不是通用可靠助手，不保证中文能力。上游成绩与角色宣传不当作本站能力实测。

## Guppy 小鱼与 Miso 猫猫

两者是真实从头训练的微型英文角色模型，按需下载 ONNX 权重与词表，使用 ONNX Runtime Web 1.31.1 CPU / WASM 单线程。数据来源、SHA-256、精确大小、许可与上下文边界见 [动物模型说明](animal-models.md)。所有五份动物模型资产下载后检查 SHA-256。

- Guppy：原项目约 10.5 MB 量化权重，鱼缸、零食和泡泡角色。请用简短小写英文，词表缺失字节会明确报错，不丢弃输入。
- Miso：约 14.3 MB FP32 权重，原模型 hunt3rx99/meowllm，phruut 提供 ONNX 转换。猫、纸箱和午睡角色；训练有限。输入转小写，与原项目一致。

两个 runtime 都在专用 Worker 中执行，停止、新建、切换和闲置释放继承协调器。切换 GGUF / ONNX 时释放上一运行时。提示词不发送给服务器；下载只访问固定模型资产 URL。错误不会改成模拟成功，token 上限截断会标“生成未完成”。

## 验证方法与状态

- 单元测试包含六款七档、36 种模拟组合、正确 provider 和存储、Acedia 输入上限、动物 tokenizer；真实推理不通过测试 mock 冒充。
- 原有随机数 / Teapot GGUF 资源完整性与重建验证继续保留。
- 已在 Node 使用同版本 **ONNX Runtime Web WASM** 和校验过的实际权重完成两个动物模型生成，输出记录见动物模型说明。这不等于浏览器/CORS 验收。
- 当前执行容器不能启动 Chromium（socket 权限限制）；因此本机端到端浏览器断言未执行。TypeScript 与生产构建可正常验证。
- GitHub Actions 在部署前运行完整桌面/手机参数 E2E，并运行 `npm run test:inference:added`。该 smoke 直接下载固定上游资产，不拦截成功响应，要求 Acedia、Guppy、Miso 实际浏览器生成非空文本，再切回 Teapot 真实 GGUF。它验证下载、CORS、运行时、tokenizer、流式结果与模型切换，不承诺幽默质量或语义准确性。
- 最新 Actions 的 `added-models-inference` artifact 保存实际生成、耗时、下载状态与错误。只有检查成功才发布。每次发布结论以对应 commit 的 Actions 和线上结果为准。

## 未纳入的候选

另查到 GPT-Grug-355m（穴居人语言、MIT，约 179 MB GGUF）和 SmolBabble2-360m（胡言乱语、Apache-2.0，约 219 MB GGUF）。本轮优先接入体积更小的鱼/猫，未把这些尚未在本站验证的模型放入选择菜单。
