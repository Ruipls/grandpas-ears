# Grandpa's Ears — Product Requirements Document (PRD)

> **爷爷的耳朵 — 产品需求文档**
>
> 让每一次对话，都被看见。
> *Make every conversation visible.*
>
> 版本：v0.1 | 日期：2026-06-26 | 状态：草案 Draft

---

## 目录 Table of Contents

1. [产品概述 Product Overview](#1-产品概述-product-overview)
2. [用户画像与场景 User Personas & Scenarios](#2-用户画像与场景-user-personas--scenarios)
3. [功能需求 Functional Requirements](#3-功能需求-functional-requirements)
4. [用户故事 User Stories](#4-用户故事-user-stories)
5. [交互流程 Interaction Flows](#5-交互流程-interaction-flows)
6. [界面设计指南 UI Design Guidelines](#6-界面设计指南-ui-design-guidelines)
7. [非功能需求 Non-Functional Requirements](#7-非功能需求-non-functional-requirements)
8. [验收标准 Acceptance Criteria](#8-验收标准-acceptance-criteria)
9. [Phase 2 展望 Phase 2 Outlook](#9-phase-2-展望-phase-2-outlook)
10. [附录 Appendix](#10-附录-appendix)

---

## 1. 产品概述 Product Overview

### 1.1 产品简介 Introduction

Grandpa's Ears 是一款面向听障人士的**实时语音转文字应用**。用户打开手机，放在对话场景中，应用将周围语音实时转化为大字幕文字，帮助听障人士"看见"对话内容。

*Grandpa's Ears is a **real-time speech-to-text application** for people with hearing impairments. Users open the app, place their phone in a conversation setting, and surrounding speech is instantly converted into large-print captions — helping them "see" the conversation.*

### 1.2 核心价值 Core Value Proposition

| 痛点 Pain Point | 解决方案 Solution |
|---|---|
| 听障人士听不清/听不见对话 | 实时语音 → 文字，大字幕显示 |
| 助听器在嘈杂环境效果差 | 手机麦克风近距离收音 + 视觉辅助 |
| 现有付费方案太贵 | 完全免费，开源，自己的手机就能用 |
| 需要复杂的设置才能用 | 打开即用，极简交互 |

### 1.3 产品策略 Product Strategy

```
PWA 原型 (Phase 0)  →  Flutter 正式版 (Phase 1)  →  声纹识别 (Phase 2)
  快速验证交互           跨平台端侧推理               多人对话场景
  1-2 周                 1-3 个月                    远期
```

---

## 2. 用户画像与场景 User Personas & Scenarios

### 2.1 主要用户画像 Primary Persona

#### 画像 A：老年性听力衰退者

| 属性 | 描述 |
|------|------|
| **姓名 Name** | 王大爷 (Uncle Wang) |
| **年龄 Age** | 72 岁 |
| **听力状况 Hearing** | 中度老年性听力衰退，助听器效果有限 |
| **技术能力 Tech Level** | 会用智能手机的基本功能（微信、电话） |
| **典型场景** | 与老伴、子女、医生交流 |
| **核心诉求** | 字体要大、操作要简单、别让我等 |
| **痛点** | "孩子们说话太快，我听不清，又不好意思一直让他们重复" |

#### 画像 B：中年听障人士

| 属性 | 描述 |
|------|------|
| **姓名 Name** | 李姐 (Ms. Li) |
| **年龄 Age** | 45 岁 |
| **听力状况 Hearing** | 先天性听力障碍，佩戴人工耳蜗 |
| **技术能力 Tech Level** | 熟练使用智能手机 |
| **典型场景** | 工作会议、日常购物、餐厅点餐 |
| **核心诉求** | 准确率高、能区分说话人、隐私安全 |
| **痛点** | "开会时多人说话，我分不清谁说了什么" |

### 2.2 使用场景 Scenarios

| 优先级 Priority | 场景 Scenario | 描述 Description |
|---|---|---|
| P0 | 居家日常对话 | 与家人一对一聊天，手机放在茶几上 |
| P0 | 看诊沟通 | 与医生面对面交流，准确接收医嘱 |
| P1 | 外出办事 | 银行、超市、餐厅等公共场所沟通 |
| P1 | 电话/视频通话 | 对方开了免提，看屏幕实时字幕 |
| P2 | 小型会议 | 3-5 人讨论（需要声纹识别） |

---

## 3. 功能需求 Functional Requirements

### 3.1 Phase 0: PWA 原型 (MVP)

> 目标：用最短时间验证核心交互流程，确认 Web Speech API 在目标场景下的可用性。

| ID | 功能 Feature | 描述 Description | 优先级 |
|---|---|---|---|
| F-001 | 实时语音识别 | 调用设备麦克风，将语音实时转为文字。使用浏览器内置 Web Speech API | P0 |
| F-002 | 对话流展示 | 识别结果以聊天气泡形式展示。区分"说话人 A"和"说话人 B" | P0 |
| F-003 | 说话人切换 | 手动切换当前说话人（点击按钮切换 A/B） | P0 |
| F-004 | 暂停/恢复识别 | 暂停和恢复语音识别功能 | P0 |
| F-005 | 对话历史查看 | 最近的对话内容可滚动回看 | P1 |
| F-006 | 大字体模式 | 至少支持两种字号：标准（16px）和大字（24px+） | P0 |
| F-007 | 清除对话 | 一键清空当前对话内容 | P1 |
| F-008 | PWA 安装 | 支持"添加到主屏幕"，像原生 App 一样使用 | P1 |

### 3.2 Phase 1: Flutter 正式版

| ID | 功能 Feature | 描述 Description | 优先级 |
|---|---|---|---|
| F-101 | 端侧离线识别 | 使用 whisper.cpp 在设备本地运行语音识别，无需网络 | P0 |
| F-102 | iOS + Android | 一套代码双平台运行 | P0 |
| F-103 | 自动语音检测 | 自动检测说话开始和结束（VAD - Voice Activity Detection） | P0 |
| F-104 | 对话记录持久化 | SQLite 本地存储对话历史，支持查看和删除 | P0 |
| F-105 | 暗色模式 | 深色背景 + 高对比度文字，夜间使用更舒适 | P1 |
| F-106 | 震动/视觉提示 | 检测到语音时可选震动或屏幕闪烁提示 | P1 |
| F-107 | 字体大小可调 | 从 14px 到 48px 无级调节 | P0 |
| F-108 | 导出对话 | 导出对话记录为文本或 PDF | P2 |
| F-109 | 语言选择 | 支持中文普通话、英语、粤语等（whisper 多语言能力） | P1 |

### 3.3 Phase 2: 声纹识别

| ID | 功能 Feature | 描述 Description | 优先级 |
|---|---|---|---|
| F-201 | 声纹注册 | 用户可录制几秒语音来注册一个说话人身份 | P1 |
| F-202 | 说话人自动识别 | 实时识别当前说话人，自动标注名字 | P1 |
| F-203 | 多人对话 | 3+ 人对话场景的说话人分离（Speaker Diarization） | P1 |

---

## 4. 用户故事 User Stories

### Phase 0 (PWA)

| ID | 用户故事 | 验收条件 |
|---|---|---|
| US-001 | 作为听障用户，我打开网页就能看到对话字幕，不需要登录或设置 | 打开 URL → 点击"开始" → 立刻看到识别文字 |
| US-002 | 作为听障用户，我可以通过大字体看到对方说的话 | 切换到"大字体模式"后，字号 ≥ 24px |
| US-003 | 作为听障用户，我能手动标记"现在是谁在说话" | 点击 A/B 按钮后，后续识别内容归属对应说话人 |
| US-004 | 作为听障用户，我可以回看刚才没看清的对话 | 滑动屏幕向上滚动查看历史消息 |
| US-005 | 作为老年人用户，我不需要理解任何技术概念就能使用 | 界面最多 3 个按钮，所有文字清晰可读 |

### Phase 1 (Flutter)

| ID | 用户故事 | 验收条件 |
|---|---|---|
| US-101 | 作为用户，我在没有网络的地方也能使用 | 飞行模式下，语音识别正常工作 |
| US-102 | 作为用户，我说的话只留在我自己的手机里 | 断网测试：所有功能正常，无数据外发 |
| US-103 | 作为用户，昨天的对话记录今天还能看到 | 关闭 App 重开后，历史对话依然存在 |

---

## 5. 交互流程 Interaction Flows

### 5.1 主流程 Main Flow

```
┌─────────────────────────────────────────────────────┐
│                   Grandpa's Ears                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │                                                 │ │
│  │   [对方] 今天天气真好啊，我们出去走走吧            │ │
│  │                                                 │ │
│  │                    好的，等我换件衣服 🧑            │ │
│  │                                                 │ │
│  │   [对方] 不着急，我在楼下等你                     │ │
│  │                                                 │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │  正在聆听...  🎤     [A 说话] [B 说话] [暂停]    │ │
│  │                                   🅰  🅱   ⏸    │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 5.2 首次使用流程 First-Time Flow

```
打开应用 → 授予麦克风权限 → 看到"开始聆听"按钮 → 点击开始 → 对话开始
```

> 设计原则：从打开到第一次识别，不超过 2 步操作。

### 5.3 说话人切换逻辑 (PWA Phase)

在 PWA 阶段，无法自动区分说话人，采用**手动切换**模式：

1. 默认当前说话人为"说话人 A"
2. 屏幕底部有两个大按钮：🅰 和 🅱
3. 当对方要说话时，用户点击 🅱，后续文字归属 B
4. 当用户自己要说话时，点击 🅰，后续文字归属 A
5. 按钮状态清晰（高亮/非高亮），一眼就知道"现在是谁"

---

## 6. 界面设计指南 UI Design Guidelines

### 6.1 设计原则 Design Principles

| 原则 | 说明 |
|------|------|
| **大字优先 Large Text First** | 对话内容字号默认 18px，支持到 48px |
| **高对比度 High Contrast** | 文字与背景对比度 ≥ 7:1（WCAG AAA） |
| **少即是多 Minimalism** | 主界面最多 5 个可交互元素 |
| **触手可及 Thumb-Friendly** | 所有按钮在屏幕下半部分，单手可操作 |
| **即时反馈 Instant Feedback** | 每个操作 100ms 内有视觉反馈 |

### 6.2 配色方案 Color Palette

| 用途 | 颜色 | 说明 |
|------|------|------|
| 背景 | #FFFFFF / #1A1A1A (暗色) | 纯白或纯黑，最大化对比度 |
| 说话人 A 气泡 | #E3F2FD (浅蓝) | 左侧，区分于 B |
| 说话人 B 气泡 | #F3E5F5 (浅紫) | 右侧，区分于 A |
| 主文字 | #212121 / #FAFAFA | 深灰黑，不是纯黑（减少视觉疲劳） |
| 强调按钮 | #1565C0 | 蓝，足够醒目 |
| 系统消息 | #757575 | 灰色，不干扰主内容 |

### 6.3 字体 Typography

- 中文：系统默认中文字体（PingFang SC / Noto Sans SC）
- 数字/英文：系统默认（SF Pro / Roboto）
- 行高：≥ 1.6（增强可读性）
- 最小字号：14px（辅助信息），18px（对话内容默认）

### 6.4 布局 Layout (PWA)

```
┌──────────────────────────────┐
│         状态栏 (可选)          │  48px
├──────────────────────────────┤
│                              │
│         对话区域              │  flex-grow
│     (聊天气泡，可滚动)         │
│                              │
├──────────────────────────────┤
│     识别状态指示器            │  32px
├──────────────────────────────┤
│  [🅰 我] [🅱 对方] [⏸] [🔄] │  64px
│     操作栏（大按钮）          │
└──────────────────────────────┘
```

---

## 7. 非功能需求 Non-Functional Requirements

### 7.1 性能 Performance

| 指标 Metric | 目标 Target |
|---|---|
| 语音 → 文字延迟 (PWA) | < 1 秒（Web Speech API 限制） |
| 语音 → 文字延迟 (Flutter) | < 500ms |
| 应用冷启动 | < 3 秒 |
| 持续使用耗电 | < 15% / 小时 |
| 内存占用 | < 200MB（包含 whisper 模型） |
| 安装包体积 (Flutter APK) | < 150MB（含 base 模型） |

### 7.2 无障碍 Accessibility

| 需求 | 标准 |
|------|------|
| 屏幕阅读器兼容 | VoiceOver (iOS) / TalkBack (Android) 完整支持 |
| 对比度 | WCAG 2.1 Level AAA (≥ 7:1) |
| 触控目标 | 所有可点击元素 ≥ 48×48dp |
| 键盘导航 | 支持外接键盘的基本操作 |
| 动画 | 遵循 prefers-reduced-motion |

### 7.3 隐私与安全 Privacy & Security

| 需求 | 实现 |
|------|------|
| 语音数据不上传 | 端侧处理，零网络传输 |
| 无用户注册 | 不需要账号，不需要登录 |
| 无第三方追踪 | 不含任何分析/广告 SDK |
| 对话数据本地存储 | 仅存储于设备本地 SQLite |
| 隐私声明 | 首次启动展示简洁的隐私说明（< 200 字） |

### 7.4 兼容性 Compatibility

| 平台 | 要求 |
|------|------|
| PWA | Chrome ≥ 87, Safari ≥ 14.1, Edge ≥ 87 |
| iOS | ≥ iOS 15 |
| Android | ≥ Android 8 (API 26) |
| 屏幕 | 支持 320px - 428px 宽度（小屏手机到平板） |

---

## 8. 验收标准 Acceptance Criteria

### Phase 0 (PWA) — 里程碑：可以给真实听障用户试用

| # | 验收条件 |
|---|---|
| AC-001 | 在 Chrome (Android) 和 Safari (iOS) 中均能打开并使用语音识别 |
| AC-002 | 中文普通话识别连续 30 秒不停顿、不崩溃 |
| AC-003 | 说话人 A/B 切换后，后续文字归属正确 |
| AC-004 | 字号切换（标准/大）后，对话内容立即响应 |
| AC-005 | 添加到主屏幕后，可以全屏模式运行（无浏览器地址栏） |
| AC-006 | 至少 3 位非技术用户能独立完成"打开 → 开始聆听 → 看到文字" |

### Phase 1 (Flutter) — 里程碑：应用商店发布就绪

| # | 验收条件 |
|---|---|
| AC-101 | 飞行模式下完整功能正常（离线识别） |
| AC-102 | 中文识别准确率 ≥ 95%（安静环境） |
| AC-103 | 对话历史重启 App 后保留 |
| AC-104 | 暗色模式正常工作 |
| AC-105 | VoiceOver / TalkBack 可朗读对话内容 |

---

## 9. Phase 2 展望 Phase 2 Outlook

以下功能在 MVP 中不做，但在架构上预留扩展空间：

- **声纹注册与识别** — 自动标注说话人姓名
- **多人对话 (3+ 人)** — Speaker Diarization
- **关键词检测** — 识别到医生说的"药名"、"剂量"等关键词时高亮提醒
- **多语言翻译** — 识别外语语音 → 翻译成中文文字
- **可穿戴设备** — 智能眼镜上的实时字幕

---

## 10. 附录 Appendix

### 10.1 术语表 Glossary

| 术语 | 英文 | 说明 |
|------|------|------|
| ASR | Automatic Speech Recognition | 自动语音识别，将语音转为文字 |
| VAD | Voice Activity Detection | 语音活动检测，判断是否有人在说话 |
| PWA | Progressive Web App | 渐进式 Web 应用，可在浏览器中像原生 App 一样运行 |
| Speaker Diarization | Speaker Diarization | 说话人分离，识别"谁在什么时候说话" |
| 声纹 | Voiceprint / Speaker Embedding | 说话人的声音特征向量 |

### 10.2 竞品参考 Competitive Reference

| 产品 | 差异点 |
|------|--------|
| 讯飞听见 | 付费、需联网、非开源 |
| Google Live Transcribe | 免费但仅 Android、不开源、需 Google 服务 |
| Ava | 付费订阅、需联网 |
| **Grandpa's Ears** | **免费、开源、离线、中文优先** |

### 10.3 参考文档 References

- [VISION.md](./VISION.md) — 项目总陈述
- [TECHNICAL_ROADMAP.md](./TECHNICAL_ROADMAP.md) — 技术路线
- [Web Speech API Spec](https://wicg.github.io/speech-api/)
- [whisper.cpp](https://github.com/ggerganov/whisper.cpp)
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)

---

> **Next: 阅读 [TECHNICAL_ROADMAP.md](./TECHNICAL_ROADMAP.md) 了解具体技术方案。**
>
> 最后更新：2026-06-26 | 状态：草案 v0.1
