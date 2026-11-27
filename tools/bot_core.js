// ============================================================
//  ÁTLAGJÁTÉKOS-BOT – a játék modulján belül fut (__eval-lal töltjük be)
//  Nem csal: billentyűt „nyom”, egeret „mozgat”, a városban azt veszi meg, amit egy
//  átlagos játékos: italt, ételt, nagyobb számú felszerelést. A kitérésnél csak a
//  jelzett támadások egy részére reagál (REACT), és késve.
// ============================================================
window.BOT = (() => {
  const DT = 1 / 30, REACT = 0.6;
  const PROFILE = {
    penge: { attr: { ero: 2, kit: 2, allo: 1 }, kind: 'melee', keep: 0 },
    elem: { attr: { akarat: 3, kit: 2 }, kind: 'spell', keep: 260 },
    loves: { attr: { ugy: 3, kit: 1, allo: 1 }, kind: 'ranged', keep: 280 },
    mernok: { attr: { akarat: 2, ugy: 1, kit: 2 }, kind: 'ranged', keep: 240 },
  };
  let B = null; // állapot

  // ---------- útkeresés (veszélyes talajt kerülő Dijkstra, vödrös sorral) ----------
  function field(m, tx, ty) {
    const W = m.w, N = W * m.h, d = new Int32Array(N).fill(1e9), buckets = [];
    const s = ty * W + tx; if (s < 0 || s >= N) return d; d[s] = 0; buckets[0] = [s];
    const lava = m.region === 'melyseg' || m.region === 'loter' || m.region === 'eh' || m.region === 'jeltoro';
    for (let k = 0; k < buckets.length; k++) {
      const bk = buckets[k]; if (!bk) continue;
      for (const c of bk) {
        if (d[c] !== k) continue; const cx = c % W, cy = (c / W) | 0;
        for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + ox, ny = cy + oy; if (!walkTile(m, nx, ny)) continue;
          const n = ny * W + nx, cost = (m.t[n] === T_HAZ && lava) ? 6 : 1, nd = k + cost;
          if (nd < d[n]) { d[n] = nd; (buckets[nd] || (buckets[nd] = [])).push(n); }
        }
      }
    }
    return d;
  }
  function dirTo(tx, ty) {
    const P = G.P, m = G.map, key = Math.floor(tx / TILE) + ',' + Math.floor(ty / TILE);
    if (los(m, P.x, P.y, tx, ty) && !(m.t[Math.floor(P.y / TILE) * m.w + Math.floor(P.x / TILE)] === T_HAZ)) {
      // egyenes út, ha nincs láva közben
      const n = Math.ceil(Math.hypot(tx - P.x, ty - P.y) / 16); let haz = false;
      for (let i = 1; i < n && !haz; i++) { const x = lerp(P.x, tx, i / n), y = lerp(P.y, ty, i / n); if (tileAt(m, Math.floor(x / TILE), Math.floor(y / TILE)) === T_HAZ) haz = true; }
      if (!haz) return Math.atan2(ty - P.y, tx - P.x);
    }
    if (B.fKey !== key || B.fMap !== m) { B.fKey = key; B.fMap = m; B.f = field(m, Math.floor(tx / TILE), Math.floor(ty / TILE)); }
    const f = B.f, cx = Math.floor(P.x / TILE), cy = Math.floor(P.y / TILE); let best = f[cy * m.w + cx], bx = 0, by = 0;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      if (!ox && !oy) continue; const nx = cx + ox, ny = cy + oy; if (!walkTile(m, nx, ny)) continue;
      if (ox && oy && (!walkTile(m, cx + ox, cy) || !walkTile(m, cx, cy + oy))) continue;
      const v = f[ny * m.w + nx]; if (v < best) { best = v; bx = ox; by = oy; }
    }
    if (!bx && !by) return Math.atan2(ty - P.y, tx - P.x);
    return Math.atan2((cy + by + 0.5) * TILE - P.y, (cx + bx + 0.5) * TILE - P.x);
  }
  function pathLen(tx, ty) { const P = G.P, m = G.map; const f = field(m, Math.floor(P.x / TILE), Math.floor(P.y / TILE)); return f[Math.floor(ty / TILE) * m.w + Math.floor(tx / TILE)]; }

  // ---------- bemenet ----------
  function aimAt(x, y) { Input.wx = x; Input.wy = y; Input.mx = (x - G.cam.x + G.W / 2) * G.zoom; Input.my = (y - G.cam.y + G.H / 2) * G.zoom; }
  function move(a) {
    if (a == null) return; const c = Math.cos(a), s = Math.sin(a);
    if (c > 0.38) Input.keys.add('d'); if (c < -0.38) Input.keys.add('a'); if (s > 0.38) Input.keys.add('s'); if (s < -0.38) Input.keys.add('w');
  }
  function dodge(a) { const P = G.P; if (P.dashCd > 0 || P.dash || (P.sta < DODGE_COST && !P.st.staInf)) return false; Input.keys.clear(); move(a); Input.pressed.add(' '); B.st.dodges++; return true; }

  // ---------- város (azonnali ügyintézés) ----------
  function itemScore(it) {
    const Bs = BASES[it.base], cls = G.S.cls; let s = 0;
    const aff = {}; it.aff.forEach(a => aff[a.id] = affVal(it, a));
    if (Bs.slot === 'fegyver') {
      const [a, b] = itemDmg(it); let dps = (a + b) / 2 * (Bs.pellets ? Bs.pellets * 0.6 : 1) * Bs.spd * (Bs.splash ? 1.4 : 1);
      const want = PROFILE[cls].kind; if (Bs.kind !== want) dps *= cls === 'mernok' ? 0.9 : 0.55;
      s = dps * (1 + (aff.dmgp || 0) / 100) * (1 + (aff.aspd || 0) / 100) + (aff.flat || 0) * Bs.spd * 2;
      s += ((aff.add_tuz || 0) + (aff.add_fagy || 0) + (aff.add_villam || 0)) * Bs.spd;
      return s * 3;
    }
    s += itemArm(it) * 1.2 + (aff.hp || 0) * 0.6 + (aff.arm || 0);
    for (const k of ['ero', 'ugy', 'akarat', 'kit', 'allo']) s += (aff[k] || 0) * (PROFILE[cls].attr[k] ? 4 : 1.5);
    s += (aff.dmgp || 0) * 3 + (aff.crit || 0) * 3 + (aff.critd || 0) + (aff.aspd || 0) * 3 + (aff.ls || 0) * 4 + (aff.regen || 0) * 3 + (aff.ms || 0) * 2;
    for (const k of ['res_tuz', 'res_fagy', 'res_villam', 'res_ter']) s += (aff[k] || 0) * 0.8;
    s += (aff.resgen || 0) * 0.8 + (aff.resmax || 0) * 0.5 + (aff.mregen || 0) * 0.5 + (aff.cdr || 0) * 3;
    if (Bs.slot === 'artefakt') s += Bs.res === cls ? 40 : 5;
    if (it.relic) s += 15;
    return s;
  }
  function town() {
    const S = G.S, P = G.P, prof = PROFILE[S.cls];
    // küldetések: elfogad, lead (ahogy egy átlagos játékos végigkattint a ❗/? jeleken)
    for (const id in NPCS) { for (const q of Quests.available(id)) Quests.accept(q.id); }
    for (const q of Quests.active()) if (S.quests[q.id].st === 'kesz') Quests.complete(q.id);
    // tulajdonságpontok
    const cyc = []; for (const k in prof.attr) for (let i = 0; i < prof.attr[k]; i++) cyc.push(k);
    while (S.attrPts > 0) { S.attrs[cyc[B.attrI++ % cyc.length]]++; S.attrPts--; }
    // képességpontok: előbb aktívok (max 5), aztán passzívok, egyenletesen
    const mine = Object.keys(SKILLS).filter(k => SKILLS[k].cls === S.cls).sort((a, b) => SKILLS[a].req - SKILLS[b].req);
    // kasztút: a mag párossága dönti el, melyiket választja (így mindkettő mérve van)
    const ut = mine.filter(k => SKILLS[k].ut === (B.seed % 2 ? 'A' : 'B'))[0];
    if (ut && S.lvl >= SKILLS[ut].req && !S.skills[ut] && S.skillPts > 0 && Skills2.canLearn(S, ut)) { S.skills[ut] = 1; S.skillPts--; }
    let guard = 0;
    while (S.skillPts > 0 && guard++ < 200) {
      const can = mine.filter(k => S.lvl >= SKILLS[k].req && (S.skills[k] || 0) < SKILLS[k].max && Skills2.canLearn(S, k));
      if (!can.length) break;
      const unl = can.filter(k => !S.skills[k] && SKILLS[k].tipus === 'aktiv' && Object.keys(S.skills).filter(x => SKILLS[x] && SKILLS[x].tipus === 'aktiv').length < 5);
      const pick = unl[0] || can.sort((a, b) => (S.skills[a] || 0) - (S.skills[b] || 0) + (SKILLS[a].ult ? -0.5 : 0) - (SKILLS[b].ult ? -0.5 : 0))[0];
      S.skills[pick] = (S.skills[pick] || 0) + 1; S.skillPts--;
    }
    const act = mine.filter(k => S.skills[k] && SKILLS[k].tipus === 'aktiv');
    for (let i = 0; i < 5; i++) S.slots[i] = act[i] || S.slots[i] || null;
    if (S.forbidden.length) { const f = S.forbidden.find(id => FORBIDDEN[id]); if (f && !S.slots.includes(f)) S.slots[4] = f; }
    // felszerelés: a nagyobb szám nyer
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < S.inv.length; i++) {
        const it = S.inv[i]; if (it.req > S.lvl) continue; const sl = BASES[it.base].slot, cur = S.eq[sl];
        if (!cur || itemScore(it) > itemScore(cur) * 1.03) { S.eq[sl] = it; S.inv.splice(i, 1); if (cur) S.inv.push(cur); changed = true; B.st.equips++; break; }
      }
    }
    // eladás (a táska nem kell)
    for (const it of S.inv) S.gold += itemValue(it); S.inv = [];
    // fegyver erősítése, ha bőven van arany (+5-ig)
    const w = S.eq.fegyver; if (w && (w.upg || 0) < 5) { const c = upgradeCost(w); if (S.gold > c.arany * 3 && (S.mats.szilank || 0) >= c.szilank) { S.gold -= c.arany; S.mats.szilank -= c.szilank; if (RNG() < c.esely) w.upg = (w.upg || 0) + 1; } }
    recalc(P);
    // italok, étel, sátor, alvás
    const rc = UI.refillCost(); if (S.gold >= rc) { S.gold -= rc; S.potions = G.potMax(); }
    const buy = (id, n) => { while ((S.food[id] || 0) < n && S.gold >= FOODS[id].ar) { S.gold -= FOODS[id].ar; S.food[id] = (S.food[id] || 0) + 1; } };
    buy('viz', 4); buy('pogacsa', 3); if (S.lvl >= 6) buy('satorlap', 1);
    if (S.surv.ebren < 60 && S.gold >= UI.innCost()) UI.acts.inn.call(UI);
    if (S.surv.kaja < 60) autoEat('kaja'); if (S.surv.ital < 60) autoEat('ital');
    // Nagyi elixírje: aki már a Mézországon túl van, főzet magának erőelixírt, ha van rá anyag
    for (const id of ['ero', 'vasbor']) { const E = ELIX[id]; if ((S.elix[id] || 0) < 2 && S.gold >= E.ar * 3 && Object.keys(E.recept).every(m => (S.mats[m] || 0) >= E.recept[m])) { for (const m in E.recept) S.mats[m] -= E.recept[m]; S.gold -= E.ar; S.elix[id] = (S.elix[id] || 0) + 1; } }
    if (typeof Rhythm !== 'undefined' && Rhythm.botTown) Rhythm.botTown();
    P.hp = P.mhp; P.sta = P.msta; B.st.townVisits++;
  }

  // ---------- harci döntések ----------
  const ALIVE = e => !e.dead && !e.invisNow;
  function enemiesNear(r) { const P = G.P; return G.enemies.filter(e => ALIVE(e) && !e.ancient && dist(e, P) < r); }
  function pickTarget() {
    const P = G.P; let best = null, bs = 1e9;
    for (const e of G.enemies) {
      if (!ALIVE(e) || e.ancient || e.botSkip > G.t) continue; if (e.def.noShot && e.bossLink && e.bossLink.dead) continue;
      const d = dist(e, P); if (d > 700) continue;
      if (!e.boss && !e.bossLink && e.state !== 'chase' && !los(G.map, P.x, P.y, e.x, e.y) && d > 260) continue;
      let s = d;
      if (G.boss && !G.boss.dead && G.boss.links && G.boss.links.some(l => !l.dead)) { if (G.boss.links.includes(e)) s -= 600; if (e === G.boss) s += 400; }
      if (e.def.ai === 'exploder') s -= 120; if (e.def.ai === 'summoner') s -= 60;
      if (s < bs) { bs = s; best = e; }
    }
    return best;
  }
  const SKILL_USE = {
    forgoszel: (t, d) => enemiesNear(105).length >= 1, roham: (t, d) => d > 90 && d < 240, csatakialtas: () => enemiesNear(200).length >= 2,
    foldrenges: (t, d) => d < 200, pengevihar: () => enemiesNear(220).length >= 3 || G.boss && !G.boss.dead, tombolas: () => G.P.mp >= 70 && enemiesNear(120).length,
    tuzgolyo: (t, d) => d < 600, fagynova: () => enemiesNear(130).length >= 1, lancvillam: (t, d) => d < 450, meteor: (t, d) => d < 520,
    elemivihar: () => enemiesNear(400).length >= 3 || G.boss && !G.boss.dead, manarobbanas: () => G.P.mp >= G.P.mmp * 0.9 && enemiesNear(190).length >= 2,
    sortuz: (t, d) => d < 420, atuto: (t, d) => d < 650, granat: (t, d) => d < 360, visszavonulas: () => enemiesNear(90).length >= 1, legicsapas: () => enemiesNear(500).length >= 4 || G.boss && !G.boss.dead,
    golyoido: () => G.P.bulletTime ? enemiesNear(500).length === 0 : (enemiesNear(400).length >= 4 && G.P.mp > G.P.mmp * 0.5),
    dron: () => enemiesNear(600).length >= 1 && G.allies.filter(a => a.kind === 'dron' && !a.grey).length < 1 + Math.floor(skillRank(G.P, 'dron') / 2),
    loveg: () => enemiesNear(450).length >= 1, raketazapor: (t, d) => d < 500, javitoraj: () => G.P.hp < G.P.mhp * 0.6, holdraketa: () => enemiesNear(500).length >= 4 || G.boss && !G.boss.dead,
    tulfeszultseg: () => G.P.mp >= 60 && G.allies.filter(a => a.owner === G.P).length >= 2,
  };
  function threats() {
    const P = G.P, seen = B.seen;
    for (const t of G.teles) {
      if (t.own === 'p' || seen.has(t)) continue;
      if (t.line) { const dx = P.x - t.x, dy = P.y - t.y, al = dx * Math.cos(t.a) + dy * Math.sin(t.a), pr = Math.abs(-dx * Math.sin(t.a) + dy * Math.cos(t.a)); if (al > 0 && al < t.len && pr < t.w / 2 + P.r + 6 && t.delay - t.t < 0.5) { seen.add(t); if (RNG() < REACT) return t.a + Math.PI / 2 * (RNG() < 0.5 ? 1 : -1); } continue; }
      if (dist2(t.x, t.y, P.x, P.y) < (t.r + P.r + 4) ** 2 && t.delay - t.t < 0.55) { seen.add(t); if (RNG() < REACT) return Math.atan2(P.y - t.y, P.x - t.x) + RNG.range(-0.4, 0.4); }
    }
    for (const e of G.enemies) {
      if (e.dead || seen.has(e.windId)) continue; const d = dist(e, P);
      const danger = (e.wind > 0 && e.wind < 0.3 && d < e.r + P.r + 40) || (e.fuse > 0 && d < 95) || (e.charging > 0 && d < 160);
      if (danger) { e.windId = e.windId || {}; seen.add(e.windId); setTimeout(() => { }, 0); if (RNG() < REACT) return Math.atan2(P.y - e.y, P.x - e.x) + RNG.range(-0.6, 0.6); }
      if (!(e.wind > 0) && !(e.fuse > 0) && !(e.charging > 0)) e.windId = null;
    }
    return null;
  }

  // ---------- egy tick a pályán ----------
  function tickDungeon() {
    const P = G.P, S = G.S, m = G.map, prof = PROFILE[S.cls];
    Input.keys.clear(); Input.mdown = [false, false, false]; UI.overUI = false;
    if (P.chan) return; // csatornázás közben állunk
    if (G.S.inv.length >= INV_MAX - 1) town(); // tele a táska: hazaugrik (T), elad, visszajön
    // túlélés
    if (S.surv.kaja < 35) autoEat('kaja'); if (S.surv.ital < 35) autoEat('ital');
    if (P.hp < P.mhp * (0.38 + RNG() * 0.1) && S.potions > 0 && !(P.potCd > 0)) { G.drinkPotion(); B.st.pots++; }
    for (const id of ['ero', 'vasbor']) if (G.boss && !G.boss.dead && G.boss.intro && S.elix[id] > 0 && !P.buffs.some(b => b.id === 'elix_' + id)) drinkElix(id);
    // ős elől menekülés
    const anc = G.enemies.find(e => !e.dead && e.ancient && e.state === 'chase' && dist(e, P) < 500);
    // kitérés
    const th = threats(); if (th != null && dodge(th)) return;
    // célpont
    B.tgtT -= DT; if (B.tgtT <= 0 || !B.tgt || B.tgt.dead) { B.tgtT = 0.25; B.tgt = anc ? null : pickTarget(); }
    const t = B.tgt;
    if (t) {
      const d = dist(t, P); aimAt(t.x + RNG.range(-6, 6), t.y + RNG.range(-6, 6));
      if (t.wphase && m.mech === 'eh' && t.w !== P.w && P.wCd <= 0) Input.pressed.add(t.w < P.w ? 'z' : 'x');
      // képességek
      for (let i = 0; i < 5; i++) { const id = S.slots[i]; if (!id) continue; const f = SKILL_USE[id] || ((tt, dd) => dd < 400); if ((P.cds[id] || 0) <= 0 && f(t, d)) G.useSlot(i); }
      if (S.gate && (P.cds['g_' + S.gate] || 0) <= 0 && enemiesNear(300).length >= 2) G.useGate();
      const see = los(m, P.x, P.y, t.x, t.y), w = S.eq.fegyver, Bw = w ? BASES[w.base] : { kind: 'melee', range: 50 };
      if (Bw.kind === 'melee') { if (d < (Bw.range || 60) + t.r + 6 && see) Input.mdown[0] = true; else move(dirTo(t.x, t.y)); if (d < (Bw.range || 60) * 0.6) move(Math.atan2(P.y - t.y, P.x - t.x) + 1.4); }
      else {
        if (see && d < 600) Input.mdown[0] = true;
        if (!see || d > prof.keep + 120) move(dirTo(t.x, t.y));
        else if (d < prof.keep - 90) { const a = Math.atan2(P.y - t.y, P.x - t.x); move(a + (B.strafe || 0.5)); if (RNG() < DT * 0.4) B.strafe = -(B.strafe || 0.5); }
        else if (RNG() < 0.5) move(Math.atan2(t.y - P.y, t.x - P.x) + Math.PI / 2 * (B.strafe > 0 ? 1 : -1));
      }
      if (G.mapIs('egtorony') && G.gust) { /* a szél ellen nem tesz semmit – az átlagos játékos sem */ }
      B.stuckCheck();
      return;
    }
    // ha nincs ellenfél: pickupok, ládák, gyűjtés, felfedezés, kijárat
    B.goal = B.goal && !B.goal.dead && !B.goal.gone && !B.goal.open ? B.goal : null;
    if (!B.goal) B.goal = nextGoal(!!anc);
    const g = B.goal; if (!g) return;
    if (dist(g, P) < (g.kind && !g.type ? 8 : 56)) {
      if (g.kind && !g.type) { g.gone = g.gone || false; B.goal = null; return; }
      if (g.room) { g.room.botSeen = true; B.goal = null; return; }
      if (g.type === 'exit') { if (m.mech === 'eh' && P.w !== m.exitW) { if (P.wCd <= 0) Input.pressed.add(m.exitW < P.w ? 'z' : 'x'); return; } if (g.locked === 'radio') { B.morseT = (B.morseT || 0) + DT; if (B.morseT > 6) { g.locked = null; B.morseT = 0; } return; } }
      if (g.type === 'radio') { B.morseT = (B.morseT || 0) + DT; if (B.morseT > 6) { const ex = G.map.objs.find(o => o.type === 'exit'); if (ex) ex.locked = null; g.inter = null; B.morseT = 0; B.goal = null; } return; } // a Morse-t ~6 mp alatt fejti meg
      if (g.type === 'node' || g.type === 'chest' || g.type === 'shrine' || g.type === 'exit' || g.type === 'jelado') { if (g.inter) g.inter(g); g.botTries = (g.botTries || 0) + 1; if (g.type !== 'node' || g.botTries >= 2 || RNG() < 0.5) g.botDone = true; B.goal = null; }
      return;
    }
    move(dirTo(g.x, g.y)); aimAt(g.x, g.y); B.stuckCheck();
  }
  function nextGoal(flee) {
    const P = G.P, m = G.map, exit = m.objs.find(o => o.type === 'exit' && !o.dead);
    if (flee && exit) return exit;
    // fontos tárgyak a földön (kék és jobb, küldetéstárgy)
    for (const p of G.pickups) if (!p.gone && !(p.botSkipT > G.t) && (p.kind === 'quest' || (p.kind === 'item' && p.it.rar >= 1) || p.kind === 'gold' || p.kind === 'potion') && dist(p, P) < 350) return p;
    for (const o of m.objs) if (!o.dead && !o.botDone && !(o.botSkipT > G.t) && (o.type === 'chest' && !o.open || o.type === 'shrine' && !o.used || (o.type === 'node' && G.S.lvl > 2)) && dist(o, P) < 320) return o;
    // felfedezetlen termek, a legközelebbi
    const rooms = m.rooms.filter(r => !r.botSeen && !r.boss && !(r.botSkipT > G.t));
    for (const r of rooms) { const x = (r.cx + 0.5) * TILE, y = (r.cy + 0.5) * TILE; if (Math.abs(P.x - x) < r.w * TILE / 2 && Math.abs(P.y - y) < r.h * TILE / 2) r.botSeen = true; }
    const left = rooms.filter(r => !r.botSeen);
    if (left.length && B.floorT < 900) { let best = null, bd = 1e9; const f = field(m, Math.floor(P.x / TILE), Math.floor(P.y / TILE)); for (const r of left) { const d = f[r.cy * m.w + r.cx]; if (d < bd) { bd = d; best = r; } } if (best && bd < 1e8) { const gg = { x: (best.cx + 0.5) * TILE, y: (best.cy + 0.5) * TILE, room: best }; Object.defineProperty(gg, 'botSkipT', { set(v) { best.botSkipT = v; } }); return gg; } else left.forEach(r => r.botSeen = true); }
    if (m.mech === 'jeltoro' && exit && exit.locked) { const rd = m.objs.find(o => o.type === 'radio'); if (rd && dist(rd, P) > 60 && !B.radioSeen) { B.radioSeen = true; return rd; } }
    if (exit) return exit;
    const br = m.rooms.find(r => r.boss); if (br) return { x: (br.cx + 0.5) * TILE, y: (br.cy + 0.5) * TILE, room: br };
    return null;
  }

  // ---------- terv, mérés ----------
  function plan() { const out = []; for (const R of REGIONS) for (let f = 1; f <= R.floors; f++) out.push([R.id, f]); out.push(['eh', 5]); return out; }
  function rec() { const k = B.plan[B.pi].join(':'); return B.res[k] || (B.res[k] = { k, deaths: 0, t: 0, lvlIn: G.S.lvl, lvlOut: 0, area: 0, pots: 0, done: false }); }
  function enterCur() {
    const [rid, f] = B.plan[B.pi]; town(); G.enterDungeon(rid, f); B.floorMap = G.map; B.floorT = 0; B.goal = null; B.tgt = null; B.seen = new WeakSet(); B.radioSeen = false;
    const r = rec(); r.area = G.map.lvl;
  }
  function init(cls, opt = {}) {
    localStorage.clear(); RNG = makeRng(opt.seed || 12345);
    // determinisztikus futás: a pályamag és a Math.random is a botórához kötve
    const mr = makeRng((opt.seed || 12345) ^ 0x51ed); Math.random = mr; Date.now = () => 1.7e12 + Math.floor((B ? B.time : 0) * 1000);
    const S = newSave(cls, 'Bot'); Save.write(0, S); G.start(S, 0); UI.acts.closeOver();
    B = { cls, plan: plan(), pi: 0, res: {}, attrI: 0, nodeN: 0, tgtT: 0, strafe: 0.5, seen: new WeakSet(), time: 0, floorT: 0, st: { dodges: 0, pots: 0, equips: 0, townVisits: 0 }, finished: false, gaveUp: null, seed: opt.seed || 12345 };
    B.stuckCheck = () => { const P = G.P; B.sc = B.sc || { x: P.x, y: P.y, t: 0 }; B.sc.t += DT; if (B.sc.t > 3) { if (Math.hypot(P.x - B.sc.x, P.y - B.sc.y) < 24) { if (B.goal) B.goal.botSkipT = G.t + 40; B.goal = null; if (B.tgt) B.tgt.botSkip = G.t + 20; B.tgt = null; Input.keys.clear(); move(RNG() * 6.28); Input.pressed.add(' '); } B.sc = { x: P.x, y: P.y, t: 0 }; } };
    enterCur();
  }
  function run(sec) {
    const end = B.time + sec;
    while (B.time < end && !B.finished) {
      const P = G.P, S = G.S;
      if (P.dead) {
        rec().deaths++; B.deathsHere = (B.deathsHere || 0) + 1;
        document.querySelector('#over').style.display = 'none'; G.enterTown(true); P.dead = false;
        if (B.deathsHere > 25) { B.gaveUp = B.plan[B.pi].join(':'); B.finished = true; break; }
        enterCur(); continue;
      }
      if (G.map !== B.floorMap) { // lejárattal átléptünk a következő szintre
        const r = rec(); r.done = true; r.lvlOut = S.lvl; r.pots = B.st.pots - (r.pots0 || 0); B.pi++; B.deathsHere = 0;
        if (B.pi >= B.plan.length) { B.finished = true; break; }
        const [rid, f] = B.plan[B.pi]; const ns = rec(); ns.area = G.map.lvl; ns.pots0 = B.st.pots;
        if (G.map.rid !== rid || G.map.floor !== f) { enterCur(); }
        else { B.floorMap = G.map; B.floorT = 0; B.goal = null; B.tgt = null; B.radioSeen = false; if (S.potions <= 2 || S.surv.ebren < 30) { town(); } }
        continue;
      }
      if (G.boss && G.boss.dead && !B.bossDone) { // boss legyőzve
        B.bossDone = true; const r = rec(); r.done = true; r.lvlOut = S.lvl;
        B.pi++; B.deathsHere = 0; B.bossDone = false;
        if (B.pi >= B.plan.length || G.boss.bossId === 'szingularitas') { B.finished = true; break; }
        G.enterTown(); enterCur(); continue;
      }
      try { tickDungeon(); } catch (e) { B.err = String(e && e.stack || e); }
      G.update(DT); Input.endFrame(); B.time += DT; B.floorT += DT; rec().t += DT;
      if (B.floorT > 1800) { B.gaveUp = B.plan[B.pi].join(':') + ' (időtúllépés) ' + JSON.stringify(dbg()).slice(0, 300); B.finished = true; }
    }
    return { time: B.time, pi: B.pi, of: B.plan.length, lvl: G.S.lvl, finished: B.finished, gaveUp: B.gaveUp, err: B.err };
  }
  function report() { B.st.perfect = G.S.stats.perfect || 0; B.st.reactions = G.S.stats.reactions || 0; B.st.path = Object.keys(G.S.skills).filter(k => SKILLS[k] && SKILLS[k].ut).map(k => k + G.S.skills[k]).join(','); return { cls: B.cls, res: Object.values(B.res), st: B.st, time: B.time, lvl: G.S.lvl, gaveUp: B.gaveUp, gold: G.S.gold, kills: G.S.stats.kills }; }
  function dbg() { const g = B.goal, P = G.P; return { g: g && { x: g.x | 0, y: g.y | 0, type: g.type, kind: g.kind, room: !!g.room, tries: g.botTries }, P: [P.x | 0, P.y | 0], chan: P.chan && P.chan.label, inv: G.S.inv.length, rooms: G.map.rooms.filter(r => !r.botSeen).length, ft: B.floorT | 0, ng: (() => { try { const x = nextGoal(false); return x && [x.type, x.kind, x.x | 0, x.y | 0, !!x.room]; } catch (e) { return String(e); } })(), t: B.tgt && [B.tgt.type, B.tgt.x | 0, B.tgt.y | 0, B.tgt.state, B.tgt.hp | 0] }; }
  function jump(pi) { // hibakereséshez: ugrás a terv adott pontjára, a szintet a területhez igazítva
    B.pi = pi; const [rid, f] = B.plan[pi]; const S = G.S; while (S.lvl < REGION[rid].lvl + f - 1) { S.lvl++; S.attrPts += 5; S.skillPts++; }
    S.prog.unlocked = REGIONS.slice(0, REGIONS.findIndex(r => r.id === rid) + 1).map(r => r.id); recalc(G.P); enterCur();
  }
  return { init, run, report, dbg, jump };
})();
// régi buildhez: ha nincs elágazó képességfa, minden tanulható
if (typeof Skills2 === 'undefined') window.Skills2 = { canLearn: () => true };
