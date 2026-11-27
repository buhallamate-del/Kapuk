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

## 3. Mit csináltam, irányonként

Menet közben három kérés érkezett: humoros, átívelő és mély párbeszédek; „minél messzebb a várostól, annál több XP és annál erősebb ellenfél”, túlélő hangulatú küldetésekkel; kalandosság, kihívásra ösztönzés, és hogy a játéknak ne legyen vége. Ezek egy része új rendszer (expedíció, Próbakő, Kihívás-létra). Az eredeti brief tiltotta az új rendszert, de a későbbi kérés felülírta, ezért megcsináltam őket, és úgy terveztem, hogy a meglévőkre épüljenek (túlélés, otthon, nehézség, hirdetőtábla).

**A) Harc érzete**
- Hitstop közelharci és kritikus találatnál, öléskor és nagy kapott sebzésnél. Az ellenfél összenyomódik a találattól.
- A hátralökés a fegyver súlyától (pöröly 210, kard 70, láncfűrész 12) és az ellenfél tömegétől függ. A nehéz ütés megtöri a felhúzott támadást.
- Háromütéses kardkombó: a 3. csapás nehéz (nagyobb ív és lökés, hosszabb megállás, saját hang).
- Előjelzések. Közelharc: ék, az irány a felhúzáskor rögzül, így oldalra lépve is kikerülhető. Rohamozó: vonal, az irány 0,2 mp-cel előbb rögzül. Lövész és torony: célzó izzás és szaggatott vonal. Robbanó: töltődő kör.
- Kitérés: 30 állóképesség, utána 0,7 mp-ig nem töltődik. Az első 0,14 mp a tökéletes ablak: visszaadja az állóképességet, rövid lassítást, erőforrást és 1,5 mp erősítést ad. A csík kitérésnyi szeletekre van osztva.

**B) Kasztok identitása**
- Pengelovag: a düh csak valódi találatból és kapott ütésből jön. 50 fölött Felbőszült, teli dühnél Tomboló (a következő képesség ingyenes és +30%). Roham → Földrengés kombó (+50% a kábult célpontra).
- Elementalista: elemi reakciók (Hősokk: tűz a fagyottra; Túlvezetés: villám az égőre; Ridegség: fagy a sokkoltra) és mana-túltöltés.
- Mesterlövész: Fókusz-töltetek ugyanarra a célpontra, az Átütő lövés elhasználja őket. Golyóidő alatt dupla Fókusz, és öléskor belső idő jár vissza.
- Mérnök: gép-hálózat (+8% kapcsolatonként). A torony megjelöli a célt, a drónok és rakéták azt választják. A lejárt gép árának negyede visszajár.
- Kasztonként két, egymást kizáró út, mindkettőnek ára is van: Vérszomjas / Bástya, Lángoló elme / Fagyos nyugalom, Türelmes vadász / Gerillaharcos, Gépész / Tüzér. Bodor felejtetésével lehet váltani.

**C) Egyensúly**
- Mérőeszköz: `tools/bot.js` (Playwright + `__eval`). Determinisztikus átlagjátékos: kitér a jelzett támadások ~60%-ára, a városban italt tölt, ételt vesz, a nagyobb számot választja, pontot oszt, a seed alapján utat választ, a halál után visszamegy.
- Változtatások: laposabb XP-görbe, szintenként több XP-t adó ellenfelek, erősebb közelharc és Erő-skálázás. Ősök: póráz (620 képpont), „felfigyel” állapot (1,5 mp, amíg dönthetsz), lassabb varázslás.

**D) Tárgyak és döntések**
- Áldozat-affixek ritka és legendás tárgyon (Üvegágyú, Nehéz vért, Vérpakt, Lázas sietség, Mohóság, Kölcsönidő).
- A tooltip minden tulajdonság különbségét mutatja a viselt tárgyhoz képest.
- Kézművesség: választható mesterjegy (garantált, erősebb tulajdonság), átkovácsolás (készítetten korlátlanul, dobotton egyszer). A Leltárkönyv ára −15% életerő.

**E) Világok és bossok**
- Bossok: rögzített, megtanulható mintasorrend, minden támadás előtt névvel bejelentve. A 2. fázis lökéshullámmal és saját különleges támadással nyit.
- A Szingularitás gravitációja lüktet (4 mp beszívás, 3 mp csend), a csendben nem támad: ez a közelharc ablaka.
- Égtorony: előre jelzett széllökés, szélárnyék fal vagy oszlop mögött, a szél az ellenséges lövedékeket is elsodorja. Raktár: áramszünetben a szörnyek is vakok, lehet lopakodni.

**F) Túlélés és otthon**
- Az ételeknek rövid hatásuk van (falat). A házi koszt öt recept a világok anyagaiból, 20 perces, erősebb hatással, ilyet bolt nem ad.
- Az otthon kényelme a hazahozott útinaplóra is bónuszt ad (legfeljebb +25%). Lassabb éhség és szomjúság.

**Expedíció (kérésre)**
- Minél messzebb a bejárattól, és minél több szintet mész le hazatérés nélkül, annál erősebbek az ellenfelek (legfeljebb +5 szint), és annál jobb a zsákmány.
- A többlet-TP az útinaplóba kerül: csak élve hazaérve íródik jóvá, halálkor elvész. Mélyebben gyorsabban fogy a készlet, és hosszabb a kapunyitás.
- Négy túlélő mellékküldetés: Leltár a mélyből, Vacsorára itthon, Az utolsó kulacs, Vissza a horizont alól.

**Kaland, nincs vége (kérésre)**
- Próbakő: önként vállalt, háromhullámos harc jobb jutalomért.
- Kihívás-létra a hirdetőtáblán: mindig van következő lépcső (expedíció, próbák, elitek, Ősök, Hasadék, Ciklusok).
- A Pokol után a nehézség Ciklusokban folytatódik, felső korlát nélkül. A befejezés a következő körbe hív.

**G) Lore és párbeszédek**
- Három réteg. Felszín: a lakók egymást szapulják, visszatérő poénokkal. Közép: reagálnak a te előrehaladásodra. Mély: ritka nyomok a hurokról, amelyek a befejezés után új értelmet kapnak.
- A fő szál bossai filmszerű bevezető és záró jelenetet kapnak, a záró szövegek az üzenet nyomait adják. A „Te magad” a te statisztikáidat idézi.

## 4. Mérés: előtte és utána

Mindkét mérés 3 seed × 4 kaszt, a teljes fő szálon (29 szakasz + Szingularitás). Az idő játékidő, nem valós. Az adatok: `tools/bot-results/elotte.md` és `utana.md`. Futtatás: `node tools/bot.js <címke> [kasztok] [seedek]`.

| Kaszt | Végigért | Átl. idő (perc) | Halál összesen | Végszint |
|---|---|---|---|---|
| Pengelovag | 1/3 → 3/3 | 212 → 158 | 33.7 → 10.3 | 36.0 → 37.0 |
| Elementalista | 3/3 → 3/3 | 158 → 157 | 18.7 → 6.7 | 32.7 → 36.3 |
| Mesterlövész | 3/3 → 3/3 | 170 → 136 | 11.3 → 10.7 | 32.7 → 36.3 |
| Mérnök | 3/3 → 3/3 | 100 → 94 | 10.0 → 5.3 | 32.7 → 36.7 |

Játékos szintje a terület szintjéhez képest (átlag), a világok utolsó szintjén:

| Kaszt | Raktár 4 | Mézország 4 | Égtorony 4 | Mélység 4 | Jeltörő 4 | Lőtér 4 | Horizont 4 |
|---|---|---|---|---|---|---|---|
| Pengelovag | +3.0 → +3.3 | +1.0 → +2.7 | +0.7 → +1.3 | -0.7 → +1.0 | -2.3 → +0.7 | -3.3 → +0.0 | -4.0 → -1.3 |
| Elementalista | +3.3 → +3.3 | +2.3 → +2.7 | +0.7 → +2.0 | -1.0 → +1.3 | -1.7 → +0.3 | -3.0 → +0.0 | -4.0 → -0.3 |
| Mesterlövész | +3.0 → +3.7 | +2.0 → +3.3 | +0.3 → +1.7 | -1.7 → +1.0 | -2.0 → +0.0 | -2.7 → +0.7 | -3.7 → +0.0 |
| Mérnök | +3.0 → +4.0 | +2.0 → +4.3 | +0.7 → +2.0 | -1.3 → +0.7 | -2.7 → +0.0 | -2.7 → -0.3 | -3.7 → -1.3 |

Halálok világonként (átlag futásonként, előtte → utána):

| Kaszt | Raktár | Mézország | Égtorony | Mélység | Jeltörő | Lőtér | Horizont + Szingularitás |
|---|---|---|---|---|---|---|---|
| Pengelovag | 1.6 → 0.0 | 0.3 → 0.3 | 2.3 → 0.3 | 1.0 → 0.7 | 2.0 → 3.4 | 3.7 → 1.0 | 22.6 → 4.6 |
| Elementalista | 1.3 → 0.0 | 0.7 → 1.3 | 2.0 → 1.0 | 1.3 → 0.0 | 6.0 → 2.3 | 0.6 → 1.3 | 6.7 → 0.7 |
| Mesterlövész | 1.6 → 1.0 | 0.0 → 0.3 | 1.0 → 1.0 | 0.3 → 0.0 | 3.4 → 1.6 | 2.0 → 2.3 | 2.9 → 4.2 |
| Mérnök | 0.9 → 2.0 | 0.6 → 0.3 | 2.0 → 1.3 | 0.0 → 0.0 | 0.3 → 0.6 | 1.6 → 1.0 | 4.3 → 0.0 |

Értelmezés:
- **Teljesíthetőség:** mind a 12 futás végigér; előtte a Pengelovag 3-ból csak 1-szer.
- **Lemaradás:** a játékos már nem marad le a végjátékban (előtte −3…−4 az Eseményhorizontban, most −1…0). Az átlagjátékosnak nem kell farmolnia.
- **Mai halálokok:** a halálok többsége az Ősökre esik (Szputnyik Hangja, M87*, Ősfelügyelő). Szándékosan maradtak aránytalanul erősek. Ezek akkor ölnek, ha a bot belefut egybe, de már el lehet menekülni előlük.
- **Nyitott pont:** az első két világ továbbra is túl könnyű (+3…+4 szint előny, alig halál). Az első óra tétje gyenge maradt. Lásd a „Kihagyva” részt.

## 5. Kihagyva, szándékosan

- **Az első két világ nehezítése.** Az előny nagy része a fő küldetések jutalmából jön. Ha erre hangolok, a Pengelovag eleje lesz frusztráló (őt a bot is a legtöbbször a közelharci belépésnél veszti el). Előbb élő játékosokkal érdemes megnézni, mennyi előny esik jól.
- **Mézország, Mélység, Jeltörő, Lőtér, Eseményhorizont mechanikái.** A méztócsa, a láva, a statikus mező, a rakéta-becsapódás és a W-tengely már most is más viselkedést kér (lassít, kerülni kell, kiszívja a manát, mozgásra késztet, váltani kell). A Raktár és az Égtorony volt tisztán kozmetikus, ezért azokhoz nyúltam.
- **Ősök saját viselkedése.** A brief szerint maradjanak aránytalanok. Pórázt és felfigyelést kaptak, hogy ne csapdák legyenek, saját MI-t nem.
- **Kapcsolatok és házasság.** A rendszer önmagában rendben van, a többihez az otthon kényelmén és a pék házastárs étel-bónuszán keresztül kapcsolódik. Mélyebb bekötés (pl. házastárs-reakciók az expedícióra) új tartalom lenne, felírtam az ÖTLETEK.md-be.
- **A bot korlátai.** A bot nem tölti ki a Próbaköveket és nem főz, a Morse-zárat 6 mp alatt „megfejti”, az EH lejáratánál pedig tudja a W-t (mintha elolvasta volna a jeladót). A mérés tehát a fő szál teljesíthetőségéről szól, nem az opcionális tartalomról.

## 6. Ellenőrzés

- `node tools/smoke.js` minden commit előtt: régi (1.0-s) mentés migrál, minden világ minden szintje és bossa betölt, plusz a Szingularitás, a Hasadék, a város és az otthon, JS-hiba nélkül.
- Képernyőképek: előjelzések (ék, célzóvonal), képességfa az utakkal, Próbakő, párbeszéd, boss-bejelentés, tooltip-összehasonlítás.
- A multiverzum-integráció kulcsai (`univerzum-naplo`, `multiverzum-bajnoksag-r4w8`, `kp:*`) nem változtak.
