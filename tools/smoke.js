// Headless füstteszt: minden világ minden szintje és bossa betölt, nincs JS-hiba.
// Futtatás: node tools/smoke.js [képernyőkép-mappa]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const shots = process.argv[2] || null;
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
  pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.goto('file://' + path.resolve(__dirname, '../index.html'));
  await pg.waitForTimeout(300);
  // régi (1.0-s) mentés szimulálása: a migrációnak el kell bírnia
  await pg.evaluate(() => __eval(`(() => { const S = newSave('penge', 'Teszt'); delete S.surv; delete S.elix; delete S.forbidden; delete S.pecset; S.attrs.allo = undefined; delete S.build; Save.write(0, S); })()`));
  await pg.evaluate(() => __eval(`(() => { const S = Save.read(0); Menu.startWith(S, 0); UI.acts.closeOver(); })()`));
  const step = n => pg.evaluate(n => __eval(`for (let i = 0; i < ${n}; i++) G.update(1/30); R.frame(); UI.hud();`), n);
  await step(30);
  const classes = ['penge', 'elem', 'loves', 'mernok'];
  const regs = await pg.evaluate(() => __eval(`REGIONS.map(r => [r.id, r.floors])`));
  let ci = 0;
  for (const [rid, floors] of regs) {
    for (let f = 1; f <= floors; f++) {
      const cls = classes[ci++ % 4];
      await pg.evaluate(([rid, f, cls]) => __eval(`(() => { const S = newSave('${cls}', 'T'); S.lvl = REGION['${rid}'].lvl + ${f}; S.prog.unlocked = REGIONS.map(r => r.id); G.S = S; G.P = makePlayer(S); G.godmode = true; G.enterDungeon('${rid}', ${f}); if (G.boss) { G.P.x = G.boss.x; G.P.y = G.boss.y + 160; } })()`), [rid, f, cls]);
      await step(150);
      if (shots && f === floors) await pg.screenshot({ path: `${shots}/boss_${rid}.png` });
    }
  }
  // szingularitás + hasadék + város + otthon
  await pg.evaluate(() => __eval(`(() => { G.S.prog.bosses.onmagad = 1; G.enterDungeon('eh', 5); G.P.x = G.boss.x; G.P.y = G.boss.y + 200; })()`)); await step(150);
  await pg.evaluate(() => __eval(`G.enterHasadek(5, false)`)); await step(90);
  await pg.evaluate(() => __eval(`(() => { G.godmode = false; G.enterTown(); })()`)); await step(60);
  if (shots) await pg.screenshot({ path: `${shots}/town.png` });
  await pg.evaluate(() => __eval(`(() => { G.S.gold = 9999; Home.S().owned = true; Home.S().cells = Home.starter(); Home.enter(); })()`)); await step(30);
  await b.close();
  if (errs.length) { console.log('HIBÁK:\n' + [...new Set(errs)].join('\n')); process.exit(1); }
  console.log('OK – minden szint, boss, város és otthon betölt, nincs JS-hiba.');
})();
