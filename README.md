# CrossPost · 跨平台内容分发引擎

一篇内容，同步分发全平台。

**支持的平台：** 小红书 · 公众号 · 抖音 · 知乎 · B站

## 功能

- ✏️ 粘贴原文，选择来源和目标平台
- 🤖 **AI 模式** — 接入 DeepSeek API，大模型智能改写，质量更高
- 📐 **规则模式** — 离线可用，内置风格转换规则
- 📋 **发布日历** — 管理所有待发布内容，标记已发布
- 🌙 夜间模式 — 护眼，支持自动保存偏好
- 📄 示例模板 — 一键填入，快速体验

## 快速使用

访问 **https://zhenxyy.github.io/content-cross/** 即可使用。

1. 在引擎设置中填入 DeepSeek API Key（可选，不填自动降级为规则引擎）
2. 粘贴原文 → 选择来源平台 → 勾选分发目标
3. 点击「✨ 开始改写」→ 复制结果 → 发布到各平台

## 本地开发

```bash
git clone https://github.com/zhenxyy/content-cross.git
cd content-cross
# 用任意 HTTP 服务器打开即可
python3 -m http.server 8080
```

## 技术栈

纯前端，零依赖。HTML + CSS + JavaScript，`localStorage` 存储。

## 许可

MIT
