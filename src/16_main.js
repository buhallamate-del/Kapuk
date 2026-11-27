// ============================================================
//  FŐMENÜ, KARAKTERKÉSZÍTÉS, FŐCIKLUS
// ============================================================
const Menu = {
  sel: 'penge',
  show() {
    G.scene = 'menu'; $('#hud').style.display = 'none'; const m = $('#menu'); m.style.display = 'flex';
    let h = `<div class="box"><h1 class="title h">KAPUK</h1><div class="sub">Multiverzum RPG · a világok közötti város · v${VERZIO}</div><div class="slots">`;
    for (let i = 0; i < 3; i++) {
      const S = Save.read(i);
      h += S ? `<div class="slot" data-a="load" data-i="${i}"><div class="h" style="font-size:17px">${esc(S.nev)}</div><div>${CLASSES[S.cls].ikon} ${CLASSES[S.cls].nev} · ${S.lvl}. szint</div><div class="small">${Math.floor(S.playtime / 3600)} ó ${Math.floor(S.playtime % 3600 / 60)} p · ${S.prog.unlocked.length} világ · ${S.pecset} pecsét</div><div style="margin-top:6px"><button class="sm" data-a="load" data-i="${i}">Folytatás</button> <button class="sm" data-a="delSlot" data-i="${i}">Törlés</button></div></div>`
        : `<div class="slot" data-a="newSlot" data-i="${i}"><div class="h" style="font-size:17px">Üres hely</div><div class="small" style="margin-top:20px">+ Új karakter</div></div>`;
    }
    h += `</div><div class="small">A játék mentése a böngésződben él. A többi játékommal közös naplót vezet: ha ugyanazon a webcímen játszottál már az Eseményhorizonttal, a Mélységgel, a Kurtával vagy a többivel, itt ajándék vár.</div></div>`;
    m.innerHTML = h;
  },
  newChar(i) {
    this.slot = i; const m = $('#menu');
    let h = `<div class="box"><h2 class="h" style="font-size:30px">Új karakter</h2><div class="clsg">`;
    for (const k in CLASSES) { const C = CLASSES[k], R = RESOURCES[k]; h += `<div class="cls ${this.sel === k ? 'on' : ''}" data-a="pickCls" data-c="${k}"><div class="i" style="color:${C.szin}">${C.ikon}</div><div class="h" style="font-size:15px">${C.nev}</div><div style="margin:4px 0">${C.leiras}</div><div class="small" style="color:${R.c}">${R.ikon} ${R.nev}: ${R.desc}</div></div>`; }
    h += `</div><div style="margin:10px 0"><input id="cname" maxlength="20" placeholder="A hősöd neve" value="${esc(localStorage.getItem('multiverzum-nev') || '')}"> <button class="pri" data-a="create">Indulás</button> <button data-a="back">Vissza</button></div></div>`;
    m.innerHTML = h;
  },
};
Object.assign(UI.acts, {
  load(d) { const S = Save.read(+d.i); if (!S) return; Menu.startWith(S, +d.i); },
  newSlot(d) { Menu.newChar(+d.i); },
  delSlot(d, e) { e.stopPropagation(); if (confirm('Biztosan törlöd ezt a karaktert?')) { Save.del(+d.i); Menu.show(); } },
  pickCls(d) { Menu.sel = d.c; Menu.newChar(Menu.slot); },
  create() { const nev = ($('#cname').value || '').trim() || 'Vándor'; const S = newSave(Menu.sel, nev); Save.write(Menu.slot, S); Menu.startWith(S, Menu.slot); },
  back() { Menu.show(); },
  resume() { UI.closeAll(); },
  quitMenu() { G.autosave(); UI.closeAll(); G.scene = 'menu'; G.map = null; Menu.show(); },
  vol(d, e) { Audio2.setVol(+e.target.value); },
  mute() { Audio2.muted = !Audio2.muted; Audio2.setVol(Audio2.vol); UI.acts.menuOpen.call(UI); },
  menuOpen() {
    UI.closeAll(); UI.open = 'pMenu'; G.paused = true; $('#pMenu').style.display = 'block';
    $('#pMenu').innerHTML = UI.hd('Menü') + `<div class="bd"><div class="dlg-opts"><button class="pri" data-a="resume">Folytatás</button><button data-a="help">Súgó és billentyűk</button><button data-a="mute">${Audio2.muted ? 'Hang be' : 'Hang ki'}</button><div class="row"><span>Hangerő</span><input type="range" min="0" max="1" step="0.05" value="${Audio2.vol}" oninput="this.dispatchEvent(new CustomEvent('volc',{bubbles:true}))" id="volr"></div><button data-a="export">Mentés exportálása</button><button data-a="import">Mentés importálása</button><button data-a="quitMenu">Mentés és kilépés a főmenübe</button></div><div class="small" style="margin-top:8px">Automatikus mentés 30 másodpercenként és minden pályaváltáskor.</div></div>`;
    $('#volr').addEventListener('input', e => Audio2.setVol(+e.target.value));
  },
  help() {
    UI.closeAll(); UI.open = 'pMenu'; G.paused = true; $('#pMenu').style.display = 'block';
    $('#pMenu').innerHTML = UI.hd('Súgó') + `<div class="bd small" style="font-size:12px;line-height:1.6;color:var(--tx)">
<b class="h">Irányítás</b><br>WASD – mozgás · egér – célzás · bal gomb – alaptámadás (a fegyvered szerint közelharc, mágia vagy lövés) · jobb gomb és 1–4 – képességek · V – Kapukő-képesség · Space – kitérés (állóképesség) · Shift – sprint<br>E – beszélgetés, láda, gyűjtés · Q – gyógyital · 6/7/8/9 – elixírek · B – artefaktum · H – evés · G – ivás · N – sátor · T – kapu haza (csatornázás)<br>I – táska · C – karakter · K – képességek · J – napló · M – térkép · Alt – tárgycímkék · Esc – menü<br>Az Eseményhorizontban: Z / X – eltolás a W-tengelyen
<br><br><b class="h">Fejlődés</b><br>Szintenként 5 tulajdonságpont (Erő, Ügyesség, Akarat, Kitartás, Állóképesség) és 1 képességpont. A világok urai Kapukő-képességet adnak. Az Ősök – a világok 2–3. szintjén kóborló, 25–40 szinttel erősebb lények – Tiltott pecsétet, a pecsétek szándékosan túl erős Tiltott képességeket.
<br><br><b class="h">Túlélés</b><br>Éhség, szomjúság és fáradtság. 30 alatt gyengülsz, nullán sebződsz. Ételt és italt a szörnyek is ejtenek; Nagyi és Kurta árulnak. Alvás: kocsma vagy sátor (N) egy kitakarított teremben.
<br><br><b class="h">Kézművesség</b><br>Az alapanyagot a kazamatákban gyűjtöd (ércér, fakupac, gyógyfű, kristálytelér, vászonbála – E), bőrt az állatszerű lényektől. A Főkonstruktőr készít belőle tárgyat, minden világ saját anyagával egy fokkal jobbat. Nagyi elixírt főz.
<br><br><b class="h">Multiverzum</b><br>A játék a szerző többi játékával közös naplót vezet (univerzum-naplo). Amit ott elértél, itt ajándékot ad, és a város lakói emlékeznek rá.</div>`;
  },
  export() { const s = JSON.stringify(G.S); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([s], { type: 'application/json' })); a.download = `kapuk-${G.S.nev}.json`; a.click(); },
  import() { const i = document.createElement('input'); i.type = 'file'; i.accept = '.json'; i.onchange = async () => { try { const S = JSON.parse(await i.files[0].text()); Save.migrate(S); Save.write(G.slot, S); location.reload(); } catch (e) { UI.toast('Hibás mentésfájl.', '#ff7a7a'); } }; i.click(); },
});
Menu.startWith = function (S, slot) {
  $('#menu').style.display = 'none'; $('#hud').style.display = 'block'; Audio2.unlock();
  G.start(S, slot); UI.dirty = true;
  if (/github\.io$/.test(location.hostname)) Univ.connect();
};

// ---------- billentyűk ----------
function handleKeys() {
  if (G.scene !== 'play') return;
  const k = Input;
  if (k.hit('Escape')) { if ($('#over').style.display === 'flex') { } else if (Home.build) UI.acts.hmBuildOff(); else if (UI.open) UI.closeAll(); else UI.acts.menuOpen.call(UI); }
  if (k.hit('i')) UI.toggle('pInv', UI.renderInv);
  if (k.hit('c')) UI.toggle('pChar', UI.renderChar);
  if (k.hit('k')) UI.toggle('pSkill', UI.renderSkills);
  if (k.hit('j')) UI.toggle('pQuest', UI.renderQuest);
  if (k.hit('m')) UI.toggle('pMap', UI.renderMap);
  if (k.hit('F1')) { UI.keyHelp = !UI.keyHelp; UI.dirty = true; }
  if (k.hit('u')) Home.toggleBuild();
  if ((UI.open && UI.open !== 'build') || G.paused || G.P.dead) return;
  if (k.hit('e')) G.interact();
  if (k.hit('q')) G.drinkPotion();
  if (k.hit('h')) autoEat('kaja');
  if (k.hit('g')) autoEat('ital');
  if (k.hit('n')) G.pitchTent();
  if (k.hit('t')) G.townPortal();
  if (k.hit('b')) useArtifact();
  for (const id in ELIX) if (k.hit(ELIX[id].key)) drinkElix(id);
  if (k.hit('5') && G.S.slots[0]) G.useSlot(0);
}

// ---------- főciklus ----------
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  try {
    if (G.scene === 'play' && G.map) {
      handleKeys();
      if (!G.paused && $('#over').style.display !== 'flex') G.update(dt);
      else if (UI.sleepT > 0) { }
      if (UI.sleepT > 0) UI.sleepT -= dt;
      R.frame(); UI.hud();
    }
  } catch (e) { console.error(e); if (!loop.err) { loop.err = 1; UI.toast('Hiba: ' + e.message, '#ff5555', 8); } }
  Input.endFrame();
  requestAnimationFrame(loop);
}

// ---------- indulás ----------
function boot() {
  const c = $('#c'); Input.init(c); R.init(c); UI.init();
  Menu.show();
  requestAnimationFrame(loop);
  addEventListener('beforeunload', () => G.autosave());
  window.__G = G; window.__eval = s => eval(s); // hibakereséshez
}
boot();
