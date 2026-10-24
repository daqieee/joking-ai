# 第三方资源与模型通知

核对日期：2026-10-24。模型文件保持原字节；SHA-256 针对实际文件，不是文件名或 Git blob id。本站不提供外部模型推理服务，拟真发送时才加载权重。执行 `npm run test:models` 核对两份随站模型；存在鹈鹕缓存时，执行 `node scripts/verify-model-assets.mjs --pelican` 核对三份模型及 GGUF 元数据。

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

本站保留 `n_ctx=32768` 与 `max_tokens=30000` 作为可取消的实验上限，给专用模型生成长 HTML 预留空间；30K 不是当前 v2 已验证的输出长度。32K 高于 GGUF 记载的训练上下文，Q8 KV 缓存约需 1.06 GiB，另计权重及运行时。90 秒实测只能证明真实 HTML 前缀与及时取消，不能证明完整网页、30K 输出或 32K 长上下文的正确性。

随机数模型的手写、零注意力残差流构造启发了本站 Teapot 的独立实现，已保留李杰的 MIT 通知。Teapot 的文本依次经过真实矩阵计算输出，固定结果不代表语义理解或训练。`namishsaxena/teapot-gpt` 是 [HTTP 418 规则与词库应用](https://github.com/namishsaxena/teapot-gpt)，其 [LICENSE](https://github.com/namishsaxena/teapot-gpt/blob/main/LICENSE) 为 MIT，Copyright (c) 2026 Namish Saxena。本站没有把该项目转换成神经网络权重，也没有使用其不存在的模型 checkpoint。

## 浏览器运行时及界面依赖

- [`@wllama/wllama`](https://github.com/ngxson/wllama) 与 `@wllama/wllama-compat` 固定为 **3.8.1**，MIT，Copyright (c) 2024 Xuan Son NGUYEN。构建器将原包的 JS/WASM 打包到带哈希的 `assets/`，包括 8,763,949 字节的标准 WASM 和 16,005,007 字节的兼容 WASM。本站固定 CPU 单线程；本次 Chromium 在未跨域隔离时实际加载标准 WASM。另捆绑兼容资源供 wllama 在缺少 JSPI 的浏览器中选择，不将该路径视为已完成 Firefox / Safari 实测。
- wllama 内的 [llama.cpp / ggml](https://github.com/ggml-org/llama.cpp/blob/master/LICENSE) 使用 MIT，Copyright (c) 2023-2026 The ggml authors。
- React 与 React DOM 使用 MIT，Copyright (c) Meta Platforms, Inc. and affiliates。
- [Lucide](https://lucide.dev/license) 使用下列 ISC 通知；Feather 来源部分为 Cole Bemis 2013-2022 的 MIT 作品。

开发与测试依赖的版本和来源由 `package-lock.json` 记录，各包自带许可保留在安装包中；它们不作为模型权重分发。

## MIT 通知

下文分别适用于上述 MIT 组件；各自的版权主体保持如下：

```text
Copyright (c) 2026 李杰 (Jie Li)
Copyright (c) 2026 Joking AI contributors (original Teapot weight and builder only)
Copyright (c) 2024 Xuan Son NGUYEN
Copyright (c) 2023-2026 The ggml authors
Copyright (c) Meta Platforms, Inc. and affiliates.
Copyright (c) Cole Bemis 2013-2022 (Feather portions)

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
