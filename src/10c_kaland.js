// ============================================================
//  KALAND: Próbakövek, Kihívás-létra és vég nélküli nehézség
//  „Ne add fel. Megéri.” – mindig van egy következő lépcső.
// ============================================================

// ---------------- nehézség: Normál, Rémálom, Pokol, majd Ciklusok a végtelenig ----------------
const diffLevel = i => i <= 2 ? [0, 30, 55][i] : 55 + 18 * (i - 2);
const diffName = i => i <= 2 ? DIFFS[i] : `${i - 2}. Ciklus`;

// ---------------- Próbakő: önként vállalt, nehezebb harc jobb jutalomért ----------------
const Proba = {
  make(x, y, rng) {
    return { type: 'proba', x, y, r: 16, label: 'Próbakő – érintsd meg, ha mered', inter: (o) => this.start(o) };
  },
  start(o) {
    if (o.active || o.done) return;
    o.active = true; o.wave = 0; o.inter = null; o.label = 'Próba folyamatban…';
    UI.toast('⚔ Próba! Három hullám jön, mindegyik erősebb. A végén díszes láda és útinapló vár.', '#ffb347', 4); Audio2.play('bossroar');
    this.next(o);
  },
  next(o) {
    const m = G.map, R = REGION[m.region] || REGION.raktar, L = m.lvl + 1 + o.wave; o.wave++; o.mobs = [];
    const n = 3 + o.wave * 2, mods = Object.keys(ELITE_MODS);
    for (let i = 0; i < n; i++) {
      const a = i / n * 6.283, x = o.x + Math.cos(a) * 150, y = o.y + Math.sin(a) * 150; if (solidAt(m, x, y)) continue;
      const opt = o.wave === 3 && i === 0 ? { champion: true, mods: [RNG.pick(mods), RNG.pick(mods)] } : o.wave >= 2 && i < 2 ? { elite: true, mods: [RNG.pick(mods)] } : {};
      const e = G.spawnEnemy(RNG.pick(R.enemies), x, y, L, opt); e.state = 'chase'; e.proba = o; o.mobs.push(e);
      G.burst(x, y, '#ffb347', 10, 120);
    }
    G.fxRing(o.x, o.y, 170, '#ffb347', 0.6, 5); G.text(o.x, o.y - 30, `${o.wave}. hullám`, '#ffb347', 16, { life: 1.4 });
  },
  tick() {
    const m = G.map; if (!m) return;
    for (const o of m.objs) {
      if (o.type !== 'proba' || !o.active) continue;
      if (G.P.dead) continue;
      if (o.mobs.every(e => e.dead)) {
        if (o.wave < 3) this.next(o);
        else this.finish(o);
      }
    }
  },
  finish(o) {
    const S = G.S; o.active = false; o.done = true; o.label = 'Teljesített próba';
    S.stats.probak = (S.stats.probak || 0) + 1;
    const c = G.makeChest(o.x, o.y + 40, true); c.label = 'A próba ládája'; c.proba = true; G.map.objs.push(c);
    const bonus = Math.round(xpNeed(S.lvl) * 0.06); Exped.st().bank += bonus;
    if (RNG() < 0.15) { const pool = RELICS.filter(r => r.minL <= G.map.lvl + 2); if (pool.length) G.spawnPickup(o.x, o.y, 'item', 0, genItem(G.map.lvl, RNG, { relic: RNG.pick(pool).id })); }
    UI.toast(`✔ Próba teljesítve! Díszes láda, +${fmt(bonus)} TP az útinaplóba.`, '#ffd34d', 4); Audio2.play('legend'); G.emit('proba');
  },
};

// ---------------- Kihívás-létra: minden lépcső után jön a következő ----------------
const LADDER = {
  mely: { nev: n => `Juss le ${n} szintet egyhuzamban a Kaputól (és érj haza)`, goal: t => 3 + t, have: S => (S.exp && S.exp.bestHome) || 0 },
  proba: { nev: n => `Teljesíts összesen ${n} próbát`, goal: t => [1, 3, 6, 10, 15][t] || 15 + (t - 4) * 6, have: S => S.stats.probak || 0 },
  elit: { nev: n => `Győzz le összesen ${n} elit, bajnok vagy névvel bíró ellenfelet`, goal: t => Math.round(25 * Math.pow(1.8, t)), have: S => S.stats.elites || 0 },
  os: { nev: n => `Dönts le ${n} különböző Őst`, goal: t => t + 1, have: S => Object.keys(S.prog.ancients || {}).length, max: 7 },
  hasadek: { nev: n => `Érd el a Végtelen Hasadék ${n}. mélységét`, goal: t => 5 * (t + 1), have: S => S.prog.hasadek || 0, req: S => S.prog.bosses.szingularitas },
  ciklus: { nev: n => `Győzd le a Szingularitást ${diffName(n)} nehézségen`, goal: t => t + 1, have: S => S.prog.diffMax - 1, req: S => S.prog.bosses.szingularitas },
};
const Ladder = {
  st() { const S = G.S; S.ladder = S.ladder || {}; return S.ladder; },
  rows() {
    const S = G.S, L = this.st(), out = [];
    for (const k in LADDER) {
      const D = LADDER[k]; if (D.req && !D.req(S)) continue; const t = L[k] || 0; if (D.max && t >= D.max) continue;
      const goal = D.goal(t), have = D.have(S);
      out.push({ k, t, goal, have, nev: D.nev(goal), ok: have >= goal, rw: this.reward(t) });
    }
    return out;
  },
  reward(t) { const S = G.S; return { gold: Math.round((60 + S.lvl * 25) * (1 + t * 0.5)), szilank: 4 + t * 3, xp: Math.round(xpNeed(S.lvl) * 0.12), relic: t % 3 === 2 }; },
  claim(k) {
    const S = G.S, r = this.rows().find(x => x.k === k); if (!r || !r.ok) return;
    this.st()[k] = r.t + 1; const w = r.rw; S.gold += w.gold; S.mats.szilank = (S.mats.szilank || 0) + w.szilank; G.gainXp(w.xp);
    if (w.relic) { const pool = RELICS.filter(x => x.minL <= S.lvl + 3); const it = genItem(Math.max(S.lvl, 1), RNG, { relic: RNG.pick(pool).id }); (S.inv.length < INV_MAX ? S.inv : S.stash).push(it); UI.toast(`Ereklye a létráról: ${it.nev}`, RARITY[4].c, 4); }
    Audio2.play('legend'); UI.toast(`🪜 Lépcső teljesítve: +${fmt(w.gold)} arany, +${w.szilank} szilánk, +${fmt(w.xp)} TP. Jön a következő…`, '#ffd34d', 4);
  },
  html() {
    const rows = this.rows();
    return `<div class="h" style="margin-top:10px">Kihívás-létra <span class="small">– mindig van következő lépcső</span></div>` + rows.map(r => `<div class="row"><span class="small">${r.ok ? '✔' : '·'} ${r.t + 1}. lépcső: ${r.nev} <span style="color:var(--dim)">(${Math.min(r.have, r.goal)}/${r.goal})</span><br><span style="color:var(--dim)">Jutalom: ${fmt(r.rw.gold)} arany, ${r.rw.szilank} szilánk, ${fmt(r.rw.xp)} TP${r.rw.relic ? ', ereklye' : ''}</span></span>${r.ok ? `<button class="sm pri" data-a="ladder" data-k="${r.k}">Átveszem</button>` : ''}</div>`).join('');
  },
};
