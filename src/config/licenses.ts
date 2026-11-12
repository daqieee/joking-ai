import siteLicense from '../../LICENSE?raw'
import pelicanNotice from '../../NOTICE?raw'
import apacheLicense from '../../public/models/LICENSE-pelican-Apache-2.0.txt?raw'
import misoLicense from '../../public/models/LICENSE-miso-MIT.txt?raw'
import onnxLicense from '../../public/models/LICENSE-onnxruntime-1.31.1.txt?raw'
import onnxNotices from '../../public/models/ThirdPartyNotices-onnxruntime-1.31.1.txt?raw'

export interface LicenseEntry {
  id: string
  name: string
  license: string
  version?: string
  copyright: readonly string[]
  description: string
  projectUrl: string
  licenseUrl: string
  licenseTexts: readonly { label: string; text: string }[]
}

export const SITE_LICENSE: string = siteLicense
export const PELICAN_NOTICE: string = pelicanNotice
export const LICENSE_CHECKED_DATE = '2026-11-10'

const MIT_TERMS = `Permission is hereby granted, free of charge, to any person obtaining a copy
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
SOFTWARE.`

function mitLicense(copyright: string): string {
  return `MIT License\n\n${copyright}\n\n${MIT_TERMS}`
}

const LUCIDE_COPYRIGHT =
  'Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.'

const LUCIDE_ISC = `ISC License

${LUCIDE_COPYRIGHT}

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.`

const FEATHER_COPYRIGHT = 'Copyright (c) Cole Bemis 2013-2022'
const WLLAMA_COPYRIGHT = 'Copyright (c) 2024 Xuan Son NGUYEN'
const REACT_COPYRIGHT = 'Copyright (c) Meta Platforms, Inc. and affiliates.'

// License texts are bundled with this page; reading them never loads a model.
// Keep versions in sync with package-lock.json and preserve installed notices.
export const LICENSE_ENTRIES: readonly LicenseEntry[] = [
  {
    id: 'pelican-pro',
    name: '鹈鹕 PRO · 0u0-pelican-pro-0.2B-GGUF',
    license: 'Apache-2.0',
    version: '6981d554c08a3727d960c9dbbd345af887f643e9',
    copyright: ['发布者与上游署名：0v0ai；上游未声明独立版权年份。'],
    description:
      '拟真档按需下载固定修订的原始 v2 Q4_K_M GGUF；权重不随站点构建分发。上游模型卡将所记忆 HTML 归因于 GPT-6 Astra 的一次 Codex 测试输出。本站六档静态预设独立于该权重，不保证拟真模型生成相同页面。固定修订没有独立 NOTICE；下列 NOTICE 为本站整理的归属说明。',
    projectUrl: 'https://huggingface.co/0v0ai/0u0-pelican-pro-0.2B-GGUF',
    licenseUrl:
      'https://huggingface.co/0v0ai/0u0-pelican-pro-0.2B-GGUF/blob/6981d554c08a3727d960c9dbbd345af887f643e9/README.md',
    licenseTexts: [
      { label: 'Apache License 2.0 全文', text: apacheLicense },
      { label: '鹈鹕归属 NOTICE（本站整理）', text: PELICAN_NOTICE },
    ],
  },
  {
    id: 'random-number',
    name: '随机数模型 · a-random-number-model',
    license: 'MIT',
    version: '87f9943bea1d4e83522bc3813ff1dd0c250a3187',
    copyright: ['Copyright (c) 2026 李杰 (Jie Li)'],
    description:
      '拟真档使用上游原始 random-num100-Q4_K_M.gguf。该模型由手写权重构造，没有训练；其零注意力残差流构造也启发了本站独立 Teapot 实现。',
    projectUrl: 'https://github.com/lijie-gh/a-random-number-model',
    licenseUrl:
      'https://github.com/lijie-gh/a-random-number-model/blob/87f9943bea1d4e83522bc3813ff1dd0c250a3187/LICENSE',
    licenseTexts: [
      {
        label: 'MIT License 全文',
        text: mitLicense('Copyright (c) 2026 李杰 (Jie Li)'),
      },
    ],
  },
  {
    id: 'teapot-gpt',
    name: 'TeapotGPT · teapot-gpt 上游',
    license: 'MIT',
    copyright: ['Copyright (c) 2026 Namish Saxena'],
    description:
      'HTTP 418 规则与词库应用，是本站 Teapot 的主题与规则来源。上游不提供神经网络 checkpoint；本站没有把该项目转换成模型权重。',
    projectUrl: 'https://github.com/namishsaxena/teapot-gpt',
    licenseUrl: 'https://github.com/namishsaxena/teapot-gpt/blob/main/LICENSE',
    licenseTexts: [
      {
        label: 'MIT License 全文',
        text: mitLicense('Copyright (c) 2026 Namish Saxena'),
      },
    ],
  },
  {
    id: 'joking-teapot',
    name: 'Joking AI · 本站 Teapot GGUF',
    license: 'MIT',
    version: 'v1 F32 · 102,016 字节',
    copyright: ['Copyright (c) 2026 Joking AI contributors'],
    description:
      '本站原创的未训练手写 GGUF 与 scripts/build-teapot-model.mjs，通过真实矩阵计算输出 418。它是独立玩具权重，不是上游 TeapotGPT 的神经模型。',
    projectUrl: 'https://github.com/daqieee/joking-ai',
    licenseUrl: 'https://github.com/daqieee/joking-ai/blob/main/LICENSE',
    licenseTexts: [{ label: '本站 MIT License 全文', text: SITE_LICENSE }],
  },
  {
    id: 'acedia',
    name: 'Acedia-1 · embeputer/acedia-1-gguf',
    license: 'Apache-2.0',
    version: '2f1784c2a9d7fdfe31eb72c576ec245ffd99ba18',
    copyright: [
      '模型发布者：embeputer；底座：HuggingFaceTB/SmolLM2-135M-Instruct。上游未声明独立版权年份。',
    ],
    description:
      '按需下载未修改的 acedia1v3-q4_k_m.gguf。发布者将其描述为懒惰、故意答错的 135M 微调娱乐模型；模型卡与 SmolLM2 底座均声明 Apache-2.0。固定修订未附独立 LICENSE 或 NOTICE；本站保留标准许可全文与来源，不将模拟档文案冒充上游模型输出。',
    projectUrl: 'https://huggingface.co/embeputer/acedia-1-gguf',
    licenseUrl:
      'https://huggingface.co/embeputer/acedia-1-gguf/blob/2f1784c2a9d7fdfe31eb72c576ec245ffd99ba18/README.md',
    licenseTexts: [{ label: 'Apache License 2.0 全文', text: apacheLicense }],
  },
  {
    id: 'guppy',
    name: 'GuppyLM · arman-bd/guppylm-9M',
    license: 'MIT（上游模型卡声明）',
    version: '5f09d63fae6f5049bd2360d690f01b68a63d837b',
    copyright: ['作者与发布者：arman-bd。上游模型卡未提供独立版权行；本站不补写版权年份。'],
    description:
      '小鱼 Guppy 人格模型，按需加载上游原始 ONNX 与 tokenizer.json。模型卡和源仓库 README 均声明 MIT；核查时源仓库独立 LICENSE 链接返回 404，因此许可依据为模型卡声明。下列为标准 MIT 条款，不冒称不存在的上游 LICENSE 文件原文。',
    projectUrl: 'https://huggingface.co/arman-bd/guppylm-9M',
    licenseUrl:
      'https://huggingface.co/arman-bd/guppylm-9M/blob/5f09d63fae6f5049bd2360d690f01b68a63d837b/README.md',
    licenseTexts: [
      { label: 'MIT 标准许可条款（依据上游声明）', text: `MIT License\n\n${MIT_TERMS}` },
    ],
  },
  {
    id: 'miso',
    name: 'Miso · MeowLLM / phruut ONNX 转换',
    license: 'MIT',
    version: '9697a86134592e88e433f77d31f4e4498ef6eba4',
    copyright: [
      'Copyright (c) 2026 phanii9',
      '原始模型发布：hunt3rx99/meowllm；ONNX 转换发布：phruut/meowllm-onnx。',
    ],
    description:
      '猫 Miso 人格来自 MeowLLM 原始训练权重。本站按需加载 phruut 发布的未修改 ONNX、外部数据与分词器；原模型与转换模型卡均声明 MIT。转换仓库未提供额外版权行，本站保留 phanii9 原始 MIT 全文并单独标明转换作者。',
    projectUrl: 'https://huggingface.co/phruut/meowllm-onnx',
    licenseUrl:
      'https://github.com/phanii9/MeowLLM/blob/d267a6c89bd978150ff9760ba77a37e7cee6601a/LICENSE',
    licenseTexts: [{ label: 'MeowLLM 原始 MIT License 全文', text: misoLicense }],
  },
  {
    id: 'onnxruntime-web',
    name: 'ONNX Runtime Web · onnxruntime-web',
    license: 'MIT；内含组件分别沿用第三方通知',
    version: '1.31.1',
    copyright: ['Copyright (c) Microsoft Corporation'],
    description:
      '在 Worker 中执行 Guppy 与 Miso 的真实 ONNX 推理。npm 安装包声明 MIT；本站从官方 v1.31.1 源码标签保留 LICENSE 与未删节 ThirdPartyNotices.txt。该通知覆盖上游项目的第三方材料，不代表其中每个可选组件均被本站加载。',
    projectUrl: 'https://github.com/microsoft/onnxruntime/tree/v1.31.1/js/web',
    licenseUrl: 'https://github.com/microsoft/onnxruntime/blob/v1.31.1/LICENSE',
    licenseTexts: [
      { label: 'ONNX Runtime MIT License 全文', text: onnxLicense },
      { label: 'ONNX Runtime 第三方通知全文（英文原文）', text: onnxNotices },
    ],
  },
  {
    id: 'onnxruntime-common',
    name: 'ONNX Runtime Common · onnxruntime-common',
    license: 'MIT',
    version: '1.31.1',
    copyright: ['Copyright (c) Microsoft Corporation'],
    description:
      'onnxruntime-web 的 JavaScript 公共 API 依赖。采用同一官方 v1.31.1 MIT 许可；适用的上游第三方通知全文与 ONNX Runtime Web 条目一同保留。',
    projectUrl: 'https://github.com/microsoft/onnxruntime/tree/v1.31.1/js/common',
    licenseUrl: 'https://github.com/microsoft/onnxruntime/blob/v1.31.1/LICENSE',
    licenseTexts: [{ label: 'ONNX Runtime MIT License 全文', text: onnxLicense }],
  },
  {
    id: 'wllama',
    name: '@wllama/wllama',
    license: 'MIT',
    version: '3.8.1',
    copyright: [WLLAMA_COPYRIGHT],
    description:
      '浏览器内 llama.cpp 绑定。拟真发送时按需加载的 JavaScript、Worker 和标准 WASM 来自该包。',
    projectUrl: 'https://github.com/ngxson/wllama',
    licenseUrl: 'https://github.com/ngxson/wllama/blob/master/LICENCE',
    licenseTexts: [{ label: 'MIT License 全文', text: mitLicense(WLLAMA_COPYRIGHT) }],
  },
  {
    id: 'wllama-compat',
    name: '@wllama/wllama-compat',
    license: 'MIT',
    version: '3.8.1',
    copyright: [WLLAMA_COPYRIGHT],
    description:
      '随站构建的兼容 WASM，供 wllama 为缺少 JSPI 的浏览器选择；兼容资源的许可同样保留。',
    projectUrl: 'https://github.com/ngxson/wllama',
    licenseUrl: 'https://github.com/ngxson/wllama/blob/master/LICENCE',
    licenseTexts: [{ label: 'MIT License 全文', text: mitLicense(WLLAMA_COPYRIGHT) }],
  },
  {
    id: 'llama-cpp-ggml',
    name: 'llama.cpp / ggml',
    license: 'MIT',
    copyright: ['Copyright (c) 2023-2026 The ggml authors'],
    description:
      'wllama WASM 内的模型计算运行时，包含 ggml。本站保留其独立 MIT 通知；未从 npm 包推断单独的 llama.cpp 提交版本。',
    projectUrl: 'https://github.com/ggml-org/llama.cpp',
    licenseUrl: 'https://github.com/ggml-org/llama.cpp/blob/master/LICENSE',
    licenseTexts: [
      {
        label: 'MIT License 全文',
        text: mitLicense('Copyright (c) 2023-2026 The ggml authors'),
      },
    ],
  },
  {
    id: 'react',
    name: 'React',
    license: 'MIT',
    version: '19.3.1',
    copyright: [REACT_COPYRIGHT],
    description: '工作台与许可证页面使用的界面组件运行时。',
    projectUrl: 'https://github.com/facebook/react',
    licenseUrl: 'https://github.com/facebook/react/blob/main/LICENSE',
    licenseTexts: [{ label: 'MIT License 全文', text: mitLicense(REACT_COPYRIGHT) }],
  },
  {
    id: 'react-dom',
    name: 'React DOM',
    license: 'MIT',
    version: '19.3.1',
    copyright: [REACT_COPYRIGHT],
    description: '将 React 组件渲染到浏览器 DOM 的运行时。',
    projectUrl: 'https://github.com/facebook/react',
    licenseUrl: 'https://github.com/facebook/react/blob/main/LICENSE',
    licenseTexts: [{ label: 'MIT License 全文', text: mitLicense(REACT_COPYRIGHT) }],
  },
  {
    id: 'scheduler',
    name: 'scheduler',
    license: 'MIT',
    version: '0.28.0',
    copyright: [REACT_COPYRIGHT],
    description: 'React DOM 使用的任务调度运行时。',
    projectUrl: 'https://github.com/facebook/react/tree/main/packages/scheduler',
    licenseUrl: 'https://github.com/facebook/react/blob/main/LICENSE',
    licenseTexts: [{ label: 'MIT License 全文', text: mitLicense(REACT_COPYRIGHT) }],
  },
  {
    id: 'lucide-react',
    name: 'Lucide React / Feather 来源图标',
    license: 'ISC；Feather 来源部分为 MIT',
    version: '0.468.0',
    copyright: [LUCIDE_COPYRIGHT, FEATHER_COPYRIGHT],
    description:
      '界面 SVG 图标。ISC 版权行按已安装的 lucide-react 0.468.0 原文保留；其中 Feather 来源部分另保留 Cole Bemis 的 MIT 通知。两份许可分别适用于对应作品，不能用 MIT 替换整个 Lucide 的 ISC。',
    projectUrl: 'https://github.com/lucide-icons/lucide',
    licenseUrl: 'https://lucide.dev/license',
    licenseTexts: [
      { label: 'Lucide ISC License 全文', text: LUCIDE_ISC },
      {
        label: 'Feather 来源部分 MIT License 全文',
        text: mitLicense(FEATHER_COPYRIGHT),
      },
    ],
  },
]
