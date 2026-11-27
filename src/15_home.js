// ============================================================
//  OTTHON: telek, házépítés (Sims-szerű), bútorok, kapcsolatok, házasság
// ============================================================
const HW = 28, HH = 20; // telek mérete csempében (kerítéssel)
const BUILD = {
  // falak és ajtó
  fafal: { kat: 'fal', nev: 'Gerendafal', ikon: '🟫', ar: 6, mats: { fa: 1 }, wall: true, c: '#7a5232', c2: '#5a3a22' },
  kofal: { kat: 'fal', nev: 'Kőfal', ikon: '⬜', ar: 10, mats: { vas: 1 }, wall: true, c: '#8a8a88', c2: '#5e5e5c' },
  teglafal: { kat: 'fal', nev: 'Téglafal', ikon: '🟥', ar: 14, mats: {}, wall: true, c: '#9a4a36', c2: '#6e3426' },
  uvegfal: { kat: 'fal', nev: 'Üvegfal', ikon: '🔲', ar: 20, mats: { kristaly: 1 }, wall: true, c: '#9fd8ef', c2: '#5a8aa0', glass: true },
  ajto: { kat: 'fal', nev: 'Ajtó', ikon: '🚪', ar: 15, mats: { fa: 1 }, door: true, c: '#8a5a2a' },
  // padlók
  parketta: { kat: 'padlo', nev: 'Parketta', ikon: '🪵', ar: 3, mats: {}, floor: '#9a6a3a', floor2: '#86592e' },
  csempe: { kat: 'padlo', nev: 'Csempe', ikon: '◻', ar: 4, mats: {}, floor: '#d8d4c8', floor2: '#bcb8ac', grid: true },
  kopadlo: { kat: 'padlo', nev: 'Kőpadló', ikon: '▪', ar: 3, mats: {}, floor: '#6e6e6a', floor2: '#5e5e5a' },
  szonyegp: { kat: 'padlo', nev: 'Szőnyegpadló', ikon: '🟪', ar: 6, mats: { vaszon: 1 }, floor: '#7a3a5a', floor2: '#6a2e4c', comf: 1 },
  ut: { kat: 'padlo', nev: 'Kavicsos út', ikon: '⚪', ar: 2, mats: {}, floor: '#a89a80', floor2: '#988a70' },
  // bútorok (funkcióval)
  agy: { kat: 'butor', nev: 'Ágy', ikon: '🛏', ar: 120, mats: { fa: 4, vaszon: 3 }, solid: true, comf: 6, fx: 'alvas', desc: 'Alvás otthon: ingyen, és a kényelemtől függően Kipihent áldást ad.' },
  tuzhely: { kat: 'butor', nev: 'Tűzhely', ikon: '🍳', ar: 150, mats: { vas: 5 }, solid: true, comf: 2, fx: 'fozes', desc: 'Főzés: házi ételek alapanyagból.' },
  munkapad: { kat: 'butor', nev: 'Munkapad', ikon: '🔨', ar: 200, mats: { fa: 6, vas: 4 }, solid: true, comf: 1, fx: 'craft', desc: 'Tárgykészítés otthon is.' },
  ust: { kat: 'butor', nev: 'Főzőüst', ikon: '⚗', ar: 180, mats: { vas: 3, kristaly: 2 }, solid: true, comf: 1, fx: 'alkimia', desc: 'Elixírfőzés otthon is.' },
  szekreny: { kat: 'butor', nev: 'Szekrény', ikon: '🗄', ar: 90, mats: { fa: 5 }, solid: true, comf: 2, fx: 'raktar', desc: 'A tárhelyed otthonról is elérhető.' },
  trofea: { kat: 'butor', nev: 'Trófeafal', ikon: '🏆', ar: 300, mats: { fa: 4, vas: 2 }, solid: true, comf: 4, fx: 'trofea', desc: 'Minden legyőzött világúr +2% sebzést ad.' },
  kandallo: { kat: 'butor', nev: 'Kandalló', ikon: '🔥', ar: 220, mats: { vas: 6 }, solid: true, comf: 8, fx: 'kandallo', desc: '+10% életerő-töltődés, sokat ad a kényelemhez.', light: true },
  konyvespolc: { kat: 'butor', nev: 'Könyvespolc', ikon: '📚', ar: 160, mats: { fa: 6 }, solid: true, comf: 4, fx: 'konyv', desc: '+5% tapasztalat.' },
  asztal: { kat: 'butor', nev: 'Asztal', ikon: '🪑', ar: 40, mats: { fa: 3 }, solid: true, comf: 2 },
  szek: { kat: 'butor', nev: 'Szék', ikon: '💺', ar: 20, mats: { fa: 1 }, comf: 1 },
  kanape: { kat: 'butor', nev: 'Kanapé', ikon: '🛋', ar: 140, mats: { vaszon: 4, fa: 2 }, solid: true, comf: 6 },
  lampa: { kat: 'butor', nev: 'Lámpa', ikon: '💡', ar: 35, mats: { vas: 1 }, comf: 1, light: true },
  festmeny: { kat: 'butor', nev: 'Festmény a Kapuról', ikon: '🖼', ar: 80, mats: {}, comf: 3 },
  szonyeg: { kat: 'butor', nev: 'Perzsaszőnyeg', ikon: '🟧', ar: 60, mats: { vaszon: 2 }, comf: 2 },
  hutoszekreny: { kat: 'butor', nev: 'Jégverem', ikon: '🧊', ar: 120, mats: { vas: 3, kristaly: 1 }, solid: true, comf: 1, fx: 'hutes', desc: 'Az élelem otthon nem romlik, és naponta ad egy kulacs vizet.' },
  akvarium: { kat: 'butor', nev: 'Akvárium', ikon: '🐠', ar: 250, mats: { kristaly: 3 }, solid: true, comf: 5 },
  // kert
  meheskert: { kat: 'kert', nev: 'Méhes', ikon: '🐝', ar: 200, mats: { fa: 4 }, solid: true, comf: 2, fx: 'mez', desc: 'Naponta 2 csillagmézet és egy mézescsuprot ad.' },
  vetemenyes: { kat: 'kert', nev: 'Veteményes', ikon: '🥕', ar: 100, mats: { fa: 2 }, comf: 1, fx: 'kert', desc: 'Naponta 2 gyógyfüvet és egy lángost ad (Nagyi receptje).' },
  kut: { kat: 'kert', nev: 'Kút', ikon: '⛲', ar: 160, mats: { vas: 2 }, solid: true, comf: 3, fx: 'kut', desc: 'Naponta 3 kulacs víz.' },
  fa: { kat: 'kert', nev: 'Gyümölcsfa', ikon: '🌳', ar: 60, mats: {}, solid: true, comf: 2 },
  virag: { kat: 'kert', nev: 'Virágágyás', ikon: '🌷', ar: 15, mats: {}, comf: 1 },
  levendula: { kat: 'kert', nev: 'Levendula', ikon: '💜', ar: 20, mats: {}, comf: 1 },
  pad: { kat: 'kert', nev: 'Kerti pad', ikon: '🪑', ar: 45, mats: { fa: 2 }, comf: 2 },
  tuzrako: { kat: 'kert', nev: 'Tűzrakóhely', ikon: '🏕', ar: 50, mats: { fa: 3 }, solid: true, comf: 3, light: true },
};
const BUILD_KAT = { fal: 'Falak és ajtók', padlo: 'Padlók', butor: 'Bútorok', kert: 'Kert', bont: 'Bontás' };
const HOME_RECIPES = {
  gulyas: { nev: 'Házi gulyás', ikon: '🍲', mats: { bor: 1, gyogyfu: 1 }, food: { kaja: 75, ital: 25 }, buff: { t: 600, mods: { hpp: 10 } }, desc: 'Laktató, 10 percre +10% életerő.' },
  langosh: { nev: 'Házi lángos', ikon: '🫓', mats: { gyogyfu: 1 }, gold: 10, give: 'langos', desc: 'Nagyi receptje.' },
  pogacsah: { nev: 'Tepertős pogácsa (3 db)', ikon: '🥐', mats: { bor: 1 }, give: 'pogacsa', n: 3, desc: 'Nagyi szerint csak egyet.' },
  mezestea: { nev: 'Mézes tea', ikon: '🍵', mats: { mez: 1, gyogyfu: 1 }, food: { ital: 50, alvas: 25 }, desc: 'Ébren tart és szomjat olt.' },
};

// ---------------- új lakók: kapcsolatok, házasság ----------------
Object.assign(NPCS, {
  liza: {
    nev: 'Liza', cim: 'Szélanyó unokája, kertész', pos: [27.5, 40.5], look: { c: '#7fae5a', c2: '#e8d090', hat: 'kendo' }, menu: [], romance: true, likes: ['gyogyfu', 'mez', 'virag'],
    lines: ['Szélanyó szerint túl hangosan lépsz. Szerintem csak határozottan.', 'Ha a levendula elvirágzik, az nem a vég. Csak szünet.', 'Hoztál gyógyfüvet? Abból minden lesz: tea, kenőcs, nyugalom.', 'A Bambuszvölgyben nőttem fel. Ott a csend is beszél.'],
    tips: ['Szélanyó a Bambuszvölgyben tanít. Azt mondja: aki nem hallja a saját lépteit, az nem hallja a többiekét sem.', 'A virág nem siet. Mégis mindig odaér.'],
    perk: { nev: 'Liza kertje', desc: 'Naponta 3 gyógyfű és egy mézes tea.', mods: { regen: 2 } },
  },
  mark: {
    nev: 'Vasas Márk', cim: 'a Főkonstruktőr inasa', pos: [13.5, 18.5], look: { c: '#5a6070', c2: '#ffcc33', hat: 'goggles' }, menu: [], romance: true, likes: ['vas', 'kristaly', 'uzemanyag'],
    lines: ['Egyszer én is építek egy hajtóművet. Egy kicsit. Egy biciklire.', 'A Főkonstruktőr szerint túl sokat kérdezek. Szerintem túl keveset.', 'Hoztál vasat? Abból bármi lehet. Majdnem.', 'Ha valami nem működik, az még nem elromlott. Csak nem fejeztük be.'],
    tips: ['A legjobb kardot nem a legkeményebb vasból kovácsolják, hanem a legtürelmesebb kovácsok.', 'Egy jó kovács a tárgyon hallja meg, hogy készen van.'],
    perk: { nev: 'Márk műhelye', desc: 'Az erősítés 10%-kal nagyobb eséllyel sikerül, naponta 3 vasérc.', mods: { arm: 20 } },
  },
  dora: {
    nev: 'Csillag Dóra', cim: 'csillagász, a horizont kutatója', pos: [47.5, 19.5], look: { c: '#3a3a7a', c2: '#c48cff', hat: 'glasses' }, menu: [], romance: true, likes: ['kristaly', 'egzotikus', 'jel'],
    lines: ['Tudtad, hogy a fekete lyuk körül a fény körbe tud menni? Egyszer odaállnék, hogy lássam a tarkómat.', 'A Holdnál messzebb még senki nem járt. Kivéve téged, a Kapun át.', 'Hoztál egzotikus anyagot? Negatív energiasűrűség! Ez olyan, mint a karácsony.', 'Azt mondják, minden fekete lyuk mögött új univerzum születik. Szerintem ez romantikus.'],
    tips: ['Az Eseményhorizontban a tér 4200-nál visszahajlik önmagába.', 'A Penrose-folyamat: az ergoszférában ledobott tömegből energiát nyersz. Csalás? Nem. Fizika.'],
    perk: { nev: 'Dóra csillagtérképe', desc: '+10% tapasztalat és +5% téridő-állóság.', mods: { xpb: 10, res_ter: 5 } },
  },
  bence: {
    nev: 'Hajnal Bence', cim: 'a város pékje', pos: [33.5, 15.5], look: { c: '#e8d8c0', c2: '#a0703a', hat: 'cap' }, menu: [], romance: true, likes: ['mez', 'gyogyfu', 'fa'],
    lines: ['Hajnali négykor kelek. Akkor még a Kapu is alszik.', 'A kenyér olyan, mint a barátság: idő kell neki, meg egy kis meleg.', 'Nagyi pogácsája jobb, mint az enyém. Ezt ne mondd el neki.', 'Ha mézet hozol, mézeskalácsot sütök belőle.'],
    tips: ['A kovász él. Ha nem eteted, megsértődik.', 'A legjobb lángoshoz a tésztának pihennie kell. Neked is.'],
    perk: { nev: 'Bence pékárui', desc: 'Naponta 3 lángos és 3 pogácsa; az étel 25%-kal tovább tart.', mods: { hpp: 5 } },
  },
});
const REL_STAGES = [[0, 'Ismerős'], [25, 'Barát'], [55, 'Közeli barát'], [80, 'Szerelem'], [100, 'Jegyesek']];

const Home = {
  day() { return new Date().toISOString().slice(0, 10); },
  S() { const S = G.S; if (!S.home) S.home = { owned: false, cells: {}, last: '' }; S.rel = S.rel || {}; return S.home; },
  rel(id) { const S = G.S; S.rel = S.rel || {}; return S.rel[id] || (S.rel[id] = { p: 0, talk: '', gift: '', date: '' }); },
  stage(p) { let s = REL_STAGES[0][1]; for (const [v, n] of REL_STAGES) if (p >= v) s = n; return s; },
  talked(id) { const N = NPCS[id]; if (!N || !N.romance) return; const r = this.rel(id), d = this.day(); if (r.talk !== d && G.S.spouse !== id) { r.talk = d; r.p = Math.min(100, r.p + 4); } },
  mods(S, add) {
    const h = S.home; if (!h || !h.owned) return;
    const has = this.has();
    if (has.trofea) add('dmgp', 2 * Object.keys(S.prog.bosses).length);
    if (has.konyv) add('xpb', 5);
    if (has.kandallo) add('regenMul', 10);
    if (S.spouse && NPCS[S.spouse] && NPCS[S.spouse].perk) { const m = NPCS[S.spouse].perk.mods; for (const k in m) add(k, m[k]); }
  },
  has() { const h = G.S.home, r = {}; if (!h || !h.cells) return r; for (const k in h.cells) { const o = h.cells[k].o; if (o && BUILD[o].fx) r[BUILD[o].fx] = (r[BUILD[o].fx] || 0) + 1; } return r; },
  comfort() { const h = G.S.home; let c = 0; for (const k in h.cells) { const cl = h.cells[k]; if (cl.o) c += BUILD[cl.o].comf || 0; if (cl.f) c += BUILD[cl.f].comf || 0; } if (G.S.spouse) c += 15; return c; },
  dlgOptions(id) {
    const N = NPCS[id], S = G.S; let h = '';
    if (N.romance) {
      const r = this.rel(id), d = this.day();
      if (S.spouse === id) h += `<button data-a="hmSpouse" data-id="${id}">💍 Házastársad – ${N.perk.nev}: ${N.perk.desc}</button>`;
      else {
        h += `<div class="small" style="margin:4px 0">Kapcsolat: <b>${this.stage(r.p)}</b> · ${Math.round(r.p)}/100 · Kedveli: ${N.likes.map(m => MATS[m] ? MATS[m].nev : m).join(', ')}</div>`;
        h += `<button data-a="hmGift" data-id="${id}" ${r.gift === d ? 'disabled' : ''}>🎁 Ajándék adása ${r.gift === d ? '(ma már adtál)' : ''}</button>`;
        if (r.p >= 55) h += `<button data-a="hmDate" data-id="${id}" ${r.date === d ? 'disabled' : ''}>🌙 Randevú a Kapu fényeinél (30 arany) ${r.date === d ? '(ma már voltatok)' : ''}</button>`;
        if (r.p >= 100 && !S.spouse) h += `<button class="pri" data-a="hmPropose" data-id="${id}">💍 Megkérem a kezét (kell: ritka vagy jobb gyűrű a táskában, és egy otthon ággyal)</button>`;
      }
    }
    if (id === 'leltaros') h += `<button data-a="hmPlot">🏡 ${this.S().owned ? 'Otthonom' : 'Telket szeretnék venni'}</button>`;
    return h;
  },
  // ---------- belépés ----------
  enter() {
    const H = this.S(); if (!H.owned) { UI.toast('Még nincs telked. A Leltáros intézi.', '#e6c47a'); return; }
    G.clearWorld(); G.retPortalHome = G.retPortal;
    const m = makeMapObj(HW, HH); m.region = 'otthon'; m.floor = 0; m.style = 'home'; m.lvl = 1;
    this.rebuild(m);
    m.start = { x: (HW / 2) * TILE, y: (HH - 3) * TILE };
    m.objs.push({ type: 'portal', x: (HW / 2) * TILE, y: (HH - 2) * TILE + 6, r: 18, label: 'Vissza Kapuvárosba', c: '#9fe07a', inter: () => G.enterTown() });
    if (G.S.spouse) { const N = NPCS[G.S.spouse]; m.objs.push({ type: 'npc', id: G.S.spouse, x: (HW / 2 - 3) * TILE, y: (HH / 2) * TILE, hx: (HW / 2 - 3) * TILE, hy: (HH / 2) * TILE, r: 13, wander: true, label: N.nev, inter: () => UI.npc(G.S.spouse) }); }
    G.map = m; G.pal = { void: '#16220f' }; G.staticLayer = this.renderLayer(m);
    const P = G.P; P.x = m.start.x; P.y = m.start.y; P.dash = null; P.vx = P.vy = 0; P.history = []; G.cam.x = P.x; G.cam.y = P.y; UI.minimapDirty = true;
    UI.setRegion('Otthon', `Kényelem: ${this.comfort()} · U: építő mód`);
    this.daily(); Audio2.play('door');
  },
  rebuild(m) {
    const H = this.S(); m.t.fill(T_WALL);
    for (let y = 1; y < HH - 1; y++) for (let x = 1; x < HW - 1; x++) m.t[y * HW + x] = T_FLOOR;
    m.objs = m.objs.filter(o => o.type === 'portal' || o.type === 'npc'); m.lights = [];
    for (const k in H.cells) {
      const [x, y] = k.split(',').map(Number), c = H.cells[k], i = y * HW + x;
      if (c.w && BUILD[c.w].wall) m.t[i] = T_WALL;
      if (c.o) { const B = BUILD[c.o]; if (B.solid) m.t[i] = T_OBST; if (B.fx && ['alvas', 'fozes', 'craft', 'alkimia', 'raktar', 'trofea'].includes(B.fx)) m.objs.push({ type: 'hfurn', fx: B.fx, x: (x + 0.5) * TILE, y: (y + 0.5) * TILE, r: 22, label: B.nev, inter: () => this.use(B.fx) }); if (B.light) m.lights.push({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE, r: 200 }); }
    }
    for (let i = 0; i < HW * HH; i++) m.shade[i] = (i * 2654435761 >>> 24);
  },
  refresh() { const m = G.map; if (!m || m.region !== 'otthon') return; this.rebuild(m); G.staticLayer = this.renderLayer(m); UI.minimapDirty = true; UI.setRegion('Otthon', `Kényelem: ${this.comfort()} · U: építő mód`); recalc(G.P); },
  renderLayer(m) {
    const c = document.createElement('canvas'); c.width = HW * TILE; c.height = HH * TILE; const g = c.getContext('2d'), H = this.S();
    for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) { const s = m.shade[y * HW + x] / 255; g.fillStyle = `rgb(${70 + s * 18 | 0},${104 + s * 20 | 0},${58 + s * 12 | 0})`; g.fillRect(x * TILE, y * TILE, TILE, TILE); if (s > 0.85) { g.fillStyle = '#9cc47a'; g.fillRect(x * TILE + 8, y * TILE + 12, 2, 5); } }
    // kerítés
    g.fillStyle = '#6b4a2a'; for (let x = 0; x < HW; x++) { if (x !== HW / 2 && x !== HW / 2 - 1) { g.fillRect(x * TILE + 4, (HH - 1) * TILE + 6, 5, 22); } g.fillRect(x * TILE + 4, 6, 5, 22); } for (let y = 0; y < HH; y++) { g.fillRect(6, y * TILE + 4, 22, 5); g.fillRect((HW - 1) * TILE + 6, y * TILE + 4, 22, 5); }
    g.fillStyle = '#8a6a40'; g.fillRect(0, (HH - 1) * TILE + 12, HW * TILE, 4); g.fillRect(0, 14, HW * TILE, 4);
    for (const k in H.cells) {
      const [x, y] = k.split(',').map(Number), cl = H.cells[k], px = x * TILE, py = y * TILE;
      if (cl.f) { const B = BUILD[cl.f]; g.fillStyle = (x + y) & 1 ? B.floor : B.floor2; g.fillRect(px, py, TILE, TILE); if (B.grid) { g.strokeStyle = 'rgba(0,0,0,.15)'; g.strokeRect(px + .5, py + .5, TILE - 1, TILE - 1); } else { g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(px, py + (x % 2) * 16, TILE, 1); } }
    }
    for (const k in H.cells) {
      const [x, y] = k.split(',').map(Number), cl = H.cells[k], px = x * TILE, py = y * TILE;
      if (cl.w) { const B = BUILD[cl.w]; if (B.door) { g.fillStyle = B.c; g.fillRect(px + 4, py + 2, TILE - 8, TILE - 4); g.fillStyle = '#ffd27a'; g.fillRect(px + TILE - 11, py + 15, 3, 3); } else { g.fillStyle = B.c; g.fillRect(px, py, TILE, TILE); g.fillStyle = B.c2; g.fillRect(px, py + TILE - 9, TILE, 9); if (B.glass) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(px + 5, py + 4, 4, 14); } else { g.strokeStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.moveTo(px, py + 8); g.lineTo(px + TILE, py + 8); g.moveTo(px + 16, py); g.lineTo(px + 16, py + 8); g.stroke(); } } }
      if (cl.o) { const B = BUILD[cl.o]; g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(px + 16, py + 26, 12, 4, 0, 0, 7); g.fill(); g.font = '24px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(B.ikon, px + 16, py + 15); }
    }
    g.textBaseline = 'alphabetic';
    return c;
  },
  // ---------- napi termés ----------
  daily() {
    const S = G.S, H = this.S(), d = this.day(); if (H.last === d) return; H.last = d;
    const has = this.has(), got = [];
    const give = (k, n, kind) => { if (kind === 'food') S.food[k] = (S.food[k] || 0) + n; else S.mats[k] = (S.mats[k] || 0) + n; got.push(`${n} ${kind === 'food' ? FOODS[k].nev : MATS[k].nev}`); };
    if (has.mez) { give('mez', 2 * has.mez); give('mezescsupor', has.mez, 'food'); }
    if (has.kert) { give('gyogyfu', 2 * has.kert); give('langos', has.kert, 'food'); }
    if (has.kut) give('viz', 3, 'food');
    if (has.hutes) give('viz', 1, 'food');
    if (S.spouse === 'liza') { give('gyogyfu', 3); }
    if (S.spouse === 'mark') give('vas', 3);
    if (S.spouse === 'bence') { give('langos', 3, 'food'); give('pogacsa', 3, 'food'); }
    if (S.spouse) { G.buff(G.P, 'hazastars', 900, { dmgp: 10, msp: 5 }); got.push('házastársi áldás: +10% sebzés 15 percig'); }
    if (got.length) setTimeout(() => UI.toast(`🏡 Otthoni termés: ${got.join(', ')}`, '#9fe07a', 6), 600);
  },
  // ---------- bútorok használata ----------
  use(fx) {
    const S = G.S, P = G.P;
    if (fx === 'alvas') {
      const c = this.comfort(); S.surv.ebren = 100; P.hp = P.mhp; P.sta = P.msta; recalc(P);
      const xpb = Math.min(40, Math.round(c / 3)), dmg = Math.min(20, Math.round(c / 6));
      G.buff(P, 'pihent', 1200, { xpb, dmgp: dmg }); UI.sleepFade();
      UI.toast(`Kialudtad magad otthon. Kipihent: +${xpb}% tapasztalat, +${dmg}% sebzés 20 percig (kényelem: ${c}).${S.spouse ? ' ' + NPCS[S.spouse].nev + ' reggelit készített.' : ''}`, '#c48cff', 6);
      if (S.spouse) { S.surv.kaja = Math.min(100, S.surv.kaja + 50); S.surv.ital = Math.min(100, S.surv.ital + 40); }
    }
    else if (fx === 'craft') { UI.openShop('craft', 'Munkapad'); }
    else if (fx === 'alkimia') { UI.openShop('alkimia', 'Főzőüst'); }
    else if (fx === 'raktar') { UI.openShop('raktar', 'Szekrény (a 976. tárhely)'); }
    else if (fx === 'fozes') { UI.openShop('fozes', 'Konyha'); }
    else if (fx === 'trofea') { const b = Object.keys(S.prog.bosses); UI.toast(b.length ? `🏆 ${b.map(id => BOSSES[id].nev).join(' · ')} – +${2 * b.length}% sebzés` : 'A trófeafal még üres.', '#ffd34d', 6); }
  },
  // ---------- építő mód ----------
  build: false, sel: 'fafal', kat: 'fal',
  toggleBuild() {
    if (!G.map || G.map.region !== 'otthon') { UI.toast('Építeni csak otthon lehet.', '#aaa'); return; }
    this.build = !this.build; if (this.build) this.palette(); else { $('#pShop').style.display = 'none'; UI.open = null; }
    UI.toast(this.build ? 'Építő mód – bal klikk: lerak, jobb klikk: lebont, U: kilépés' : 'Építő mód vége', '#e6c47a');
  },
  palette() {
    const S = G.S; const el = $('#pShop'); el.style.display = 'block'; UI.open = 'build';
    let h = `<div class="hd"><span class="h">Építés</span><span class="small">${fmt(S.gold)} arany · kényelem ${this.comfort()}</span><button class="x" data-a="hmBuildOff">✕</button></div><div class="bd"><div class="tabs">${Object.keys(BUILD_KAT).map(k => `<button class="sm ${this.kat === k ? 'on' : ''}" data-a="hmKat" data-k="${k}">${BUILD_KAT[k]}</button>`).join('')}</div>`;
    if (this.kat === 'bont') h += '<div class="small">Kattints egy elemre a telken: lebontod, az ár felét visszakapod. (Jobb klikk mindig bont.)</div>';
    else for (const id in BUILD) { const B = BUILD[id]; if (B.kat !== this.kat) continue; const ok = S.gold >= B.ar && Object.keys(B.mats).every(m => (S.mats[m] || 0) >= B.mats[m]); h += `<div class="row" style="cursor:pointer;${this.sel === id ? 'background:#3a3020' : ''}" data-a="hmSel" data-id="${id}"><span>${B.ikon} ${B.nev}${B.comf ? ` <span class="small">+${B.comf} kényelem</span>` : ''}${B.desc ? `<br><span class="small">${B.desc}</span>` : ''}</span><span class="small" style="color:${ok ? '#9fe07a' : '#ff7a7a'}">${B.ar} a${Object.keys(B.mats).map(m => `, ${B.mats[m]} ${MATS[m].nev.toLowerCase()}`).join('')}</span></div>`; }
    h += `</div>`; el.innerHTML = h;
  },
  tileAtMouse() { const x = Math.floor(Input.wx / TILE), y = Math.floor(Input.wy / TILE); if (x < 1 || y < 1 || x >= HW - 1 || y >= HH - 1) return null; if (Math.abs(x + 0.5 - HW / 2) < 1.6 && y >= HH - 4) return null; return { x, y }; },
  update() {
    if (!this.build || !G.map || G.map.region !== 'otthon' || UI.overUI) return;
    const t = this.tileAtMouse(); if (!t) return;
    if (Input.mclick[2] || (Input.mclick[0] && this.kat === 'bont')) this.remove(t.x, t.y);
    else if (Input.mclick[0] || (Input.mdown[0] && BUILD[this.sel] && (BUILD[this.sel].kat === 'padlo' || BUILD[this.sel].kat === 'fal'))) this.place(t.x, t.y);
  },
  place(x, y) {
    const S = G.S, H = this.S(), B = BUILD[this.sel]; if (!B) return; const k = x + ',' + y; const cl = H.cells[k] || {};
    const P = G.P; if (Math.floor(P.x / TILE) === x && Math.floor(P.y / TILE) === y && (B.wall || B.solid)) return;
    const slot = B.kat === 'padlo' ? 'f' : B.kat === 'fal' ? 'w' : 'o';
    if (cl[slot] === this.sel) return; if (slot === 'o' && cl.w) return; if (slot === 'w' && cl.o) return;
    if (S.gold < B.ar || !Object.keys(B.mats).every(m => (S.mats[m] || 0) >= B.mats[m])) { if (!this.warnT || G.t - this.warnT > 1) { UI.toast('Nincs elég arany vagy alapanyag.', '#ff7a7a'); this.warnT = G.t; } return; }
    if (cl[slot]) this.refund(cl[slot]);
    S.gold -= B.ar; for (const m in B.mats) S.mats[m] -= B.mats[m];
    cl[slot] = this.sel; H.cells[k] = cl; Audio2.play('ui'); this.refresh(); this.palette();
  },
  refund(id) { const B = BUILD[id]; G.S.gold += Math.floor(B.ar / 2); },
  remove(x, y) { const H = this.S(), k = x + ',' + y, cl = H.cells[k]; if (!cl) return; const slot = cl.o ? 'o' : cl.w ? 'w' : cl.f ? 'f' : null; if (!slot) return; this.refund(cl[slot]); delete cl[slot]; if (!cl.o && !cl.w && !cl.f) delete H.cells[k]; Audio2.play('hit'); this.refresh(); this.palette(); },
  overlay(g) {
    if (!this.build) return; const t = this.tileAtMouse();
    g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1; for (let x = 1; x < HW - 1; x++) for (let y = 1; y < HH - 1; y++) g.strokeRect(x * TILE + .5, y * TILE + .5, TILE - 1, TILE - 1);
    if (t) { const B = BUILD[this.sel]; g.fillStyle = this.kat === 'bont' ? 'rgba(255,60,60,.35)' : 'rgba(255,230,140,.3)'; g.fillRect(t.x * TILE, t.y * TILE, TILE, TILE); if (B && this.kat !== 'bont') { g.globalAlpha = 0.7; g.font = '22px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(B.ikon, t.x * TILE + 16, t.y * TILE + 16); g.textBaseline = 'alphabetic'; g.globalAlpha = 1; } }
  },
};
Object.assign(UI.acts, {
  hmPlot() {
    const H = Home.S(), S = G.S;
    if (H.owned) { this.dlgState.line = 'A telked a lakónegyedben van, a város keleti kapuján túl. Ott az otthonod.'; this.renderDlg(); return; }
    const cost = 600; if (S.gold < cost) { this.dlgState.line = `Egy telek ${cost} arany. Raktárvezetőként mondom: előbb a készlet, aztán a beruházás.`; this.renderDlg(); return; }
    S.gold -= cost; H.owned = true; H.cells = Home.starter(); Audio2.play('legend'); this.dlgState.line = 'Gratulálok, mostantól van hová hazajönnöd. A kulcs a keleti kapunál, a lakónegyedben. Kaptál egy kis kezdőházat is – építsd tovább (U).'; this.renderDlg(); UI.toast('🏡 Telket vettél! Lakónegyed: a város keleti szélén.', '#9fe07a', 5); G.autosave();
  },
  hmGift(d) {
    const S = G.S, N = NPCS[d.id], r = Home.rel(d.id);
    const opts = N.likes.filter(m => (S.mats[m] || 0) > 0);
    let txt;
    if (opts.length) { const m = opts[0]; S.mats[m]--; r.p = Math.min(100, r.p + 12); txt = `Ezt nekem? ${MATS[m].nev}! Pont erre vágytam.`; }
    else if (S.gold >= 25) { S.gold -= 25; r.p = Math.min(100, r.p + 5); txt = 'Köszönöm, kedves vagy. (Egy kedvenc alapanyaga jobban örülne.)'; }
    else { txt = 'Nem kell semmi, tényleg. De azért egyszer hozhatnál valamit.'; this.dlgState.line = txt; this.renderDlg(); return; }
    r.gift = Home.day(); Audio2.play('pickup'); this.dlgState.line = txt; this.renderDlg();
  },
  hmDate(d) { const S = G.S, r = Home.rel(d.id), N = NPCS[d.id]; if (S.gold < 30) return; S.gold -= 30; r.date = Home.day(); r.p = Math.min(100, r.p + 10); Audio2.play('legend'); this.dlgState.line = RNG.pick(['Sétáltunk a Kapu körül. A fények úgy keringtek, mintha nekünk játszanának.', 'Néztük, ahogy a Kapuban átúszik egy másik világ égboltja. Szép volt.', 'Elmeséltem az egyik kalandomat. Úgy nevetett, hogy a Kurta is átjött megnézni, mi van.', 'Kurta a szomszéd asztalnál böfögött. Mégis ez volt az eddigi legjobb esténk.']); this.renderDlg(); },
  hmPropose(d) {
    const S = G.S, N = NPCS[d.id], H = Home.S();
    const ri = S.inv.findIndex(it => it.base === 'gyuru' && it.rar >= 2);
    if (ri < 0) { this.dlgState.line = 'Gyűrű nélkül? (Kell egy ritka vagy jobb gyűrű a táskádban.)'; this.renderDlg(); return; }
    if (!H.owned || !Home.has().alvas) { this.dlgState.line = 'Hová költöznénk? Előbb legyen egy otthon, benne egy ággyal.'; this.renderDlg(); return; }
    const ring = S.inv.splice(ri, 1)[0]; S.spouse = d.id; Home.rel(d.id).p = 100;
    Audio2.play('legend'); setTimeout(() => Audio2.play('level'), 500);
    this.dlgState.line = `Igen. Igen! – ${N.nev} felhúzza a ${ring.nev}-t. Mostantól közös az otthonotok. (${N.perk.nev}: ${N.perk.desc})`; this.renderDlg();
    UI.toast(`💍 Összeházasodtál: ${N.nev}! Beköltözik az otthonodba.`, '#ff9be0', 6); Univ.set('kp:hazassag'); recalc(G.P); G.autosave();
  },
  hmSpouse(d) { const N = NPCS[d.id]; this.dlgState.line = RNG.pick(['Vigyázz magadra odakint. Itthon várlak.', 'Ma este te főzöl? Nem? Gondoltam.', 'Ha a Kapu túloldalán jársz, hozz nekem valamit. Bármit.', `${N.perk.nev} – ezt csak neked.`]); this.renderDlg(); },
  hmBuildOff() { Home.build = false; $('#pShop').style.display = 'none'; UI.open = null; },
  hmKat(d) { Home.kat = d.k; const first = Object.keys(BUILD).find(k => BUILD[k].kat === d.k); if (first) Home.sel = first; Home.palette(); },
  hmSel(d) { Home.sel = d.id; Home.palette(); },
  hmCook(d) { const S = G.S, R0 = HOME_RECIPES[d.id]; if (!Object.keys(R0.mats).every(m => (S.mats[m] || 0) >= R0.mats[m]) || S.gold < (R0.gold || 0)) return; for (const m in R0.mats) S.mats[m] -= R0.mats[m]; S.gold -= R0.gold || 0; if (R0.give) S.food[R0.give] = (S.food[R0.give] || 0) + (R0.n || 1); if (R0.food) { const sv = S.surv; if (R0.food.kaja) sv.kaja = Math.min(100, sv.kaja + R0.food.kaja); if (R0.food.ital) sv.ital = Math.min(100, sv.ital + R0.food.ital); if (R0.food.alvas) sv.ebren = Math.min(100, sv.ebren + R0.food.alvas); } if (R0.buff) G.buff(G.P, 'gulyas', R0.buff.t, R0.buff.mods); recalc(G.P); Audio2.play('potion'); UI.toast(`${R0.ikon} ${R0.nev} elkészült.`, '#e8d7b0'); this.renderShop(); },
});
Home.starter = function () {
  // kis kezdőház: 6×5 gerendafal, parketta, ajtó, ágy
  const c = {}; const x0 = 11, y0 = 5, w = 7, h = 6;
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const k = x + ',' + y; const edge = x === x0 || y === y0 || x === x0 + w - 1 || y === y0 + h - 1; c[k] = edge ? { w: 'fafal' } : { f: 'parketta' }; }
  c[(x0 + 3) + ',' + (y0 + h - 1)] = { w: 'ajto', f: 'parketta' };
  c[(x0 + 1) + ',' + (y0 + 1)].o = 'agy'; c[(x0 + 5) + ',' + (y0 + 1)].o = 'asztal'; c[(x0 + 4) + ',' + (y0 + 1)].o = 'szek';
  return c;
};
