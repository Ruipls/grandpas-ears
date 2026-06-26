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
Phase 0 (当前): PWA 原型 → 浏览器验证核心交互
Phase 1:         Flutter 正式版 → iOS/Android 端侧推理
Phase 2:         声纹识别 → 自动区分说话人
```

---

## 🚀 快速开始 Quick Start

### Phase 0: PWA 原型

```bash
cd pwa-prototype
npx live-server --port=3000
# 浏览器打开 http://localhost:3000
# 或手机访问 http://<你的电脑IP>:3000
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
