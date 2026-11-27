// ============================================================
//  TARTALOM: világok, szörnyek, bossok
// ============================================================
const REGIONS = [
  {
    id: 'raktar', nev: 'A Végtelen Raktár', vilag: 'Raktár 3D', lvl: 1, floors: 4, style: 'shelves', mat: 'raklap', gate: 'targonca',
    haz: { nev: 'Olajfolt', fx: 'slip' }, dark: 0.5, mech: 'raktar',
    pal: { void: '#0b0d12', floor: '#3b3f47', floor2: '#474b53', wall: '#5d6470', grid: 'rgba(255,214,0,0.06)', haz: '#14110d', obst: '#2a3a52', speck: '#f2c230', light: '#ffe9b0', wallLine: 'rgba(255,200,0,.25)' },
    enemies: ['raklapbogar', 'polcmimik', 'targonca', 'kartonkobold', 'lidérc'], boss: 'leltarhiany',
    intro: 'Polcsorok a végtelenbe. Valahol itt van a 976. tárhely, és valami, ami nem stimmel a leltárban.'
  },
  {
    id: 'mez', nev: 'Mézország', vilag: 'Mézország', lvl: 6, floors: 4, style: 'comb', mat: 'mez', gate: 'mehraj',
    haz: { nev: 'Méztócsa', fx: 'slow' }, dark: 0.25, mech: 'mez',
    pal: { void: '#1a1206', floor: '#5a6b2c', floor2: '#6f7f35', wall: '#8a6a2a', haz: '#c98a14', obst: '#d9a33a', speck: '#f7e07a', light: '#fff1b8' },
    enemies: ['darazs', 'mezgolem', 'medve', 'vandorraj', 'rablomeh'], boss: 'kiralyno',
    intro: 'Akác, hárs, levendula. Mézország rétjein a darazsak megbolondultak – a Kaptár mélyén új királynő uralkodik.'
  },
  {
    id: 'egtorony', nev: 'Az Égtorony', vilag: 'Égtorony', lvl: 11, floors: 4, style: 'pillars', mat: 'felho', gate: 'felholepes',
    haz: { nev: 'Szélcsatorna', fx: 'wind' }, dark: 0.35, mech: 'egtorony',
    pal: { void: '#0e1424', floor: '#6b7184', floor2: '#7c8296', wall: '#9aa3b8', haz: '#a8c8ff', obst: '#c1c8d8', speck: '#ffffff', light: '#dfe8ff', wallLine: 'rgba(255,255,255,.12)' },
    enemies: ['lancos', 'hollo', 'szelszellem', 'kotanitvany', 'arnyekharcos'], boss: 'sziv',
    intro: 'Három éve nem esik a völgyben. A torony a völgy vizét issza, a csúcson valaki láncra verve áll.'
  },
  {
    id: 'melyseg', nev: 'A Mélység', vilag: 'Mélység', lvl: 16, floors: 4, style: 'crystal', mat: 'magma', gate: 'magma',
    haz: { nev: 'Láva', fx: 'burn' }, dark: 0.62, mech: 'melyseg',
    pal: { void: '#120604', floor: '#3a2522', floor2: '#4a2e28', wall: '#5e3a2e', haz: '#ff5a1a', obst: '#7ad3ff', speck: '#ff9b4a', light: '#ffb070' },
    enemies: ['magmafereg', 'kristalyteknos', 'hoszellem', 'vasgolem', 'koboldfuro'], boss: 'magorzo',
    intro: 'Kola, Moho, átmeneti zóna, Gutenberg-határ. Minél lejjebb, annál forróbb – és a közepén fény árad kifelé.'
  },
  {
    id: 'jeltoro', nev: 'A Jeltörő-állomás', vilag: 'Jeltörő', lvl: 21, floors: 4, style: 'radio', mat: 'jel', gate: 'morze',
    haz: { nev: 'Statikus mező', fx: 'drain' }, dark: 0.7, mech: 'jeltoro',
    pal: { void: '#070a07', floor: '#2a2e25', floor2: '#33382c', wall: '#4b5240', haz: '#4dffb0', obst: '#5c5a46', speck: '#a8ff6a', light: '#d8ffcc', grid: 'rgba(120,255,160,.04)' },
    enemies: ['zajleny', 'arnyekugynok', 'szamkisertet', 'antenna', 'morzebogar'], boss: 'szamallomas',
    intro: '1957. október 4. Ma este megszólalt az ég. Az állomás folyosóin a zaj testet öltött.'
  },
  {
    id: 'loter', nev: 'A Kísérleti Lőtér', vilag: 'Kísérleti Lőtér', lvl: 26, floors: 4, style: 'machine', mat: 'uzemanyag', gate: 'szokes',
    haz: { nev: 'Kiömlött üzemanyag', fx: 'burn' }, dark: 0.3, mech: 'loter',
    pal: { void: '#141008', floor: '#6b5a44', floor2: '#7a684f', wall: '#8b8577', haz: '#4a3a5a', obst: '#556070', speck: '#2b2418', light: '#ffe2b0', grid: 'rgba(0,0,0,.08)' },
    enemies: ['elszabadultraketa', 'szerelorobot', 'legvedelmi', 'tesztpilota', 'fokozat'], boss: 'n1',
    intro: 'A Lőtér rakétái maguktól indulnak. A szerelőcsarnok mélyén a legnagyobb, az N-1 Szörnyeteg ébredezik.'
  },
  {
    id: 'eh', nev: 'Az Eseményhorizont', vilag: 'Eseményhorizont', lvl: 31, floors: 5, style: 'void', mat: 'egzotikus', gate: 'idohurok',
    haz: { nev: 'Gravitációs kút', fx: 'pull' }, dark: 0.55, mech: 'eh',
    pal: { void: '#020106', floor: '#16122a', floor2: '#1d1838', wall: '#3a2a66', haz: '#5b2aa8', obst: '#c48cff', speck: '#ffffff', light: '#e0c8ff', grid: 'rgba(196,140,255,.05)' },
    enemies: ['arapaly', 'idovisszhang', 'fazislidérc', 'spagetti', 'fotonraj'], boss: 'onmagad',
    intro: 'A horizonton túl a tér négydimenziós. A W-tengely mentén ajtók nyílnak – és valahol a tesszeraktban hátulról látod önmagad.'
  },
];
const REGION = Object.fromEntries(REGIONS.map(r => [r.id, r]));

// ---------------- szörnyek ----------------
// ai: melee, ranged, charger, exploder, caster, summoner, swarm, tank, turret, phase
const ENEMIES = {
  // Raktár
  raklapbogar: { nev: 'Raklapbogár', ai: 'swarm', hp: 14, dmg: 3, spd: 125, r: 9, xp: 1, look: { s: 'bug', c: '#b48a5a', c2: '#6b4f2f' } },
  polcmimik: { nev: 'Polcmimik', ai: 'melee', hp: 40, dmg: 6, spd: 70, r: 14, xp: 2.5, armor: 10, look: { s: 'box', c: '#c9a06a', c2: '#e07b26' } },
  targonca: { nev: 'Elszabadult targonca', ai: 'charger', hp: 55, dmg: 11, spd: 60, r: 16, xp: 3, armor: 20, look: { s: 'forklift', c: '#f2b01e', c2: '#222' } },
  kartonkobold: { nev: 'Kartonkobold', ai: 'ranged', hp: 22, dmg: 4, spd: 85, r: 10, xp: 2, look: { s: 'humanoid', c: '#a8865a', c2: '#e8d7b0' }, shot: { spd: 260, cd: 1.6, n: 1, c: '#d7c39a', r: 5, kind: 'box' } },
  'lidérc': { nev: 'Pohármosó-lidérc', ai: 'caster', hp: 36, dmg: 7, spd: 75, r: 12, xp: 3, dt: 'fagy', look: { s: 'ghost', c: '#bfe9ff', c2: '#ffffff' }, cast: { r: 60, delay: 1.0, cd: 3.2 } },
  // Mézország
  darazs: { nev: 'Megbolondult darázs', ai: 'swarm', hp: 14, dmg: 3.5, spd: 165, r: 8, xp: 1, look: { s: 'bee', c: '#ffcc00', c2: '#1a1a1a' } },
  mezgolem: { nev: 'Mézgólem', ai: 'tank', hp: 110, dmg: 12, spd: 48, r: 18, xp: 5, armor: 15, look: { s: 'golem', c: '#e0a024', c2: '#ffdd77' }, onDeath: 'honey' },
  medve: { nev: 'Mézrabló medve', ai: 'charger', hp: 80, dmg: 13, spd: 70, r: 17, xp: 4, look: { s: 'beast', c: '#6a4426', c2: '#3a2414' } },
  vandorraj: { nev: 'Vándorraj', ai: 'summoner', hp: 46, dmg: 4, spd: 60, r: 14, xp: 4, look: { s: 'hive', c: '#c98a14', c2: '#5a3a08' }, summon: { type: 'darazs', n: 3, cd: 6 } },
  rablomeh: { nev: 'Rablóméh', ai: 'ranged', hp: 26, dmg: 5, spd: 120, r: 9, xp: 2, look: { s: 'bee', c: '#ff7a00', c2: '#2a1a00' }, shot: { spd: 330, cd: 1.3, n: 1, c: '#ffcc33', r: 3, kind: 'stinger' } },
  // Égtorony
  lancos: { nev: 'Láncos őr', ai: 'melee', hp: 60, dmg: 9, spd: 85, r: 13, xp: 3, armor: 12, look: { s: 'humanoid', c: '#8f98ad', c2: '#ccd2e0', chain: true } },
  hollo: { nev: 'Szemira hollója', ai: 'ranged', hp: 28, dmg: 6, spd: 150, r: 10, xp: 2.5, look: { s: 'bird', c: '#20202a', c2: '#6b5bff' }, shot: { spd: 340, cd: 1.5, n: 3, spread: 0.25, c: '#8f7bff', r: 4, kind: 'feather' } },
  szelszellem: { nev: 'Szélszellem', ai: 'swarm', hp: 20, dmg: 5, spd: 175, r: 10, xp: 1.5, dt: 'villam', look: { s: 'ghost', c: '#dfefff', c2: '#a8c8ff' } },
  kotanitvany: { nev: 'Rorek tanítványa', ai: 'charger', hp: 70, dmg: 12, spd: 90, r: 13, xp: 4, look: { s: 'humanoid', c: '#7a4b3a', c2: '#d9a441' } },
  arnyekharcos: { nev: 'Árnyékharcos', ai: 'phase', hp: 50, dmg: 10, spd: 110, r: 12, xp: 4, dt: 'ter', look: { s: 'humanoid', c: '#1a1424', c2: '#8a5bd0' } },
  // Mélység
  magmafereg: { nev: 'Magmaféreg', ai: 'charger', hp: 70, dmg: 13, spd: 80, r: 15, xp: 4, dt: 'tuz', res: { tuz: 60 }, look: { s: 'worm', c: '#ff5a1a', c2: '#ffd27a' } },
  kristalyteknos: { nev: 'Kristályteknős', ai: 'tank', hp: 140, dmg: 12, spd: 40, r: 19, xp: 6, armor: 40, look: { s: 'turtle', c: '#4a3a36', c2: '#7ad3ff' }, drop: 'gyemant' },
  hoszellem: { nev: 'Hőszellem', ai: 'exploder', hp: 26, dmg: 22, spd: 150, r: 11, xp: 2, dt: 'tuz', look: { s: 'blob', c: '#ff8a2a', c2: '#fff0a0' } },
  vasgolem: { nev: 'Vas–nikkel gólem', ai: 'melee', hp: 95, dmg: 14, spd: 65, r: 16, xp: 5, armor: 30, res: { villam: -30 }, look: { s: 'golem', c: '#6c6f78', c2: '#ff7a3a' } },
  koboldfuro: { nev: 'Fúrókobold', ai: 'ranged', hp: 40, dmg: 9, spd: 85, r: 11, xp: 3, look: { s: 'humanoid', c: '#b0703a', c2: '#ffdd55' }, shot: { spd: 300, cd: 1.7, n: 1, c: '#ff9b4a', r: 6, kind: 'rock' } },
  // Jeltörő
  zajleny: { nev: 'Zajlény', ai: 'swarm', hp: 30, dmg: 7, spd: 160, r: 10, xp: 2, dt: 'villam', invis: true, look: { s: 'static', c: '#a8ff6a', c2: '#ffffff' } },
  arnyekugynok: { nev: 'Árnyékügynök', ai: 'ranged', hp: 55, dmg: 11, spd: 110, r: 12, xp: 4, look: { s: 'agent', c: '#1d2218', c2: '#c8c8b0' }, shot: { spd: 560, cd: 1.4, n: 2, spread: 0.08, c: '#f4f06a', r: 3, kind: 'bullet' } },
  szamkisertet: { nev: 'Számállomás-kísértet', ai: 'caster', hp: 60, dmg: 13, spd: 70, r: 13, xp: 4, dt: 'villam', look: { s: 'ghost', c: '#7af0c8', c2: '#e8fff4' }, cast: { r: 70, delay: 1.0, cd: 3, n: 2 } },
  antenna: { nev: 'Zavaróantenna', ai: 'turret', hp: 80, dmg: 9, spd: 0, r: 14, xp: 4, armor: 25, dt: 'villam', look: { s: 'antenna', c: '#6a6f5a', c2: '#ff4433' }, shot: { spd: 300, cd: 1.6, n: 8, spread: 6.283, c: '#4dffb0', r: 5, kind: 'wave' } },
  morzebogar: { nev: 'Morzebogár', ai: 'exploder', hp: 34, dmg: 26, spd: 140, r: 10, xp: 2.5, dt: 'villam', look: { s: 'bug', c: '#3a3f2a', c2: '#f4f06a' } },
  // Lőtér
  elszabadultraketa: { nev: 'Elszabadult rakéta', ai: 'exploder', hp: 40, dmg: 32, spd: 175, r: 11, xp: 3, dt: 'tuz', look: { s: 'rocket', c: '#e8e8e8', c2: '#ff4422' } },
  szerelorobot: { nev: 'Szerelőrobot', ai: 'melee', hp: 110, dmg: 15, spd: 80, r: 15, xp: 5, armor: 35, res: { villam: -25 }, look: { s: 'robot', c: '#8b98a8', c2: '#ffcc33' } },
  legvedelmi: { nev: 'Légvédelmi löveg', ai: 'turret', hp: 120, dmg: 12, spd: 0, r: 16, xp: 5, armor: 40, look: { s: 'turret', c: '#556070', c2: '#2a2f38' }, shot: { spd: 620, cd: 0.9, n: 3, spread: 0.12, c: '#ffd27a', r: 3, kind: 'bullet', burst: 3 } },
  tesztpilota: { nev: 'Égett tesztpilóta', ai: 'ranged', hp: 75, dmg: 12, spd: 100, r: 12, xp: 4, look: { s: 'humanoid', c: '#e0d0b0', c2: '#ff7a2e', helmet: true }, shot: { spd: 420, cd: 1.3, n: 1, c: '#ff7a2e', r: 6, kind: 'fireball', splash: 40 } },
  fokozat: { nev: 'Leváló fokozat', ai: 'summoner', hp: 130, dmg: 10, spd: 45, r: 18, xp: 6, armor: 25, look: { s: 'rocket', c: '#b8b8b8', c2: '#555' }, summon: { type: 'elszabadultraketa', n: 2, cd: 7 } },
  // Eseményhorizont
  arapaly: { nev: 'Árapály-lény', ai: 'melee', hp: 120, dmg: 17, spd: 95, r: 15, xp: 5, dt: 'ter', look: { s: 'tidal', c: '#5b2aa8', c2: '#e0c8ff' } },
  idovisszhang: { nev: 'Idővisszhang', ai: 'ranged', hp: 80, dmg: 15, spd: 120, r: 12, xp: 5, dt: 'ter', look: { s: 'echo', c: '#c48cff', c2: '#ffffff' }, shot: { spd: 480, cd: 1.2, n: 1, c: '#c48cff', r: 5, kind: 'bolt' } },
  'fazislidérc': { nev: 'Fázislidérc', ai: 'phase', hp: 95, dmg: 18, spd: 120, r: 13, xp: 6, dt: 'ter', wphase: true, look: { s: 'ghost', c: '#8a5bd0', c2: '#ffffff' } },
  spagetti: { nev: 'Spagettifikált', ai: 'swarm', hp: 45, dmg: 10, spd: 150, r: 9, xp: 2.5, look: { s: 'worm', c: '#d0b0ff', c2: '#ffffff' } },
  fotonraj: { nev: 'Fotonraj', ai: 'caster', hp: 70, dmg: 16, spd: 90, r: 12, xp: 5, dt: 'villam', look: { s: 'orb', c: '#fff6c8', c2: '#ffb347' }, cast: { r: 80, delay: 0.9, cd: 2.8, n: 3 } },
  // idézett / bosshoz tartozó
  lanc: { nev: 'A Lánc', ai: 'turret', hp: 55, dmg: 0, spd: 0, r: 16, xp: 3, armor: 0, look: { s: 'chain', c: '#9aa3b8', c2: '#ffd27a' }, noShot: true },
  adoantenna: { nev: 'Adótorony', ai: 'turret', hp: 70, dmg: 12, spd: 0, r: 16, xp: 3, armor: 20, dt: 'villam', look: { s: 'antenna', c: '#6a6f5a', c2: '#4dffb0' }, shot: { spd: 260, cd: 2.2, n: 12, spread: 6.283, c: '#4dffb0', r: 5, kind: 'wave' } },
};

// ---------------- bossok ----------------
// minták: radial, spiral, aimed, charge, slam, rain, summon, ring, beam
const BOSSES = {
  leltarhiany: {
    nev: 'A Leltárhiány', cim: 'Ami nincs meg, az is van valahol', hp: 520, dmg: 12, spd: 70, r: 34, look: { s: 'leltar', c: '#2a3a52', c2: '#ff3355' },
    patterns: [{ k: 'aimed', n: 5, spread: 0.5, spd: 300, kind: 'box', cd: 2.2 }, { k: 'charge', cd: 5, spd: 520 }, { k: 'summon', type: 'raklapbogar', n: 4, cd: 9 }, { k: 'rain', n: 6, r: 60, cd: 7 }],
    p2: 'A hiány nő! Minden polc üres lesz…',
    lines: ['Leltárhiány: 1 db. Te.', 'Ami nincs a rendszerben, az nem létezik!', 'Kétezer tétel, nyolcszázkilencven hely. Valakinek mennie kell.'],
  },
  kiralyno: {
    nev: 'A Darázskirálynő', cim: 'Mézország bitorlója', hp: 620, dmg: 14, spd: 95, r: 30, look: { s: 'queen', c: '#ffcc00', c2: '#1a1a1a' },
    patterns: [{ k: 'summon', type: 'darazs', n: 6, cd: 7 }, { k: 'spiral', n: 18, spd: 260, kind: 'stinger', cd: 5 }, { k: 'charge', cd: 6, spd: 560 }, { k: 'ring', n: 24, spd: 240, kind: 'stinger', cd: 6, slowHaz: true }],
    p2: 'Az egész raj felém repül!',
    lines: ['Zzzz… a Csillagméhes az enyém!', 'Az akác májusban háromszor édesebb. A vér is.', 'A Kárpátokig mind az enyém!'],
  },
  sziv: {
    nev: 'Az Égtorony Szíve', cim: '„Ne az Urat üsd, a láncot nézd.” – Bodor', hp: 760, dmg: 16, spd: 0, r: 36, look: { s: 'heart', c: '#c23a5a', c2: '#ffd27a' }, chains: 4,
    patterns: [{ k: 'radial', n: 16, spd: 250, kind: 'feather', cd: 3 }, { k: 'slam', r: 170, cd: 6 }, { k: 'rain', n: 8, r: 65, cd: 6 }, { k: 'summon', type: 'szelszellem', n: 4, cd: 10 }],
    p2: 'A láncok megfeszülnek – a torony a völgy vizét issza!',
    lines: ['Nem én akartam… fentről húznak.', 'Három éve nem esett a völgyben.', 'Állj a helyemre, és mindenki szabad lesz.'],
  },
  magorzo: {
    nev: 'A Mag Őre', cim: '6371 km – ahol a g nulla', hp: 900, dmg: 18, spd: 60, r: 36, look: { s: 'core', c: '#ff7a2a', c2: '#fff0a0' },
    patterns: [{ k: 'ring', n: 20, spd: 220, kind: 'rock', cd: 4 }, { k: 'rain', n: 10, r: 70, cd: 6, ground: true }, { k: 'slam', r: 190, cd: 7 }, { k: 'summon', type: 'hoszellem', n: 4, cd: 9 }],
    p2: '5150 km: a belső mag szilárd, mert a nyomás préseli – és most téged is.',
    lines: ['Kéreg, köpeny, mag. Te csak egy ásvány vagy.', '330 gigapascal. Bírod még?', 'Itt nincs lent és fent.'],
  },
  szamallomas: {
    nev: 'A Számállomás', cim: '29999 kHz', hp: 1000, dmg: 19, spd: 50, r: 32, look: { s: 'radiohead', c: '#2a2e25', c2: '#4dffb0' }, antennas: 3,
    patterns: [{ k: 'beam', cd: 6, dur: 2.2 }, { k: 'radial', n: 20, spd: 230, kind: 'wave', cd: 3.5 }, { k: 'rain', n: 8, r: 70, cd: 5 }, { k: 'summon', type: 'zajleny', n: 5, cd: 9 }],
    p2: 'Nulla-egy. Nulla-négy. Egy-kilenc. Öt-hét…',
    lines: ['Figyelem. Figyelem. Öt-egy, egy-egy, nulla-egy.', 'A HOLD NEM MESSZE.', 'NEM VAGY EGYEDÜL.'],
  },
  n1: {
    nev: 'Az N-1 Szörnyeteg', cim: 'A Holdrakéta, ami sosem jutott el a Holdra', hp: 1150, dmg: 21, spd: 55, r: 38, look: { s: 'mech', c: '#b8b8b8', c2: '#ff4422' },
    patterns: [{ k: 'summon', type: 'elszabadultraketa', n: 4, cd: 7 }, { k: 'aimed', n: 7, spread: 0.6, spd: 420, kind: 'fireball', cd: 2.5 }, { k: 'rain', n: 12, r: 75, cd: 6 }, { k: 'charge', cd: 7, spd: 480 }],
    p2: 'Második fokozat: GYÚJTÁS!',
    lines: ['Visszaszámlálás: 3… 2… 1…', '6800 kilonewton. Te hány vagy?', 'A Keleti Unió 9000 kilométerre van. Te kettőre.'],
  },
  onmagad: {
    nev: 'Te magad', cim: 'Az idővisszhang a tesszeraktban', hp: 1300, dmg: 22, spd: 140, r: 16, look: { s: 'self', c: '#c48cff', c2: '#ffffff' }, mirror: true,
    patterns: [{ k: 'mirror', cd: 1.2 }, { k: 'charge', cd: 4, spd: 600 }, { k: 'spiral', n: 16, spd: 300, kind: 'bolt', cd: 5 }, { k: 'summon', type: 'idovisszhang', n: 2, cd: 10 }],
    p2: 'Látod magad hátulról? Ez mindig is így volt.',
    lines: ['Aki elküldi, az kapja meg.', 'Ne add fel. Megéri.', 'Ugyanazt mondtam én is, amikor te voltam.'],
  },
  szingularitas: {
    nev: 'A Szingularitás', cim: 'A Zaj, amely minden világot elnyel', hp: 1900, dmg: 24, spd: 0, r: 44, look: { s: 'singularity', c: '#000000', c2: '#ffb347' }, gravity: 140,
    patterns: [{ k: 'spiral', n: 28, spd: 220, kind: 'bolt', cd: 4 }, { k: 'rain', n: 14, r: 70, cd: 5 }, { k: 'ring', n: 32, spd: 200, kind: 'wave', cd: 5 }, { k: 'summon', type: 'spagetti', n: 6, cd: 8 }, { k: 'beam', cd: 8, dur: 2.5 }],
    p2: 'Planck-tartomány. Itt már a tér és az idő sem az, aminek látszik.',
    lines: ['MINDEN BEESIK.', 'A horizont mindenre emlékszik. Rád is.', 'Nincs kifelé.'],
  },
};
// Mini-bossok (névvel ellátott elitek)
const NAMED = {
  'lidérc_kiraly': { base: 'lidérc', nev: 'A pohármosó Lidérce', hpM: 6, dmgM: 1.6, mods: ['gyors', 'fagyos'], c: '#bfe9ff' },
  rorek: { base: 'kotanitvany', nev: 'Vasfogú Rorek', hpM: 7, dmgM: 1.8, mods: ['vastag', 'gyors'], c: '#d9a441', line: 'A vasfogamat Bodor ütötte ki húsz éve. Te leszel a törlesztőrészlet.' },
  szemira: { base: 'hollo', nev: 'Hollókirálynő Szemira', hpM: 7, dmgM: 1.6, mods: ['teleport', 'sokszor'], c: '#8f7bff', line: 'A hollóim mindent látnak. Téged is, amikor elesel.' },
  kende: { base: 'kotanitvany', nev: 'Vörös Kende', hpM: 8, dmgM: 1.8, mods: ['tuzes', 'gyors'], c: '#ff4433', line: 'Te vagy az, akiről beszélnek? Nevetséges… én leszek a torony ura.' },
  kolamester: { base: 'koboldfuro', nev: 'A Kola-fúró mestere', hpM: 7, dmgM: 1.6, mods: ['tuzes', 'vastag'], c: '#ffdd55', line: '12 262 méter! Tovább senki sem jutott. Te sem fogsz.' },
  lidérc2: { base: 'szamkisertet', nev: 'Az 1957-es Bemondó', hpM: 7, dmgM: 1.6, mods: ['teleport', 'fagyos'], c: '#7af0c8', line: 'Öt-egy. Egy-egy. Nulla-egy. Ez a te neved.' },
  fokonst: { base: 'szerelorobot', nev: 'A Megbolondult Főkonstruktőr-gép', hpM: 8, dmgM: 1.7, mods: ['vastag', 'tuzes'], c: '#ffcc33', line: 'A korszak építésze vagyok! A korszakot én építem újra!' },
};
const ELITE_MODS = {
  gyors: { nev: 'Gyors', c: '#7fffb0' }, vastag: { nev: 'Vastagbőrű', c: '#c0a080' }, tuzes: { nev: 'Tüzes', c: '#ff7a2e' }, fagyos: { nev: 'Fagyos aura', c: '#7fd8ff' },
  vampir: { nev: 'Vámpír', c: '#ff3355' }, sokszor: { nev: 'Sokszorozódó', c: '#ffd34d' }, teleport: { nev: 'Teleportáló', c: '#c48cff' }, villamos: { nev: 'Villámló', c: '#f4f06a' },
};

// ---------------- ŐSÖK – indokolatlanul erős, kóborló ellenfelek ----------------
// lvlPlus: a világ szintje fölött ennyivel; a legyőzésük Tiltott pecsétet ad
const ANCIENTS = {
  raktar: { id: 'osfelugyelo', base: 'polcmimik', nev: 'Az Ősfelügyelő', cim: 'Ő vette fel az első raklapot. Ő fogja levenni az utolsót.', lvlPlus: 28, hpM: 40, dmgM: 3.2, r: 30, mods: ['vastag', 'teleport', 'villamos'], c: '#ff3355', relic: 'leltarkonyv' },
  mez: { id: 'elsoanya', base: 'mezgolem', nev: 'Az Első Anyakirálynő', cim: 'Fél gramm méz egy életen át – ő az összeset megette.', lvlPlus: 30, hpM: 45, dmgM: 3.2, r: 32, mods: ['sokszor', 'vampir', 'gyors'], c: '#ffcc00', relic: 'mezkorona' },
  egtorony: { id: 'elsoharcos', base: 'kotanitvany', nev: 'Az Első Harcos', cim: 'A 40. emelet lakója. Nem ütött még kétszer ugyanoda.', lvlPlus: 32, hpM: 48, dmgM: 3.4, r: 22, mods: ['gyors', 'teleport', 'tuzes'], c: '#ffd27a', relic: 'szivkard' },
  melyseg: { id: 'lehmann', base: 'vasgolem', nev: 'A Lehmann-határ Őse', cim: '5150 km. 330 GPa. Szilárd, mert préselik.', lvlPlus: 34, hpM: 55, dmgM: 3.4, r: 34, mods: ['vastag', 'tuzes', 'fagyos'], c: '#ff8a2a', relic: 'magkristaly' },
  jeltoro: { id: 'szputnyik', base: 'szamkisertet', nev: 'A Szputnyik Hangja', cim: '1957. október 4. Bip. Bip. Bip. Örökké.', lvlPlus: 36, hpM: 50, dmgM: 3.6, r: 26, mods: ['teleport', 'villamos', 'sokszor'], c: '#e8fff4', relic: 'fejhallgato' },
  loter: { id: 'carbomba', base: 'fokozat', nev: 'Az 50 Megatonnás', cim: 'A legnagyobb próba. A szeizmográfok háromszor kerülték meg a Földet.', lvlPlus: 38, hpM: 60, dmgM: 3.8, r: 36, mods: ['tuzes', 'vastag', 'villamos'], c: '#ff4422', relic: 'szonda' },
  eh: { id: 'm87', base: 'fotonraj', nev: 'M87*', cim: '6,5 milliárd naptömeg. A te fekete lyukad ehhez képest morzsa.', lvlPlus: 40, hpM: 70, dmgM: 4, r: 40, mods: ['vampir', 'teleport', 'fagyos', 'villamos'], c: '#ffb347', relic: 'tesszerakt' },
};

// ---------------- ÉLELEM (éhség, szomjúság, fáradtság) ----------------
const FOODS = {
  pogacsa: { nev: 'Nagyi tepertős pogácsája', ikon: '🥐', kaja: 35, ar: 12, desc: 'Ropogós. Nagyi szerint „csak egyet”, de senki sem eszik egyet.' },
  langos: { nev: 'Lángos', ikon: '🫓', kaja: 55, hp: 0.15, ar: 25, desc: 'Fokhagymás tejföllel. Egy egész napra elég.' },
  mezescsupor: { nev: 'Akácmézes csupor', ikon: '🍯', kaja: 18, ital: 6, hp: 0.3, ar: 30, desc: 'Mézország májusi akácmézéből.' },
  konzerv: { nev: 'Lőtéri hadtápkonzerv', ikon: '🥫', kaja: 45, ar: 18, desc: 'Gyártási év: 1957. Még ehető. Talán.' },
  tubus: { nev: 'Űrhajós-tubus', ikon: '🧴', kaja: 30, ital: 25, ar: 40, desc: 'Gulyás tubusban. Súlytalanságban is.' },
  gomba: { nev: 'Barlangi gomba', ikon: '🍄', kaja: 22, ar: 6, desc: 'A Mélység melegében nőtt. Világít.' },
  viz: { nev: 'Kulacs víz', ikon: '💧', ital: 45, ar: 8, desc: 'Egyszerű, és mégis ez kell a legjobban.' },
  kola: { nev: 'Kóla', ikon: '🥤', ital: 30, alvas: 12, ar: 10, desc: 'Kurta kedvence. +14% gáz.' },
  bika: { nev: 'Bika energiaital', ikon: '🐂', ital: 22, alvas: 35, ar: 18, desc: 'Szárnyakat nem ad, de ébren tart. +22% gáz.' },
  sprite: { nev: 'Spréjt', ikon: '🍋', ital: 38, ar: 10, desc: 'Az egyetlen, ami elveszi a gázt.' },
  kave: { nev: 'Raktári automatás kávé', ikon: '☕', ital: 10, alvas: 45, ar: 9, desc: 'A hajnali műszak üzemanyaga.' },
  satorlap: { nev: 'Sátor', ikon: '⛺', ar: 60, tent: true, desc: 'Egy kitakarított teremben felverve kialszod magad (N gomb).' },
};
// melyik világban mi esik
const FOOD_DROPS = { raktar: ['kave', 'pogacsa', 'viz', 'kola'], mez: ['mezescsupor', 'viz', 'pogacsa'], egtorony: ['viz', 'pogacsa', 'langos'], melyseg: ['gomba', 'viz', 'konzerv'], jeltoro: ['konzerv', 'kave', 'viz'], loter: ['konzerv', 'tubus', 'bika'], eh: ['tubus', 'viz', 'bika'], hasadek: ['tubus', 'langos', 'bika', 'viz'] };
