# Git 接续与发布准备

2026-10-24 已完成本地 Git 初始化、获取远端 `main`、接续原提交历史与源文件暂存。尚未执行 Git 提交、推送或 GitHub Pages 部署。

## 当前起点

- 工作目录：`D:\project\joking-ai`。源文件来自恢复的本地项目，现已恢复 `.git`。
- 目标仓库：[daqieee/joking-ai](https://github.com/daqieee/joking-ai)。接续时远端 `main` 为 `fcbe3398a8fc6b82eee8e7e7be6563cebf534cdc`，仅有 README。
- 本地 `main` 已接续该远端提交，功能文件已暂存；最终文档更新后需要重新暂存，再创建后续提交。
- 生产 base 是 `/joking-ai/`，目标地址为 [Joking AI](https://daqieee.github.io/joking-ai/)。

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

## 当前待执行步骤

最终文档更新后重新暂存，并检查[最终验收结果](model-integration.md#本站验收结果)、差异和格式，再创建一个后续提交：

```powershell
git add .github docs scripts tests README.md LOCAL_HANDOFF.md THIRD_PARTY_NOTICES.md
git diff --cached --check
git commit -m "Build Joking AI with three local joke models"
git log --oneline --graph -n 4
```

## 主任务确认后发布

推送属于后续发布步骤，等主任务发出验收和发布信号后执行：

```powershell
git push origin main
```

仓库已只读确认 Pages 的 `build_type=workflow`，无需修改设置。工作流 **Verify and deploy to GitHub Pages** 依次检查格式、微型模型可复现构建与哈希、单元测试、TypeScript / 生产构建、桌面及手机参数模拟 E2E，再上传 `dist/` 并部署。

部署后还需实际打开线上地址，检查 `/joking-ai/` 资源、两批首页卡片联动、三模型选择、六档模拟、鹈鹕预设页面、随机与 Teapot 的实际 GGUF、刷新恢复和手机布局。鹈鹕远程权重下载及完整生成按线上实际结果另记；本地部分输出验收不能替代它。
