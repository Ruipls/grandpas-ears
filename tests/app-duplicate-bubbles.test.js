const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const storageSource = fs.readFileSync(path.join(root, 'docs/js/storage.js'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'docs/js/app.js'), 'utf8');

let now = 1_700_000_000_000;
const RealDate = Date;

function FakeDate(...args) {
  if (!(this instanceof FakeDate)) {
    return new RealDate(now).toString();
  }
  return args.length ? new RealDate(...args) : new RealDate(now);
}

FakeDate.now = () => now;
FakeDate.parse = RealDate.parse;
FakeDate.UTC = RealDate.UTC;
FakeDate.prototype = RealDate.prototype;

function createLocalStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    }
  };
}

function createElementStub() {
  return {
    addEventListener() {},
    classList: {
      add() {},
      remove() {},
      toggle() {}
    },
    querySelector() {
      return { textContent: '' };
    },
    textContent: ''
  };
}

function createHarness() {
  let speechResultHandler = null;
  const bubbles = new Map();

  const context = {
    console: {
      log() {},
      warn: console.warn,
      error: console.error
    },
    Date: FakeDate,
    Math,
    localStorage: createLocalStorage(),
    navigator: {
      serviceWorker: {
        register() {
          return Promise.resolve({ scope: 'test-scope' });
        }
      }
    },
    document: {
      body: {},
      addEventListener(event, callback) {
        if (event === 'DOMContentLoaded') callback();
      }
    },
    SpeechRecognizer: {
      checkSupport() {
        return true;
      },
      onResult(callback) {
        speechResultHandler = callback;
      },
      onStatusChange() {},
      onError() {},
      getIsListening() {
        return false;
      },
      startListening() {
        return true;
      },
      stopListening() {},
      pauseListening() {}
    },
    UI: {
      init() {},
      getElements() {
        return {
          btnStart: createElementStub(),
          btnSpeakerA: createElementStub(),
          btnSpeakerB: createElementStub(),
          btnFontSize: createElementStub(),
          btnDarkMode: createElementStub(),
          btnClear: createElementStub(),
          btnRequestPermission: createElementStub(),
          btnDismissPermission: createElementStub()
        };
      },
      hideWelcome() {},
      showWelcome() {},
      showUnsupportedDialog() {},
      showPermissionDialog() {},
      hidePermissionDialog() {},
      setMainButtonState() {},
      setActiveSpeaker() {},
      toggleFontMode() {},
      toggleTheme() {},
      clearAllBubbles() {
        bubbles.clear();
      },
      scrollToBottom() {},
      updateStatus() {},
      appendBubble(msg) {
        bubbles.set(msg.id, { ...msg });
      },
      updateBubble(id, msg) {
        bubbles.set(id, { ...msg });
      },
      finalizeBubble(id) {
        const bubble = bubbles.get(id);
        if (bubble) bubble.isInterim = false;
      },
      removeBubble(id) {
        bubbles.delete(id);
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(storageSource, context, { filename: 'storage.js' });
  vm.runInContext(appSource, context, { filename: 'app.js' });

  assert.strictEqual(typeof speechResultHandler, 'function', 'App should register speech result handler');

  return {
    emit(result) {
      speechResultHandler(result);
    },
    messages() {
      return vm.runInContext('Storage.getMessages()', context);
    },
    bubbleCount() {
      return bubbles.size;
    }
  };
}

const app = createHarness();

app.emit({ final: '你好。', interim: '' });
assert.strictEqual(app.messages().length, 1, 'first final result creates one message');
assert.strictEqual(app.bubbleCount(), 1, 'first final result creates one bubble');

now += 250;
app.emit({ final: '', interim: '你好' });
assert.strictEqual(app.messages().length, 1, 'duplicate interim echo is suppressed');
assert.strictEqual(app.bubbleCount(), 1, 'duplicate interim echo does not create a bubble');

now += 250;
app.emit({ final: '你好', interim: '' });
assert.strictEqual(app.messages().length, 1, 'duplicate final echo is suppressed');
assert.strictEqual(app.bubbleCount(), 1, 'duplicate final echo does not create a bubble');

now += 2_000;
app.emit({ final: '', interim: '你好' });
assert.strictEqual(app.messages().length, 2, 'same phrase after suppression window starts a new message');
assert.strictEqual(app.bubbleCount(), 2, 'same phrase after suppression window creates a new bubble');

now += 100;
app.emit({ final: '你好', interim: '' });
assert.strictEqual(app.messages().length, 2, 'new repeated phrase finalizes existing interim message');
assert.strictEqual(app.messages()[1].isInterim, false, 'new repeated phrase is finalized');
assert.strictEqual(app.bubbleCount(), 2, 'new repeated phrase keeps one bubble for that phrase');

console.log('duplicate bubble regression test passed');
