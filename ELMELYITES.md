# Elmélyítés – diagnózis és napló

Ez a dokumentum az `elmelyites-1` ág munkanaplója: mi sekély ma a Kapukban, milyen sorrendben nyúltam hozzá, mit mértem előtte és utána, és mit hagytam ki szándékosan.

## 1. Diagnózis (a `src/` teljes átolvasása alapján)

Rendszerenként: mi sekély, mi lóg a levegőben, és minek nincs valódi döntési súlya.

**Harc érzete.** Nincs hitstop. A találatot csak egy 0,1 mp-es fehér villanás és egy szám jelzi, a hátralökés pedig minden fegyvernél majdnem ugyanakkora (40–140), ezért a pöröly ütése ugyanolyan súlytalan, mint a pálcáé. A közelharci ellenfelek 0,35 mp-es „rezgéssel” jeleznek, a rohamozók 0,6 mp-es rezgéssel, iránymutató vonal nélkül, a lövészek pedig egyáltalán nem jeleznek, így a kitérés reflex helyett tippelés. A kitérés 25 állóképességbe kerül 100-ból, és 0,9 mp-enként mehet: négyet lehet egymás után ellőni, a jó időzítés semmit sem ad. Ez pánikgomb, nem döntés.

**Kasztok és erőforrás.** A négy erőforrásnak csak a feltöltődése különbözik: a Düh a puszta lendítésre is jön, ha van ellenfél a közelben, akkor is, ha a csapás mellé megy. A képességek egymásról nem tudnak. Égő célpontra fagyot, fagyott célpontra tüzet szórni pont ugyanannyit ér, a drón és a torony nem segíti egymást, a Golyóidő pedig csak egy lassító kapcsoló. A fákban nincs elágazás. A végjátékban a pontok bőven elérik mind a 48 rangot (69 szint + ~20 küldetéspont), így a végén mindenki ugyanazt viszi.

**Egyensúly.** A görbék papíron rendben vannak (a `wepScale` követi a `monHp`-t), de mérés nincs mögöttük. Hogy egy átlagos játékos hányszor hal meg a Mézországban, és lemarad-e szintben az Égtoronyra, azt senki nem tudja. A boss-HP (520 → 1900) lassabban nő, mint a fegyversebzés, a Szív és a Számállomás védelme (láncok, antennák) pedig egy egész fázisra kikapcsolja a sebzést.

**Zsákmány.** Minden affix tisztán pozitív, a tooltip csak sebzés/mp-et és páncélt hasonlít, így mindig a nagyobb szám nyer. Az ereklyék fele passzív szorzó (Leltárkönyv: +40% arany), nem változtat a játékon. A kézművesség csak egy célzott dobás, amelyik bázist választod, és nem ad semmit, amit a zsákmány ne adhatna.

**Világok.** A mechanikák kozmetikusak vagy büntetők, és nem kérnek más viselkedést. Az Égtorony széllökése véletlen irányba tol, nincs ellenszere. A Raktár áramszünete csak sötétebb. A láva kerülendő csempe. A Morse-zár négyválaszos feleletválasztó, a hangot meg sem kell hallgatni. A W-tengely működik, de a fázislidérc ellen csak annyit tehetsz, hogy átváltasz, a harcba nem épül bele. A bossok mintái véletlenszerűen sorsolódnak a kész listából, a 2. fázis csak 30%-kal gyorsabb, így semmit nem lehet megtanulni, csak kibírni.

**Túlélés.** Három fogyó csík, amelyet a zsákmányból bőven lehet tölteni: étel a szörnyek 6%-ánál, ital a ládák felénél. A szomjúság harc közben ~7 percenként kér egy G-t. Nyűg, nem ritmus: nincs oka hazamenni, és az evés nem ad semmit, csak megszünteti a büntetést.

**Otthon.** A kényelem egyetlen helyen számít, az otthoni alvás Kipihent áldásánál, viszont ott aránytalanul sokat ad (akár +40% TP). A tűzhely négy receptjéből egy hasznos (gulyás: +10% életerő), a napi termés a valós naptárhoz kötött, nem a játékhoz. Az otthon és a harc között nincs kapocs.

**Kapcsolatok, házasság.** Napi beszélgetés, ajándék és randevú kell a 100 ponthoz, ez valós napokban mérve legalább egy hét. A végén egy passzív bónusz jár. Nem rossz, de független minden mástól.

**Lore és NPC-k.** Az NPC-k véletlen sort mondanak egy fix listából, és csak a többi játék eseményeire reagálnak (`react` az `univerzum-naplo` kulcsaira), a saját előrehaladásodra egyáltalán nem: Bodor ugyanúgy beszél, ha megvan a Szív, mint ha nincs. A fő szál jelenetei egy-egy értesítésből és a boss egy sorából állnak, a fázisváltás és a győzelem nem kap hangsúlyt.

**Ősök és Tiltott képességek.** Szándékosan túlerősek, ez rendben van. Az Ős viszont csak egy felhizlalt, szokásos MI-jű szörny, nincs saját viselkedése. Ez maradhat így, mert nem az első órát érinti.

## 2. Rangsor: mit érez a játékos a leghamarabb?

Az első órában a játékos szinte csak harcol a Raktárban és a Mézországban, és néhányszor bemegy a városba. Ezért ebben a sorrendben dolgoztam:

1. **Harc érzete** – az első 10 másodperctől folyamatosan érzi (alaptámadás, találat, kitérés).
2. **Kaszt-identitás, erőforrás** – az első 5 percben kapja meg az első képességet és az erőforrás-csíkot.
3. **Egyensúly az első két világban** – az első halál és az első boss az első órában jön.
4. **Túlélés ritmusa** – a csíkok 7–12 percen belül megjelennek és szólnak.
5. **Zsákmány-döntések** – az első kék-sárga tárgyak 10–20 perc között jönnek.
6. **NPC-reakciók, fő szál jelenetei** – az első leadott küldetésnél (Leltáros, ~30–40 perc).
7. **Világmechanikák, boss-fázisok** – a Leltárhiány az első óra vége felé; az Égtorony és a mélyebb világok később.
8. **Kézművesség** – az első küldetés kéri, de csak 20–40 perc után van hozzá anyag.
9. **Otthon, házasság** – 600 arany kell, ez az első óra után jön.
10. **Ősök, Tiltott képességek** – a középjáték után.

A tervezett irányok (A–G) nagyjából ezt a sorrendet követik.
