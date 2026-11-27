// Képernyőkép egy beállított jelenetről: node tools/shot.js kimenet.png "<előkészítő kód>" [lépések] ["<feltétel, amíg lépünk>"]
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const [out, setup, steps = '60', until = 'false'] = process.argv.slice(2);
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + path.resolve(__dirname, '../index.html')); await pg.waitForTimeout(200);
  await pg.evaluate(() => __eval(`(() => { localStorage.clear(); const S = newSave('penge', 'Kép'); Save.write(0, S); Menu.startWith(S, 0); UI.acts.closeOver(); UI.overUI = false; })()`));
  await pg.evaluate(s => __eval(s), setup);
  await pg.evaluate(([n, u]) => __eval(`for (let i = 0; i < ${n}; i++) { G.update(1/60); if (${u}) break; } R.frame(); UI.hud();`), [steps, until]);
  await pg.screenshot({ path: out }); await b.close();
  if (errs.length) console.log('HIBA: ' + errs.join(' | ')); else console.log('kép: ' + out);
})();
