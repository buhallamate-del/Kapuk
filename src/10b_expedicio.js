// ============================================================
//  EXPEDÍCIÓ – minél messzebb a Kaputól, annál veszélyesebb és annál többet ér
//  - szintenként, amit hazatérés nélkül teszel meg, nő a mélység (n)
//  - a pályán belül a bejárattól távolabbi termek ellenfelei erősebbek
//  - a többlet-tapasztalat az útinaplóba kerül: csak élve hazaérve íródik jóvá,
//    halálkor elvész. Ez köti össze a harcot és a hazatérést.
// ============================================================
const Exped = {
  st() { const S = G.S; if (!S.exp) S.exp = { n: 0, bank: 0, rid: null, best: 0 }; return S.exp; },
  // belépés egy szintre: lejáraton át folytatás, a Kapun át új kezdet
  enter(rid, viaExit) { const X = this.st(); X.n = viaExit ? X.n + 1 : 1; X.rid = rid; X.best = Math.max(X.best, X.n); if (X.n >= 3 && viaExit) UI.toast(`Mélység a Kaputól: ${X.n}. szint – erősebb ellenfelek, több tapasztalat. Az útinapló csak hazaérve számít.`, '#e6c47a', 4); },
  // a terem ellenfeleinek szintbónusza: távolság a bejárattól (0..1) és a mélység
  roomBonus(m, r) { const X = this.st(); const maxD = m.maxDist || 1, d = clamp((r.dist || 0) / maxD, 0, 1); r.distF = d; return Math.min(5, Math.round(d * 2 + (X.n - 1) * 0.75)); },
  // ölés: a többlet az útinaplóba megy
  onKill(e, xp) { const X = this.st(); const f = 0.12 * Math.max(0, X.n - 1) + 0.35 * (e.distF || 0); if (f > 0 && xp > 0) X.bank += Math.round(xp * f); },
  mf() { return 10 * Math.max(0, this.st().n - 1); },
  hungerMul() { return 1 + 0.08 * Math.max(0, this.st().n - 1); },
  portalTime() { return Math.min(4.5, 2.5 + 0.4 * Math.max(0, this.st().n - 1)); },
  // hazaérés: élve jóváírjuk, halálkor elveszik
  home(fromDeath) {
    const X = this.st(); const bank = X.bank, n = X.n, rid = X.rid;
    if (!fromDeath && bank > 0) { G.gainXp(bank); UI.toast(`📓 Hazahoztad az útinaplót: +${fmt(bank)} TP (${n}. szint mélyről)`, '#ffd34d', 5); }
    if (!fromDeath && n > 0) { G.emit('hazaert', { n, bank, rid }); X.bestHome = Math.max(X.bestHome || 0, n); }
    X.lost = fromDeath ? bank : 0; X.bank = 0; X.n = 0;
  },
  hud() { const X = this.st(); if (!G.map || G.inTown() || !X.n) return ''; return `Mélység a Kaputól: ${X.n}${X.bank ? ` · útinapló: ${fmt(X.bank)} TP` : ''}`; },
};
