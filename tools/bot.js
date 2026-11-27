// Átlagjátékos-bot: node tools/bot.js <címke> [kasztok] [magok]
// Pl.: node tools/bot.js elotte penge,elem,loves,mernok 1,2,3
// Eredmény: tools/bot-results/<címke>.json és <címke>.md (összesítő táblázat).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const label = process.argv[2] || 'proba', classes = (process.argv[3] || 'penge,elem,loves,mernok').split(','), seeds = (process.argv[4] || '1,2,3').split(',').map(Number);
const out = path.resolve(__dirname, 'bot-results'); fs.mkdirSync(out, { recursive: true });
async function one(cls, seed) {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + path.resolve(__dirname, '../index.html')); await pg.waitForTimeout(200);
  await pg.evaluate(src => __eval(src), fs.readFileSync(path.resolve(__dirname, 'bot_core.js'), 'utf8'));
  await pg.evaluate(([c, s]) => __eval(`BOT.init('${c}', { seed: ${s} })`), [cls, seed]);
  let st; for (;;) { st = await pg.evaluate(() => __eval('BOT.run(300)')); if (st.finished || st.time > 5 * 3600) break; }
  const rep = await pg.evaluate(() => __eval('BOT.report()')); rep.seed = seed; rep.errs = [...new Set(errs)].slice(0, 10); rep.botErr = st.err;
  await b.close(); process.stdout.write(`${cls}/${seed}: ${Math.round(rep.time / 60)} perc, ${rep.lvl}. szint, halál ${rep.res.reduce((a, x) => a + x.deaths, 0)}, út ${rep.st.path || '–'}, tökéletes kitérés ${rep.st.perfect}, reakció ${rep.st.reactions}${rep.gaveUp ? ' – ELAKADT ' + rep.gaveUp : ''}\n`); return rep;
}
(async () => {
  const jobs = []; for (const c of classes) for (const s of seeds) jobs.push([c, s]);
  const reps = []; const N = 6; // párhuzamos böngészők
  for (let i = 0; i < jobs.length; i += N) reps.push(...await Promise.all(jobs.slice(i, i + N).map(([c, s]) => one(c, s))));
  fs.writeFileSync(`${out}/${label}.json`, JSON.stringify(reps));
  // összesítés kasztonként, szakaszonként (átlag a magokon)
  let md = `# Botmérés: ${label} (${seeds.length} mag/kaszt)\n`;
  const errs = [...new Set(reps.flatMap(r => r.errs.concat(r.botErr ? ['bot: ' + r.botErr.slice(0, 160)] : [])))]; if (errs.length) md += `\nHibák: ${errs.join(' | ')}\n`;
  for (const c of classes) {
    const rs = reps.filter(r => r.cls === c); const keys = [...new Set(rs.flatMap(r => r.res.map(x => x.k)))];
    const fin = rs.filter(r => !r.gaveUp).length;
    md += `\n## ${CN[c]} – végigért: ${fin}/${rs.length} · átl. ${Math.round(avg(rs.map(r => r.time)) / 60)} perc · halál összesen átl. ${avg(rs.map(r => r.res.reduce((a, x) => a + x.deaths, 0))).toFixed(1)} · végszint átl. ${avg(rs.map(r => r.lvl)).toFixed(1)}\n`;
    md += '| szakasz | halál (átl.) | perc (átl.) | játékos szintje a végén | terület szintje | különbség |\n|---|---|---|---|---|---|\n';
    for (const k of keys) {
      const xs = rs.map(r => r.res.find(x => x.k === k)).filter(Boolean); const lv = avg(xs.map(x => x.lvlOut || x.lvlIn)), ar = avg(xs.map(x => x.area));
      md += `| ${k}${xs.length < rs.length ? ` (${xs.length}/${rs.length})` : ''} | ${avg(xs.map(x => x.deaths)).toFixed(1)} | ${(avg(xs.map(x => x.t)) / 60).toFixed(1)} | ${lv.toFixed(1)} | ${ar.toFixed(0)} | ${(lv - ar >= 0 ? '+' : '') + (lv - ar).toFixed(1)} |\n`;
    }
    for (const r of rs) if (r.gaveUp) md += `\n> ${c}/${r.seed} elakadt: ${r.gaveUp}\n`;
  }
  fs.writeFileSync(`${out}/${label}.md`, md); console.log(md);
})();
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const CN = { penge: 'Pengelovag', elem: 'Elementalista', loves: 'Mesterlövész', mernok: 'Mérnök' };
