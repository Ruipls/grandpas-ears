# Grandpa's Ears (爷爷的耳朵)

> 让每一次对话，都被看见。
> *Make every conversation visible.*

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Phase](https://img.shields.io/badge/phase-PWA%20Prototype-orange)]()

**Grandpa's Ears** 是一款面向听障人士的免费开源实时语音转文字应用。将手机放在对话场景中，它会把周围语音实时转化为大字幕，帮助听障人士"看见"对话内容。

*Grandpa's Ears is a free, open-source, real-time speech-to-text app for people with hearing impairments. Place your phone in a conversation, and it converts speech into large captions in real time — helping users "see" the conversation.*

---

## 🎯 核心特点 Core Features

- 🎤 **实时语音识别** — 边说边显示，延迟 < 1 秒
- 📱 **手机即用** — 不需要额外设备，自己的手机就能跑
- 🔒 **隐私至上** — 语音数据不上传，全部在设备本地处理
- 📡 **离线可用** — 核心功能不需要网络（Flutter 版）
- 🆓 **永久免费** — 开源，无广告，无付费墙
- ♿ **大字模式** — 为老年人和视障用户优化

---

## 📋 项目文档 Project Docs

| 文档 | 内容 |
|------|------|
| [VISION.md](./VISION.md) | 项目总陈述：愿景、原则、阶段规划 |
| [PRD.md](./PRD.md) | 产品需求文档：功能列表、用户故事、交互设计 |
| [TECHNICAL_ROADMAP.md](./TECHNICAL_ROADMAP.md) | 技术路线：架构、技术选型、开发指南 |

---

## 🗺️ 路线图 Roadmap

```
Phase 0 (当前): PWA 原型 → 浏览器验证核心交互  ✅ 已搭建，测试中
Phase 1:         Flutter 正式版 → iOS/Android 端侧推理  📋 已规划
Phase 2:         声纹识别 → 自动区分说话人  📋 已规划
```

---

## 📊 当前进度 Current Status

### ✅ 已完成

| 事项 | 说明 |
|------|------|
| 项目文档 | VISION.md / PRD.md / TECHNICAL_ROADMAP.md |
| PWA 原型 | 纯 HTML/CSS/JS，Web Speech API 语音识别 |
| GitHub Pages 部署 | https://ruipls.github.io/grandpas-ears/ |
| 核心交互 | 实时识别 → 聊天气泡展示、A/B 说话人切换 |
| 大字体 / 暗色模式 | 一键切换，localStorage 记忆 |
| PWA 安装 | Service Worker 离线缓存，可添加到主屏幕 |
| 对话持久化 | localStorage 存储，刷新不丢失 |

### 🐛 已知问题

| 问题 | 状态 | 说明 |
|------|------|------|
| **iOS Safari 说完一句话出现两个气泡** | 🟡 已加修复，需真机复测 | 应用层新增短窗口回声拦截：刚固化的一句话如果被 Safari 重启后的新 session 再次作为 interim/final 返回，会删除临时气泡并跳过重复渲染 |
| 文字偶有重复拼接 | 🟡 部分修复 | `final =` 替代 `final +=` 后有所改善 |
| Chrome 部分模型需联网 | 🟡 浏览器限制 | Phase 1 用 whisper.cpp 彻底解决 |

### 🔜 下一步

1. **iOS 真机复测双重气泡修复**：重点测短句、连续两句相同内容、停止/重启
2. **Phase 1 启动**：PWA 核心交互验证通过后，启动 Flutter + whisper.cpp 端侧推理

---

## 🐛 Known Issues

### iOS Safari 双重气泡 (Duplicate Bubbles)

**现象**：在 iOS Safari 上，说完一句话后出现两个内容相同的气泡。

**根因分析**：iOS Safari 的 Web Speech API 存在已知缺陷：
- `SpeechRecognition.isFinal` 经常永远返回 `false`
- `onend` 事件触发时，`onresult` 的 interim 文本被重复作为 final 发送
- `continuous: true` 模式下事件模型复杂，多个 result 交叉触发

**已完成的修复**：
- `continuous: false` + 手动重启 ✓(部分改善)
- `onend` 中强制 finalize ✓(部分改善)
- storage 层去重 (3秒窗口)
- UI 层去重 (ID 检查)
- speech.js 层去重 (lastSentText 追踪)
- app.js 层短窗口回声拦截：拦截重启 session 返回的重复 interim/final，并删除已创建的重复临时气泡
- Service Worker 升级到 `grandpasears-v3`，网络优先加载静态资源，减少旧脚本缓存干扰

**复测建议**：
- iPhone Safari 打开 GitHub Pages 后刷新一次，确保加载新 Service Worker
- 说一个短句，停顿 1 秒，确认只出现一个气泡
- 连续说两次完全相同短句，中间停顿超过 2 秒，确认第二句仍会出现
- 点击停止时确认最后一个临时气泡会固化，不会额外新增
- Phase 1 迁移到 whisper.cpp 后可彻底摆脱 Web Speech API 的事件不稳定性

---

## 🚀 快速开始 Quick Start

### 在线体验 (推荐)

📱 iPhone Safari 打开: **https://ruipls.github.io/grandpas-ears/**

### 本地开发

```bash
cd docs
python3 -m http.server 3000
# 浏览器打开 http://localhost:3000
```

> 需要 Chrome 或 Safari 浏览器。iOS Safari 14.5+ 支持。

---

## 🤝 贡献 Contributing

欢迎任何形式的贡献！这是一个社区驱动的公益项目。

- 🐛 报告 Bug → [Issues](https://github.com/Ruipls/grandpas-ears/issues)
- 💡 提建议 → [Discussions](https://github.com/Ruipls/grandpas-ears/discussions)
- 📖 改进文档 → 直接提 PR
- 🌐 翻译 → 帮助翻译成更多语言

---

## 📄 许可 License

MIT License — 自由使用、修改、分发。

---

> "爷爷的耳朵" 献给所有需要"看见"声音的人。
> *Dedicated to everyone who needs to "see" sound.*
