/**
 * speech.js — Web Speech API wrapper
 * speech.js — 语音识别封装
 *
 * 使用 continuous: false 模式：每次识别一句话，说完自动重启。
 * 避免 continuous: true 的复杂事件模型和重复气泡问题。
 */

const SpeechRecognizer = (() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSupported = !!SpeechRecognition;

  let recognition = null;
  let isListening = false;
  let restartTimer = null;

  // 回调
  let onResultCallback = null;
  let onStatusChangeCallback = null;
  let onErrorCallback = null;

  // 断路保护
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 5;

  function checkSupport() {
    return isSupported;
  }

  function createRecognition() {
    if (!isSupported) return null;

    const rec = new SpeechRecognition();
    rec.lang = 'zh-CN';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    // Safari iOS: isFinal 经常永远为 false, 需在 onend 时手动 finalize
    let sessionInterim = '';
    let lastSentText = '';  // 防止 onend 发送 onresult 已经发过的文本

    rec.onresult = (event) => {
      consecutiveErrors = 0;

      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          final = transcript;  // = 不是 +=，避免 Safari 累积旧结果
        } else {
          interim = transcript;  // = 不是 +=，interim 已是完整文本
        }
      }

      if (interim) sessionInterim = interim;
      if (final && final.trim()) lastSentText = final.trim();

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

      if (event.error === 'no-speech') return;
      if (event.error === 'aborted') return;

      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        stopListening();
        if (onStatusChangeCallback) {
          onStatusChangeCallback('error', '错误过多，已自动停止');
        }
        return;
      }
    };

    rec.onend = () => {
      // Safari iOS workaround: 如果 isFinal 从未触发 (lastSentText 为空 或
      // 与 sessionInterim 不同), 把最后的 interim 作为 final 发送
      if (isListening && sessionInterim && sessionInterim.trim()) {
        const text = sessionInterim.trim();
        if (text !== lastSentText) {
          if (onResultCallback) {
            onResultCallback({ final: text, interim: '' });
          }
          lastSentText = text;
        }
      }
      sessionInterim = '';
      lastSentText = '';

      // 自动重启听下一句
      if (isListening) {
        restartTimer = setTimeout(() => {
          if (!isListening) return;
          try {
            recognition.start();
          } catch (e) {
            recognition = createRecognition();
            if (recognition && isListening) {
              try { recognition.start(); } catch (_) {}
            }
          }
        }, 250);
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

  function stopListening() {
    isListening = false;
    if (restartTimer) { clearTimeout(restartTimer); restartTimer = null; }
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
      recognition = null;
    }
    if (onStatusChangeCallback) {
      onStatusChangeCallback('stopped', '已停止 Stopped');
    }
  }

  function pauseListening() {
    isListening = false;
    if (restartTimer) { clearTimeout(restartTimer); restartTimer = null; }
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
      recognition = null;
    }
    if (onStatusChangeCallback) {
      onStatusChangeCallback('paused', '已暂停 Paused');
    }
  }

  function onResult(callback) { onResultCallback = callback; }
  function onStatusChange(callback) { onStatusChangeCallback = callback; }
  function onError(callback) { onErrorCallback = callback; }
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
