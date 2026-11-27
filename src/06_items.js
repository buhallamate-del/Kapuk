// ============================================================
//  TÁRGYAK: generálás, nevek, ár, leírás, kovácsolás
// ============================================================
let ITEM_UID = 1;
const WEAPON_KEYS = Object.keys(BASES).filter(k => BASES[k].slot === 'fegyver');
const ARMOR_KEYS = Object.keys(BASES).filter(k => BASES[k].slot !== 'fegyver');

function rollRarity(rng, mf = 0, floor = 0) {
  const r = rng() / (1 + mf / 100);
  let rar = r < 0.012 ? 3 : r < 0.09 ? 2 : r < 0.36 ? 1 : 0;
  return Math.max(rar, floor);
}
function pickBase(rng, ilvl, cls) {
  const isW = rng() < 0.36;
  let pool = (isW ? WEAPON_KEYS : ARMOR_KEYS).filter(k => (BASES[k].reqLvl || 0) <= ilvl + 2);
  if (isW && cls && rng() < 0.45) { // kicsit gyakrabban a kasztnak megfelelő fegyver
    const pref = { penge: ['kard', 'poroly', 'lancfuresz'], elem: ['palca', 'bot'], loves: ['puska', 'pisztoly', 'serettel'], mernok: ['pisztoly', 'raketaveto', 'plazmavezeto'] }[cls];
    const p2 = pool.filter(k => pref.includes(k)); if (p2.length) pool = p2;
  }
  let b = rng.pick(pool);
  if (BASES[b].slot === 'artefakt' && cls && rng() < 0.75) b = ARTI_FOR[cls];
  return b;
}
function genItem(ilvl, rng = RNG, o = {}) {
  ilvl = Math.max(1, Math.round(ilvl));
  let relic = null;
  if (o.relic) relic = RELICS.find(r => r.id === o.relic);
  const rar = relic ? 4 : (o.rar != null ? o.rar : rollRarity(rng, o.mf || 0, o.minRar || 0));
  const base = relic ? relic.base : (o.base || pickBase(rng, ilvl, o.cls));
  const B = BASES[base];
  const it = { uid: ITEM_UID++, base, ilvl, rar, upg: 0, aff: [], seed: Math.floor(rng() * 1e9) };
  const q = 0.85 + rng() * 0.3; // minőség
  if (B.slot === 'fegyver') { it.min = Math.max(1, Math.round(B.min * wepScale(ilvl) * q)); it.max = Math.max(it.min + 1, Math.round(B.max * wepScale(ilvl) * q)); }
  if (B.arm) it.arm = Math.round(B.arm * armScale(ilvl) * q);
  if (relic) {
    it.relic = relic.id;
    relic.aff.forEach(([id, mul]) => { const A = AFFIX.find(a => a.id === id); it.aff.push({ id, v: Math.round(A.v(ilvl, rng) * mul * 10) / 10 }); });
    it.nev = relic.nev;
  } else {
    const [a0, a1] = RARITY[rar].aff; const n = a0 + Math.floor(rng() * (a1 - a0 + 1));
    const pool = AFFIX.filter(a => (!a.slots || a.slots.includes(B.slot)) && (a.minL || 0) <= ilvl && !a.trade);
    // ritka és legendás tárgyon 35% eséllyel egy áldozat-affix: döntés, nem csak nagyobb szám
    const tp = AFFIX.filter(a => a.trade && a.slots.includes(B.slot));
    if (rar >= 2 && tp.length && rng() < 0.35) { const A = rng.pick(tp); it.aff.push({ id: A.id, v: A.v(ilvl, rng) }); }
    const used = new Set();
    for (let i = 0; i < n && pool.length; i++) {
      let A; let tries = 0;
      do { A = rng.pick(pool); tries++; } while ((used.has(A.id) || (A.rare && rng() < 0.7)) && tries < 20);
      if (used.has(A.id)) continue; used.add(A.id);
      let v = A.v(ilvl, rng); if (rar === 3) v = Math.round(v * 1.35 * 10) / 10;
      it.aff.push({ id: A.id, v });
    }
    it.nev = itemName(it, rng);
  }
  it.req = Math.max(1, Math.floor(ilvl * 0.8));
  return it;
}
function itemName(it, rng) {
  const tier = Math.min(4, Math.floor((it.ilvl - 1) / 14));
  const bn = BASE_NAMES[it.base][tier];
  if (it.rar === 0) return bn;
  const pre = it.aff.length ? AFFIX.find(a => a.id === it.aff[0].id).pre : '';
  if (it.rar === 3) {
    const leg = ['a Kapuőr', 'Bodor öröksége', 'a Csillagméhes', 'a Gutenberg-határ', '1957', 'a 976. tárhely', 'a Holdkomp', 'Novikov', 'a Fotongyűrű', 'a Kárpátok', 'Lehmann', 'a Bébi-univerzum', 'a Penrose-folyamat', 'Szélanyó', 'a Kola-fúrás', 'a Moho'];
    return `${bn} – ${rng.pick(leg)}`;
  }
  return pre ? `${pre} ${bn.charAt(0).toLowerCase() + bn.slice(1)}` : bn;
}
const upgMul = it => 1 + 0.1 * (it.upg || 0);
function itemDmg(it) { return [Math.round(it.min * upgMul(it)), Math.round(it.max * upgMul(it))]; }
function itemArm(it) { return Math.round((it.arm || 0) * upgMul(it)); }
function affVal(it, a) { return a.id === 'skill' ? a.v : Math.round(a.v * (1 + 0.05 * (it.upg || 0)) * 10) / 10; }
function itemValue(it) { return Math.round((8 + it.ilvl * 4) * [1, 2.2, 5, 12, 20][it.rar] * (1 + 0.15 * (it.upg || 0))); }
function salvageYield(it) { return Math.max(1, Math.round([1, 2, 5, 12, 20][it.rar] * (1 + it.ilvl / 15))); }
// átkovácsolás: a leggyengébb affix újrasorsolása; készített tárgyon korlátlanul, dobotton egyszer
function reforgeCost(it) { return { szilank: Math.round((4 + it.ilvl / 4) * (1 + 0.5 * (it.reforged || 0))), arany: Math.round(30 + it.ilvl * 8) }; }
function canReforge(it) { return it.aff.length && !it.relic && (it.crafted || !it.reforged); }
function reforge(it) {
  const B = BASES[it.base], pool = AFFIX.filter(a => (!a.slots || a.slots.includes(B.slot)) && (a.minL || 0) <= it.ilvl && !a.trade && !it.aff.some(x => x.id === a.id));
  if (!pool.length) return null;
  // a leggyengébb: a saját dobási tartományához képest legkisebb érték
  let wi = 0, wv = 1e9; it.aff.forEach((a, i) => { const A = AFFIX.find(x => x.id === a.id); if (A.trade) return; const ref = A.v(it.ilvl, makeRng(1)) || 1; const q = a.v / ref; if (q < wv) { wv = q; wi = i; } });
  const A = RNG.pick(pool); let v = A.v(it.ilvl, RNG); if (it.rar === 3) v = Math.round(v * 1.35 * 10) / 10;
  const old = it.aff[wi]; it.aff[wi] = { id: A.id, v }; it.reforged = (it.reforged || 0) + 1; return [old, it.aff[wi]];
}
function upgradeCost(it) { const u = it.upg || 0; return { arany: Math.round((20 + it.ilvl * 6) * Math.pow(1.6, u)), szilank: Math.round((2 + it.ilvl / 6) * (u + 1)), esely: Math.max(0.35, 1 - u * 0.07) }; }

function itemTooltip(it, cmp) {
  const B = BASES[it.base], R = RARITY[it.rar];
  let h = `<div class="tt-n" style="color:${R.c}">${esc(it.nev)}${it.upg ? ` <span class="upg">+${it.upg}</span>` : ''}</div>`;
  h += `<div class="tt-s">${R.nev} ${B.nev.toLowerCase()} · tárgyszint ${it.ilvl}</div>`;
  if (B.slot === 'fegyver') {
    const [a, b] = itemDmg(it); h += `<div class="tt-b">${a}–${b} ${DT[B.dtype].nev.toLowerCase()} sebzés</div><div class="tt-g">${B.spd.toFixed(2)} támadás/mp · ${{ melee: 'közelharc', ranged: 'lőfegyver', spell: 'mágia' }[B.kind]}</div>`;
    if (cmp && cmp.min) { const d = ((a + b) / 2 * B.spd) - ((itemDmg(cmp)[0] + itemDmg(cmp)[1]) / 2 * BASES[cmp.base].spd); h += `<div class="${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(1)} sebzés/mp a viselthez képest</div>`; }
  }
  if (it.arm) { h += `<div class="tt-b">${itemArm(it)} páncél</div>`; if (cmp && cmp.arm != null) { const d = itemArm(it) - itemArm(cmp); if (d) h += `<div class="${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d)} páncél</div>`; } }
  it.aff.forEach(a => { const A = AFFIX.find(x => x.id === a.id); h += `<div class="tt-a" ${A.trade ? 'style="color:#ffb070"' : ''}>${A.trade ? '⚖ ' : ''}${A.nev(affVal(it, a))}${it.mesterjegy === a.id ? ' ✦' : ''}</div>`; });
  if (cmp && cmp !== it) {
    const sum = x => { const o = {}; x.aff.forEach(a => { const A = AFFIX.find(y => y.id === a.id); if (A.trade) A.trade(affVal(x, a), (k, v) => o[k] = (o[k] || 0) + v); else o[a.id] = (o[a.id] || 0) + affVal(x, a); }); return o; };
    const A1 = sum(it), A0 = sum(cmp), keys = [...new Set([...Object.keys(A1), ...Object.keys(A0)])].filter(k => k !== 'skill');
    const NM = { dmgp: '% sebzés', hpp: '% életerő', armp: '% páncél', msp: '% mozgás', regenMul: '% töltődés', resall: '% állóság', resmax: ' erőforrás', gf: '% arany' };
    const lines = keys.map(k => { const d = Math.round(((A1[k] || 0) - (A0[k] || 0)) * 10) / 10; if (!d) return ''; const A = AFFIX.find(y => y.id === k); const t = A ? A.nev(Math.abs(d)).replace(/^[+−-]?\s?/, '') : Math.abs(d) + (NM[k] || ' ' + k); return `<span class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : '−'}${t.replace(/^\d+(\.\d)?/, Math.abs(d))}</span>`; }).filter(Boolean);
    if (lines.length) h += `<div class="tt-g" style="margin-top:4px">A viselthez képest:<br>${lines.join('<br>')}</div>`;
  }
  if (it.crafted) h += `<div class="tt-g">Készített tárgy: korlátlanul átkovácsolható.</div>`; else if (it.reforged) h += `<div class="tt-g">Már átkovácsolták.</div>`;
  if (it.relic) { const RL = RELICS.find(r => r.id === it.relic); h += `<div class="tt-r">✦ ${esc(RL.txt)}</div>`; }
  const P = G.P;
  h += `<div class="tt-req ${P && P.lvl < it.req ? 'down' : ''}">Szükséges szint: ${it.req}</div>`;
  h += `<div class="tt-v">Érték: ${fmt(itemValue(it))} arany</div>`;
  return h;
}

// ---------------- KÉZMŰVESSÉG ----------------
// Recept alapanyagok bázistípusonként; a világ (tier) saját anyaga emeli a tárgyszintet
const RECIPE = {
  kard: { vas: 4, fa: 1 }, poroly: { vas: 6, fa: 2 }, lancfuresz: { vas: 5, kristaly: 1 },
  palca: { fa: 3, kristaly: 2 }, bot: { fa: 4, kristaly: 2 },
  pisztoly: { vas: 3, fa: 1 }, puska: { vas: 4, fa: 3 }, serettel: { vas: 5, fa: 2 }, raketaveto: { vas: 6, kristaly: 1 }, plazmavezeto: { vas: 4, kristaly: 3 },
  sisak: { vas: 3, bor: 1 }, vert: { vas: 4, bor: 2, vaszon: 2 }, kesztyu: { bor: 3, vaszon: 1 }, csizma: { bor: 3, vas: 1 },
  amulett: { kristaly: 3, vas: 1 }, gyuru: { kristaly: 2, vas: 1 },
  dukko: { kristaly: 3, vas: 2 }, manakristaly: { kristaly: 5 }, homokora: { kristaly: 3, fa: 2 }, akkumulator: { vas: 3, kristaly: 3 },
};
function craftTiers() { return REGIONS.filter(r => G.S.prog.unlocked.includes(r.id)); }
function craftCost(base, tier) {
  const R = REGIONS[tier], mult = 1 + tier * 0.5, c = {};
  for (const k in RECIPE[base]) c[k] = Math.ceil(RECIPE[base][k] * mult);
  c[R.mat] = (c[R.mat] || 0) + 2 + tier;
  return { mats: c, gold: Math.round(25 * Math.pow(1.7, tier)) };
}
function canCraft(base, tier, extra) {
  const S = G.S, c = craftCost(base, tier);
  if (S.gold < c.gold) return false;
  for (const k in c.mats) if ((S.mats[k] || 0) < c.mats[k]) return false;
  if (extra && (S.mats.szilank || 0) < 6) return false;
  return true;
}
const CRAFT_FOCUS = ['dmgp', 'crit', 'critd', 'aspd', 'hp', 'arm', 'resgen', 'cdr', 'res_tuz', 'res_fagy', 'res_villam', 'ms'];
function craftItem(base, tier, extra, focus) {
  const S = G.S; if (!canCraft(base, tier, extra)) return null;
  const c = craftCost(base, tier);
  S.gold -= c.gold; for (const k in c.mats) S.mats[k] -= c.mats[k]; if (extra) S.mats.szilank -= 6;
  const R = REGIONS[tier]; const ilvl = R.lvl + 4 + diffLevel(S.prog.diffMax ? Math.min(S.prog.diff, S.prog.diffMax) : 0);
  let rar = 1; const r = RNG(); if (extra) rar = r < 0.12 ? 3 : 2; else rar = r < 0.04 ? 3 : r < 0.3 ? 2 : 1;
  const it = genItem(Math.min(ilvl, S.lvl + 6), RNG, { base, rar });
  it.crafted = true; if (rar === 3) it.nev = it.nev.replace(' – ', ' – mesterremek, ');
  // mesterjegy: a választott tulajdonság garantáltan rákerül, erős dobással – ezt a zsákmány nem tudja
  const F = focus && AFFIX.find(a => a.id === focus);
  if (F && (!F.slots || F.slots.includes(BASES[base].slot))) { const v = Math.round(F.v(it.ilvl, RNG) * 1.25 * 10) / 10; const i = it.aff.findIndex(a => a.id === focus); if (i >= 0) it.aff[i].v = Math.max(it.aff[i].v, v); else if (it.aff.length) it.aff[it.aff.length - 1] = { id: focus, v }; else it.aff.push({ id: focus, v }); it.mesterjegy = focus; }
  G.emit('craft', it); return it;
}
