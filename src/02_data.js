// ============================================================
//  ADATOK: sebzéstípusok, tulajdonságok, kasztok, tárgyak
// ============================================================
const DT = { fiz: { nev: 'Fizikai', c: '#e6e0d4' }, tuz: { nev: 'Tűz', c: '#ff7a2e' }, fagy: { nev: 'Fagy', c: '#7fd8ff' }, villam: { nev: 'Villám', c: '#f4f06a' }, ter: { nev: 'Téridő', c: '#c48cff' } };
const ATTR = { ero: 'Erő', ugy: 'Ügyesség', akarat: 'Akarat', kit: 'Kitartás', allo: 'Állóképesség' };
const ATTR_DESC = { ero: '+1,1% közelharci sebzés', ugy: '+1,1% távolsági sebzés, +0,08% kritikus esély', akarat: '+1,3% varázssebzés, +2 erőforrás', kit: '+7 életerő, +1,5 páncél', allo: '+2 állóképesség, +1,5% gyorsabb töltődés, lassabb éhezés' };
// Kasztonkénti erőforrás
const RESOURCES = {
  penge: { nev: 'Düh', c: '#e0473a', ikon: '🔥', desc: 'Ütéssel és sebződéssel gyűlik, harcon kívül elpárolog.' },
  elem: { nev: 'Mana', c: '#4f8dff', ikon: '💧', desc: 'Folyamatosan töltődik. Az Akarat növeli.' },
  loves: { nev: 'Belső idő', c: '#f2d36b', ikon: '⏳', desc: 'Lassan töltődik; a Golyóidő ebből lassítja a világot.' },
  mernok: { nev: 'Áram', c: '#5fe0d0', ikon: '⚡', desc: 'Az akkumulátor töltődik; a gépek és a Túlfeszültség ebből élnek.' },
};
const MAX_LVL = 70;
const xpNeed = l => Math.round(120 * Math.pow(l, 1.8) + 80 * l);

// Szörnyek erősödése szint szerint
const monHp = l => 1 + 0.30 * (l - 1) + 0.016 * (l - 1) * (l - 1);
const monDmg = l => 1 + 0.12 * (l - 1) + 0.0045 * (l - 1) * (l - 1);
// Fegyver alapsebzés tárgyszint szerint (kb. a szörny-HP-t követi)
const wepScale = l => 1 + 0.27 * (l - 1) + 0.0145 * (l - 1) * (l - 1);
const armScale = l => 1 + 0.22 * (l - 1) + 0.006 * (l - 1) * (l - 1);

// ---------------- kasztok ----------------
const CLASSES = {
  penge: {
    nev: 'Pengelovag', ikon: '⚔', szin: '#e0a84a', fegyver: 'kard',
    leiras: 'Közelharcos. Pajzsként viseli a páncélt, düht gyűjt minden ütéssel. Forgószél, roham, földrengés – ahol ő jár, ott nem marad álló szörny.',
    base: { ero: 15, ugy: 8, akarat: 5, kit: 13, allo: 10 }, hpL: 14, mpL: 0, mpBase: 100, mpRegen: 0, onHitMp: 6, rage: true,
    kedvenc: 'melee'
  },
  elem: {
    nev: 'Elementalista', ikon: '✦', szin: '#7fb8ff', fegyver: 'palca',
    leiras: 'Varázsló. Tűz, fagy és villám ura – törékeny, de egyetlen meteorral kiürít egy termet. Az energia gyorsan töltődik.',
    base: { ero: 5, ugy: 8, akarat: 16, kit: 9, allo: 8 }, hpL: 9, mpL: 6, mpBase: 110, mpRegen: 6, onHitMp: 0,
    kedvenc: 'spell'
  },
  loves: {
    nev: 'Mesterlövész', ikon: '⌖', szin: '#9be07a', fegyver: 'puska',
    leiras: 'Lőfegyveres. Pisztoly, puska, gránát – távolról, kritikus találatokkal dolgozik, és tudja, mikor kell hátrálni.',
    base: { ero: 7, ugy: 16, akarat: 6, kit: 10, allo: 12 }, hpL: 11, mpL: 3, mpBase: 80, mpRegen: 4.5, onHitMp: 0.6,
    kedvenc: 'ranged'
  },
  mernok: {
    nev: 'Mérnök', ikon: '⚙', szin: '#ffb36b', fegyver: 'pisztoly',
    leiras: 'A Kísérleti Lőtér neveltje. Drónokat, lövegtornyokat és önirányító rakétákat épít – a gépei harcolnak helyette.',
    base: { ero: 8, ugy: 12, akarat: 10, kit: 11, allo: 10 }, hpL: 11, mpL: 4, mpBase: 90, mpRegen: 4.5, onHitMp: 0.4,
    kedvenc: 'summon'
  }
};

// ---------------- fegyver- és tárgyalapok ----------------
// kind: melee/ranged/spell – ez határozza meg az alap támadást (bal gomb)
const BASES = {
  kard: { nev: 'Kard', slot: 'fegyver', kind: 'melee', min: 6, max: 10, spd: 1.6, range: 62, arc: 1.7, dtype: 'fiz', knock: 70, stop: 0.04, ikon: '🗡' },
  poroly: { nev: 'Pöröly', slot: 'fegyver', kind: 'melee', min: 11, max: 17, spd: 0.95, range: 70, arc: 2.3, dtype: 'fiz', knock: 210, stop: 0.075, ikon: '🔨' },
  lancfuresz: { nev: 'Láncfűrész-penge', slot: 'fegyver', kind: 'melee', min: 3, max: 5, spd: 4.2, range: 54, arc: 1.2, dtype: 'fiz', knock: 12, stop: 0.012, ikon: '⚙', reqLvl: 8 },
  palca: { nev: 'Pálca', slot: 'fegyver', kind: 'spell', min: 5, max: 8, spd: 2.0, pspd: 520, prad: 6, dtype: 'ter', mp: 1.5, ikon: '🪄' },
  bot: { nev: 'Varázsbot', slot: 'fegyver', kind: 'spell', min: 10, max: 15, spd: 1.05, pspd: 380, prad: 10, dtype: 'tuz', splash: 46, mp: 3, ikon: '🔮' },
  pisztoly: { nev: 'Pisztoly', slot: 'fegyver', kind: 'ranged', min: 4, max: 7, spd: 3.2, pspd: 760, prad: 3, dtype: 'fiz', spread: 0.06, ikon: '🔫' },
  puska: { nev: 'Puska', slot: 'fegyver', kind: 'ranged', min: 11, max: 16, spd: 1.15, pspd: 1100, prad: 3, dtype: 'fiz', pierce: 2, spread: 0.01, ikon: '︻' },
  serettel: { nev: 'Sörétes', slot: 'fegyver', kind: 'ranged', min: 3, max: 5, spd: 1.1, pspd: 700, prad: 3, dtype: 'fiz', pellets: 6, spread: 0.32, ikon: '💥', reqLvl: 5 },
  raketaveto: { nev: 'Rakétavető', slot: 'fegyver', kind: 'ranged', min: 14, max: 22, spd: 0.7, pspd: 460, prad: 6, dtype: 'tuz', splash: 64, ikon: '🚀', reqLvl: 10 },
  plazmavezeto: { nev: 'Plazmavető', slot: 'fegyver', kind: 'ranged', min: 4, max: 6, spd: 5, pspd: 600, prad: 5, dtype: 'villam', spread: 0.1, ikon: '⚡', reqLvl: 15 },
  sisak: { nev: 'Sisak', slot: 'fej', arm: 6, ikon: '⛑' },
  vert: { nev: 'Vért', slot: 'test', arm: 14, ikon: '🛡' },
  kesztyu: { nev: 'Kesztyű', slot: 'kez', arm: 4, ikon: '🧤' },
  csizma: { nev: 'Csizma', slot: 'lab', arm: 5, ikon: '🥾' },
  amulett: { nev: 'Amulett', slot: 'nyak', ikon: '📿' },
  gyuru: { nev: 'Gyűrű', slot: 'gyuru', ikon: '💍' },
  dukko: { nev: 'Dühkő', slot: 'artefakt', res: 'penge', ikon: '🔴' },
  manakristaly: { nev: 'Manakristály', slot: 'artefakt', res: 'elem', ikon: '🔷' },
  homokora: { nev: 'Homokóra', slot: 'artefakt', res: 'loves', ikon: '⏳' },
  akkumulator: { nev: 'Akkumulátor', slot: 'artefakt', res: 'mernok', ikon: '🔋' },
};
const ARTI_FOR = { penge: 'dukko', elem: 'manakristaly', loves: 'homokora', mernok: 'akkumulator' };
const SLOTS = { fegyver: 'Fegyver', fej: 'Fej', test: 'Test', kez: 'Kéz', lab: 'Láb', nyak: 'Nyak', gyuru: 'Gyűrű', artefakt: 'Artefaktum' };
// Változatos nevek tárgyszint szerint
const BASE_NAMES = {
  kard: ['Rozsdás kard', 'Hosszúkard', 'Csatabárd-kard', 'Fénykard', 'Kvantumpenge'],
  poroly: ['Faragott bunkó', 'Kovácspöröly', 'Csatapöröly', 'Gravitonpöröly', 'Csillagtörő'],
  lancfuresz: ['Láncfűrész-penge', 'Ipari fűrész', 'Plazmafűrész', 'Kvantumfűrész', 'Téridőfűrész'],
  palca: ['Mogyorópálca', 'Rúnapálca', 'Kristálypálca', 'Csillagpálca', 'Tesszerakt-pálca'],
  bot: ['Botocska', 'Tölgybot', 'Viharbot', 'Napbot', 'Szingularitás-bot'],
  pisztoly: ['Öreg revolver', 'Szolgálati pisztoly', 'Gépi pisztoly', 'Lézerpisztoly', 'Fotonpisztoly'],
  puska: ['Vadászpuska', 'Ismétlőpuska', 'Mesterlövész-puska', 'Gauss-puska', 'Railgun'],
  serettel: ['Duplacsövű', 'Pumpás sörétes', 'Harci sörétes', 'Ionsörétes', 'Szórólöveg'],
  raketaveto: ['Csőrakéta', 'Páncéltörő', 'Raj-vető', 'Holdvető', 'Napvihar-vető'],
  plazmavezeto: ['Plazmavető', 'Ívhegesztő', 'Teslavető', 'Villámvető', 'Kvazárvető'],
  sisak: ['Bőrsapka', 'Acélsisak', 'Rohamsisak', 'Űrsisak', 'Horizontsisak'],
  vert: ['Bőrmellény', 'Láncing', 'Lemezvért', 'Exoszkeleton', 'Téridő-páncél'],
  kesztyu: ['Munkáskesztyű', 'Páncélkesztyű', 'Rúnakesztyű', 'Szervókesztyű', 'Penrose-kesztyű'],
  csizma: ['Bakancs', 'Vascsizma', 'Rugós csizma', 'Mágneses csizma', 'Fénycsizma'],
  amulett: ['Csont amulett', 'Ezüst amulett', 'Rúnamedál', 'Csillagmedál', 'Horizont-medál'],
  gyuru: ['Rézgyűrű', 'Ezüstgyűrű', 'Aranygyűrű', 'Rúnagyűrű', 'Fotongyűrű'],
  dukko: ['Repedt dühkő', 'Dühkő', 'Vérző dühkő', 'Vulkáni dühkő', 'Ősharag-kő'],
  manakristaly: ['Zavaros kristály', 'Manakristály', 'Kék lángkristály', 'Csillagkristály', 'Tesszerakt-kristály'],
  homokora: ['Fa homokóra', 'Réz homokóra', 'Kvarc homokóra', 'Relativisztikus óra', 'Novikov-óra'],
  akkumulator: ['Ólomakku', 'Szárazelem', 'Lítiumcella', 'Fúziós cella', 'Casimir-akkumulátor'],
};
const RARITY = [
  { nev: 'Közönséges', c: '#cfc8bb', aff: [0, 0] },
  { nev: 'Kiváló', c: '#6fa8ff', aff: [1, 2] },
  { nev: 'Ritka', c: '#ffd34d', aff: [3, 4] },
  { nev: 'Legendás', c: '#ff8a2a', aff: [4, 5] },
  { nev: 'Ereklye', c: '#d27bff', aff: [3, 4] },
];
// Affixek: v(ilvl, rng) -> érték; slots: hova eshet (null = bárhova)
const AFFIX = [
  { id: 'dmgp', nev: v => `+${v}% sebzés`, v: (l, r) => r.int(4, 8) + Math.floor(l / 4), slots: ['fegyver', 'gyuru', 'nyak', 'kez'], pre: 'Kegyetlen' },
  { id: 'flat', nev: v => `+${v} sebzés`, v: (l, r) => Math.round(r.range(1, 3) * wepScale(l)), slots: ['fegyver', 'kez', 'gyuru'], pre: 'Éles' },
  { id: 'aspd', nev: v => `+${v}% támadási sebesség`, v: (l, r) => r.int(4, 10), slots: ['fegyver', 'kez', 'gyuru'], pre: 'Fürge' },
  { id: 'crit', nev: v => `+${v}% kritikus esély`, v: (l, r) => r.int(2, 5) + Math.floor(l / 20), slots: ['fegyver', 'fej', 'gyuru', 'nyak'], pre: 'Pontos' },
  { id: 'critd', nev: v => `+${v}% kritikus sebzés`, v: (l, r) => r.int(10, 25) + Math.floor(l / 3), slots: ['fegyver', 'nyak', 'kez'], pre: 'Halálos' },
  { id: 'hp', nev: v => `+${v} életerő`, v: (l, r) => Math.round(r.range(8, 16) * armScale(l)), slots: null, pre: 'Erős' },
  { id: 'mp', nev: v => `+${v} energia`, v: (l, r) => Math.round(r.range(5, 12) * (1 + l * 0.05)), slots: ['fej', 'nyak', 'gyuru', 'fegyver'], pre: 'Szellemes' },
  { id: 'arm', nev: v => `+${v} páncél`, v: (l, r) => Math.round(r.range(4, 9) * armScale(l)), slots: ['fej', 'test', 'kez', 'lab'], pre: 'Megerősített' },
  { id: 'res_tuz', nev: v => `+${v}% tűzállóság`, v: (l, r) => r.int(6, 14), slots: null, pre: 'Hőálló' },
  { id: 'res_fagy', nev: v => `+${v}% fagyállóság`, v: (l, r) => r.int(6, 14), slots: null, pre: 'Bundás' },
  { id: 'res_villam', nev: v => `+${v}% villámállóság`, v: (l, r) => r.int(6, 14), slots: null, pre: 'Földelt' },
  { id: 'res_ter', nev: v => `+${v}% téridő-állóság`, v: (l, r) => r.int(5, 12), slots: null, pre: 'Horgonyzott' },
  { id: 'add_tuz', nev: v => `+${v} tűzsebzés a támadásokhoz`, v: (l, r) => Math.round(r.range(1.5, 3.5) * wepScale(l)), slots: ['fegyver', 'kez', 'gyuru'], pre: 'Lángoló' },
  { id: 'add_fagy', nev: v => `+${v} fagysebzés a támadásokhoz`, v: (l, r) => Math.round(r.range(1.5, 3) * wepScale(l)), slots: ['fegyver', 'kez', 'gyuru'], pre: 'Dermesztő' },
  { id: 'add_villam', nev: v => `+${v} villámsebzés a támadásokhoz`, v: (l, r) => Math.round(r.range(1, 4) * wepScale(l)), slots: ['fegyver', 'kez', 'gyuru'], pre: 'Szikrázó' },
  { id: 'ls', nev: v => `${v}% életlopás`, v: (l, r) => r.int(1, 3), slots: ['fegyver', 'gyuru', 'nyak'], pre: 'Vámpír' },
  { id: 'ms', nev: v => `+${v}% mozgási sebesség`, v: (l, r) => r.int(4, 10), slots: ['lab'], pre: 'Szélsebes' },
  { id: 'regen', nev: v => `+${v} életerő-visszatöltés / mp`, v: (l, r) => +(r.range(0.6, 1.6) * armScale(l)).toFixed(1), slots: ['test', 'nyak', 'gyuru', 'fej'], pre: 'Gyógyuló' },
  { id: 'mregen', nev: v => `+${v}% energia-visszatöltés`, v: (l, r) => r.int(8, 20), slots: ['fej', 'nyak', 'gyuru', 'fegyver'], pre: 'Lüktető' },
  { id: 'cdr', nev: v => `−${v}% képesség-újratöltés`, v: (l, r) => r.int(3, 7), slots: ['fej', 'nyak', 'kez'], pre: 'Időtorzító' },
  { id: 'thorns', nev: v => `${v} tüske-sebzés a támadóra`, v: (l, r) => Math.round(r.range(2, 5) * wepScale(l)), slots: ['test', 'fej'], pre: 'Tüskés' },
  { id: 'gf', nev: v => `+${v}% arany`, v: (l, r) => r.int(10, 30), slots: ['gyuru', 'nyak', 'kez', 'lab'], pre: 'Kapzsi' },
  { id: 'mf', nev: v => `+${v}% jobb zsákmány`, v: (l, r) => r.int(6, 18), slots: ['gyuru', 'nyak', 'fej', 'lab'], pre: 'Szerencsés' },
  { id: 'ero', nev: v => `+${v} Erő`, v: (l, r) => r.int(2, 5) + Math.floor(l / 6), slots: null, pre: 'Bivalyerős' },
  { id: 'ugy', nev: v => `+${v} Ügyesség`, v: (l, r) => r.int(2, 5) + Math.floor(l / 6), slots: null, pre: 'Ügyes' },
  { id: 'akarat', nev: v => `+${v} Akarat`, v: (l, r) => r.int(2, 5) + Math.floor(l / 6), slots: null, pre: 'Bölcs' },
  { id: 'kit', nev: v => `+${v} Kitartás`, v: (l, r) => r.int(2, 5) + Math.floor(l / 6), slots: null, pre: 'Szívós' },
  { id: 'skill', nev: v => `+${v} minden képesség szintjéhez`, v: (l, r) => 1, slots: ['fegyver', 'nyak'], pre: 'Mesteri', minL: 12, rare: true },
  { id: 'resmax', nev: v => `+${v} maximális erőforrás`, v: (l, r) => r.int(8, 15) + Math.floor(l / 3), slots: ['artefakt', 'nyak', 'fej'], pre: 'Mély' },
  { id: 'resgen', nev: v => `+${v}% erőforrás-töltődés`, v: (l, r) => r.int(10, 25), slots: ['artefakt', 'gyuru', 'nyak'], pre: 'Áradó' },
  { id: 'sta', nev: v => `+${v} állóképesség`, v: (l, r) => r.int(8, 18), slots: ['lab', 'test', 'artefakt'], pre: 'Kitartó' },
  { id: 'allo', nev: v => `+${v} Állóképesség`, v: (l, r) => r.int(2, 5) + Math.floor(l / 6), slots: null, pre: 'Edzett' },
  { id: 'potion', nev: v => `+${v}% italhatás`, v: (l, r) => r.int(10, 25), slots: ['test', 'nyak'], pre: 'Szomjas' },
];

// ---------------- Ereklyék (egyedi tárgyak a multiverzumból) ----------------
// fx: különleges hatás azonosító, amit a harcrendszer figyel
const RELICS = [
  { id: 'papucs', nev: 'Nagyi papucsa', base: 'csizma', minL: 3, fx: 'papucs', txt: 'Találatkor 15% eséllyel papucs repül a támadóra: kábít 1 mp-ig. „Nem öl, csak nevel.”', aff: [['ms', 12], ['hp', 1.3]] },
  { id: 'croptop', nev: 'Kurta rózsaszín crop topja', base: 'vert', minL: 6, fx: 'croptop', txt: 'Minden 10. találatod böfi-lökéshullámot ereszt (fizikai, hátralök). A hangerő a szinteddel nő.', aff: [['hp', 1.5], ['kit', 1], ['thorns', 1]] },
  { id: 'bika', nev: 'Bika-doboz amulett', base: 'amulett', minL: 4, fx: 'bika', txt: 'Ölés után 2 mp-re +25% támadási sebesség (halmozódik 3-ig).', aff: [['aspd', 1], ['mregen', 1]] },
  { id: 'leltarkonyv', nev: 'A Leltárkönyv', base: 'amulett', minL: 5, fx: 'leltar', txt: '+40% arany és +25% jobb zsákmány. Minden hiányzó tétel egyszer előkerül.', aff: [['gf', 1.6], ['mf', 1.4]] },
  { id: 'mezkorona', nev: 'Méhkirálynő koronája', base: 'sisak', minL: 9, fx: 'mehraj', txt: 'Ölésnél 30% eséllyel méh születik, aki 10 mp-ig veled harcol.', aff: [['regen', 1.4], ['akarat', 1]] },
  { id: 'virgonc', nev: 'Virágporos kesztyű', base: 'kesztyu', minL: 8, fx: 'viragpor', txt: 'A találataid 20% eséllyel lassítják az ellenfelet (méz). +20% sebzés lassított célpontra.', aff: [['dmgp', 1], ['aspd', 1]] },
  { id: 'szivkard', nev: 'Az Égtorony Szíve', base: 'kard', minL: 14, fx: 'sziv', txt: 'Közelharci találatnál a sebzés 4%-át visszakapod életerőként. Szélroham: minden 4. csapás hullámot vet.', aff: [['dmgp', 1.5], ['ls', 1], ['critd', 1]] },
  { id: 'felhocsizma', nev: 'Felhőjáró csizma', base: 'csizma', minL: 12, fx: 'felho', txt: 'A kitérés újratöltése felére csökken, és kitérés után 1 mp-ig sebezhetetlen vagy.', aff: [['ms', 1.4], ['ugy', 1]] },
  { id: 'furofej', nev: 'Gyémánt fúrófej', base: 'lancfuresz', minL: 17, fx: 'furo', txt: 'A támadásaid figyelmen kívül hagyják a páncélt, és 25% eséllyel mélyre hatoló sebzést (×2) okoznak.', aff: [['dmgp', 1.4], ['aspd', 1.2]] },
  { id: 'magkristaly', nev: 'Vasmag-kristály', base: 'gyuru', minL: 18, fx: 'mag', txt: 'Tűzállóság +30%. Életerőd 30% alatt 5 mp-es magmapajzs (egyszer 30 mp-enként).', aff: [['res_tuz', 1.5], ['hp', 1.2]] },
  { id: 'morsebillentyu', nev: 'Morze-billentyű', base: 'pisztoly', minL: 21, fx: 'morse', txt: 'Lövéseid ritmusa: rövid-rövid-rövid, hosszú-hosszú-hosszú. Minden 6. lövés kábító villám (S.O.S.).', aff: [['add_villam', 1.5], ['crit', 1]] },
  { id: 'fejhallgato', nev: '1957-es fejhallgató', base: 'sisak', minL: 22, fx: 'radio', txt: 'Látod a láthatatlan ellenfeleket. −15% képesség-újratöltés.', aff: [['cdr', 2], ['mp', 1.2]] },
  { id: 'szonda', nev: 'A szökött szonda', base: 'raketaveto', minL: 26, fx: 'szonda', txt: 'A rakéták önirányítók, és minden robbanás kis szondát indít, ami még egyszer becsapódik.', aff: [['dmgp', 1.4], ['add_tuz', 1.2]] },
  { id: 'hegeszto', nev: 'Főkonstruktőr szemüvege', base: 'sisak', minL: 27, fx: 'fokonst', txt: '+1 drón és +1 lövegtorony egyszerre. A gépeid +30% sebzést okoznak.', aff: [['skill', 1], ['cdr', 1]] },
  { id: 'fotongyuru', nev: 'Fotongyűrű', base: 'gyuru', minL: 31, fx: 'foton', txt: 'A lövedékeid a fotongyűrű mentén egyszer visszakanyarodnak a legközelebbi ellenfélre.', aff: [['crit', 1.3], ['critd', 1.3]] },
  { id: 'tesszerakt', nev: 'Tesszerakt-bot', base: 'bot', minL: 32, fx: 'tesszerakt', txt: 'Varázslataid 20% eséllyel kétszer sülnek el – egyszer most, egyszer 1 mp múlva, a múltból.', aff: [['dmgp', 1.6], ['skill', 1], ['mregen', 1.2]] },
  { id: 'penrose', nev: 'Penrose-kesztyű', base: 'kesztyu', minL: 33, fx: 'penrose', txt: 'Minden ölés energiát bányász a semmiből: +4 energia, és 10% eséllyel az összes képesség újratöltése 1 mp-cel csökken.', aff: [['dmgp', 1.2], ['mregen', 1.5], ['cdr', 1]] },
  { id: 'holdsisak', nev: 'Holdra szállt sisak', base: 'sisak', minL: 28, fx: 'hold', txt: 'Kisebb gravitáció: +15% mozgási sebesség, a kitérés kétszer olyan messzire visz.', aff: [['hp', 1.4], ['res_ter', 1.5]] },
];

// ---------------- anyagok, italok ----------------
const MATS = {
  szilank: { nev: 'Kapuszilánk', c: '#b28cff', desc: 'A szétszedett tárgyak lelke. A kovács ebből erősít.' },
  mez: { nev: 'Csillagméz', c: '#ffc23a', desc: 'Mézország legjava. Nagyi italaihoz kell.' },
  felho: { nev: 'Felhőkő', c: '#dfefff', desc: 'Az Égtorony könnyű köve.' },
  magma: { nev: 'Magmaüveg', c: '#ff6a2a', desc: 'A Mélység forró kincse.' },
  jel: { nev: 'Elfogott jel', c: '#7af0c8', desc: 'Egy adás darabja, 1957-ből.' },
  uzemanyag: { nev: 'Rakéta-üzemanyag', c: '#ff9b5a', desc: 'A Lőtérről. Óvatosan.' },
  egzotikus: { nev: 'Egzotikus anyag', c: '#d58cff', desc: 'Negatív energiasűrűség. Az Alcubierre-hajtómű is ezt eszi.' },
  raklap: { nev: 'Raklapdeszka', c: '#c69a62', desc: 'A Végtelen Raktár építőköve.' },
  vas: { nev: 'Vasérc', c: '#9aa3ad', desc: 'Fegyverhez, páncélhoz. Ércérből bányászható.' },
  fa: { nev: 'Keményfa', c: '#a0703a', desc: 'Nyelek, íjak, bot. Fakupacból, raklapból.' },
  bor: { nev: 'Cserzett bőr', c: '#b07850', desc: 'Ruhához, kesztyűhöz. Állatszerű lényekből.' },
  vaszon: { nev: 'Vászon', c: '#e0d6c0', desc: 'Ruházathoz, kötéshez. Bálákból.' },
  gyogyfu: { nev: 'Gyógyfű', c: '#7fd06a', desc: 'Nagyi minden italához kell.' },
  kristaly: { nev: 'Nyers kristály', c: '#9fe8ff', desc: 'Ékszerhez, artefaktumhoz, manaitalhoz.' },
};
// Gyűjtőhelyek világonként
const NODES = {
  vas: { nev: 'Ércér', ikon: '⛏', c: '#9aa3ad' }, fa: { nev: 'Fakupac', ikon: '🪵', c: '#a0703a' }, gyogyfu: { nev: 'Gyógyfű', ikon: '🌿', c: '#7fd06a' },
  kristaly: { nev: 'Kristálytelér', ikon: '💎', c: '#9fe8ff' }, vaszon: { nev: 'Vászonbála', ikon: '🧶', c: '#e0d6c0' },
};
const REGION_NODES = { raktar: ['fa', 'vaszon', 'vas'], mez: ['gyogyfu', 'fa', 'gyogyfu'], egtorony: ['vas', 'gyogyfu', 'kristaly'], melyseg: ['vas', 'kristaly', 'vas'], jeltoro: ['vas', 'kristaly', 'vaszon'], loter: ['vas', 'vaszon', 'fa'], eh: ['kristaly', 'kristaly', 'gyogyfu'], hasadek: ['vas', 'kristaly', 'gyogyfu', 'fa'] };
// Varázsitalok (Nagyi főzi)
const ELIX = {
  ero: { nev: 'Bivalyerő-elixír', ikon: '🧪', c: '#ff6a4a', key: '6', desc: '+35% sebzés 60 mp-ig.', t: 60, mods: { dmgp: 35 }, recept: { gyogyfu: 2, mez: 1 }, ar: 30 },
  vasbor: { nev: 'Vasbőr-főzet', ikon: '🧪', c: '#c0c8d0', key: '7', desc: '+60% páncél, +20% minden állóság 60 mp-ig.', t: 60, mods: { armp: 60, resall: 20 }, recept: { gyogyfu: 2, vas: 1 }, ar: 30 },
  forras: { nev: 'Forrásital', ikon: '🧪', c: '#6fa8ff', key: '8', desc: 'Azonnal 70% erőforrást (düh/mana/belső idő/áram) tölt, és 20 mp-re +50% töltődés.', t: 20, mods: { resgen: 50 }, res: 0.7, recept: { gyogyfu: 2, kristaly: 1 }, ar: 35 },
  kitartas: { nev: 'Szélanyó teája', ikon: '🧪', c: '#9fe07a', key: '9', desc: '30 mp-ig nem fogy az állóképesség, +15% mozgási sebesség.', t: 30, mods: { msp: 15, staInf: 1 }, recept: { gyogyfu: 1, fa: 1, mez: 1 }, ar: 25 },
};
