// ============================================================
//  JÁTÉKMOTOR: világ, harc, MI, tárgyak a földön, objektumok
// ============================================================
const G = {
  scene: 'menu', t: 0, paused: false, S: null, P: null, map: null, staticLayer: null, pal: null,
  enemies: [], projs: [], allies: [], teles: [], grounds: [], pickups: [], parts: [], texts: [], timers: [], lobs: [], beams: [],
  cam: { x: 0, y: 0, shake: 0 }, fieldT: 0, grid: new Map(), listeners: [], envT: 0, gust: null, boss: null, slot: 0,
  ctx: null, W: 1280, H: 720, autoItems: true, flash: 0, darkBoost: 0, retPortal: null,

  // ---------- segédek ----------
  later(t, fn) { this.timers.push({ t, fn }); },
  shake(a) { this.cam.shake = Math.max(this.cam.shake, a); },
  // hitstop: a világ egy pillanatra megáll a találat súlyától (felülről korlátozva, hogy ne akadjon)
  hitStop(t) { if (this.t - (this.lastStop || -1) < 0.12 && t < 0.06) return; this.lastStop = this.t; this.hitstop = Math.min(0.12, Math.max(this.hitstop || 0, t)); },
  text(x, y, s, c = '#fff', size = 13, o = {}) { this.texts.push({ x: x + RNG.range(-6, 6), y, s: String(s), c, size, t: 0, life: o.life || 0.9, vy: o.vy || -38 }); if (this.texts.length > 120) this.texts.shift(); },
  burst(x, y, c, n = 10, spd = 120, life = 0.5, size = 3, o = {}) { for (let i = 0; i < n; i++) { if (this.parts.length > 900) this.parts.shift(); const a = RNG() * 6.283, s = spd * (0.3 + RNG() * 0.7); this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: life * (0.6 + RNG() * 0.6), c, size: size * (0.6 + RNG() * 0.8), drag: o.drag || 2.5, glow: o.glow, grav: o.grav || 0 }); } },
  fxRing(x, y, r, c, life = 0.4, w = 3) { this.parts.push({ ring: true, x, y, r, c, t: 0, life, w }); },
  emit(ev, d) { if (typeof Quests !== 'undefined') Quests.on(ev, d); },
  mapIs(id) { return this.map && this.map.region === id; },
  inTown() { return this.map && (this.map.region === 'varos' || this.map.region === 'otthon'); },
  diffLvl() { return [0, 30, 55][this.S.prog.diff] || 0; },

  // ---------- térbeli rács az ellenfelekhez ----------
  rebuildGrid() {
    const g = this.grid; g.clear();
    for (const e of this.enemies) { if (e.dead) continue; const k = ((e.x / 96) | 0) + ',' + ((e.y / 96) | 0); let a = g.get(k); if (!a) g.set(k, a = []); a.push(e); }
  },
  near(x, y, r) {
    const out = [], x0 = ((x - r) / 96) | 0, x1 = ((x + r) / 96) | 0, y0 = ((y - r) / 96) | 0, y1 = ((y + r) / 96) | 0;
    for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) { const a = this.grid.get(gx + ',' + gy); if (a) for (const e of a) if (!e.dead && dist2(x, y, e.x, e.y) < (r + e.r) * (r + e.r)) out.push(e); }
    return out;
  },
  nearestEnemy(x, y, range, needLos = true, exclude) {
    let best = null, bd = range * range;
    for (const e of this.enemies) { if (e.dead || e === exclude || e.invisNow) continue; const d = dist2(x, y, e.x, e.y); if (d < bd && (!needLos || los(this.map, x, y, e.x, e.y))) { bd = d; best = e; } }
    return best;
  },
  breakables(x, y, r) { return this.map.objs.filter(o => o.hp > 0 && dist2(x, y, o.x, o.y) < (r + (o.r || 14)) ** 2); },

  // ---------- támadások ----------
  hitArea(x, y, r, dmg, dt, own, o = {}) {
    if (o.fx) this.fxArea(x, y, r, o.fx, dt);
    if (own === 'p' || own === 'env') {
      if (o.splash !== false && own === 'p' && o.isSplash) r *= 1 + this.P.st.splashr / 100;
      for (const e of this.near(x, y, r)) this.hurtEnemy(e, dmg, dt, { ...o, kx: x, ky: y });
      if (own === 'p') for (const b of this.breakables(x, y, r)) this.hitObj(b, dmg);
    }
    if (own === 'e' || own === 'env') { const P = this.P; if (dist2(x, y, P.x, P.y) < (r + P.r) ** 2) this.hurtPlayer(dmg && dmg.a != null ? dmg.a : dmg, dt, o.src, o); }
  },
  arc(x, y, a, arc, range, dmg, dt, o = {}) {
    if (o.fx) this.fxArc(x, y, a, arc, range, o.fx); let n = 0;
    for (const e of this.near(x, y, range)) { const d = angDiff(a, Math.atan2(e.y - y, e.x - x)); if (Math.abs(d) <= arc / 2 + Math.atan2(e.r, Math.max(1, Math.hypot(e.x - x, e.y - y)))) { this.hurtEnemy(e, dmg, dt, { ...o, kx: x, ky: y }); n++; } }
    for (const b of this.breakables(x, y, range)) { const d = angDiff(a, Math.atan2(b.y - y, b.x - x)); if (Math.abs(d) <= arc / 2 + 0.3) this.hitObj(b, dmg); }
    return n;
  },
  screenHit(dmg, dt, o = {}) {
    const P = this.P, hw = this.W / 2 + 60, hh = this.H / 2 + 60;
    this.flash = 0.6; if (o.fx === 'slash') { for (let i = 0; i < 5; i++) this.parts.push({ slash: true, x: P.x, y: P.y, a: RNG() * 6.283, t: 0, life: 0.5, c: '#fff' }); }
    if (o.fx === 'burpnuke') { this.fxRing(P.x, P.y, 900, '#ff9be0', 1.2, 30); this.fxRing(P.x, P.y, 600, '#ffd0f0', 1, 18); }
    for (const e of this.enemies) if (!e.dead && Math.abs(e.x - P.x) < hw && Math.abs(e.y - P.y) < hh) { this.hurtEnemy(e, { a: dmg.a, c: true }, dt, { stun: o.stun, kx: P.x, ky: P.y, knock: 120, noReflect: true }); this.burst(e.x, e.y, '#fff', 8, 200); }
  },
  chain(x, y, tx, ty, jumps, dmg, dt) {
    let from = { x, y }; let tgt = null, bd = 1e12;
    for (const e of this.enemies) { if (e.dead) continue; const d = dist2(tx, ty, e.x, e.y); if (d < bd && d < 260 * 260 && los(this.map, x, y, e.x, e.y)) { bd = d; tgt = e; } }
    if (!tgt) tgt = this.nearestEnemy(x, y, 380);
    const hit = new Set();
    for (let i = 0; i <= jumps && tgt; i++) {
      this.parts.push({ bolt: true, x1: from.x, y1: from.y, x2: tgt.x, y2: tgt.y, t: 0, life: 0.25, c: '#f4f06a' });
      this.hurtEnemy(tgt, { a: dmg.a * Math.pow(0.88, i), c: dmg.c }, dt, { shock: 2 }); hit.add(tgt); from = tgt;
      let nx = null, nd = 220 * 220; for (const e of this.enemies) { if (e.dead || hit.has(e)) continue; const d = dist2(from.x, from.y, e.x, e.y); if (d < nd) { nd = d; nx = e; } }
      tgt = nx;
    }
    if (!hit.size) this.parts.push({ bolt: true, x1: x, y1: y, x2: tx, y2: ty, t: 0, life: 0.2, c: '#f4f06a' });
  },
  proj(o) { o.t = 0; o.life = o.life || 2.2; o.vx = Math.cos(o.a) * o.spd; o.vy = Math.sin(o.a) * o.spd; o.hit = o.hit || new Set(); o.pierce = o.pierce || 0; this.projs.push(o); return o; },
  tele(x, y, r, delay, dmg, dt, own, o = {}) { this.teles.push({ x, y, r, delay, t: 0, dmg, dt, own, o }); },
  lob(x0, y0, x1, y1, t, r, dmg, dt, o) { this.lobs.push({ x0, y0, x1, y1, t: 0, dur: t, r, dmg, dt, o }); },
  mine(x, y, r, dmg, dt) { this.allies.push({ kind: 'mine', x, y, r: 10, life: 12, trig: r, dmg, dt, owner: this.P }); },
  ground(x, y, r, t, dps, dt, own) { this.grounds.push({ x, y, r, t, life: t, dps, dt, own, tick: 0 }); },
  dash(ent, a, d, t, o = {}) { ent.dash = { vx: Math.cos(a) * d / t, vy: Math.sin(a) * d / t, t, o, hit: new Set() }; if (o.invul) ent.invul = Math.max(ent.invul || 0, t + 0.05); },
  blink(ent, x, y) {
    const m = this.map; let tx = x, ty = y;
    for (let i = 0; i < 12 && solidAt(m, tx, ty); i++) { tx = lerp(tx, ent.x, 0.15); ty = lerp(ty, ent.y, 0.15); }
    if (solidAt(m, tx, ty)) return;
    this.burst(ent.x, ent.y, '#dfefff', 14, 160); ent.x = tx; ent.y = ty; this.burst(tx, ty, '#dfefff', 14, 160);
  },
  buff(ent, id, t, mods) { const ex = ent.buffs.find(b => b.id === id); if (ex) { ex.t = t; ex.mods = mods; } else ent.buffs.push({ id, t, mods }); if (ent === this.P) recalc(ent); },
  ally(o) { o.t = 0; if ((o.kind === 'dron' || o.kind === 'torony') && !o.grey && this.P.st.gepesz) o.life *= 1 + 0.15 * this.P.st.gepesz; if (o.x == null) { o.x = o.owner.x + RNG.range(-20, 20); o.y = o.owner.y + RNG.range(-20, 20); } o.cd = RNG() * 0.4; o.r = o.r || 8; this.allies.push(o); },
  allyCap(kind, max) { const mine = this.allies.filter(a => a.kind === kind && !a.grey); while (mine.length >= max) { const a = mine.shift(); a.life = 0; } },
  freeSpot(x, y, from) { const m = this.map; let tx = x, ty = y; for (let i = 0; i < 20 && solidAt(m, tx, ty); i++) { tx = lerp(tx, from.x, 0.1); ty = lerp(ty, from.y, 0.1); } return { x: tx, y: ty }; },

  // ---------- sebzés: ellenfél ----------
  hurtEnemy(e, dmg, dt, o = {}) {
    if (e.dead) return;
    const P = this.P;
    if (e.wphase && this.mapIs('eh') && e.w !== P.w) { if (RNG() < 0.15) this.text(e.x, e.y - 20, 'más W-n', '#c48cff', 11); return; }
    let amt = dmg && dmg.a != null ? dmg.a : (dmg || 0), crit = dmg && dmg.c;
    if (amt <= 0 && !o.fear && !o.stun && !o.freeze) return;
    if (e.immune) { if (amt > 0 && RNG() < 0.3) this.text(e.x, e.y - e.r, 'SEBEZHETETLEN', '#aaa', 12); amt = 0; }
    if (e.shieldMul) amt *= e.shieldMul;
    amt = Reactions.apply(e, amt, dt, o);
    if (o.ccBonus && (e.stun > 0 || e.fear > 0)) amt *= o.ccBonus;
    if (o.rage && CLASSES[this.S.cls].rage) P.mp = Math.min(P.mmp, P.mp + o.rage);
    if (o.machine && e.tmark > 0) amt *= 1.15;
    let res = (e.res[dt] || 0) - (e.shock > 0 ? 20 : 0); amt *= 1 - clamp(res, -100, 90) / 100;
    if (dt === 'fiz' && !P.fx.furo) amt *= 100 / (100 + e.armor);
    if (P.fx.furo && RNG() < 0.25) { amt *= 2; crit = true; }
    if (e.mark > 0) amt *= 1 + P.st.mark / 100;
    if (P.fx.viragpor && e.slow > 0) amt *= 1.2;
    if (o.far && Math.hypot(e.x - P.x, e.y - P.y) > 250) amt *= 1 + P.st.farp / 100;
    if (amt > 0) {
      e.hp -= amt; e.flash = 0.1; e.hurtT = 0.3; e.hitT = 0.14; P.combatT = 4;
      // a találat súlya: közelharcban megáll a világ, kritikusnál jobban
      if (o.melee && !o.noStop) { this.hitStop((o.stop || 0.035) + (crit ? 0.03 : 0)); if (crit) Audio2.play('crit'); }
      else if (crit && (o.basic || o.ranged)) { this.hitStop(0.018); Audio2.play('crit'); }
      if (e.state !== 'chase') this.aggro(e);
      this.text(e.x, e.y - e.r - 6, Math.round(amt), crit ? '#ffe14d' : DT[dt].c, crit ? 17 : 12, { vy: crit ? -55 : -38 });
      { const ls = P.st.ls + (P.st.verszomj && P.hp < P.mhp / 2 ? 2 * P.st.verszomj : 0); if (ls && o.basic) P.hp = Math.min(P.mhp, P.hp + amt * ls / 100); }
      if (o.basic && o.ranged) Focus.onHit(P, e);
      if (P.fx.sziv && o.melee) P.hp = Math.min(P.mhp, P.hp + amt * 0.04);
      if (e.vamp) e.hp = Math.min(e.mhp, e.hp + 0);
      if (e.mods.includes('villamos') && RNG() < 0.12 && !o.noReflect) for (let i = 0; i < 4; i++) this.proj({ x: e.x, y: e.y, a: i * 1.57 + RNG(), spd: 280, r: 4, dmg: e.dmg * 0.6, dt: 'villam', own: 'e', kind: 'spark', life: 1.4, src: e });
    }
    if (o.burn) e.burn = { dps: amt * 0.18 * (1 + P.st.burnp / 100), t: o.burn };
    if (o.freeze) { const f = o.freeze * (1 + (P.st.freezeMul || 0) / 100) * (e.brittle > 0 ? 1.5 : 1); e.freeze = Math.max(e.freeze, e.boss ? f * 0.3 : f); }
    if (o.tmark) e.tmark = 2.5;
    if (o.slow) e.slow = Math.max(e.slow, o.slow);
    if (o.shock) e.shock = o.shock;
    if (o.stun) e.stun = Math.max(e.stun, e.boss || e.ancient ? Math.min(1, o.stun * 0.35) : o.stun);
    if (o.fear && !e.boss) e.fear = o.fear;
    if (P.st.mark && (o.ranged || o.k === 'ranged')) e.mark = 4;
    if (o.knock && !e.boss && !e.ancient && e.def.ai !== 'turret') {
      // tömeg: a nagy test, az elit és a „nehéz” kevésbé repül
      const a = Math.atan2(e.y - (o.ky ?? P.y), e.x - (o.kx ?? P.x)), mass = Math.max(0.8, e.r / 12) * (e.heavy ? 3 : 1) * (e.elite || e.champion ? 1.4 : 1);
      const k = o.knock / mass; e.kbx = Math.cos(a) * k * 3; e.kby = Math.sin(a) * k * 3; if (o.knock >= 150 && e.wind > 0) { e.wind = 0; e.cd = Math.max(e.cd, 0.6); this.text(e.x, e.y - e.r - 14, 'megtört', '#ffd27a', 11); }
    }
    if (e.hp <= 0) { if (o.melee) this.hitStop(0.05); this.killEnemy(e, o); }
  },
  aggro(e) {
    e.state = 'chase';
    for (const o of this.near(e.x, e.y, 260)) if (o.state !== 'chase' && !o.ancient) o.state = 'chase';
  },
  killEnemy(e, o = {}) {
    if (e.dead) return; e.dead = true; const P = this.P, S = this.S;
    this.burst(e.x, e.y, e.look.c, e.boss ? 60 : 16, e.boss ? 300 : 160, 0.7, e.boss ? 5 : 3);
    this.burst(e.x, e.y, e.look.c2 || '#fff', 6, 90, 0.5, 2);
    // tapasztalat
    const diffL = e.lvl - P.lvl; let xm = diffL < -6 ? Math.max(0.15, 1 + (diffL + 6) * 0.12) : diffL > 0 ? 1 + diffL * 0.1 : 1;
    const xp = Math.round(e.xp * xm); this.gainXp(xp); Exped.onKill(e, xp);
    S.stats.kills++; if (e.elite || e.named) S.stats.elites++;
    if (P.st.killMp) P.mp = Math.min(P.mmp, P.mp + P.st.killMp);
    if (P.st.fagyelme && e.freeze > 0) P.mp = Math.min(P.mmp, P.mp + 4 * P.st.fagyelme);
    if (P.bulletTime) P.mp = Math.min(P.mmp, P.mp + 6); // Golyóidő: az ölés visszaad a belső időből
    if (P.fx.bika) { const b = P.buffs.find(b => b.id === 'bika'); const n = Math.min(3, (b ? b.n : 0) + 1); this.buff(P, 'bika', 2, { aspd: 25 * n }); P.buffs.find(b => b.id === 'bika').n = n; }
    if (P.fx.mehraj && RNG() < 0.3) this.ally({ kind: 'meh', owner: P, x: e.x, y: e.y, life: 10, dmgMul: 0.35, rate: 0.6, range: 260 });
    if (P.fx.penrose) { P.mp = Math.min(P.mmp, P.mp + 4); if (RNG() < 0.1) for (const k in P.cds) P.cds[k] = Math.max(0, P.cds[k] - 1); }
    if (e.mods.includes('sokszor') && !e.split) for (let i = 0; i < 2; i++) { const c = this.spawnEnemy(e.type, e.x + RNG.range(-14, 14), e.y + RNG.range(-14, 14), e.lvl, {}); c.mhp = c.hp = e.mhp * 0.3; c.split = true; c.state = 'chase'; c.r *= 0.8; }
    if (e.def.onDeath === 'honey') this.ground(e.x, e.y, 50, 6, 0, 'fiz', 'honey');
    this.dropLoot(e);
    this.emit('kill', e);
    if (e.boss) this.bossDefeated(e);
    if (e.ancient) this.ancientDefeated(e);
    if (e.named) this.emit('named', e.named);
  },
  gainXp(n) {
    const S = this.S; if (S.lvl >= MAX_LVL) return; n = Math.round(n * (1 + ((this.P.st && this.P.st.xpb) || 0) / 100)); S.xp += n;
    while (S.lvl < MAX_LVL && S.xp >= xpNeed(S.lvl)) {
      S.xp -= xpNeed(S.lvl); S.lvl++; S.attrPts += 5; S.skillPts += 1;
      recalc(this.P); this.P.hp = this.P.mhp; this.P.mp = this.P.mmp;
      this.fxRing(this.P.x, this.P.y, 120, '#ffe14d', 0.8, 6); this.burst(this.P.x, this.P.y, '#ffe14d', 40, 240, 1);
      Audio2.play('level'); UI.toast(`Szintlépés! ${S.lvl}. szint – +5 tulajdonságpont, +1 képességpont`, '#ffe14d', 4);
      this.emit('level', S.lvl);
    }
  },

  // ---------- sebzés: játékos ----------
  hurtPlayer(amt, dt, src, o = {}) {
    const P = this.P; if (!P || P.dead || this.scene !== 'play') return;
    if (!o.pure) {
      if (P.invul > 0 || this.godmode) { if (P.dash && P.perfectT > 0 && (src || o.fx)) this.perfectDodge(src); return; }
      if (P.st.block && RNG() * 100 < P.st.block) { this.text(P.x, P.y - 24, 'Kivédve', '#9fd8ff', 13); const rp = P.st.riposte || (P.st.bastya ? 0.8 : 0); if (src && rp && !src.dead) this.hurtEnemy(src, P.roll(rp, 'melee'), P.wdt(), { melee: true }); if (CLASSES[this.S.cls].rage) P.mp = Math.min(P.mmp, P.mp + 4); return; }
      const sl = src ? src.lvl : this.S.lvl;
      if (dt === 'fiz') amt *= 1 - P.st.arm / (P.st.arm + 60 + 14 * sl); else amt *= 1 - (P.st.res[dt] || 0) / 100;
      if (this.S.prog.diff === 2) amt *= 1.2;
      if (P.st.bastya && P.mp >= 50) amt *= 1 - 0.05 * P.st.bastya;
      // a Pengelovag a kapott ütésből is dühöt merít (a Bástya úton jóval többet)
      if (CLASSES[this.S.cls].rage && src) P.mp = Math.min(P.mmp, P.mp + Math.min(15, amt / P.mhp * 60) * (1 + 0.5 * (P.st.bastya || 0)));
      if (P.shieldV > 0) { const ab = Math.min(P.shieldV, amt); P.shieldV -= ab; amt -= ab; this.fxRing(P.x, P.y, 20, '#9fe8ff', 0.2, 2); }
      P.shieldT = 0; P.combatT = 4;
      if (src && P.st.thorns && !src.dead && dist(src, P) < 120) this.hurtEnemy(src, { a: P.st.thorns, c: false }, 'fiz', { noReflect: true });
      if (src && P.fx.papucs && RNG() < 0.15 && !src.dead) { src.stun = Math.max(src.stun, 1); this.parts.push({ papucs: true, x1: P.x, y1: P.y, x2: src.x, y2: src.y, t: 0, life: 0.35 }); this.text(src.x, src.y - 20, 'PAPUCS!', '#ff9be0', 12); }
      if (src && src.vamp) src.hp = Math.min(src.mhp, src.hp + amt * 0.3);
      if (P.chan) { P.chan = null; UI.toast('A kapunyitás megszakadt.', '#ff7a7a'); }
    }
    if (amt <= 0) return;
    P.hp -= amt;
    if (!o.silent) { this.text(P.x, P.y - 22, Math.round(amt), '#ff5555', 13); P.hurtT = 0.25; this.hurtFlash = Math.min(0.5, 0.15 + amt / P.mhp * 2); Audio2.play('hurt'); this.shake(Math.min(7, 2 + amt / P.mhp * 30)); if (amt > P.mhp * 0.12) this.hitStop(0.05); }
    if (P.fx.mag && P.hp < P.mhp * 0.3 && !(P.magT > 0)) { P.magT = 30; P.shieldV += P.mhp * 0.25; this.buff(P, 'magma', 5, { armp: 50 }); UI.toast('Magmapajzs!', '#ff7a2a'); }
    if (P.hp <= 0) this.playerDie(src);
  },
  perfectDodge(src) {
    const P = this.P, C = CLASSES[this.S.cls]; if (P.perfectUsed) return; P.perfectUsed = true;
    // jutalom a jó időzítésért: állóképesség vissza, rövid lassítás, erőforrás, és a következő 1,5 mp ütései erősebbek
    P.sta = Math.min(P.msta, P.sta + DODGE_COST * 0.8); this.slowmo = 0.35;
    if (P.st.gerilla) for (const k in P.cds) P.cds[k] = Math.max(0, P.cds[k] - P.st.gerilla);
    if (C.rage) P.mp = Math.min(P.mmp, P.mp + 18); else P.mp = Math.min(P.mmp, P.mp + P.mmp * 0.08);
    this.buff(P, 'tokeletes', 1.5, { dmgp: 35, crit: 25 });
    this.text(P.x, P.y - 34, 'TÖKÉLETES KITÉRÉS', '#dff8ff', 13, { life: 1.1 }); this.fxRing(P.x, P.y, 46, '#dff8ff', 0.4, 3); Audio2.play('perfect');
    this.S.stats.perfect = (this.S.stats.perfect || 0) + 1; this.emit('perfect');
  },
  playerDie(src) {
    const P = this.P, S = this.S; if (P.dead) return; P.dead = true; P.hp = 0;
    S.stats.deaths++; Audio2.play('die'); this.burst(P.x, P.y, '#ff3355', 50, 240, 1.2, 4);
    const lost = Math.floor(S.gold * 0.08); S.gold -= lost; { const X = Exped.st(); X.lost = X.bank; X.bank = 0; }
    this.retPortal = null;
    setTimeout(() => UI.deathScreen(src ? (src.nameTxt || src.def.nev) : 'a kimerülés', lost), 900);
  },

  // ---------- zsákmány ----------
  dropLoot(e) {
    const P = this.P, S = this.S, mf = P.st.mf + this.S.prog.diff * 40 + Exped.mf();
    const ilvl = Math.min(90, e.lvl);
    const drop = (k, v, it) => { const a = RNG() * 6.283, d = RNG() * 30; this.pickups.push({ kind: k, v, it, x: e.x + Math.cos(a) * d, y: e.y + Math.sin(a) * d, t: 0, vy: -120 - RNG() * 80, z: 0 }); };
    let itemN = 0, minRar = 0;
    if (e.boss) { itemN = 4 + this.S.prog.diff; minRar = 2; }
    else if (e.ancient) { itemN = 6; minRar = 3; }
    else if (e.named) { itemN = 2; minRar = 1; }
    else if (e.champion) itemN = RNG() < 0.8 ? 1 : 2;
    else if (e.elite) itemN = RNG() < 0.45 ? 1 : 0;
    else itemN = RNG() < 0.085 * (1 + mf / 300) ? 1 : 0;
    for (let i = 0; i < itemN; i++) {
      let o = { mf, cls: S.cls, minRar: i === 0 ? minRar : 0 };
      const relicCh = e.boss ? 0.3 : e.ancient ? 1 : e.named ? 0.12 : e.elite ? 0.012 : 0.0012;
      if (RNG() < relicCh * (i === 0 ? 1 : 0.3)) { const pool = RELICS.filter(r => r.minL <= ilvl + 2); if (pool.length) o = { relic: (e.ancient && i === 0 && e.ancient.relic) || RNG.pick(pool).id }; }
      drop('item', 0, genItem(ilvl, RNG, o));
    }
    const gch = e.boss ? 1 : e.elite ? 0.8 : 0.32;
    if (RNG() < gch) drop('gold', Math.round((3 + e.lvl * 2.2) * (e.boss ? 15 : e.elite ? 3 : 1) * RNG.range(0.6, 1.4) * (1 + P.st.gf / 100)));
    if (RNG() < (e.boss ? 1 : e.elite ? 0.25 : 0.045)) drop('potion', 1);
    if (RNG() < (e.boss ? 1 : e.elite ? 0.3 : 0.06)) { const pool = FOOD_DROPS[this.map.region] || FOOD_DROPS.hasadek; drop('food', RNG.pick(pool)); }
    const R = REGION[this.map.region] || REGION[this.map.mixRegion];
    if (R && RNG() < (e.boss ? 1 : e.elite ? 0.5 : 0.08)) drop('mat', R.mat);
    if (e.def.drop === 'gyemant' && RNG() < 0.35) drop('quest', 'gyemant');
    Quests.lootHook(e, drop);
  },
  spawnPickup(x, y, kind, v, it) { this.pickups.push({ kind, v, it, x, y, t: 0, vy: -100, z: 0 }); },
  pickUp(p) {
    const S = this.S, P = this.P;
    switch (p.kind) {
      case 'gold': S.gold += p.v; S.stats.gold += p.v; Audio2.play('gold'); this.text(p.x, p.y - 10, '+' + p.v + ' arany', '#ffd34d', 11); break;
      case 'potion': S.potions = Math.min(this.potMax(), S.potions + 1); Audio2.play('pickup'); this.text(p.x, p.y - 10, '+1 ital', '#ff5577', 11); break;
      case 'food': S.food[p.v] = (S.food[p.v] || 0) + 1; Audio2.play('pickup'); this.text(p.x, p.y - 10, FOODS[p.v].ikon + ' ' + FOODS[p.v].nev, '#e8d7b0', 11); break;
      case 'mat': S.mats[p.v] = (S.mats[p.v] || 0) + 1; Audio2.play('pickup'); this.text(p.x, p.y - 10, '+1 ' + MATS[p.v].nev, MATS[p.v].c, 11); this.emit('mat', p.v); break;
      case 'quest': Quests.pickQuestItem(p.v); Audio2.play('legend'); break;
      case 'item':
        if (S.inv.length >= INV_MAX) { if (!this.fullWarn || this.t - this.fullWarn > 3) { UI.toast('A táskád tele van! (I)', '#ff7a7a'); this.fullWarn = this.t; } return false; }
        S.inv.push(p.it); Audio2.play(p.it.rar >= 3 ? 'legend' : 'pickup');
        this.text(p.x, p.y - 12, p.it.nev, RARITY[p.it.rar].c, p.it.rar >= 3 ? 14 : 11, { life: 1.6 });
        if (p.it.rar >= 3) UI.toast(`${p.it.rar === 4 ? 'Ereklye' : 'Legendás tárgy'}: ${p.it.nev}`, RARITY[p.it.rar].c, 4);
        UI.dirty = true; break;
    }
    return true;
  },
  potMax() { return 5 + Math.floor(this.S.potLvl * 1.5); },
  drinkPotion() {
    const S = this.S, P = this.P; if (S.potions <= 0) { UI.toast('Nincs több gyógyitalod.', '#ff7a7a'); return; }
    if (P.potCd > 0) return; S.potions--; P.potCd = 1;
    const heal = P.mhp * (0.32 + 0.06 * S.potLvl) * (1 + P.st.potion / 100);
    this.buff(P, 'ital', 3, { hot: heal / 3 }); P.mp = Math.min(P.mmp, P.mp + P.mmp * 0.25);
    Audio2.play('potion'); this.burst(P.x, P.y, '#ff5577', 14, 80, 0.6);
  },

  // ---------- objektumok ----------
  hitObj(b, dmg) { b.hp -= dmg && dmg.a != null ? dmg.a : dmg; this.burst(b.x, b.y, '#c69a62', 5, 80); if (b.hp <= 0) this.breakObj(b); },
  breakObj(b) {
    b.hp = 0; b.dead = true; Audio2.play('hit');
    this.burst(b.x, b.y, b.type === 'hive' ? '#ffcc00' : '#c69a62', 18, 160);
    if (b.type === 'barrel') { if (b.boom) { this.hitArea(b.x, b.y, 90, { a: 30 * monDmg(this.map.lvl) }, 'tuz', 'env', { fx: 'boom' }); Audio2.play('boom'); } if (RNG() < 0.3) this.spawnPickup(b.x, b.y, 'gold', Math.round(2 + this.map.lvl * 1.5)); if (RNG() < 0.12) this.spawnPickup(b.x, b.y, 'food', RNG.pick(FOOD_DROPS[this.map.region] || FOOD_DROPS.hasadek)); }
    if (b.type === 'hive') { this.emit('hive'); for (let i = 0; i < 3; i++) this.spawnPickup(b.x, b.y, 'mat', 'mez'); }
  },
  interact() {
    const P = this.P, m = this.map; let best = null, bd = 70 * 70;
    const it = this.pickups.find(p => p.kind === 'item' && dist(p, P) < 50); if (it) { if (this.pickUp(it)) it.gone = true; return; }
    for (const o of m.objs) { if (o.dead || !o.inter) continue; const d = dist2(P.x, P.y, o.x, o.y); if (d < bd) { bd = d; best = o; } }
    if (best) best.inter(best);
  },
  nearInteract() {
    const P = this.P, m = this.map; if (!m) return null; let best = null, bd = 70 * 70;
    for (const o of m.objs) { if (o.dead || !o.inter) continue; const d = dist2(P.x, P.y, o.x, o.y); if (d < bd) { bd = d; best = o; } }
    return best;
  },
};
const INV_MAX = 40, STASH_MAX = 120, DODGE_COST = 30;
