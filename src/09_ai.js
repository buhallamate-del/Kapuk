// ============================================================
//  ELLENFELEK, BOSSOK, SZÖVETSÉGESEK, LÖVEDÉKEK
// ============================================================
Object.assign(G, {
  spawnEnemy(type, x, y, lvl, o = {}) {
    const D = o.bossDef || ENEMIES[type];
    const dl = lvl;
    const e = {
      type, def: o.bossDef ? { ai: 'boss', nev: D.nev } : D, look: { ...(D.look) }, x, y, r: o.r || D.r, lvl: dl,
      mhp: D.hp * monHp(dl), dmg: D.dmg * monDmg(dl), spd: D.spd, armor: (D.armor || 0) * (1 + dl * 0.12), res: { ...(D.res || {}) },
      state: 'idle', t: RNG() * 2, cd: RNG() * 1.5, wind: 0, stun: 0, freeze: 0, slow: 0, shock: 0, mark: 0, fear: 0, burn: null, kbx: 0, kby: 0,
      mods: o.mods || [], xp: (D.xp || 2) * 10 * (1 + 0.22 * (dl - 1)), flash: 0, hurtT: 0, strafe: RNG() < 0.5 ? 1 : -1, losT: 0, seeP: false, w: 0, summoned: 0, tick: 0,
    };
    if (o.elite) { e.elite = true; e.mhp *= 2.4; e.dmg *= 1.35; e.xp *= 3; e.r *= 1.15; e.look.glow = ELITE_MODS[e.mods[0]] ? ELITE_MODS[e.mods[0]].c : '#6fa8ff'; }
    if (o.champion) { e.champion = true; e.mhp *= 4; e.dmg *= 1.5; e.xp *= 6; e.r *= 1.3; e.look.glow = '#ffd34d'; }
    if (o.named) { const N = NAMED[o.named]; e.named = o.named; e.nameTxt = N.nev; e.mhp *= N.hpM; e.dmg *= N.dmgM; e.xp *= 10; e.r *= 1.45; e.look.glow = N.c; e.line = N.line; }
    if (o.ancient) { const A = o.ancient; e.ancient = A; e.nameTxt = A.nev; e.mhp *= A.hpM; e.dmg *= A.dmgM; e.xp *= 40; e.r = A.r; e.look.glow = A.c; e.heavy = true; e.state = 'wander'; }
    if (o.boss) { e.boss = true; e.bossDef = D; e.nameTxt = D.nev; e.xp = 120 * (1 + 0.3 * dl) * 12; e.pat = D.patterns.map(p => ({ ...p, t: p.cd * (0.4 + RNG() * 0.6) })); e.gap = 1.2; e.phase = 1; e.heavy = true; }
    if (e.mods.includes('vastag')) e.mhp *= 2;
    if (e.mods.includes('gyors')) e.spd *= 1.45;
    if (e.mods.includes('vampir')) e.vamp = true;
    if (D.wphase && this.mapIs('eh')) e.w = RNG.pick([-2, -1, 1, 2]);
    if (D.invis) e.invis = true;
    e.hp = e.mhp;
    this.enemies.push(e); return e;
  },

  updateEnemies(dt) {
    const P = this.P, m = this.map;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = P.x - e.x, dy = P.y - e.y, dP = Math.hypot(dx, dy);
      if (dP > 1500 && !e.boss) continue; // alszik
      e.t += dt; e.flash -= dt; e.hurtT -= dt; e.mark -= dt; e.shock -= dt;
      if (e.burn) { e.burn.t -= dt; e.tick -= dt; if (e.tick <= 0) { e.tick = 0.5; this.hurtEnemy(e, { a: e.burn.dps * 0.5, c: false }, 'tuz', { noReflect: true }); if (RNG() < 0.5) this.burst(e.x, e.y - 6, '#ff7a2e', 2, 40, 0.4); } if (e.burn && e.burn.t <= 0) e.burn = null; if (e.dead) continue; }
      if (e.freeze > 0) { e.freeze -= dt; continue; }
      if (e.stun > 0) { e.stun -= dt; e.wind = 0; e.charging = 0; continue; }
      // láthatatlanság (Jeltörő zajlények)
      e.invisNow = e.invis && !P.fx.radio && dP > 110 && e.hurtT <= 0;
      // hátralökés
      if (e.kbx || e.kby) { moveCircle(m, e, e.kbx * dt, e.kby * dt); e.kbx *= Math.pow(0.002, dt); e.kby *= Math.pow(0.002, dt); if (Math.abs(e.kbx) + Math.abs(e.kby) < 5) e.kbx = e.kby = 0; }
      e.losT -= dt; if (e.losT <= 0) { e.losT = 0.25 + RNG() * 0.1; e.seeP = dP < 900 && los(m, e.x, e.y, P.x, P.y); }
      if (e.state === 'idle') { if ((dP < 400 && e.seeP) || e.hurtT > 0) this.aggro(e); else continue; }
      if (e.state === 'wander') { // Ősök: kóborolnak, csak közelről vagy ütésre támadnak
        if ((dP < 230 && e.seeP) || e.hurtT > 0) { e.state = 'chase'; UI.toast(`⚠ ${e.nameTxt} felfigyelt rád! (${e.lvl}. szint)`, '#ff3355', 4); Audio2.play('bossroar'); }
        else { e.wa = (e.wa || RNG() * 6.28) + RNG.range(-1, 1) * dt; if (moveCircle(m, e, Math.cos(e.wa) * 40 * dt, Math.sin(e.wa) * 40 * dt)) e.wa += 2; continue; }
      }
      if (e.boss) { this.bossAI(e, dt, dP); continue; }
      let spd = e.spd * (e.slow > 0 ? 0.5 : 1); if (e.slow > 0) e.slow -= dt;
      if (e.mods.includes('fagyos') && dP < 130) { P.chill = 0.3; }
      if (e.mods.includes('tuzes')) { e.trailT = (e.trailT || 0) - dt; if (e.trailT <= 0) { e.trailT = 0.6; this.ground(e.x, e.y, 26, 3, e.dmg * 0.6, 'tuz', 'e'); } }
      if (e.mods.includes('teleport')) { e.tpT = (e.tpT || 4) - dt; if (e.tpT <= 0 && dP < 600) { e.tpT = 5 + RNG() * 3; const a = RNG() * 6.28; const nx = P.x + Math.cos(a) * 90, ny = P.y + Math.sin(a) * 90; if (!solidAt(m, nx, ny)) { this.burst(e.x, e.y, '#c48cff', 10, 120); e.x = nx; e.y = ny; this.burst(e.x, e.y, '#c48cff', 10, 120); } } }
      e.cd -= dt;
      const ai = e.def.ai;
      let mv = null; // irány, amerre menne
      const toP = Math.atan2(dy, dx);
      const chaseDir = () => e.seeP ? toP : flowDir(m, e.x, e.y);
      if (e.fear > 0) { e.fear -= dt; mv = toP + Math.PI; }
      else if (ai === 'melee' || ai === 'tank' || ai === 'phase') {
        const reach = e.r + P.r + (ai === 'tank' ? 22 : 14);
        // a lendítés iránya a felhúzáskor rögzül: oldalra lépve vagy kitérve el lehet kerülni
        if (e.wind > 0) { e.wind -= dt; if (e.wind <= 0) { const arcW = ai === 'tank' ? 1.25 : 0.95, inArc = Math.abs(angDiff(e.windA, toP)) < arcW + 0.15; if (dP < reach + 16 && inArc) this.hurtPlayer(e.dmg * (ai === 'tank' ? 1.5 : 1), e.def.dt || 'fiz', e, { fx: 'claw' }); this.fxArc(e.x, e.y, e.windA, arcW * 2, reach + 16, 'claw'); if (ai === 'tank') { this.shake(3); if (dP < reach + 16 && inArc) { P.kbx = Math.cos(toP) * 300; P.kby = Math.sin(toP) * 300; } } e.cd = ai === 'tank' ? 1.8 : 1.2; } }
        else if (dP < reach && e.cd <= 0) { e.wind = e.windMax = (ai === 'tank' ? 0.7 : 0.45) * (e.mods.includes('gyors') ? 0.8 : 1); e.windA = toP; e.windR = reach + 16; e.windW = ai === 'tank' ? 1.25 : 0.95; }
        else mv = chaseDir();
        if (ai === 'phase' && e.cd <= -2 && dP < 300 && e.seeP) { e.cd = 1; const a = toP + Math.PI + RNG.range(-0.8, 0.8); const nx = P.x + Math.cos(a) * 50, ny = P.y + Math.sin(a) * 50; if (!solidAt(m, nx, ny)) { this.burst(e.x, e.y, e.look.c2, 8, 100); e.x = nx; e.y = ny; } }
      } else if (ai === 'swarm') {
        mv = chaseDir(); spd *= 1;
        if (dP < e.r + P.r + 4 && e.cd <= 0) { this.hurtPlayer(e.dmg, e.def.dt || 'fiz', e); e.cd = 0.8; e.kbx = -Math.cos(toP) * 200; e.kby = -Math.sin(toP) * 200; }
        if (e.seeP) mv += Math.sin(e.t * 6 + e.strafe * 3) * 0.6;
      } else if (ai === 'ranged' || ai === 'caster' || ai === 'summoner') {
        const pref = ai === 'summoner' ? 320 : ai === 'caster' ? 300 : 250;
        if (!e.seeP) mv = flowDir(m, e.x, e.y);
        else if (dP > pref + 70) mv = toP;
        else if (dP < pref - 70) mv = toP + Math.PI;
        else { mv = toP + e.strafe * Math.PI / 2; if (RNG() < dt * 0.6) e.strafe *= -1; spd *= 0.6; }
        if (e.seeP && e.cd <= 0 && dP < 620) {
          if (ai === 'ranged') { if (!(e.aimT > 0)) e.aimT = 0.32; }
          else if (ai === 'caster') { const C = e.def.cast; for (let i = 0; i < (C.n || 1); i++) { const ox = i ? RNG.range(-90, 90) : 0, oy = i ? RNG.range(-90, 90) : 0; this.tele(P.x + ox + P.vx * 0.4, P.y + oy + P.vy * 0.4, C.r, C.delay, e.dmg * 1.4, e.def.dt || 'fiz', 'e', { src: e, fx: e.def.dt === 'fagy' ? 'nova' : 'bolt', freezeP: e.def.dt === 'fagy' }); } e.cd = C.cd; }
          else if (ai === 'summoner') { const Sm = e.def.summon; if (e.summoned < 8) for (let i = 0; i < Sm.n; i++) { const c = this.spawnEnemy(Sm.type, e.x + RNG.range(-30, 30), e.y + RNG.range(-30, 30), e.lvl, {}); c.state = 'chase'; c.xp *= 0.3; e.summoned++; c.parent = e; } e.cd = Sm.cd; this.fxRing(e.x, e.y, 40, e.look.c, 0.4); }
        }
        if (e.aimT > 0) { e.aimT -= dt; spd *= 0.35; if (e.aimT <= 0) { if (!e.dead && e.seeP) this.enemyShoot(e, toP); else e.cd = 0.5; } }
      } else if (ai === 'charger') {
        if (e.charging > 0) { e.charging -= dt; const hit = moveCircle(m, e, e.cvx * dt, e.cvy * dt); if (!e.chHit && dist(e, P) < e.r + P.r + 4) { e.chHit = true; this.hurtPlayer(e.dmg * 1.6, e.def.dt || 'fiz', e); P.kbx = e.cvx * 0.6; P.kby = e.cvy * 0.6; } if (hit) { e.charging = 0; e.stun = 0.9; this.shake(3); this.burst(e.x, e.y, '#ccc', 8, 100); } if (RNG() < 0.5) this.burst(e.x, e.y, '#aaa', 1, 30, 0.3); continue; }
        if (e.wind > 0) { e.wind -= dt; if (e.wind > 0.22) e.windA = toP; if (e.wind <= 0) { const s = 520 + e.spd * 2; e.cvx = Math.cos(e.windA) * s; e.cvy = Math.sin(e.windA) * s; e.charging = 0.55; e.chHit = false; e.cd = 3; } continue; }
        if (e.seeP && dP < 330 && dP > 70 && e.cd <= 0) { e.wind = 0.65; e.windA = toP; this.teles.push({ line: true, follow: e, x: e.x, y: e.y, a: toP, len: (520 + e.spd * 2) * 0.55, w: e.r * 2, t: 0, delay: 0.65, own: 'none' }); continue; }
        if (dP < e.r + P.r + 10 && e.cd <= 0) { this.hurtPlayer(e.dmg, e.def.dt || 'fiz', e); e.cd = 1.2; }
        mv = chaseDir();
      } else if (ai === 'exploder') {
        if (e.fuse > 0) { e.fuse -= dt; if (e.fuse <= 0) { this.hitArea(e.x, e.y, 80, e.dmg, e.def.dt || 'tuz', 'e', { fx: 'boom', src: e }); Audio2.play('boom'); e.xp *= 0.5; this.killEnemy(e); } continue; }
        mv = chaseDir(); spd *= 1.1;
        if (dP < e.r + P.r + 20) { e.fuse = e.fuseMax = 0.6; }
      } else if (ai === 'turret') {
        if (!e.def.noShot && e.seeP && dP < 600 && e.cd <= 0 && !(e.aimT > 0)) e.aimT = 0.4;
        if (e.aimT > 0) { e.aimT -= dt; if (e.aimT <= 0) this.enemyShoot(e, toP); }
      }
      if (mv != null && !isNaN(mv)) {
        // szétválás a szomszédoktól
        let sx = 0, sy = 0;
        for (const o of this.near(e.x, e.y, e.r + 14)) { if (o === e) continue; const dd = Math.hypot(e.x - o.x, e.y - o.y) || 1; sx += (e.x - o.x) / dd; sy += (e.y - o.y) / dd; }
        let vx = Math.cos(mv) * spd + sx * 40, vy = Math.sin(mv) * spd + sy * 40;
        if (this.gust) { vx += this.gust.x * 0.6; vy += this.gust.y * 0.6; }
        const t = tileAt(m, Math.floor(e.x / TILE), Math.floor(e.y / TILE)); if (t === T_HAZ) { const fx = REGION[m.region] && REGION[m.region].haz.fx; if (fx === 'slow') { vx *= 0.55; vy *= 0.55; } }
        moveCircle(m, e, vx * dt, vy * dt);
        e.face = mv;
      }
    }
    // halottak takarítása
    if (this.enemies.length > 40 && this.enemies.some(e => e.dead)) this.enemies = this.enemies.filter(e => !e.dead);
  },
  enemyShoot(e, a) {
    const S = e.def.shot; if (!S) return;
    const n = S.n || 1, sp = S.spread || 0;
    const fire = () => { for (let i = 0; i < n; i++) { const aa = sp >= 6 ? a + i / n * 6.283 : a + (n > 1 ? (i - (n - 1) / 2) * sp / Math.max(1, n - 1) * 2 : 0) + RNG.range(-0.04, 0.04); this.proj({ x: e.x, y: e.y, a: aa, spd: S.spd, r: S.r || 4, dmg: e.dmg, dt: e.def.dt || 'fiz', own: 'e', kind: S.kind, col: S.c, src: e, splash: S.splash, life: 2.6 }); } };
    if (S.burst) { for (let b = 0; b < S.burst; b++) this.later(b * 0.12, () => { if (!e.dead) fire(); }); } else fire();
    if (e.mods.includes('sokszor') && RNG() < 0.3) this.later(0.25, () => { if (!e.dead) fire(); });
    e.cd = S.cd * (e.mods.includes('gyors') ? 0.7 : 1) * (0.85 + RNG() * 0.3);
    Audio2.play(S.kind === 'bullet' ? 'shoot' : 'magic');
  },

  // ---------- BOSS MI ----------
  bossAI(e, dt, dP) {
    const P = this.P, m = this.map, D = e.bossDef, toP = Math.atan2(P.y - e.y, P.x - e.x);
    if (!e.intro) { e.intro = true; UI.bossBar(e); Audio2.play('bossroar'); this.text(e.x, e.y - e.r - 20, RNG.pick(D.lines), '#ffd0d0', 14, { life: 3, vy: -10 }); }
    // fázisváltás
    if (e.phase === 1 && e.hp < e.mhp * 0.5) {
      e.phase = 2; UI.toast(D.p2, '#ff7a7a', 4); this.text(e.x, e.y - e.r - 20, D.p2, '#ff9999', 14, { life: 3, vy: -10 }); this.shake(10); Audio2.play('bossroar');
      e.pat.forEach(p => p.cd *= 0.7); e.spd *= 1.25;
      if (D.chains) this.spawnChains(e, 3); if (D.antennas) this.spawnAntennas(e, 3);
    }
    // láncok/antennák: sebezhetetlenség / pajzs
    if (e.links) { const alive = e.links.filter(l => !l.dead).length; if (D.chains) e.immune = alive > 0; if (D.antennas) e.shieldMul = alive > 0 ? 0.2 : 1; }
    if (D.gravity && dP < 900) { const f = D.gravity * (1 - dP / 900) + 30; P.ext = P.ext || { x: 0, y: 0 }; P.ext.x -= Math.cos(toP) * f; P.ext.y -= Math.sin(toP) * f; if (dP < e.r + 40) this.hurtPlayer(e.dmg * dt * 2, 'ter', e, { silent: true }); }
    if (e.stun > 0) { e.stun -= dt; return; }
    // mozgás
    if (e.charging > 0) {
      e.charging -= dt; const hit = moveCircle(m, e, e.cvx * dt, e.cvy * dt);
      if (!e.chHit && dist(e, P) < e.r + P.r + 6) { e.chHit = true; this.hurtPlayer(e.dmg * 1.8, 'fiz', e); P.kbx = e.cvx * 0.7; P.kby = e.cvy * 0.7; }
      if (hit) { e.charging = 0; this.shake(8); this.burst(e.x, e.y, '#ccc', 20, 200); }
      return;
    }
    if (e.wind > 0) { e.wind -= dt; if (e.wind <= 0) e.windFn(); return; }
    if (e.spd > 0 && !e.beam) {
      const pref = D.mirror ? 160 : 140; let mv = null;
      if (dP > pref + 40) mv = e.seeP ? toP : flowDir(m, e.x, e.y); else if (dP < pref - 50) mv = toP + Math.PI; else mv = toP + Math.PI / 2 * (e.strafe || 1);
      if (RNG() < dt * 0.3) e.strafe = -(e.strafe || 1);
      if (mv != null) moveCircle(m, e, Math.cos(mv) * e.spd * dt, Math.sin(mv) * e.spd * dt);
    }
    if (e.beam) this.updateBeam(e, dt);
    // minták
    for (const p of e.pat) p.t -= dt;
    e.gap -= dt; if (e.gap > 0 || e.beam) return;
    const ready = e.pat.filter(p => p.t <= 0); if (!ready.length) return;
    const p = RNG.pick(ready); p.t = p.cd * (0.8 + RNG() * 0.4); e.gap = e.phase === 2 ? 0.6 : 1.0;
    const dmg = e.dmg, dt2 = D.look.s === 'radiohead' || D.look.s === 'heart' ? 'villam' : D.look.s === 'core' || D.look.s === 'mech' ? 'tuz' : D.look.s === 'self' || D.look.s === 'singularity' ? 'ter' : 'fiz';
    const kind = p.kind || 'bolt', col = D.look.c2;
    switch (p.k) {
      case 'radial': case 'ring': { const n = p.n + (e.phase === 2 ? 6 : 0), off = RNG() * 6.28; for (let i = 0; i < n; i++) this.proj({ x: e.x, y: e.y, a: off + i / n * 6.283, spd: p.spd, r: 6, dmg, dt: dt2, own: 'e', kind, col, src: e, life: 4 }); if (p.k === 'ring') this.later(0.5, () => { if (!e.dead) for (let i = 0; i < n; i++) this.proj({ x: e.x, y: e.y, a: off + (i + 0.5) / n * 6.283, spd: p.spd * 0.8, r: 6, dmg, dt: dt2, own: 'e', kind, col, src: e, life: 4 }); }); Audio2.play('magic'); break; }
      case 'spiral': { const n = p.n + (e.phase === 2 ? 8 : 0), off = toP; for (let i = 0; i < n; i++) this.later(i * 0.07, () => { if (!e.dead) { this.proj({ x: e.x, y: e.y, a: off + i * 0.45, spd: p.spd, r: 6, dmg, dt: dt2, own: 'e', kind, col, src: e, life: 4 }); this.proj({ x: e.x, y: e.y, a: off + i * 0.45 + Math.PI, spd: p.spd, r: 6, dmg, dt: dt2, own: 'e', kind, col, src: e, life: 4 }); } }); break; }
      case 'aimed': { const n = p.n + (e.phase === 2 ? 2 : 0); for (let i = 0; i < n; i++) this.proj({ x: e.x, y: e.y, a: toP + (i - (n - 1) / 2) * (p.spread / Math.max(1, n - 1)) * 2, spd: p.spd, r: 7, dmg: dmg * 1.2, dt: dt2, own: 'e', kind, col, src: e, life: 3, splash: kind === 'fireball' ? 50 : 0 }); Audio2.play('shoot'); break; }
      case 'charge': e.wind = 0.75; e.windA = toP; this.teles.push({ line: true, x: e.x, y: e.y, a: toP, len: 420, w: e.r * 2, t: 0, delay: 0.75, own: 'none' }); e.windFn = () => { const a = e.windA; e.cvx = Math.cos(a) * p.spd; e.cvy = Math.sin(a) * p.spd; e.charging = 0.7; e.chHit = false; }; break;
      case 'slam': e.wind = 1.0; this.tele(e.x, e.y, p.r, 1.0, dmg * 2.2, dt2, 'e', { src: e, fx: 'quake' }); e.windFn = () => this.shake(10); break;
      case 'rain': { const n = p.n + (e.phase === 2 ? 4 : 0); for (let i = 0; i < n; i++) { const a = RNG() * 6.28, d = i === 0 ? 0 : RNG.range(40, 260); this.tele(P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, p.r, 1.0 + i * 0.07, dmg * 1.5, dt2, 'e', { src: e, fx: dt2 === 'tuz' ? 'meteor' : 'bolt', ground: p.ground ? { t: 4, dps: dmg * 0.5, dt: 'tuz', own: 'e' } : null }); } break; }
      case 'summon': { const n = p.n + (e.phase === 2 ? 2 : 0); for (let i = 0; i < n; i++) { const a = i / n * 6.28; const c = this.spawnEnemy(p.type, e.x + Math.cos(a) * (e.r + 30), e.y + Math.sin(a) * (e.r + 30), e.lvl - 1, {}); c.state = 'chase'; c.xp *= 0.2; } this.fxRing(e.x, e.y, e.r + 40, col, 0.5, 4); break; }
      case 'beam': e.beam = { a: toP - 0.9, t: 0, dur: p.dur, warm: 0.8, tick: 0 }; break;
      case 'mirror': { // a saját kasztod támadása tükörből
        const cls = this.S.cls;
        if (cls === 'penge') { e.wind = 0.4; this.teles.push({ x: e.x, y: e.y, r: 110, t: 0, delay: 0.4, dmg: dmg * 1.6, dt: 'ter', own: 'e', o: { src: e, fx: 'spin' } }); e.windFn = () => { }; }
        else if (cls === 'elem') { for (let i = -1; i <= 1; i++) this.proj({ x: e.x, y: e.y, a: toP + i * 0.25, spd: 420, r: 8, dmg: dmg * 1.1, dt: 'tuz', own: 'e', kind: 'fireball', col: '#ff7a2e', src: e, splash: 50, life: 3 }); }
        else if (cls === 'loves') { for (let i = -3; i <= 3; i++) this.proj({ x: e.x, y: e.y, a: toP + i * 0.08, spd: 700, r: 3, dmg: dmg * 0.7, dt: 'fiz', own: 'e', kind: 'bullet', col: '#fff', src: e, life: 2 }); }
        else { this.proj({ x: e.x, y: e.y, a: toP, spd: 330, r: 6, dmg: dmg * 1.4, dt: 'tuz', own: 'e', kind: 'rocket', col: '#ff7a2e', src: e, life: 3, homingP: 2.5, splash: 50 }); }
        Audio2.play('shoot'); break;
      }
    }
  },
  updateBeam(e, dt) {
    const B = e.beam, P = this.P; B.t += dt;
    if (B.t < B.warm) return;
    const toP = Math.atan2(P.y - e.y, P.x - e.x); B.a += clamp(angDiff(B.a, toP), -1, 1) * dt * 0.9;
    B.tick -= dt;
    if (B.tick <= 0) { B.tick = 0.15; const d = Math.hypot(P.x - e.x, P.y - e.y); const ad = Math.abs(angDiff(B.a, toP)); if (Math.sin(ad) * d < 22 && Math.cos(ad) > 0 && d < 900 && los(this.map, e.x, e.y, P.x, P.y)) this.hurtPlayer(e.dmg * 0.55, 'villam', e, { silent: false }); }
    if (B.t > B.warm + B.dur) e.beam = null;
  },
  spawnChains(e, n) { e.links = e.links || []; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + 0.4; const c = this.spawnEnemy('lanc', e.x + Math.cos(a) * 170, e.y + Math.sin(a) * 170, e.lvl, {}); c.state = 'chase'; c.xp *= 0.2; c.bossLink = e; e.links.push(c); } },
  spawnAntennas(e, n) { e.links = e.links || []; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + 1; const c = this.spawnEnemy('adoantenna', e.x + Math.cos(a) * 220, e.y + Math.sin(a) * 220, e.lvl, {}); c.state = 'chase'; c.xp *= 0.2; e.links.push(c); } },

  // ---------- szövetségesek ----------
  updateAllies(dt) {
    const P = this.P, m = this.map;
    for (const a of this.allies) {
      a.t += dt; a.life -= dt; if (a.life <= 0) continue;
      a.cd -= dt * (1 + P.st.sumaspd / 100);
      if (a.kind === 'dron') {
        const i = this.allies.filter(x => x.kind === 'dron').indexOf(a); const ang = this.t * 1.4 + i * 1.3;
        const tx = a.owner.x + Math.cos(ang) * (46 + (i % 3) * 14), ty = a.owner.y + Math.sin(ang) * (46 + (i % 3) * 14) - 8;
        a.x = lerp(a.x, tx, Math.min(1, dt * 6)); a.y = lerp(a.y, ty, Math.min(1, dt * 6));
        if (a.cd <= 0) { const e = this.nearestEnemy(a.x, a.y, a.range); if (e) { a.cd = a.rate; this.proj({ x: a.x, y: a.y, a: Math.atan2(e.y - a.y, e.x - a.x), spd: 700, r: 3, dmg: P.roll(a.dmgMul, 'summon'), dt: a.grey ? 'ter' : 'villam', own: 'p', kind: 'laser', col: a.grey ? '#c0c0c0' : '#7fd8ff', life: 1 }); Audio2.play('shoot'); } }
      } else if (a.kind === 'torony') {
        if (a.cd <= 0) { const e = this.nearestEnemy(a.x, a.y, a.range); if (e) { a.cd = a.rate; a.aim = Math.atan2(e.y - a.y, e.x - a.x); this.proj({ x: a.x, y: a.y, a: a.aim + RNG.range(-0.05, 0.05), spd: 800, r: 3, dmg: P.roll(a.dmgMul, 'summon'), dt: 'fiz', own: 'p', kind: 'bullet', col: '#ffd27a', life: 1 }); Audio2.play('shoot'); } }
      } else if (a.kind === 'meh') {
        const e = this.nearestEnemy(a.x, a.y, a.range, false);
        const tx = e ? e.x : P.x + Math.cos(a.t * 3) * 40, ty = e ? e.y : P.y + Math.sin(a.t * 3) * 40;
        const an = Math.atan2(ty - a.y, tx - a.x) + Math.sin(a.t * 9) * 0.6; a.x += Math.cos(an) * 220 * dt; a.y += Math.sin(an) * 220 * dt;
        if (e && a.cd <= 0 && dist(a, e) < e.r + 10) { a.cd = a.rate; this.hurtEnemy(e, P.roll(a.dmgMul, 'summon'), 'fiz', { slow: 1.5 }); }
      } else if (a.kind === 'orbit') {
        a.ang += dt * 3.2; a.x = a.owner.x + Math.cos(a.ang) * a.rad; a.y = a.owner.y + Math.sin(a.ang) * a.rad;
        a.hitT = a.hitT || new Map();
        for (const e of this.near(a.x, a.y, 16)) { const lt = a.hitT.get(e) || 0; if (this.t - lt > 0.4) { a.hitT.set(e, this.t); this.hurtEnemy(e, P.roll(a.dmgMul, a.dk), P.wdt(), { melee: true, noStop: true }); } }
      } else if (a.kind === 'mine') {
        const e = this.near(a.x, a.y, a.trig * 0.6)[0];
        if (e || a.life < 0.1) { this.hitArea(a.x, a.y, a.trig, a.dmg, a.dt, 'p', { fx: 'boom', isSplash: true }); Audio2.play('boom'); a.life = 0; }
      } else if (a.kind === 'bh') {
        for (const e of this.near(a.x, a.y, a.rad)) { if (e.boss || e.ancient) continue; const an = Math.atan2(a.y - e.y, a.x - e.x), d = Math.hypot(a.x - e.x, a.y - e.y); if (d > 20) moveCircle(m, e, Math.cos(an) * 260 * dt, Math.sin(an) * 260 * dt); }
        a.cd -= 0; if (a.cd <= 0) { a.cd = 0.5; for (const e of this.near(a.x, a.y, 130)) this.hurtEnemy(e, P.roll(a.dmgMul * 0.5, 'spell'), 'ter', {}); }
        if (RNG() < 0.6) { const an = RNG() * 6.28, d = a.rad * 0.6; this.parts.push({ x: a.x + Math.cos(an) * d, y: a.y + Math.sin(an) * d, vx: -Math.cos(an) * 200, vy: -Math.sin(an) * 200, t: 0, life: 0.6, c: '#c48cff', size: 2, drag: 0 }); }
      }
    }
    if (this.allies.some(a => a.life <= 0)) this.allies = this.allies.filter(a => a.life > 0);
  },

  // ---------- lövedékek ----------
  updateProjs(dt0) {
    const P = this.P, m = this.map;
    for (const p of this.projs) {
      const dt = p.own === 'e' ? (this.wdt != null ? this.wdt : dt0) : dt0;
      p.t += dt; if (p.t > p.life) { p.dead = true; if (p.splash && p.own === 'p') this.explode(p); continue; }
      if (p.homing && p.own === 'p') { const e = this.nearestEnemy(p.x, p.y, 380, false); if (e) { const a = Math.atan2(p.vy, p.vx), ta = Math.atan2(e.y - p.y, e.x - p.x); const na = a + clamp(angDiff(a, ta), -p.homing * dt, p.homing * dt); const s = Math.hypot(p.vx, p.vy); p.vx = Math.cos(na) * s; p.vy = Math.sin(na) * s; } }
      if (p.homingP && p.own === 'e') { const a = Math.atan2(p.vy, p.vx), ta = Math.atan2(P.y - p.y, P.x - p.x); const na = a + clamp(angDiff(a, ta), -p.homingP * dt, p.homingP * dt); const s = Math.hypot(p.vx, p.vy); p.vx = Math.cos(na) * s; p.vy = Math.sin(na) * s; }
      const steps = Math.max(1, Math.ceil(Math.hypot(p.vx, p.vy) * dt / 10));
      for (let s = 0; s < steps && !p.dead; s++) {
        p.x += p.vx * dt / steps; p.y += p.vy * dt / steps;
        if (solidAt(m, p.x, p.y)) {
          if (p.kind === 'forklift') { p.dead = true; this.shake(5); this.burst(p.x, p.y, '#f2b01e', 16, 150); break; }
          if (p.foton && !p.bent) { p.bent = true; const e = this.nearestEnemy(p.x - p.vx * 0.02, p.y - p.vy * 0.02, 400, false); if (e) { const a = Math.atan2(e.y - p.y, e.x - p.x), sp = Math.hypot(p.vx, p.vy); p.x -= p.vx * dt; p.y -= p.vy * dt; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; continue; } }
          p.dead = true; this.burst(p.x, p.y, p.col || '#ccc', 4, 60, 0.3, 2); if (p.splash) this.explode(p); break;
        }
        if (p.own === 'p') {
          for (const e of this.near(p.x, p.y, p.r)) {
            if (p.hit.has(e) || (e.wphase && this.mapIs('eh') && e.w !== P.w)) continue;
            p.hit.add(e);
            if (p.splash) { this.explode(p); p.dead = true; break; }
            this.hurtEnemy(e, p.dmg, p.dt, { burn: p.burn, slow: p.slow, stun: p.stun, knock: p.knock || (p.kind === 'bullet' ? 15 : 30), kx: p.x - p.vx, ky: p.y - p.vy, basic: p.basic, ranged: p.ranged, far: true, k: p.k });
            if (p.add) for (const k in p.add) if (p.add[k]) this.hurtEnemy(e, { a: p.add[k], c: false }, k, {});
            this.burst(p.x, p.y, p.col || DT[p.dt].c, 4, 80, 0.3, 2);
            if (p.pierce-- <= 0) { p.dead = true; break; }
          }
          if (!p.dead) for (const b of this.breakables(p.x, p.y, p.r)) { this.hitObj(b, p.dmg); if (!p.splash) { p.dead = true; break; } else { this.explode(p); p.dead = true; break; } }
        } else if (p.own === 'e') {
          if (dist2(p.x, p.y, P.x, P.y) < (p.r + P.r) ** 2) { p.dead = true; if (p.splash) this.hitArea(p.x, p.y, p.splash, p.dmg, p.dt, 'e', { fx: 'boom', src: p.src }); else this.hurtPlayer(p.dmg, p.dt, p.src); this.burst(p.x, p.y, p.col || '#f55', 5, 80, 0.3, 2); }
          // a lövegtornyok és drónok elnyelik a lövedéket? nem – csak a jégpajzs
        }
      }
      if (p.trail && RNG() < 0.7) this.parts.push({ x: p.x, y: p.y, vx: RNG.range(-15, 15), vy: RNG.range(-15, 15), t: 0, life: 0.35, c: p.trail, size: p.r * 0.8, drag: 2 });
    }
    this.projs = this.projs.filter(p => !p.dead);
  },
  explode(p) {
    const r = p.splash * (1 + this.P.st.splashr / 100);
    this.hitArea(p.x, p.y, r, { a: p.dmg.a * (1 + this.P.st.splashp / 100), c: p.dmg.c }, p.dt, 'p', { fx: 'boom', burn: p.burn, isSplash: true });
    if (p.kind === 'rocket' || p.kind === 'fireball' || p.kind === 'orb') Audio2.play('boom');
    if (this.P.fx.szonda && p.kind === 'rocket' && !p.child) this.later(0.25, () => this.proj({ x: p.x, y: p.y, a: RNG() * 6.28, spd: 300, r: 4, dmg: { a: p.dmg.a * 0.5, c: false }, dt: 'tuz', own: 'p', kind: 'rocket', homing: 6, splash: 40, life: 1.5, child: true, trail: '#ffb070' }));
  },
  updateTeles(dt) {
    for (const t of this.teles) {
      t.t += dt; if (t.follow) { if (t.follow.dead || t.follow.stun > 0) { t.dead = true; continue; } t.x = t.follow.x; t.y = t.follow.y; t.a = t.follow.windA; }
      if (t.t >= t.delay) {
        t.dead = true; if (t.line || t.own === 'none') continue;
        this.hitArea(t.x, t.y, t.r, t.dmg, t.dt, t.own, { ...t.o, fx: t.o.fx || 'boom', src: t.o.src, isSplash: t.own === 'p' });
        if (t.o.freezeP && dist2(t.x, t.y, this.P.x, this.P.y) < t.r * t.r) this.P.chill = 1.5;
        if (t.o.ground) this.ground(t.x, t.y, t.r * 0.8, t.o.ground.t, t.o.ground.dps.a != null ? t.o.ground.dps.a : t.o.ground.dps, t.o.ground.dt, t.o.ground.own || t.own);
        if (t.o.fx === 'meteor' || t.o.fx === 'nuke' || t.o.fx === 'boom') { Audio2.play('boom'); this.shake(t.o.fx === 'nuke' ? 16 : 4); }
        if (t.o.fx === 'bolt') Audio2.play('zap');
      }
    }
    if (this.teles.some(t => t.dead)) this.teles = this.teles.filter(t => !t.dead);
    for (const l of this.lobs) { l.t += dt; if (l.t >= l.dur) { l.dead = true; this.hitArea(l.x1, l.y1, l.r * (1 + this.P.st.splashr / 100), { a: l.dmg.a * (1 + this.P.st.splashp / 100), c: l.dmg.c }, l.dt, 'p', { fx: 'boom', isSplash: true }); Audio2.play('boom'); this.shake(4); } }
    if (this.lobs.some(l => l.dead)) this.lobs = this.lobs.filter(l => !l.dead);
    const P = this.P;
    for (const g of this.grounds) {
      g.t -= dt; g.tick -= dt; if (g.t <= 0) { g.dead = true; continue; }
      if (g.own === 'honey') { if (dist2(g.x, g.y, P.x, P.y) < g.r * g.r) P.chill = 0.2; continue; }
      if (g.tick <= 0) { g.tick = 0.5; if (g.own === 'p') for (const e of this.near(g.x, g.y, g.r)) this.hurtEnemy(e, { a: g.dps * 0.5, c: false }, g.dt, { noReflect: true }); else if (dist2(g.x, g.y, P.x, P.y) < g.r * g.r) this.hurtPlayer(g.dps * 0.5, g.dt, null, { silent: false }); }
    }
    if (this.grounds.some(g => g.dead)) this.grounds = this.grounds.filter(g => !g.dead);
  },
  fxArea(x, y, r, fx, dt) {
    const c = { spin: '#ffe2a0', nova: '#9fe8ff', nova2: '#dfefff', nova3: '#c48cff', shout: '#ffcc66', boom: '#ffb347', quake: '#d9a441', meteor: '#ff6a2a', bolt: '#f4f06a', radio: '#4dffb0', nuke: '#ffdd88' }[fx] || DT[dt].c;
    this.fxRing(x, y, r, c, fx === 'nuke' ? 0.9 : 0.35, fx === 'nuke' ? 14 : 4);
    if (fx === 'boom' || fx === 'meteor' || fx === 'nuke') { this.burst(x, y, '#ffb347', fx === 'nuke' ? 80 : 18, r * 2.5, 0.5, fx === 'nuke' ? 6 : 3, { glow: true }); this.burst(x, y, '#555', fx === 'nuke' ? 40 : 8, r * 1.5, 0.9, 5); this.lightFlash(x, y, r * 2.5); }
    else if (fx === 'nova' || fx === 'nova2' || fx === 'nova3') this.burst(x, y, c, 30, r * 3, 0.4, 2);
    else if (fx === 'bolt') { this.parts.push({ bolt: true, x1: x + RNG.range(-20, 20), y1: y - 300, x2: x, y2: y, t: 0, life: 0.25, c: '#f4f06a' }); this.lightFlash(x, y, r * 2); }
    else if (fx === 'radio') { this.fxRing(x, y, r * 0.6, c, 0.6, 3); this.fxRing(x, y, r * 0.3, c, 0.8, 2); }
    else this.burst(x, y, c, 12, r * 2, 0.35, 2);
  },
  fxArc(x, y, a, arc, range, fx) { this.parts.push({ arc: true, x, y, a, arc, range, t: 0, life: fx === 'burp' ? 0.5 : fx === 'swing3' ? 0.26 : 0.18, heavy: fx === 'swing3', c: fx === 'burp' ? '#ff9be0' : fx === 'quake' ? '#d9a441' : fx === 'claw' ? 'rgba(255,90,90,.8)' : fx === 'swing3' ? '#ffe2a0' : '#fff3d0' }); },
  lightFlash(x, y, r) { this.flashes = this.flashes || []; this.flashes.push({ x, y, r, t: 0, life: 0.25 }); },
});
