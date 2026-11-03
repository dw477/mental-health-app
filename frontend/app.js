import { createApp, ref, computed, onMounted, nextTick } from './vendor/vue.esm-browser.prod.js';
import { cueAt } from './exercise.mjs';

createApp({
  setup() {
    const skill = ref(null);
    const config = ref(null);
    const screen = ref('breathe');
    const active = ref(false);
    const elapsed = ref(0);
    const outcome = ref('');
    const loadError = ref('');
    const saveError = ref('');
    const historyError = ref('');
    const history = ref({ sessions: [], conversations: [] });
    const question = ref('');
    const sending = ref(false);
    const answer = ref(null);
    const lastAnswer = ref(null);
    const reopened = ref(false);
    const questionError = ref('');
    const resources = ref(null);
    const resourceReturnFocus = ref(null);
    const readyAt = ref(0);
    let session = null;
    let firstCueAt = 0;
    let frame = 0;
    let flushing = false;
    const pendingKey = 'breathing-session-outbox-v1';
    let pendingSessions = readPending();
    const cue = computed(() => skill.value ? cueAt(elapsed.value, skill.value) : null);
    const modeLabel = computed(() => answer.value?.source === 'mock' ? 'Mock reply · demonstration only' : 'Google Gemini');

    async function request(url, options = {}) {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(25000) });
      if (!response.ok) throw new Error('Request failed');
      return response.json();
    }

    function readPending() {
      try { return JSON.parse(localStorage.getItem(pendingKey) || '{}'); }
      catch { return {}; }
    }

    function queueSession(record) {
      pendingSessions[record.id] = record;
      persistPending();
      return record;
    }

    function persistPending() {
      try { localStorage.setItem(pendingKey, JSON.stringify(pendingSessions)); }
      catch { saveError.value = 'Local recovery storage is unavailable. Keep this page open until the session is saved.'; }
    }

    async function flushSessions() {
      if (flushing) return;
      flushing = true;
      try {
        let entries = Object.values(pendingSessions);
        while (entries.length) {
          const record = entries[0];
          await request(`/api/sessions/${record.id}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record),
          });
          // Preserve a newer stop/finish queued while the start request was in flight.
          if (JSON.stringify(pendingSessions[record.id]) === JSON.stringify(record)) delete pendingSessions[record.id];
          persistPending();
          entries = Object.values(pendingSessions);
        }
        saveError.value = '';
      } catch {
        saveError.value = 'The session has not reached the database yet. Retry saving when the server is available.';
      } finally { flushing = false; }
    }

    function finish(status) {
      if (!active.value) return;
      elapsed.value = performance.now() - firstCueAt;
      active.value = false;
      cancelAnimationFrame(frame);
      outcome.value = status;
      readyAt.value = performance.now();
      session = queueSession({ ...session, status, elapsed_ms: elapsed.value });
      void flushSessions();
    }

    function tick() {
      if (!active.value) return;
      elapsed.value = performance.now() - firstCueAt;
      if (cue.value.complete) { finish('completed'); return; }
      frame = requestAnimationFrame(tick);
    }

    async function start() {
      if (active.value || !skill.value) return;
      elapsed.value = 0;
      outcome.value = '';
      active.value = true;
      await nextTick();
      // The first instruction is now rendered. Setup and exercise clocks are separate.
      firstCueAt = performance.now();
      session = queueSession({
        id: crypto.randomUUID(), started_at: new Date().toISOString(), status: 'active',
        setup_ms: firstCueAt - readyAt.value, elapsed_ms: 0,
      });
      void flushSessions();
      frame = requestAnimationFrame(tick);
    }

    async function loadHistory() {
      historyError.value = '';
      lastAnswer.value = null;
      try {
        history.value = await request('/api/history');
        // History is newest first. Failed, pending and crisis records are not reusable answers.
        lastAnswer.value = history.value.conversations.find(record =>
          record.status === 'success' && record.reply?.trim()) || null;
      }
      catch { historyError.value = 'History could not be loaded. You can try again.'; }
    }

    function reopenLastAnswer() {
      if (!lastAnswer.value || sending.value) return;
      answer.value = { ...lastAnswer.value };
      reopened.value = true;
      questionError.value = '';
    }

    async function navigate(destination) {
      if (active.value) finish('stopped');
      if (destination === 'breathe' && screen.value !== 'breathe') readyAt.value = performance.now();
      screen.value = destination;
      if (destination === 'history' || destination === 'ask') await loadHistory();
    }

    function openResources(event) {
      resourceReturnFocus.value = event.currentTarget;
      if (active.value) finish('stopped');
      resources.value.showModal();
    }

    function closeResources() {
      resources.value.close();
      resourceReturnFocus.value?.focus();
    }

    async function ask() {
      if (!question.value.trim() || sending.value) return;
      sending.value = true;
      questionError.value = '';
      answer.value = null;
      reopened.value = false;
      try {
        answer.value = await request('/api/questions', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: crypto.randomUUID(), question: question.value.trim() }),
        });
        if (answer.value.status === 'success' && answer.value.reply?.trim()) lastAnswer.value = { ...answer.value };
      } catch {
        questionError.value = 'The reply could not be loaded. Please try again later. The exercise and Crisis resources are available.';
      } finally { sending.value = false; }
    }

    async function initialize() {
      loadError.value = '';
      try {
        config.value = await request('/api/status');
        skill.value = config.value.skill;
        await nextTick();
        readyAt.value = performance.now();
        // Recover an unsent start after an interrupted page, without claiming completion.
        for (const record of Object.values(pendingSessions)) {
          if (record.status === 'active') record.status = 'interrupted';
        }
        persistPending();
        void flushSessions();
      } catch { loadError.value = 'The exercise could not be loaded. Check that the local server is running, then retry.'; }
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && active.value) finish('interrupted');
    });
    window.addEventListener('pagehide', () => {
      if (active.value) finish('interrupted');
      for (const record of Object.values(pendingSessions)) {
        navigator.sendBeacon(`/api/sessions/${record.id}`, new Blob([JSON.stringify(record)], { type: 'application/json' }));
      }
    });
    window.addEventListener('online', flushSessions);
    onMounted(initialize);

    function formatDate(date) {
      return new Date(date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    }

    return {
      skill, config, screen, active, elapsed, outcome, cue, loadError, saveError,
      historyError, history, question, sending, answer, lastAnswer, reopened, questionError, resources,
      modeLabel, start, finish, navigate, openResources, closeResources, ask,
      initialize, flushSessions, loadHistory, reopenLastAnswer, formatDate,
    };
  },
}).mount('#app');
