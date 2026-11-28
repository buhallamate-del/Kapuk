// ============================================================
//  KAPUVÁROS: NPC-k (a többi világ lakói), szolgáltatások
// ============================================================
const NPCS = {
  leltaros: {
    nev: 'A Leltáros', cim: 'a Végtelen Raktárból', pos: [51.5, 12.5], look: { c: '#e07b26', c2: '#2a3a52', hat: 'cap' }, menu: ['raktar'],
    lines: ['Kilencszázhetvenhat tárhely, és mind tele. Kivéve egyet.', 'A rendszer szerint te nem is létezel. Szóval jó helyen vagy.', 'A raktárban két dolog van: ami megvan, és ami nincs meg. Az utóbbiból több.', 'Raklapot nem dobunk el. Raklapot szétszedünk és újra összerakunk.', 'Hajnali műszak? Az automatás kávé a barátod.', 'A tárhelyed nálam van. Amit idehozol, azt senki nem viszi el. Én sem. Talán.'],
    tips: ['A Raktár 3D-ben 976 tárhely van: T1-ben 428, T2-ben 330, a temperált T3-ban 74, a T4-ben 92, a falon még 52.', 'Éjjel a pohármosóból kiszabadul a lidérc. Három perc nappal, három perc éjjel – így megy ott az idő.', 'A pohármosó ajtajában egy apró fekete lyuk lebeg. Aki belesétál, az Eseményhorizontban köt ki.', 'A 976. szűrt tárhely címkéje éjjel villog: ·– –·· –··. Az ADD. A Jeltörő-állomás is hallja.', 'Tűzriadónál egy percen belül ki kell érni, különben −50 életerő. A kutyák kint várnak.', 'A sorok alatt guggolva átbújhatsz – 1,25 méter a hely.', 'Néha aranyraklap tűnik fel a raktárban. Ha látsz egyet, ne hagyd ott.'],
    react: { 'r3:feketelyuk': 'Te sétáltál bele a pohármosó fekete lyukába? Akkor tudod, hogy a leltárban nem minden tétel van ebben a világban.', 'r3:jel': 'Láttad villogni a címkét? ·– –·· –··. Én húsz éve nézem. Most már te is tudod.' },
  },
  mehesz: {
    nev: 'A Méhész', cim: 'Mézországból', pos: [39.5, 11.5], look: { c: '#ffcc00', c2: '#f4f0e0', hat: 'veil' }, menu: ['bolt'],
    lines: ['Repce áprilisban, akác májusban, hárs júniusban. A darazsak meg mindig.', 'Egy méh egész életében alig fél gramm mézet gyűjt. Gondolj erre, mielőtt elpazarolod az aranyad.', 'Veszel valamit? A darazsak nem alkudnak, én igen.', 'Minden vidéknek más a méze. A Hargitán az akác négyszeres, de a tél kegyetlen.', 'A levendulásban egyszer láttam egy rózsaszín crop topos szakállast. Azt kiabálta: levendulaaaa.'],
    tips: ['Mézországban a hárs Tokaj-hegyalján háromszor és félszer annyit ad.', 'A Hargitán az akác alapja négyszeres, de a tél ott szinte mindent elvisz – csak a tizedét hagyja.', 'A Balaton-felvidéken a levendula háromszoros.', 'A Kárpátokban minden virágzás eggyel többet ad – onnan már csak a Kárpátok II. és III. jön.', 'Egy erős család nyáron 40–60 ezer méhből áll.', 'Aki megépíti a Csillagméhest, annak a méhei egy távoli, fénylő pont felé indulnak. A fekete lyuk felé.', 'A Jeltörő MEG adásában a csillagméhek szárnyzúgása szól.'],
    react: { 'mo:csillag': 'Te építetted az első Csillagméhest? A méhek azóta is a fekete lyuk felé repülnek. Remélem, tudják, mit csinálnak.', 'mo:karpatok': 'Eljutottál a Kárpátokig! Ott minden virágzás eggyel több. Irigyellek.' },
  },
  nagyi: {
    nev: 'Nagyi', cim: 'Kurta nagymamája', pos: [21.5, 11.5], look: { c: '#b45a8a', c2: '#e8e0d8', hat: 'kendo' }, menu: ['alkimia', 'elelem'],
    lines: ['Egyél, fiam, olyan sovány vagy, mint egy pálcika!', 'A papucsom nem öl. Csak nevel.', 'Az unokám megint böfögött. Úgy tettem, mintha nem hallottam volna.', 'Gyógyfűből, mézből, egy kis kristályból – ebből lesz a legjobb ital. Meg egy kis szeretetből.', 'Pogácsát? Csak egyet. Na jó, kettőt.', 'Ha álmos vagy, ne harcolj! Feküdj le a kocsmában, Kurta úgyis ébren van.'],
    tips: ['A Kurta szimulátorban a papucsom húsz százalék gázt vesz el. Az unokám szerint ez igazságtalan.', 'Az első böfi után jönnek a papucsok. Később tégla és meteor – azok már fájnak.', 'A Spréjt az egyetlen ital, ami elveszi a gázt. Kóla tizennégyet ad, a Bika huszonkettőt.', 'Százszázalékos gáznál nem szabad sokáig várni, különben orron át távozik. Egy élet odavan.', 'A 60 decibeles böfinél úgy teszek, mintha nem hallottam volna. A 440-esnél már nem tudtam.'],
    react: { 'ku:fold': 'Az unokám szétböfögte a Földet. Én megmondtam neki, hogy ne igyon annyi Bikát.', 'ku:lokeshullam': 'Kétszáz decibel fölött már lökéshullám, tudod? A papucsom is megremegett.' },
  },
  fokonstruktor: {
    nev: 'A Főkonstruktőr', cim: 'a Kísérleti Lőtérről', pos: [10.5, 12.5], look: { c: '#556070', c2: '#ffcc33', hat: 'goggles' }, menu: ['kovacs', 'craft'],
    lines: ['A korszak építésze voltam. Most a korszak kovácsa vagyok.', 'Vasérc, keményfa, bőr. Meg a világok anyaga: raklapdeszka, felhőkő, magmaüveg. Hozz, és csinálok valamit.', 'A tíz plusszal erősített kard nem kard, hanem kijelentés.', 'Hatezer-nyolcszáz kilonewton. Az F-1. Ilyet kellene a csizmádba szerelni.', 'Minél mélyebbről hozod az anyagot, annál jobb a tárgy. Ez fizika.'],
    tips: ['A Kísérleti Lőtérben aki szökési sebességre gyorsít egy terhet, annak furcsa jel érkezik a mélyűrből. A jel az Eseményhorizontba vezet.', 'A műhold pályájának legalacsonyabb pontja legyen 120 kilométer fölött, különben visszahull.', 'A Keleti Unió 9000 kilométerre van, 120 millió lakossal. Az Északi Szövetség 5000-re, a Déli Liga 1500-ra.', 'Az utolsó fokozat a röppálya csúcsán gyújt újra, és vízszintesen gyorsít. Így lesz a ugrásból pálya.', 'Az űrállomáshoz 20 tonnás modul kell, a Holdraszálláshoz 15 tonnás holdkomp.', 'A legnagyobb próba ötven megatonna volt. A szeizmográfok háromszor kerülték meg a Földet.', 'Ha az Eseményhorizontban megtalálod a Lőtér buborékját, a programod százmilliós támogatást kap.'],
    react: { 'lo:moon': 'Holdra szálltál? Az N-1 sosem jutott el oda. Lehet, hogy ezért haragszik.', 'lo:esc': 'Elérted a szökési sebességet. A szondád most a fekete lyuk körül kering, 5200 egységre.' },
  },
  furomester: {
    nev: 'A Fúrómester', cim: 'a Mélységből', pos: [51.5, 36.5], look: { c: '#b0703a', c2: '#ffdd55', hat: 'helmet' }, menu: ['csere'],
    lines: ['Huszonöt fok kilométerenként. Ennyit melegszik a világ, ha lefelé mész.', 'Hozz mintát, adok érte valamit. Alkudni nem fogok, a kőzet sem alkuszik.', 'A legmélyebb bánya négy kilométer. A legmélyebb fúrás tizenkettő. A Föld hatezer-háromszázhetvenegy.', 'Ha a hő visz fel, a minták negyede elvész. Ezt jegyezd meg.'],
    tips: ['A Kola-fúrás 12 262 méter volt, 1989-ben. 180 fokon a kőzet képlékeny lett.', 'A Moho 35 kilométer mélyen van. Az óceán alatt csak 5–10. Mohorovičić fedezte fel 1909-ben.', 'A legmélyebb gyémánt a felső köpenyben terem, olivin és piroxén között.', '410 kilométernél az olivinből wadsleyit lesz, 13–14 gigapascalon.', '2890 kilométernél kezdődik a folyékony mag. Itt a legnagyobb a nehézségi gyorsulás: 10,7.', 'A belső mag szilárd, mert a 330 gigapascalos nyomás préseli. Inge Lehmann fedezte fel 1936-ban.', 'A Föld közepén a g nulla. Nincs lent és fent. És fény árad kifelé.', 'A 660 kilométeres határ alatt a bridgmanit uralkodik – a Föld leggyakoribb ásványa.'],
    react: { 'me:kozep': 'Jártál a Föld közepén? Akkor láttad a fényt. Az a fekete lyuk másik vége.', 'me:mag': 'Eljutottál a Gutenberg-határig. 3800 fok. Szép munka.' },
  },
  kezelo: {
    nev: 'A Kezelő', cim: 'a Jeltörő-állomásról, 1957', pos: [21, 38.5], look: { c: '#3a3f2a', c2: '#d8c48a', hat: 'phones' }, menu: ['verseny', 'kapuk'],
    lines: ['1957. október 4. Ma este megszólalt az ég.', 'Tizenegy éve vagyok szolgálatban. Ennyivel kell eltolni az ábécét a második adásnál.', 'Hallom a többi világot. Néha valaki eljut a Hasadék mélyére – olyankor recseg a vonal.', 'A frekvenciák nem véletlenek. Semmi sem véletlen ezen az állomáson.', 'Számállomásnál A az 01. Ezt tanuld meg először.'],
    tips: ['A Jeltörő első adása 7050 kilohertzen jön, Morse-ban: HALLO.', 'A 9410-es adás hárommal eltolt ábécé: A HOLD NEM MESSZE.', 'A 6660-as adásnál tizeneggyel kell eltolni: NEM VAGY EGYEDÜL.', 'Az ADD frekvenciája 10 976 kilohertz: ahány tárhely a raktárban van, és még egy tízes előtte.', 'Az ÉRI 6371 kilohertzen szól – a Föld sugara kilométerben.', 'A teljes üzenet 29 999 kilohertzen jön össze: NE ADD FEL MEGÉRI.', 'A feladó neve 1000 kilohertzen: TE MAGAD. Nem része az üzenetnek. Csak aláírás.', 'Az üzenet sosem a jövőből jött, és sosem a múltba ment: mindig is itt volt, egy hurokban.'],
    react: { 'jt:jel': 'Te raktad össze az üzenetet. Akkor tudod, ki a feladó. Aki elküldi, az kapja meg.', 'jt:1957': 'Feltörted a második fejezetet. MAJD. TÜKÖR. HUROK. Érted már?' },
  },
  pilota: {
    nev: 'A Pilóta', cim: 'az Eseményhorizontról', pos: [40, 38.5], look: { c: '#c48cff', c2: '#e8e8f0', hat: 'helmet2' }, menu: ['kapuk'],
    lines: ['A hajóórám szerint három napja vagyok itt. A Földön közben eltelt néhány év.', 'A fekete lyuk nem porszívó. Csak nagyon türelmes.', 'Ha a horizonton túl jársz: a négydimenziós térben a W a negyedik irány. Z és X – ezzel tolod el magad.', 'Interstellar? Láttam. A korong túlsó oldala tényleg a lyuk fölé hajlik. Ezt nem a film találta ki.'],
    tips: ['Az Eseményhorizontban, a lyuk belsejében a W=0-ról indulsz, a 1100-as pontból.', 'A tesszerakt 1700 egységre van a középponttól, W-ben csak ±72 és ±288 között. 430-as sugáron belül hátulról látod magad.', 'A fehér lyuk – a kijárat – 1800 és 2500 között van, W-ben ±380 és ±700 között. 170-en belül kidob.', 'A bébi-univerzum 2500-ra van, 340-es sugárral. Ott a fény csak 35%-os sebességgel jár.', 'A nyolc titkos buborék 3200–3700 egységre van. A Lőtéré W=+420…620, a Kurtáé W=−910…−1110. Messzire kell menni a W-tengelyen.', 'A Kerr-gyűrű 220 sugarú. Ne érintsd – de a közepén átjutsz az antivilágba, ahol a hajóóra visszafelé jár.', 'A féreglyuk torka egy 7 másodperces ciklus első 40%-ában nyitva van. Zárva visszalök.', 'Ha 150-nél közelebb mész a szingularitáshoz, vége. 520-nál még csak figyelmeztet.', 'Az Üzenet a múltba küldetésben három jel az égtáj, egy a W előjele: hosszú = +W, rövid = −W.', 'A tér 4200-nál visszahajlik önmagába. Onnan tudjuk a holografikus elvet.'],
    react: { 'eh:egg:kapuk': 'Szóval a buborékon át jöttél. Akkor te is láttad kívülről a várost: egy fénylő pont a W-tengelyen. Kicsi, ugye? Innen nagyobbnak tűnik.', 'eh:novikov': 'Te már bezártad egyszer a hurkot. Akkor tudod: aki elküldi, az kapja meg.', 'eh:horizont': 'Átléptél a horizonton. A horizont emlékszik rád. Mindenre emlékszik.' },
  },
  kurta: {
    nev: 'Kurta', cim: 'a kocsma örök vendége', pos: [10.5, 36.5], look: { c: '#ff8ac8', c2: '#1a1a1a', hat: 'beard' }, menu: ['kocsma'],
    lines: ['na haaaliii', 'De, LELKES!!!', 'Minden böfi kétszer hangosabb, mint az előző. Ez tudomány.', 'de g*ci vagyok heeee', 'Ez a gyomromból jött? Nem. A lelkemből.', 'Kóla vagy Bika? Mindkettő.', 'Nagyi úgy tesz, mintha nem hallotta volna. De hallotta.', 'levendulaaaa'],
    tips: ['200 decibel fölött a böfi már nem hang, hanem lökéshullám. A Lőtér szeizmográfjai kilengnek.', '230 decibelnél egy háztömb összeomlik.', '300 decibelnél az összes repülőtér törli a járatait.', '440 decibel: a Földet összetartó energia ötszöröse. A Föld darabokra szakad. Én meg csak lebegek, kicsit megkönnyebbülve.', 'Egy MAX böfi mindent elfúj, ami hull. Téglát, meteort, papucsot.', 'Ha a Föld szétszakad, minden világ ajándékot kap. Nem kell megköszönni.'],
    react: { 'ku:fold': 'Láttad, ahogy szétment a Föld? Na, az én voltam. Bocsi.' },
  },
  bodor: {
    nev: 'Öreg Bodor', cim: 'mester az Égtoronyból', pos: [16.5, 24.5], look: { c: '#e8e0d0', c2: '#6b5a44', hat: 'bald' }, menu: ['tanito'],
    lines: ['Lassan üss, gyerek. Gyorsan csak az üt, aki fél.', 'Három éve indultam fel a toronyba. Azt hiszem, még most is mászom.', 'Ha a képességeidet rosszul választottad, segítek elfelejteni. Pénzbe kerül. A felejtés mindig pénzbe kerül.', 'Az erő nem a karodban van. A karod csak továbbítja.', 'Rorek vasfogát én ütöttem ki húsz éve. Nem vagyok rá büszke. Na jó, egy kicsit.'],
    tips: ['Az Égtorony 40. emeletén vár a Szív – de csak ha a krónikában a hetedik fejezetig jutottál.', 'Ne az Urat üsd, a láncot nézd. A fiú nem akarta. Fentről húzzák.', 'Vörös Kende öccse volt az Égtorony Ura. Hét éve húzta fel a lánc.', 'A torony ereje a völgy vizét issza. Ezért nem esik három éve.', 'A 20. emelet fölött az Árnyékkapu csak Mester rangúnak nyílik – háromszáz ponttól.', 'Aki három mestert kitanul, a Négy út iskolájával indulhat.', 'Szélanyó a Bambuszvölgyben azt mondja: túl hangosan lépsz. Igaza van.', 'Az Első Harcos a 40. emelet bossa, ha a Szív már megrepedt. Senkinek sem ütött még kétszer ugyanoda.'],
    react: { 'eg:sziv': 'Láttam a csillagot a torony tetején. Nem pislákol, a fénye körbehajlik. Te voltál, ugye?', 'eg:csucs': 'Elérted a harmincadik emeletet. Én nem. Még.' },
  },
  nyelvesz: {
    nev: 'A Nyelvész', cim: 'a Toldaléktoronyból', pos: [44.5, 24.5], look: { c: '#7a9a6a', c2: '#f0e8d0', hat: 'glasses' }, menu: ['nyelv'],
    lines: ['Tő, szám, gazda, rag. Ennyi az egész. És mégis egy élet kevés hozzá.', 'A magyar szó torony: alul a tő, felül a rag. Ha rossz sorrendben rakod, összedől.', 'Megszentségteleníthetetlenségeitekért. Tizennégy emelet. Megépíted?', 'Kitalált szónál is ugyanígy megy: zemlődben. A sorrend nem a szótól függ.'],
    tips: ['Ha a háznak gazdája van, a többes jel -i- lesz: ház-ai-m, nem házak-om.', 'A -val rag a k után kk lesz: kezeitekkel. A v felveszi az előtte álló hangot.', 'A Toldaléktoronyban hat torony van: házaimban, könyvekről, kertjeinkben, almáitokból, zemlődben, kezeitekkel.', 'A leghosszabb torony: meg-szent-ség-telen-ít-het-etlen-ség-es-ked-és-ei-tek-ért.', 'A heti toronyfutam kilencven másodperc. A múlt heti győztes tornya aranyszegélyes.'],
    react: { 'tt:mind': 'Mind a hat tornyot megépítetted. Most már csak a tizennégy emeletes van hátra.' },
  },
  kende: {
    nev: 'Vörös Kende', cim: 'az Égtorony trónkövetelője', pos: [24.5, 31.5], wander: true, look: { c: '#c23a3a', c2: '#1a1010', hat: 'hair' }, menu: [],
    lines: ['Te vagy az, akiről beszélnek? Nevetséges.', 'Én leszek a torony ura. Nem a bátyám, nem Bodor, nem te.', 'Mit nézel? Edzésben vagyok.', 'Az Árnyékkapukat egyszer én is kinyitom.'],
    tips: ['Rorek a harmadik emeleten edz. Ha legyőzöd, talán szóba állok veled.', 'Szemira hollói a második emeleten fészkelnek. Mindent látnak.'],
    react: { 'eg:sziv': 'Te repesztetted meg a Szívet? …Akkor tartozom neked. Ezt soha többet nem mondom ki.' },
  },
};

const Town = {
  populate(m) {
    for (const id in NPCS) {
      const N = NPCS[id]; const x = N.pos[0] * TILE, y = N.pos[1] * TILE;
      m.objs.push({ type: 'npc', id, x, y, hx: x, hy: y, r: 13, wander: N.wander, label: N.nev, inter: () => UI.npc(id) });
    }
    m.objs.push({ type: 'kapu', x: 30.5 * TILE, y: 25.5 * TILE, r: 34, label: 'A Kapu', inter: () => UI.kapu() });
    m.objs.push({ type: 'tabla', x: 36.5 * TILE, y: 31.5 * TILE, r: 16, label: 'Hirdetőtábla', inter: () => UI.tabla() });
    m.objs.push({ type: 'stash', x: 49.5 * TILE, y: 12.5 * TILE, r: 16, label: 'Tárhely (976.)', inter: () => UI.stash() });
    m.objs.push({ type: 'anvil', x: 12.5 * TILE, y: 12.5 * TILE, r: 14, label: 'Üllő', inter: () => UI.npc('fokonstruktor') });
    m.objs.push({ type: 'cauldron', x: 23.5 * TILE, y: 11.5 * TILE, r: 14, label: 'Üst', inter: () => UI.npc('nagyi') });
    m.objs.push({ type: 'portal', x: 56 * TILE, y: 25.5 * TILE, r: 18, c: '#9fe07a', label: 'Lakónegyed – otthon', inter: () => Home.enter() });
    m.objs.push({ type: 'bed', x: 13 * TILE, y: 36.5 * TILE, r: 14, label: 'Kocsmai szoba', inter: () => UI.sleepInn() });
    for (const [x, y] of [[26, 20], [35, 20], [26, 30], [35, 30], [15, 15], [45, 15], [15, 34], [45, 34]]) m.lights.push({ x: x * TILE, y: y * TILE, r: 220, c: '#ffd27a' });
  },
};
