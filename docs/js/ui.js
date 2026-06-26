/**
 * ui.js — UI rendering and updates
 * ui.js — UI 渲染与更新
 */

const UI = (() => {
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

  const bubbleElements = {};
  let currentInterimBubbleId = null;

  function init() {
    const savedFont = localStorage.getItem('grandpasears_font');
    if (savedFont === 'large') setFontMode('large');
    const savedTheme = localStorage.getItem('grandpasears_theme');
    if (savedTheme === 'dark') setTheme('dark');

    const messages = Storage.getMessages().filter(function(m) { return !m.isInterim; });
    if (messages.length > 0) {
      hideWelcome();
      messages.forEach(function(msg) { appendBubble(msg); });
      scrollToBottom();
    }
  }

  function hideWelcome() {
    if (welcomeMessage) welcomeMessage.classList.add('hidden');
  }

  function showWelcome() {
    if (welcomeMessage) welcomeMessage.classList.remove('hidden');
  }

  function appendBubble(msg) {
    if (!msg.text || !msg.text.trim()) return;

    // Dedup: if bubble with this ID already exists, don't create duplicate
    var existing = document.getElementById('msg-' + msg.id);
    if (existing || bubbleElements[msg.id]) {
      return existing || bubbleElements[msg.id];
    }

    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble speaker-' + msg.speaker.toLowerCase();
    if (msg.isInterim) bubble.classList.add('interim');
    bubble.id = 'msg-' + msg.id;

    var label = document.createElement('div');
    label.className = 'bubble-speaker';
    label.textContent = msg.speaker === 'A' ? '我 Me' : '对方 Partner';
    bubble.appendChild(label);

    var textEl = document.createElement('div');
    textEl.className = 'bubble-text';
    textEl.textContent = msg.text;
    bubble.appendChild(textEl);

    var timeEl = document.createElement('div');
    timeEl.className = 'bubble-time';
    timeEl.textContent = msg.time;
    bubble.appendChild(timeEl);

    conversationArea.appendChild(bubble);
    bubbleElements[msg.id] = bubble;

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

  function removeBubble(msgId) {
    var bubble = bubbleElements[msgId];
    if (bubble) {
      bubble.remove();
      delete bubbleElements[msgId];
    }
  }

  function updateBubble(msgId, msg) {
    var bubble = bubbleElements[msgId];
    if (!bubble) {
      bubble = document.getElementById('msg-' + msgId);
      if (bubble) bubbleElements[msgId] = bubble;
    }
    if (!bubble) {
      bubble = appendBubble(msg);
      return;
    }

    var textEl = bubble.querySelector('.bubble-text');
    if (textEl) textEl.textContent = msg.text;

    var timeEl = bubble.querySelector('.bubble-time');
    if (timeEl) timeEl.textContent = msg.time;

    if (msg.isInterim) {
      bubble.classList.add('interim');
      currentInterimBubbleId = msg.id;
    } else {
      bubble.classList.remove('interim');
      currentInterimBubbleId = null;
    }
  }

  function finalizeBubble(msgId) {
    var bubble = bubbleElements[msgId] || document.getElementById('msg-' + msgId);
    if (bubble) bubble.classList.remove('interim');
    if (currentInterimBubbleId === msgId) currentInterimBubbleId = null;
  }

  function clearAllBubbles() {
    conversationArea.innerHTML = '';
    if (welcomeMessage) conversationArea.appendChild(welcomeMessage);
    for (var key in bubbleElements) { delete bubbleElements[key]; }
    currentInterimBubbleId = null;
  }

  function scrollToBottom() {
    conversationArea.scrollTop = conversationArea.scrollHeight;
  }

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

  function setActiveSpeaker(speaker) {
    btnSpeakerA.classList.toggle('active', speaker === 'A');
    btnSpeakerB.classList.toggle('active', speaker === 'B');
  }

  function setMainButtonState(state) {
    var icon = btnStart.querySelector('.main-action-icon');
    var text = btnStart.querySelector('.main-action-text');
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
      default:
        icon.textContent = '🎤';
        text.textContent = '开始聆听';
    }
  }

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

  function toggleFontMode() {
    var current = appContainer.getAttribute('data-font');
    setFontMode(current === 'large' ? 'normal' : 'large');
  }

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

  function toggleTheme() {
    var current = appContainer.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  function showPermissionDialog() { permissionOverlay.classList.remove('hidden'); }
  function hidePermissionDialog() { permissionOverlay.classList.add('hidden'); }
  function showUnsupportedDialog() { unsupportedOverlay.classList.remove('hidden'); }

  function getElements() {
    return {
      btnSpeakerA: btnSpeakerA, btnSpeakerB: btnSpeakerB, btnStart: btnStart,
      btnFontSize: btnFontSize, btnDarkMode: btnDarkMode,
      btnClear: document.getElementById('btnClear'),
      btnRequestPermission: document.getElementById('btnRequestPermission'),
      btnDismissPermission: document.getElementById('btnDismissPermission')
    };
  }

  return {
    init: init, hideWelcome: hideWelcome, showWelcome: showWelcome,
    appendBubble: appendBubble, removeBubble: removeBubble,
    updateBubble: updateBubble, finalizeBubble: finalizeBubble,
    clearAllBubbles: clearAllBubbles, scrollToBottom: scrollToBottom,
    updateStatus: updateStatus, setActiveSpeaker: setActiveSpeaker,
    setMainButtonState: setMainButtonState, toggleFontMode: toggleFontMode,
    toggleTheme: toggleTheme, setTheme: setTheme, setFontMode: setFontMode,
    showPermissionDialog: showPermissionDialog, hidePermissionDialog: hidePermissionDialog,
    showUnsupportedDialog: showUnsupportedDialog, getElements: getElements
  };
})();
