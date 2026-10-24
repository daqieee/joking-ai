# Git 接续与发布记录

2026-10-24 已完成本地 Git 接续、实现提交与推送，GitHub Pages 已成功部署。

## 当前起点

- 工作目录：`D:\project\joking-ai`。源文件来自恢复的本地项目，现已恢复 `.git`。
- 目标仓库：[daqieee/joking-ai](https://github.com/daqieee/joking-ai)。接续时远端 `main` 为 `fcbe3398a8fc6b82eee8e7e7be6563cebf534cdc`，仅有 README。
- 实现提交为 [`00c4929033938e4bd70e62933ed891e7bb54837d`](https://github.com/daqieee/joking-ai/commit/00c4929033938e4bd70e62933ed891e7bb54837d)，父提交保留 `fcbe3398a8fc6b82eee8e7e7be6563cebf534cdc`，已推送到 `main`。
- [Actions 运行 40048570024](https://github.com/daqieee/joking-ai/actions/runs/40048570024) 的 `verify` 与 `deploy` 均成功。
- 生产 base 是 `/joking-ai/`，正式地址为 [Joking AI](https://daqieee.github.io/joking-ai/)，已实际打开首页。

## 无 Git 元数据时的恢复方案

以下步骤已在本轮完成，供再次从压缩包恢复时使用。当前目录已经存在 `.git`，不重复初始化。

```powershell
git init -b main
git remote add origin https://github.com/daqieee/joking-ai.git
git fetch origin main
git log --oneline -n 5 origin/main
```

核对远端仍为上述起点；如果远端已有新提交，先阅读其改动，再决定如何接续。确认后把本地分支指向获取的远端提交，`--mixed` 保留工作目录中的全部源文件。

```powershell
git reset --mixed origin/main
git add .github docs public scripts src tests .gitignore .prettierignore .prettierrc.json index.html package.json package-lock.json playwright.config.ts README.md LOCAL_HANDOFF.md THIRD_PARTY_NOTICES.md tsconfig.json vite.config.ts
git status --short
git diff --cached --stat
git diff --cached --check
```

`.gitignore` 已排除旧版 `EXPORT_MANIFEST.json`、日志、压缩包、`handoff/`、依赖、构建产物、模型缓存和临时测试产物。最新验收截图与报告在本地 `handoff/validation/` 保留，不纳入代码提交。

## 本轮提交与发布

本轮已检查[最终验收结果](model-integration.md#本站验收结果)、暂存差异和格式，完成后续实现提交并推送：

```powershell
git add .github docs scripts tests README.md LOCAL_HANDOFF.md THIRD_PARTY_NOTICES.md
git diff --cached --check
git commit -m "Build Joking AI with three local joke models"
git log --oneline --graph -n 4
```

```powershell
git push origin main
```

仓库已只读确认 Pages 的 `build_type=workflow`，无需修改设置。工作流 **Verify and deploy to GitHub Pages** 依次检查格式、微型模型可复现构建与哈希、单元测试、TypeScript / 生产构建、桌面及手机参数模拟 E2E，再上传 `dist/` 并部署。

## 线上验收

主任务已在正式地址人工确认首页可用、鹈鹕“中”档模拟成功且预设静态文件正确、随机数首页卡片联动正确、七档菜单正确。随机数拟真实际输出 `89` 并显示 GGUF 标识；Teapot 拟真完整输出 `418 · I'm a teapot.` 及中文自制权重说明。刷新后消息、模型与拟真元数据保持，详细范围见[模型验收说明](model-integration.md#线上发布验收)。

鹈鹕远程权重全量下载、完整 HTML 与长序列仍未验证；本地有界生成不能替代这些结论。部署后的本次说明补记只改 `LOCAL_HANDOFF.md`、`docs/model-integration.md` 和 `docs/release-plan.md`，提交信息使用 `docs: record verified GitHub Pages deployment [skip ci]`，不改变已部署的实现产物。
