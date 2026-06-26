/**
 * ui.js — UI 渲染与更新
 * ui.js — UI rendering and updates
 */

const UI = (() => {
  // DOM 元素引用
  const conversationArea = document.getElementById('conversationArea');
  const welcomeMessage = document.getElementById('welcomeMessage');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const btnSpeakerA = document.getElementById('btnSpeakerA');
  const btnSpeakerB = document.getElementById('btnSpeakerB');
  const btnStart = document.getElementById('btnStart');
  const btnFontSize = document.getElementById('btnFontSize');
  const btnDarkMode = document.getElementById('btnDarkMode');
  const permissionOverlay = document.getElementById('permissionOverlay');
  const unsupportedOverlay = document.getElementById('unsupportedOverlay');
  const appContainer = document.getElementById('appContainer');

  // 当前显示的气泡元素 ID 映射 (msg.id -> DOM element)
  const bubbleElements = {};
  // 当前显示的中间结果气泡 ID
  let currentInterimBubbleId = null;

  /**
   * 初始化 UI 状态
   */
  function init() {
    // 从 localStorage 恢复设置
    const savedFont = localStorage.getItem('grandpasears_font');
    if (savedFont === 'large') setFontMode('large');

    const savedTheme = localStorage.getItem('grandpasears_theme');
    if (savedTheme === 'dark') setTheme('dark');

    // 恢复对话历史 (仅恢复已固化的消息)
    const messages = Storage.getMessages().filter(m => !m.isInterim);
    if (messages.length > 0) {
      hideWelcome();
      messages.forEach(msg => appendBubble(msg));
      scrollToBottom();
    }

    // 监听存储变化（其他标签页更新）
    window.addEventListener('storage', (e) => {
      if (e.key === 'grandpasears_conversation') {
        // 简单处理：重载页面？不做，让用户在当前标签页继续
      }
    });
  }

  /**
   * 隐藏欢迎消息
   */
  function hideWelcome() {
    if (welcomeMessage) {
      welcomeMessage.classList.add('hidden');
    }
  }

  /**
   * 显示欢迎消息
   */
  function showWelcome() {
    if (welcomeMessage) {
      welcomeMessage.classList.remove('hidden');
    }
  }

  /**
   * 添加一个聊天气泡
   * @param {object} msg - { id, speaker, text, time, isInterim }
   */
  function appendBubble(msg) {
    if (!msg.text || !msg.text.trim()) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble speaker-${msg.speaker.toLowerCase()}`;
    if (msg.isInterim) bubble.classList.add('interim');
    bubble.id = `msg-${msg.id}`;

    // 说话人标签
    const speakerLabel = document.createElement('div');
    speakerLabel.className = 'bubble-speaker';
    speakerLabel.textContent = msg.speaker === 'A' ? '我 Me' : '对方 Partner';
    bubble.appendChild(speakerLabel);

    // 文字内容
    const textEl = document.createElement('div');
    textEl.className = 'bubble-text';
    textEl.textContent = msg.text;
    bubble.appendChild(textEl);

    // 时间
    const timeEl = document.createElement('div');
    timeEl.className = 'bubble-time';
    timeEl.textContent = msg.time;
    bubble.appendChild(timeEl);

    conversationArea.appendChild(bubble);
    bubbleElements[msg.id] = bubble;

    // 如果是中间结果，移除旧的中间结果气泡
    if (msg.isInterim && currentInterimBubbleId && currentInterimBubbleId !== msg.id) {
      removeBubble(currentInterimBubbleId);
      delete bubbleElements[currentInterimBubbleId];
    }

    if (msg.isInterim) {
      currentInterimBubbleId = msg.id;
    } else {
      currentInterimBubbleId = null;
    }

    return bubble;
  }

  /**
   * 移除气泡
   */
  function removeBubble(msgId) {
    const bubble = bubbleElements[msgId];
    if (bubble) {
      bubble.remove();
      delete bubbleElements[msgId];
    }
  }

  /**
   * 更新气泡内容（中间结果更新）
   * @param {string} msgId - 消息 ID
   * @param {object} msg - 更新后的消息
   */
  function updateBubble(msgId, msg) {
    let bubble = bubbleElements[msgId];
    if (!bubble) {
      // 可能 DOM 被清了，重新创建
      bubble = appendBubble(msg);
      return;
    }

    // 更新文字
    const textEl = bubble.querySelector('.bubble-text');
    if (textEl) textEl.textContent = msg.text;

    // 更新时间
    const timeEl = bubble.querySelector('.bubble-time');
    if (timeEl) timeEl.textContent = msg.time;

    // 更新样式
    if (msg.isInterim) {
      bubble.classList.add('interim');
    } else {
      bubble.classList.remove('interim');
    }

    if (msg.isInterim) {
      currentInterimBubbleId = msg.id;
    } else {
      currentInterimBubbleId = null;
    }
  }

  /**
   * 将中间结果气泡固化为最终气泡
   * @param {string} msgId
   */
  function finalizeBubble(msgId) {
    const bubble = bubbleElements[msgId];
    if (bubble) {
      bubble.classList.remove('interim');
    }
    if (currentInterimBubbleId === msgId) {
      currentInterimBubbleId = null;
    }
  }

  /**
   * 清空所有气泡
   */
  function clearAllBubbles() {
    conversationArea.innerHTML = '';
    // 重新添加欢迎消息
    if (welcomeMessage) {
      conversationArea.appendChild(welcomeMessage);
    }
    // 清空引用
    for (const key in bubbleElements) {
      delete bubbleElements[key];
    }
    currentInterimBubbleId = null;
  }

  /**
   * 滚动到底部
   */
  function scrollToBottom() {
    conversationArea.scrollTop = conversationArea.scrollHeight;
  }

  /**
   * 更新状态指示器
   * @param {string} status - 'listening' | 'paused' | 'stopped' | 'error' | 'starting' | 'processing' | 'speaking'
   * @param {string} text
   */
  function updateStatus(status, text) {
    statusDot.className = 'status-dot';
    if (status === 'listening' || status === 'speaking') {
      statusDot.classList.add('listening');
    } else if (status === 'paused') {
      statusDot.classList.add('paused');
    } else if (status === 'error') {
      statusDot.classList.add('error');
    }

    statusText.textContent = text || status;
  }

  /**
   * 更新说话人按钮状态
   * @param {string} speaker - 'A' | 'B'
   */
  function setActiveSpeaker(speaker) {
    btnSpeakerA.classList.toggle('active', speaker === 'A');
    btnSpeakerB.classList.toggle('active', speaker === 'B');
  }

  /**
   * 更新主按钮状态
   * @param {string} state - 'idle' | 'listening' | 'paused'
   */
  function setMainButtonState(state) {
    const icon = btnStart.querySelector('.main-action-icon');
    const text = btnStart.querySelector('.main-action-text');
    btnStart.className = 'main-action-btn';

    switch (state) {
      case 'listening':
        btnStart.classList.add('listening');
        icon.textContent = '⏹';
        text.textContent = '停止';
        break;
      case 'paused':
        btnStart.classList.add('paused');
        icon.textContent = '▶️';
        text.textContent = '继续';
        break;
      case 'idle':
      default:
        icon.textContent = '🎤';
        text.textContent = '开始聆听';
        break;
    }
  }

  /**
   * 设置字体模式
   * @param {string} mode - 'normal' | 'large'
   */
  function setFontMode(mode) {
    if (mode === 'large') {
      appContainer.setAttribute('data-font', 'large');
      btnFontSize.querySelector('.icon').textContent = '🔤+';
    } else {
      appContainer.setAttribute('data-font', 'normal');
      btnFontSize.querySelector('.icon').textContent = '🔤';
    }
    localStorage.setItem('grandpasears_font', mode);
  }

  /**
   * 切换字体模式
   */
  function toggleFontMode() {
    const current = appContainer.getAttribute('data-font');
    const next = current === 'large' ? 'normal' : 'large';
    setFontMode(next);
  }

  /**
   * 设置主题
   * @param {string} theme - 'light' | 'dark'
   */
  function setTheme(theme) {
    if (theme === 'dark') {
      appContainer.setAttribute('data-theme', 'dark');
      btnDarkMode.querySelector('.icon').textContent = '☀️';
    } else {
      appContainer.setAttribute('data-theme', 'light');
      btnDarkMode.querySelector('.icon').textContent = '🌙';
    }
    localStorage.setItem('grandpasears_theme', theme);
  }

  /**
   * 切换主题
   */
  function toggleTheme() {
    const current = appContainer.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }

  /**
   * 显示权限请求弹窗
   */
  function showPermissionDialog() {
    permissionOverlay.classList.remove('hidden');
  }

  /**
   * 隐藏权限请求弹窗
   */
  function hidePermissionDialog() {
    permissionOverlay.classList.add('hidden');
  }

  /**
   * 显示浏览器不支持提示
   */
  function showUnsupportedDialog() {
    unsupportedOverlay.classList.remove('hidden');
  }

  /**
   * 获取 DOM 元素引用（供 app.js 绑定事件）
   */
  function getElements() {
    return {
      btnSpeakerA, btnSpeakerB, btnStart,
      btnFontSize, btnDarkMode,
      btnClear: document.getElementById('btnClear'),
      btnRequestPermission: document.getElementById('btnRequestPermission'),
      btnDismissPermission: document.getElementById('btnDismissPermission'),
    };
  }

  return {
    init,
    hideWelcome,
    showWelcome,
    appendBubble,
    removeBubble,
    updateBubble,
    finalizeBubble,
    clearAllBubbles,
    scrollToBottom,
    updateStatus,
    setActiveSpeaker,
    setMainButtonState,
    setFontMode,
    toggleFontMode,
    setTheme,
    toggleTheme,
    showPermissionDialog,
    hidePermissionDialog,
    showUnsupportedDialog,
    getElements
  };
})();
