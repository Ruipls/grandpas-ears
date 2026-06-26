/**
 * app.js — Main application logic
 * app.js — 主应用逻辑
 *
 * 连接语音识别、UI 渲染、数据存储
 * Connects speech recognition, UI rendering, and data storage
 */

const App = (() => {
  // === 应用状态 ===
  let currentSpeaker = 'A'; // 'A' | 'B'
  let interimMsgId = null;  // 当前中间结果消息的 ID

  // === DOM 引用 ===
  let els = {};

  // === 初始化 ===
  function init() {
    // 检查浏览器支持
    if (!SpeechRecognizer.checkSupport()) {
      UI.showUnsupportedDialog();
      return;
    }

    // 初始化 UI
    UI.init();
    els = UI.getElements();

    // 绑定事件
    bindEvents();

    // 设置语音识别回调
    SpeechRecognizer.onResult(handleSpeechResult);
    SpeechRecognizer.onStatusChange(handleStatusChange);
    SpeechRecognizer.onError(handleSpeechError);

    // 注册 Service Worker (PWA)
    registerServiceWorker();
  }

  // === 事件绑定 ===
  function bindEvents() {
    // 主按钮：开始/停止
    els.btnStart.addEventListener('click', () => {
      if (SpeechRecognizer.getIsListening()) {
        stopRecognition();
      } else {
        startRecognition();
      }
    });

    // 说话人切换
    els.btnSpeakerA.addEventListener('click', () => switchSpeaker('A'));
    els.btnSpeakerB.addEventListener('click', () => switchSpeaker('B'));

    // 字号切换
    els.btnFontSize.addEventListener('click', () => UI.toggleFontMode());

    // 暗色模式切换
    els.btnDarkMode.addEventListener('click', () => UI.toggleTheme());

    // 清除对话
    els.btnClear.addEventListener('click', () => {
      // 简单确认：直接清除（有二次确认则更好，但为了简洁先这样）
      clearConversation();
    });

    // 权限弹窗按钮
    if (els.btnRequestPermission) {
      els.btnRequestPermission.addEventListener('click', () => {
        UI.hidePermissionDialog();
        startRecognition();
      });
    }
    if (els.btnDismissPermission) {
      els.btnDismissPermission.addEventListener('click', () => {
        UI.hidePermissionDialog();
      });
    }

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      // 空格键：开始/停止
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        if (SpeechRecognizer.getIsListening()) {
          stopRecognition();
        } else {
          startRecognition();
        }
      }
      // A 键：切换到说话人 A
      if (e.key === 'a' || e.key === 'A') {
        if (e.target === document.body) {
          switchSpeaker('A');
        }
      }
      // B 键：切换到说话人 B
      if (e.key === 'b' || e.key === 'B') {
        if (e.target === document.body) {
          switchSpeaker('B');
        }
      }
    });
  }

  // === 语音识别控制 ===
  function startRecognition() {
    // 先请求麦克风权限（通过 SpeechRecognition 内部会触发浏览器权限请求）
    const started = SpeechRecognizer.startListening();

    if (started) {
      UI.hideWelcome();
      UI.setMainButtonState('listening');
      UI.setActiveSpeaker(currentSpeaker);
    }
    // 权限错误由 handleSpeechError 处理
  }

  function stopRecognition() {
    // 固化最后的中间结果
    finalizeInterim();

    SpeechRecognizer.stopListening();
    UI.setMainButtonState('idle');
    UI.updateStatus('stopped', '已停止 Stopped');
  }

  function pauseRecognition() {
    // 固化中间结果
    finalizeInterim();

    SpeechRecognizer.pauseListening();
    UI.setMainButtonState('paused');
  }

  // === 说话人管理 ===
  function switchSpeaker(speaker) {
    // 切换前固化当前中间结果
    finalizeInterim();

    currentSpeaker = speaker;
    UI.setActiveSpeaker(speaker);

    // 添加系统消息提示说话人切换
    const label = speaker === 'A' ? '我 Me' : '对方 Partner';
    const sysMsg = Storage.addMessage('system', `—— ${label} 说话 speaking ——`);
    UI.appendBubble(sysMsg);
    UI.scrollToBottom();
  }

  // === 语音结果处理 ===
  function handleSpeechResult(result) {
    UI.hideWelcome();

    const { final, interim } = result;

    // 处理最终结果
    if (final && final.trim()) {
      if (interimMsgId) {
        // 已有 interim 气泡 → 更新为最终状态，不创建新气泡
        Storage.finalizeLastMessage();
        UI.finalizeBubble(interimMsgId);
        interimMsgId = null;
      } else {
        // 没有 interim → 直接创建最终消息
        const msg = Storage.addMessage(currentSpeaker, final.trim(), false);
        UI.appendBubble(msg);
      }
      UI.scrollToBottom();
      // final 优先: 跳过后续 interim 处理, 避免重复气泡
      return;
    }

    // 处理中间结果
    if (interim && interim.trim()) {
      if (interimMsgId) {
        const msg = Storage.updateLastMessage(interim.trim(), true);
        if (msg) {
          UI.updateBubble(msg.id, msg);
        }
      } else {
        const msg = Storage.addMessage(currentSpeaker, interim.trim(), true);
        interimMsgId = msg.id;
        UI.appendBubble(msg);
      }
      UI.scrollToBottom();
    }
  }

  /**
   * 固化当前的中间结果
   */
  function finalizeInterim() {
    if (interimMsgId) {
      Storage.finalizeLastMessage();
      UI.finalizeBubble(interimMsgId);
      interimMsgId = null;
    }
  }

  // === 状态变更处理 ===
  function handleStatusChange(status, text) {
    UI.updateStatus(status, text);
  }

  // === 错误处理 ===
  function handleSpeechError(error, message) {
    console.warn('App: speech error', error, message);

    switch (error) {
      case 'not-allowed':
        UI.showPermissionDialog();
        UI.setMainButtonState('idle');
        break;
      case 'not-supported':
        UI.showUnsupportedDialog();
        UI.setMainButtonState('idle');
        break;
      case 'network':
        UI.updateStatus('error', '网络错误，请检查网络 Network error');
        break;
      case 'audio-capture':
        UI.updateStatus('error', '无法访问麦克风 No microphone');
        break;
      default:
        UI.updateStatus('error', `错误: ${message || error}`);
    }
  }

  // === 清除对话 ===
  function clearConversation() {
    // 先停止识别
    if (SpeechRecognizer.getIsListening()) {
      stopRecognition();
    }

    // 清除存储
    Storage.clearAll();

    // 清除 UI
    UI.clearAllBubbles();
    UI.showWelcome();

    // 重置状态
    interimMsgId = null;
    currentSpeaker = 'A';
    UI.setActiveSpeaker('A');
    UI.setMainButtonState('idle');
    UI.updateStatus('stopped', '已清除 Cleared');
  }

  // === Service Worker 注册 ===
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js')
        .then((reg) => {
          console.log('App: Service Worker registered', reg.scope);
        })
        .catch((err) => {
          console.warn('App: Service Worker registration failed', err);
        });
    }
  }

  // === 公共 API ===
  return {
    init
  };
})();

// === 启动应用 ===
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
