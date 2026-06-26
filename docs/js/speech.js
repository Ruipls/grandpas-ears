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
    rec.continuous = false;   // 每次识别一句，说完自动结束
    rec.interimResults = true; // 仍然显示中间结果
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      consecutiveErrors = 0;

      // continuous: false 时，通常只有一个 result
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
      // continuous: false 时，每次说完一句话 onend 就会触发
      // 如果用户仍在聆听状态，自动重启以继续听下一句
      if (isListening) {
        restartTimer = setTimeout(() => {
          if (!isListening) return;
          try {
            recognition.start();
          } catch (e) {
            // 重建实例再试
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
