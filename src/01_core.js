'use strict';
// ============================================================
//  KAPUK – Multiverzum RPG · alapok (segédfüggvények, bemenet, hang)
// ============================================================
const VERZIO = '1.0';
const TILE = 32;
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const dist2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
const ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'e' : Math.round(n).toString();
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function makeRng(seed) {
  let s = (seed >>> 0) || 0x9E3779B9;
  const f = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  f.int = (a, b) => a + Math.floor(f() * (b - a + 1));
  f.pick = arr => arr[Math.floor(f() * arr.length)];
  f.chance = p => f() < p;
  f.range = (a, b) => a + f() * (b - a);
  return f;
}
let RNG = makeRng(Date.now() ^ 0x5bd1e995);
function weightedPick(list, rng = RNG, key = 'w') { let t = 0; for (const it of list) t += it[key]; let r = rng() * t; for (const it of list) { r -= it[key]; if (r <= 0) return it; } return list[list.length - 1]; }

// ---------------- bemenet ----------------
const Input = {
  keys: new Set(), pressed: new Set(), mx: 0, my: 0, mdown: [false, false, false], mclick: [false, false, false],
  wx: 0, wy: 0,
  init(canvas) {
    addEventListener('keydown', e => {
      if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (!this.keys.has(k)) this.pressed.add(k);
      this.keys.add(k);
      if ([' ', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    });
    addEventListener('keyup', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; this.keys.delete(k); });
    addEventListener('blur', () => { this.keys.clear(); this.mdown = [false, false, false]; });
    canvas.addEventListener('mousemove', e => { const r = canvas.getBoundingClientRect(); this.mx = (e.clientX - r.left) * (canvas.width / r.width); this.my = (e.clientY - r.top) * (canvas.height / r.height); });
    canvas.addEventListener('mousedown', e => { this.mdown[e.button] = true; this.mclick[e.button] = true; Audio2.unlock(); });
    addEventListener('mouseup', e => { this.mdown[e.button] = false; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  },
  hit(k) { return this.pressed.has(k); },
  endFrame() { this.pressed.clear(); this.mclick = [false, false, false]; }
};

// ---------------- hang (szintetizált) ----------------
const Audio2 = {
  ctx: null, master: null, vol: 0.5, muted: false, last: {},
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : this.vol; this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate; this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
  },
  setVol(v) { this.vol = v; if (this.master) this.master.gain.value = this.muted ? 0 : v; },
  tone(f, dur, type = 'square', g = 0.15, slide = 0, delay = 0) {
    if (!this.ctx) return; const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), gn = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + dur);
    gn.gain.setValueAtTime(g, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn); gn.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  },
  noiseHit(dur, g = 0.2, freq = 1200, q = 1, delay = 0) {
    if (!this.ctx) return; const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource(); s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const gn = this.ctx.createGain(); gn.gain.setValueAtTime(g, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(gn); gn.connect(this.master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  play(name) {
    if (!this.ctx || this.muted) return;
    const now = performance.now(); if (this.last[name] && now - this.last[name] < 45) return; this.last[name] = now;
    switch (name) {
      case 'swing': this.noiseHit(0.12, 0.12, 2500, 0.8); break;
      case 'hit': this.noiseHit(0.08, 0.18, 900, 1.5); this.tone(140, 0.08, 'square', 0.05, -60); break;
      case 'shoot': this.noiseHit(0.07, 0.15, 3000, 0.7); this.tone(600, 0.06, 'square', 0.04, -400); break;
      case 'rifle': this.noiseHit(0.18, 0.25, 1500, 0.5); this.tone(220, 0.12, 'sawtooth', 0.06, -150); break;
      case 'magic': this.tone(520, 0.18, 'sine', 0.1, 400); this.tone(780, 0.14, 'triangle', 0.05, 300, 0.03); break;
      case 'fire': this.noiseHit(0.3, 0.18, 600, 0.6); this.tone(180, 0.25, 'sawtooth', 0.05, -80); break;
      case 'ice': this.tone(1400, 0.2, 'triangle', 0.07, -600); this.noiseHit(0.15, 0.08, 5000, 2); break;
      case 'zap': for (let i = 0; i < 3; i++) this.tone(900 + Math.random() * 900, 0.05, 'square', 0.05, -500, i * 0.03); break;
      case 'boom': this.noiseHit(0.6, 0.4, 300, 0.4); this.tone(80, 0.5, 'sine', 0.3, -50); break;
      case 'pickup': this.tone(880, 0.08, 'triangle', 0.08); this.tone(1320, 0.1, 'triangle', 0.07, 0, 0.06); break;
      case 'gold': this.tone(1600, 0.06, 'triangle', 0.05); this.tone(2100, 0.08, 'triangle', 0.04, 0, 0.04); break;
      case 'legend': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.08, 0, i * 0.09)); break;
      case 'level': [392, 494, 587, 784, 988].forEach((f, i) => this.tone(f, 0.3, 'square', 0.06, 0, i * 0.08)); break;
      case 'hurt': this.tone(200, 0.15, 'sawtooth', 0.12, -120); break;
      case 'die': this.tone(300, 0.9, 'sawtooth', 0.15, -260); break;
      case 'ui': this.tone(660, 0.05, 'square', 0.04); break;
      case 'door': this.tone(110, 0.4, 'sawtooth', 0.08, 60); this.noiseHit(0.3, 0.1, 400); break;
      case 'portal': this.tone(200, 0.8, 'sine', 0.12, 600); this.tone(300, 0.8, 'sine', 0.08, 900, 0.1); break;
      case 'dash': this.noiseHit(0.15, 0.12, 1800, 0.5); break;
      case 'potion': this.tone(400, 0.2, 'sine', 0.1, 500); this.tone(600, 0.2, 'sine', 0.06, 500, 0.08); break;
      case 'burp': { // Kurta tisztelgése – mély, rezgő hang
        if (!this.ctx) break; const t = this.ctx.currentTime; const o = this.ctx.createOscillator(), g = this.ctx.createGain(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(62, t + 0.7);
        lfo.frequency.value = 23; lg.gain.value = 30; lfo.connect(lg); lg.connect(o.frequency);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
        const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
        o.connect(f); f.connect(g); g.connect(this.master); o.start(t); lfo.start(t); o.stop(t + 0.85); lfo.stop(t + 0.85); break;
      }
      case 'morse': this.tone(700, 0.08, 'sine', 0.08); break;
      case 'bossroar': this.tone(70, 1.2, 'sawtooth', 0.2, 40); this.noiseHit(1.0, 0.2, 250, 0.5); break;
    }
  }
};
