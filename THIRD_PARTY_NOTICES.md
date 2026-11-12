# 第三方资源与模型通知

许可与归属整理日期：2026-11-10；原三款模型的历史核对记录日期仍为 2026-10-24，新增模型单独列于下文。模型文件保持原字节；SHA-256 针对实际文件，不是文件名或 Git blob id。本站不提供外部模型推理服务，拟真发送时才加载权重。执行 `npm run test:models` 核对两份随站模型；存在鹈鹕缓存时，执行 `node scripts/verify-model-assets.mjs --pelican` 核对三份模型及 GGUF 元数据。

本站原创代码、文档、静态预设与独立 Teapot 权重及生成器采用根目录 [LICENSE](LICENSE) 的 MIT License，Copyright (c) 2026 Joking AI contributors。第三方作品保留本文件列明的独立许可和版权；本站 MIT 不替换上游条款。[站内第三方许可页](https://daqieee.github.io/joking-ai/licenses/)以 [src/config/licenses.ts](src/config/licenses.ts) 为数据源，随构建提供完整许可文本，查看页面不会加载模型。

## 模型文件

| 文件                                      |        字节 | SHA-256                                                            | 来源与许可                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------- | ----------: | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/models/random-num100-Q4_K_M.gguf` |     425,888 | `b48246d6f91055e652011868d5f468090fc299cca03d7718e99c8dacc1b3e279` | [lijie-gh/a-random-number-model，固定提交的 Q4_K_M](https://github.com/lijie-gh/a-random-number-model/blob/87f9943bea1d4e83522bc3813ff1dd0c250a3187/gguf/random-num100-Q4_K_M.gguf)，[MIT](https://github.com/lijie-gh/a-random-number-model/blob/87f9943bea1d4e83522bc3813ff1dd0c250a3187/LICENSE)。本地 Git blob SHA-1 也与该源文件的 `e2220bdc93123d99416e089834a52056a473aae3` 相同。                                                                                                       |
| `public/models/joking-teapot-v1-f32.gguf` |     102,016 | `c2518744658bed4ab9795d7e509292f76df86f1494efa4bd4df59648a9771fef` | 本站独立手写的未训练 F32 玩具权重，由 `scripts/build-teapot-model.mjs` 可重复生成。本站此权重与生成脚本采用下列 MIT 许可。                                                                                                                                                                                                                                                                                                                                                                      |
| `0u0-pelican-pro-v2-Q4_K_M.gguf`          | 167,846,208 | `5d449b74def5447d236471e365c0db1e05396d7df2fd658cdff62116b9bee00a` | [0v0ai/0u0-pelican-pro-0.2B-GGUF，固定修订](https://huggingface.co/0v0ai/0u0-pelican-pro-0.2B-GGUF/blob/6981d554c08a3727d960c9dbbd345af887f643e9/0u0-pelican-pro-v2-Q4_K_M.gguf)。[模型卡](https://huggingface.co/0v0ai/0u0-pelican-pro-0.2B-GGUF/blob/6981d554c08a3727d960c9dbbd345af887f643e9/README.md)声明 Apache-2.0，GGUF 也注明 Apache-2.0。SHA 与 Hugging Face LFS oid 一致。权重按需从 Hugging Face 加载，不随仓库或生产构建分发；本机缓存名为 `.model-cache/pelican-v2-Q4_K_M.gguf`。 |

鹈鹕固定修订为 `6981d554c08a3727d960c9dbbd345af887f643e9`。生产下载 URL 为：

```text
https://huggingface.co/0v0ai/0u0-pelican-pro-0.2B-GGUF/resolve/6981d554c08a3727d960c9dbbd345af887f643e9/0u0-pelican-pro-v2-Q4_K_M.gguf
```

`npm run test:inference:upstream` 单独验证生产 URL 的浏览器跨域读取，不使用本地镜像。2026-10-24 在 Chromium 156、来源 `http://127.0.0.1:4178` 下取得 206，`Content-Range: bytes 0-3/167846208`，首四字节为 `GGUF`，最终 CDN 响应含 `Access-Control-Allow-Origin: *`。此检查只读取文件头，不代表已通过浏览器从上游完整下载并校验 168 MB。完整权重的推理 smoke 使用 SHA-256 已核对的本地 HTTP 字节流，二者分别记录于 `test-results/inference/upstream-report.json` 和 `pelican-report.json`。

上游模型卡将其记忆的页面内容归因于 GPT-6 Astra 的输出。该卡的 63,617 字节、28,472 token 与 32K 推荐描述旧版网页；本修订只列出 v2 文件，而文件内描述为双路由模型、训练上下文为 16,384。这些上游声明均不等于本站实测，具体成功范围见 [模型集成与验收](docs/model-integration.md)。Apache-2.0 标准许可文本随站点保存在 [models/LICENSE-pelican-Apache-2.0.txt](public/models/LICENSE-pelican-Apache-2.0.txt)。

鹈鹕发布者与上游署名为 **0v0ai**。核对固定修订文件列表后，未发现独立 `NOTICE` 或 `LICENSE` 文件；本站额外提供 [NOTICE](NOTICE)，明确标为“本站整理归属说明”，保留发布者、固定来源、许可和上游 HTML 来源描述，不补写未声明的版权年份。该说明不是上游 NOTICE 原文；[Apache-2.0 第 4(d) 项](https://www.apache.org/licenses/LICENSE-2.0)针对上游已附带 NOTICE 的情况要求保留相关通知，并非要求每个 Apache 项目另建 NOTICE。本站六档 HTML 是独立站内预设，不等同于模型所记忆的页面，也不保证拟真权重生成相同结果。

本站保留 `n_ctx=32768` 与 `max_tokens=30000` 作为可取消的实验上限，给专用模型生成长 HTML 预留空间；30K 不是当前 v2 已验证的输出长度。32K 高于 GGUF 记载的训练上下文，Q8 KV 缓存约需 1.06 GiB，另计权重及运行时。90 秒实测只能证明真实 HTML 前缀与及时取消，不能证明完整网页、30K 输出或 32K 长上下文的正确性。

随机数模型的手写、零注意力残差流构造启发了本站 Teapot 的独立实现，已保留李杰的 MIT 通知。Teapot 的文本依次经过真实矩阵计算输出，固定结果不代表语义理解或训练。`namishsaxena/teapot-gpt` 是 [HTTP 418 规则与词库应用](https://github.com/namishsaxena/teapot-gpt)，其 [LICENSE](https://github.com/namishsaxena/teapot-gpt/blob/main/LICENSE) 为 MIT，Copyright (c) 2026 Namish Saxena。本站没有把该项目转换成神经网络权重，也没有使用其不存在的模型 checkpoint。

## 新增模型：Acedia、Guppy 与 Miso

以下来源、固定修订及许可于 **2026-11-10** 核查。模型与分词器按需从 Hugging Face 下载，不随仓库或构建分发；本站没有训练或修改这些上游权重。前六档本地模拟是本站独立娱乐文案，不是上游模型输出。训练背景、能力与示例仅代表发布者声明，本站实际验收另见 [新增模型说明](docs/added-models.md) 和 [动物模型说明](docs/animal-models.md)。

### Acedia-1

发布者为 **embeputer**，底座为 **HuggingFaceTB/SmolLM2-135M-Instruct**。[固定模型卡](https://huggingface.co/embeputer/acedia-1-gguf/blob/2f1784c2a9d7fdfe31eb72c576ec245ffd99ba18/README.md)和[底座模型卡](https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct/blob/12fd25f77366fa6b3b4b768ec3050bf629380bac/README.md)均声明 Apache-2.0。Acedia 发布者将其描述为懒惰、故意答错的 135M 微调模型，不应据其输出做真实决策。

- 模型文件：`acedia1v3-q4_k_m.gguf`，105,453,984 字节。
- revision：`2f1784c2a9d7fdfe31eb72c576ec245ffd99ba18`。
- SHA-256：`2371c959a0afae96bfe9a0075996a1e055667563b86c37a0bf7999dbb26e356a`。
- [固定文件来源](https://huggingface.co/embeputer/acedia-1-gguf/blob/2f1784c2a9d7fdfe31eb72c576ec245ffd99ba18/acedia1v3-q4_k_m.gguf)。

固定修订未附独立 LICENSE、NOTICE 或版权年份；本站不捏造上游通知。完整 Apache-2.0 标准条款复用随站的 [Apache License 2.0 全文](public/models/LICENSE-pelican-Apache-2.0.txt)，文件名来自较早的鹈鹕接入，但内容是未修改的标准许可，不限于鹈鹕。本站归属说明不替换或增加上游许可条件。

### GuppyLM

作者与发布者为 **arman-bd**。[固定模型卡](https://huggingface.co/arman-bd/guppylm-9M/blob/5f09d63fae6f5049bd2360d690f01b68a63d837b/README.md)及[源仓库 README](https://github.com/arman-bd/guppylm)均明确声明 MIT。核查时仓库 README 的独立 LICENSE 链接返回 404，根目录也无该文件；因此本项目明确以模型卡的 MIT 声明为许可依据，不声称取得了不存在的上游 LICENSE 全文，也不补造版权行或年份。本站保留作者归属、来源及本文件和站内许可页中的标准 MIT 条款。

固定 revision 为 `5f09d63fae6f5049bd2360d690f01b68a63d837b`：

| 文件             |       字节 | SHA-256                                                            |
| ---------------- | ---------: | ------------------------------------------------------------------ |
| `model.onnx`     | 10,469,869 | `96dd79d233662b65bc0fae1773821479551d1c1257ca5bbd12fa3e6623ae4835` |
| `tokenizer.json` |    160,605 | `b03b0b94a723f4c6757a39836f2755adb5a240e40017b089ba1820f51da6c92a` |

该 ONNX 已包含权重，不需要模型库中另列的 `model_fp32.onnx.data`。本站仅采用权重与分词器，不执行模型库中的 Python 文件。

### Miso / MeowLLM 与 phruut 转换

原始作者为 **phanii9**，模型发布为 **hunt3rx99/meowllm**；ONNX 转换发布者为 **phruut**。[原模型卡](https://huggingface.co/hunt3rx99/meowllm/blob/f3a3f6ef7e2697e1346729f65d1e44bb3df31de8/README.md)与[转换模型卡](https://huggingface.co/phruut/meowllm-onnx/blob/9697a86134592e88e433f77d31f4e4498ef6eba4/README.md)均声明 MIT。转换卡明确指向原模型，未添加独立版权行或额外条款。

原始 [MIT LICENSE](https://github.com/phanii9/MeowLLM/blob/d267a6c89bd978150ff9760ba77a37e7cee6601a/LICENSE)包含 `Copyright (c) 2026 phanii9`，全文原样保存在 [LICENSE-miso-MIT.txt](public/models/LICENSE-miso-MIT.txt) 并随站显示。本站保留原作者版权，另注明 phruut 的转换贡献，不编造 phruut 的版权年份。本站下载并使用的是该转换版本，而不是声称自行转换或训练。

ONNX 固定 revision 为 `9697a86134592e88e433f77d31f4e4498ef6eba4`：

| 文件              |       字节 | SHA-256                                                            |
| ----------------- | ---------: | ------------------------------------------------------------------ |
| `model.onnx`      |    436,607 | `c6e0902dd9d6c453e842573c6d64779f76f93f2d05eeaf5d0b69a61e31a8236d` |
| `model.onnx.data` | 13,846,528 | `0a370100163f43d0f893c7bf47ff8e9c9267dc6790e8fb3fa080c6669320167d` |
| `tokenizer.json`  |    100,761 | `874f76a917ca3ccba0fe7253bb08688df0d977a5e1a423ccc27c419c093a4332` |

模型及外部权重合计 14,283,135 字节，分词器另计。原始模型 revision 为 `f3a3f6ef7e2697e1346729f65d1e44bb3df31de8`。

## 浏览器运行时及界面依赖

- **onnxruntime-web 1.31.1** 与 **onnxruntime-common 1.31.1**：Microsoft ONNX Runtime 的浏览器计算运行时与公共 JavaScript API，采用 MIT，`Copyright (c) Microsoft Corporation`。npm 包元数据声明 MIT，但安装包不含独立 LICENSE；本站从官方 **v1.31.1** 源码标签取得 [LICENSE](https://github.com/microsoft/onnxruntime/blob/v1.31.1/LICENSE) 与 [ThirdPartyNotices.txt](https://github.com/microsoft/onnxruntime/blob/v1.31.1/ThirdPartyNotices.txt)，分别原样保存为 [LICENSE-onnxruntime-1.31.1.txt](public/models/LICENSE-onnxruntime-1.31.1.txt) 和 [ThirdPartyNotices-onnxruntime-1.31.1.txt](public/models/ThirdPartyNotices-onnxruntime-1.31.1.txt)。两份全文均随站打包、在许可页显示；第三方通知保持英文原文，不删节、不翻译。它覆盖上游项目的第三方材料，不代表本站加载其中所有可选组件。
- ONNX 官方 LICENSE 为 1,073 字节，SHA-256 `2f07c72751aed99790b8a4869cf2311df85a860b22ded05fa22803587a48922c`；ThirdPartyNotices 为 338,088 字节，SHA-256 `143764b952fdb1a7c69ce653bfba74a7744d6a8a573bfb73e235fba356c83de3`。依赖及 WASM 的实际版本由 `package-lock.json` 固定，不以更新后的主分支许可文本冒充该版本。

- [`@wllama/wllama`](https://github.com/ngxson/wllama) 与 `@wllama/wllama-compat` 固定为 **3.8.1**，[MIT](https://github.com/ngxson/wllama/blob/master/LICENCE)，Copyright (c) 2024 Xuan Son NGUYEN。构建器将原包的 JS/WASM 打包到带哈希的 `assets/`，包括 8,763,949 字节的标准 WASM 和 16,005,007 字节的兼容 WASM。本站固定 CPU 单线程；本次 Chromium 在未跨域隔离时实际加载标准 WASM。另捆绑兼容资源供 wllama 在缺少 JSPI 的浏览器中选择，不将该路径视为已完成 Firefox / Safari 实测。
- wllama 内的 [llama.cpp / ggml](https://github.com/ggml-org/llama.cpp/blob/master/LICENSE) 使用 MIT，Copyright (c) 2023-2026 The ggml authors。
- React **19.3.1**、React DOM **19.3.1** 与其调度依赖 scheduler **0.28.0** 使用 MIT，Copyright (c) Meta Platforms, Inc. and affiliates.，通知按安装包 `LICENSE` 保留。
- [Lucide React](https://github.com/lucide-icons/lucide/blob/0.468.0/LICENSE) **0.468.0** 使用下列 ISC 通知，版权行按安装包原文保留；Feather 来源部分为 Cole Bemis 2013-2022 的 MIT 作品，下方另保留完整 MIT 通知。[官方许可页](https://lucide.dev/license)说明 ISC 与 Feather MIT 的对应范围；不以该网站后续更新的年份替换已安装版本声明，也不把 MIT 视为整个 Lucide 的替代许可。

开发与测试依赖的版本和来源由 `package-lock.json` 记录，各包自带许可保留在安装包中；它们不作为模型权重分发。

## MIT 通知

下文分别适用于上述 MIT 组件；各自的版权主体保持如下：

```text
Copyright (c) 2026 李杰 (Jie Li)
Copyright (c) 2026 Namish Saxena
Copyright (c) 2026 Joking AI contributors
Copyright (c) 2026 phanii9
Copyright (c) Microsoft Corporation
Copyright (c) 2024 Xuan Son NGUYEN
Copyright (c) 2023-2026 The ggml authors
Copyright (c) Meta Platforms, Inc. and affiliates.

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Lucide ISC 通知

```text
ISC License

Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

## Feather 来源部分 MIT 通知

Lucide 中的 Feather 来源部分采用 MIT。以下版权年份保留 `lucide-react@0.468.0` 的归属范围；本通知与上面的 Lucide ISC 通知一并保留。

```text
MIT License

Copyright (c) Cole Bemis 2013-2022

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
