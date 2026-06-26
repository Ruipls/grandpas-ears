/**
 * storage.js — Simple localStorage wrapper for conversation history
 * storage.js — 对话历史的本地存储封装
 *
 * 内置去重: 相同说话人+相同文字在3秒内的非interim消息视为重复，直接返回已有消息
 */

const Storage = (() => {
  const STORAGE_KEY = 'grandpasears_conversation';
  const MAX_MESSAGES = 500;

  function getMessages() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Storage: failed to read messages', e);
      return [];
    }
  }

  function saveMessages(messages) {
    try {
      const trimmed = messages.slice(-MAX_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Storage: failed to save messages', e);
      if (e.name === 'QuotaExceededError') {
        try {
          const half = messages.slice(-Math.floor(MAX_MESSAGES / 2));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(half));
        } catch (_) {}
      }
    }
  }

  /**
   * Add a new message. Built-in dedup: if a non-interim message with the same
   * speaker and text was added within 3 seconds, returns the existing message.
   */
  function addMessage(speaker, text, isInterim) {
    if (isInterim === undefined) isInterim = false;
    var messages = getMessages();
    var now = Date.now();

    // Dedup non-interim messages
    if (!isInterim && messages.length > 0) {
      for (var i = messages.length - 1; i >= 0; i--) {
        var m = messages[i];
        if (!m.isInterim && m.speaker !== 'system') {
          if (m.speaker === speaker && m.text === text && (now - (m._ts || 0)) < 3000) {
            return m;
          }
          break;
        }
      }
    }

    var msg = {
      id: now + '_' + Math.random().toString(36).substr(2, 6),
      speaker: speaker,
      text: text,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      isInterim: isInterim,
      _ts: now
    };
    messages.push(msg);
    saveMessages(messages);
    return msg;
  }

  /**
   * Update the last message in storage (for interim results)
   */
  function updateLastMessage(text, isInterim) {
    if (isInterim === undefined) isInterim = false;
    var messages = getMessages();
    if (messages.length === 0) return null;
    var last = messages[messages.length - 1];
    last.text = text;
    last.isInterim = isInterim;
    last.time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    last._ts = Date.now();
    messages[messages.length - 1] = last;
    saveMessages(messages);
    return last;
  }

  function finalizeLastMessage() {
    var messages = getMessages();
    if (messages.length === 0) return;
    var last = messages[messages.length - 1];
    if (last.isInterim) {
      last.isInterim = false;
      last._ts = Date.now();
      messages[messages.length - 1] = last;
      saveMessages(messages);
    }
  }

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function getCount() {
    return getMessages().length;
  }

  return {
    getMessages: getMessages,
    addMessage: addMessage,
    updateLastMessage: updateLastMessage,
    finalizeLastMessage: finalizeLastMessage,
    clearAll: clearAll,
    getCount: getCount
  };
})();
