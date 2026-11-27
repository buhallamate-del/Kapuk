# Kapuk – Multiverzum RPG

Felülnézetes akció-RPG a böngészőben. A világok között van egy város, Kapuváros: innen nyílik minden kapu a szerző többi játékának világaiba.

Játszható a böngészőben: https://buhallamate-del.github.io/Kapuk/

Egyetlen fájl (`index.html`), a mentés a böngésző helyi tárhelyén él (3 mentési hely, export/import a menüben).

## Mi van benne

- **Négy kaszt, saját erőforrással.** A Pengelovag közelharcos, **Dühe** ütéssel töltődik. Az Elementalista mágus, **Manával** dolgozik. A Mesterlövész lőfegyveres, **Belső időt** használ. A Mérnök drónokat és lövegtornyokat épít, **Árammal** működik. Kasztonként 10 képesség van (aktív, passzív, végső és erőforrás-képesség), a fegyverek között van kard, pöröly, láncfűrész, pálca, varázsbot, pisztoly, puska, sörétes, rakétavető és plazmavető.
- **Hét világ és a végtelen.** A Végtelen Raktár, Mézország, az Égtorony, a Mélység, a Jeltörő-állomás, a Kísérleti Lőtér és az Eseményhorizont, mindegyik saját mechanikával: polcsorok és targoncák, méztócsák és kaptárak, széllökések, láva, Morse-zárak, rakéta-becsapódások, a W-tengely és a fázisfalak. Mindegyik világ végén vár egy boss, külön mintákkal (láncok, antennák, gravitáció, tükörharc). A történet után megnyílik a Végtelen Hasadék, a Rémálom és a Pokol nehézség.
- **Ősök.** Minden világban kóborol egy indokolatlanul erős lény, 28–40 szinttel a terület fölött. Aki legyőzi, Tiltott pecsétet kap, a pecsétekért pedig szándékosan kiegyensúlyozatlan **Tiltott képességek** járnak: Világvágás, Zsebszingularitás, Végítélet-tár, Szürke Gú, 440 dB és Ősforma.
- **Zsákmány.** Öt ritkaság van, 30+ affix és 18 ereklye a multiverzumból (Nagyi papucsa, Kurta crop topja, Tesszerakt-bot, Penrose-kesztyű…). A tárgyak kovácsolással +10-ig erősíthetők, szétszedhetők és cserélhetők.
- **Gyűjtés és kézművesség.** Érc, fa, bőr, vászon, gyógyfű és kristály, minden világnak saját alapanyaga is van. A kovács ezekből fegyvert, ruhát, páncélt, ékszert és artefaktumot készít. Nagyi négyféle varázsitalt főz.
- **Túlélés.** Az éhség, a szomjúság és a fáradtság mellett az állóképesség is fogy (kitérés, sprint). Étel és ital a szörnyeknél, Nagyinál és a kocsmában van. Aludni a kocsmában, sátorban vagy otthon lehet.
- **Otthon.** Telket lehet venni, és a Simshez hasonló építő módban falat, padlót, bútort és kertet rakni. A bútoroknak funkciójuk is van: ágy, konyha, munkapad, üst, szekrény, trófeafal, méhes, veteményes, kút. A kényelem Kipihent áldást ad.
- **Kapcsolatok és házasság.** Négy lakóval lehet beszélgetni, ajándékot adni és randevúzni, végül gyűrűvel megkérni a kezüket. A házastárs beköltözik és naponta segít.
- **30 küldetés, napi megbízások, Toldaléktorony-feladványok.**

## Multiverzum

A Kapuk a szerző többi játékával közös naplót vezet (`univerzum-naplo` a böngésző helyi tárhelyén): Eseményhorizont, Kísérleti Lőtér, Raktár 3D, Égtorony, Mézország, Mélység, Jeltörő, Toldaléktorony, Kurta szimulátor.

- **A lakók a többi világból jönnek:** a Leltáros, a Méhész, Nagyi, a Főkonstruktőr, a Fúrómester, a Kezelő, a Pilóta, Kurta, Öreg Bodor, a Nyelvész és Vörös Kende. Valódi tudnivalókat mesélnek a saját játékukról, például hogy a fekete lyukban melyik W-tartományban van a tesszerakt, vagy melyik frekvencián szól a Jeltörő üzenete.
- **Ajándékok:** amit a többi játékban elértél (a horizonton túl, a Föld közepén, a 440 dB-nél, a Szív megrepesztésekor…), azért itt egyszeri ajándék jár, és a lakók emlékeznek rá.
- **Saját események a naplóban:** `kp:jart`, `kp:<boss>`, `kp:os:<ős>`, `kp:vege`, `kp:uzenet`, `kp:hazassag`, `kp:nyelv`.
- **Más világok:** a Kezelőnél és a Pilótánál kapuk vezetnek a többi játékba.
- **A fekete lyukból:** Kapuváros titkos bébi-univerzum az Eseményhorizont 4D terében. A buborékba érve a játék beágyazva nyílik meg (`?from=eh`), a Pilóta kapuja pedig visszaküld a fekete lyukba. A megtalálásért (`eh:egg:kapuk`) ajándék jár. Így a lánc körbeér: Raktár 3D → pohármosó fekete lyuka → Eseményhorizont → Kapuk.
- **Heti Hasadék:** mindenkinek ugyanaz a pálya a héten, a rangsor a közös `multiverzum-bajnoksag-r4w8` csatornán megy (játékkód: `kp`, nyilvános MQTT üzenetközvetítő, HiveMQ). A könyvtár: `vendor/mqtt/` (MIT licenc).

## Mélység (elmélyítés, 1. kör)

- **Harc:** hitstop, súlyos találatok, olvasható előjelzések, kardkombó, tökéletes kitérés.
- **Kasztutak:** kasztonként két, egymást kizáró út 6. szinttől, és kölcsönhatások (düh-küszöbök, elemi reakciók, Fókusz, gép-hálózat).
- **Expedíció:** minél messzebb a Kaputól, annál erősebbek a szörnyek, és annál többet ér a zsákmány. Az útinapló TP-je csak élve hazaérve számít.
- **Próbakő, Kihívás-létra, Ciklusok:** mindig van következő kihívás, a történetnek nincs vége.
- **Bossok:** megtanulható mintasorrend, bejelentett támadások, 2. fázis saját támadással.
- **Tárgyak:** áldozat-affixek, mesterjegy, átkovácsolás. Az étel hatást ad, a házi koszt többet.
- **Lakók:** reagálnak arra, amit csinálsz, egymást is szapulják, és van, aki többet tud rólad, mint kellene.

Tesztek: `node tools/smoke.js` (füstteszt), `node tools/bot.js <címke>` (átlagjátékos-bot, egyensúlymérés). A részletek az `ELMELYITES.md`-ben vannak.

## Irányítás

WASD mozgás · egér célzás · bal gomb támadás · jobb gomb és 1–4 képességek · V Kapukő · Space kitérés · Shift sprint · E interakció · Q gyógyital · 6–9 elixírek · B artefaktum · H/G evés/ivás · N sátor · T kapu haza · U építés (otthon) · I/C/K/J/M panelek · Z/X W-eltolás az Eseményhorizontban · F1 súgó

## Fejlesztés

A forrás a `src/` mappában van, fájlonként: adatok, képességek, térkép, harc, MI, megjelenítés, felület, otthon. Az `index.html` ebből készül:

```
python3 build.py
```
