# Grandpa's Ears — Technical Roadmap

> **爷爷的耳朵 — 技术路线**
>
> 如何在"完全免费"的约束下，让每个用户用自己的设备就能跑起来。
> *How to make it run on every user's own device, completely free.*
>
> 版本：v0.1 | 日期：2026-06-26 | 状态：草案 Draft

---

## 目录 Table of Contents

1. [总体策略 Overall Strategy](#1-总体策略-overall-strategy)
2. [Phase 0: PWA 原型 Phase 0: PWA Prototype](#2-phase-0-pwa-原型-phase-0-pwa-prototype)
3. [Phase 1: Flutter 正式版 Phase 1: Flutter Production](#3-phase-1-flutter-正式版-phase-1-flutter-production)
4. [架构设计 Architecture Design](#4-架构设计-architecture-design)
5. [项目结构 Project Structure](#5-项目结构-project-structure)
6. [开发环境搭建 Dev Environment Setup](#6-开发环境搭建-dev-environment-setup)
7. [构建与分发 Build & Distribution](#7-构建与分发-build--distribution)
8. [免费成本分析 Free Cost Analysis](#8-免费成本分析-free-cost-analysis)
9. [Phase 2 技术预研 Phase 2 Technical Research](#9-phase-2-技术预研-phase-2-technical-research)
10. [风险与缓解 Risks & Mitigations](#10-风险与缓解-risks--mitigations)

---

## 1. 总体策略 Overall Strategy

### 1.1 核心约束 Core Constraints

| 约束 Constraint | 含义 Implication |
|---|---|
| **零费用 Zero Cost** | 不使用任何付费 API / 云服务。一切跑在用户设备上 |
| **端侧优先 Edge-First** | 语音识别、存储、所有计算都在本地完成 |
| **离线可用 Offline Capable** | 核心功能不依赖网络连接 |
| **开源 Open Source** | 代码完全公开，社区可以参与贡献 |

### 1.2 两阶段策略 Two-Phase Strategy

```
┌─────────────────────────────────────────────────────────┐
│                   Grandpa's Ears                          │
│                                                          │
│  Phase 0: PWA 原型 (当前)                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐ │
│  │ Web Speech  │ →  │  纯前端 JS    │ →  │ 浏览器运行   │ │
│  │    API      │    │  HTML/CSS/JS  │    │ Chrome/Safari│ │
│  └─────────────┘    └──────────────┘    └─────────────┘ │
│  目标: 1-2 周做出可用的原型，验证交互流程                   │
│                                                          │
│  Phase 1: Flutter 正式版 (验证后)                          │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐ │
│  │ whisper.cpp │ →  │   Flutter     │ →  │ iOS/Android │ │
│  │   端侧推理   │    │   Dart/FFI    │    │   原生 App   │ │
│  └─────────────┘    └──────────────┘    └─────────────┘ │
│  目标: 1-3 个月做出离线可用的正式版本                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Phase 0: PWA 原型 Phase 0: PWA Prototype

### 2.1 技术选型 Tech Stack

| 层面 | 选择 | 理由 |
|------|------|------|
| **语音识别** | Web Speech API (SpeechRecognition) | 浏览器内置，完全免费，零配置 |
| **前端框架** | 无框架 (Vanilla HTML/CSS/JS) | 原型阶段避免框架开销，保持极简 |
| **样式** | 纯 CSS + CSS Custom Properties | 支持暗色模式、字号切换 |
| **存储** | localStorage | 对话历史简单持久化 |
| **PWA 能力** | Service Worker + Web App Manifest | 离线缓存、添加到主屏幕 |
| **部署** | GitHub Pages | 免费 HTTPS 静态托管 |

### 2.2 Web Speech API 能力评估

```javascript
// Web Speech API 核心接口
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

// 关键配置
recognition.lang = 'zh-CN';        // 中文普通话
recognition.continuous = true;     // 持续识别
recognition.interimResults = true; // 实时返回中间结果
```

#### 各平台支持情况

| 平台 | 支持情况 | 备注 |
|------|----------|------|
| **Chrome (Android)** | ✅ 完整支持 | 最佳体验，支持 continuous + interim |
| **Safari (iOS)** | ⚠️ 部分支持 | iOS 14.5+ 支持，但 continuous 可能不稳定 |
| **Chrome (Desktop)** | ✅ 完整支持 | 开发调试用 |
| **Firefox** | ❌ 不支持 | 需提示用户换 Chrome |
| **Edge** | ✅ 完整支持 | 基于 Chromium |

> ⚠️ **关键风险**: Safari (iOS) 上 Web Speech API 的 `continuous: true` 模式可能在一段时间后自动停止。Phase 0 需要重点测试 iOS Safari 的兼容性，并在代码中加入自动重启机制。

### 2.3 PWA 文件结构

```
pwa-prototype/
├── index.html              # 主页面，对话界面
├── manifest.json           # PWA 应用清单
├── sw.js                   # Service Worker（离线缓存）
├── css/
│   └── style.css           # 全局样式 + CSS 变量
├── js/
│   ├── app.js              # 主逻辑入口
│   ├── speech.js           # Web Speech API 封装
│   ├── ui.js               # UI 更新逻辑
│   └── storage.js          # localStorage 封装
├── assets/
│   ├── icon-192.png        # PWA 图标
│   └── icon-512.png
└── README.md
```

### 2.4 关键代码路径 PWA Key Code Paths

```
用户点击"开始聆听"
  → speech.js: recognition.start()
    → 'result' 事件触发 → app.js: 接收文字
      → 判断当前说话人 (A/B)
        → ui.js: 创建气泡、滚动到底部
          → storage.js: 追加到对话历史

用户点击"切换说话人"
  → app.js: currentSpeaker = 'B'
    → ui.js: 高亮 B 按钮，后续文字归入 B

用户点击"暂停"
  → speech.js: recognition.stop()
    → ui.js: 显示"已暂停"状态
```

### 2.5 Web Speech API 已知问题与应对

| 问题 | 应对方案 |
|------|----------|
| Safari 自动停止 | 监听 `onend` 事件，自动 `restart()` |
| 识别结果不完整 | 利用 `interimResults` 实时显示，`isFinal` 时更新 |
| 网络依赖（Chrome 部分模型需联网） | 检测 offline 状态，提示用户 |
| 无声音时持续返回空结果 | 忽略空字符串，不做 UI 更新 |

---

## 3. Phase 1: Flutter 正式版 Phase 1: Flutter Production

### 3.1 技术选型 Tech Stack

| 层面 Layer | 选择 Choice | 理由 Rationale |
|---|---|---|
| **框架 Framework** | Flutter 3.x | 跨平台，性能好，Dart 生态成熟 |
| **语音识别 ASR** | whisper.cpp (via FFI) | 端侧推理，离线，免费，中文好 |
| **VAD** | silero-vad 或 whisper.cpp 内置 | 检测语音起止，节省算力 |
| **本地存储** | sqflite | SQLite 封装，对话历史持久化 |
| **状态管理** | Riverpod 或 Provider | 轻量，Flutter 社区主流 |
| **暗色模式** | Flutter ThemeData | 内置支持 |
| **无障碍** | Flutter Semantics | 内置 VoiceOver/TalkBack |

### 3.2 whisper.cpp 集成方案

```
┌──────────────────────────────────────────┐
│              Flutter App                  │
│  ┌────────────────────────────────────┐  │
│  │          Dart 层                    │  │
│  │  - UI (聊天气泡)                    │  │
│  │  - 对话管理                        │  │
│  │  - 状态管理                        │  │
│  └──────────────┬─────────────────────┘  │
│                 │ FFI / Platform Channel  │
│  ┌──────────────▼─────────────────────┐  │
│  │        Native 桥接层                │  │
│  │  - iOS: Swift / C++ wrapper        │  │
│  │  - Android: Kotlin / JNI wrapper   │  │
│  └──────────────┬─────────────────────┘  │
│                 │                        │
│  ┌──────────────▼─────────────────────┐  │
│  │         whisper.cpp                │  │
│  │  - 模型加载 (ggml 格式)             │  │
│  │  - 音频编码 → 文本解码              │  │
│  │  - CoreML (iOS) / GPU (Android)    │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

#### 模型选择

| 模型 | 大小 | 内存 | 中文准确率 | 速度 (iPhone 14) | 推荐 |
|------|------|------|-----------|-----------------|------|
| tiny | 39 MB | ~80 MB | ★★★☆☆ | 实时 (0.3x 实时) | ✅ 推荐 |
| base | 74 MB | ~150 MB | ★★★★☆ | 实时 (0.5x 实时) | ✅ 推荐 |
| small | 244 MB | ~500 MB | ★★★★★ | 近实时 (0.8x 实时) | 可选 |
| medium | 769 MB | ~1.5 GB | ★★★★★ | 慢 (1.5x 实时) | 不推荐 |

> 建议：默认内置 tiny 模型（包体积小），首次启动时可选下载 base/small 模型获得更好体验。

#### 音频处理管线

```
麦克风 PCM 音频
  → VAD (Voice Activity Detection)
    → 检测到语音段
      → 重采样到 16kHz 单声道
        → whisper.cpp 推理
          → 文本输出 (含时间戳)
            → Flutter UI 更新
```

### 3.3 Flutter 项目结构

```
grandpasears/
├── pubspec.yaml
├── lib/
│   ├── main.dart                    # 入口
│   ├── app.dart                     # MaterialApp 配置
│   ├── core/
│   │   ├── theme.dart               # 主题（亮/暗 + 字号）
│   │   ├── constants.dart           # 常量
│   │   └── accessibility.dart       # 无障碍工具
│   ├── features/
│   │   ├── conversation/             # 对话功能
│   │   │   ├── presentation/
│   │   │   │   ├── conversation_screen.dart
│   │   │   │   └── widgets/
│   │   │   │       ├── chat_bubble.dart
│   │   │   │       ├── speaker_selector.dart
│   │   │   │       └── status_indicator.dart
│   │   │   ├── domain/
│   │   │   │   ├── conversation.dart
│   │   │   │   └── message.dart
│   │   │   └── data/
│   │   │       ├── conversation_repository.dart
│   │   │       └── local_storage.dart
│   │   ├── speech/                  # 语音识别功能
│   │   │   ├── presentation/
│   │   │   │   └── speech_controller.dart
│   │   │   ├── domain/
│   │   │   │   └── speech_service.dart
│   │   │   └── data/
│   │   │       ├── whisper_bridge.dart    # whisper.cpp FFI 桥接
│   │   │       └── audio_recorder.dart    # 麦克风录音
│   │   └── settings/                # 设置
│   │       └── presentation/
│   │           └── settings_screen.dart
│   └── shared/
│       └── widgets/
│           └── large_button.dart    # 通用大按钮组件
├── native/
│   ├── ios/
│   │   └── WhisperBridge.swift      # iOS whisper.cpp 桥接
│   └── android/
│       └── WhisperBridge.kt         # Android whisper.cpp 桥接
├── assets/
│   ├── models/                      # whisper 模型文件 (.ggml)
│   └── icons/
├── android/
├── ios/
└── test/
```

---

## 4. 架构设计 Architecture Design

### 4.1 整体架构 (Phase 1)

```
┌─────────────────────────────────────────────────────┐
│                    Presentation Layer                 │
│  ┌───────────┐  ┌───────────┐  ┌─────────────────┐  │
│  │ 对话界面   │  │ 设置页面   │  │ 通用组件库       │  │
│  │ Chat View │  │ Settings  │  │ Shared Widgets  │  │
│  └─────┬─────┘  └─────┬─────┘  └─────────────────┘  │
│        │               │                             │
├────────┼───────────────┼─────────────────────────────┤
│        │    Domain Layer      │                      │
│  ┌─────▼─────────────────────▼──────┐               │
│  │     ConversationService          │               │
│  │     SpeechService                │               │
│  │     (纯 Dart，不依赖平台)          │               │
│  └─────┬───────────────────────────┬┘               │
│        │                           │                 │
├────────┼───────────────────────────┼─────────────────┤
│        │      Data Layer           │                 │
│  ┌─────▼──────────┐  ┌────────────▼───────────┐    │
│  │  SQLite        │  │  whisper.cpp Bridge     │    │
│  │  (sqflite)     │  │  (FFI / Platform Ch.)   │    │
│  └────────────────┘  └────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.2 数据流 Data Flow

```
麦克风 → PCM Buffer → VAD → 语音段队列 → whisper.cpp → 文本
                                                          │
                                                          ▼
                                             SpeechService.onResult()
                                                          │
                                                          ▼
                                           ConversationService.addMessage()
                                                          │
                                                          ▼
                                               UI State 更新 → 气泡渲染
                                                          │
                                                          ▼
                                                   SQLite 持久化
```

---

## 5. 项目结构 (仓库顶层)

```
grandpasears/                     # 仓库根目录
├── VISION.md                     # 项目总陈述
├── PRD.md                        # 产品需求文档
├── TECHNICAL_ROADMAP.md          # 本文档
├── pwa-prototype/                # Phase 0: PWA 原型
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js
│   ├── css/
│   ├── js/
│   └── assets/
├── flutter-app/                  # Phase 1: Flutter 正式版
│   └── (Flutter 项目结构)
├── docs/                         # 额外文档
│   ├── accessibility-guide.md
│   └── contributor-guide.md
├── LICENSE                       # MIT License
└── README.md                     # 仓库首页说明
```

---

## 6. 开发环境搭建 Dev Environment Setup

### 6.1 Phase 0: PWA 开发环境

```bash
# 只需一个浏览器 + 任意 HTTP 服务器
# 推荐使用 live-server 或 Python

# 安装 Node.js (仅用于 live-server，非必须)
# https://nodejs.org

# 启动本地开发服务器
cd pwa-prototype
npx live-server --port=3000 --host=0.0.0.0
# 然后在手机上访问: http://<你的电脑IP>:3000

# 或者用 Python
cd pwa-prototype
python3 -m http.server 3000 --bind 0.0.0.0
```

**全部免费**: VS Code (编辑器) + Chrome (调试) + GitHub Pages (部署)。零成本。

### 6.2 Phase 1: Flutter 开发环境

```bash
# 1. 安装 Flutter SDK
# https://docs.flutter.dev/get-started/install
# macOS: brew install flutter
brew install flutter

# 2. 检查环境
flutter doctor

# 3. 创建项目
cd grandpasears
flutter create --org io.github.ruipls --project-name grandpasears flutter-app

# 4. 添加依赖
cd flutter-app
flutter pub add sqflite path_provider flutter_riverpod

# 5. 运行
flutter run
```

**全部免费**: Flutter SDK (BSD-3) + VS Code/Android Studio Community + Xcode (macOS 自带)。

---

## 7. 构建与分发 Build & Distribution

### 7.1 Phase 0: PWA 部署

```bash
# 部署到 GitHub Pages（免费 HTTPS 静态托管）
cd pwa-prototype
git add .
git commit -m "PWA prototype"
git push origin main

# 在 GitHub 仓库 Settings → Pages → Source: main branch → /pwa-prototype 目录
# 访问: https://ruipls.github.io/grandpas-ears/pwa-prototype/
```

### 7.2 Phase 1: Android 分发

```
免费方案：直接分发 APK

1. 构建 APK
   cd flutter-app
   flutter build apk --release

2. 分发方式（全部免费）
   - GitHub Releases: 上传 APK，用户直接下载安装
   - 自建下载页: GitHub Pages + APK 下载链接
   - 蒲公英/Fir.im: 国内免费分发平台

3. 用户安装
   - 开启"允许安装未知来源应用"
   - 下载 APK → 点击安装
   - 注意：APK 签名自管理，不需要 Google Play
```

### 7.3 Phase 1: iOS 分发

```
iOS 分发的限制

- Apple Developer Program: $99/年（无法避免的唯一成本）
  - 用于代码签名，让 App 能在非越狱 iPhone 上运行
- 免费替代方案：
  - Xcode 免费签名：每 7 天需重新签名（个人设备可用）
  - AltStore: 利用免费 Apple ID 签名，7 天续签
  - 提示用户自行用 Xcode 编译安装（适合技术用户）

推荐策略：
  - 提供详细图文教程教用户用 AltStore 安装
  - 长期目标：付费开发者账号发布到 App Store
  - 接受社区捐赠来覆盖 $99/年费用
```

---

## 8. 免费成本分析 Free Cost Analysis

### 8.1 零成本清单 Zero-Cost Items

| 项目 Item | 方案 Solution | 成本 Cost |
|---|---|---|
| 语音识别引擎 | whisper.cpp (MIT) | $0 |
| 语音识别 API | 不使用 (端侧推理) | $0 |
| 后端服务器 | 无 (纯端侧) | $0 |
| 数据库 | SQLite (本地) | $0 |
| 代码托管 | GitHub (Public) | $0 |
| 网站托管 | GitHub Pages | $0 |
| CI/CD | GitHub Actions (Public) | $0 |
| 开发工具 | VS Code + Flutter SDK | $0 |
| 代码签名 (Android) | 自签名 | $0 |
| 分发 (Android) | GitHub Releases / 蒲公英 | $0 |
| 域名 | 不需要 | $0 |

### 8.2 唯一可能成本 Only Potential Cost

| 项目 Item | 说明 | 成本 |
|---|---|---|
| Apple Developer Program | iOS 签名 + App Store 分发 | **$99/年** |
| Android 开发者账号 | 如需上架 Google Play | $25 一次性 |

> 💡 **iPhone 用户零成本使用方案**：我们提供 IPA 文件 + AltStore 安装教程，用户用自己的 Apple ID 免费签名，每 7 天在手机上自动续签。技术用户可自行用 Xcode 编译。

### 8.3 成本总结

```
完全免费（Android 用户）:  $0
几乎免费（iOS 用户）:      $0（AltStore）
上架 App Store（可选）:    $99/年（可社区捐赠覆盖）
```

---

## 9. Phase 2 技术预研 Phase 2 Technical Research

### 9.1 声纹识别 Voiceprint / Speaker Recognition

Phase 2 需要自动识别"谁在说话"。以下是免费开源方案：

| 方案 | 说明 | 大小 | 许可 |
|------|------|------|------|
| **SpeechBrain ECAPA-TDNN** | 学术界 SOTA，预训练模型可用 | ~20MB | Apache 2.0 |
| **ResNet-Speaker-Embedding** | 轻量级声纹向量提取 | ~5MB | MIT |
| **pyannote-audio** | 完整的 Speaker Diarization | ~200MB | MIT |

> 推荐：Phase 2 先用轻量声纹 embedding 模型做 1:1 声纹匹配（注册 → 比对），再考虑完整的 Speaker Diarization。

### 9.2 声纹识别流程 (Phase 2)

```
注册阶段：
  用户录制 5-10 秒语音 → 提取声纹 embedding → 存储到本地数据库

识别阶段：
  实时音频 → VAD 检测语音段 → 提取声纹 embedding
    → 与已注册声纹比对 (余弦相似度)
      → 匹配成功：标注说话人姓名
      → 未匹配：标注"未知说话人"
```

---

## 10. 风险与缓解 Risks & Mitigations

| 风险 Risk | 影响 Impact | 概率 Prob. | 缓解 Mitigation |
|---|---|---|---|
| **iOS Safari Web Speech API 不稳定** | PWA 原型在 iPhone 上体验差 | 高 | 加入自动重启机制；获取早期 iPhone 测试反馈 |
| **Web Speech API 需联网** | PWA 离线不可用 | 中 | Phase 0 接受此限制，Phase 1 用 whisper.cpp 彻底解决 |
| **whisper.cpp tiny 模型中文准确率不足** | 识别结果不可用 | 中 | 默认 tiny + 可选下载 base/small；渐进增强 |
| **whisper.cpp 移动端实时性** | 文字延迟超过 2 秒 | 低 | tiny/Base 模型已有多款 App 验证可行 |
| **VAD 检测不准** | 漏识别或误触发 | 中 | silero-vad 成熟方案，可调阈值 |
| **iOS 分发受限** | iPhone 用户安装困难 | 高 | AltStore 方案 + 详细教程；长期目标 App Store |
| **用户不会安装 APK** | Android 用户放弃使用 | 中 | 提供图文+视频教程；寻求应用商店上架 |

---

## Appendix A: 关键开源项目链接

| 项目 | 地址 | 用途 |
|------|------|------|
| whisper.cpp | https://github.com/ggerganov/whisper.cpp | 端侧 ASR |
| whisper.cpp Flutter Bindings | https://github.com/azkadev/whisper.cpp Flutter package | Flutter 集成 |
| silero-vad | https://github.com/snakers4/silero-vad | 语音活动检测 |
| SpeechBrain | https://github.com/speechbrain/speechbrain | 声纹识别 |
| Flutter | https://flutter.dev | 跨平台框架 |

## Appendix B: 本地开发快速开始

```bash
# Phase 0: PWA 原型 (马上可以开始)
cd grandpasears
mkdir -p pwa-prototype && cd pwa-prototype
# 创建 index.html, css/style.css, js/app.js
npx live-server --port=3000
# 浏览器打开 http://localhost:3000

# Phase 1: Flutter (PWA 验证后)
cd grandpasears
flutter create flutter-app
cd flutter-app
flutter run
```

---

> **Next: Phase 0 开始——搭建 PWA 原型，在手机浏览器上跑通语音识别。**
>
> 参考文档：[VISION.md](./VISION.md) | [PRD.md](./PRD.md)
>
> 最后更新：2026-06-26 | 状态：草案 v0.1
