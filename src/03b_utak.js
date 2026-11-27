// ============================================================
//  KASZTUTAK ÉS KÖLCSÖNHATÁSOK
//  Minden kasztnak két, egymást kizáró útja van (6. szinttől). Az egyiket választva a
//  másik zárva marad – Bodor felejtetése oldja. Mindkét útnak ára is van, nem csak bónusza.
// ============================================================
Object.assign(SKILLS, {
  // ---- Pengelovag ----
  verszomj: {
    cls: 'penge', nev: 'Út: Vérszomjas', ikon: '🩸', tipus: 'passziv', ut: 'A', req: 6, max: 3,
    desc: r => `Minden 10 düh után +${r}% sebzés. Életerőd fele alatt +${2 * r}% életlopás. A düh harc után ${2 + r} mp-ig nem párolog.<br><span class="ar">Ára: −${8 * r}% páncél.</span>`,
    mods: r => ({ verszomj: r, armp: -8 * r })
  },
  bastya: {
    cls: 'penge', nev: 'Út: Bástya', ikon: '🏰', tipus: 'passziv', ut: 'B', req: 6, max: 3,
    desc: r => `A kapott ütések ${50 * r}%-kal több dühöt adnak, +${5 * r}% kivédés, és ha legalább 50 dühöd van, −${5 * r}% kapott sebzés. A kivédés akkor is visszavág, ha nincs Ellentámadásod.<br><span class="ar">Ára: −${5 * r}% támadási sebesség.</span>`,
    mods: r => ({ bastya: r, block: 5 * r, aspd: -5 * r })
  },
  // ---- Elementalista ----
  langelme: {
    cls: 'elem', nev: 'Út: Lángoló elme', ikon: '🔥', tipus: 'passziv', ut: 'A', req: 6, max: 3,
    desc: r => `Az elemi reakciók (Hősokk, Túlvezetés, Ridegség) +${25 * r}%-kal erősebbek, a Túlvezetés ${90 + 30 * r} képpontra terjed.<br><span class="ar">Ára: a fagyás ${10 * r}%-kal rövidebb.</span>`,
    mods: r => ({ langelme: r, reakcio: 25 * r, freezeMul: -10 * r })
  },
  fagyelme: {
    cls: 'elem', nev: 'Út: Fagyos nyugalom', ikon: '❄', tipus: 'passziv', ut: 'B', req: 6, max: 3,
    desc: r => `A fagyás ${15 * r}%-kal tovább tart. Fagyott ellenfél megölése ${4 * r} manát ad, minden elemi reakció ${3 * r}% max. életerőnyi jégpajzsot.<br><span class="ar">Ára: −${10 * r}% tűzsebzés.</span>`,
    mods: r => ({ fagyelme: r, freezeMul: 15 * r })
  },
  // ---- Mesterlövész ----
  turelem: {
    cls: 'loves', nev: 'Út: Türelmes vadász', ikon: '🎯', tipus: 'passziv', ut: 'A', req: 6, max: 3,
    desc: r => `A Fókusz legfeljebb ${5 + r} töltetig gyűlik, az Átütő lövés töltetenként további +${8 * r}%-ot sebez.<br><span class="ar">Ára: −${4 * r}% mozgási sebesség; célpontváltáskor a Fókusz elvész.</span>`,
    mods: r => ({ turelem: r, msp: -4 * r })
  },
  gerilla: {
    cls: 'loves', nev: 'Út: Gerillaharcos', ikon: '🌿', tipus: 'passziv', ut: 'B', req: 6, max: 3,
    desc: r => `Kitérés után 2 mp-ig a lövéseid +${15 * r}%-ot sebeznek és átütnek egy ellenfelet. Tökéletes kitérésnél minden képesség újratöltése ${r} mp-cel csökken. A Fókusz célpontváltáskor csak feleződik.<br><span class="ar">Ára: −${10 * r}% kritikus sebzés.</span>`,
    mods: r => ({ gerilla: r, critd: -10 * r })
  },
  // ---- Mérnök ----
  gepesz: {
    cls: 'mernok', nev: 'Út: Gépész', ikon: '🔩', tipus: 'passziv', ut: 'A', req: 6, max: 3,
    desc: r => `A gépek ${15 * r}%-kal tovább élnek, a Hálózat-bónusz +${50 * r}%. ${r >= 2 ? '+1 lövegtorony egyszerre. ' : '(2. rangtól +1 lövegtorony.) '}<br><span class="ar">Ára: a saját lövéseid −${10 * r}% sebzést okoznak.</span>`,
    mods: r => ({ gepesz: r, rangedp: -10 * r })
  },
  tuzer: {
    cls: 'mernok', nev: 'Út: Tüzér', ikon: '💥', tipus: 'passziv', ut: 'B', req: 6, max: 3,
    desc: r => `A Rakétazápor +${r} rakétát lő, a robbanások +${10 * r}%-ot sebeznek és 2 mp-re meggyújtanak.<br><span class="ar">Ára: eggyel kevesebb drón lehet egyszerre (legalább egy).</span>`,
    mods: r => ({ tuzer: r, splashp: 10 * r })
  },
});

// Útválasztás: egy kaszton belül csak az egyik út tanulható
const Skills2 = {
  other(id) { const sk = SKILLS[id]; if (!sk || !sk.ut) return null; return Object.keys(SKILLS).find(k => SKILLS[k].cls === sk.cls && SKILLS[k].ut && SKILLS[k].ut !== sk.ut); },
  canLearn(S, id) { const o = this.other(id); return !o || !S.skills[o]; },
};

// ---------------- Elemi reakciók (minden elemi sebzésre élnek, az Elementalista útjai erősítik) ----------------
const Reactions = {
  // visszaadja a módosított sebzést; a mellékhatásokat itt intézi
  apply(e, amt, dt, o) {
    if (o.noReact || amt <= 0) return amt;
    const P = G.P, st = P.st, boost = 1 + (st.reakcio || 0) / 100;
    let hit = null;
    if (dt === 'tuz' && e.freeze > 0) { // Hősokk: a fagyott célpont szétpattan a hőtől
      amt *= 1.7 * boost; e.freeze = 0; hit = ['HŐSOKK', '#ffb070'];
      G.burst(e.x, e.y, '#dff4ff', 16, 160, 0.5); G.hitArea(e.x, e.y, 60, { a: amt * 0.3, c: false }, 'fiz', 'p', { noReact: true, fx: 'nova2' });
    } else if (dt === 'villam' && e.burn) { // Túlvezetés: a villám szétteríti a lángot
      amt *= 1.25 * boost; hit = ['TÚLVEZETÉS', '#f4f06a']; const r = 90 + 30 * (st.langelme || 0);
      for (const x of G.near(e.x, e.y, r)) if (x !== e && !x.burn) { x.burn = { dps: e.burn.dps * 0.8, t: 3 }; G.parts.push({ bolt: true, x1: e.x, y1: e.y, x2: x.x, y2: x.y, t: 0, life: 0.2, c: '#ffb347' }); }
    } else if (dt === 'fagy' && e.shock > 0) { // Ridegség: a sokkolt test könnyebben dermed
      amt *= 1.3 * boost; e.brittle = 1.5; hit = ['RIDEGSÉG', '#9fe8ff'];
    }
    if (hit) {
      if (!e.reactT || G.t - e.reactT > 0.6) { G.text(e.x, e.y - e.r - 20, hit[0], hit[1], 12, { life: 0.8 }); e.reactT = G.t; }
      if (st.fagyelme) P.shieldV = Math.min(P.mhp * 0.3, P.shieldV + P.mhp * 0.03 * st.fagyelme);
      G.S.stats.reactions = (G.S.stats.reactions || 0) + 1; G.emit('reaction', hit[0]);
    }
    if (dt === 'tuz' && st.fagyelme) amt *= 1 - 0.1 * st.fagyelme;
    return amt;
  },
};

// ---------------- Erőforrás-állapotok (kasztonként) ----------------
const ResState = {
  // Düh-küszöbök: 50 fölött Felbőszült, teli dühnél a következő képesség ingyenes és erősebb
  tick(P, dt) {
    const S = G.S, C = CLASSES[S.cls], st = P.st;
    if (C.rage) {
      const tier = P.mp >= P.mmp - 0.5 ? 2 : P.mp >= 50 ? 1 : 0;
      if (tier !== P.rageTier) {
        if (tier >= 1 && !(P.rageTier >= 1)) G.buff(P, 'felboszult', 9999, { aspd: 12, msp: 6 });
        if (tier === 0) { P.buffs = P.buffs.filter(b => b.id !== 'felboszult'); recalc(P); }
        if (tier === 2) { G.text(P.x, P.y - 36, 'TOMBOLÓ', '#ff4433', 13); G.fxRing(P.x, P.y, 40, '#ff4433', 0.4, 3); }
        P.rageTier = tier;
      }
    }
    // Mana-túltöltés: teli manánál a töltődés egy túltöltő tartályba folyik (max. 30%)
    if (S.cls === 'elem') {
      if (P.mp >= P.mmp - 0.01) P.over = Math.min(P.mmp * 0.3, (P.over || 0) + st.mregen * dt * 0.6);
      else if (P.over > 0) P.over = Math.max(0, P.over - P.mmp * 0.02 * dt);
    }
    if (P.empowerT > 0) P.empowerT -= dt;
    if (P.gerillaT > 0) P.gerillaT -= dt;
  },
  // képesség használata előtt: költség módosítása és erősítés
  beforeCast(P, sk, cost) {
    const S = G.S, C = CLASSES[S.cls];
    if (C.rage && P.rageTier === 2 && !sk.spendAll && !FORBIDDEN[sk.id]) { P.empowerT = 0.8; P.empowerMul = 1.3; G.text(P.x, P.y - 40, 'ingyenes!', '#ff7a5a', 12); return 0; }
    if (S.cls === 'elem' && P.over > 0 && cost > 0) { const use = Math.min(P.over, cost); P.over -= use; P.empowerT = 0.8; P.empowerMul = 1.25; if (use >= cost * 0.99) G.text(P.x, P.y - 40, 'túltöltve', '#9fc8ff', 11); return cost - use; }
    return cost;
  },
};

// ---------------- Fókusz (Mesterlövész) ----------------
const Focus = {
  max(P) { return 5 + (P.st.turelem || 0); },
  onHit(P, e) {
    if (P.focusE === e) P.focus = Math.min(this.max(P), (P.focus || 0) + (P.bulletTime ? 2 : 1));
    else { P.focus = P.st.gerilla ? Math.floor((P.focus || 0) / 2) + 1 : 1; P.focusE = e; }
    P.focusT = 3;
  },
  tick(P, dt) { if (P.focus > 0) { P.focusT -= dt; if (P.focusT <= 0) { P.focus = 0; P.focusE = null; } } },
  spend(P) { const f = P.focus || 0; P.focus = 0; return f; },
};

// ---------------- Gép-hálózat (Mérnök) ----------------
const Machines = {
  isM: a => a.kind === 'dron' || a.kind === 'torony',
  // a közeli gépek összekapcsolódnak: kapcsolatonként +8% gépsebzés (max. 4)
  links(a) { let n = 0; for (const b of G.allies) if (b !== a && b.life > 0 && this.isM(b) && b.owner === a.owner && dist2(a.x, a.y, b.x, b.y) < 260 * 260) n++; return Math.min(4, n); },
  mul(a) { const P = G.P; return 1 + 0.08 * (a.links || 0) * (1 + 0.5 * (P.st.gepesz || 0)); },
  // a torony megjelöli a célpontját; a drónok és rakéták azt választják
  target(x, y, range) { let best = null, bd = range * range; for (const e of G.enemies) { if (e.dead || e.invisNow || !(e.tmark > 0)) continue; const d = dist2(x, y, e.x, e.y); if (d < bd && los(G.map, x, y, e.x, e.y)) { bd = d; best = e; } } return best || G.nearestEnemy(x, y, range); },
  expire(a) { const P = G.P; if (a.grey || a.refunded || !this.isM(a) || a.owner !== P) return; a.refunded = true; P.mp = Math.min(P.mmp, P.mp + (a.kind === 'dron' ? 22 : 26) * 0.25); },
};
