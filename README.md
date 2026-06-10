# ContentCross · 跨平台内容分发工具

写一次，发全网 —— 智能改写适配各平台风格。

**支持的平台：** 小红书 · 公众号 · 抖音脚本 · 知乎 · B站

## 功能

- ✏️ 粘贴原文，选择来源/目标平台
- 🤖 **AI 模式** — 接入 DeepSeek API，大模型智能改写
- 📐 **规则模式** — 离线可用，内置转换规则
- 🌙 暗色模式
- 📋 历史记录
- 📄 示例模板一键填入

## 快速使用

1. 打开 `index.html`（或部署到 GitHub Pages）
2. 在设置面板中填入 DeepSeek API Key（可选，不填则使用规则模式）
3. 粘贴原文 → 选择目标平台 → 一键转换

## 部署到 GitHub Pages

```bash
# 1. 在 GitHub 上创建新仓库
# 2. 推送代码
git remote add origin https://github.com/你的用户名/content-cross.git
git branch -M main
git push -u origin main

# 3. 在仓库 Settings → Pages 中：
#    - Source: Deploy from a branch
#    - Branch: main, / (root)
#    - Save

# 4. 访问 https://你的用户名.github.io/content-cross
```

## 技术栈

纯前端，零依赖。HTML + CSS + JavaScript，`localStorage` 存储配置和历史。

## 许可

MIT
