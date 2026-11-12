# Guppy 与 Miso：真实动物角色模型

这两款模型均为从头训练的英文角色玩具，不是通用助手。每次仅使用当前一条输入，不传送聊天记录或提示词；网络只下载固定版本模型和 tokenizer。选择模型不会下载，发送拟真消息才加载。前六档仍为本站模拟。

## 固定资产

| 模型               | 来源 / revision                                                                                                 |                   权重大小 | 格式                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------- | -------------------------: | -------------------------------- |
| Guppy (8.7M 参数)  | [arman-bd/guppylm-9M](https://huggingface.co/arman-bd/guppylm-9M/tree/5f09d63fae6f5049bd2360d690f01b68a63d837b) |           10,469,869 bytes | ONNX，UINT8 量化矩阵与 FP32 张量 |
| Miso (~3.45M 参数) | [phruut/meowllm-onnx](https://huggingface.co/phruut/meowllm-onnx/tree/9697a86134592e88e433f77d31f4e4498ef6eba4) | 436,607 + 13,846,528 bytes | ONNX + external data，FP32       |

Miso 转换自 [hunt3rx99/meowllm](https://huggingface.co/hunt3rx99/meowllm/tree/f3a3f6ef7e2697e1346729f65d1e44bb3df31de8)，原始模型和转换仓库均标注 MIT。Guppy 仓库标注 MIT。模型版权归上游作者，本站没有训练这些模型。

Guppy tokenizer 160,605 bytes；Miso tokenizer 100,761 bytes。所有权重和 tokenizer 的 SHA-256 均记录于 `src/lib/inference/animal-models.ts`，下载后校验再运行。Miso external data 只使用固定 `model.onnx.data` 文件，未执行仓库中的 Python 代码。

## 实现

- ONNX Runtime Web **1.31.1**，MIT，CPU WASM 单线程，独立 Worker，无 WebGPU 和跨域隔离要求。运行时文件随本站构建打包，而非第三方 CDN。
- 实际输入 `input_ids`: int64 `[1, seq_len]`；输出 `logits`: float32 `[1, seq_len, vocab]`。Guppy vocab 4096，Miso 1682。未使用 KV cache，每次真实前向计算完整上下文。
- tokenizer 为上游 ByteLevel BPE；本地实现 GPT-2 regex 预切分、byte 映射和按 rank 合并。Miso 输入按上游转为小写；Guppy保留原输入。Guppy tokenizer 缺少部分字节：本站明确报错，不像上游静默丢弃未知字符。推荐简短小写英文，避免表情、中文和不常见标点。
- Guppy 格式为 `<|im_start|>user\n{text}<|im_end|>\n<|im_start|>assistant\n`，最多 64 个输入词元（含格式），最多 64 个输出词元，128 context。temperature=0.7、top-k=50。
- Miso 格式为 `<bos><user>{text}<miso>`，最多 160 个输入词元（含格式），最多 60 个输出词元，256 context。temperature=0.8、top-k=40。
- 超长输入明确报错，不截断。提前遇到终止/下一轮标记结束，否则标为 incomplete。输出不替换成本站文案。
- 停止通过终止 Worker 取消，包括下载/初始化；协调器复用同一模型，切换或闲置 60 秒释放。

## 验证与边界

2026-11-10：下载并比对全部权重和 tokenizer SHA-256；检查 ONNX 图的真实输入、输出、external data 与 tensor precision；与 Python Hugging Face tokenizers 对比英文、特殊标记和 Miso Unicode 测试样本。

同版本 ONNX Runtime Web **WASM** 在 Node 中实际前向计算通过。为了可复现，验证脚本使用 greedy argmax（网页使用上述采样设置）。输入 `are you hungry`：

- Guppy: `yes. always yes. i've been investigating a speck waiting for this moment.`
- Miso: `i have not eaten in my entire life probably.`

运行 `ANIMAL_MODEL_CACHE=/path/to/cache node scripts/verify-animal-inference.mjs`，缓存文件名见脚本。它不会自动下载或修改模型。该验证不是浏览器/CORS 验收；浏览器结果请见项目最新验收记录。此执行容器的 Chromium 因 socket 权限无法启动，不能据此声称浏览器端到端通过。

Miso 上游模型卡声明原始随附 checkpoint 仅在 CPU 训练 2,000 steps；不应把推荐完整 GPU 训练配置或上游评测数字当作本站实测。两款模型均可能重复训练句子、离题或输出无意义文本，不能保证角色一致性或中文理解。
