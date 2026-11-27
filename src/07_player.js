// ============================================================
//  JÁTÉKOS: létrehozás, statisztikák, sebzésdobás, túlélés
// ============================================================
function newSave(cls, nev) {
  const C = CLASSES[cls];
  const S = {
    v: 1, nev: nev || 'Vándor', cls, lvl: 1, xp: 0, attrPts: 0, skillPts: 1, attrs: { ero: 0, ugy: 0, akarat: 0, kit: 0, allo: 0 }, elix: { ero: 1, forras: 1 },
    skills: {}, slots: [null, null, null, null, null], gate: null, gates: [], forbidden: [], pecset: 0,
    eq: {}, inv: [], stash: [], gold: 40, mats: { gyogyfu: 2 }, food: { pogacsa: 3, viz: 3, kave: 1 }, potions: 4, potLvl: 1,
    surv: { kaja: 90, ital: 90, ebren: 95 },
    prog: { unlocked: ['raktar'], wp: { raktar: 1 }, bosses: {}, ancients: {}, diff: 0, diffMax: 0, hasadek: 0, weekly: {} },
    quests: {}, flags: {}, gifts: {}, stats: { kills: 0, deaths: 0, time: 0, elites: 0, gold: 0, burps: 0 }, bounties: [], bountyDay: '', seenKeys: {},
    created: Date.now(), playtime: 0,
  };
  // kezdő fegyver és képesség
  const w = genItem(1, makeRng(7), { base: C.fegyver, rar: 0 }); w.nev = { penge: 'Öreg Bodor kardja', elem: 'Szélanyó pálcája', loves: 'Vadászpuska', mernok: 'Szerelő-pisztoly' }[cls]; S.eq.fegyver = w;
  const first = Object.keys(SKILLS).find(k => SKILLS[k].cls === cls && SKILLS[k].tipus === 'aktiv');
  S.skills[first] = 1; S.slots[0] = first; S.skillPts = 1;
  S.inv.push(genItem(1, makeRng(9), { base: 'vert', rar: 0 }));
  return S;
}

function makePlayer(S) {
  const P = { x: 0, y: 0, r: 12, vx: 0, vy: 0, aim: 0, atkT: 0, cds: {}, buffs: [], dash: null, dashCd: 0, invul: 0, stun: 0, history: [], histT: 0,
    hitCount: 0, shotCount: 0, swingCount: 0, w: 0, wCd: 0, burpN: 0, shieldV: 0, shieldT: 0, regenAcc: 0, magT: 0, hurtT: 0, chan: null, combatT: 0, step: 0, fx: {} };
  P.S = S;
  Object.defineProperty(P, 'lvl', { get: () => S.lvl });
  P.wdt = () => { const w = S.eq.fegyver; return w ? BASES[w.base].dtype : 'fiz'; };
  P.roll = (mult, kind, extraCrit = 0) => rollDmg(P, mult, kind, extraCrit);
  recalc(P); P.hp = P.mhp; P.mp = CLASSES[S.cls].rage ? 0 : P.mmp; P.sta = P.msta;
  return P;
}

function skillRank(P, id) { const b = P.S.skills[id] || 0; return b ? b + (P.st ? P.st.skill : 0) : 0; }

function recalc(P) {
  const S = P.S, C = CLASSES[S.cls], m = {};
  const add = (k, v) => { m[k] = (m[k] || 0) + v; };
  let arm = 0; P.fx = {};
  for (const sl in S.eq) {
    const it = S.eq[sl]; if (!it) continue; if (it.req > S.lvl) continue;
    if (it.arm) arm += itemArm(it);
    it.aff.forEach(a => add(a.id, affVal(it, a)));
    if (it.relic) P.fx[RELICS.find(r => r.id === it.relic).fx] = true;
  }
  add('skill', 0);
  for (const id in S.skills) { const sk = SKILLS[id]; if (sk && sk.tipus === 'passziv') { const r = S.skills[id] + (m.skill || 0); const mm = sk.mods(r); for (const k in mm) add(k, mm[k]); } }
  if (typeof Home !== 'undefined') Home.mods(S, add);
  if (S.forbidden.includes('osforma')) for (const k in OSFORMA.mods) add(k, OSFORMA.mods[k]);
  for (const b of P.buffs) if (b.mods) for (const k in b.mods) add(k, b.mods[k]);
  // túlélés hatásai
  const sv = S.surv;
  if (sv.kaja < 30) { add('dmgp', -10); add('regenMul', -50); } if (sv.kaja <= 0) add('dmgp', -15);
  if (sv.ital < 30) { add('aspd', -10); add('mregen', -30); } if (sv.ital <= 0) add('aspd', -15);
  if (sv.ebren < 30) { add('msp', -12); add('cdr', -20); } if (sv.ebren <= 0) { add('dmgp', -25); add('msp', -15); }
  if (sv.kaja > 80 && sv.ital > 80 && sv.ebren > 80) { add('dmgp', 6); add('hpp', 5); }
  const at = {}; for (const k in ATTR) at[k] = C.base[k] + (S.lvl - 1) * 1 + S.attrs[k] + (m[k] || 0);
  const st = { at, ...m };
  st.mhp = Math.round((70 + C.hpL * S.lvl + at.kit * 7 + (m.hp || 0)) * (1 + (m.hpp || 0) / 100));
  st.mmp = Math.round((C.mpBase + C.mpL * S.lvl + (C.rage ? 0 : at.akarat * 2) + (m.mp || 0) + (m.resmax || 0)) * (1 + (m.mpp || 0) / 100));
  st.msta = Math.round(100 + at.allo * 2 + (m.sta || 0));
  st.staRegen = 22 * (1 + at.allo * 0.015);
  st.staInf = m.staInf || 0;
  st.resgen = (m.resgen || 0) + at.allo * 1.5;
  st.arm = Math.round((arm + at.kit * 1.5) * (1 + (m.armp || 0) / 100));
  st.res = {}; for (const k of ['tuz', 'fagy', 'villam', 'ter']) st.res[k] = Math.min(75, (m['res_' + k] || 0) + (m.resall || 0) + (k === 'tuz' && P.fx.mag ? 30 : 0) - S.prog.diff * 15);
  st.crit = Math.min(75, 5 + at.ugy * 0.08 + (m.crit || 0)); st.critd = 50 + (m.critd || 0);
  st.aspd = Math.max(0.3, 1 + (m.aspd || 0) / 100);
  st.msp = Math.max(0.4, 1 + ((m.ms || 0) + (m.msp || 0)) / 100) * (P.fx.hold ? 1.15 : 1);
  st.cdr = Math.min(60, (m.cdr || 0) + (P.fx.radio ? 15 : 0)) / 100;
  st.regen = ((m.regen || 0) + S.lvl * 0.08 + at.kit * 0.04) * Math.max(0, 1 + (m.regenMul || 0) / 100);
  st.mregen = C.mpRegen * (1 + ((m.mregen || 0) + st.resgen) / 100);
  st.rageGain = C.onHitMp * (1 + st.resgen / 100);
  const ar = S.eq.artefakt; st.arti = ar && ar.req <= S.lvl ? (BASES[ar.base].res === S.cls ? 1 : 0.35) : 0;
  if (st.arti) { if (C.rage) st.rageGain *= 1 + 0.3 * st.arti; else st.mregen *= 1 + 0.35 * st.arti; }
  st.ls = (m.ls || 0); st.block = Math.min(40, m.block || 0); st.riposte = m.riposte || 0;
  st.gf = (m.gf || 0) + (P.fx.leltar ? 40 : 0); st.mf = (m.mf || 0) + (P.fx.leltar ? 25 : 0);
  st.skill = m.skill || 0; st.mark = m.mark || 0; st.thorns = m.thorns || 0; st.potion = m.potion || 0;
  st.dmg = { all: (m.dmgp || 0), melee: at.ero * 1.4 + (m.meleep || 0), ranged: at.ugy * 1.1 + (m.rangedp || 0), spell: at.akarat * 1.3 + (m.spellp || 0), summon: (at.akarat + at.ugy) * 0.6 + (m.summonp || 0) + (P.fx.fokonst ? 30 : 0) };
  st.flat = m.flat || 0; st.add = { tuz: m.add_tuz || 0, fagy: m.add_fagy || 0, villam: m.add_villam || 0 };
  st.splashp = m.splashp || 0; st.splashr = m.splashr || 0; st.burnp = m.burnp || 0; st.spellcrit = m.spellcrit || 0; st.farp = m.farp || 0;
  st.killMp = m.killMp || 0; st.shieldPct = m.shield || 0; st.sumaspd = m.sumaspd || 0;
  st.critForce = m.critForce || 0; st.triple = m.triple || 0; st.pierceAll = m.pierceAll || 0;
  P.st = st;
  const hpR = P.mhp ? P.hp / P.mhp : 1, mpR = P.mmp ? P.mp / P.mmp : 1;
  P.mhp = st.mhp; P.mmp = st.mmp; P.msta = st.msta; if (P.sta == null) P.sta = P.msta; P.sta = Math.min(P.sta, P.msta);
  if (P.hp != null) { P.hp = Math.min(P.mhp, Math.max(1, hpR * P.mhp)); P.mp = CLASSES[S.cls].rage ? Math.min(P.mmp, P.mp || 0) : Math.min(P.mmp, mpR * P.mmp); }
}

function weaponRange(P) { const w = P.S.eq.fegyver; if (!w || w.req > P.S.lvl) return [1 + P.S.lvl, 3 + P.S.lvl * 2]; const [a, b] = itemDmg(w); return [a + P.st.flat, b + P.st.flat]; }
function rollDmg(P, mult, kind, extraCrit = 0) {
  const [a, b] = weaponRange(P);
  let base = a + Math.random() * (b - a);
  const st = P.st;
  let bonus = st.dmg.all;
  if (kind === 'best') bonus += Math.max(st.dmg.melee, st.dmg.ranged, st.dmg.spell, st.dmg.summon);
  else bonus += st.dmg[kind] || 0;
  // a kaszt kedvenc fegyverneme +15%
  const w = P.S.eq.fegyver, C = CLASSES[P.S.cls];
  if (w && ((C.kedvenc === 'melee' && BASES[w.base].kind === 'melee') || (C.kedvenc === 'spell' && BASES[w.base].kind === 'spell') || (C.kedvenc === 'ranged' && BASES[w.base].kind === 'ranged'))) bonus += 15;
  if (kind === 'spell' && w && BASES[w.base].kind !== 'spell') base *= 0.85; // varázslat nem varázsfegyverrel
  if (st.verszomj && CLASSES[P.S.cls].rage) bonus += Math.floor(P.mp / 10) * st.verszomj;
  let amt = base * mult * (1 + bonus / 100);
  if (P.empowerT > 0) amt *= P.empowerMul || 1;
  if (kind === 'ranged' && P.focus) extraCrit += P.focus * 5;
  let crit = Math.random() * 100 < st.crit + extraCrit + (kind === 'spell' ? st.spellcrit : 0) || st.critForce > 0;
  if (crit) amt *= 1 + st.critd / 100;
  return { a: amt, c: crit, k: kind };
}

// ---------------- túlélés ----------------
const SURV_RATE = { kaja: 100 / 1300, ital: 100 / 850, ebren: 100 / 2200 };
function survivalTick(P, dt, inTown) {
  const sv = P.S.surv; const mul = (inTown ? 0.4 : Exped.hungerMul()) / (1 + P.st.at.allo * 0.006);
  const before = [sv.kaja < 30, sv.ital < 30, sv.ebren < 30, sv.kaja <= 0, sv.ital <= 0, sv.ebren <= 0].join();
  sv.kaja = Math.max(0, sv.kaja - SURV_RATE.kaja * dt * mul * (P.combatT > 0 ? 1.3 : 1));
  sv.ital = Math.max(0, sv.ital - SURV_RATE.ital * dt * mul * (P.combatT > 0 ? 1.4 : 1) * (G.map && G.map.region === 'melyseg' ? 1.6 : 1));
  sv.ebren = Math.max(0, sv.ebren - SURV_RATE.ebren * dt * mul * (P.combatT > 0 ? 1.2 : 1));
  const after = [sv.kaja < 30, sv.ital < 30, sv.ebren < 30, sv.kaja <= 0, sv.ital <= 0, sv.ebren <= 0].join();
  if (before !== after) { recalc(P); if (sv.kaja < 30 && sv.kaja > 29) UI.toast('Megéheztél. Egyél valamit (H).', '#ffb36b'); if (sv.ital < 30 && sv.ital > 29) UI.toast('Szomjas vagy. Igyál (G).', '#7fd8ff'); if (sv.ebren < 30 && sv.ebren > 29) UI.toast('Fáradt vagy. Pihenj: sátor (N) vagy a kocsma.', '#c48cff'); }
  if (sv.kaja <= 0) G.hurtPlayer(P.mhp * 0.006 * dt, 'fiz', null, { pure: true, silent: true });
  if (sv.ital <= 0) G.hurtPlayer(P.mhp * 0.009 * dt, 'fiz', null, { pure: true, silent: true });
  if (sv.ebren <= 0) { P.sleepyT = (P.sleepyT || 0) + dt; if (P.sleepyT > 18) { P.sleepyT = 0; P.stun = Math.max(P.stun, 1.2); G.text(P.x, P.y - 30, 'Zzz…', '#c48cff', 14); } }
}
function eatFood(id) {
  const S = G.S, F = FOODS[id]; if (!F || !(S.food[id] > 0) || F.tent) return false;
  S.food[id]--; if (!S.food[id]) delete S.food[id];
  const sv = S.surv; if (F.kaja) sv.kaja = Math.min(100, sv.kaja + F.kaja); if (F.ital) sv.ital = Math.min(100, sv.ital + F.ital); if (F.alvas) sv.ebren = Math.min(100, sv.ebren + F.alvas);
  if (F.hp) G.P.hp = Math.min(G.P.mhp, G.P.hp + G.P.mhp * F.hp);
  if (id === 'kola' || id === 'bika') { G.P.gas = Math.min(100, (G.P.gas || 0) + (id === 'kola' ? 14 : 22)); }
  if (id === 'sprite') G.P.gas = Math.max(0, (G.P.gas || 0) - 25);
  recalc(G.P); Audio2.play('potion'); UI.toast(`${F.ikon} ${F.nev}`, '#e8d7b0'); G.emit('eat', id);
  return true;
}
function autoEat(kind) { // H: étel, G: ital
  const S = G.S, k = kind === 'kaja' ? 'kaja' : 'ital';
  const opts = Object.keys(S.food).filter(id => FOODS[id][k] && S.food[id] > 0).sort((a, b) => (FOODS[b][k] || 0) - (FOODS[a][k] || 0));
  if (!opts.length) { UI.toast(kind === 'kaja' ? 'Nincs nálad ennivaló.' : 'Nincs nálad innivaló.', '#ff7a7a'); return; }
  // ne pazarolj: a legkisebb, ami elég
  const need = 100 - S.surv[k]; let pick = opts[opts.length - 1];
  for (const id of opts) if (FOODS[id][k] <= need + 10) { pick = id; break; }
  eatFood(pick);
}

const resName = cls => RESOURCES[cls].nev;
function drinkElix(id) {
  const S = G.S, P = G.P, E = ELIX[id]; if (!E || !(S.elix[id] > 0)) { UI.toast(`Nincs nálad: ${E ? E.nev : id}. Nagyi főz ilyet.`, '#ff7a7a'); return; }
  S.elix[id]--; G.buff(P, 'elix_' + id, E.t, E.mods);
  if (E.res) P.mp = Math.min(P.mmp, P.mp + P.mmp * E.res);
  Audio2.play('potion'); G.burst(P.x, P.y, E.c, 16, 90, 0.6); UI.toast(`${E.ikon} ${E.nev}`, E.c);
}
function useArtifact() {
  const S = G.S, P = G.P, ar = S.eq.artefakt;
  if (!ar || ar.req > S.lvl) { UI.toast('Nincs artefaktumod (Artefaktum hely a felszerelésben).', '#ff7a7a'); return; }
  if (P.artiCd > 0) { UI.toast(`Az artefaktum még töltődik (${Math.ceil(P.artiCd)} mp)`, '#aaa'); return; }
  const match = BASES[ar.base].res === S.cls;
  P.mp = Math.min(P.mmp, P.mp + P.mmp * (match ? 1 : 0.35)); P.sta = P.msta;
  P.artiCd = 50 * (1 - P.st.cdr);
  G.fxRing(P.x, P.y, 60, RESOURCES[S.cls].c, 0.6, 5); G.burst(P.x, P.y, RESOURCES[S.cls].c, 24, 140, 0.7);
  Audio2.play('legend'); UI.toast(`${BASES[ar.base].ikon} ${ar.nev}: ${match ? 'teljes' : 'részleges'} ${resName(S.cls).toLowerCase()}-töltés`, RESOURCES[S.cls].c);
}
