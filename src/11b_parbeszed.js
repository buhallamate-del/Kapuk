// ============================================================
//  PÁRBESZÉDEK – három rétegben
//  1. felszín: a lakók egymást szapulják, visszatérő poénok
//  2. közép: reagálnak arra, amit TE csináltál (bossok, halálok, expedíciók)
//  3. mély: a hurok. A 976. tárhely, az üzenet, „Te magad” – apró nyomok, amelyek
//     a befejezés után mást jelentenek, mint előtte.
//  Helyőrzők: {nev} a hős neve, {halal} halálok, {oles} ölések, {mely} expedíciós rekord,
//  {kaszt} a kaszt neve, {szint} a szinted.
// ============================================================
const LoreC = {
  b: id => S => !!S.prog.bosses[id],
  nb: id => S => !S.prog.bosses[id],
  halal: n => S => S.stats.deaths >= n,
  mely: n => S => ((S.exp && S.exp.bestHome) || 0) >= n,
  os: n => S => Object.keys(S.prog.ancients || {}).length >= n,
  vege: S => !!S.prog.bosses.szingularitas,
  lvl: n => S => S.lvl >= n,
  hazas: S => !!S.spouse,
  otthon: S => !!(S.home && S.home.owned),
  proba: n => S => (S.stats.probak || 0) >= n,
  ciklus: S => S.prog.diffMax >= 2,
};
const C_ = LoreC;
// once: csak egyszer, első alkalommal mondja (hírként); egyébként bekerül a véletlen sorok közé
const NPC_PROG = {
  leltaros: [
    { w: S => S.stats.deaths === 0 && S.lvl >= 3, l: ['Még egyszer sem haltál meg. Ezt külön rovatba írom: „gyanús”.'] },
    { w: C_.halal(1), once: 1, l: ['Megjöttél. Az előbb elestél odalent, igaz? Nálam ez úgy szerepel, hogy „1 db hős, ideiglenesen nincs készleten”.'] },
    { w: C_.halal(10), l: ['{halal} halál. Tudod, hányszor írtam már le a neved a „kiadva” rovatba? Ugyanennyiszer a „visszavételezve” rovatba is. A mérleg nulla, szóval minden rendben.', 'Ha még egyszer meghalsz, kapsz egy saját polcot. Közel az ajtóhoz.'] },
    { w: C_.b('leltarhiany'), once: 1, l: ['A Leltárhiány… megszűnt. Huszonkét éve keresem. És most, hogy megvan, rájöttem, hogy a hiány volt a legérdekesebb tétel a raktárban. Na mindegy. Köszönöm. Azt hiszem.'] },
    { w: C_.b('leltarhiany'), l: ['A 976. tárhely azóta is üres. Csak a címkéje változott meg. Nem mondom meg, mi áll rajta. Majd meglátod.', 'Az automata kávé visszaállt 90 forintra. Gondolom, ez is a te érdemed.'] },
    { w: C_.mely(4), l: ['Négy szint mélyről hoztad haza a naplót? A tárhelyed büszke rád. Én is. De a tárhely jobban.'] },
    { w: C_.vege, once: 1, l: ['Elolvastam a 976. tárhely címkéjét. „{nev} – visszavételezve.” A te kézírásod. Pedig a címke régebbi, mint te.'] },
    { w: C_.vege, l: ['A hurok leltára szerint ez a te sokadik köröd. Nem mondom meg, hányadik. A szám úgysem segítene.'] },
  ],
  mehesz: [
    { w: S => S.gold > 2000, l: ['Látom, csörög a zsebed. A méhek is hallják. Ugye nem akarsz alkudni? Mert én akarok.'] },
    { w: C_.b('kiralyno'), once: 1, l: ['A Királynő elesett. A darazsak most nem tudják, kit kell utálniuk. Ideiglenesen engem utálnak. Kösz.'] },
    { w: C_.b('kiralyno'), l: ['A méhek azóta táncolnak. A tánc szerint valaki „nagyon messzire, és vissza” ment. Szerintem rólad szól. Vagy a nektárról. Ilyenkor a kettő ugyanaz.'] },
    { w: C_.halal(5), l: ['Egy méh egyszer csíp, és meghal. Te {halal}-szer haltál meg, és még mindig csípsz. Ez valami más rovarrend.'] },
    { w: C_.vege, l: ['A csillagméhek a fekete lyuk felé repülnek. Most már tudom, miért: ott van az, aki egyszer majd te leszel. A méhek mindig előbb tudják.'] },
  ],
  nagyi: [
    { w: S => S.surv.kaja < 40, l: ['Úristen, de sovány vagy! Ülj le. Nem, nem érdekel, hogy világot mentesz. Egy pogácsa két másodperc.'] },
    { w: C_.halal(1), once: 1, l: ['Hallottam, hogy elestél. Gyere ide. *papucs*. Ez nem büntetés volt, hanem emlékeztető.'] },
    { w: C_.mely(3), l: ['Nem szeretem, ha olyan mélyre mész, hogy nem hallod, amikor kiabálok vacsorához. Pedig kiabálok.'] },
    { w: C_.hazas, once: 1, l: ['Megnősültél? Férjhez mentél? Akármelyik, nekem senki sem szólt! Na mindegy, a lakodalmon úgyis én főzök.'] },
    { w: C_.b('magorzo'), l: ['Lementél a Föld közepéig? Kabát volt rajtad? Ott állítólag háromezer fok van, de a huzat az biztos.'] },
    { w: S => true, l: ['Amikor kicsi voltál, mindig a harmadik pogácsát etted meg először. …Mi? Nem, nem tudom, honnan tudom. Te még sosem jártál itt kicsiként. Ugye?'], deep: 1 },
    { w: C_.vege, l: ['Most már értem, miért emlékszem rád gyerekként. Körben jársz, fiam. A körben is enni kell.'] },
  ],
  fokonstruktor: [
    { w: S => S.lvl >= 5, l: ['A kardodra tennék egy rakétahajtóművet. Nem? Egy kicsit? Egy nagyon kicsit?'] },
    { w: C_.b('n1'), once: 1, l: ['Az N-1… Huszonnégy éven át terveztem, és te harminc perc alatt szétszedted. Nem haragszom. Mérnökként lenyűgöz. Emberként kicsit sírok.'] },
    { w: C_.b('n1'), l: ['Az N-1 négy próbát bukott el a valóságban. Nálunk ötöt. Az ötödik te voltál.'] },
    { w: C_.proba(3), l: ['Három próbát álltál ki önszántadból? Az ilyen embereket hívjuk tesztpilótának. Vagy a tesztpilóták özvegyének. Az első jobban hangzik.'] },
    { w: C_.vege, l: ['Kiszámoltam: a hurok energiamérlege negatív. Valahonnan mindig jön egy kis plusz. Szerintem te vagy az. Ne nézz így rám, ez fizika.'] },
  ],
  furomester: [
    { w: C_.b('magorzo'), once: 1, l: ['Lent voltál. A középen. Ahol a g nulla. Milyen volt? …Ne mondd el. Negyven évig fúrtam, hogy egyszer magam lássam.'] },
    { w: C_.mely(4), l: ['Négy szint egyhuzamban. A fúrófej is így megy: nem áll meg, amíg nem muszáj. A fúrófej is szokott eltörni. Gondolj erre.'] },
    { w: C_.halal(20), l: ['{halal}-szer temettek be odalent. A kőzetet ez nem zavarja, engem kicsit.'] },
    { w: C_.vege, l: ['A Föld közepén fény árad kifelé. Most már tudom, ki kapcsolta fel. Te. Majd. Egyszer. Vagy már.'] },
  ],
  kezelo: [
    { w: C_.b('szamallomas'), once: 1, l: ['A Számállomás elhallgatott. Utána még húsz percig szólt valami a 29 999 kilohertzen. A te hangod volt. Nem tudom, mit mondtál, mert egyszerre mondtad visszafelé és előre.'] },
    { w: S => S.flags.toredek_raktar || S.flags.toredek_mez, l: ['Megvan egy töredék? Rakd össze a többit is. Az üzenet hiányos mondatokban nem működik. Ahogy én sem.'] },
    { w: C_.halal(3), l: ['Minden halálod után recseg egyet a vonal. {halal} recsegés. Felírom őket. Lehet, hogy Morse.'] },
    { w: S => true, l: ['Tegnap éjjel valaki a frekvencián a nevedet betűzte. Öt-egy, egy-egy, nulla-egy. Az ő hangja olyan volt, mint a tiéd, csak fáradtabb.'], deep: 1 },
    { w: C_.vege, l: ['Az üzenet feladója: TE MAGAD. Én csak a kezelő vagyok. A kezelő nem kérdez. A kezelő ír.'] },
  ],
  pilota: [
    { w: C_.b('onmagad'), once: 1, l: ['Találkoztál magaddal a tesszeraktban? Én is egyszer. Kevésbé voltam jóképű, mint hittem.'] },
    { w: C_.mely(5), l: ['Öt szint mélyről? A hajóórád ott lassabban járt. Odafent eltelt egy kis idő. Nagyi már kétszer melegítette meg a vacsorát.'] },
    { w: S => true, l: ['A hajóórám szerint te tegnap érkeztél. A városi óra szerint ma. A tiéd szerint… ne nézd meg. Én megnéztem a magamét, és azóta rosszul alszom.'], deep: 1 },
    { w: C_.vege, l: ['A hurok bezárult. Ilyenkor nyílik egy következő. A fekete lyukak ezt nem reklámozzák.'] },
  ],
  kurta: [
    { w: S => S.stats.burps >= 1, l: ['A böfid tegnap 66 decibel volt. Na haaali. Kezdő.'] },
    { w: S => S.stats.burps >= 25, l: ['{szint}. szintű és már 200 decibel fölött böfögsz? Nagyi szerint rossz hatással vagyok rád. Nagyinak igaza van. De LELKES vagy!!!'] },
    { w: C_.halal(5), l: ['{halal}-szer haltál meg? Én egyszer. A Bikától. Nem akarok róla beszélni.'] },
    { w: C_.b('sziv'), l: ['Megrepesztetted a Szívet? Én a sörösüveget szoktam. Hasonló a hang.'] },
    { w: C_.hazas, l: ['Megházasodtál. Most már valaki otthon is hallja a böfiket. Részvétem neki.'] },
    { w: C_.vege, l: ['A Föld szétmegy, a hurok bezárul, te meg itt ülsz a kocsmában. Ez a helyes sorrend.'] },
  ],
  bodor: [
    { w: S => S.lvl >= 6 && !Object.keys(S.skills).some(k => SKILLS[k] && SKILLS[k].ut), l: ['Hatodik szint, és még nincs utad? Két út van, gyerek. Aki mindkettőn megy, az a kettő között áll. Ott a legrosszabb.'] },
    { w: S => Object.keys(S.skills).some(k => SKILLS[k] && SKILLS[k].ut), once: 1, l: ['Választottál utat. Jó. Most még visszafordulhatsz. Pénzbe kerül. A tévedés mindig pénzbe kerül, de a túl késői felismerés többe.'] },
    { w: S => (S.stats.perfect || 0) >= 10, l: ['Láttam, ahogy kitérsz. Nem félsz, csak figyelsz. Ez a különbség a fürge és a halott között.'] },
    { w: C_.b('sziv'), once: 1, l: ['A fiú szabad. A torony nem issza tovább a völgy vizét. Tegnap esett. Három év után először. Nem sírtam. A szemembe ment egy csepp eső.'] },
    { w: C_.os(1), l: ['Legyőztél egy Őst. Most már tudod, mi van a falon túl. Nem árulom el, mi van a következő falon túl. Mert én sem tudom.'] },
    { w: S => true, l: ['A cetlimen az áll: „Ha engem nem várt meg, téged se várjon.” Most, hogy itt állsz, kezdem gyanítani, hogy nem nekem írtam.'], deep: 1 },
    { w: C_.vege, l: ['Ismerlek, gyerek. Láttalak már egyszer felmenni a toronyba. Akkor öreg voltál, és engem hívtak Bodornak. Lassan üss.'] },
  ],
  nyelvesz: [
    { w: S => true, l: ['A „hazaérkezés” szóban három toldalék van, és egy expedíció. A toldalékokat elmagyarázom, az expedíciót te tudod jobban.'] },
    { w: C_.halal(3), l: ['Meg-hal-t-ál. Tő, múlt idő, személyrag. És vissza-jött-él. Igekötő, tő, múlt, személy. Nyelvtanilag hibátlan, biológiailag aggályos.'] },
    { w: C_.vege, l: ['A „te magad” két szó, de egy személy. A nyelv már akkor tudta, amikor te még nem.'] },
  ],
  kende: [
    { w: C_.lvl(15), l: ['{szint}. szint. Én is voltam ennyi. Tavaly. Nem mintha számolnám.'] },
    { w: C_.halal(10), l: ['{halal} halál, és még mindig itt vagy? …Nem tiszteletből mondom. Csak megállapítom. Hangosan.'] },
    { w: C_.vege, l: ['Szóval te zártad be a hurkot. Akkor a következőben én leszek a hős. Ezt jegyezd fel. A Leltáros úgyis mindent feljegyez.'] },
  ],
};
// pletyka: a lakók egymásról – a felszíni réteg
const GOSSIP = [
  ['nagyi', 'kurta', 'Az unokám azt mondja, edzeni jár a kocsmába. Böfögni jár. Én is voltam fiatal, de én titokban böfögtem.'],
  ['kurta', 'nagyi', 'Nagyi papucsa 15%-os eséllyel visszatér. Ezt nem a játék mondja, hanem a tapasztalat.'],
  ['leltaros', 'fokonstruktor', 'A Főkonstruktőr kért tőlem egy csavart. Nyolc éve. Azóta „kölcsönben” rovaton van. Az a rovat hosszabb, mint a raktár.'],
  ['fokonstruktor', 'leltaros', 'A Leltáros megszámolta a csillagokat. Kettővel több lett, mint tavaly. Szerinte ez lopás.'],
  ['mehesz', 'nagyi', 'Nagyi a mézemet „gyógyszernek” használja. A pogácsába. Ez nem gyógyszer, Nagyi. Ez boldogság.'],
  ['furomester', 'pilota', 'A Pilóta szerint a fekete lyuk lefelé van. Szerintem minden lefelé van, ha elég mélyre ásol.'],
  ['pilota', 'furomester', 'A Fúrómester azt hiszi, lefelé megy. Valójában a Föld közepe felé. Ott meg nincs lent. Ne mondd el neki, teljesen összetörne.'],
  ['kezelo', 'nyelvesz', 'A Nyelvész szerint a Morse is nyelv. Igaza van. Csak nincsenek benne toldalékok. Ezért szeretem.'],
  ['nyelvesz', 'kezelo', 'A Kezelő minden mondatot STOP-pal fejez be. Mondtam neki, hogy a pont is megteszi. Azt mondta: STOP.'],
  ['bodor', 'kende', 'Kende minden reggel kihív. Minden reggel nem megyek ki. Így edzem a türelmét. Nem működik.'],
  ['kende', 'bodor', 'Bodor szerint lassan kell ütni. Én gyorsan ütök. Ő tanított rá. Csak nem akarja bevallani.'],
  ['kurta', 'kezelo', 'A Kezelő mondta, hogy a böfim 7050 kilohertzen fogható. Sztár vagyok a rádióban!'],
  ['nagyi', 'bodor', 'Bodor húsz éve azt mondja, „holnap felmegyek a toronyba”. Húsz éve viszek neki holnapra pogácsát.'],
  ['mehesz', 'leltaros', 'A Leltáros egyszer megszámolta a méheimet. Negyvenhétezer-kétszáztizenegy. Másnap egy hiányzott. Azóta beszélő viszonyban sincsenek.'],
  ['leltaros', 'kurta', 'Kurta a kocsmában fizet: két Bika, egy Kóla, egy kitörölhetetlen sor a füzetemben.'],
];
// a fő szál jelenetei: bevezető és záró szöveg – a záró egy-egy betűt ad az üzenethez
const STORY = {
  leltarhiany: { be: 'A 976. tárhely előtt áll. Nincs arca, csak egy vonalkód, amelyet semmi sem olvas le.', ki: 'A Leltárhiány szétesik. A dobozai között egy cetli: „N”. A te kézírásod.' },
  kiralyno: { be: 'A Kaptár szívében zümmögés, amelytől a fogad is rezeg. A Királynő tudja a neved.', ki: 'A raj elcsendesedik. A lépek mintázata egyetlen betűt rajzol: „E”.' },
  sziv: { be: 'A torony csúcsán a fiú áll, láncra verve. A szél a lánc szemeit énekelteti.', ki: 'A láncok lehullanak. A fiú rád néz: „Te már voltál itt. Te kötöttél meg.” Aztán esni kezd az eső.' },
  magorzo: { be: '6371 kilométer. Nincs lent, nincs fent. Csak a Mag Őre, és a fény, ami belőle árad kifelé.', ki: 'A fény nem kialszik, hanem irányt vált. Feléd. Mintha valaki a túloldalról visszaküldené.' },
  szamallomas: { be: '29 999 kHz. A hang számokat olvas fel. A számok a te dátumaid.', ki: 'Az utolsó adás: „A FELADÓ: TE MAGAD.” Aztán zúgás. Aztán a saját lélegzeted, a vonal másik végéről.' },
  n1: { be: 'Az N-1 Szörnyeteg felébred. Huszonnégy év tervezés, négy bukás, és egy harag, ami sosem jutott el a Holdig.', ki: 'A rakéta végre nyugodni tér. A roncsai között egy holdkő: valaki már járt ott. A lábnyom a te csizmádé.' },
  onmagad: { be: 'A tesszeraktban hátulról látod magad. Ő is téged. Egyikőtök sem fordul meg elsőként.', ki: '„Ne add fel” – mondja, mielőtt eltűnik. Nem búcsúnak hangzik. Hanem útmutatásnak.' },
  szingularitas: { be: 'A Zaj minden világot elnyel. A közepén csend van, és abban a csendben valaki vár rád: aki elküldi az üzenetet.', ki: 'Felveszed a jelet. Már tudod, kinek szól.' },
};
const Dialog = {
  fill(s) { const S = G.S; return s.replace(/\{nev\}/g, S.nev).replace(/\{halal\}/g, S.stats.deaths).replace(/\{oles\}/g, fmt(S.stats.kills)).replace(/\{mely\}/g, (S.exp && S.exp.bestHome) || 0).replace(/\{kaszt\}/g, CLASSES[S.cls].nev.toLowerCase()).replace(/\{szint\}/g, S.lvl); },
  // a következő sor: előbb az egyszeri hírek, aztán a progresszióhoz kötött sorok, néha pletyka, néha egy mély nyom
  line(id) {
    const S = G.S, N = NPCS[id], P = NPC_PROG[id] || []; S.seenProg = S.seenProg || {};
    for (let i = 0; i < P.length; i++) { const p = P[i]; if (p.once && p.w(S) && !S.seenProg[id + ':' + i]) { S.seenProg[id + ':' + i] = 1; return this.fill(p.l[0]); } }
    const r = RNG();
    if (r < 0.18) { const g = GOSSIP.filter(x => x[0] === id); if (g.length) return this.fill(RNG.pick(g)[2]); }
    const pool = [];
    P.forEach((p, i) => { if (!p.once && p.w(S)) for (const l of p.l) pool.push({ l, deep: p.deep, i }); });
    // a mély nyomok ritkák, és csak egyszer-egyszer bukkannak fel
    const deep = pool.filter(x => x.deep && !S.seenProg[id + ':d' + x.i]);
    if (deep.length && r < 0.3 && S.lvl >= 8) { const d = deep[0]; S.seenProg[id + ':d' + d.i] = 1; return this.fill(d.l); }
    const normal = pool.filter(x => !x.deep);
    if (normal.length && r < 0.65) return this.fill(RNG.pick(normal).l);
    return this.fill(RNG.pick(N.lines));
  },
};
