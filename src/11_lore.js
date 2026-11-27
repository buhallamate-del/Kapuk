// ============================================================
//  LORE: NPC-k, küldetések, multiverzum-napló, mentés
// ============================================================

// ---------------- Multiverzum (közös napló a többi játékkal) ----------------
const UNIV_KEY = 'univerzum-naplo';
const Univ = {
  get() { try { return JSON.parse(localStorage.getItem(UNIV_KEY)) || {}; } catch (_) { return {}; } },
  has(k) { return !!this.get()[k]; },
  set(k) { const n = this.get(); if (n[k]) return false; n[k] = Date.now(); try { localStorage.setItem(UNIV_KEY, JSON.stringify(n)); } catch (_) { } return true; },
  week(d = new Date()) { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), n = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - n); const e = t.getUTCFullYear(); return e + '-W' + String(Math.ceil(((t - Date.UTC(e, 0, 1)) / 864e5 + 1) / 7)).padStart(2, '0'); },
  WORLDS: [
    ['eh', 'Eseményhorizont', '../Esemenyhorizont/?from=kapuk', 'Relativisztikus pilótagyakorlat egy fekete lyuk körül'],
    ['lo', 'Kísérleti Lőtér', '../Kiserleti_robbantas/', 'Rakétaprogram 1957-től'],
    ['r3', 'Raktár 3D', '../raktar-3d/', 'A bejárható raktár, 976 tárhellyel'],
    ['eg', 'Égtorony', '../Egtorony/', '30 emelet a felhők fölé'],
    ['mo', 'Mézország', '../Mezorszag/', 'Méhészkedés vidékről vidékre'],
    ['me', 'Mélység', '../Melyseg/', 'Fúrókapszulával a Föld közepéig'],
    ['jt', 'Jeltörő', '../Jel-toro/', 'Lehallgatóállomás 1957-ből'],
    ['tt', 'Toldaléktorony', '../Toldalektorony/', 'A magyar nyelv gépezete'],
    ['ku', 'Kurta szimulátor', '../Kurta-SIM-/', 'Minden böfi kétszer hangosabb'],
  ],
  GIFTS: {
    'eh:jart': ['Eseményhorizont', '+60 arany a pilótától', S => { S.gold += 60; }],
    'eh:horizont': ['Eseményhorizont', 'Átléptél egyszer a horizonton: +6 kapuszilánk', S => { S.mats.szilank = (S.mats.szilank || 0) + 6; }],
    'eh:novikov': ['Eseményhorizont', 'Bezártad az időhurkot: +1 képességpont', S => { S.skillPts++; }],
    'lo:esc': ['Kísérleti Lőtér', 'A szonda jele: +3 rakéta-üzemanyag, +120 arany', S => { S.mats.uzemanyag = (S.mats.uzemanyag || 0) + 3; S.gold += 120; }],
    'lo:moon': ['Kísérleti Lőtér', 'Holdra szálltál: +5 tulajdonságpont', S => { S.attrPts += 5; }],
    'r3:jart': ['Raktár 3D', 'A raktári automata kávéi: +4 kávé', S => { S.food.kave = (S.food.kave || 0) + 4; }],
    'r3:feketelyuk': ['Raktár 3D', 'A pohármosó fekete lyuka: +1 képességpont', S => { S.skillPts++; }],
    'eg:jart': ['Égtorony', 'Bodor ütőzsákja: +3 Erő-pont', S => { S.attrPts += 3; }],
    'eg:sziv': ['Égtorony', 'Megrepesztetted a Szívet: +5 tulajdonságpont', S => { S.attrPts += 5; }],
    'mo:jart': ['Mézország', 'Egy csupor akácméz: +3 mézescsupor', S => { S.food.mezescsupor = (S.food.mezescsupor || 0) + 3; }],
    'mo:csillag': ['Mézország', 'A csillagméhek ajándéka: jobb gyógyitalok', S => { S.potLvl++; }],
    'me:jart': ['Mélység', 'Fúróminta: +4 vasérc', S => { S.mats.vas = (S.mats.vas || 0) + 4; }],
    'me:kozep': ['Mélység', 'A Föld közepének fénye: +1 képességpont', S => { S.skillPts++; }],
    'jt:jart': ['Jeltörő', 'Egy doboz konzerv az állomásról', S => { S.food.konzerv = (S.food.konzerv || 0) + 3; }],
    'jt:jel': ['Jeltörő', 'NE ADD FEL MEGÉRI: +1 képességpont', S => { S.skillPts++; }],
    'tt:jart': ['Toldaléktorony', 'Tő, szám, gazda, rag: +3 Akarat-pont', S => { S.attrPts += 3; }],
    'tt:mind': ['Toldaléktorony', 'Mind a hat torony: +5 tulajdonságpont', S => { S.attrPts += 5; }],
    'ku:jart': ['Kurta szimulátor', 'Kurta hagyott neked két Bikát', S => { S.food.bika = (S.food.bika || 0) + 2; }],
    'ku:lokeshullam': ['Kurta szimulátor', '200 dB fölött: megkaptad a Kurta-böfit (V)', S => { if (!S.gates.includes('boefi')) S.gates.push('boefi'); if (!S.gate) S.gate = 'boefi'; }],
    'ku:fold': ['Kurta szimulátor', 'Szétböfögted a Földet: +1 Tiltott pecsét', S => { S.pecset++; }],
  },
  checkGifts() {
    const S = G.S, n = this.get(), got = [];
    for (const k in this.GIFTS) if (n[k] && !S.gifts[k]) { S.gifts[k] = Date.now(); const g = this.GIFTS[k]; g[2](S); got.push(g); }
    if (got.length) { recalc(G.P); setTimeout(() => got.forEach((g, i) => setTimeout(() => UI.toast(`🎁 Ajándék a(z) ${g[0]} világából: ${g[1]}`, '#d27bff', 6), i * 1200)), 1500); Forbidden.check(); }
  },
  // ----- heti verseny (közös multiverzum-bajnokság csatorna) -----
  BROKER: 'wss://broker.hivemq.com:8884/mqtt', CS: 'multiverzum-bajnoksag-r4w8', GAME: 'kp',
  client: null, board: {}, news: [], online: {}, status: 'kapcsolat nélkül',
  myId() { let id = localStorage.getItem('multiverzum-id'); if (!id) { id = Math.random().toString(36).slice(2, 10); localStorage.setItem('multiverzum-id', id); } return id; },
  myName() { return (localStorage.getItem('multiverzum-nev') || (G.S && G.S.nev) || 'Vándor').slice(0, 24); },
  async connect() {
    if (this.client || this.connecting) return; this.connecting = true;
    try {
      const mod = await import('./vendor/mqtt/mqtt.esm.js');
      const mqtt = mod.default && mod.default.connect ? mod.default : (mod.default && mod.default.default) || mod;
      const id = this.myId();
      const k = mqtt.connect(this.BROKER, { clientId: 'kp_' + id + '_' + Math.random().toString(36).slice(2, 6), clean: true, keepalive: 30, reconnectPeriod: 5000, connectTimeout: 10000, will: { topic: `${this.CS}/jelen/${this.GAME}/${id}`, payload: '', retain: true, qos: 0 } });
      this.client = k; this.status = 'kapcsolódás…';
      k.on('connect', () => {
        this.status = 'élő'; const w = this.week();
        k.subscribe(`${this.CS}/${this.GAME}/${w}/+`); k.subscribe(`${this.CS}/${this.GAME}/e`); k.subscribe(`${this.CS}/jelen/${this.GAME}/+`);
        k.publish(`${this.CS}/jelen/${this.GAME}/${id}`, JSON.stringify({ nev: this.myName() }), { retain: true, qos: 0 });
        UI.dirty = true;
      });
      k.on('error', () => { this.status = /github\.io$/.test(location.hostname) ? 'hiba' : 'csak a github.io-n érhető el'; });
      k.on('close', () => { if (this.status === 'élő') this.status = 'újrakapcsolódás…'; });
      k.on('message', (topic, buf) => {
        const r = topic.slice(this.CS.length + 1).split('/'); let o = null; try { const s = buf.toString(); o = s ? JSON.parse(s) : null; } catch (e) { return; }
        if (r[0] === 'jelen') { if (o) this.online[r[2]] = o.nev; else delete this.online[r[2]]; }
        else if (r[1] === 'e') { if (o) { this.news.unshift(o); this.news = this.news.slice(0, 12); if (o.id !== id) UI.toast(`📡 ${o.nev}: ${o.t}`, '#4dffb0', 4); } }
        else if (o) this.board[r[2]] = o;
        UI.dirty = true;
      });
    } catch (e) { this.status = 'nem elérhető (offline)'; }
    this.connecting = false;
  },
  publishScore(fl) {
    const S = G.S; const w = this.week(); S.prog.weekly[w] = Math.max(S.prog.weekly[w] || 0, fl);
    if (!this.client || this.status !== 'élő') return; const id = this.myId();
    this.client.publish(`${this.CS}/${this.GAME}/${w}/${id}`, JSON.stringify({ id, nev: this.myName(), v: { fl: S.prog.weekly[w], l: S.lvl, c: S.cls }, ts: Date.now() }), { retain: true, qos: 0 });
  },
  say(t) { if (!this.client || this.status !== 'élő') return; const id = this.myId(); this.client.publish(`${this.CS}/${this.GAME}/e`, JSON.stringify({ id, nev: this.myName(), t: t.slice(0, 140) }), { qos: 0 }); },
  weeklyProgress(fl) { this.publishScore(fl); if (fl % 5 === 0) this.say(`elérte a Heti Hasadék ${fl}. mélységét (${CLASSES[G.S.cls].nev}, ${G.S.lvl}. szint)`); },
};

// ---------------- Tiltott képességek feloldása ----------------
const Forbidden = {
  check() {
    const S = G.S; if (!S) return;
    for (const id in FORBIDDEN) { const F = FORBIDDEN[id]; if ((F.cls === S.cls || F.cls === '*') && S.pecset >= F.pecset && !S.forbidden.includes(id)) { S.forbidden.push(id); UI.toast(`☠ TILTOTT KÉPESSÉG: ${F.ikon} ${F.nev} – tedd be egy helyre a Képességek lapon (K)!`, '#ff3355', 7); Audio2.play('bossroar'); } }
    if (S.pecset >= OSFORMA.pecset && !S.forbidden.includes('osforma')) { S.forbidden.push('osforma'); recalc(G.P); UI.toast('☠ ŐSFORMA: a tested többé nem egészen a tiéd. (+60% sebzés, +35% életerő)', '#ff3355', 8); }
  }
};

// ---------------- Mentés ----------------
const Save = {
  key: i => 'kapuk-mentes-' + i,
  write(i, S) { try { localStorage.setItem(this.key(i), JSON.stringify(S)); } catch (e) { } },
  read(i) { try { const s = JSON.parse(localStorage.getItem(this.key(i))); if (s) this.migrate(s); return s; } catch (e) { return null; } },
  del(i) { localStorage.removeItem(this.key(i)); },
  migrate(S) {
    S.attrs.allo = S.attrs.allo || 0; S.elix = S.elix || {}; S.surv = S.surv || { kaja: 80, ital: 80, ebren: 80 }; S.forbidden = S.forbidden || []; S.pecset = S.pecset || 0;
    let mx = 0; const scan = it => { if (it && it.uid > mx) mx = it.uid; }; Object.values(S.eq).forEach(scan); S.inv.forEach(scan); S.stash.forEach(scan); ITEM_UID = Math.max(ITEM_UID, mx + 1);
  },
};

// ---------------- Küldetéstárgyak ----------------
const QITEMS = {
  tetel: { nev: 'Hiányzó tétel', ikon: '📦', c: '#f2c230' },
  cetli: { nev: 'Bodor cetlije', ikon: '📜', c: '#e8dcc0' },
  bikadoboz: { nev: 'Bontatlan Bika', ikon: '🐂', c: '#ff5577' },
  gyemant: { nev: 'Köpenygyémánt', ikon: '💎', c: '#9fe8ff' },
  toredek: { nev: 'Adástöredék', ikon: '📻', c: '#4dffb0' },
  alkatresz: { nev: 'Holdkomp-alkatrész', ikon: '🔩', c: '#ffcc33' },
  fog: { nev: 'Rorek vasfoga', ikon: '🦷', c: '#c0c8d0' },
};
const TOREDEK_SZO = { raktar: 'ADD', mez: 'MEG', egtorony: 'FEL', melyseg: 'ÉRI', loter: 'NE', eh: 'TE MAGAD' };

// ---------------- KÜLDETÉSEK ----------------
const QUESTS = [
  // fő szál
  { id: 'm1', main: 1, giver: 'leltaros', nev: 'A 976. tárhely', desc: 'Valami nincs meg a Végtelen Raktárban. Menj le a Kapun át, és találd meg a Leltárhiányt a 4. szinten.', goal: { t: 'boss', id: 'leltarhiany' }, rw: { xp: 500, gold: 150, skill: 1 } },
  { id: 'm2', main: 1, giver: 'mehesz', req: 'm1', nev: 'A Kaptár szíve', desc: 'Mézországban új királynő uralkodik, a darazsak megbolondultak. Vess véget az uralmának.', goal: { t: 'boss', id: 'kiralyno' }, rw: { xp: 1600, gold: 300, skill: 1 } },
  { id: 'm3', main: 1, giver: 'bodor', req: 'm2', nev: 'Ne az Urat üsd', desc: 'Bodor szerint az Égtorony csúcsán egy fiú áll, láncra verve. „Ne az Urat üsd, a láncot nézd.” Törd szét a láncokat, és győzd le a Szívet.', goal: { t: 'boss', id: 'sziv' }, rw: { xp: 4000, gold: 600, skill: 1 } },
  { id: 'm4', main: 1, giver: 'furomester', req: 'm3', nev: '6371 kilométer', desc: 'Kola, Moho, Gutenberg-határ – a Föld közepén valami őrzi a magot. Fúrj le hozzá.', goal: { t: 'boss', id: 'magorzo' }, rw: { xp: 8000, gold: 1000, skill: 1 } },
  { id: 'm5', main: 1, giver: 'kezelo', req: 'm4', nev: '29999 kHz', desc: 'A Jeltörő-állomás mélyén a Számállomás nem hallgat el. Az antennái védik – azokat döntsd le előbb.', goal: { t: 'boss', id: 'szamallomas' }, rw: { xp: 14000, gold: 1600, skill: 1 } },
  { id: 'm6', main: 1, giver: 'fokonstruktor', req: 'm5', nev: 'A korszak építésze', desc: 'A Lőtér szerelőcsarnokában az N-1 Szörnyeteg ébred. Sosem jutott el a Holdra – most téged akar.', goal: { t: 'boss', id: 'n1' }, rw: { xp: 22000, gold: 2500, skill: 1 } },
  { id: 'm7', main: 1, giver: 'pilota', req: 'm6', nev: 'Te magad', desc: 'Az Eseményhorizont mélyén, a tesszeraktban vár valaki, aki pontosan úgy harcol, mint te.', goal: { t: 'boss', id: 'onmagad' }, rw: { xp: 32000, gold: 3500, skill: 2 } },
  { id: 'm8', main: 1, giver: 'pilota', req: 'm7', nev: 'Novikov', desc: 'A Szingularitás minden világot elnyel. Le kell győznöd, és vissza kell küldened az üzenetet a múltba – különben paradoxon.', goal: { t: 'boss', id: 'szingularitas' }, rw: { xp: 50000, gold: 8000, skill: 3, attr: 10 } },
  // mellékszálak
  { id: 's_tul', giver: 'nagyi', nev: 'Egyél, fiam!', desc: 'Nagyi szerint senki sem harcol üres hassal. Egyél vagy igyál meg ötször valamit (H / G).', goal: { t: 'eat', n: 5 }, rw: { xp: 120, food: { satorlap: 2, langos: 2 } } },
  { id: 's_gyogy', giver: 'nagyi', nev: 'Gyógyfű a pogácsa mellé', desc: 'Gyűjts 8 gyógyfüvet a kazamatákban (E a gyógyfű mellett). Nagyi jobb italt főz belőle.', goal: { t: 'gather', id: 'gyogyfu', n: 8 }, rw: { xp: 400, potLvl: 1, elix: { ero: 2, forras: 2 } } },
  { id: 's_csillagmez', giver: 'nagyi', req: 'm2', nev: 'Csillagméz', desc: 'Hozz 6 csillagmézet Mézországból. „A Tejút is csak egy hosszú, virágos rét.”', goal: { t: 'mat', id: 'mez', n: 6, take: true }, rw: { xp: 2000, potLvl: 1, elix: { vasbor: 3, kitartas: 3 } } },
  { id: 's_craft', giver: 'fokonstruktor', nev: 'Első mestermunka', desc: 'Készíts egy tárgyat a kovácsműhelyben. Gyűjts érchez, fához, bőrhöz – és ne felejtsd: minden világ anyaga erősebb.', goal: { t: 'craft', n: 1 }, rw: { xp: 300, mats: { vas: 5, fa: 5, bor: 3 } } },
  { id: 's_tetel', giver: 'leltaros', nev: 'Hiányzó tételek', desc: 'Öt tétel eltűnt a rendszerből. A Végtelen Raktár polcai között vannak, valahol az 1–3. szinten.', goal: { t: 'collect', id: 'tetel', n: 5, where: { raktar: [1, 2, 3] }, per: 2 }, rw: { xp: 600, gold: 250, item: { rar: 2, base: 'amulett' } } },
  { id: 's_liderc', giver: 'leltaros', nev: 'A pohármosó lidérce', desc: 'Éjjel a pohármosóból kiszabadul a lidérc. Most a Végtelen Raktár 2. szintjén kóborol. Kapd el.', goal: { t: 'named', id: 'lidérc_kiraly', where: { raktar: [2] } }, rw: { xp: 700, gold: 200, relic: 'papucs' } },
  { id: 's_bika', giver: 'kurta', nev: 'Bika-utánpótlás', desc: 'Kurtának elfogyott a Bika. Az elit szörnyeknél néha akad bontatlan doboz. Hozz neki hármat.', goal: { t: 'collect', id: 'bikadoboz', n: 3, eliteDrop: 0.35 }, rw: { xp: 800, gate: 'boefi', food: { bika: 3, kola: 3 } } },
  { id: 's_boefi', giver: 'kurta', req: 's_bika', nev: 'Minden böfi kétszer hangosabb', desc: 'Kurta szerint 200 decibel fölött a böfi már lökéshullám. Böfögj 25-öt a Kurta-böfivel (V).', goal: { t: 'gate', id: 'boefi', n: 25 }, rw: { xp: 3000, relic: 'croptop' } },
  { id: 's_darazs', giver: 'mehesz', req: 'm1', nev: 'Darázsirtás', desc: 'Egy erős család nyáron 40–60 ezer méhből áll. A darazsakból elég negyven is. Irts ki 40 megbolondult darazsat.', goal: { t: 'kill', id: 'darazs', n: 40 }, rw: { xp: 1500, gold: 400, mats: { mez: 4 } } },
  { id: 's_kaptar', giver: 'mehesz', req: 'm1', nev: 'Vadkaptárak', desc: 'Pusztíts el 6 vadkaptárat Mézországban, mielőtt a raj tovább terjed.', goal: { t: 'hive', n: 6 }, rw: { xp: 1400, gold: 300, relic: 'virgonc' } },
  { id: 's_cetli', giver: 'bodor', req: 'm2', nev: 'Bodor cetlije', desc: 'Három éve indultam fel, és egy cetlit hagytam a 2. emeleten. Hozd vissza – kíváncsi vagyok, mit gondoltam akkor.', goal: { t: 'collect', id: 'cetli', n: 1, where: { egtorony: [2] }, per: 1 }, rw: { xp: 2500, skill: 1 } },
  { id: 's_szemira', giver: 'bodor', req: 'm2', nev: 'Hollókirálynő', desc: 'Szemira hollói mindent látnak. A királynőjük az Égtorony 2. szintjén fészkel.', goal: { t: 'named', id: 'szemira', where: { egtorony: [2] } }, rw: { xp: 3000, gold: 600, item: { rar: 3 } } },
  { id: 's_rorek', giver: 'kende', req: 'm2', nev: 'Vasfogú Rorek', desc: 'Kende szerint Rorek a 3. emeleten edzi a tanítványait. „Hozd el a vasfogát, ha mered.”', goal: { t: 'named', id: 'rorek', where: { egtorony: [3] } }, rw: { xp: 3500, gold: 700, relic: 'felhocsizma' } },
  { id: 's_kende', giver: 'kende', req: 's_rorek', nev: 'Vörös Kende kihívása', desc: '„Te vagy az, akiről beszélnek? Nevetséges.” Kende az Égtorony 3. szintjén vár rád.', goal: { t: 'named', id: 'kende', where: { egtorony: [3] } }, rw: { xp: 5000, gold: 1000, attr: 5 } },
  { id: 's_osok', giver: 'bodor', req: 'm3', nev: 'Az Ősök', desc: 'Minden világban kóborol egy lény, amit nem nekünk teremtettek. Ha egyet legyőzöl, megkapod az első Tiltott pecsétet.', goal: { t: 'ancient', n: 1 }, rw: { xp: 10000, gold: 2000, skill: 2 } },
  { id: 's_kola', giver: 'furomester', req: 'm3', nev: 'A Kola-fúrás mestere', desc: '12 262 méter. 180 °C-on a kőzet képlékeny lett. A Kola-fúró mestere az 1. szinten őrzi a rekordját.', goal: { t: 'named', id: 'kolamester', where: { melyseg: [1] } }, rw: { xp: 5000, gold: 1000, relic: 'furofej' } },
  { id: 's_gyemant', giver: 'furomester', req: 'm3', nev: 'Gyémánt a köpenyből', desc: 'A legmélyebb gyémánt a felső köpenyben terem. A kristályteknősök páncéljában akad. Hozz hármat.', goal: { t: 'collect', id: 'gyemant', n: 3, enemyDrop: { kristalyteknos: 0.4 } }, rw: { xp: 6000, gold: 1200, item: { rar: 3, base: 'gyuru' } } },
  { id: 's_toredek', giver: 'kezelo', req: 'm4', nev: 'Hat töredék', desc: 'Hat világ hat adástöredéke. Mindegyik világ 2. szintjén van egy. Ha összerakod, összeáll az üzenet, ami minden világon átfut.', goal: { t: 'collect', id: 'toredek', n: 6, where: { raktar: [2], mez: [2], egtorony: [2], melyseg: [2], loter: [2], eh: [2] }, per: 1 }, rw: { xp: 20000, gold: 3000, relic: 'morsebillentyu', skill: 2 } },
  { id: 's_bemondo', giver: 'kezelo', req: 'm4', nev: 'Az 1957-es Bemondó', desc: '„Öt-egy. Egy-egy. Nulla-egy.” A Jeltörő-állomás 2. szintjén kísért.', goal: { t: 'named', id: 'lidérc2', where: { jeltoro: [2] } }, rw: { xp: 9000, gold: 1500, relic: 'fejhallgato' } },
  { id: 's_holdkomp', giver: 'fokonstruktor', req: 'm5', nev: 'Holdkomp-alkatrészek', desc: 'A holdkomp 15 tonna. A Lőtér csarnokaiban négy alkatrész hiányzik hozzá.', goal: { t: 'collect', id: 'alkatresz', n: 4, where: { loter: [1, 2, 3] }, per: 2 }, rw: { xp: 14000, gold: 2500, relic: 'holdsisak' } },
  { id: 's_gep', giver: 'fokonstruktor', req: 'm5', nev: 'A megbolondult gép', desc: 'Az egyik szerelőrobotom azt hiszi, ő a Főkonstruktőr. A 3. csarnokban van.', goal: { t: 'named', id: 'fokonst', where: { loter: [3] } }, rw: { xp: 15000, gold: 2500, relic: 'hegeszto' } },
  // túlélő szál: messzire menni könnyű, visszajönni a művészet
  { id: 's_exped', giver: 'leltaros', req: 'm1', nev: 'Leltár a mélyből', desc: '„Ami lent van, az csak akkor van meg, ha fel is hozod. Különben az is hiány.” Menj le három szintet egyhuzamban, hazatérés nélkül – és érj vissza élve. Minden szinttel erősebbek odalent, de az útinaplód is vastagszik.', goal: { t: 'exped', n: 3 }, rw: { xp: 900, gold: 250, food: { satorlap: 1, konzerv: 2 } } },
  { id: 's_vacsora', giver: 'nagyi', req: 'm2', nev: 'Vacsorára itthon', desc: 'Nagyi szerint az a tapasztalat, amit hazahozol, nem az, amit lent hagysz. Hozz haza egyszerre legalább 2500 TP-t az útinaplódban. „És ne késs, kihűl a gulyás.”', goal: { t: 'bank', n: 2500 }, rw: { xp: 1500, elix: { ero: 2, vasbor: 2 }, food: { langos: 3 } } },
  { id: 's_kulacs', giver: 'furomester', req: 'm3', nev: 'Az utolsó kulacs', desc: '„Odalent a víz drágább az aranynál, és huszonöt fokkal melegebb kilométerenként.” Juss el a Mélység 4. szintjéig a Kaputól egyhuzamban, és gyere vissza. A boss is számít.', goal: { t: 'exped', n: 4, rid: 'melyseg' }, rw: { xp: 7000, gold: 1200, item: { rar: 3, base: 'csizma' } } },
  { id: 's_horizontrol', giver: 'pilota', req: 'm6', nev: 'Vissza a horizont alól', desc: 'Az Eseményhorizont mögül még senki sem hozott haza tízezer TP-nyi emléket. Az idő ott lassabban telik – a hazaút annál hosszabb.', goal: { t: 'bank', n: 10000 }, rw: { xp: 20000, skill: 1, food: { tubus: 3 } } },
  { id: 's_buborek', giver: 'pilota', req: 'm6', nev: 'Bébi-univerzumok', desc: 'Smolin, 1992: minden fekete lyuk mögött új világ születik. Találj meg hármat a W-tengely mentén (Z/X: W-eltolás, ±4).', goal: { t: 'buborek', n: 3 }, rw: { xp: 24000, gold: 4000, relic: 'fotongyuru' } },
];
const QUEST = Object.fromEntries(QUESTS.map(q => [q.id, q]));

const Quests = {
  st(id) { return G.S.quests[id]; },
  available(npc) { return QUESTS.filter(q => q.giver === npc && !this.st(q.id) && (!q.req || (this.st(q.req) && this.st(q.req).st === 'leadva'))); },
  active() { return QUESTS.filter(q => this.st(q.id) && this.st(q.id).st !== 'leadva'); },
  accept(id) { G.S.quests[id] = { st: 'aktiv', n: 0 }; const q = QUEST[id]; UI.toast(`Új küldetés: ${q.nev}`, '#ffd34d', 3); Audio2.play('ui'); this.recheck(); UI.dirty = true; },
  ensureStart() { if (!G.S.quests.m1) this.accept('m1'); },
  progress(q, n = 1) {
    const s = this.st(q.id); if (!s || s.st !== 'aktiv') return;
    s.n = Math.min(q.goal.n || 1, s.n + n);
    if (s.n >= (q.goal.n || 1)) { s.st = 'kesz'; UI.toast(`✔ Küldetés teljesítve: ${q.nev} – vidd vissza: ${NPCS[q.giver].nev}`, '#9fe07a', 5); Audio2.play('legend'); }
    else if (q.goal.n > 1) UI.toast(`${q.nev}: ${s.n}/${q.goal.n}`, '#e8dcc0', 1.5);
    UI.dirty = true;
  },
  recheck() { // a már meglévő állapotból azonnal teljesíthetők
    for (const q of this.active()) { const s = this.st(q.id); if (s.st !== 'aktiv') continue; if (q.goal.t === 'boss' && G.S.prog.bosses[q.goal.id]) this.progress(q); if (q.goal.t === 'ancient' && Object.keys(G.S.prog.ancients).length >= q.goal.n) this.progress(q, q.goal.n); if (q.goal.t === 'mat' && (G.S.mats[q.goal.id] || 0) >= q.goal.n) { s.n = q.goal.n; this.progress(q, 0); } }
  },
  on(ev, d) {
    if (!G.S) return;
    for (const q of this.active()) {
      const s = this.st(q.id); if (s.st !== 'aktiv') continue; const g = q.goal;
      if (ev === 'boss' && g.t === 'boss' && g.id === d) this.progress(q);
      else if (ev === 'kill' && g.t === 'kill' && d.type === g.id) this.progress(q);
      else if (ev === 'named' && g.t === 'named' && g.id === d) this.progress(q);
      else if (ev === 'eat' && g.t === 'eat') this.progress(q);
      else if (ev === 'gather' && g.t === 'gather' && d === g.id) this.progress(q);
      else if (ev === 'craft' && g.t === 'craft') this.progress(q);
      else if (ev === 'hive' && g.t === 'hive') this.progress(q);
      else if (ev === 'gate' && g.t === 'gate' && d === g.id) this.progress(q);
      else if (ev === 'buborek' && g.t === 'buborek') this.progress(q);
      else if (ev === 'hazaert' && g.t === 'exped' && d.n >= g.n && (!g.rid || d.rid === g.rid)) this.progress(q);
      else if (ev === 'hazaert' && g.t === 'bank' && d.bank >= g.n) this.progress(q);
      else if (ev === 'kill' && g.t === 'ancient' && d.ancient) this.progress(q);
      else if (ev === 'mat' && g.t === 'mat' && d === g.id && (G.S.mats[g.id] || 0) >= g.n) { s.n = g.n; this.progress(q, 0); }
    }
    if (ev === 'kill') Bounty.on('kill', d); if (ev === 'gather') Bounty.on('gather', d); if (ev === 'enter') Bounty.on('enter', d);
  },
  complete(id) {
    const q = QUEST[id], s = this.st(id), S = G.S; if (!s || s.st !== 'kesz') return;
    if (q.goal.t === 'mat' && q.goal.take) { if ((S.mats[q.goal.id] || 0) < q.goal.n) { UI.toast('Nincs nálad elég.', '#ff7a7a'); return; } S.mats[q.goal.id] -= q.goal.n; }
    s.st = 'leadva'; const r = q.rw;
    if (r.xp) G.gainXp(r.xp); if (r.gold) S.gold += r.gold; if (r.skill) S.skillPts += r.skill; if (r.attr) S.attrPts += r.attr; if (r.potLvl) S.potLvl += r.potLvl;
    if (r.food) for (const k in r.food) S.food[k] = (S.food[k] || 0) + r.food[k];
    if (r.elix) for (const k in r.elix) S.elix[k] = (S.elix[k] || 0) + r.elix[k];
    if (r.mats) for (const k in r.mats) S.mats[k] = (S.mats[k] || 0) + r.mats[k];
    if (r.gate && !S.gates.includes(r.gate)) { S.gates.push(r.gate); S.gate = S.gate || r.gate; UI.toast(`Új Kapukő-képesség: ${GATESKILLS[r.gate].nev} (V)`, '#d27bff', 5); }
    const give = it => { if (S.inv.length < INV_MAX) S.inv.push(it); else S.stash.push(it); UI.toast(`Jutalom: ${it.nev}`, RARITY[it.rar].c, 4); };
    if (r.item) give(genItem(Math.max(S.lvl, 3), RNG, { ...r.item, cls: S.cls, rar: r.item.rar }));
    if (r.relic) give(genItem(Math.max(S.lvl, RELICS.find(x => x.id === r.relic).minL), RNG, { relic: r.relic }));
    Audio2.play('level'); UI.toast(`Leadva: ${q.nev}${r.xp ? ` · +${fmt(r.xp)} TP` : ''}${r.gold ? ` · +${fmt(r.gold)} arany` : ''}${r.skill ? ` · +${r.skill} képességpont` : ''}`, '#ffd34d', 5);
    if (id === 's_toredek') UI.toredekReveal();
    recalc(G.P); G.autosave(); UI.dirty = true;
  },
  pickQuestItem(id) {
    const S = G.S, Q = QITEMS[id]; S.qi = S.qi || {}; S.qi[id] = (S.qi[id] || 0) + 1;
    UI.toast(`${Q.ikon} ${Q.nev}`, Q.c, 3);
    if (id === 'toredek' && G.map) { const w = TOREDEK_SZO[G.map.rid]; if (w) { S.flags['toredek_' + G.map.rid] = 1; UI.toast(`📻 A töredék egy szót ismétel: „${w}”`, '#4dffb0', 5); } }
    if (id === 'cetli') UI.toast('📜 „Ha engem nem várt meg, téged se várjon.” – Bodor', '#e8dcc0', 6);
    for (const q of this.active()) if (q.goal.t === 'collect' && q.goal.id === id) this.progress(q);
  },
  populateHook(m, R, rng) {
    const S = G.S; if (m.hasadek) return;
    for (const q of this.active()) {
      const s = this.st(q.id); if (s.st !== 'aktiv') continue; const g = q.goal;
      if (g.where && g.where[m.rid] && g.where[m.rid].includes(m.floor)) {
        if (g.t === 'collect') {
          if (g.id === 'toredek' && S.flags['toredek_' + m.rid]) continue;
          const left = g.n - s.n; const n = Math.min(left, g.per || 1);
          const rooms = m.rooms.filter(r => !r.start);
          for (let i = 0; i < n; i++) { const r = rng.pick(rooms); const p = roomSpot(m, r, rng, 2); G.pickups.push({ kind: 'quest', v: g.id, x: p.x, y: p.y, t: 1, vy: 0, z: 0, glow: true }); }
        } else if (g.t === 'named') {
          const rooms = m.rooms.filter(r => !r.start && !r.exit).sort((a, b) => b.w * b.h - a.w * a.h); const r = rooms[0] || m.rooms[0]; const p = roomSpot(m, r, rng, 2);
          const N = NAMED[g.id]; const e = G.spawnEnemy(N.base, p.x, p.y, m.lvl + 2, { named: g.id, mods: N.mods });
        }
      }
    }
  },
  lootHook(e, drop) {
    for (const q of this.active()) {
      const s = this.st(q.id); if (s.st !== 'aktiv') continue; const g = q.goal;
      if (g.t === 'collect' && g.eliteDrop && (e.elite || e.champion || e.named || e.boss) && RNG() < g.eliteDrop) drop('quest', g.id);
      if (g.t === 'collect' && g.enemyDrop && g.enemyDrop[e.type] && RNG() < g.enemyDrop[e.type]) drop('quest', g.id);
    }
    // bőr az állatszerű lényekből
    if (['beast', 'bug', 'worm', 'turtle', 'bee', 'bird'].includes(e.look.s) && RNG() < (e.elite ? 0.5 : 0.12)) drop('mat', 'bor');
    if (RNG() < (e.boss ? 1 : e.elite ? 0.25 : 0.03)) drop('mat', RNG.pick(['vas', 'fa', 'kristaly', 'vaszon', 'gyogyfu']));
  },
};

// ---------------- Hirdetőtábla (napi megbízások) ----------------
const Bounty = {
  ensure() {
    const S = G.S, day = new Date().toISOString().slice(0, 10);
    if (S.bountyDay === day && S.bounties.length) return;
    S.bountyDay = day; S.bounties = []; const rng = makeRng(hashStr(day + S.created));
    const regs = REGIONS.filter(r => S.prog.unlocked.includes(r.id));
    for (let i = 0; i < 4; i++) {
      const R = rng.pick(regs), k = rng.int(0, 3); let b;
      if (k === 0) { const t = rng.pick(R.enemies); b = { t: 'kill', id: t, rid: R.id, n: rng.int(20, 40), nev: `Irts ki ${'{n}'} ${ENEMIES[t].nev.toLowerCase()} lényt (${R.nev})` }; }
      else if (k === 1) b = { t: 'elite', rid: R.id, n: rng.int(4, 8), nev: `Győzz le ${'{n}'} elit vagy bajnok ellenfelet (${R.nev})` };
      else if (k === 2) { const mt = rng.pick(['vas', 'fa', 'gyogyfu', 'kristaly', 'vaszon']); b = { t: 'gather', id: mt, n: rng.int(5, 10), nev: `Gyűjts ${'{n}'} ${MATS[mt].nev.toLowerCase()} anyagot` }; }
      else b = { t: 'enter', rid: R.id, n: 1, floor: R.floors, nev: `Juss le: ${R.nev}, ${R.floors}. szint` };
      b.nev = b.nev.replace('{n}', b.n); b.p = 0; b.done = false; b.lvl = Math.max(S.lvl, R.lvl + 3);
      b.rw = { xp: Math.round(xpNeed(b.lvl) * 0.18), gold: Math.round(40 + b.lvl * 18), szilank: rng.int(2, 5) };
      S.bounties.push(b);
    }
  },
  on(ev, d) {
    const S = G.S; if (!S || !S.bounties) return;
    for (const b of S.bounties) {
      if (b.done || b.p >= b.n) continue;
      if (ev === 'kill' && b.t === 'kill' && d.type === b.id && G.map.rid === b.rid) b.p++;
      if (ev === 'kill' && b.t === 'elite' && (d.elite || d.champion || d.named) && G.map.rid === b.rid) b.p++;
      if (ev === 'gather' && b.t === 'gather' && d === b.id) b.p++;
      if (ev === 'enter' && b.t === 'enter' && d.rid === b.rid && d.floor >= b.floor) b.p = 1;
      if (b.p >= b.n) UI.toast(`📋 Megbízás kész: ${b.nev} – vedd fel a jutalmat a hirdetőtáblánál.`, '#9fe07a', 4);
    }
  },
  claim(i) { const S = G.S, b = S.bounties[i]; if (!b || b.done || b.p < b.n) return; b.done = true; G.gainXp(b.rw.xp); S.gold += b.rw.gold; S.mats.szilank = (S.mats.szilank || 0) + b.rw.szilank; Audio2.play('gold'); UI.toast(`Jutalom: +${fmt(b.rw.xp)} TP, +${b.rw.gold} arany, +${b.rw.szilank} kapuszilánk`, '#ffd34d', 4); UI.dirty = true; },
};
