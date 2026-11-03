import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

// Exercise the actual Vue setup functions with minimal browser/reactivity adapters.
// Chrome observations separately verify rendering and interaction.
const source = readFileSync(new URL('../frontend/app.js', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/gm, '');
function mount(records = [], failHistory = false) {
  let ui;
  const requests = [];
  const handlers = {};
  let now = 0;
  const document = { hidden: false, addEventListener: (name, callback) => { handlers[name] = callback; } };
  const context = {
    createApp: options => ({ mount: () => { ui = options.setup(); } }),
    ref: value => ({ value }), computed: fn => ({ get value() { return fn(); } }),
    onMounted() {}, nextTick: async () => {}, cueAt() {},
    localStorage: { getItem: () => null, setItem() {} }, document,
    window: { addEventListener() {} }, AbortSignal, performance: { now: () => now },
    crypto: { randomUUID: () => 'fictional-session' },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    fetch: async (url, options) => {
      requests.push({ url, method: options.method || 'GET', ...(options.body ? { body: JSON.parse(options.body) } : {}) });
      return { ok: !failHistory, json: async () => ({ sessions: [], conversations: records }) };
    },
  };
  vm.runInNewContext(source, context);
  return { ui, requests, handlers, document, advance: ms => { now += ms; } };
}
const saved = { id: 'fictional-older', created_at: '2026-11-02T20:00:00Z',
  status: 'success', source: 'mock', question: 'Fictional: Sam asks about stopping.', reply: 'You may stop.' };

test('first visit offers no saved answer', async () => {
  const { ui } = mount();
  await ui.navigate('ask');
  assert.equal(ui.lastAnswer.value, null);
});
test('reopening skips newer failed, pending, crisis and empty records and preserves draft', async () => {
  const records = ['failed', 'pending', 'crisis', 'success'].map(status => ({ status, reply: status === 'success' ? ' ' : 'ignore' }));
  const { ui, requests } = mount([...records, saved]);
  await ui.navigate('ask');
  ui.question.value = 'Fictional draft: Alex asks about the pace.';
  ui.reopenLastAnswer();
  assert.equal(ui.answer.value.id, saved.id);
  assert.equal(ui.answer.value.reply, saved.reply);
  assert.equal(ui.question.value, 'Fictional draft: Alex asks about the pace.');
  assert.equal(ui.reopened.value, true);
  assert.deepEqual(requests, [{ url: '/api/history', method: 'GET' }]);
  ui.config.value = { model_mode: 'live' };
  assert.match(ui.modeLabel.value, /Mock reply/);
});
test('newest success replaces an older success on a subsequent visit', async () => {
  const newer = { ...saved, id: 'fictional-newer', reply: 'Six cycles.' };
  const { ui } = mount([newer, saved]);
  await ui.navigate('ask');
  ui.reopenLastAnswer();
  assert.equal(ui.answer.value.id, newer.id);
  assert.equal(ui.answer.value.reply, newer.reply);
});
test('history failure does not block navigation, and reopening is unavailable', async () => {
  const { ui } = mount([saved], true);
  await ui.navigate('ask');
  assert.equal(ui.screen.value, 'ask');
  assert.equal(ui.lastAnswer.value, null);
  assert.match(ui.historyError.value, /could not be loaded/);
  ui.reopenLastAnswer();
  assert.equal(ui.answer.value, null);
});
test('reopening is disabled while a fresh request is pending', async () => {
  const { ui } = mount([saved]);
  await ui.navigate('ask');
  ui.sending.value = true;
  ui.reopenLastAnswer();
  assert.equal(ui.answer.value, null);
});
test('hiding the page interrupts an active exercise and queues a terminal record', async () => {
  const { ui, requests, handlers, document, advance } = mount();
  ui.skill.value = { duration_seconds: 60 };
  await ui.start();
  advance(2500);
  document.hidden = true;
  handlers.visibilitychange();
  // Allow the outbox's in-flight start to finish, then flush the newer terminal event.
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(ui.active.value, false);
  assert.equal(ui.outcome.value, 'interrupted');
  assert.equal(ui.elapsed.value, 2500);
  assert.ok(requests.some(r => r.url === '/api/sessions/fictional-session' && r.body?.status === 'interrupted'));
});
