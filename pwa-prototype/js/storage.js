/**
 * storage.js — Simple localStorage wrapper for conversation history
 * storage.js — 对话历史的本地存储封装
 */

const Storage = (() => {
  const STORAGE_KEY = 'grandpasears_conversation';
  const MAX_MESSAGES = 500; // 最多保存 500 条消息

  /**
   * 获取所有对话消息
   * Get all conversation messages
   * @returns {Array<{speaker: string, text: string, time: string, isInterim?: boolean}>}
   */
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

  /**
   * 保存消息列表
   * Save message list
   * @param {Array} messages
   */
  function saveMessages(messages) {
    try {
      // 限制数量
      const trimmed = messages.slice(-MAX_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Storage: failed to save messages (storage full?)', e);
      // 如果是配额满了，尝试清理旧数据
      if (e.name === 'QuotaExceededError') {
        try {
          const half = messages.slice(-Math.floor(MAX_MESSAGES / 2));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(half));
        } catch (_) {
          // 清理也失败，放弃
        }
      }
    }
  }

  /**
   * 添加一条新消息
   * Add a new message
   * @param {string} speaker - 'A' | 'B' | 'system'
   * @param {string} text
   * @param {boolean} isInterim - 是否为中间结果
   * @returns {object} 消息对象
   */
  function addMessage(speaker, text, isInterim = false) {
    const msg = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      speaker,
      text,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isInterim
    };
    const messages = getMessages();
    messages.push(msg);
    saveMessages(messages);
    return msg;
  }

  /**
   * 更新最后一条消息（用于中间结果）
   * Update the last message (for interim results)
   * @param {string} text - 新的文字
   * @returns {object|null} 更新后的消息或 null
   */
  function updateLastMessage(text, isInterim = false) {
    const messages = getMessages();
    if (messages.length === 0) return null;

    const last = messages[messages.length - 1];
    last.text = text;
    last.isInterim = isInterim;
    last.time = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    messages[messages.length - 1] = last;
    saveMessages(messages);
    return last;
  }

  /**
   * 将最后一条中间结果固化为最终消息
   * Finalize the last interim message
   */
  function finalizeLastMessage() {
    const messages = getMessages();
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.isInterim) {
      last.isInterim = false;
      messages[messages.length - 1] = last;
      saveMessages(messages);
    }
  }

  /**
   * 清空所有对话
   * Clear all conversation
   */
  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * 获取消息数量
   * Get message count
   */
  function getCount() {
    return getMessages().length;
  }

  return {
    getMessages,
    addMessage,
    updateLastMessage,
    finalizeLastMessage,
    clearAll,
    getCount
  };
})();
