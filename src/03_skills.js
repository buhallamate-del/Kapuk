// ============================================================
//  KÉPESSÉGEK – kasztonként 9 (aktív + passzív + végső), és Kapukő-képességek
// ============================================================
// cast(r, P, tx, ty): r = képesség szintje (bónuszokkal), tx/ty = célpont (egér)
const pct = v => Math.round(v * 100) + '%';
const SKILLS = {
  // ---------------- PENGELOVAG ----------------
  forgoszel: {
    cls: 'penge', nev: 'Forgószél', ikon: '🌀', tipus: 'aktiv', req: 1, max: 5, cost: r => 16, cd: r => 2.6,
    desc: r => `Háromszor megpördülsz, mindhárom pörgés ${pct(0.7 + 0.15 * r)} fegyversebzést okoz 90 képpontos körben. Pörgésenként eltalált ellenfelenként +2 düh.`,
    cast(r, P) { for (let i = 0; i < 3; i++) G.later(i * 0.18, () => { G.hitArea(P.x, P.y, 90, P.roll(0.7 + 0.15 * r, 'melee'), P.wdt(), 'p', { knock: 60, fx: 'spin', rage: 2 }); Audio2.play('swing'); }); }
  },
  roham: {
    cls: 'penge', nev: 'Roham', ikon: '➶', tipus: 'aktiv', req: 1, max: 5, cost: r => 14, cd: r => 6 - r * 0.4,
    desc: r => `A célpont felé rontasz (max. 240 képpont), az utadba esőket ${pct(1.3 + 0.25 * r)} sebzéssel letarolod és 0,8 mp-re elkábítod. Minden eltalált ellenfél +6 dühöt ad.`,
    cast(r, P, tx, ty) { const a = Math.atan2(ty - P.y, tx - P.x); G.dash(P, a, Math.min(240, Math.hypot(tx - P.x, ty - P.y) + 30), 0.22, { dmg: P.roll(1.3 + 0.25 * r, 'melee'), dt: P.wdt(), stun: 0.8, invul: true, rage: 6 }); Audio2.play('dash'); }
  },
  csatakialtas: {
    cls: 'penge', nev: 'Csatakiáltás', ikon: '📯', tipus: 'aktiv', req: 6, max: 5, cost: r => 20, cd: r => 22,
    desc: r => `10 mp-re +${15 + 6 * r}% sebzés és +${20 + 10 * r}% páncél, és azonnal +25 düh. A közeli ellenfelek 1,5 mp-re megrémülnek.`,
    cast(r, P) { G.buff(P, 'csata', 10, { dmgp: 15 + 6 * r, armp: 20 + 10 * r }); P.mp = Math.min(P.mmp, P.mp + 25); G.hitArea(P.x, P.y, 180, 0, 'fiz', 'p', { fear: 1.5, fx: 'shout' }); Audio2.play('bossroar'); }
  },
  foldrenges: {
    cls: 'penge', nev: 'Földrengés-csapás', ikon: '💢', tipus: 'aktiv', req: 12, max: 5, cost: r => 28, cd: r => 7,
    desc: r => `A földbe csapsz: 220 képpontos kúpban ${pct(2.2 + 0.4 * r)} sebzés, és 3 mp-re 50%-kal lelassítja az ellenfeleket. Kábult vagy megrémült ellenfélre +50% (Roham vagy Csatakiáltás után).`,
    cast(r, P, tx, ty) { const a = Math.atan2(ty - P.y, tx - P.x); G.arc(P.x, P.y, a, 1.1, 220, P.roll(2.2 + 0.4 * r, 'melee'), P.wdt(), { slow: 3, fx: 'quake', ccBonus: 1.5, melee: true, stop: 0.07, knock: 90 }); G.shake(8); Audio2.play('boom'); }
  },
  pengevihar: {
    cls: 'penge', nev: 'Pengevihar', ikon: '⚔', tipus: 'aktiv', req: 20, max: 3, cost: r => 45, cd: r => 50 - r * 5, ult: true,
    desc: r => `${4 + 2 * r} kísérteties kard kering körülötted 10 mp-ig; mindegyik ${pct(0.5 + 0.2 * r)} sebzést okoz érintéskor.`,
    cast(r, P) { const n = 4 + 2 * r; for (let i = 0; i < n; i++) G.ally({ kind: 'orbit', owner: P, ang: i / n * Math.PI * 2, rad: 70, life: 10, dmgMul: 0.5 + 0.2 * r, dk: 'melee' }); Audio2.play('magic'); }
  },
  kardmester: { cls: 'penge', nev: 'Kardmester', ikon: '🗡', tipus: 'passziv', req: 1, max: 5, desc: r => `+${8 * r}% közelharci sebzés, +${3 * r}% támadási sebesség.`, mods: r => ({ meleep: 8 * r, aspd: 3 * r }) },
  vasbor: { cls: 'penge', nev: 'Vasbőr', ikon: '🛡', tipus: 'passziv', req: 3, max: 5, desc: r => `+${12 * r}% páncél és +${4 * r}% életerő.`, mods: r => ({ armp: 12 * r, hpp: 4 * r }) },
  eletlopas: { cls: 'penge', nev: 'Vérszomj', ikon: '🩸', tipus: 'passziv', req: 8, max: 5, desc: r => `${r}% életlopás közelharcban, ölésnél +${3 * r} energia.`, mods: r => ({ ls: r, killMp: 3 * r }) },
  ellentamadas: { cls: 'penge', nev: 'Ellentámadás', ikon: '↺', tipus: 'passziv', req: 14, max: 5, desc: r => `${4 * r}% eséllyel kivédsz egy találatot, és visszavágsz (${pct(0.8 + 0.2 * r)}).`, mods: r => ({ block: 4 * r, riposte: 0.8 + 0.2 * r }) },

  // ---------------- ELEMENTALISTA ----------------
  tuzgolyo: {
    cls: 'elem', nev: 'Tűzgolyó', ikon: '🔥', tipus: 'aktiv', req: 1, max: 5, cost: r => 9, cd: r => 0.55,
    desc: r => `Tűzgolyót lősz, ami becsapódáskor 70 képpontos körben ${pct(1.3 + 0.3 * r)} tűzsebzést okoz és meggyújtja a célt. Fagyott célponton Hősokk: ×1,7, és a jég szétrobban.`,
    cast(r, P, tx, ty) { G.proj({ x: P.x, y: P.y, a: Math.atan2(ty - P.y, tx - P.x), spd: 480, r: 9, dmg: P.roll(1.3 + 0.3 * r, 'spell'), dt: 'tuz', own: 'p', kind: 'fireball', splash: 70, burn: 3, spell: true }); Audio2.play('fire'); }
  },
  fagynova: {
    cls: 'elem', nev: 'Fagynova', ikon: '❄', tipus: 'aktiv', req: 1, max: 5, cost: r => 22, cd: r => 6,
    desc: r => `Jéghullám tör ki belőled (140 képpont): ${pct(0.9 + 0.25 * r)} fagysebzés és ${1.5 + 0.3 * r} mp fagyás. Villámtól sokkolt célponton Ridegség: +30%, és tovább fagy.`,
    cast(r, P) { G.hitArea(P.x, P.y, 140, P.roll(0.9 + 0.25 * r, 'spell'), 'fagy', 'p', { freeze: 1.5 + 0.3 * r, fx: 'nova', spell: true }); Audio2.play('ice'); }
  },
  lancvillam: {
    cls: 'elem', nev: 'Láncvillám', ikon: '⚡', tipus: 'aktiv', req: 6, max: 5, cost: r => 15, cd: r => 1.1,
    desc: r => `Villám csap a célpont felé, és ${3 + r} további ellenfélre ugrik át; mindegyik ${pct(1.0 + 0.22 * r)} villámsebzést kap. Égő célponton Túlvezetés: a láng átterjed a szomszédokra.`,
    cast(r, P, tx, ty) { G.chain(P.x, P.y, tx, ty, 3 + r, P.roll(1.0 + 0.22 * r, 'spell'), 'villam'); Audio2.play('zap'); }
  },
  meteor: {
    cls: 'elem', nev: 'Meteor', ikon: '☄', tipus: 'aktiv', req: 12, max: 5, cost: r => 38, cd: r => 9,
    desc: r => `1 mp múlva meteor csapódik a célpontba: ${pct(3.4 + 0.6 * r)} tűzsebzés 110 képpontos körben, utána 4 mp-ig ég a föld.`,
    cast(r, P, tx, ty) { G.tele(tx, ty, 110, 1.0, P.roll(3.4 + 0.6 * r, 'spell'), 'tuz', 'p', { fx: 'meteor', burn: 4, ground: { t: 4, dps: P.roll(0.35, 'spell'), dt: 'tuz' } }); Audio2.play('fire'); }
  },
  elemivihar: {
    cls: 'elem', nev: 'Elemi vihar', ikon: '🌩', tipus: 'aktiv', req: 20, max: 3, cost: r => 55, cd: r => 45 - r * 5, ult: true,
    desc: r => `8 mp-ig vihar tombol a célpont körül: tűz, fagy és villám csapkod (${pct(1.2 + 0.4 * r)} találatonként).`,
    cast(r, P, tx, ty) { const cx = tx, cy = ty; const types = ['tuz', 'fagy', 'villam']; for (let i = 0; i < 32; i++) G.later(i * 0.25, () => { const x = cx + RNG.range(-160, 160), y = cy + RNG.range(-160, 160); const t = types[i % 3]; G.tele(x, y, 55, 0.35, P.roll(1.2 + 0.4 * r, 'spell'), t, 'p', { fx: 'bolt', freeze: t === 'fagy' ? 1 : 0, burn: t === 'tuz' ? 2 : 0 }); }); Audio2.play('zap'); }
  },
  elemitudas: { cls: 'elem', nev: 'Elemi tudás', ikon: '📘', tipus: 'passziv', req: 1, max: 5, desc: r => `+${9 * r}% varázssebzés.`, mods: r => ({ spellp: 9 * r }) },
  manakut: { cls: 'elem', nev: 'Energiakút', ikon: '💧', tipus: 'passziv', req: 3, max: 5, desc: r => `+${10 * r}% energia és +${15 * r}% energia-visszatöltés.`, mods: r => ({ mpp: 10 * r, mregen: 15 * r }) },
  egetes: { cls: 'elem', nev: 'Perzselés', ikon: '♨', tipus: 'passziv', req: 8, max: 5, desc: r => `Az égés ${25 * r}%-kal többet sebez, és a varázslataid ${4 * r}% eséllyel kritikusak.`, mods: r => ({ burnp: 25 * r, spellcrit: 4 * r }) },
  jegpajzs: { cls: 'elem', nev: 'Jégpajzs', ikon: '🧊', tipus: 'passziv', req: 14, max: 5, desc: r => `Pajzs nyel el ${6 * r}% max. életerőnyi sebzést; 8 mp sérülésmentesség után újratöltődik.`, mods: r => ({ shield: 6 * r }) },

  // ---------------- MESTERLÖVÉSZ ----------------
  sortuz: {
    cls: 'loves', nev: 'Sortűz', ikon: '⋙', tipus: 'aktiv', req: 1, max: 5, cost: r => 12, cd: r => 2.2,
    desc: r => `${5 + r} lövedéket lősz legyezőben, egyenként ${pct(0.55 + 0.08 * r)} sebzéssel.`,
    cast(r, P, tx, ty) { const a = Math.atan2(ty - P.y, tx - P.x), n = 5 + r; for (let i = 0; i < n; i++) G.proj({ x: P.x, y: P.y, a: a + (i - (n - 1) / 2) * 0.09, spd: 820, r: 3, dmg: P.roll(0.55 + 0.08 * r, 'ranged'), dt: P.wdt(), own: 'p', kind: 'bullet' }); Audio2.play('rifle'); }
  },
  atuto: {
    cls: 'loves', nev: 'Átütő lövés', ikon: '➹', tipus: 'aktiv', req: 1, max: 5, cost: r => 15, cd: r => 2.8,
    desc: r => `Mindenen áthatoló lövés: ${pct(2.4 + 0.45 * r)} sebzés minden eltalált ellenfélnek, +${10 * r}% kritikus esély. Elhasználja a Fókuszt: töltetenként +25% sebzés, 3 töltettől biztos kritikus.`,
    cast(r, P, tx, ty) { const f = Focus.spend(P), per = 0.25 + 0.08 * (P.st.turelem || 0); const d = P.roll((2.4 + 0.45 * r) * (1 + per * f), 'ranged', 10 * r + (f >= 3 ? 100 : 0)); if (f) G.text(P.x, P.y - 36, `Fókusz ×${f}`, '#f2d36b', 12); G.proj({ x: P.x, y: P.y, a: Math.atan2(ty - P.y, tx - P.x), spd: 1500, r: 5, dmg: d, dt: P.wdt(), own: 'p', kind: 'rail', pierce: 99 }); Audio2.play('rifle'); G.shake(3 + f * 0.5); if (f >= 3) G.hitStop(0.05); }
  },
  granat: {
    cls: 'loves', nev: 'Gránát', ikon: '💣', tipus: 'aktiv', req: 6, max: 5, cost: r => 16, cd: r => 4.5,
    desc: r => `Gránátot dobsz a célpontra: 0,7 mp múlva ${pct(2.0 + 0.4 * r)} tűzsebzés 95 képpontos körben.`,
    cast(r, P, tx, ty) { const d = Math.min(360, Math.hypot(tx - P.x, ty - P.y)), a = Math.atan2(ty - P.y, tx - P.x); G.lob(P.x, P.y, P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, 0.7, 95, P.roll(2.0 + 0.4 * r, 'ranged'), 'tuz', {}); }
  },
  visszavonulas: {
    cls: 'loves', nev: 'Taktikai visszavonulás', ikon: '↶', tipus: 'aktiv', req: 10, max: 5, cost: r => 12, cd: r => 8 - r * 0.5,
    desc: r => `Hátraugrasz a céltól, és aknát hagysz magad után (${pct(2.2 + 0.5 * r)} sebzés). 2 mp-re +40% mozgási sebesség.`,
    cast(r, P, tx, ty) { const a = Math.atan2(ty - P.y, tx - P.x) + Math.PI; G.mine(P.x, P.y, 80, P.roll(2.2 + 0.5 * r, 'ranged'), 'tuz'); G.dash(P, a, 200, 0.2, { invul: true }); G.buff(P, 'menekul', 2, { msp: 40 }); Audio2.play('dash'); }
  },
  legicsapas: {
    cls: 'loves', nev: 'Légicsapás', ikon: '✈', tipus: 'aktiv', req: 20, max: 3, cost: r => 45, cd: r => 45 - r * 5, ult: true,
    desc: r => `${8 + 2 * r} robbanás söpör végig a célpont felé eső vonalon, egyenként ${pct(2.5 + 0.8 * r)} sebzéssel.`,
    cast(r, P, tx, ty) { const a = Math.atan2(ty - P.y, tx - P.x), n = 8 + 2 * r; for (let i = 0; i < n; i++) { const d = 60 + i * 48; G.tele(P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, 70, 0.4 + i * 0.08, P.roll(2.5 + 0.8 * r, 'ranged'), 'tuz', 'p', { fx: 'boom' }); } Audio2.play('portal'); }
  },
  eles: { cls: 'loves', nev: 'Éles szem', ikon: '👁', tipus: 'passziv', req: 1, max: 5, desc: r => `+${3 * r}% kritikus esély és +${12 * r}% kritikus sebzés.`, mods: r => ({ crit: 3 * r, critd: 12 * r }) },
  gyorstuz: { cls: 'loves', nev: 'Gyorstüzelés', ikon: '⏩', tipus: 'passziv', req: 3, max: 5, desc: r => `+${6 * r}% támadási sebesség és +${5 * r}% távolsági sebzés.`, mods: r => ({ aspd: 6 * r, rangedp: 5 * r }) },
  nyomjelzo: { cls: 'loves', nev: 'Nyomjelző lőszer', ikon: '◎', tipus: 'passziv', req: 8, max: 5, desc: r => `A találat megjelöli a célt: ${5 * r}%-kal több sebzést kap 4 mp-ig.`, mods: r => ({ mark: 5 * r }) },
  lovesz: { cls: 'loves', nev: 'Vadászösztön', ikon: '🎯', tipus: 'passziv', req: 14, max: 5, desc: r => `+${10 * r}% távolsági sebzés a 250 képpontnál távolabbi célokra, +${3 * r}% mozgási sebesség.`, mods: r => ({ farp: 10 * r, msp: 3 * r }) },

  // ---------------- MÉRNÖK ----------------
  dron: {
    cls: 'mernok', nev: 'Harci drón', ikon: '🛸', tipus: 'aktiv', req: 1, max: 5, cost: r => 22, cd: r => 6,
    desc: r => `Drónt indítasz (30 mp), ami követ és tüzel (${pct(0.6 + 0.15 * r)} lövésenként). Egyszerre ${1 + Math.floor(r / 2)} drón lehet. A lövegtorony által megjelölt célpontot választja.`,
    cast(r, P) { const max = Math.max(1, 1 + Math.floor(r / 2) + (P.fx.fokonst ? 1 : 0) - (P.st.tuzer ? 1 : 0)); G.allyCap('dron', max); G.ally({ kind: 'dron', owner: P, life: 30, dmgMul: 0.6 + 0.15 * r, rate: 0.5, range: 330 }); Audio2.play('magic'); }
  },
  loveg: {
    cls: 'mernok', nev: 'Lövegtorony', ikon: '🗼', tipus: 'aktiv', req: 1, max: 5, cost: r => 26, cd: r => 9,
    desc: r => `Lövegtornyot telepítesz a célpontra (18 mp): ${pct(0.8 + 0.2 * r)} sebzés, gyors tűz. Egyszerre 2 torony. A találat 2,5 mp-re megjelöli a célt: a gépek +15%-ot sebeznek rá, és a drónok, rakéták azt veszik célba.`,
    cast(r, P, tx, ty) { const max = 2 + (P.fx.fokonst ? 1 : 0) + ((P.st.gepesz || 0) >= 2 ? 1 : 0); G.allyCap('torony', max); const p = G.freeSpot(tx, ty, P); G.ally({ kind: 'torony', owner: P, x: p.x, y: p.y, life: 18, dmgMul: 0.8 + 0.2 * r, rate: 0.3, range: 380 }); Audio2.play('door'); }
  },
  raketazapor: {
    cls: 'mernok', nev: 'Rakétazápor', ikon: '🚀', tipus: 'aktiv', req: 6, max: 5, cost: r => 18, cd: r => 3.5,
    desc: r => `${3 + r} önirányító rakéta, egyenként ${pct(0.9 + 0.2 * r)} tűzsebzés kis körben.`,
    cast(r, P, tx, ty) { const a = Math.atan2(ty - P.y, tx - P.x), n = 3 + r + (P.st.tuzer || 0); for (let i = 0; i < n; i++) G.later(i * 0.07, () => G.proj({ x: P.x, y: P.y, a: a + RNG.range(-0.9, 0.9), spd: 380, r: 5, dmg: P.roll(0.9 + 0.2 * r, 'summon'), dt: 'tuz', own: 'p', kind: 'rocket', homing: 5, splash: 40, life: 3, machine: true, burn: P.st.tuzer ? 2 : 0 })); Audio2.play('shoot'); }
  },
  javitoraj: {
    cls: 'mernok', nev: 'Javítóraj', ikon: '🔧', tipus: 'aktiv', req: 10, max: 5, cost: r => 25, cd: r => 16,
    desc: r => `Nanogépek 4 mp alatt ${15 + 5 * r}% életerőt töltenek vissza, a gépeid élettartama +5 mp.`,
    cast(r, P) { G.buff(P, 'javit', 4, { hot: P.mhp * (0.15 + 0.05 * r) / 4 }); G.allies.forEach(a => { if (a.owner === P) a.life += 5; }); Audio2.play('potion'); }
  },
  holdraketa: {
    cls: 'mernok', nev: 'Holdrakéta', ikon: '🌙', tipus: 'aktiv', req: 20, max: 3, cost: r => 50, cd: r => 50 - r * 5, ult: true,
    desc: r => `A Lőtér büszkesége: 1,6 mp múlva hatalmas rakéta csapódik be – ${pct(7 + 3 * r)} tűzsebzés 210 képpontos körben.`,
    cast(r, P, tx, ty) { G.tele(tx, ty, 210, 1.6, P.roll(7 + 3 * r, 'summon'), 'tuz', 'p', { fx: 'nuke', burn: 3 }); Audio2.play('portal'); }
  },
  dronmester: { cls: 'mernok', nev: 'Drónmester', ikon: '📡', tipus: 'passziv', req: 1, max: 5, desc: r => `A gépeid +${12 * r}% sebzést okoznak és ${6 * r}%-kal gyorsabban tüzelnek.`, mods: r => ({ summonp: 12 * r, sumaspd: 6 * r }) },
  robbano: { cls: 'mernok', nev: 'Robbanóanyag-szakértő', ikon: '🧨', tipus: 'passziv', req: 3, max: 5, desc: r => `A robbanások +${8 * r}% sebzést okoznak és ${6 * r}%-kal nagyobbak.`, mods: r => ({ splashp: 8 * r, splashr: 6 * r }) },
  pancellemez: { cls: 'mernok', nev: 'Páncéllemezek', ikon: '🔩', tipus: 'passziv', req: 8, max: 5, desc: r => `+${10 * r}% páncél, +${5 * r}% életerő, +${4 * r}% minden állóság.`, mods: r => ({ armp: 10 * r, hpp: 5 * r, resall: 4 * r }) },
  tultoltes: { cls: 'mernok', nev: 'Túltöltés', ikon: '🔋', tipus: 'passziv', req: 14, max: 5, desc: r => `−${4 * r}% képesség-újratöltés, +${6 * r}% energia-visszatöltés.`, mods: r => ({ cdr: 4 * r, mregen: 6 * r }) },
};

// ---------------- Kapukő-képességek (a világok bossaitól) ----------------
// Mindenki használhatja, a V gombbal; egyszerre egy választható.
const GATESKILLS = {
  targonca: {
    nev: 'Targonca-roham', ikon: '🚜', vilag: 'raktar', cd: 14, cost: 15,
    desc: 'Megidézed a Végtelen Raktár elszabadult targoncáját: végigdübörög a célpont felé, mindent elsodor (300% sebzés, hátralökés).',
    cast(P, tx, ty) { const a = Math.atan2(ty - P.y, tx - P.x); G.proj({ x: P.x - Math.cos(a) * 30, y: P.y - Math.sin(a) * 30, a, spd: 520, r: 22, dmg: P.roll(3, 'best'), dt: 'fiz', own: 'p', kind: 'forklift', pierce: 99, knock: 260, life: 1.2, wallStop: true }); Audio2.play('door'); }
  },
  mehraj: {
    nev: 'Méhraj', ikon: '🐝', vilag: 'mez', cd: 18, cost: 18,
    desc: 'Mézország dolgozói melléd állnak: 6 méh 12 mp-ig veled harcol, csípésük lassít.',
    cast(P) { for (let i = 0; i < 6; i++) G.ally({ kind: 'meh', owner: P, life: 12, dmgMul: 0.35, rate: 0.6, range: 260 }); Audio2.play('zap'); }
  },
  felholepes: {
    nev: 'Felhőlépés', ikon: '☁', vilag: 'egtorony', cd: 7, cost: 12,
    desc: 'Az Égtorony szelével a célpontra teleportálsz (max. 320 képpont), érkezéskor 150% sebzés körben.',
    cast(P, tx, ty) { const a = Math.atan2(ty - P.y, tx - P.x), d = Math.min(320, Math.hypot(tx - P.x, ty - P.y)); G.blink(P, P.x + Math.cos(a) * d, P.y + Math.sin(a) * d); G.hitArea(P.x, P.y, 90, P.roll(1.5, 'best'), 'villam', 'p', { fx: 'nova2', knock: 80 }); Audio2.play('portal'); }
  },
  magma: {
    nev: 'Magmakitörés', ikon: '🌋', vilag: 'melyseg', cd: 15, cost: 22,
    desc: 'A Föld mélyéből tűzgyűrű tör fel körülötted: 250% tűzsebzés, és 5 mp-ig égő föld.',
    cast(P) { for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; G.tele(P.x + Math.cos(a) * 110, P.y + Math.sin(a) * 110, 60, 0.3 + i * 0.03, P.roll(2.5, 'best'), 'tuz', 'p', { fx: 'boom', ground: { t: 5, dps: P.roll(0.3, 'best'), dt: 'tuz' } }); } Audio2.play('boom'); }
  },
  morze: {
    nev: 'S.O.S. impulzus', ikon: '📻', vilag: 'jeltoro', cd: 20, cost: 20,
    desc: '··· ––– ··· – a Jeltörő adása megbénítja a környéket: minden ellenfél 2,5 mp-re megáll (a bossok 1 mp-re), 120% villámsebzés.',
    cast(P) { G.hitArea(P.x, P.y, 460, P.roll(1.2, 'best'), 'villam', 'p', { stun: 2.5, fx: 'radio' }); [0, .12, .24, .42, .66, .9, 1.08, 1.2, 1.32].forEach((t, i) => setTimeout(() => Audio2.tone(700, i > 2 && i < 6 ? 0.2 : 0.07, 'sine', 0.08), t * 1000)); }
  },
  szokes: {
    nev: 'Szökési sebesség', ikon: '🛰', vilag: 'loter', cd: 16, cost: 15,
    desc: 'A Lőtér hajtóművei: 5 mp-re +70% mozgási és +30% támadási sebesség, a nyomodban lángcsík.',
    cast(P) { G.buff(P, 'szokes', 5, { msp: 70, aspd: 30, trail: 1 }); Audio2.play('portal'); }
  },
  idohurok: {
    nev: 'Időhurok', ikon: '⌛', vilag: 'eh', cd: 30, cost: 25,
    desc: 'A tesszerakt ajándéka: visszaugrasz oda és olyan életerővel, ahol és amilyennel 4 mp-cel ezelőtt voltál. A régi helyeden téridő-robbanás.',
    cast(P) { const h = P.history[0]; if (!h) return; G.hitArea(P.x, P.y, 120, P.roll(2.2, 'best'), 'ter', 'p', { fx: 'nova3' }); P.x = h.x; P.y = h.y; P.hp = Math.max(P.hp, h.hp); G.fxRing(P.x, P.y, 80, '#c48cff', 0.6); Audio2.play('portal'); }
  },
  boefi: {
    nev: 'Kurta-böfi', ikon: '🍺', vilag: 'kurta', cd: 12, cost: 10,
    desc: 'Minden böfi kétszer hangosabb az előzőnél! Kúpban hátralök, és harconként minden használat +25%-kal erősebb (max. ×4). 60 dB-től a világvégéig.',
    cast(P, tx, ty) { P.burpN = Math.min(12, (P.burpN || 0) + 1); const m = Math.min(4, 1 + 0.25 * (P.burpN - 1)); const a = Math.atan2(ty - P.y, tx - P.x); G.arc(P.x, P.y, a, 0.9, 200 + 10 * P.burpN, P.roll(1.6 * m, 'best'), 'fiz', { knock: 220 + 20 * P.burpN, fx: 'burp', stun: 0.5 }); G.shake(4 + P.burpN); Audio2.play('burp'); G.text(P.x, P.y - 40, (60 + 6 * P.burpN) + ' dB', '#ff9be0', 16); }
  },
};

// ---------------- TILTOTT KÉPESSÉGEK – szándékosan kiegyensúlyozatlanok ----------------
// Tiltott pecsét kell hozzájuk (az Ősök legyőzéséért jár)
const FORBIDDEN = {
  vilagvagas: {
    cls: 'penge', nev: 'Világvágás', ikon: '☠', pecset: 2, cd: 28, cost: 40,
    desc: 'Egyetlen csapás, ami átvág a képernyőn: minden látható ellenfél 1800% fegyversebzést kap. A bossok is.',
    cast(P) { G.screenHit(P.roll(18, 'melee'), P.wdt(), { fx: 'slash' }); G.shake(18); Audio2.play('boom'); }
  },
  feketelyuk: {
    cls: 'elem', nev: 'Zsebszingularitás', ikon: '🕳', pecset: 2, cd: 35, cost: 50,
    desc: 'Fekete lyukat nyitsz a célpontban 7 mp-re: mindent beszív 420 képpontról, és másodpercenként 500% téridő-sebzést okoz.',
    cast(P, tx, ty) { G.ally({ kind: 'bh', owner: P, x: tx, y: ty, life: 7, dmgMul: 5, rad: 420 }); Audio2.play('portal'); }
  },
  vegitelet: {
    cls: 'loves', nev: 'Végítélet-tár', ikon: '♾', pecset: 2, cd: 40, cost: 35,
    desc: '10 mp-ig minden lövésed kritikus, mindenen áthatol, háromszorozódik, és a támadási sebességed megduplázódik.',
    cast(P) { G.buff(P, 'vegitelet', 10, { aspd: 100, critForce: 1, triple: 1, pierceAll: 1 }); Audio2.play('legend'); }
  },
  szurkegu: {
    cls: 'mernok', nev: 'Szürke Gú', ikon: '☣', pecset: 2, cd: 60, cost: 60,
    desc: 'Önmásoló nanogépek: 14 drón 20 mp-ig, egyenként a teljes drónsebzés kétszeresével. Nincs felső korlát.',
    cast(P) { for (let i = 0; i < 14; i++) G.ally({ kind: 'dron', owner: P, life: 20, dmgMul: 1.4, rate: 0.35, range: 420, grey: true }); Audio2.play('legend'); }
  },
  db440: {
    cls: '*', nev: '440 dB', ikon: '🌍', pecset: 4, cd: 90, cost: 30,
    desc: 'A Föld összetartó energiájának ötszöröse. Minden látható ellenfél 3500% sebzést kap és 4 mp-re megbénul. Kurta egyedül lebeg az űrben, kissé megkönnyebbülve.',
    cast(P) { G.screenHit(P.roll(35, 'best'), 'fiz', { stun: 4, fx: 'burpnuke' }); G.shake(30); Audio2.play('burp'); setTimeout(() => Audio2.play('boom'), 300); G.text(P.x, P.y - 50, '440 dB', '#ff9be0', 26); }
  },
};
// passzív: Ősforma – 7 pecsétnél
const OSFORMA = { nev: 'Ősforma', pecset: 7, desc: '+60% sebzés, +35% életerő, +20% mozgási sebesség, −25% újratöltés. Az Égtorony legendái szerint ezt a formát senki sem tartotta meg.', mods: { dmgp: 60, hpp: 35, msp: 20, cdr: 25 } };

// ---------------- ERŐFORRÁS-KÉPESSÉGEK (a kaszt saját erőforrásából élnek) ----------------
Object.assign(SKILLS, {
  tombolas: {
    cls: 'penge', nev: 'Tombolás', ikon: '😡', tipus: 'aktiv', req: 4, max: 5, cost: r => 30, cd: r => 5, spendAll: true,
    desc: r => `Az összes dühödet egy pusztító pörgésbe égeted: ${pct(1.5 + 0.2 * r)} sebzés + minden dühpont után további ${(4 + r)}%. 4 mp-re ${5 + r * 2}% életlopás.`,
    cast(r, P, tx, ty, spent) { const m = (1.5 + 0.2 * r) * (1 + spent * (4 + r) / 100); G.hitArea(P.x, P.y, 120, P.roll(m, 'melee'), P.wdt(), 'p', { knock: 120, fx: 'spin', basic: true }); G.buff(P, 'tombol', 4, { ls: 5 + r * 2 }); G.shake(4 + spent / 20); Audio2.play('bossroar'); G.text(P.x, P.y - 40, 'TOMBOLÁS ×' + spent.toFixed(0), '#ff4433', 15); }
  },
  manarobbanas: {
    cls: 'elem', nev: 'Manarobbanás', ikon: '💠', tipus: 'aktiv', req: 4, max: 5, cost: r => 0, cd: r => 8, spendPct: 0.5,
    desc: r => `A maximális manád felét robbantod szét 200 képpontos körben: minden elköltött manapont ${(3 + 0.8 * r).toFixed(1)}% varázssebzést ad.`,
    cast(r, P, tx, ty, spent) { G.hitArea(P.x, P.y, 200, P.roll(spent * (3 + 0.8 * r) / 100, 'spell'), 'ter', 'p', { fx: 'nova3', knock: 160 }); G.shake(6); Audio2.play('portal'); }
  },
  golyoido: {
    cls: 'loves', nev: 'Golyóidő', ikon: '⏱', tipus: 'aktiv', req: 4, max: 5, cost: r => 20, cd: r => 3, toggle: true,
    desc: r => `Be/ki: körülötted ${60 + r * 4}%-kal lelassul a világ (ellenfelek, lövedékek), te nem. Másodpercenként ${22 - r * 2} belső időt emészt. Közben a Fókusz kétszer gyorsabban gyűlik, és minden ölés 6 belső időt ad vissza.`,
    cast(r, P) { P.bulletTime = P.bulletTime ? 0 : r; Audio2.play(P.bulletTime ? 'portal' : 'ui'); }
  },
  tulfeszultseg: {
    cls: 'mernok', nev: 'Túlfeszültség', ikon: '🌩', tipus: 'aktiv', req: 4, max: 5, cost: r => 30, cd: r => 12, spendAll: true,
    desc: r => `Az összes áramot a gépeidbe vezeted: ${4 + r} mp-ig háromszor gyorsabban tüzelnek, és villám csap a közeli ellenfelekbe (minden áramegység után ${(1 + 0.3 * r).toFixed(1)}%).`,
    cast(r, P, tx, ty, spent) { G.buff(P, 'tulfesz', 4 + r, { sumaspd: 200 }); G.chain(P.x, P.y, tx, ty, 6, P.roll(spent * (1 + 0.3 * r) / 100, 'summon'), 'villam'); Audio2.play('zap'); }
  },
});
