/**
 * speech.js — Web Speech API wrapper
 * speech.js — 语音识别封装
 *
 * 处理浏览器兼容性、自动重启、错误恢复
 */

const SpeechRecognizer = (() => {
  // 获取跨浏览器 SpeechRecognition 构造函数
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  let recognition = null;
  let isSupported = !!SpeechRecognition;
  let isListening = false;
  let restartTimer = null;

  // 回调
  let onResultCallback = null;
  let onStatusChangeCallback = null;
  let onErrorCallback = null;

  // 连续识别失败计数（用于断路保护）
  let consecutiveErrors = 0;
  // 去重: 追踪上一次发送的 final 文本
  let lastSentFinal = '';
  const MAX_CONSECUTIVE_ERRORS = 5;

  /**
   * 检查浏览器是否支持语音识别
   */
  function checkSupport() {
    return isSupported;
  }

  /**
   * 初始化 recognition 实例
   */
  function createRecognition() {
    if (!isSupported) return null;

    const rec = new SpeechRecognition();
    rec.lang = 'zh-CN';
    rec.continuous = true;
    rec.interimResults = true;
    // 尽可能快返回结果
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      consecutiveErrors = 0; // 成功收到结果，重置错误计数

      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      // 去重: 跳过与上次完全相同的最终结果
      if (final && final.trim() === lastSentFinal) {
        final = '';
      }
      if (final && final.trim()) {
        lastSentFinal = final.trim();
      }

      // 即使 final 被去重，interim 结果仍然正常发送
      if (onResultCallback && (final || interim)) {
        onResultCallback({ final, interim });
      }
    };

    rec.onerror = (event) => {
      console.warn('Speech: error', event.error, event.message);
      consecutiveErrors++;

      if (onErrorCallback) {
        onErrorCallback(event.error, event.message);
      }

      // 'no-speech' 错误不是真正的错误，静默处理
      if (event.error === 'no-speech') {
        return;
      }

      // 'aborted' 通常是主动停止，不需要处理
      if (event.error === 'aborted') {
        return;
      }

      // 断路保护：连续错误过多则停止
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        stopListening();
        if (onStatusChangeCallback) {
          onStatusChangeCallback('error', '错误过多，已自动停止');
        }
        return;
      }

      // 网络错误或其他错误：尝试自动重启
      scheduleRestart();
    };

    rec.onend = () => {
      // 如果用户仍在聆听状态，自动重启
      if (isListening) {
        scheduleRestart();
      } else {
        if (onStatusChangeCallback) {
          onStatusChangeCallback('stopped', '已停止 Stopped');
        }
      }
    };

    rec.onaudiostart = () => {
      consecutiveErrors = 0;
      if (onStatusChangeCallback) {
        onStatusChangeCallback('listening', '正在聆听... Listening...');
      }
    };

    rec.onaudioend = () => {
      if (onStatusChangeCallback && isListening) {
        onStatusChangeCallback('processing', '识别中... Processing...');
      }
    };

    rec.onspeechstart = () => {
      if (onStatusChangeCallback) {
        onStatusChangeCallback('speaking', '检测到语音 Speech detected');
      }
    };

    rec.onspeechend = () => {
      if (onStatusChangeCallback && isListening) {
        onStatusChangeCallback('processing', '识别中... Processing...');
      }
    };

    return rec;
  }

  /**
   * 安排自动重启（处理 Safari 自动停止的问题）
   */
  function scheduleRestart() {
    if (restartTimer) clearTimeout(restartTimer);
    if (!isListening) return;

    restartTimer = setTimeout(() => {
      if (!isListening) return;
      try {
        recognition.start();
        console.log('Speech: auto-restarted');
      } catch (e) {
        console.warn('Speech: auto-restart failed', e);
        // 重建 recognition 实例再试
        recognition = createRecognition();
        if (recognition && isListening) {
          try {
            recognition.start();
          } catch (_) {
            isListening = false;
            if (onStatusChangeCallback) {
              onStatusChangeCallback('error', '识别启动失败 Recognition start failed');
            }
          }
        }
      }
    }, 300);
  }

  /**
   * 开始监听
   */
  function startListening() {
    if (!isSupported) {
      if (onErrorCallback) onErrorCallback('not-supported', '浏览器不支持语音识别');
      return false;
    }

    if (isListening) return true;

    consecutiveErrors = 0;
    recognition = createRecognition();
    if (!recognition) return false;

    try {
      recognition.start();
      isListening = true;
      if (onStatusChangeCallback) {
        onStatusChangeCallback('starting', '启动中... Starting...');
      }
      return true;
    } catch (e) {
      console.error('Speech: start failed', e);
      isListening = false;
      if (onErrorCallback) onErrorCallback('start-failed', e.message);
      return false;
    }
  }

  /**
   * 停止监听
   */
  function stopListening() {
    isListening = false;

    if (restartTimer) {
      clearTimeout(restartTimer);
      restartTimer = null;
    }

    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        // 忽略 stop 时的错误
      }
      recognition = null;
    }

    if (onStatusChangeCallback) {
      onStatusChangeCallback('stopped', '已停止 Stopped');
    }
  }

  /**
   * 暂停（等同于停止，但状态显示为暂停）
   */
  function pauseListening() {
    isListening = false;

    if (restartTimer) {
      clearTimeout(restartTimer);
      restartTimer = null;
    }

    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        // 忽略
      }
      recognition = null;
    }

    if (onStatusChangeCallback) {
      onStatusChangeCallback('paused', '已暂停 Paused');
    }
  }

  /**
   * 设置回调
   */
  function onResult(callback) { onResultCallback = callback; }
  function onStatusChange(callback) { onStatusChangeCallback = callback; }
  function onError(callback) { onErrorCallback = callback; }

  /**
   * 获取当前状态
   */
  function getIsListening() { return isListening; }

  return {
    checkSupport,
    startListening,
    stopListening,
    pauseListening,
    onResult,
    onStatusChange,
    onError,
    getIsListening
  };
})();
