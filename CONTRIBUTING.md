# 贡献搞笑 AI

欢迎通过 PR 添加笑点稳定、来源清楚的模型。先读 [AI 接口与模型接入指南](docs/model-adapter-guide.md)，运行 [TeapotGPT 开发示例](examples/teapot/index.html)。当前接口在浏览器内执行 TypeScript / GGUF；新增模型涉及模拟、真实推理、显示与存储多个位置，详细文件清单都在指南里。

## 本地开始

1. 在 GitHub fork [daqieee/joking-ai](https://github.com/daqieee/joking-ai)。
2. 克隆自己的 fork 并创建分支（将 `YOUR_NAME` 换成 GitHub 用户名）：

   ```bash
   git clone https://github.com/YOUR_NAME/joking-ai.git
   cd joking-ai
   git switch -c codex/add-joke-model
   npm ci
   npm run dev
   ```

3. 打开 `http://localhost:5173/joking-ai/`；接口示例位于 `http://localhost:5173/joking-ai/examples/teapot/`。需要 Node.js 22.12+，推荐 24；无需 `.env` 或 API Key。示例页面仅供 Vite 开发，当前生产构建不发布它。

## 实现与检查

按指南补齐模型定义、七档、六档模拟、真实权重与模板、图标和场景、存储及测试；记录准确来源、大小、哈希与许可。界面文案应区分模拟演出和真实计算，手写或未训练模型也要如实说明。

新增或替换模型、运行时、图标等随站资源时，同时更新 [src/config/licenses.ts](src/config/licenses.ts) 的项目、版本、版权和完整许可，以及 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 的来源记录。需要归属说明时同步 [NOTICE](NOTICE)；上游附带 NOTICE 时保留相关原文，并明确区分本站补充说明。本站原创部分沿用 [MIT License](LICENSE)，第三方作品保留各自条款；不要用本站 MIT 覆盖上游许可。

代码 / 模型改动运行：

```bash
npm test
npm run test:models
npm run build
npm run format:check
npx playwright install chromium
npm run test:e2e
```

真实推理改动另运行 `npm run test:inference`，并实测新模型发送、停止、重试与刷新恢复；该命令默认只运行微型模型。鹈鹕大模型检查按改动需要运行，纯文档 PR 无需下载 168 MB 权重；文档改动至少检查格式和链接。不要弱化原有模型断言，新增模型时应扩展覆盖。

## 提交 PR

检查 `git diff`，只暂存本次修改，提交并推送自己的分支：

```bash
git status
git diff
# 用实际修改的文件路径替换下面的占位路径，可一次列出多个文件。
git add path/to/changed-file
git commit -m "feat: add a joke model"
git push -u origin codex/add-joke-model
```

随后在 GitHub 从 fork 的该分支向 `daqieee/joking-ai` 的 `main` 提交 PR。说明笑点与预期输出、上游链接和许可、模拟 / 拟真差别、已执行检查与未验证范围。PR 工作流运行检查，合入后的 `main` 推送才会触发正式部署。
