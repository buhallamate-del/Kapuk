// ============================================================
//  ÉRINTŐKÉPERNYŐ: két virtuális joystick, képességgombok, helyzetfüggő „E”
//  Bal fél: mozgás (teljesen kitolva sprint). Jobb fél: célzás + folyamatos támadás.
//  Ha nem célzol, a képességek a legközelebbi ellenfélre mennek (automatikus célzás).
// ============================================================
const Touch = {
  on: false, mv: { x: 0, y: 0 }, aimA: null, aimOn: false, sticks: {}, lastAim: 0, tapItem: null,
  detect() { return ('ontouchstart' in window || navigator.maxTouchPoints > 0) && matchMedia('(pointer: coarse)').matches; },
  init() {
    if (!this.detect()) return;
    this.on = true; document.body.classList.add('touch');
    const root = document.createElement('div'); root.id = 'touch'; document.body.appendChild(root); this.root = root;
    root.innerHTML = `
      <div class="tz" id="tzL"></div><div class="tz" id="tzR"></div>
      <div class="stick" id="stL"><div class="knob"></div></div><div class="stick" id="stR"><div class="knob"></div></div>
      <div id="tbtns">
        ${[0, 1, 2, 3, 4].map(i => `<div class="tb sk" data-t="slot" data-i="${i}"><span class="ic"></span><div class="cd"></div></div>`).join('')}
        <div class="tb sk gate" data-t="gate"><span class="ic"></span><div class="cd"></div></div>
        <div class="tb pot" data-t="pot">❤<span class="n"></span></div>
        <div class="tb dodge" data-t="dodge">⤴</div>
      </div>
      <div class="tb use" id="tUse" data-t="use">E</div>
      <div id="ttop">
        <div class="tb sm" data-t="key" data-k="Escape">☰</div><div class="tb sm" data-t="key" data-k="i">🎒</div><div class="tb sm" data-t="key" data-k="k">✨</div>
        <div class="tb sm" data-t="key" data-k="c">👤</div><div class="tb sm" data-t="key" data-k="j">📜</div><div class="tb sm" data-t="key" data-k="m">🗺</div><div class="tb sm" data-t="more">⋯</div>
      </div>
      <div id="tmore">
        <div class="tb sm" data-t="key" data-k="h" title="Evés">🍖</div><div class="tb sm" data-t="key" data-k="g" title="Ivás">💧</div><div class="tb sm" data-t="key" data-k="n" title="Sátor">⛺</div>
        <div class="tb sm" data-t="key" data-k="t" title="Kapu haza">🌀</div><div class="tb sm" data-t="key" data-k="b" title="Artefaktum">◇</div>
        ${Object.keys(ELIX).map(k => `<div class="tb sm" data-t="key" data-k="${ELIX[k].key}" style="color:${ELIX[k].c}">⚗</div>`).join('')}
        <div class="tb sm" data-t="key" data-k="u" title="Építés (otthon)">🔨</div><div class="tb sm" data-t="wz" data-d="-1">W−</div><div class="tb sm" data-t="wz" data-d="1">W+</div>
      </div>`;
    // gombok
    root.querySelectorAll('.tb').forEach(b => b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); Audio2.unlock(); this.press(b); }, { passive: false }));
    // joystickok
    for (const side of ['L', 'R']) {
      const z = root.querySelector('#tz' + side);
      z.addEventListener('touchstart', e => { e.preventDefault(); Audio2.unlock(); const t = e.changedTouches[0]; this.stickStart(side, t); }, { passive: false });
    }
    addEventListener('touchmove', e => { for (const t of e.changedTouches) this.stickMove(t); }, { passive: true });
    const end = e => { for (const t of e.changedTouches) this.stickEnd(t); };
    addEventListener('touchend', end); addEventListener('touchcancel', end);
    // tárgyak és panelek: koppintás = megnézés, második koppintás = művelet, hosszú nyomás = jobb klikk
    document.addEventListener('touchstart', e => { const el = e.target.closest('[data-r]'); if (!el) return; clearTimeout(this.lpT); this.lpEl = el; this.lpT = setTimeout(() => { this.lpDone = true; UI.act(el.dataset.r, el.dataset, e); if (navigator.vibrate) navigator.vibrate(20); }, 520); }, { passive: true });
    document.addEventListener('touchend', () => clearTimeout(this.lpT), { passive: true });
    document.addEventListener('click', e => {
      if (this.lpDone) { this.lpDone = false; e.stopPropagation(); e.preventDefault(); return; }
      const el = e.target.closest('[data-tt="item"]'); if (!el || !el.dataset.a) return;
      const key = el.dataset.src + ':' + el.dataset.i;
      if (this.tapItem !== key) { this.tapItem = key; e.stopPropagation(); e.preventDefault(); UI.showTT('item', el.dataset); const tt = $('#tt'); tt.style.left = '8px'; tt.style.top = '8px'; return; }
      this.tapItem = null; $('#tt').style.display = 'none';
    }, true);
    if (innerHeight > innerWidth) setTimeout(() => UI.toast && UI.toast('Tipp: fektetve kényelmesebb. Bal hüvelyk: mozgás, jobb: célzás és támadás.', '#e6c47a', 6), 1500);
  },
  stickStart(side, t) {
    if (Home.build && G.map && G.map.region === 'otthon') { this.buildTap(t); return; }
    const s = this.sticks[side] = { id: t.identifier, x0: t.clientX, y0: t.clientY, dx: 0, dy: 0, t0: performance.now() };
    const el = this.root.querySelector('#st' + side); el.style.display = 'block'; el.style.left = (s.x0 - 55) + 'px'; el.style.top = (s.y0 - 55) + 'px'; el.firstElementChild.style.transform = '';
  },
  stickMove(t) {
    for (const side in this.sticks) {
      const s = this.sticks[side]; if (!s || s.id !== t.identifier) continue;
      let dx = t.clientX - s.x0, dy = t.clientY - s.y0; const d = Math.hypot(dx, dy), M = 50; if (d > M) { dx *= M / d; dy *= M / d; }
      s.dx = dx / M; s.dy = dy / M; this.root.querySelector('#st' + side).firstElementChild.style.transform = `translate(${dx}px,${dy}px)`;
    }
  },
  stickEnd(t) {
    for (const side in this.sticks) {
      const s = this.sticks[side]; if (!s || s.id !== t.identifier) continue;
      // jobb oldali rövid koppintás: egy támadás a legközelebbi ellenfélre
      if (side === 'R' && performance.now() - s.t0 < 220 && Math.hypot(s.dx, s.dy) < 0.3) this.tapAttack = 2;
      this.sticks[side] = null; this.root.querySelector('#st' + side).style.display = 'none';
    }
  },
  buildTap(t) { const c = $('#c'), r = c.getBoundingClientRect(); Input.mx = (t.clientX - r.left) * (c.width / r.width); Input.my = (t.clientY - r.top) * (c.height / r.height); Input.mclick[0] = true; },
  // a legközelebbi látható ellenfél (automatikus célzás)
  autoTarget() { const P = G.P; if (!P || !G.map) return null; return G.nearestEnemy(P.x, P.y, 520, true); },
  setAimWorld(wx, wy) { Input.wx = wx; Input.wy = wy; Input.mx = (wx - G.cam.x + G.W / 2) * G.zoom; Input.my = (wy - G.cam.y + G.H / 2) * G.zoom; },
  aimForCast() { const P = G.P; const e = !this.aimOn && this.autoTarget(); if (e) this.setAimWorld(e.x, e.y); else { const a = this.aimA != null ? this.aimA : P.aim; this.setAimWorld(P.x + Math.cos(a) * 220, P.y + Math.sin(a) * 220); } },
  press(b) {
    const t = b.dataset.t; if (!G.P || G.scene !== 'play') return;
    if (t === 'key') { const k = b.dataset.k; Input.pressed.add(k); if (k === 'Escape' || 'ikcjmu'.includes(k)) $('#tmore').classList.remove('on'); return; }
    if (t === 'more') { $('#tmore').classList.toggle('on'); return; }
    if (UI.open && UI.open !== 'build') return;
    if (t === 'slot') { this.aimForCast(); G.useSlot(+b.dataset.i); }
    else if (t === 'gate') { this.aimForCast(); G.useGate(); }
    else if (t === 'pot') G.drinkPotion();
    else if (t === 'dodge') Input.pressed.add(' ');
    else if (t === 'use') Input.pressed.add('e');
    else if (t === 'wz') { const P = G.P; if (G.map.mech === 'eh' && P.wCd <= 0) { Input.pressed.add(+b.dataset.d < 0 ? 'z' : 'x'); } }
  },
  // minden képkocka elején: a joystickokból billentyű- és egérállapot
  frame() {
    if (!this.on || G.scene !== 'play' || !G.P) return;
    const L = this.sticks.L, R = this.sticks.R, P = G.P; UI.overUI = false; // az érintés emulált egéreseményei ne tiltsák a támadást
    this.mv.x = L ? L.dx : 0; this.mv.y = L ? L.dy : 0;
    if (L && Math.hypot(L.dx, L.dy) > 0.95) Input.keys.add('Shift'); else Input.keys.delete('Shift');
    this.aimOn = !!(R && Math.hypot(R.dx, R.dy) > 0.3);
    if (this.aimOn) { this.aimA = Math.atan2(R.dy, R.dx); this.setAimWorld(P.x + Math.cos(this.aimA) * 220, P.y + Math.sin(this.aimA) * 220); Input.mdown[0] = true; }
    else {
      const e = this.autoTarget(); if (e) this.setAimWorld(e.x, e.y); else if (this.mv.x || this.mv.y) this.setAimWorld(P.x + this.mv.x * 200, P.y + this.mv.y * 200);
      Input.mdown[0] = this.tapAttack > 0; if (this.tapAttack > 0) this.tapAttack--;
    }
  },
  // gombok: ikon, töltődés, elérhetőség, az „E” csak akkor látszik, ha van mivel
  hud() {
    if (!this.on || !G.P || G.scene !== 'play') return; const P = G.P, S = G.S;
    this.root.style.display = UI.open && UI.open !== 'build' ? 'none' : '';
    const sk = this.root.querySelectorAll('.tb.sk');
    sk.forEach(b => {
      let id, cd = 0, mx = 1, ic = '·';
      if (b.dataset.t === 'slot') { id = S.slots[+b.dataset.i]; const s = id && G.skillById(id); if (s) { ic = s.ikon; cd = Math.max(0, P.cds[id] || 0); mx = (P.cdMax && P.cdMax[id]) || 1; } }
      else { id = S.gate; const g = id && GATESKILLS[id]; if (g) { ic = g.ikon; cd = Math.max(0, P.cds['g_' + id] || 0); mx = (P.cdMax && P.cdMax['g_' + id]) || 1; } }
      const k = ic + '|' + Math.ceil(cd * 4); if (b._k === k) return; b._k = k;
      b.querySelector('.ic').textContent = ic; b.style.opacity = id ? 1 : 0.35; b.querySelector('.cd').style.height = (cd > 0 ? cd / mx * 100 : 0) + '%';
    });
    this.root.querySelector('.pot .n').textContent = S.potions;
    const ni = G.nearInteract(), it = G.pickups.find(p => p.kind === 'item' && dist(p, P) < 50), use = $('#tUse');
    const lbl = it ? it.it.nev : ni ? (ni.label || '') : ''; use.style.display = lbl ? 'flex' : 'none'; if (use._l !== lbl) { use._l = lbl; use.innerHTML = `E<small>${esc(lbl).slice(0, 22)}</small>`; }
    const sb = this.root.querySelector('.dodge'); sb.style.opacity = P.sta >= DODGE_COST ? 1 : 0.4;
  },
};
