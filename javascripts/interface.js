'use strict';

const state = { voice: 'glass', immersion: 0.2, echo: 0.35, dose: 0.7, octave: 4 };
let engine = null;

const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ui = {
  monMsg: $('#monMsg'), monProc: $('#monProc'), pulse: $('#pulse'),
  rdNote: $('#rdNote'), rdHz: $('#rdHz'), rdVoices: $('#rdVoices'), rdDepth: $('#rdDepth'),
  scope: $('#scope'), tube: $('#tube'), water: $('#water'), depthOut: $('#depthOut'),
  echo: $('#echo'), echoOut: $('#echoOut'), dose: $('#dose'), doseOut: $('#doseOut'),
  octOut: $('#octOut'), keys: $('#keys'), log: $('#log'), dialog: $('#dialog'), desk: $('.desk'), taskbar: $('.taskbar'),
  tbStatus: $('#tbStatus'), tbVoice: $('#tbVoice'), tbRate: $('#tbRate'), tbClock: $('#tbClock'),
};
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_RU = ['до', 'до-диез', 'ре', 'ре-диез', 'ми', 'фа', 'фа-диез', 'соль', 'соль-диез', 'ля', 'ля-диез', 'си'];
const noteName = n => NOTE_NAMES[n % 12] + (Math.floor(n / 12) - 1);
const isBlack = n => [1, 3, 6, 8, 10].includes(n % 12);
const pct = v => Math.round(v * 100) + '%';
const hz = f => f >= 1000 ? (f / 1000).toFixed(2).replace('.', ',') + ' кГц' : Math.round(f) + ' Гц';
const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

function log(text, dim) {
  const p = document.createElement('p');
  p.textContent = '> ' + text;
  if (dim) p.className = 'dim';
  ui.log.appendChild(p);
  while (ui.log.children.length > 10) ui.log.firstElementChild.remove();
}

function startAudio() {
  if (!engine) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { ui.tbStatus.textContent = 'Этот браузер не поддерживает Web Audio'; return null; }
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (err) {}
    let ctx;
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch (err) { ctx = new AC(); }
    engine = createEngine(ctx);
    engine.set(state, true);
    ctx.onstatechange = showStatus;
    ui.monMsg.hidden = true;
    ui.dialog.hidden = true;
    const rate = (ctx.sampleRate / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' кГц';
    ui.tbRate.textContent = rate;
    log('звук включён, ' + rate);
  }
  if (engine.ctx.state !== 'running') engine.ctx.resume().then(showStatus, () => {});
  showStatus();
  return engine;
}
function showStatus() {
  if (!engine) return;
  ui.tbStatus.textContent = engine.ctx.state === 'running' ? 'Процедура идёт. Вам уже лучше.' : 'Процедура на паузе';
}

const down = new Map();
const keyHold = new Map();
let pulseTimer = 0, lastNoteLog = 0;

function press(src, key) {
  if (down.has(src)) release(src);
  if (!startAudio()) return;
  const note = key + VOICES[state.voice].shift;
  down.set(src, { key, v: engine.noteOn(note, state.voice) });
  count(keyHold, key, 1);
  showNote(note);
  bubble();
  const now = performance.now();
  if (now - lastNoteLog > 700) { log(`нота ${noteName(note)}, ${NOTE_RU[note % 12]}`, true); lastNoteLog = now; }
}
function release(src) {
  const d = down.get(src);
  if (!d) return;
  down.delete(src);
  engine.noteOff(d.v);
  count(keyHold, d.key, -1);
}
function releaseAll(prefix) { for (const src of [...down.keys()]) if (src.startsWith(prefix)) release(src); }
function count(map, key, delta) {
  const c = (map.get(key) || 0) + delta;
  if (c > 0) map.set(key, c); else map.delete(key);
  paintKey(key);
}
function showNote(note) {
  ui.rdNote.textContent = noteName(note);
  ui.rdHz.textContent = hz(midiHz(note));
  ui.pulse.classList.add('beat');
  clearTimeout(pulseTimer);
  pulseTimer = setTimeout(() => ui.pulse.classList.remove('beat'), 140);
}

function setVoice(k, byHand) {
  if (byHand && k !== state.voice) log('ампула: ' + VOICES[k].name.toLowerCase());
  state.voice = k;
  document.querySelectorAll('[data-voice]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.voice === k)));
  ui.monProc.textContent = 'ПРОЦЕДУРА: ' + VOICES[k].name.toUpperCase();
  ui.tbVoice.textContent = VOICES[k].name;
}
document.querySelectorAll('[data-voice]').forEach(b => b.addEventListener('click', () => setVoice(b.dataset.voice, true)));

function setImmersion(v) {
  state.immersion = clamp(v, 0, 1);
  ui.water.style.height = state.immersion * 100 + '%';
  ui.depthOut.textContent = ui.rdDepth.textContent = pct(state.immersion);
  ui.tube.setAttribute('aria-valuenow', String(Math.round(state.immersion * 100)));
  ui.tube.setAttribute('aria-valuetext', pct(state.immersion));
  if (engine) engine.set(state);
}
let tubeDrag = null;
const levelAt = y => { const r = ui.tube.getBoundingClientRect(); return 1 - (y - r.top) / r.height; };
ui.tube.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  e.preventDefault();
  try { ui.tube.setPointerCapture(e.pointerId); } catch (err) {}
  tubeDrag = e.pointerId;
  setImmersion(levelAt(e.clientY));
});
ui.tube.addEventListener('pointermove', e => { if (e.pointerId === tubeDrag) setImmersion(levelAt(e.clientY)); });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => ui.tube.addEventListener(t, () => {
  if (tubeDrag === null) return;
  tubeDrag = null;
  log('погружение ' + pct(state.immersion));
}));
ui.tube.addEventListener('keydown', e => {
  const step = { ArrowUp: 0.05, ArrowRight: 0.05, ArrowDown: -0.05, ArrowLeft: -0.05, PageUp: 0.2, PageDown: -0.2 }[e.key];
  if (step) setImmersion(state.immersion + step);
  else if (e.key === 'Home') setImmersion(0);
  else if (e.key === 'End') setImmersion(1);
  else return;
  e.preventDefault();
  e.stopPropagation();
});
ui.tube.addEventListener('keyup', e => { if (/^(Arrow|Page|Home|End)/.test(e.key)) log('погружение ' + pct(state.immersion)); });

let bubbles = 0;
function bubble() {
  if (state.immersion < 0.05 || bubbles > 16 || calm.matches) return;
  const b = document.createElement('span'), s = 4 + Math.random() * 6;
  b.className = 'bubble';
  b.style.cssText = `left:${8 + Math.random() * 32}px;width:${s}px;height:${s}px;--dx:${(Math.random() * 10 - 5).toFixed(1)}px;` +
    `--h:${Math.max(0, ui.water.clientHeight - 12)}px;--dur:${(0.9 + Math.random()).toFixed(2)}s`;
  b.addEventListener('animationend', () => { b.remove(); bubbles--; });
  ui.water.appendChild(b);
  bubbles++;
}

function readSliders() {
  state.echo = ui.echo.value / 100;
  state.dose = ui.dose.value / 100;
  ui.echoOut.textContent = pct(state.echo);
  ui.doseOut.textContent = pct(state.dose);
  if (engine) engine.set(state);
}
ui.echo.addEventListener('input', readSliders);
ui.dose.addEventListener('input', readSliders);
ui.echo.addEventListener('change', () => log('эхо коридора ' + pct(state.echo)));
ui.dose.addEventListener('change', () => log('доза ' + pct(state.dose)));

const KEYMAP = new Map(Object.entries({
  KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7, KeyY: 8, KeyH: 9, KeyU: 10, KeyJ: 11,
  KeyK: 12, KeyO: 13, KeyL: 14, KeyP: 15, Semicolon: 16, Quote: 17,
}));
const KEY_LABEL = {};
for (const [code, off] of KEYMAP) KEY_LABEL[off] = { Semicolon: ';', Quote: "'" }[code] || code.slice(3);
const OCT_MIN = 2, OCT_MAX = 6;
const keyEls = new Map();
let nOct = 2;

function buildKeys() {
  nOct = ui.keys.clientWidth < 520 ? 1 : 2;
  state.octave = clamp(state.octave, OCT_MIN, OCT_MAX + 1 - nOct);
  const first = 12 * (state.octave + 1), last = first + 12 * nOct;
  let whites = 0;
  for (let n = first; n <= last; n++) if (!isBlack(n)) whites++;
  ui.keys.style.setProperty('--wk', `calc((100% - ${6 + (whites - 1) * 3}px) / ${whites})`);
  const frag = document.createDocumentFragment();
  keyEls.clear();
  let i = 0;
  for (let n = first; n <= last; n++) {
    const el = document.createElement('div');
    el.className = 'key ' + (isBlack(n) ? 'b' : 'w');
    el.dataset.key = n;
    if (isBlack(n)) {
      el.style.left = `calc(${3 + i * 3 - 1.5}px + ${i} * var(--wk) - var(--wk) * 0.3)`;
      el.style.width = 'calc(var(--wk) * 0.6)';
    } else i++;
    let html = '';
    if (n % 12 === 0) html += `<span class="nn">${noteName(n)}</span>`;
    if (KEY_LABEL[n - first] !== undefined) html += `<span class="kl">${KEY_LABEL[n - first]}</span>`;
    el.innerHTML = html;
    frag.appendChild(el);
    keyEls.set(n, el);
  }
  ui.keys.replaceChildren(frag);
  ui.octOut.textContent = `${noteName(first)}–${noteName(last)}`;
  keyEls.forEach((el, n) => paintKey(n));
}
function paintKey(key) {
  const el = keyEls.get(key);
  if (el) el.classList.toggle('on', keyHold.has(key));
}
function shiftOctave(d) {
  const o = clamp(state.octave + d, OCT_MIN, OCT_MAX + 1 - nOct);
  if (o === state.octave) return;
  state.octave = o;
  buildKeys();
  log('октава ' + ui.octOut.textContent);
}
$('#octDown').addEventListener('click', () => shiftOctave(-1));
$('#octUp').addEventListener('click', () => shiftOctave(1));

const ptr = new Map();
function keyUnder(x, y) {
  const el = document.elementFromPoint(x, y);
  const k = el && el.closest ? el.closest('.key') : null;
  return k && ui.keys.contains(k) ? +k.dataset.key : null;
}
ui.keys.addEventListener('pointerdown', e => {
  const k = e.target.closest('.key');
  if (!k || (e.pointerType === 'mouse' && e.button !== 0)) return;
  e.preventDefault();
  try { ui.keys.setPointerCapture(e.pointerId); } catch (err) {}
  ptr.set(e.pointerId, +k.dataset.key);
  press('p:' + e.pointerId, +k.dataset.key);
});
ui.keys.addEventListener('pointermove', e => {
  if (!ptr.has(e.pointerId)) return;
  const key = keyUnder(e.clientX, e.clientY);
  if (key === ptr.get(e.pointerId)) return;
  ptr.set(e.pointerId, key);
  if (key === null) release('p:' + e.pointerId); else press('p:' + e.pointerId, key);
});
const ptrEnd = e => { if (ptr.delete(e.pointerId)) release('p:' + e.pointerId); };
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => ui.keys.addEventListener(t, ptrEnd));
ui.keys.addEventListener('contextmenu', e => e.preventDefault());

const inControl = t => !!(t && t.closest && t.closest('input, .tube'));
window.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const code = e.code;
  if (KEYMAP.has(code)) {
    e.preventDefault();
    if (!e.repeat) press('k:' + code, 12 * (state.octave + 1) + KEYMAP.get(code));
    return;
  }
  if (e.repeat) return;
  if (/^Digit[123]$/.test(code)) { setVoice(VOICE_ORDER[+code.slice(5) - 1], true); return; }
  if (code === 'Escape') { stopEverything(); return; }
  if ((code === 'ArrowLeft' || code === 'ArrowRight') && !inControl(e.target)) {
    e.preventDefault();
    shiftOctave(code === 'ArrowLeft' ? -1 : 1);
  }
});
window.addEventListener('keyup', e => { if (KEYMAP.has(e.code)) release('k:' + e.code); });
window.addEventListener('blur', () => releaseAll('k:'));
document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(''); });

$('#dlgOk').addEventListener('click', () => { startAudio(); ui.dialog.hidden = true; });
$('#dlgX').addEventListener('click', () => { ui.dialog.hidden = true; log('окно закрыто. процедура ждёт', true); });

const scope = { g: ui.scope.getContext('2d'), buf: null, peak: 0.3, dpr: 1, ink: '' };
function sizeScope() {
  const c = ui.scope, dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(c.clientWidth * dpr)), h = Math.max(1, Math.round(c.clientHeight * dpr));
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  scope.dpr = dpr;
  scope.ink = getComputedStyle(c).getPropertyValue('--phos').trim() || '#8DF5DA';
}
function drawScope() {
  const g = scope.g, w = ui.scope.width, h = ui.scope.height, dpr = scope.dpr;
  g.globalCompositeOperation = 'destination-out';
  g.globalAlpha = 0.4;
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'source-over';
  let data = null, n = 0, start = 0, peak = 0;
  if (engine) {
    if (!scope.buf) scope.buf = new Float32Array(engine.analyser.fftSize);
    engine.analyser.getFloatTimeDomainData(scope.buf);
    data = scope.buf;
    n = data.length >> 1;
    for (let i = 1; i < n; i++) if (data[i - 1] < 0 && data[i] >= 0) { start = i; break; }
    for (let i = start; i < start + n; i++) peak = Math.max(peak, Math.abs(data[i]));
  }
  scope.peak = peak > scope.peak ? peak : scope.peak * 0.97 + peak * 0.03;
  const live = peak > 1e-4, gain = 0.85 / Math.max(scope.peak, 0.08), mid = h / 2, amp = h / 2 - 4 * dpr;
  g.beginPath();
  if (!live) { g.moveTo(0, mid); g.lineTo(w, mid); }
  else for (let i = 0; i < n; i++) {
    const x = i / (n - 1) * w, y = mid - clamp(data[start + i] * gain, -1, 1) * amp;
    if (i) g.lineTo(x, y); else g.moveTo(x, y);
  }
  g.strokeStyle = scope.ink;
  g.lineJoin = 'round';
  g.globalAlpha = live ? 0.25 : 0.12; g.lineWidth = 6 * dpr; g.stroke();
  g.globalAlpha = live ? 1 : 0.5; g.lineWidth = 1.7 * dpr; g.stroke();
  g.globalAlpha = 1;
}

function tick() {
  const d = new Date();
  ui.tbClock.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
