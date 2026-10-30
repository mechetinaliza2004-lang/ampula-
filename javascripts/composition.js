'use strict';

const BEATS = 3;
const LOOP_BARS = 8, STEPS = LOOP_BARS * BEATS;
const PROGRESSION = ['Am', 'F', 'Dm', 'E', 'Am', 'F', 'E7', 'Am'];
const CHORD_PCS = { Am: [9, 0, 4], F: [5, 9, 0], Dm: [2, 5, 9], E: [4, 8, 11], E7: [4, 8, 11, 2] };
const CHORD_NOTES = [[57, 60, 64], [57, 60, 65], [57, 62, 65], [56, 59, 64], [57, 60, 64], [57, 60, 65], [56, 59, 62], [57, 60, 64]];

const TRACKS = [
  {
    key: 'glass', voice: 'glass', name: 'Стекло', file: 'стекло.amp', role: 'аккорды', unit: 'аккорды', color: '--cure', vol: 0.5,
    rows: [65, 64, 62, 60, 59, 57, 56],
    patterns: [
      { name: 'долгие', notes: CHORD_NOTES.flatMap((c, b) => c.map(n => [b * BEATS, n])) },
      { name: 'вальс', len: 0.85, notes: CHORD_NOTES.flatMap((c, b) => c.flatMap(n => [[b * BEATS + 1, n], [b * BEATS + 2, n]])) },
      { name: 'переливы', notes: CHORD_NOTES.flatMap((c, b) => c.map((n, i) => [b * BEATS + i, n])) },
    ],
  },
  {
    key: 'box', voice: 'box', name: 'Шкатулка', file: 'шкатулка.amp', role: 'мелодия', unit: 'мелодия', color: '--brass', vol: 0.85,
    rows: [84, 83, 81, 80, 77, 76, 74, 72, 71, 69],
    patterns: [
      {
        name: 'тема', notes: [[0, 76], [2, 72], [3, 69], [5, 72], [6, 74], [7, 77], [8, 76], [9, 71],
          [12, 76], [13, 81], [14, 84], [15, 83], [17, 81], [18, 80], [20, 76], [21, 81]],
      },
      {
        name: 'вариация', notes: [[0, 84], [1, 83], [2, 81], [3, 81], [5, 77], [6, 81], [7, 77], [8, 74], [9, 76], [11, 80],
          [12, 81], [14, 76], [15, 77], [16, 81], [17, 84], [18, 83], [20, 80], [21, 81]],
      },
      {
        name: 'заводная', notes: [[0, 69], [1, 72], [2, 76], [3, 69], [4, 72], [5, 77], [6, 69], [7, 74], [8, 77], [9, 71], [10, 76], [11, 80],
          [12, 72], [13, 76], [14, 81], [15, 72], [16, 77], [17, 81], [18, 71], [19, 74], [20, 80], [21, 69], [22, 72], [23, 76]],
      },
    ],
  },
  {
    key: 'eel', voice: 'eel', name: 'Угорь', file: 'угорь.amp', role: 'бас', unit: 'бас', color: '--eel', vol: 0.8,
    rows: [45, 43, 41, 40, 38, 36, 35, 33],
    patterns: [
      { name: 'опора', notes: [[0, 45], [3, 41], [6, 38], [9, 40], [12, 45], [15, 41], [18, 40], [21, 45]] },
      {
        name: 'с квинтой', notes: [[0, 45], [2, 40], [3, 41], [5, 36], [6, 38], [8, 33], [9, 40], [11, 35],
          [12, 45], [14, 40], [15, 41], [17, 36], [18, 40], [20, 35], [21, 45]],
      },
      {
        name: 'ползёт', notes: [[0, 33], [1, 36], [2, 40], [3, 41], [4, 40], [5, 36], [6, 38], [7, 41], [8, 45], [9, 40], [10, 38], [11, 35],
          [12, 33], [13, 36], [14, 40], [15, 41], [16, 45], [17, 41], [18, 40], [19, 38], [20, 35], [21, 33]],
      },
    ],
  },
  {
    key: 'drops', voice: null, name: 'Капли', file: 'капли.wav', role: 'ритм', unit: 'ритм', color: '--phos', vol: 0.75,
    rows: ['drop', 'tick', 'plop'], labels: ['капля', 'тик', 'плюх'],
    patterns: [
      { name: 'тихий', notes: [0, 3, 6, 9, 12, 15, 18, 21].map(s => [s, 'plop']).concat([5, 11, 17, 23].map(s => [s, 'drop'])) },
      {
        name: 'вальс', notes: [0, 3, 6, 9, 12, 15, 18, 21].map(s => [s, 'plop'])
          .concat([1, 2, 4, 5, 7, 8, 10, 13, 14, 16, 17, 19, 20, 22].map(s => [s, 'tick'])).concat([[11, 'drop'], [23, 'drop']]),
      },
      {
        name: 'дождь', notes: [0, 6, 12, 18].map(s => [s, 'plop']).concat([3, 9, 15, 21].map(s => [s, 'tick']))
          .concat([...Array(STEPS).keys()].filter(s => s % BEATS).map(s => [s, 'drop'])),
      },
    ],
  },
];

const SCENARIO = [
  { name: 'вступление', play: { glass: 1, box: 3, eel: 0, drops: 1 } },
  { name: 'тема', play: { glass: 2, box: 1, eel: 1, drops: 2 } },
  { name: 'развитие', play: { glass: 3, box: 2, eel: 2, drops: 3 } },
  { name: 'финал', play: { glass: 1, box: 1, eel: 3, drops: 1 } },
];
const SCENE_BARS = LOOP_BARS, TOTAL_BARS = SCENARIO.length * SCENE_BARS;
const FADE = 0.35;

TRACKS.forEach(T => {
  T.on = true; T.live = false; T.pat = 0; T.pendPat = null; T.pendOn = null; T.fadeEnd = 0;
  T.shownPat = 0; T.shownOn = true;
  T.patterns.forEach(p => {
    p.cells = new Set(p.notes.map(([s, n]) => {
      const r = T.rows.indexOf(n);
      if (r < 0) throw new Error(`${T.key}: нет строки для ${n}`);
      return s + ':' + r;
    }));
  });
});

const seq = {
  playing: false, ending: false, finished: false, scenario: true, bpm: 84,
  abs: 0, next: 0, timer: 0, token: 0, vis: [], visAbs: -1, visT: 0,
  baseImm: 0.2, dive: false, diveOff: false, hint: null,
};
const beatSec = () => 60 / seq.bpm;

const instEl = $('#insts');
function patLabel(T, i) { return `${T.unit} ${i + 1}: ${T.patterns[i].name}`; }

TRACKS.forEach(T => {
  const w = document.createElement('section');
  w.className = 'win w-inst';
  w.dataset.track = T.key;
  w.style.setProperty('--c', `var(${T.color})`);
  w.setAttribute('aria-labelledby', 't-' + T.key);
  const pats = T.patterns.map((p, i) => `<button type="button" class="btn sq pat" data-i="${i}" aria-pressed="${i === 0}" title="${patLabel(T, i)}">${i + 1}</button>`).join('');
  w.innerHTML =
    `<div class="tb"><span class="ico" aria-hidden="true"></span><h2 id="t-${T.key}">${T.file} — ${T.role}</h2></div>` +
    `<div class="inst-ctl">` +
    `<button type="button" class="btn onoff" aria-pressed="true">ВКЛ</button>` +
    `<div class="pats" role="group" aria-label="${T.name}: ${T.unit}">${pats}</div>` +
    `<label class="vol"><span>громк.</span><input type="range" min="0" max="100" value="${Math.round(T.vol * 100)}" aria-label="${T.name}: громкость"></label>` +
    `</div>` +
    `<div class="grid" role="img" aria-label="${T.name}: сетка нот на 8 тактов"></div>` +
    `<p class="inst-foot"><span class="pname">${patLabel(T, 0)}</span><span class="pnext"></span></p>`;
  instEl.appendChild(w);
  T.el = w;
  T.grid = w.querySelector('.grid');
  T.onBtn = w.querySelector('.onoff');
  T.patBtns = [...w.querySelectorAll('.pat')];
  T.pname = w.querySelector('.pname');
  T.pnext = w.querySelector('.pnext');
  buildGrid(T);

  T.onBtn.addEventListener('click', () => setTrackOn(T, !(T.pendOn ?? T.on), true));
  T.patBtns.forEach(b => b.addEventListener('click', () => setTrackPat(T, +b.dataset.i, true)));
  const vol = w.querySelector('input');
  vol.addEventListener('input', () => {
    T.vol = vol.value / 100;
    if (engine && (T.on || T.live)) engine.trackLevel(T.key, T.on ? T.vol : 0, 0, 0.03);
  });
  vol.addEventListener('change', () => log(`${T.name.toLowerCase()}: громкость ${vol.value}%`));
});

function buildGrid(T) {
  const g = T.grid;
  g.style.setProperty('--rows', T.rows.length);
  if (T.labels) g.classList.add('wide-l');
  const frag = document.createDocumentFragment();
  T.cells = [];
  T.rows.forEach((n, r) => {
    const l = document.createElement('span');
    l.className = 'rl';
    l.textContent = T.labels ? T.labels[r] : noteName(n);
    frag.appendChild(l);
    T.cells[r] = [];
    for (let s = 0; s < STEPS; s++) {
      const c = document.createElement('i');
      c.className = 'cell' + (s % BEATS === 0 ? ' bs' : '');
      c.dataset.s = s;
      c.dataset.r = r;
      frag.appendChild(c);
      T.cells[r][s] = c;
    }
  });
  g.replaceChildren(frag);
  paintGrid(T);
}
function paintGrid(T) {
  const p = T.patterns[T.shownPat];
  T.cells.forEach((row, r) => row.forEach((c, s) => c.classList.toggle('on', p.cells.has(s + ':' + r))));
  T.patBtns.forEach((b, i) => {
    b.setAttribute('aria-pressed', String(i === T.shownPat));
    b.classList.toggle('pend', i === T.pendPat);
  });
  T.pname.textContent = patLabel(T, T.shownPat);
  T.pnext.textContent = T.pendPat !== null ? ` → ${T.pendPat + 1} с нового такта` : '';
  paintOn(T);
}
function paintOn(T) {
  const on = T.pendOn ?? T.shownOn;
  T.onBtn.setAttribute('aria-pressed', String(on));
  T.onBtn.textContent = on ? 'ВКЛ' : 'ВЫКЛ';
  T.onBtn.classList.toggle('pend', T.pendOn !== null);
  T.el.classList.toggle('off', !T.shownOn);
}

let paint = null;
function cellAt(x, y) {
  const el = document.elementFromPoint(x, y);
  return el && el.classList && el.classList.contains('cell') ? el : null;
}
function toggleCell(T, c, mode) {
  const id = c.dataset.s + ':' + c.dataset.r, cells = T.patterns[T.shownPat].cells;
  const want = mode ?? !cells.has(id);
  if (want === cells.has(id)) return want;
  if (want) cells.add(id); else cells.delete(id);
  c.classList.toggle('on', want);
  if (want && !seq.playing && startAudio()) preview(T, +c.dataset.r);
  return want;
}
function preview(T, r) {
  const t = engine.ctx.currentTime + 0.01;
  if (!T.voice) { engine.trackLevel('drops', T.vol, 0, 0); engine.drop(T.rows[r], t, 0.9); return; }
  engine.trackLevel(T.key, T.vol, 0, 0);
  const v = engine.noteOn(T.rows[r], T.voice, t, { track: T.key, vel: 0.9 });
  engine.noteOff(v, t + 0.35);
}
TRACKS.forEach(T => {
  T.grid.addEventListener('pointerdown', e => {
    const c = e.target.closest('.cell');
    if (!c || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    try { T.grid.setPointerCapture(e.pointerId); } catch (err) {}
    paint = { T, id: e.pointerId, mode: toggleCell(T, c), last: c };
  });
  T.grid.addEventListener('pointermove', e => {
    if (!paint || paint.id !== e.pointerId || paint.T !== T) return;
    const c = cellAt(e.clientX, e.clientY);
    if (c && c !== paint.last && T.grid.contains(c)) { paint.last = c; toggleCell(T, c, paint.mode); }
  });
  const end = e => {
    if (!paint || paint.id !== e.pointerId) return;
    paint = null;
    log(`${T.name.toLowerCase()}: ноты изменены`, true);
  };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => T.grid.addEventListener(t, end));
});

function setTrackOn(T, on, byHand) {
  if (seq.playing) {
    T.pendOn = on === T.on ? null : on;
    paintOn(T);
    return;
  }
  T.on = T.shownOn = on;
  T.pendOn = null;
  if (engine) engine.trackLevel(T.key, on ? T.vol : 0, 0, 0);
  paintOn(T);
  if (byHand) log(`${T.name.toLowerCase()} ${on ? 'включён' : 'выключен'}`);
}
function setTrackPat(T, i, byHand) {
  if (seq.playing) {
    T.pendPat = i === T.pat ? null : i;
    paintGrid(T);
    return;
  }
  T.pat = T.shownPat = i;
  T.pendPat = null;
  paintGrid(T);
  if (byHand) log(`${T.name.toLowerCase()}: ${patLabel(T, i)}`);
}

function noteLen(T, p, s) {
  if (p.len) return p.len;
  for (let d = 1; d <= STEPS; d++) {
    const k = (s + d) % STEPS;
    for (let r = 0; r < T.rows.length; r++) if (p.cells.has(k + ':' + r)) return Math.min(d, 6);
  }
  return BEATS;
}
const onScreen = (t, fn) => seq.vis.push({ t, fn });

function applyOn(T, on, t, bar, tau) {
  if (on && !T.on) {
    T.on = true;
    T.live = true;
    engine.trackLevel(T.key, 0, t, 0);
    engine.trackLevel(T.key, T.vol, t, tau);
  } else if (!on && T.on) {
    T.on = false;
    T.fadeEnd = bar + 1;
    engine.trackLevel(T.key, 0, t, tau);
  }
}

function barStart(bar, t) {
  const scene = seq.scenario && bar % SCENE_BARS === 0 && bar < TOTAL_BARS ? SCENARIO[bar / SCENE_BARS] : null;
  TRACKS.forEach(T => {
    if (scene) {
      const want = scene.play[T.key];
      T.pendOn = null;
      T.pendPat = null;
      if (want) T.pat = want - 1;
      applyOn(T, !!want, t, bar, bar === 0 ? 0.05 : FADE);
    } else {
      if (T.pendPat !== null) {
        const name = patLabel(T, T.pendPat);
        T.pat = T.pendPat;
        T.pendPat = null;
        onScreen(t, () => log(`${T.name.toLowerCase()}: ${name}`));
      }
      if (T.pendOn !== null) {
        const on = T.pendOn;
        T.pendOn = null;
        applyOn(T, on, t, bar, FADE);
        onScreen(t, () => log(`${T.name.toLowerCase()} ${on ? 'включён' : 'выключен'}`));
      }
    }
    if (!T.on && T.live && bar >= T.fadeEnd) T.live = false;
  });
  const snap = TRACKS.map(T => [T.pat, T.on]);
  onScreen(t, () => {
    TRACKS.forEach((T, k) => { T.shownPat = snap[k][0]; T.shownOn = snap[k][1]; paintGrid(T); });
    if (scene) log('часть: ' + scene.name);
  });
  if (seq.scenario && bar === SCENE_BARS * (SCENARIO.length - 1)) seq.dive = !seq.diveOff;
}

function stepAt(abs, t) {
  const s = abs % STEPS, beat = beatSec();
  if (s % BEATS === 0) barStart(Math.floor(abs / BEATS), t);
  const hits = [];
  let any = false;
  TRACKS.forEach(T => {
    if (!T.live) return;
    const p = T.patterns[T.pat];
    for (let r = 0; r < T.rows.length; r++) {
      if (!p.cells.has(s + ':' + r)) continue;
      const vel = s % BEATS === 0 ? 1 : 0.8;
      any = true;
      if (!T.voice) engine.drop(T.rows[r], t, vel);
      else {
        const v = engine.noteOn(T.rows[r], T.voice, t, { track: T.key, vel: T.key === 'box' ? 0.95 : vel });
        engine.noteOff(v, t + noteLen(T, p, s) * beat * 0.94);
        hits.push(T.key === 'box' ? T.rows[r] + 100 : T.rows[r]);
      }
    }
  });
  onScreen(t, () => {
    seq.visAbs = abs;
    seq.visT = t;
    showStep(abs);
    if (hits.length) showNote(Math.max(...hits) % 100);
    if (any) bubble();
  });
}

function coda(t) {
  const beat = beatSec(), end = t + beat * 6;
  TRACKS.forEach(T => { T.live = false; });
  engine.trackLevel('glass', TRACKS[0].vol, t, 0.05);
  engine.trackLevel('eel', TRACKS[2].vol, t, 0.05);
  engine.trackLevel('box', TRACKS[1].vol, t, 0.05);
  CHORD_NOTES[0].forEach(n => engine.noteOff(engine.noteOn(n, 'glass', t, { track: 'glass', vel: 0.9 }), end));
  engine.noteOff(engine.noteOn(33, 'eel', t, { track: 'eel' }), t + beat * 3);
  engine.noteOff(engine.noteOn(81, 'box', t, { track: 'box', vel: 0.8 }), end);
  onScreen(t, () => {
    showChord(0, TOTAL_BARS);
    showNote(81);
    log('сеанс окончен. вам уже лучше');
  });
  seq.ending = true;
  setTimeout(finish, Math.max(0, (end - engine.ctx.currentTime) * 1000) + 1800, seq.token);
}
function finish(token) {
  if (token !== seq.token || !seq.playing) return;
  seq.playing = false;
  seq.finished = true;
  clearInterval(seq.timer);
  showStopped();
}

function schedule() {
  if (!seq.playing || seq.ending) return;
  const ahead = document.hidden ? 1.5 : 0.12;
  while (seq.next < engine.ctx.currentTime + ahead) {
    if (seq.scenario && seq.abs >= TOTAL_BARS * BEATS) { coda(seq.next); return; }
    stepAt(seq.abs, seq.next);
    seq.abs++;
    seq.next += beatSec();
  }
}

function startSeq(fromTop) {
  if (!startAudio()) return;
  if (seq.playing) return;
  if (fromTop || seq.finished) {
    seq.abs = 0;
    if (seq.finished || seq.dive) setImmersion(seq.baseImm);
    seq.baseImm = state.immersion;
  } else seq.abs -= seq.abs % BEATS;
  seq.finished = false;
  seq.ending = false;
  seq.dive = false;
  seq.diveOff = false;
  seq.token++;
  seq.vis.length = 0;
  const bar = Math.floor(seq.abs / BEATS);
  const scene = seq.scenario ? SCENARIO[Math.min(SCENARIO.length - 1, Math.floor(bar / SCENE_BARS))] : null;
  TRACKS.forEach(T => {
    engine.killTrack(T.key);
    if (T.pendPat !== null) T.pat = T.pendPat;
    if (T.pendOn !== null) T.on = T.pendOn;
    if (scene) {
      const want = scene.play[T.key];
      T.on = !!want;
      if (want) T.pat = want - 1;
    }
    T.pendPat = T.pendOn = null;
    T.live = T.on;
    T.fadeEnd = 0;
    T.shownPat = T.pat;
    T.shownOn = T.on;
    engine.trackLevel(T.key, T.on ? T.vol : 0, 0, 0);
    paintGrid(T);
  });
  if (scene && bar >= SCENE_BARS * (SCENARIO.length - 1)) seq.dive = true;
  lastCol = -1;
  const msg = seq.abs ? 'сеанс продолжается' : 'сеанс «Тихий час» начат';
  seq.playing = true;
  seq.next = engine.ctx.currentTime + 0.08;
  schedule();
  clearInterval(seq.timer);
  seq.timer = setInterval(schedule, 25);
  ui.play.setAttribute('aria-pressed', 'true');
  ui.play.textContent = '■ СТОП';
  log(msg);
}

function stopSeq(silent, hard) {
  if (!seq.playing) return;
  seq.playing = false;
  seq.ending = false;
  seq.token++;
  clearInterval(seq.timer);
  seq.vis.length = 0;
  if (seq.abs > 0) seq.abs = Math.max(0, seq.visAbs);
  const now = engine.ctx.currentTime, token = seq.token;
  TRACKS.forEach(T => engine.trackLevel(T.key, 0, now, 0.05));
  if (hard) TRACKS.forEach(T => engine.killTrack(T.key));
  setTimeout(() => {
    if (token !== seq.token) return;
    TRACKS.forEach(T => { engine.killTrack(T.key); engine.trackLevel(T.key, T.on ? T.vol : 0, 0, 0); T.live = false; });
  }, 320);
  TRACKS.forEach(T => {
    if (T.pendOn !== null) { T.on = T.pendOn; T.pendOn = null; }
    if (T.pendPat !== null) { T.pat = T.pendPat; T.pendPat = null; }
    T.shownPat = T.pat;
    T.shownOn = T.on;
    paintGrid(T);
  });
  showStopped();
  if (!silent) log('сеанс на паузе');
}

function showStopped() {
  ui.play.setAttribute('aria-pressed', 'false');
  ui.play.textContent = '▶ СТАРТ';
  TRACKS.forEach(T => T.grid.querySelectorAll('.now').forEach(c => c.classList.remove('now')));
  lastCol = -1;
  setHint(null);
  if (seq.finished) {
    ui.pPart.textContent = 'СЕАНС ОКОНЧЕН';
    ui.pProg.style.width = '100%';
  }
}

let lastCol = -1;
function showStep(abs) {
  const s = abs % STEPS, bar = Math.floor(abs / BEATS);
  if (s !== lastCol) {
    TRACKS.forEach(T => T.cells.forEach(row => {
      if (lastCol >= 0) row[lastCol].classList.remove('now');
      row[s].classList.add('now');
    }));
    lastCol = s;
  }
  if (s % BEATS === 0) showChord(bar % LOOP_BARS, bar);
}
function showChord(i, bar) {
  const name = PROGRESSION[i];
  ui.pChord.textContent = name;
  if (seq.scenario) {
    const scene = SCENARIO[Math.min(SCENARIO.length - 1, Math.floor(bar / SCENE_BARS))];
    ui.pPart.textContent = 'ЧАСТЬ: ' + scene.name.toUpperCase();
    ui.pBar.textContent = `ТАКТ ${Math.min(bar + 1, TOTAL_BARS)}/${TOTAL_BARS}`;
    ui.pProg.style.width = (Math.min(bar + 1, TOTAL_BARS) / TOTAL_BARS * 100) + '%';
  } else {
    ui.pPart.textContent = 'СВОБОДНО';
    ui.pBar.textContent = `ТАКТ ${i + 1}/${LOOP_BARS}`;
    ui.pProg.style.width = ((i + 1) / LOOP_BARS * 100) + '%';
  }
  setHint(name);
}
function setHint(name) {
  seq.hint = name ? CHORD_PCS[name] : null;
  keyEls.forEach((el, n) => paintKey(n));
}

function seqFrame() {
  if (!engine) return;
  const now = engine.ctx.currentTime;
  while (seq.vis.length && seq.vis[0].t <= now) seq.vis.shift().fn();
  if (seq.playing && seq.dive && !seq.diveOff) {
    const pos = seq.visAbs + (now - seq.visT) / beatSec() - SCENE_BARS * BEATS * (SCENARIO.length - 1);
    const k = clamp(pos / (SCENE_BARS * BEATS), 0, 1);
    const target = seq.baseImm + (Math.max(seq.baseImm, 0.78) - seq.baseImm) * k;
    if (Math.abs(target - state.immersion) > 0.004) setImmersion(target);
  }
}

Object.assign(ui, {
  play: $('#play'), again: $('#again'), tempo: $('#tempo'), tempoOut: $('#tempoOut'), scen: $('#scenario'),
  pPart: $('#pPart'), pBar: $('#pBar'), pChord: $('#pChord'), pProg: $('#pProg'),
});
ui.play.addEventListener('click', () => { if (seq.playing) stopSeq(); else startSeq(false); });
ui.again.addEventListener('click', () => { stopSeq(true, true); startSeq(true); });
ui.tempo.addEventListener('input', () => { seq.bpm = +ui.tempo.value; ui.tempoOut.textContent = seq.bpm; });
ui.tempo.addEventListener('change', () => log(`скорость ${seq.bpm} ударов в минуту`));
ui.scen.addEventListener('change', () => {
  seq.scenario = ui.scen.checked;
  if (!seq.scenario) { seq.dive = false; seq.abs %= STEPS; } else seq.abs %= STEPS;
  log(seq.scenario ? 'по сценарию: 4 части, 32 такта' : 'свободно: куплет по кругу');
});
ui.tube.addEventListener('pointerdown', () => { if (seq.dive) seq.diveOff = true; });
$('#dlgOk').addEventListener('click', () => startSeq(true));
window.addEventListener('keydown', e => {
  if (e.code !== 'Space' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target.closest && e.target.closest('button, input[type=checkbox], .tube')) return;
  e.preventDefault();
  if (seq.playing) stopSeq(); else startSeq(false);
});
