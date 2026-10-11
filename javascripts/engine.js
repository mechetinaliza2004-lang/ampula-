'use strict';

const VOICES = {
  glass: {
    name: 'Стекло', latin: 'AQUA',
    shift: 0,
    oscs: [
      { type: 'sine', ratio: 1, gain: 0.55 },
      { type: 'sine', ratio: 2, gain: 0.16, detune: 5 },
      { type: 'triangle', ratio: 3, gain: 0.05, detune: -4 },
    ],
    attack: 0.25, decay: 0.9, sustain: 0.7, release: 1.6,
    cutoff: 7000, q: 0,
    vibrato: 7,
  },
  box: {
    name: 'Шкатулка', latin: 'LULLABIA',
    shift: 12,
    oscs: [{ type: 'sine', ratio: 1, gain: 0.6 }],
    fm: { ratio: 3.5, index: 2.4, decay: 0.12 },
    attack: 0.002, decay: 1.5, sustain: 0, release: 0.6,
    cutoff: 9000, q: 0,
    wear: 7,
  },
  eel: {
    name: 'Угорь', latin: 'ANGUILLA',
    shift: -24,
    oscs: [
      { type: 'sawtooth', ratio: 1, gain: 0.42 },
      { type: 'square', ratio: 0.5, gain: 0.28 },
    ],
    attack: 0.03, decay: 0.5, sustain: 0.65, release: 0.3,
    cutoff: 380, q: 7,
    filterEnv: 2.2,
    slide: -2,
  },
};
const VOICE_ORDER = ['glass', 'box', 'eel'];

const MAX_NOTES = 12;
const NOTE_PEAK = 0.3;
const midiHz = n => 440 * Math.pow(2, (n - 69) / 12);

function makeCorridor(ctx, seconds) {
  const rate = ctx.sampleRate, len = Math.round(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let y = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      y += (Math.random() * 2 - 1 - y) * (0.8 - 0.55 * t);
      d[i] = y * Math.exp(-6.9 * t);
    }
    for (const ms of [11, 23, 37, 53, 71]) {
      d[Math.round(rate * (ms + ch * 3) / 1000)] += (ch ? -0.5 : 0.5) * (1 - ms / 90);
    }
  }
  return buf;
}

function createEngine(ctx) {
  const voices = new Set();
  const bus = ctx.createGain();
  const water = ctx.createBiquadFilter();
  const verbSend = ctx.createGain(), verb = ctx.createConvolver(), verbOut = ctx.createGain();
  const dose = ctx.createGain();
  const limiter = ctx.createDynamicsCompressor();
  const analyser = ctx.createAnalyser();
  const wobble = ctx.createOscillator(), wobbleDepth = ctx.createGain();

  bus.connect(water);
  water.connect(dose);
  water.connect(verbSend); verbSend.connect(verb); verb.connect(verbOut); verbOut.connect(dose);
  dose.connect(limiter); limiter.connect(analyser); analyser.connect(ctx.destination);
  wobble.connect(wobbleDepth);

  water.type = 'lowpass';
  verb.buffer = makeCorridor(ctx, 3.2);
  limiter.threshold.value = -4; limiter.knee.value = 0; limiter.ratio.value = 20;
  limiter.attack.value = 0.002; limiter.release.value = 0.15;
  analyser.fftSize = 2048;
  wobble.type = 'sine';
  wobble.start();

  const eng = { ctx, analyser, voices };

  eng.set = ({ immersion: i, echo, dose: d }, instant) => {
    const now = ctx.currentTime;
    const to = (param, v) => instant ? param.setValueAtTime(v, now) : param.setTargetAtTime(v, now, 0.04);
    to(water.frequency, 16000 * Math.pow(320 / 16000, i));
    to(water.Q, -3 + i * 9);
    to(wobble.frequency, 0.3 + i * 0.5);
    to(wobbleDepth.gain, i * i * 32);
    to(verbOut.gain, echo * 0.9 + i * 0.35);
    to(dose.gain, d * d * 1.3);
  };

  function envStart(param, e) {
    param.setValueAtTime(0, e.t0);
    param.linearRampToValueAtTime(e.peak, e.t0 + e.attack);
    param.setTargetAtTime(e.peak * e.sustain, e.t0 + e.attack, e.decay / 4);
  }
  function envValue(e, t) {
    if (t <= e.t0) return 0;
    if (t < e.t0 + e.attack) return e.peak * (t - e.t0) / e.attack;
    const s = e.peak * e.sustain;
    return s + (e.peak - s) * Math.exp(-(t - e.t0 - e.attack) / (e.decay / 4));
  }
  function envRelease(param, e, t, release) {
    const v = envValue(e, t);
    if (t < e.t0 + e.attack) {
      param.cancelScheduledValues(e.t0);
      param.setValueAtTime(0, e.t0);
      param.linearRampToValueAtTime(v, t);
    } else {
      param.cancelScheduledValues(t);
      param.setValueAtTime(v, t);
    }
    param.setTargetAtTime(0, t, release / 5);
    return v;
  }

  const stopAt = (v, t) => v.sources.forEach(s => { try { s.stop(t); } catch (err) {} });

  function cleanup(v) {
    if (!voices.has(v)) return;
    voices.delete(v);
    v.oscs.forEach(o => { try { wobbleDepth.disconnect(o.detune); } catch (err) {} });
    v.nodes.forEach(n => n.disconnect());
  }

  function kill(v) {
    const now = ctx.currentTime + 0.003, g = v.amp.gain;
    let cur = 0;
    if (v.t0 <= now) cur = v.rel && now >= v.rel.t ? v.rel.v0 * Math.exp(-(now - v.rel.t) / v.rel.tau) : envValue(v.env, now);
    g.cancelScheduledValues(0);
    g.setValueAtTime(cur, now);
    g.linearRampToValueAtTime(0, now + 0.02);
    if (!v.rel) v.rel = { t: now, v0: 0, tau: 0.01 };
    v.killed = true;
    v.end = Math.max(now + 0.03, v.t0 + 0.01);
    stopAt(v, v.end);
  }
  eng.killAll = () => voices.forEach(v => { if (!v.killed) kill(v); });

  function makeRoom() {
    const live = [...voices].filter(v => !v.killed);
    if (live.length < MAX_NOTES) return;
    live.sort((a, b) => (!!b.rel - !!a.rel) || (a.t0 - b.t0));
    kill(live[0]);
  }

  eng.noteOn = (note, voiceKey, when) => {
    const V = VOICES[voiceKey];
    const t = Math.max(when || 0, ctx.currentTime + 0.003);
    makeRoom();
    const f = midiHz(note);
    const filter = ctx.createBiquadFilter(), amp = ctx.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = V.cutoff;
    filter.Q.value = V.q;
    amp.gain.value = 0;
    filter.connect(amp); amp.connect(bus);
    const nodes = [filter, amp], sources = [];
    const wear = V.wear ? (Math.random() * 2 - 1) * V.wear : 0;

    const oscs = V.oscs.map(o => {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = o.type;
      osc.frequency.value = f * o.ratio;
      const base = (o.detune || 0) + wear;
      if (V.slide) {
        osc.detune.setValueAtTime(base + V.slide * 100, t);
        osc.detune.setTargetAtTime(base, t, 0.04);
      } else osc.detune.value = base;
      g.gain.value = o.gain;
      osc.connect(g); g.connect(filter);
      wobbleDepth.connect(osc.detune);
      nodes.push(osc, g); sources.push(osc);
      return osc;
    });

    if (V.fm) {
      const mod = ctx.createOscillator(), depth = ctx.createGain();
      mod.frequency.value = f * V.fm.ratio;
      const dev = V.fm.index * f * V.fm.ratio * Math.min(1, 700 / f);
      depth.gain.setValueAtTime(dev, t);
      depth.gain.setTargetAtTime(dev * 0.04, t, V.fm.decay);
      mod.connect(depth);
      oscs.forEach(o => depth.connect(o.frequency));
      nodes.push(mod, depth); sources.push(mod);
    }
    if (V.vibrato) {
      const lfo = ctx.createOscillator(), depth = ctx.createGain();
      lfo.frequency.value = 4.6 + Math.random() * 0.6;
      depth.gain.value = V.vibrato;
      lfo.connect(depth);
      oscs.forEach(o => depth.connect(o.detune));
      nodes.push(lfo, depth); sources.push(lfo);
    }
    if (V.filterEnv) {
      filter.detune.setValueAtTime(V.filterEnv * 1200, t);
      filter.detune.setTargetAtTime(0, t, 0.12);
    }

    const env = { t0: t, attack: V.attack, decay: V.decay, sustain: V.sustain, peak: NOTE_PEAK };
    envStart(amp.gain, env);
    sources.forEach(s => s.start(t));
    const v = { note, voiceKey, oscs, sources, nodes, amp, env, t0: t, rel: null, end: Infinity, killed: false };
    oscs[0].onended = () => cleanup(v);
    voices.add(v);
    return v;
  };

  eng.noteOff = (v, when) => {
    if (!v || v.rel) return;
    const t = Math.max(when || 0, ctx.currentTime + 0.003);
    const R = VOICES[v.voiceKey].release;
    const v0 = envRelease(v.amp.gain, v.env, t, R);
    v.rel = { t, v0, tau: R / 5 };
    v.amp.gain.setValueAtTime(v0 * Math.exp(-5), t + R);
    v.amp.gain.linearRampToValueAtTime(0, t + R + 0.015);
    v.end = t + R + 0.02;
    stopAt(v, v.end);
  };

  eng.activeCount = () => {
    const now = ctx.currentTime;
    let n = 0;
    for (const v of voices) {
      if (v.end < now - 0.5) { cleanup(v); continue; }
      if (v.t0 <= now && v.end > now) n++;
    }
    return n;
  };

  return eng;
}
