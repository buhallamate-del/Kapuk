// ============================================================
//  VILÁG: pályák betöltése, benépesítése, játékos-irányítás, fő ciklus
// ============================================================
Object.assign(G, {
  start(S, slot) {
    this.S = S; this.slot = slot; this.P = makePlayer(S); this.scene = 'play';
    Univ.set('kp:jart'); Univ.checkGifts();
    if (!S.flags.intro) { S.flags.intro = 1; this.enterTown(); UI.intro(); } else this.enterTown();
    Quests.ensureStart();
  },
  clearWorld() { this.enemies = []; this.projs = []; this.allies = []; this.teles = []; this.grounds = []; this.pickups = []; this.parts = []; this.texts = []; this.timers = []; this.lobs = []; this.boss = null; this.gust = null; UI.bossBar(null); this.flashes = []; },
  setMap(m, pal) {
    this.map = m; this.pal = pal; this.staticLayer = renderStatic(m, pal);
    const P = this.P; P.x = m.start.x; P.y = m.start.y; P.dash = null; P.vx = P.vy = 0; P.kbx = P.kby = 0; P.history = []; P.w = 0; P.bulletTime = 0;
    this.cam.x = P.x; this.cam.y = P.y; this.fieldT = 0; flowField(m, Math.floor(P.x / TILE), Math.floor(P.y / TILE));
    UI.minimapDirty = true;
  },
  enterTown(fromDeath) {
    this.saveDungeon = null;
    this.clearWorld(); const m = genTown(); m.lvl = 1;
    Town.populate(m);
    for (const o of m.objs) { const tx = Math.floor(o.x / TILE), ty = Math.floor(o.y / TILE); for (let y = ty - 1; y <= ty + 1; y++) for (let x = tx - 1; x <= tx + 1; x++) if (m.t[y * m.w + x] === T_OBST && !(m.houses.some(h => x >= h[0] && x < h[0] + h[2] && y >= h[1] && y < h[1] + h[3])) && Math.hypot(x - 30, y - 25) > 8) m.t[y * m.w + x] = T_FLOOR; }
    this.setMap(m, { void: '#0d1a10', floor: '#56704a', floor2: '#627d52', wall: '#3b4a3a', obst: '#7a3b2e', speck: '#a6c48a', light: '#fff3d0' });
    if (this.retPortal) m.objs.push(this.makeReturnPortal());
    const P = this.P; if (fromDeath) { P.dead = false; P.hp = P.mhp; P.mp = CLASSES[this.S.cls].rage ? 0 : P.mmp; P.sta = P.msta; }
    UI.setRegion('Kapuváros', 'A világok közötti város'); this.autosave();
    Audio2.play('portal');
  },
  regionLvl(rid, floor) { const R = REGION[rid]; return R.lvl + (floor - 1) + this.diffLvl(); },
  enterDungeon(rid, floor) {
    const R = REGION[rid], S = this.S; this.clearWorld(); this.retPortal = null;
    const boss = floor === R.floors;
    const seed = hashStr(rid + ':' + floor + ':' + S.created + ':' + (S.stats.kills >> 4) + ':' + Date.now());
    const m = genDungeon(seed, R, floor, { boss });
    m.lvl = this.regionLvl(rid, floor); m.rid = rid;
    this.setMap(m, R.pal); this.populate(m, R, boss, makeRng(seed ^ 0xabc));
    S.prog.wp[rid] = Math.max(S.prog.wp[rid] || 1, floor);
    UI.setRegion(R.nev, `${floor}. szint${boss ? ' – a mélység ura' : ''} · ${m.lvl}. szintű ellenfelek${S.prog.diff ? ' · ' + DIFFS[S.prog.diff] : ''}`);
    if (floor === 1 && !S.flags['intro_' + rid]) { S.flags['intro_' + rid] = 1; UI.toast(R.intro, '#e8dcc0', 6); }
    this.emit('enter', { rid, floor }); this.autosave();
    Audio2.play('portal');
  },
  enterHasadek(n, weekly) {
    const S = this.S; this.clearWorld(); this.retPortal = null;
    const wk = Univ.week();
    const seed = weekly ? hashStr('hasadek:' + wk + ':' + n) : hashStr('h' + n + ':' + Date.now());
    const rng = makeRng(seed);
    const R0 = REGIONS[rng.int(0, REGIONS.length - 1)];
    const R = { ...R0, id: 'hasadek', mixRegion: R0.id, enemies: [...R0.enemies, ...REGIONS[rng.int(0, REGIONS.length - 1)].enemies.slice(0, 2)] };
    const boss = n % 5 === 0;
    const m = genDungeon(seed, R, n, { boss }); m.region = R0.id; m.mixRegion = R0.id; m.hasadek = n; m.weekly = weekly;
    m.lvl = 36 + Math.floor(n * 1.5) + this.diffLvl(); m.rid = R0.id;
    this.setMap(m, R0.pal); this.populate(m, { ...R, boss: RNG.pick(Object.keys(BOSSES).filter(b => b !== 'szingularitas')) }, boss, rng, true);
    if (weekly) { this.weeklyStart = this.weeklyStart || performance.now(); }
    UI.setRegion(`${weekly ? 'Heti ' : 'Végtelen '}Hasadék – ${n}. mélység`, `${R0.nev} visszhangja · ${m.lvl}. szint`);
    Audio2.play('portal');
  },

  // ---------- benépesítés ----------
  populate(m, R, boss, rng, hasadek) {
    const L = m.lvl, S = this.S;
    const packs = [];
    m.rooms.forEach(r => {
      if (r.start) return;
      if (r.boss) return;
      const area = r.w * r.h, n = Math.round(area / 30 * (0.8 + rng() * 0.5) * (1 + S.prog.diff * 0.15));
      const champ = rng() < 0.12, elite = !champ && rng() < 0.22;
      const types = R.enemies;
      const main = rng.pick(types), side = rng.pick(types);
      for (let i = 0; i < n; i++) {
        const p = roomSpot(m, r, rng);
        const t = i < n * 0.65 ? main : side;
        const o = {};
        if (champ && i === 0) { o.champion = true; o.mods = [rng.pick(Object.keys(ELITE_MODS)), rng.pick(Object.keys(ELITE_MODS))]; }
        else if (elite && i < 3) { o.elite = true; o.mods = [elite && i === 0 ? rng.pick(Object.keys(ELITE_MODS)) : (packs.lastMod || rng.pick(Object.keys(ELITE_MODS)))]; packs.lastMod = o.mods[0]; }
        this.spawnEnemy(t, p.x, p.y, L, o);
      }
      // ládák, hordók, szentélyek, gyűjtőhelyek
      if (rng() < 0.35) { const p = roomSpot(m, r, rng, 2); m.objs.push(this.makeChest(p.x, p.y, rng() < 0.15)); }
      const nb = rng.int(0, 3); for (let i = 0; i < nb; i++) { const p = roomSpot(m, r, rng, 1); m.objs.push({ type: 'barrel', x: p.x, y: p.y, r: 11, hp: 20 * monHp(L) * 0.3, boom: m.style === 'machine' || rng() < 0.12 }); }
      if (rng() < 0.08) { const p = roomSpot(m, r, rng, 2); m.objs.push(this.makeShrine(p.x, p.y, rng)); }
      if (rng() < 0.55) { const pool = REGION_NODES[hasadek ? 'hasadek' : m.region] || REGION_NODES.hasadek; const k = rng.pick(pool); const p = roomSpot(m, r, rng, 1); m.objs.push(this.makeNode(p.x, p.y, k)); }
      if (m.style === 'comb' && rng() < 0.3) { const p = roomSpot(m, r, rng, 2); m.objs.push({ type: 'hive', x: p.x, y: p.y, r: 16, hp: 60 * monHp(L) * 0.4, spawnT: 4 }); }
    });
    // kijárat
    const ex = m.exitRoom;
    if (!boss) { const p = { x: (ex.cx + 0.5) * TILE, y: (ex.cy + 0.5) * TILE }; m.objs.push(this.makeExit(p.x, p.y, R, hasadek)); }
    // boss
    if (boss) {
      const br = m.rooms.find(r => r.boss);
      const bid = hasadek ? R.boss : (R.id === 'eh' && this.S.prog.bosses.onmagad ? 'szingularitas' : R.boss);
      const D = BOSSES[bid];
      const e = this.spawnEnemy(bid, (br.cx + 0.5) * TILE, (br.cy + 0.5) * TILE, L + 2, { boss: true, bossDef: D, r: D.r });
      e.bossId = bid; this.boss = e; e.state = 'idle';
      if (D.chains) this.spawnChains(e, D.chains);
      if (D.antennas) this.spawnAntennas(e, D.antennas);
      if (hasadek) { e.mhp *= 1.2; e.hp = e.mhp; }
    }
    // Ős – a világ 2. vagy 3. szintjén kóborol (és a Hasadékban 7-esével)
    const A = ANCIENTS[m.region];
    if (!hasadek && A && !boss && m.floor === (A.floor || (m.floor >= 2 ? m.floor : 0))) {
      if (m.floor === 2 || m.floor === 3) {
        const r = m.rooms.filter(r => !r.start && !r.exit).sort((a, b) => b.w * b.h - a.w * a.h)[0];
        if (r && rng() < 0.75) { const p = roomSpot(m, r, rng, 2); const e = this.spawnEnemy(A.base, p.x, p.y, L + A.lvlPlus, { ancient: A, mods: A.mods }); e.r = A.r; }
      }
    }
    if (hasadek && m.hasadek % 7 === 0) { const keys = Object.keys(ANCIENTS); const A2 = ANCIENTS[keys[rng.int(0, keys.length - 1)]]; const r = m.rooms.find(r => !r.start); const p = roomSpot(m, r, rng, 2); this.spawnEnemy(A2.base, p.x, p.y, L + 20, { ancient: A2, mods: A2.mods }).r = A2.r; }
    // világ-mechanikák
    const mech = R.mech || (REGION[m.region] && REGION[m.region].mech);
    m.mech = mech;
    if (mech === 'eh') {
      m.exitW = rng.pick([-3, -2, -1, 1, 2, 3]);
      const jr = m.rooms.filter(r => !r.exit && !r.boss)[rng.int(0, Math.max(0, m.rooms.filter(r => !r.exit && !r.boss).length - 1))];
      if (jr && !boss) { const p = roomSpot(m, jr, rng, 2); m.objs.push({ type: 'jelado', x: p.x, y: p.y, r: 14, label: 'Jeladó', inter: () => UI.toast(`A jeladó ismétli: „A kijárat fázisfala W = ${m.exitW > 0 ? '+' : ''}${m.exitW} értéken nyílik.” (Z / X: W-eltolás)`, '#c48cff', 6) }); }
      m.secretW = rng() < 0.5 ? -4 : 4;
      const sr = m.rooms[rng.int(0, m.rooms.length - 1)]; if (sr && !sr.start) { const p = roomSpot(m, sr, rng, 2); m.objs.push({ type: 'buborek', x: p.x, y: p.y, r: 18, w: m.secretW, label: 'Bébi-univerzum', inter: (o) => this.openBuborek(o) }); }
    }
    if (mech === 'jeltoro' && !boss) {
      const ex = m.objs.find(o => o.type === 'exit'); if (ex) { ex.locked = 'radio'; const word = rng.pick(MORSE_WORDS); ex.word = word; m.objs.push({ type: 'radio', x: ex.x + 50, y: ex.y, r: 14, label: 'Rádióadó', word, inter: (o) => UI.morsePuzzle(o, ex) }); }
    }
    if (mech === 'raktar') { // r3 lore: aranyraklap
      if (rng() < 0.4) { const r = rng.pick(m.rooms.filter(r => !r.start)); const p = roomSpot(m, r, rng, 2); const c = this.makeChest(p.x, p.y, true); c.gold = true; c.label = 'Aranyraklap'; m.objs.push(c); }
    }
    Quests.populateHook(m, R, rng);
    m.objs.forEach(o => { if (o.hp) o.mhp = o.hp; });
  },
  makeChest(x, y, rich) { return { type: 'chest', x, y, r: 14, rich, label: rich ? 'Díszes láda' : 'Láda', inter: (o) => { if (o.open) return; o.open = true; o.inter = null; Audio2.play('door'); const n = o.gold ? 0 : rich ? 2 : 1; for (let i = 0; i < n; i++) this.spawnPickup(o.x, o.y, 'item', 0, genItem(this.map.lvl, RNG, { mf: this.P.st.mf, cls: this.S.cls, minRar: rich ? 1 : 0 })); this.spawnPickup(o.x, o.y, 'gold', Math.round((5 + this.map.lvl * 3) * (o.gold ? 12 : rich ? 3 : 1))); if (RNG() < 0.5) this.spawnPickup(o.x, o.y, 'food', RNG.pick(FOOD_DROPS[this.map.region] || FOOD_DROPS.hasadek)); if (RNG() < 0.4) this.spawnPickup(o.x, o.y, 'mat', RNG.pick(REGION_NODES[this.map.region] || REGION_NODES.hasadek)); this.emit('chest'); } }; },
  makeShrine(x, y, rng) {
    const kinds = [['Erő szentélye', { dmgp: 40 }, '#ff7a4a'], ['Vas szentélye', { armp: 80, resall: 25 }, '#c0c8d0'], ['Szél szentélye', { msp: 35, aspd: 25 }, '#9fe07a'], ['Szerencse szentélye', { mf: 100, gf: 100 }, '#ffd34d'], ['Idő szentélye', { cdr: 30, resgen: 60 }, '#c48cff']];
    const k = rng.pick(kinds);
    return { type: 'shrine', x, y, r: 16, label: k[0], c: k[2], inter: (o) => { o.inter = null; o.used = true; this.buff(this.P, 'shrine', 90, k[1]); Audio2.play('legend'); this.fxRing(o.x, o.y, 90, k[2], 0.8, 6); UI.toast(`${k[0]}: 90 mp-re megerősödtél.`, k[2]); } };
  },
  makeNode(x, y, k) {
    const N = NODES[k];
    return { type: 'node', kind: k, x, y, r: 14, label: N.nev, left: 2 + Math.floor(RNG() * 2), inter: (o) => this.startChannel(1.1, `${N.nev} gyűjtése…`, () => { const n = 1 + (RNG() < 0.35 ? 1 : 0) + (this.map.lvl > 20 && RNG() < 0.3 ? 1 : 0); this.S.mats[k] = (this.S.mats[k] || 0) + n; this.text(o.x, o.y - 16, `+${n} ${MATS[k].nev}`, MATS[k].c, 12); Audio2.play('pickup'); this.burst(o.x, o.y, MATS[k].c, 10, 90); o.left--; if (o.left <= 0) { o.dead = true; } this.emit('gather', k); }) };
  },
  makeExit(x, y, R, hasadek) {
    return { type: 'exit', x, y, r: 22, label: 'Lejárat a mélybe', inter: (o) => {
      const m = this.map;
      if (m.mech === 'eh' && this.P.w !== m.exitW) { UI.toast(`A fázisfal zárva. Rossz W-n vagy (most: ${this.P.w > 0 ? '+' : ''}${this.P.w}). Keresd a jeladót.`, '#c48cff', 4); return; }
      if (o.locked === 'radio') { UI.toast('A lejáratot rádiós zár védi. Fejtsd meg az adót mellette.', '#4dffb0', 4); return; }
      if (m.hasadek) { this.S.prog.hasadek = Math.max(this.S.prog.hasadek, m.hasadek); if (m.weekly) Univ.weeklyProgress(m.hasadek); this.enterHasadek(m.hasadek + 1, m.weekly); return; }
      this.enterDungeon(m.rid, m.floor + 1);
    } };
  },
  makeReturnPortal() { const rp = this.retPortal; return { type: 'portal', x: 30.5 * TILE, y: 29.5 * TILE, r: 20, label: `Vissza: ${rp.label}`, c: '#6fa8ff', inter: () => this.useReturnPortal() }; },
  openBuborek(o) {
    if (this.P.w !== o.w) { UI.toast('Csak halványan látszik… Más W-n van.', '#c48cff'); return; }
    o.dead = true; Audio2.play('legend'); this.fxRing(o.x, o.y, 120, '#c48cff', 1, 8);
    for (let i = 0; i < 2; i++) this.spawnPickup(o.x, o.y, 'item', 0, genItem(this.map.lvl + 2, RNG, { minRar: 2, cls: this.S.cls }));
    this.spawnPickup(o.x, o.y, 'mat', 'egzotikus'); this.S.mats.szilank = (this.S.mats.szilank || 0) + 5;
    UI.toast('Bébi-univerzum! „Smolin, 1992: minden fekete lyuk mögött egy új világ.” (+5 kapuszilánk)', '#c48cff', 5); this.emit('buborek');
  },

  // ---------- városi kapu ----------
  townPortal() {
    if (this.inTown()) return; const P = this.P;
    this.startChannel(2.5, 'Kapunyitás Kapuvárosba…', () => {
      const m = this.map;
      this.retPortal = { label: m.hasadek ? `Hasadék ${m.hasadek}` : `${REGION[m.rid].nev}, ${m.floor}. szint`, state: { map: m, pal: this.pal, layer: this.staticLayer, enemies: this.enemies, pickups: this.pickups, grounds: [], boss: this.boss, x: P.x, y: P.y } };
      this.enterTown();
    }, '#6fa8ff');
  },
  useReturnPortal() {
    const rp = this.retPortal; if (!rp) return; const st = rp.state;
    this.clearWorld(); this.map = st.map; this.pal = st.pal; this.staticLayer = st.layer; this.enemies = st.enemies; this.pickups = st.pickups; this.boss = st.boss;
    if (this.boss && !this.boss.dead && this.boss.intro) UI.bossBar(this.boss);
    const P = this.P; P.x = st.x; P.y = st.y; P.dash = null; P.history = []; this.cam.x = P.x; this.cam.y = P.y;
    this.retPortal = null; UI.minimapDirty = true;
    const m = this.map; UI.setRegion(m.hasadek ? `Hasadék – ${m.hasadek}. mélység` : REGION[m.rid].nev, m.hasadek ? '' : `${m.floor}. szint`); Audio2.play('portal');
  },
  startChannel(t, label, fn, c = '#ffd34d') { const P = this.P; if (P.chan) return; P.chan = { t: 0, dur: t, label, fn, c, x: P.x, y: P.y }; },

  // ---------- sátor ----------
  pitchTent() {
    const S = this.S, P = this.P;
    if (this.inTown()) { UI.toast('A városban a kocsmában alhatsz (Kurta).', '#c48cff'); return; }
    if (!(S.food.satorlap > 0)) { UI.toast('Nincs sátrad. Nagyinál kapható.', '#ff7a7a'); return; }
    if (this.enemies.some(e => !e.dead && dist(e, P) < 520 && !e.ancient)) { UI.toast('Túl közel vannak az ellenfelek. Takarítsd ki a termet!', '#ff7a7a'); return; }
    this.startChannel(3.5, 'Sátorverés és alvás…', () => { S.food.satorlap--; if (!S.food.satorlap) delete S.food.satorlap; S.surv.ebren = 100; P.hp = P.mhp; P.sta = P.msta; recalc(P); UI.sleepFade(); UI.toast('Kialudtad magad. ⛺', '#c48cff'); }, '#c48cff');
  },

  // ---------- boss, Ős ----------
  bossDefeated(e) {
    const S = this.S, m = this.map, bid = e.bossId;
    UI.bossBar(null); this.shake(20); Audio2.play('legend'); this.flash = 0.8;
    if (e.links) e.links.forEach(l => { if (!l.dead) this.killEnemy(l); });
    this.enemies.forEach(x => { if (!x.dead && (x.parent || x.xp < 50) && dist(x, e) < 700) { x.xp = 0; this.killEnemy(x); } });
    if (m.hasadek) { S.prog.hasadek = Math.max(S.prog.hasadek, m.hasadek); m.objs.push({ type: 'exit', x: e.x, y: e.y + 80, r: 22, label: 'Tovább a Hasadékba', inter: () => { if (m.weekly) Univ.weeklyProgress(m.hasadek); this.enterHasadek(m.hasadek + 1, m.weekly); } }); m.objs.push({ type: 'portal', x: e.x - 70, y: e.y + 80, r: 20, label: 'Haza, Kapuvárosba', c: '#6fa8ff', inter: () => this.enterTown() }); return; }
    const R = REGION[m.rid]; const first = !S.prog.bosses[bid];
    S.prog.bosses[bid] = (S.prog.bosses[bid] || 0) + 1;
    if (first) {
      UI.toast(`${e.bossDef.nev} legyőzve!`, '#ffd34d', 5);
      if (!S.gates.includes(R.gate) && bid !== 'szingularitas') { S.gates.push(R.gate); if (!S.gate) S.gate = R.gate; UI.toast(`Új Kapukő-képesség: ${GATESKILLS[R.gate].ikon} ${GATESKILLS[R.gate].nev} (V)`, '#d27bff', 6); }
      const i = REGIONS.findIndex(r => r.id === m.rid); const nx = REGIONS[i + 1];
      if (nx && !S.prog.unlocked.includes(nx.id)) { S.prog.unlocked.push(nx.id); S.prog.wp[nx.id] = 1; UI.toast(`Új világ nyílt meg a Kapuban: ${nx.nev}`, '#9fe8ff', 6); }
      Univ.set('kp:' + bid);
    }
    this.emit('boss', bid);
    if (bid === 'onmagad') { m.objs.push({ type: 'portal', x: e.x, y: e.y, r: 24, label: 'A tesszerakt szíve', c: '#c48cff', inter: () => this.enterDungeon('eh', REGION.eh.floors) }); UI.toast('A tesszerakt mélyén valami még vár. A Szingularitás.', '#c48cff', 6); return; }
    if (bid === 'szingularitas') { this.later(2.5, () => UI.ending()); }
    m.objs.push({ type: 'portal', x: e.x, y: e.y + 60, r: 20, label: 'Kapu haza', c: '#6fa8ff', inter: () => this.enterTown() });
    this.autosave();
  },
  ancientDefeated(e) {
    const S = this.S, A = e.ancient; this.shake(16); Audio2.play('legend'); this.flash = 0.6;
    const first = !S.prog.ancients[A.id]; S.prog.ancients[A.id] = (S.prog.ancients[A.id] || 0) + 1;
    if (first) { S.pecset++; UI.toast(`☠ ${A.nev} elesett! Tiltott pecsét: ${S.pecset}`, '#ff3355', 6); Univ.set('kp:os:' + A.id); }
    else UI.toast(`☠ ${A.nev} ismét elesett.`, '#ff3355', 4);
    Forbidden.check();
  },

  // ---------- JÁTÉKOS IRÁNYÍTÁS ----------
  updatePlayer(dt) {
    const P = this.P, S = this.S, m = this.map, st = P.st, C = CLASSES[S.cls];
    if (P.dead) return;
    // időzítők, buffok
    P.invul -= dt; P.potCd -= dt; P.dashCd -= dt; P.hurtT -= dt; P.wCd -= dt; P.combatT -= dt; P.magT -= dt; P.artiCd -= dt;
    for (const k in P.cds) P.cds[k] -= dt;
    let changed = false;
    for (const b of P.buffs) { b.t -= dt; if (b.mods && b.mods.hot) P.hp = Math.min(P.mhp, P.hp + b.mods.hot * dt); if (b.t <= 0) changed = true; }
    if (changed) { P.buffs = P.buffs.filter(b => b.t > 0); recalc(P); }
    // regeneráció
    if (P.combatT <= 0 || st.regen > 0) P.hp = Math.min(P.mhp, P.hp + st.regen * dt * (P.combatT > 0 ? 0.5 : 2));
    if (C.rage) { if (P.combatT <= 0) P.mp = Math.max(0, P.mp - 6 * dt); if (st.arti) P.mp = Math.min(P.mmp, P.mp + 1.2 * st.arti * dt); }
    else P.mp = Math.min(P.mmp, P.mp + st.mregen * dt);
    if (!(P.sprinting) && !(P.dash)) P.sta = Math.min(P.msta, P.sta + st.staRegen * dt * (S.surv.ebren < 30 ? 0.5 : 1));
    if (st.shieldPct) { P.shieldT += dt; if (P.shieldT > 8) P.shieldV = Math.min(P.mhp * st.shieldPct / 100, P.shieldV + P.mhp * st.shieldPct / 100 * dt * 0.5); }
    // Golyóidő
    if (P.bulletTime) { P.mp -= (22 - P.bulletTime * 2) * dt; if (P.mp <= 0) { P.mp = 0; P.bulletTime = 0; UI.toast('Elfogyott a belső időd.', '#f2d36b'); } }
    // előzmény az Időhurokhoz
    P.histT += dt; if (P.histT > 0.2) { P.histT = 0; P.history.push({ x: P.x, y: P.y, hp: P.hp }); if (P.history.length > 20) P.history.shift(); }
    survivalTick(P, dt, this.inTown());
    // célzás
    P.aim = Math.atan2(Input.wy - P.y, Input.wx - P.x);
    if (P.stun > 0) { P.stun -= dt; return; }
    // csatornázás (kapu, gyűjtés, sátor)
    if (P.chan) {
      P.chan.t += dt; const moved = Math.hypot(P.x - P.chan.x, P.y - P.chan.y) > 6;
      if (moved || Input.mdown[0]) { P.chan = null; }
      else if (P.chan.t >= P.chan.dur) { const f = P.chan.fn; P.chan = null; f(); }
    }
    // mozgás
    let mx = 0, my = 0;
    if (Input.keys.has('w') || Input.keys.has('ArrowUp')) my -= 1; if (Input.keys.has('s') || Input.keys.has('ArrowDown')) my += 1;
    if (Input.keys.has('a') || Input.keys.has('ArrowLeft')) mx -= 1; if (Input.keys.has('d') || Input.keys.has('ArrowRight')) mx += 1;
    const ml = Math.hypot(mx, my); if (ml) { mx /= ml; my /= ml; }
    P.sprinting = Input.keys.has('Shift') && ml && P.sta > 1 && !this.inTown();
    if (P.sprinting && !st.staInf) P.sta = Math.max(0, P.sta - 28 * dt);
    let spd = 185 * st.msp * (P.sprinting || (this.inTown() && Input.keys.has('Shift')) ? 1.5 : 1);
    if (P.chill > 0) { spd *= 0.6; P.chill -= dt; }
    const ti = tileAt(m, Math.floor(P.x / TILE), Math.floor(P.y / TILE));
    let haz = ti === T_HAZ ? (REGION[m.region] ? REGION[m.region].haz.fx : null) : null;
    if (haz === 'slow') spd *= 0.55;
    if (haz === 'pull') spd *= 0.7;
    const acc = haz === 'slip' ? 3 : 18;
    P.vx = lerp(P.vx, mx * spd, Math.min(1, dt * acc)); P.vy = lerp(P.vy, my * spd, Math.min(1, dt * acc));
    if (P.dash) {
      const d = P.dash; d.t -= dt; moveCircle(m, P, d.vx * dt, d.vy * dt);
      if (d.o.dmg) for (const e of this.near(P.x, P.y, P.r + 14)) if (!d.hit.has(e)) { d.hit.add(e); this.hurtEnemy(e, d.o.dmg, d.o.dt || 'fiz', { stun: d.o.stun, knock: 120, melee: true }); }
      if (RNG() < 0.8) this.parts.push({ x: P.x, y: P.y, vx: 0, vy: 0, t: 0, life: 0.25, c: CLASSES[S.cls].szin, size: 7, drag: 0 });
      if (d.t <= 0) P.dash = null;
    } else {
      let vx = P.vx + (P.kbx || 0), vy = P.vy + (P.kby || 0);
      if (this.gust) { vx += this.gust.x; vy += this.gust.y; }
      if (haz === 'wind') { vx += m.windX || 60; vy += m.windY || 0; }
      if (P.ext) { vx += P.ext.x; vy += P.ext.y; P.ext.x = P.ext.y = 0; }
      moveCircle(m, P, vx * dt, vy * dt);
      if (P.kbx || P.kby) { P.kbx *= Math.pow(0.003, dt); P.kby *= Math.pow(0.003, dt); if (Math.abs(P.kbx) + Math.abs(P.kby) < 4) P.kbx = P.kby = 0; }
      if (ml) P.step += dt * spd / 30;
    }
    if (haz === 'burn' && !(P.invul > 0)) { P.hazT = (P.hazT || 0) - dt; if (P.hazT <= 0) { P.hazT = 0.5; this.hurtPlayer(P.mhp * 0.035, 'tuz', null, {}); } }
    if (haz === 'drain') P.mp = Math.max(0, P.mp - 10 * dt);
    if (haz === 'pull') { P.hazT = (P.hazT || 0) - dt; if (P.hazT <= 0) { P.hazT = 0.5; this.hurtPlayer(P.mhp * 0.02, 'ter', null, { silent: true }); } }
    if (P.buffs.some(b => b.mods && b.mods.trail)) { P.trailT = (P.trailT || 0) - dt; if (P.trailT <= 0) { P.trailT = 0.15; this.ground(P.x, P.y, 28, 2.5, P.roll(0.5, 'best').a, 'tuz', 'p'); } }
    if (this.inTown()) { if (typeof Home !== 'undefined') Home.update(); return; }
    // kitérés
    if ((Input.hit(' ')) && P.dashCd <= 0 && !P.dash) {
      const cost = 25; if (P.sta >= cost || st.staInf) {
        if (!st.staInf) P.sta -= cost;
        const a = ml ? Math.atan2(my, mx) : P.aim; G.dash(P, a, P.fx.hold ? 260 : 140, 0.16, { invul: true }); P.dashCd = P.fx.felho ? 0.45 : 0.9; if (P.fx.felho) P.invul = 1.1; Audio2.play('dash');
      } else UI.toast('Kifulladtál (állóképesség).', '#9fe07a', 1.2);
    }
    // alaptámadás
    P.atkT -= dt;
    if (Input.mdown[0] && !UI.overUI && !P.dash && P.atkT <= 0) this.basicAttack();
    // képességek: jobb gomb + 1–4
    if (Input.mclick[2] || (Input.mdown[2] && !UI.overUI)) this.useSlot(0);
    for (let i = 1; i <= 4; i++) if (Input.hit(String(i))) this.useSlot(i);
    if (Input.hit('v')) this.useGate();
    // W-tengely
    if (m.mech === 'eh' && P.wCd <= 0) { if (Input.hit('z')) { P.w = Math.max(-4, P.w - 1); P.wCd = 0.25; this.wShift(); } if (Input.hit('x')) { P.w = Math.min(4, P.w + 1); P.wCd = 0.25; this.wShift(); } }
  },
  wShift() { const P = this.P; Audio2.play('portal'); this.fxRing(P.x, P.y, 50, '#c48cff', 0.4, 3); this.text(P.x, P.y - 30, `W = ${P.w > 0 ? '+' : ''}${P.w}`, '#c48cff', 15); },
  townClick() { },
  basicAttack() {
    const P = this.P, S = this.S, w = S.eq.fegyver && S.eq.fegyver.req <= S.lvl ? S.eq.fegyver : null;
    const B = w ? BASES[w.base] : { kind: 'melee', spd: 1.6, range: 50, arc: 1.5, dtype: 'fiz' };
    const st = P.st; P.atkT = 1 / (B.spd * st.aspd);
    const add = st.add, dt = B.dtype;
    P.combatT = Math.max(P.combatT, 2);
    if (B.kind === 'melee') {
      const dmg = P.roll(1, 'melee');
      this.arc(P.x, P.y, P.aim, B.arc, B.range + P.r, dmg, dt, { basic: true, melee: true, knock: B.knock || 40, fx: 'swing' });
      for (const k in add) if (add[k]) this.arc(P.x, P.y, P.aim, B.arc, B.range + P.r, { a: add[k], c: false }, k, { noReflect: true });
      Audio2.play('swing'); P.swing = 0.18; P.swingCount++;
      this.onBasicHit('melee');
      if (P.fx.sziv && P.swingCount % 4 === 0) this.proj({ x: P.x, y: P.y, a: P.aim, spd: 500, r: 16, dmg: P.roll(1.2, 'melee'), dt: 'villam', own: 'p', kind: 'wave', col: '#dfefff', pierce: 99, life: 0.6 });
    } else if (B.kind === 'spell') {
      if (!CLASSES[S.cls].rage && P.mp < (B.mp || 0)) { P.atkT = 0.2; return; }
      if (!CLASSES[S.cls].rage) P.mp -= B.mp || 0;
      const o = { x: P.x + Math.cos(P.aim) * 14, y: P.y + Math.sin(P.aim) * 14, a: P.aim, spd: B.pspd, r: B.prad, dmg: P.roll(1, 'spell'), dt, own: 'p', kind: B.splash ? 'orb' : 'bolt', col: DT[dt].c, splash: B.splash, basic: true, add, trail: DT[dt].c, foton: P.fx.foton, life: 1.4 };
      this.proj(o); Audio2.play('magic');
      if (P.fx.tesszerakt && RNG() < 0.2) this.later(1, () => this.proj({ ...o, x: P.x, y: P.y, a: P.aim, hit: new Set() }));
      this.onBasicHit('spell');
    } else {
      const n = (B.pellets || 1) * (st.triple ? 3 : 1);
      P.shotCount++;
      const morse = P.fx.morse && P.shotCount % 6 === 0;
      for (let i = 0; i < n; i++) {
        const sp = (B.spread || 0) + (st.triple ? 0.12 : 0);
        this.proj({ x: P.x + Math.cos(P.aim) * 16, y: P.y + Math.sin(P.aim) * 16, a: P.aim + RNG.range(-sp, sp) + (st.triple && !B.pellets ? (i - 1) * 0.12 : 0), spd: B.pspd, r: B.prad, dmg: P.roll(B.pellets ? 1 : 1, 'ranged'), dt: morse ? 'villam' : dt, own: 'p', kind: B.splash ? 'rocket' : 'bullet', col: morse ? '#f4f06a' : '#ffe9b0', splash: B.splash, pierce: st.pierceAll ? 99 : (B.pierce || 0), basic: true, ranged: true, add, stun: morse ? 1.2 : 0, homing: B.splash && P.fx.szonda ? 4 : 0, foton: P.fx.foton, life: 1.3, trail: B.splash ? '#ffb070' : null });
      }
      Audio2.play(B.splash ? 'boom' : B.pspd > 1000 ? 'rifle' : 'shoot'); P.recoil = 0.1;
      this.onBasicHit('ranged');
    }
  },
  onBasicHit(kind) {
    const P = this.P, C = CLASSES[this.S.cls];
    if (C.rage) { const near = this.near(P.x, P.y, kind === 'melee' ? 120 : 600).length; if (near) P.mp = Math.min(P.mmp, P.mp + P.st.rageGain); }
    else if (C.onHitMp) P.mp = Math.min(P.mmp, P.mp + C.onHitMp);
    if (P.fx.croptop) { P.hitCount++; if (P.hitCount % 10 === 0) { this.arc(P.x, P.y, P.aim, 1.2, 160, P.roll(1.2, 'best'), 'fiz', { knock: 200, fx: 'burp' }); Audio2.play('burp'); this.text(P.x, P.y - 30, 'BÖFF', '#ff9be0', 14); } }
  },
  skillById(id) { return SKILLS[id] || FORBIDDEN[id]; },
  useSlot(i) {
    const P = this.P, S = this.S, id = S.slots[i]; if (!id) return;
    const sk = this.skillById(id); if (!sk) return;
    const forb = !!FORBIDDEN[id];
    const r = forb ? 1 : skillRank(P, id); if (!r) return;
    if ((P.cds[id] || 0) > 0) return;
    if (sk.toggle && P.bulletTime) { sk.cast(r, P, Input.wx, Input.wy); P.cds[id] = 0.4; return; }
    let cost = typeof sk.cost === 'function' ? sk.cost(r) : sk.cost || 0;
    let spent = 0;
    if (sk.spendPct) cost = Math.round(P.mmp * sk.spendPct);
    if (P.mp < cost) { if (!P.noResT || this.t - P.noResT > 1) { UI.toast(`Kevés a ${resName(S.cls).toLowerCase()} (${Math.floor(P.mp)}/${cost})`, RESOURCES[S.cls].c, 1.2); P.noResT = this.t; } return; }
    if (sk.spendAll) { spent = P.mp; P.mp = 0; } else { P.mp -= cost; spent = cost; }
    const cd = (typeof sk.cd === 'function' ? sk.cd(r) : sk.cd) * (1 - P.st.cdr);
    P.cds[id] = cd; P.cdMax = P.cdMax || {}; P.cdMax[id] = cd;
    P.combatT = Math.max(P.combatT, 2);
    sk.cast(r, P, Input.wx, Input.wy, spent);
    if (P.fx.tesszerakt && sk.cls === 'elem' && RNG() < 0.2) this.later(1, () => { if (!P.dead) sk.cast(r, P, Input.wx, Input.wy, spent); this.text(P.x, P.y - 34, 'a múltból…', '#c48cff', 12); });
    this.emit('skill', id);
  },
  useGate() {
    const P = this.P, S = this.S, id = S.gate; if (!id) { UI.toast('Még nincs Kapukő-képességed. Győzz le egy világurat!', '#aaa'); return; }
    const g = GATESKILLS[id]; if ((P.cds['g_' + id] || 0) > 0) return;
    const cost = g.cost * (CLASSES[S.cls].rage ? 0.6 : 1);
    if (P.mp < cost) { UI.toast(`Kevés a ${resName(S.cls).toLowerCase()}.`, RESOURCES[S.cls].c, 1); return; }
    P.mp -= cost; const cd = g.cd * (1 - P.st.cdr); P.cds['g_' + id] = cd; P.cdMax = P.cdMax || {}; P.cdMax['g_' + id] = cd;
    g.cast(P, Input.wx, Input.wy); if (id === 'boefi') S.stats.burps++; this.emit('gate', id);
  },

  // ---------- fő frissítés ----------
  update(dt) {
    if (this.scene !== 'play' || !this.map) return;
    const P = this.P, m = this.map;
    this.t += dt; this.S.playtime += dt;
    // időzítők
    for (const t of this.timers) { t.t -= dt; if (t.t <= 0) { t.done = true; try { t.fn(); } catch (e) { console.error(e); } } }
    if (this.timers.some(t => t.done)) this.timers = this.timers.filter(t => !t.done);
    Input.wx = this.cam.x + Input.mx / this.zoom - this.W / 2; Input.wy = this.cam.y + Input.my / this.zoom - this.H / 2;
    this.updatePlayer(dt);
    // a világ ideje (Golyóidő lassítja)
    const wdt = P.bulletTime ? dt * (1 - (0.6 + P.bulletTime * 0.04)) : dt;
    this.fieldT -= dt;
    if (this.fieldT <= 0) { this.fieldT = 0.35; flowField(m, Math.floor(P.x / TILE), Math.floor(P.y / TILE), 45); }
    this.rebuildGrid();
    this.updateEnemies(wdt);
    this.updateAllies(dt);
    this.wdt = wdt; this.updateProjs(dt); // a játékos lövedékei normál, az ellenfeleké lassított időben
    this.updateTeles(wdt);
    this.updatePickups(dt);
    this.updateObjs(dt);
    this.regionMech(dt);
    // részecskék, szövegek
    for (const p of this.parts) { p.t += dt; if (!p.ring && !p.bolt && !p.arc && !p.slash && !p.papucs) { p.x += p.vx * dt; p.y += p.vy * dt; const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; p.vy += (p.grav || 0) * dt; } }
    this.parts = this.parts.filter(p => p.t < p.life);
    for (const t of this.texts) { t.t += dt; t.y += t.vy * dt; t.vy *= Math.exp(-2 * dt); }
    this.texts = this.texts.filter(t => t.t < t.life);
    if (this.flashes) { for (const f of this.flashes) f.t += dt; this.flashes = this.flashes.filter(f => f.t < f.life); }
    this.flash = Math.max(0, this.flash - dt * 2);
    // kamera
    const lead = 0.12; const tx = P.x + Math.cos(P.aim) * 40, ty = P.y + Math.sin(P.aim) * 40;
    this.cam.x = lerp(this.cam.x, tx, Math.min(1, dt * 7)); this.cam.y = lerp(this.cam.y, ty, Math.min(1, dt * 7));
    this.cam.shake = Math.max(0, this.cam.shake - dt * 30);
    // felfedezés
    const ptx = Math.floor(P.x / TILE), pty = Math.floor(P.y / TILE);
    for (let y = pty - 9; y <= pty + 9; y++) for (let x = ptx - 12; x <= ptx + 12; x++) if (x >= 0 && y >= 0 && x < m.w && y < m.h) { const i = y * m.w + x; if (!m.seen[i]) { m.seen[i] = 1; UI.minimapDirty = true; } }
    this.saveT = (this.saveT || 0) + dt; if (this.saveT > 30) { this.saveT = 0; this.autosave(); }
  },
  updatePickups(dt) {
    const P = this.P;
    for (const p of this.pickups) {
      p.t += dt; if (p.z < 0 || p.vy < 0) { p.z += p.vy * dt; p.vy += 600 * dt; if (p.z >= 0) { p.z = 0; p.vy = 0; } }
      if (p.t < 0.4 || P.dead) continue;
      const d = dist(p, P); const auto = p.kind !== 'item' || this.autoItems;
      const mag = p.kind === 'gold' || p.kind === 'potion' || p.kind === 'mat' || p.kind === 'food' ? 90 : 0;
      if (mag && d < mag) { const a = Math.atan2(P.y - p.y, P.x - p.x); p.x += Math.cos(a) * 340 * dt; p.y += Math.sin(a) * 340 * dt; }
      if (d < (p.kind === 'item' ? 26 : 20) && auto) { if (this.pickUp(p)) p.gone = true; }
    }
    this.pickups = this.pickups.filter(p => !p.gone);
  },
  updateObjs(dt) {
    const m = this.map, P = this.P;
    for (const o of m.objs) {
      if (o.dead) continue;
      if (o.type === 'hive' && o.hp > 0) { o.spawnT -= dt; if (o.spawnT <= 0 && dist(o, P) < 500) { o.spawnT = 6; if (this.enemies.filter(e => !e.dead && e.type === 'darazs').length < 25) { const e = this.spawnEnemy('darazs', o.x, o.y, m.lvl, {}); e.state = 'chase'; e.xp *= 0.5; } } }
      if (o.type === 'npc' && o.wander) { o.wt = (o.wt || 0) - dt; if (o.wt <= 0) { o.wt = 2 + RNG() * 3; o.wa = RNG() * 6.28; o.wm = RNG() < 0.5; } if (o.wm) { const nx = o.x + Math.cos(o.wa) * 30 * dt, ny = o.y + Math.sin(o.wa) * 30 * dt; if (!solidAt(m, nx, ny) && Math.hypot(nx - o.hx, ny - o.hy) < 120) { o.x = nx; o.y = ny; } } }
    }
  },
  regionMech(dt) {
    const m = this.map, P = this.P;
    if (m.mech === 'egtorony') {
      this.envT -= dt;
      if (!this.gust && this.envT <= 0) { const a = RNG() * 6.28; this.gust = { x: Math.cos(a) * 130, y: Math.sin(a) * 130, t: 2.5 }; UI.toast('Széllökés!', '#dfefff', 1.2); }
      if (this.gust) { this.gust.t -= dt; for (let i = 0; i < 3; i++) this.parts.push({ x: P.x + RNG.range(-this.W / 2, this.W / 2), y: P.y + RNG.range(-this.H / 2, this.H / 2), vx: this.gust.x * 4, vy: this.gust.y * 4, t: 0, life: 0.4, c: 'rgba(230,240,255,.5)', size: 2, drag: 0, streak: true }); if (this.gust.t <= 0) { this.gust = null; this.envT = 8 + RNG() * 6; } }
      if (m.windX == null) { const a = RNG() * 6.28; m.windX = Math.cos(a) * 70; m.windY = Math.sin(a) * 70; }
    }
    if (m.mech === 'loter' && !this.boss) {
      this.envT -= dt;
      if (this.envT <= 0 && this.enemies.some(e => !e.dead && e.state === 'chase')) { this.envT = 6 + RNG() * 5; const n = 3; for (let i = 0; i < n; i++) this.tele(P.x + RNG.range(-160, 160), P.y + RNG.range(-160, 160), 70, 1.4, 22 * monDmg(m.lvl), 'tuz', 'env', { fx: 'meteor' }); UI.toast('Rakéta-becsapódás!', '#ff9b5a', 1); }
    }
    if (m.mech === 'raktar') { // áramszünet
      this.envT -= dt; if (this.envT <= 0) { this.envT = 50 + RNG() * 40; if (RNG() < 0.5) { this.darkBoost = 12; UI.toast('Áramszünet a raktárban!', '#ffe9b0', 2); } }
    }
    if (this.darkBoost > 0) this.darkBoost -= dt;
  },
  autosave() { if (this.S) Save.write(this.slot, this.S); },
});
const DIFFS = ['Normál', 'Rémálom', 'Pokol'];
const MORSE = { A: '·–', B: '–···', C: '–·–·', D: '–··', E: '·', F: '··–·', G: '––·', H: '····', I: '··', J: '·–––', K: '–·–', L: '·–··', M: '––', N: '–·', O: '–––', P: '·––·', Q: '––·–', R: '·–·', S: '···', T: '–', U: '··–', V: '···–', W: '·––', X: '–··–', Y: '–·––', Z: '––··' };
const MORSE_WORDS = ['HALLO', 'KAPU', 'MAJD', 'TUKOR', 'HUROK', 'NE', 'ADD', 'FEL', 'MEG', 'HOLD', 'JEL', 'SOS'];
const toMorse = w => w.split('').map(c => MORSE[c] || '').join('  ');
