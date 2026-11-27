// ============================================================
//  FELHASZNÁLÓI FELÜLET
// ============================================================
const UI = {
  dirty: true, minimapDirty: true, overUI: false, open: null, sleepT: 0, shop: null,
  init() {
    document.addEventListener('mousemove', e => {
      this.overUI = !!e.target.closest('.panel,.int,#menu,#over');
      const tt = $('#tt'); if (tt.style.display === 'block') { tt.style.left = Math.min(innerWidth - 330, e.clientX + 16) + 'px'; tt.style.top = Math.min(innerHeight - tt.offsetHeight - 8, e.clientY + 12) + 'px'; }
    });
    document.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) { Audio2.unlock(); Audio2.play('ui'); this.act(b.dataset.a, b.dataset, e); } });
    document.addEventListener('contextmenu', e => { const b = e.target.closest('[data-r]'); if (b) { e.preventDefault(); this.act(b.dataset.r, b.dataset, e); } });
    document.addEventListener('mouseover', e => { const b = e.target.closest('[data-tt]'); if (b) this.showTT(b.dataset.tt, b.dataset); });
    document.addEventListener('mouseout', e => { const b = e.target.closest('[data-tt]'); if (b) $('#tt').style.display = 'none'; });
    this.mm = $('#mm').getContext('2d');
  },
  // ---------- tooltip ----------
  findItem(src, i) { const S = G.S; if (src === 'inv') return S.inv[i]; if (src === 'stash') return S.stash[i]; if (src === 'eq') return S.eq[i]; if (src === 'shop') return this.shopItems && this.shopItems[i]; return null; },
  showTT(kind, d) {
    const tt = $('#tt'); let h = '';
    if (kind === 'item') { const it = this.findItem(d.src, d.i); if (!it) return; const cmp = d.src !== 'eq' ? G.S.eq[BASES[it.base].slot] : null; h = itemTooltip(it, cmp); if (d.src === 'shop') h += `<div class="tt-v">Ár: ${fmt(itemValue(it) * 4)} arany</div>`; if (d.src === 'inv') h += `<div class="small">Bal klikk: felvesz · Jobb klikk: ${this.shop === 'bolt' ? 'elad' : this.shop === 'kovacs' ? 'szétszed' : this.shop === 'raktar' ? 'tárhelybe' : 'eldob'}</div>`; }
    else if (kind === 'skill') { const sk = G.skillById(d.id) || GATESKILLS[d.id]; if (!sk) return; const r = Math.max(1, skillRank(G.P, d.id)); h = `<div class="tt-n">${sk.ikon} ${sk.nev}</div><div class="tt-s">${sk.tipus === 'passziv' ? 'Passzív' : FORBIDDEN[d.id] ? 'TILTOTT' : GATESKILLS[d.id] ? 'Kapukő-képesség' : 'Aktív'}${sk.req ? ` · ${sk.req}. szinttől` : ''}</div><div>${typeof sk.desc === 'function' ? sk.desc(r) : sk.desc}</div>`; if (sk.cost != null && sk.tipus !== 'passziv') h += `<div class="tt-g">Költség: ${typeof sk.cost === 'function' ? sk.cost(r) : sk.cost} ${resName(G.S.cls).toLowerCase()}${sk.cd ? ` · újratöltés ${(typeof sk.cd === 'function' ? sk.cd(r) : sk.cd).toFixed(1)} mp` : ''}</div>`; }
    else if (kind === 'txt') h = d.t;
    tt.innerHTML = h; tt.style.display = 'block';
  },
  // ---------- értesítés ----------
  toast(msg, c = '#e8dcc0', dur = 2.5) {
    const box = $('#toasts'); if (!box) return; const el = document.createElement('div'); el.className = 'toast'; el.style.color = c; el.style.borderColor = c + '66'; el.textContent = msg; box.appendChild(el);
    while (box.children.length > 5) box.firstChild.remove();
    setTimeout(() => { el.style.transition = 'opacity .4s'; el.style.opacity = 0; setTimeout(() => el.remove(), 400); }, dur * 1000);
  },
  setRegion(n, s) { $('#rname').textContent = n; $('#rsub').textContent = s; },
  bossBar(e) { const b = $('#boss'); this.bossE = e; if (!e) { b.style.display = 'none'; return; } b.style.display = 'block'; b.querySelector('.nm').textContent = e.nameTxt; b.querySelector('.ct').textContent = (e.bossDef && e.bossDef.cim) || ''; },
  // ---------- HUD frissítés ----------
  hud() {
    const P = G.P, S = G.S; if (!P) return; const C = CLASSES[S.cls], RS = RESOURCES[S.cls];
    const hp = $('#ohp'); hp.querySelector('.f').style.height = (P.hp / P.mhp * 100) + '%'; hp.querySelector('.t').innerHTML = `${Math.ceil(P.hp)}<small>/ ${P.mhp}${P.shieldV > 1 ? ` +${Math.round(P.shieldV)}` : ''}</small>`;
    const mp = $('#omp'); mp.querySelector('.f').style.height = (P.mp / P.mmp * 100) + '%'; mp.querySelector('.f').style.background = `linear-gradient(${RS.c},#111)`; mp.querySelector('.t').innerHTML = `${Math.floor(P.mp)}<small>${RS.nev}</small>`;
    $('#xp div').style.width = (S.lvl >= MAX_LVL ? 100 : S.xp / xpNeed(S.lvl) * 100) + '%';
    $('#stab div').style.width = (P.sta / P.msta * 100) + '%';
    $('#gold').textContent = `${fmt(S.gold)} arany · ${S.lvl}. szint`;
    // képességsor
    const keys = ['JG', '1', '2', '3', '4'];
    let h = '';
    for (let i = 0; i < 5; i++) {
      const id = S.slots[i], sk = id && G.skillById(id);
      const cd = id ? Math.max(0, P.cds[id] || 0) : 0, mx = id && P.cdMax ? P.cdMax[id] || 1 : 1;
      let cost = sk && sk.cost != null ? (typeof sk.cost === 'function' ? sk.cost(Math.max(1, skillRank(P, id))) : sk.cost) : 0; if (sk && sk.spendPct) cost = Math.round(P.mmp * sk.spendPct);
      const no = sk && P.mp < cost;
      h += `<div class="sk int ${no ? 'no' : ''} ${FORBIDDEN[id] ? 'forb' : ''} ${sk && sk.toggle && P.bulletTime ? 'forb' : ''}" data-tt="skill" data-id="${id || ''}" data-a="openSkills"><span class="k">${keys[i]}</span>${sk ? sk.ikon : ''}${cd > 0 ? `<div class="cd" style="height:${cd / mx * 100}%"></div><div class="cdt">${cd.toFixed(cd < 3 ? 1 : 0)}</div>` : ''}</div>`;
    }
    const gid = S.gate, gs = gid && GATESKILLS[gid], gcd = gid ? Math.max(0, P.cds['g_' + gid] || 0) : 0;
    h += `<div class="sk int" style="border-color:#d27bff" data-tt="skill" data-id="${gid || ''}" data-a="openSkills"><span class="k">V</span>${gs ? gs.ikon : '·'}${gcd > 0 ? `<div class="cd" style="height:${gcd / (P.cdMax['g_' + gid] || 1) * 100}%"></div><div class="cdt">${gcd.toFixed(0)}</div>` : ''}</div>`;
    if (this._sb !== h) { $('#skillbar').innerHTML = h; this._sb = h; }
    // gyorssáv
    let q = `<div class="sk int" data-tt="txt" data-t="Gyógyital (Q) – ${S.potions}/${G.potMax()}"><span class="k">Q</span>❤<span class="n">${S.potions}</span></div>`;
    for (const k in ELIX) q += `<div class="sk int ${S.elix[k] ? '' : 'no'}" data-tt="txt" data-t="${ELIX[k].nev} (${ELIX[k].key}) – ${ELIX[k].desc}"><span class="k">${ELIX[k].key}</span><span style="color:${ELIX[k].c}">⚗</span><span class="n">${S.elix[k] || 0}</span></div>`;
    const ar = S.eq.artefakt; q += `<div class="sk int ${ar ? '' : 'no'}" data-tt="txt" data-t="Artefaktum (B)${ar ? ' – ' + esc(ar.nev) : ' – nincs'}"><span class="k">B</span>${ar ? BASES[ar.base].ikon : '◇'}${P.artiCd > 0 ? `<div class="cd" style="height:${P.artiCd / 50 * 100}%"></div><div class="cdt">${Math.ceil(P.artiCd)}</div>` : ''}</div>`;
    if (this._q !== q) { $('#quick').innerHTML = q; this._q = q; }
    // túlélés
    const sv = S.surv; const bar = (ic, nm, v, c) => `<div class="sv" title="${nm}"><b>${ic}</b><div class="bar"><div style="width:${v}%;background:${v < 30 ? '#ff5a5a' : c}"></div></div><span>${Math.round(v)}</span></div>`;
    const s2 = bar('🍖', 'Jóllakottság (H: evés)', sv.kaja, '#e0a050') + bar('💧', 'Szomjúság (G: ivás)', sv.ital, '#4f8dff') + bar('🌙', 'Éberség (N: sátor, kocsma: alvás)', sv.ebren, '#b08ae0');
    if (this._sv !== s2) { $('#surv').innerHTML = s2; this._sv = s2; }
    // buffok
    const bf = P.buffs.map(b => `<span class="bf">${{ csata: '📯', tombol: '😡', ital: '❤', shrine: '✨', szokes: '🛰', javit: '🔧', bika: '🐂', vegitelet: '♾', menekul: '↶', tulfesz: '🌩', magma: '🌋' }[b.id] || (b.id.startsWith('elix_') ? '⚗' : '•')} ${Math.ceil(b.t)}</span>`).join('') + (P.bulletTime ? '<span class="bf" style="color:#f2d36b">⏱ Golyóidő</span>' : '') + (S.forbidden.includes('osforma') ? '<span class="bf" style="color:#ff3355">☠ Ősforma</span>' : '');
    if (this._bf !== bf) { $('#buffs').innerHTML = bf; this._bf = bf; }
    // csatorna, W
    $('#chan').textContent = P.chan ? `${P.chan.label} ${Math.round(P.chan.t / P.chan.dur * 100)}%` : '';
    $('#wind').textContent = G.map && G.map.mech === 'eh' ? `W = ${P.w > 0 ? '+' : ''}${P.w}  (Z/X)` : '';
    if (this.bossE) { const e = this.bossE; $('#boss .bar div').style.width = Math.max(0, e.hp / e.mhp * 100) + '%'; if (e.dead) this.bossBar(null); }
    // küldetéskövető
    if (this.dirty) {
      this.dirty = false;
      const qs = Quests.active().slice(0, 4).map(q => { const s = G.S.quests[q.id]; return `<div class="q ${s.st === 'kesz' ? 'done' : ''}"><b>${q.main ? '◆ ' : ''}${q.nev}</b>${s.st === 'kesz' ? ` – vissza: ${NPCS[q.giver].nev}` : q.goal.n > 1 ? ` (${s.n}/${q.goal.n})` : ''}</div>`; }).join('');
      $('#track').innerHTML = qs;
      $('#keys').innerHTML = this.keyHelp ? 'WASD mozgás · Egér célzás · Bal: támadás · Jobb/1–4: képesség · V: Kapukő · Space: kitérés · Shift: sprint<br>E: interakció · Q: gyógyital · 6–9: elixír · B: artefaktum · H/G: evés/ivás · N: sátor · T: kapu haza · U: építés otthon<br>I: táska · C: karakter · K: képességek · J: napló · M: térkép · F1: súgó · Esc: menü' : 'F1: billentyűk';
      if (this.open === 'pInv') this.renderInv(); if (this.open === 'pChar') this.renderChar(); if (this.open === 'pQuest') this.renderQuest();
      if (this.open === 'pShop') this.renderShop();
    }
    this.minimap();
  },
  minimap() {
    const m = G.map; if (!m) return; const g = this.mm, P = G.P;
    if (this.minimapDirty || !this.mmBase || this.mmBase.m !== m) {
      this.minimapDirty = false;
      const c = this.mmBase && this.mmBase.m === m ? this.mmBase.c : document.createElement('canvas'); c.width = m.w; c.height = m.h; const cg = c.getContext('2d'); const id = cg.createImageData(m.w, m.h);
      for (let i = 0; i < m.w * m.h; i++) { const t = m.t[i]; let v = [0, 0, 0, 0]; if (m.seen[i] || m.region === 'varos' || m.region === 'otthon') { if (t === T_FLOOR) v = [110, 100, 80, 230]; else if (t === T_HAZ) v = [160, 90, 40, 230]; else if (t === T_OBST) v = [70, 64, 52, 230]; else { const nb = (m.t[i - 1] && m.t[i - 1] !== T_WALL) || (m.t[i + 1] && m.t[i + 1] !== T_WALL) || (m.t[i - m.w] && m.t[i - m.w] !== T_WALL) || (m.t[i + m.w] && m.t[i + m.w] !== T_WALL); if (nb) v = [190, 170, 130, 255]; } } id.data.set(v, i * 4); }
      cg.putImageData(id, 0, 0); this.mmBase = { m, c };
    }
    const W = 190, sc = 2.6, px = P.x / TILE, py = P.y / TILE;
    g.clearRect(0, 0, W, W); g.imageSmoothingEnabled = false;
    g.save(); g.translate(W / 2 - px * sc, W / 2 - py * sc); g.scale(sc, sc); g.drawImage(this.mmBase.c, 0, 0); g.restore();
    const dot = (x, y, c, r = 2.5) => { const dx = W / 2 + (x / TILE - px) * sc, dy = W / 2 + (y / TILE - py) * sc; if (dx < 0 || dy < 0 || dx > W || dy > W) return; g.fillStyle = c; g.beginPath(); g.arc(dx, dy, r, 0, 7); g.fill(); };
    for (const o of m.objs) { if (o.dead) continue; const s = m.seen[Math.floor(o.y / TILE) * m.w + Math.floor(o.x / TILE)] || m.region === 'varos'; if (!s) continue; if (o.type === 'exit' || o.type === 'portal' || o.type === 'kapu') dot(o.x, o.y, '#9fe8ff', 4); else if (o.type === 'npc') dot(o.x, o.y, '#ffd34d', 3); else if (o.type === 'chest' && !o.open) dot(o.x, o.y, '#c9a050', 2); else if (o.type === 'node') dot(o.x, o.y, NODES[o.kind].c, 2); }
    for (const e of G.enemies) if (!e.dead && !e.invisNow && Math.abs(e.x - P.x) < 900 && Math.abs(e.y - P.y) < 900) dot(e.x, e.y, e.boss || e.ancient ? '#ff3355' : e.elite || e.champion || e.named ? '#ffb347' : '#e04848', e.boss || e.ancient ? 4 : 1.8);
    for (const p of G.pickups) if (p.kind === 'quest' || (p.kind === 'item' && p.it.rar >= 2)) dot(p.x, p.y, p.kind === 'quest' ? '#fff' : RARITY[p.it.rar].c, 2.5);
    dot(P.x, P.y, '#fff', 3);
  },
  // ---------- panelek ----------
  toggle(id, render) {
    const el = $('#' + id); const was = this.open === id;
    this.closeAll(); if (was) return;
    this.open = id; el.style.display = 'block'; render.call(this); G.paused = true;
  },
  closeAll() { document.querySelectorAll('.panel').forEach(p => p.style.display = 'none'); this.open = null; this.shop = null; $('#tt').style.display = 'none'; G.paused = false; },
  hd(t, sub = '') { return `<div class="hd"><span class="h">${t}</span><span class="small">${sub}</span><button class="x" data-a="close">✕</button></div>`; },
  cell(it, src, i) {
    if (!it) return `<div class="cell"></div>`;
    const c = RARITY[it.rar].c; return `<div class="cell" style="border-color:${c}88;box-shadow:inset 0 0 10px ${c}33" data-tt="item" data-src="${src}" data-i="${i}" data-a="itemL" data-r="itemR">${BASES[it.base].ikon}${it.upg ? `<span class="u">+${it.upg}</span>` : ''}${it.req > G.S.lvl ? '<span class="rq">!</span>' : ''}</div>`;
  },
  renderInv() {
    const S = G.S; let h = this.hd('Felszerelés és táska', `${S.inv.length}/${INV_MAX}`) + '<div class="bd"><div class="eqg">';
    for (const sl in SLOTS) h += `<div class="eqs">${this.cell(S.eq[sl], 'eq', sl)}${SLOTS[sl]}</div>`;
    h += '</div><div class="grid">'; for (let i = 0; i < INV_MAX; i++) h += this.cell(S.inv[i], 'inv', i); h += '</div>';
    h += `<div style="margin-top:8px"><b class="h">Alapanyagok</b><br>${Object.keys(MATS).filter(k => S.mats[k]).map(k => `<span class="mat" title="${MATS[k].desc}"><i style="background:${MATS[k].c}"></i>${MATS[k].nev}: ${S.mats[k]}</span>`).join('') || '<span class="small">még semmi</span>'}</div>`;
    h += `<div style="margin-top:6px"><b class="h">Élelem</b><br>${Object.keys(S.food).filter(k => S.food[k]).map(k => `<button class="sm" data-a="eat" data-id="${k}" data-tt="txt" data-t="${esc(FOODS[k].nev)}: ${esc(FOODS[k].desc)}${FOODS[k].kaja ? ' · étel +' + FOODS[k].kaja : ''}${FOODS[k].ital ? ' · ital +' + FOODS[k].ital : ''}${FOODS[k].alvas ? ' · éberség +' + FOODS[k].alvas : ''}">${FOODS[k].ikon} ${S.food[k]}</button>`).join(' ') || '<span class="small">üres a tarisznya</span>'}</div>`;
    const qi = S.qi ? Object.keys(S.qi).filter(k => S.qi[k]) : []; if (qi.length) h += `<div style="margin-top:6px"><b class="h">Küldetéstárgyak</b><br>${qi.map(k => `<span class="mat">${QITEMS[k].ikon} ${QITEMS[k].nev}: ${S.qi[k]}</span>`).join('')}</div>`;
    h += `<div style="margin-top:8px" class="small"><label><input type="checkbox" data-a="autoItems" ${G.autoItems ? 'checked' : ''}> tárgyak automatikus felvétele</label> · Alt: tárgycímkék · kikapcsolva E-vel veszed fel</div></div>`;
    $('#pInv').innerHTML = h;
  },
  renderChar() {
    const S = G.S, P = G.P, st = P.st, C = CLASSES[S.cls];
    let h = this.hd(`${esc(S.nev)} – ${C.nev}`, `${S.lvl}. szint`) + '<div class="bd">';
    h += `<div class="small">Tapasztalat: ${fmt(S.xp)} / ${fmt(xpNeed(S.lvl))} · Szabad pont: <b style="color:#ffd34d">${S.attrPts}</b></div>`;
    for (const k in ATTR) h += `<div class="row"><span data-tt="txt" data-t="${ATTR_DESC[k]}">${ATTR[k]} <b>${st.at[k]}</b> <span class="small">(${S.attrs[k] ? '+' + S.attrs[k] : 'alap'})</span></span><span>${S.attrPts ? `<button class="sm" data-a="attr" data-k="${k}">+1</button> <button class="sm" data-a="attr5" data-k="${k}">+5</button>` : ''}</span></div>`;
    const rows = [['Életerő', P.mhp], [resName(S.cls), P.mmp], ['Állóképesség', P.msta], ['Páncél', st.arm], ['Kritikus esély', st.crit.toFixed(1) + '%'], ['Kritikus sebzés', '+' + st.critd + '%'], ['Támadási sebesség', '×' + st.aspd.toFixed(2)], ['Mozgás', '×' + st.msp.toFixed(2)], ['Újratöltés', '−' + Math.round(st.cdr * 100) + '%'], ['Életerő-töltés', st.regen.toFixed(1) + '/mp'], ['Fegyversebzés', weaponRange(P).map(Math.round).join('–')], ['Közelharc / Lövés / Mágia / Gépek', `+${Math.round(st.dmg.melee + st.dmg.all)}% / +${Math.round(st.dmg.ranged + st.dmg.all)}% / +${Math.round(st.dmg.spell + st.dmg.all)}% / +${Math.round(st.dmg.summon + st.dmg.all)}%`], ['Állóság: tűz/fagy/villám/téridő', `${st.res.tuz}/${st.res.fagy}/${st.res.villam}/${st.res.ter}%`], ['Életlopás', st.ls + '%'], ['Arany / zsákmány', `+${st.gf}% / +${st.mf}%`], ['Tiltott pecsétek', S.pecset], ['Ölések / halálok', `${S.stats.kills} / ${S.stats.deaths}`], ['Játékidő', Math.floor(S.playtime / 3600) + ' ó ' + Math.floor(S.playtime % 3600 / 60) + ' p']];
    h += '<div style="margin-top:8px">' + rows.map(r => `<div class="row"><span class="small">${r[0]}</span><span>${r[1]}</span></div>`).join('') + '</div>';
    h += `<div class="small" style="margin-top:6px">${RESOURCES[S.cls].ikon} ${RESOURCES[S.cls].nev}: ${RESOURCES[S.cls].desc}</div></div>`;
    $('#pChar').innerHTML = h;
  },
  renderSkills() {
    const S = G.S, P = G.P; const tab = this.skTab || 'kaszt';
    let h = this.hd('Képességek', `Szabad pont: ${S.skillPts}`) + '<div class="bd"><div class="tabs">' + [['kaszt', CLASSES[S.cls].nev], ['kapu', 'Kapukövek'], ['tiltott', '☠ Tiltott']].map(t => `<button class="${tab === t[0] ? 'on' : ''}" data-a="skTab" data-t="${t[0]}">${t[1]}</button>`).join('') + '</div>';
    h += `<div class="small" style="margin-bottom:8px">Helyek: ${['Jobb gomb', '1', '2', '3', '4'].map((k, i) => `<b>${k}</b>: ${S.slots[i] ? G.skillById(S.slots[i]).nev : '–'}`).join(' · ')}</div>`;
    if (tab === 'kaszt') {
      h += '<div class="sktree">';
      const list = Object.keys(SKILLS).filter(k => SKILLS[k].cls === S.cls).sort((a, b) => SKILLS[a].req - SKILLS[b].req);
      for (const id of list) {
        const sk = SKILLS[id], r = S.skills[id] || 0, lk = S.lvl < sk.req;
        h += `<div class="skc ${lk ? 'lk' : ''}"><div class="t"><span class="ic">${sk.ikon}</span><div><div class="nm">${sk.nev}${sk.ult ? ' <span style="color:#ffd34d">★</span>' : ''}</div><div class="small">${sk.tipus === 'passziv' ? 'passzív' : 'aktív'} · ${r}/${sk.max}${P.st.skill && r ? ` (+${P.st.skill})` : ''} · ${sk.req}. szinttől</div></div></div><div class="d">${sk.desc(Math.max(1, r + (r ? P.st.skill : 0)))}</div>`;
        h += `${!lk && r < sk.max && S.skillPts ? `<button class="sm pri" data-a="learn" data-id="${id}">${r ? 'Fejlesztés' : 'Megtanulás'}</button> ` : ''}`;
        if (r && sk.tipus === 'aktiv') h += ['J', '1', '2', '3', '4'].map((k, i) => `<button class="sm mbtn ${S.slots[i] === id ? 'pri' : ''}" data-a="slot" data-id="${id}" data-i="${i}">${k}</button>`).join(' ');
        h += '</div>';
      }
      h += '</div>';
    } else if (tab === 'kapu') {
      h += '<div class="small">A világok urainak legyőzéséért jár egy-egy Kapukő-képesség. Egyszerre egy lehet a V gombon.</div><div class="sktree" style="margin-top:8px">';
      for (const id in GATESKILLS) { const g = GATESKILLS[id], has = S.gates.includes(id); h += `<div class="skc ${has ? '' : 'lk'}"><div class="t"><span class="ic">${g.ikon}</span><div><div class="nm">${g.nev}</div><div class="small">${id === 'boefi' ? 'Kurta küldetéséből' : REGION[g.vilag] ? REGION[g.vilag].nev : ''}</div></div></div><div class="d">${g.desc}</div>${has ? `<button class="sm ${S.gate === id ? 'pri' : ''}" data-a="gate" data-id="${id}">${S.gate === id ? 'Kiválasztva (V)' : 'Választás'}</button>` : '<span class="small">zárva</span>'}</div>`; }
      h += '</div>';
    } else {
      h += `<div class="small">Tiltott pecsétek: <b style="color:#ff3355">${S.pecset}</b>. Az Ősök legyőzéséért járnak (a világok 2–3. szintjén kóborolnak, 25–40 szinttel erősebbek). Ezek a képességek szándékosan kiegyensúlyozatlanok.</div><div class="sktree" style="margin-top:8px">`;
      for (const id in FORBIDDEN) { const F = FORBIDDEN[id]; if (F.cls !== S.cls && F.cls !== '*') continue; const has = S.forbidden.includes(id); h += `<div class="skc ${has ? '' : 'lk'}" style="border-color:#ff335566"><div class="t"><span class="ic">${F.ikon}</span><div><div class="nm" style="color:#ff6a7a">${F.nev}</div><div class="small">${F.pecset} pecsét · újratöltés ${F.cd} mp</div></div></div><div class="d">${F.desc}</div>${has ? ['J', '1', '2', '3', '4'].map((k, i) => `<button class="sm mbtn ${S.slots[i] === id ? 'pri' : ''}" data-a="slot" data-id="${id}" data-i="${i}">${k}</button>`).join(' ') : '<span class="small">zárva</span>'}</div>`; }
      h += `<div class="skc ${S.forbidden.includes('osforma') ? '' : 'lk'}" style="border-color:#ff335566"><div class="t"><span class="ic">☠</span><div><div class="nm" style="color:#ff6a7a">${OSFORMA.nev}</div><div class="small">${OSFORMA.pecset} pecsét · passzív</div></div></div><div class="d">${OSFORMA.desc}</div></div>`;
      h += '</div><div class="small" style="margin-top:8px">Ősök: ' + Object.values(ANCIENTS).map(A => `${S.prog.ancients[A.id] ? '☠' : '·'} ${A.nev}`).join(' · ') + '</div>';
    }
    h += '</div>';
    $('#pSkill').innerHTML = h;
  },
  renderQuest() {
    const S = G.S; let h = this.hd('Napló') + '<div class="bd">';
    const act = Quests.active(); if (!act.length) h += '<div class="small">Nincs aktív küldetés. Beszélj a város lakóival ( ! jel ).</div>';
    for (const q of act) { const s = S.quests[q.id]; h += `<div style="margin-bottom:10px"><div class="h" style="color:${s.st === 'kesz' ? '#9fe07a' : '#e6c47a'}">${q.main ? '◆ ' : ''}${q.nev}</div><div>${q.desc}</div><div class="small">Megbízó: ${NPCS[q.giver].nev}${q.goal.n > 1 ? ` · ${s.n}/${q.goal.n}` : ''}${s.st === 'kesz' ? ' · KÉSZ – vidd vissza!' : ''}</div></div>`; }
    Bounty.ensure();
    h += `<div class="h" style="margin-top:8px">Napi megbízások</div>` + S.bounties.map(b => `<div class="row"><span class="small">${b.done ? '✔' : ''} ${b.nev}</span><span>${Math.min(b.p, b.n)}/${b.n}</span></div>`).join('');
    const done = QUESTS.filter(q => S.quests[q.id] && S.quests[q.id].st === 'leadva');
    h += `<div class="small" style="margin-top:10px">Teljesítve: ${done.length}/${QUESTS.length}</div></div>`;
    $('#pQuest').innerHTML = h;
  },
  renderMap() {
    const m = G.map; const sc = Math.min(6, Math.floor(Math.min(innerWidth - 80, innerHeight - 140) / Math.max(m.w, m.h)));
    $('#pMap').innerHTML = this.hd('Térkép', REGION[m.region] ? REGION[m.region].nev : 'Kapuváros') + `<div class="bd"><canvas id="bigmap" width="${m.w * sc}" height="${m.h * sc}"></canvas></div>`;
    const g = $('#bigmap').getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(this.mmBase.c, 0, 0, m.w * sc, m.h * sc);
    for (const o of m.objs) if (!o.dead && (o.type === 'exit' || o.type === 'portal' || o.type === 'kapu' || o.type === 'npc') && (m.seen[Math.floor(o.y / TILE) * m.w + Math.floor(o.x / TILE)] || m.region === 'varos')) { g.fillStyle = o.type === 'npc' ? '#ffd34d' : '#9fe8ff'; g.fillRect(o.x / TILE * sc - 3, o.y / TILE * sc - 3, 6, 6); }
    g.fillStyle = '#fff'; g.beginPath(); g.arc(G.P.x / TILE * sc, G.P.y / TILE * sc, 4, 0, 7); g.fill();
  },
  // ---------- akciók ----------
  act(a, d, e) {
    const S = G.S, P = G.P;
    switch (a) {
      case 'close': this.closeAll(); break;
      case 'openSkills': this.toggle('pSkill', this.renderSkills); break;
      case 'itemL': this.itemClick(d.src, d.i, false); break;
      case 'itemR': this.itemClick(d.src, d.i, true); break;
      case 'eat': eatFood(d.id); this.renderInv(); break;
      case 'autoItems': G.autoItems = e.target.checked; break;
      case 'attr': if (S.attrPts > 0) { S.attrPts--; S.attrs[d.k]++; recalc(P); this.renderChar(); } break;
      case 'attr5': { const n = Math.min(5, S.attrPts); S.attrPts -= n; S.attrs[d.k] += n; recalc(P); this.renderChar(); break; }
      case 'skTab': this.skTab = d.t; this.renderSkills(); break;
      case 'learn': { const sk = SKILLS[d.id]; const r = S.skills[d.id] || 0; if (S.skillPts > 0 && r < sk.max && S.lvl >= sk.req) { S.skillPts--; S.skills[d.id] = r + 1; if (!r && sk.tipus === 'aktiv') { const free = S.slots.indexOf(null); if (free >= 0) S.slots[free] = d.id; } recalc(P); Audio2.play('level'); } this.renderSkills(); break; }
      case 'slot': { const i = +d.i; const j = S.slots.indexOf(d.id); if (j >= 0) S.slots[j] = S.slots[i]; S.slots[i] = d.id; this.renderSkills(); break; }
      case 'gate': S.gate = d.id; this.renderSkills(); break;
      default: if (this.acts[a]) this.acts[a].call(this, d, e);
    }
    this.dirty = true;
  },
  acts: {},
  itemClick(src, i, right) {
    const S = G.S, it = this.findItem(src, i); if (!it) return;
    if (src === 'shop') { const price = itemValue(it) * 4; if (S.gold < price) { this.toast('Nincs elég aranyad.', '#ff7a7a'); return; } if (S.inv.length >= INV_MAX) { this.toast('Tele a táskád.', '#ff7a7a'); return; } S.gold -= price; S.inv.push(it); this.shopItems.splice(i, 1); Audio2.play('gold'); this.renderShop(); $('#tt').style.display = 'none'; return; }
    if (src === 'eq') { if (S.inv.length >= INV_MAX) { this.toast('Tele a táskád.', '#ff7a7a'); return; } delete S.eq[i]; S.inv.push(it); recalc(G.P); }
    else if (src === 'stash') { if (S.inv.length >= INV_MAX) { this.toast('Tele a táskád.', '#ff7a7a'); return; } S.stash.splice(i, 1); S.inv.push(it); }
    else if (src === 'inv') {
      if (right) {
        if (this.shop === 'bolt') { S.gold += itemValue(it); S.inv.splice(i, 1); Audio2.play('gold'); this.toast(`Eladva: +${itemValue(it)} arany`, '#ffd34d', 1.5); }
        else if (this.shop === 'kovacs') { const n = salvageYield(it); S.mats.szilank = (S.mats.szilank || 0) + n; S.inv.splice(i, 1); Audio2.play('hit'); this.toast(`Szétszedve: +${n} kapuszilánk`, '#b28cff', 1.5); }
        else if (this.shop === 'raktar') { if (S.stash.length >= STASH_MAX) { this.toast('A tárhely tele.', '#ff7a7a'); return; } S.inv.splice(i, 1); S.stash.push(it); }
        else { S.inv.splice(i, 1); G.spawnPickup(G.P.x + 20, G.P.y, 'item', 0, it); G.pickups[G.pickups.length - 1].t = -1.5; }
      } else {
        if (it.req > S.lvl) { this.toast(`Ehhez ${it.req}. szint kell.`, '#ff7a7a'); return; }
        const sl = BASES[it.base].slot; const old = S.eq[sl]; S.eq[sl] = it; S.inv.splice(i, 1); if (old) S.inv.splice(i, 0, old); recalc(G.P); Audio2.play('pickup');
      }
    }
    $('#tt').style.display = 'none';
    if (this.open === 'pInv') this.renderInv(); if (this.open === 'pShop') { this.renderShop(); this.renderInvSide(); }
  },
  // ---------- dialógus ----------
  npc(id) {
    const N = NPCS[id]; const S = G.S; S.talk = S.talk || {};
    let line = RNG.pick(N.lines);
    // multiverzum-reakció (egyszer)
    for (const k in N.react || {}) if (Univ.has(k) && !S.seenKeys[id + k]) { S.seenKeys[id + k] = 1; line = N.react[k]; break; }
    if (typeof Home !== 'undefined') Home.talked(id);
    this.dlgState = { id, line };
    this.toggleDlg();
  },
  toggleDlg() { this.closeAll(); this.open = 'pDlg'; $('#pDlg').style.display = 'block'; G.paused = true; this.renderDlg(); },
  renderDlg() {
    const { id, line } = this.dlgState, N = NPCS[id], S = G.S;
    let h = `<div class="hd"><div style="display:flex;gap:10px;align-items:center"><div class="port" style="background:${N.look.c}">${{ leltaros: '📦', mehesz: '🐝', nagyi: '👵', fokonstruktor: '🔧', furomester: '⛏', kezelo: '📻', pilota: '🚀', kurta: '🍺', bodor: '🥋', nyelvesz: '📖', kende: '🔥' }[id] || '🙂'}</div><div><div class="h">${N.nev}</div><div class="small">${N.cim}</div></div></div><button class="x" data-a="close">✕</button></div><div class="bd">`;
    h += `<div class="dlg-txt">„${esc(line)}”</div><div class="dlg-opts">`;
    for (const q of Quests.active().filter(q => q.giver === id && S.quests[q.id].st === 'kesz')) h += `<button class="pri" data-a="qDone" data-id="${q.id}">✔ Leadom: ${q.nev}</button>`;
    for (const q of Quests.available(id)) h += `<button data-a="qShow" data-id="${q.id}">❗ ${q.main ? 'Fő küldetés' : 'Küldetés'}: ${q.nev}</button>`;
    h += `<button data-a="tip">💬 Mesélj a világodról</button>`;
    const M = { bolt: '🛒 Mutasd az árudat', kovacs: '⚒ Kovácsmunka (erősítés, szétszedés)', craft: '🔨 Tárgykészítés alapanyagokból', alkimia: '⚗ Varázsitalok főzése', elelem: '🥐 Élelem vásárlása', raktar: '📦 Tárhely (976.)', kocsma: '🍺 Kocsma: ital, szoba, böfi', csere: '⛏ Mintacsere (alapanyag → tárgy)', verseny: '📡 Heti Hasadék – versenytábla', kapuk: '🌀 Más világok kapui', nyelv: '📖 Toldaléktorony-feladványok', tanito: '🥋 Felejtés (képességek újraosztása)' };
    const menus = [...N.menu]; if (id === 'fokonstruktor') menus.unshift('kovacs');
    for (const m of [...new Set(menus)]) h += `<button data-a="svc" data-m="${m}">${M[m]}</button>`;
    if (typeof Home !== 'undefined') h += Home.dlgOptions(id);
    h += `<button data-a="close">Viszlát.</button></div></div>`;
    $('#pDlg').innerHTML = h;
  },
  // ---------- szolgáltatások ----------
  openShop(kind, title) { this.closeAll(); this.open = 'pShop'; this.shop = kind; $('#pShop').style.display = 'block'; $('#pInv').style.display = 'block'; G.paused = true; this.shopTitle = title; this.renderShop(); this.renderInvSide(); },
  renderInvSide() { this.renderInv(); },
  renderShop() {
    const S = G.S, k = this.shop; let h = this.hd(this.shopTitle || '', `${fmt(S.gold)} arany`) + '<div class="bd">';
    if (k === 'bolt') { h += '<div class="small">Bal klikk: vásárlás. A táskádban jobb klikk: eladás.</div><div class="grid" style="margin-top:6px">' + this.shopItems.map((it, i) => this.cell(it, 'shop', i)).join('') + '</div>'; h += `<div style="margin-top:8px"><button data-a="restock">Új áru (${50 + S.lvl * 10} arany)</button> <button data-a="sellJunk">Minden közönséges eladása</button></div>`; }
    else if (k === 'kovacs') {
      h += '<div class="small">A táskádban jobb klikk: szétszedés kapuszilánkká. Erősítés: válassz egy viselt tárgyat.</div>';
      for (const sl in S.eq) { const it = S.eq[sl]; if (!it) continue; const c = upgradeCost(it); h += `<div class="row"><span style="color:${RARITY[it.rar].c}" data-tt="item" data-src="eq" data-i="${sl}">${esc(it.nev)} ${it.upg ? '+' + it.upg : ''}</span><span>${it.upg >= 10 ? 'max.' : `<button class="sm" data-a="upg" data-s="${sl}" ${S.gold >= c.arany && (S.mats.szilank || 0) >= c.szilank ? '' : 'disabled'}>+1 (${c.arany} a, ${c.szilank} sz, ${Math.round(c.esely * 100)}%)</button>`}</span></div>`; }
      h += `<div class="small" style="margin-top:6px">Kapuszilánk: ${S.mats.szilank || 0}</div><div style="margin-top:6px"><button data-a="salvageJunk">Minden közönséges és kiváló szétszedése</button></div>`;
    }
    else if (k === 'craft') {
      const cat = this.craftCat || 'fegyver'; const tiers = craftTiers(); const ti = Math.min(this.craftTier || 0, tiers.length - 1);
      h += '<div class="tabs">' + [['fegyver', 'Fegyverek'], ['pancel', 'Ruha és páncél'], ['ekszer', 'Ékszer'], ['arti', 'Artefaktum']].map(t => `<button class="${cat === t[0] ? 'on' : ''}" data-a="craftCat" data-c="${t[0]}">${t[1]}</button>`).join('') + '</div>';
      h += '<div class="tabs">' + tiers.map((R, i) => `<button class="sm ${ti === i ? 'on' : ''}" data-a="craftTier" data-t="${i}" data-tt="txt" data-t2="">${R.nev} (${R.lvl + 4}. szint)</button>`).join('') + '</div>';
      const bases = Object.keys(RECIPE).filter(b => { const sl = BASES[b].slot; return cat === 'fegyver' ? sl === 'fegyver' : cat === 'pancel' ? ['fej', 'test', 'kez', 'lab'].includes(sl) : cat === 'ekszer' ? ['nyak', 'gyuru'].includes(sl) : sl === 'artefakt'; });
      const tierIdx = REGIONS.indexOf(tiers[ti]);
      for (const b of bases) { const c = craftCost(b, tierIdx); const ok = canCraft(b, tierIdx), ok2 = canCraft(b, tierIdx, true); h += `<div class="row"><span>${BASES[b].ikon} ${BASES[b].nev}<br><span class="small">${Object.keys(c.mats).map(m => `<span style="color:${(S.mats[m] || 0) >= c.mats[m] ? '#9fe07a' : '#ff7a7a'}">${MATS[m].nev} ${S.mats[m] || 0}/${c.mats[m]}</span>`).join(', ')} · ${c.gold} arany</span></span><span><button class="sm" data-a="craft" data-b="${b}" data-t="${tierIdx}" ${ok ? '' : 'disabled'}>Készít</button> <button class="sm pri" data-a="craftX" data-b="${b}" data-t="${tierIdx}" ${ok2 ? '' : 'disabled'} data-tt="txt" data-t2="+6 kapuszilánk: garantáltan ritka, 12% esély legendásra">+6 sz.</button></span></div>`; }
      h += `<div class="small" style="margin-top:6px">A készített tárgy legalább kiváló. Az alapanyag a kazamatákban: ércér, fakupac, gyógyfű, kristálytelér, vászonbála (E), bőr az állatszerű lényekből.</div>`;
    }
    else if (k === 'alkimia') {
      h += `<div class="small">Gyógyitalok: ${S.potions}/${G.potMax()} · minőség: ${S.potLvl}. fokozat</div><div class="row"><span>❤ Gyógyitalok feltöltése</span><button class="sm" data-a="refill">${this.refillCost()} arany</button></div>`;
      for (const id in ELIX) { const E = ELIX[id]; const ok = Object.keys(E.recept).every(m => (S.mats[m] || 0) >= E.recept[m]) && S.gold >= E.ar; h += `<div class="row"><span><b style="color:${E.c}">⚗ ${E.nev}</b> (${E.key}) · nálad: ${S.elix[id] || 0}<br><span class="small">${E.desc}<br>${Object.keys(E.recept).map(m => `<span style="color:${(S.mats[m] || 0) >= E.recept[m] ? '#9fe07a' : '#ff7a7a'}">${MATS[m].nev} ${S.mats[m] || 0}/${E.recept[m]}</span>`).join(', ')} · ${E.ar} arany</span></span><button class="sm" data-a="brew" data-id="${id}" ${ok ? '' : 'disabled'}>Főzés</button></div>`; }
    }
    else if (k === 'elelem' || k === 'kocsma') {
      const items = k === 'elelem' ? ['pogacsa', 'langos', 'mezescsupor', 'viz', 'satorlap'] : ['kola', 'bika', 'sprite', 'kave', 'viz', 'tubus'];
      for (const id of items) { const F = FOODS[id]; h += `<div class="row"><span>${F.ikon} ${F.nev} <span class="small">(nálad: ${S.food[id] || 0})<br>${F.desc}</span></span><button class="sm" data-a="buyFood" data-id="${id}">${F.ar} arany</button></div>`; }
      if (k === 'kocsma') h += `<div class="row"><span>🛏 Szoba a kocsmában – kialszod magad, és tele hassal ébredsz<br><span class="small">Éberség, életerő és állóképesség teljesen, étel/ital +40</span></span><button class="sm pri" data-a="inn">${this.innCost()} arany</button></div>`;
    }
    else if (k === 'csere') {
      h += '<div class="small">A Fúrómester alapanyagot vesz, és ismeretlen mintát ad érte – néha legendásat.</div>';
      for (const R of REGIONS.filter(r => S.prog.unlocked.includes(r.id))) { const n = 6; h += `<div class="row"><span>${MATS[R.mat].nev} ×${n} + ${R.lvl * 20 + 40} arany → ${R.nev} minta (${R.lvl + 4}. szint)<br><span class="small">nálad: ${S.mats[R.mat] || 0}</span></span><button class="sm" data-a="gamble" data-r="${R.id}" ${(S.mats[R.mat] || 0) >= n && S.gold >= R.lvl * 20 + 40 ? '' : 'disabled'}>Csere</button></div>`; }
      h += `<div class="row"><span>Kapuszilánk ×30 → véletlen ereklye</span><button class="sm pri" data-a="gambleRelic" ${(S.mats.szilank || 0) >= 30 ? '' : 'disabled'}>Csere</button></div>`;
    }
    else if (k === 'raktar') { h += `<div class="small">${S.stash.length}/${STASH_MAX} · Bal klikk: vissza a táskába. A táskában jobb klikk: tárhelyre.</div><div class="grid" style="margin-top:6px">` + Array.from({ length: Math.max(40, S.stash.length + 8) }, (_, i) => this.cell(S.stash[i], 'stash', i)).join('') + '</div>'; }
    else if (k === 'verseny') {
      const B = Object.values(Univ.board).filter(o => o && o.v).sort((a, b) => b.v.fl - a.v.fl);
      h += `<div class="small">Csatorna: ${Univ.CS} · állapot: ${Univ.status} · hét: ${Univ.week()}</div><div>A Heti Hasadék mindenkinek ugyanaz a héten. Aki a legmélyebbre jut, az nyer. (A fő történet után nyílik meg.)</div>`;
      h += `<div style="margin:6px 0">Nevem a versenyben: <input id="vnev" value="${esc(Univ.myName())}" maxlength="24"> <button class="sm" data-a="setName">Mentés</button></div>`;
      h += B.map((o, i) => `<div class="row"><span>${i + 1}. ${esc(o.nev)} <span class="small">${o.v.c ? CLASSES[o.v.c] ? CLASSES[o.v.c].nev : '' : ''} ${o.v.l || ''}. szint</span></span><span>${o.v.fl}. mélység</span></div>`).join('') || '<div class="small">Még senki sem jutott le a héten.</div>';
      h += `<div class="small" style="margin-top:6px">Most a Kapuk-ban: ${Object.values(Univ.online).map(esc).join(', ') || '–'}</div>`;
      if (Univ.news.length) h += '<div class="small" style="margin-top:6px">' + Univ.news.slice(0, 6).map(n => `📡 ${esc(n.nev)}: ${esc(n.t)}`).join('<br>') + '</div>';
      if (Univ.status !== 'élő') h += `<button class="sm" data-a="connect">Kapcsolódás</button>`;
    }
    else if (k === 'kapuk') {
      const n = Univ.get();
      h += '<div class="small">A Kapu túloldalán a többi világ. Ahol már jártál, oda innen is átléphetsz (ugyanazon a webcímen közös a napló).</div>';
      for (const [code, nev, url, desc] of Univ.WORLDS) { const been = n[code + ':jart']; h += `<div class="row"><span>${been ? '🌀' : '·'} <b>${nev}</b><br><span class="small">${desc}${been ? '' : ' – még nem jártál ott'}</span></span>${been ? `<a href="${url}"><button class="sm">Átlépés</button></a>` : `<a href="${url}"><button class="sm">Felfedezés</button></a>`}</div>`; }
      const keys = Object.keys(n).filter(k => !k.startsWith('kp:')); h += `<div class="small" style="margin-top:8px">A közös naplóban ${keys.length} esemény a többi világból. Ajándékot kaptál: ${Object.keys(S.gifts).length}.</div>`;
    }
    else if (k === 'tanito') { const cost = 100 + S.lvl * 40; h += `<div>Bodor elfelejteti veled a képességeidet és a tulajdonságpontjaidat. Mindent visszakapsz, újra eloszthatod.</div><div style="margin-top:8px"><button data-a="respec" ${S.gold >= cost ? '' : 'disabled'}>Felejtés (${cost} arany)</button></div>`; }
    else if (k === 'nyelv') h += Nyelv.render();
    else if (k === 'fozes') { for (const id in HOME_RECIPES) { const R0 = HOME_RECIPES[id]; const ok = Object.keys(R0.mats).every(m => (S.mats[m] || 0) >= R0.mats[m]) && S.gold >= (R0.gold || 0); h += `<div class="row"><span>${R0.ikon} ${R0.nev}<br><span class="small">${R0.desc} · ${Object.keys(R0.mats).map(m => `${MATS[m].nev} ${S.mats[m] || 0}/${R0.mats[m]}`).join(', ')}${R0.gold ? ' · ' + R0.gold + ' arany' : ''}</span></span><button class="sm" data-a="hmCook" data-id="${id}" ${ok ? '' : 'disabled'}>Főzés</button></div>`; } }
    h += '</div>';
    $('#pShop').innerHTML = h;
  },
  refillCost() { const S = G.S; return Math.max(0, (G.potMax() - S.potions) * (5 + S.lvl * 2)); },
  innCost() { return 15 + G.S.lvl * 3; },
  // ---------- város-objektumok ----------
  kapu() {
    const S = G.S; this.closeAll(); this.open = 'pDlg'; G.paused = true; $('#pDlg').style.display = 'block';
    let h = this.hd('A Kapu', 'válaszd ki, hová lépsz') + '<div class="bd">';
    if (G.retPortal) h += `<button class="pri" style="width:100%;margin-bottom:8px" data-a="retP">↩ Vissza: ${G.retPortal.label}</button>`;
    h += `<div class="tabs">${DIFFS.map((d, i) => `<button class="sm ${S.prog.diff === i ? 'on' : ''}" data-a="diff" data-d="${i}" ${i > S.prog.diffMax ? 'disabled' : ''}>${d}${i ? ` (+${[0, 30, 55][i]} szint)` : ''}</button>`).join('')}</div>`;
    for (const R of REGIONS) {
      const un = S.prog.unlocked.includes(R.id); const wp = S.prog.wp[R.id] || 1; const done = S.prog.bosses[R.boss];
      h += `<div class="row"><span>${un ? '🌀' : '🔒'} <b class="h" style="font-size:14px">${R.nev}</b> <span class="small">${R.lvl + G.diffLvl()}–${R.lvl + R.floors - 1 + G.diffLvl()}. szint · ${R.vilag}${done ? ' · ✔' : ''}</span></span><span>${un ? Array.from({ length: wp }, (_, i) => `<button class="sm" data-a="go" data-r="${R.id}" data-f="${i + 1}">${i + 1 === R.floors ? '👑' : i + 1}</button>`).join(' ') : ''}</span></div>`;
    }
    const fin = S.prog.bosses.szingularitas;
    h += `<div class="row" style="margin-top:6px"><span>${fin ? '🌌' : '🔒'} <b class="h" style="font-size:14px">Végtelen Hasadék</b> <span class="small">a fő történet után · legmélyebb: ${S.prog.hasadek}</span></span><span>${fin ? `<button class="sm" data-a="hasadek">Belépés (1.)</button> ${S.prog.hasadek > 5 ? `<button class="sm" data-a="hasadekX">${Math.floor(S.prog.hasadek / 5) * 5}.</button>` : ''}` : ''}</span></div>`;
    h += `<div class="row"><span>${fin ? '📡' : '🔒'} <b class="h" style="font-size:14px">Heti Hasadék</b> <span class="small">mindenkinek ugyanaz a héten · ${Univ.week()} · legjobbad: ${S.prog.weekly[Univ.week()] || 0}</span></span><span>${fin ? '<button class="sm pri" data-a="weekly">Belépés</button>' : ''}</span></div>`;
    h += `<div class="small" style="margin-top:8px">A ❗-os lakók küldetést adnak. A Kezelőnél és a Pilótánál a többi világ kapui.</div></div>`;
    $('#pDlg').innerHTML = h;
  },
  tabla() { Bounty.ensure(); const S = G.S; this.closeAll(); this.open = 'pDlg'; G.paused = true; $('#pDlg').style.display = 'block'; $('#pDlg').innerHTML = this.hd('Hirdetőtábla', 'napi megbízások – éjfélkor frissül') + '<div class="bd">' + S.bounties.map((b, i) => `<div class="row"><span>${b.nev}<br><span class="small">Jutalom: ${fmt(b.rw.xp)} TP, ${b.rw.gold} arany, ${b.rw.szilank} kapuszilánk</span></span><span>${b.done ? '✔' : b.p >= b.n ? `<button class="sm pri" data-a="claim" data-i="${i}">Jutalom</button>` : `${b.p}/${b.n}`}</span></div>`).join('') + '</div>'; },
  stash() { this.openShop('raktar', '976. tárhely'); },
  sleepInn() { this.openShop('kocsma', 'Kurta törzshelye – a kocsma'); },
  sleepFade() { this.sleepT = 1.6; },
  // ---------- rejtvények ----------
  morsePuzzle(o, ex) {
    this.closeAll(); this.open = 'pDlg'; G.paused = true; $('#pDlg').style.display = 'block';
    const opts = [o.word, ...MORSE_WORDS.filter(w => w !== o.word).sort(() => RNG() - 0.5).slice(0, 3)].sort(() => RNG() - 0.5);
    $('#pDlg').innerHTML = this.hd('Rádióadó', 'Mit sugároz az adó?') + `<div class="bd"><div class="morse">${toMorse(o.word)}</div><div class="small" style="text-align:center">· rövid, – hosszú. A Kezelő szerint: A ·–, D –··, E ·, H ····, K –·–, L ·–··, M ––, N –·, O –––, R ·–·, S ···, T –, U ··–</div><div class="dlg-opts" style="margin-top:10px">${opts.map(w => `<button data-a="morseAns" data-w="${w}" data-ok="${w === o.word ? 1 : 0}">${w}</button>`).join('')}</div><div style="margin-top:6px"><button class="sm" data-a="morsePlay" data-w="${o.word}">▶ Lejátszás</button></div></div>`;
    this.morseCtx = { o, ex };
  },
  toredekReveal() { this.toast('📻 NE · ADD · FEL · MEG · ÉRI – „Ne add fel. Megéri.” – Feladó: TE MAGAD', '#4dffb0', 8); Univ.set('kp:uzenet'); },
  // ---------- nagy képernyők ----------
  intro() {
    const o = $('#over'); o.style.display = 'flex';
    o.innerHTML = `<div style="max-width:640px;padding:20px"><div class="h" style="font-size:30px">Kapuváros</div><p style="font-size:15px;line-height:1.7">A világok között van egy város, ahová minden kapu vezet. Valaki ugyanazt az üzenetet küldi minden világba – egy hurokban, ami sosem a jövőből jött, és sosem a múltba ment.<br><br>A Kapu megrepedt. A világok szörnyei átszivárognak. A <b>Leltáros</b> vár rád – ő tudja, mi hiányzik.</p><p class="small">WASD mozgás · egér célzás · bal gomb támadás · E beszélgetés · F1 súgó</p><button class="pri" data-a="closeOver">Indulás</button></div>`;
  },
  deathScreen(by, lost) {
    const o = $('#over'); o.style.display = 'flex';
    o.innerHTML = `<div class="h" style="font-size:42px;color:#e04848">Elestél</div><p>Ellenfél: ${esc(by)} · elveszett ${lost} arany</p><p class="small">„Ne add fel. Megéri.”</p><button class="pri" data-a="respawn">Feltámadás Kapuvárosban</button>`;
  },
  ending() {
    const S = G.S; S.prog.diffMax = Math.max(S.prog.diffMax, 1); if (S.prog.diff >= 1) S.prog.diffMax = 2;
    Univ.set('kp:vege'); if (S.prog.diff === 1) Univ.set('kp:remalom'); if (S.prog.diff === 2) Univ.set('kp:pokol');
    Univ.say(`legyőzte a Szingularitást (${DIFFS[S.prog.diff]}, ${CLASSES[S.cls].nev})`);
    const o = $('#over'); o.style.display = 'flex'; G.paused = true;
    o.innerHTML = `<div style="max-width:660px;padding:20px"><div class="h" style="font-size:34px">Novikov</div><p style="font-size:15px;line-height:1.7">A Szingularitás elhallgat. A tesszeraktban hátulról látod önmagad – és most már tudod, mit kell tenned. Felveszed a jelet, és visszaküldöd a múltba:</p><div class="morse">–·  ·  ·–  –··  –··  ··–·  ·  ·–··  ––  ·  ––·  ·  ·–·  ··</div><p style="font-size:15px">NE ADD FEL MEGÉRI.<br><span class="small">— te magad</span></p><p class="small">Az üzenet sosem a jövőből jött, és sosem a múltba ment: mindig is itt volt, egy hurokban, amely minden világon átfut. Aki elküldi, az kapja meg.</p><p>Megnyílt: <b>${DIFFS[S.prog.diffMax]}</b> nehézség, a <b>Végtelen Hasadék</b> és a <b>Heti Hasadék</b>.</p><button class="pri" data-a="closeOver">Tovább</button></div>`;
    G.autosave();
  },
};
Object.assign(UI.acts, {
  closeOver() { $('#over').style.display = 'none'; G.paused = false; },
  respawn() { $('#over').style.display = 'none'; G.P.dead = false; G.enterTown(true); },
  tip() { const N = NPCS[this.dlgState.id]; const S = G.S; S.tipI = S.tipI || {}; const i = (S.tipI[this.dlgState.id] || 0) % N.tips.length; S.tipI[this.dlgState.id] = i + 1; this.dlgState.line = N.tips[i]; this.renderDlg(); },
  qShow(d) { const q = QUEST[d.id]; this.dlgState.line = q.desc; this.renderDlg(); const opts = $('#pDlg .dlg-opts'); const b = document.createElement('button'); b.className = 'pri'; b.textContent = `Elvállalom: ${q.nev}`; b.dataset.a = 'qAcc'; b.dataset.id = q.id; opts.prepend(b); },
  qAcc(d) { Quests.accept(d.id); this.dlgState.line = 'Számítok rád.'; this.renderDlg(); },
  qDone(d) { Quests.complete(d.id); this.dlgState.line = 'Köszönöm. Tudtam, hogy rád lehet számítani.'; this.renderDlg(); },
  svc(d) {
    const m = d.m, S = G.S;
    if (m === 'bolt') { if (!this.shopItems || this.shopLvl !== S.lvl) this.restockShop(); this.openShop('bolt', 'A Méhész boltja'); }
    else if (m === 'kovacs') this.openShop('kovacs', 'Kovácsműhely');
    else if (m === 'craft') { if (!S.quests.s_craft) Quests.accept('s_craft'); this.openShop('craft', 'Tárgykészítés'); }
    else if (m === 'alkimia') this.openShop('alkimia', 'Nagyi üstje');
    else if (m === 'elelem') this.openShop('elelem', 'Nagyi kamrája');
    else if (m === 'kocsma') this.openShop('kocsma', 'Kurta törzshelye – a kocsma');
    else if (m === 'raktar') this.openShop('raktar', '976. tárhely');
    else if (m === 'csere') this.openShop('csere', 'Mintacsere');
    else if (m === 'verseny') { Univ.connect(); this.openShop('verseny', 'Heti Hasadék – versenytábla'); }
    else if (m === 'kapuk') this.openShop('kapuk', 'Más világok kapui');
    else if (m === 'tanito') this.openShop('tanito', 'Bodor tanítása');
    else if (m === 'nyelv') this.openShop('nyelv', 'Toldaléktorony');
  },
  restock() { const S = G.S, c = 50 + S.lvl * 10; if (S.gold < c) return; S.gold -= c; this.restockShop(); this.renderShop(); },
  sellJunk() { const S = G.S; let g = 0; S.inv = S.inv.filter(it => { if (it.rar === 0) { g += itemValue(it); return false; } return true; }); S.gold += g; this.toast(`+${g} arany`, '#ffd34d'); this.renderShop(); this.renderInv(); },
  salvageJunk() { const S = G.S; let n = 0; S.inv = S.inv.filter(it => { if (it.rar <= 1) { n += salvageYield(it); return false; } return true; }); S.mats.szilank = (S.mats.szilank || 0) + n; this.toast(`+${n} kapuszilánk`, '#b28cff'); this.renderShop(); this.renderInv(); },
  upg(d) { const S = G.S, it = S.eq[d.s]; const c = upgradeCost(it); if (S.gold < c.arany || (S.mats.szilank || 0) < c.szilank) return; S.gold -= c.arany; S.mats.szilank -= c.szilank; if (RNG() < c.esely) { it.upg = (it.upg || 0) + 1; Audio2.play('legend'); this.toast(`Sikerült! ${it.nev} +${it.upg}`, '#ffd34d'); } else { Audio2.play('hurt'); this.toast('A kovácsolás nem sikerült. Az anyag elveszett.', '#ff7a7a'); } recalc(G.P); this.renderShop(); },
  craftCat(d) { this.craftCat = d.c; this.renderShop(); },
  craftTier(d) { this.craftTier = +d.t; this.renderShop(); },
  craft(d) { const it = craftItem(d.b, +d.t, false); if (it) { G.S.inv.length < INV_MAX ? G.S.inv.push(it) : G.S.stash.push(it); Audio2.play(it.rar >= 3 ? 'legend' : 'level'); this.toast(`Elkészült: ${it.nev}`, RARITY[it.rar].c, 3); } this.renderShop(); this.renderInv(); },
  craftX(d) { const it = craftItem(d.b, +d.t, true); if (it) { G.S.inv.length < INV_MAX ? G.S.inv.push(it) : G.S.stash.push(it); Audio2.play('legend'); this.toast(`Elkészült: ${it.nev}`, RARITY[it.rar].c, 3); } this.renderShop(); this.renderInv(); },
  refill() { const S = G.S, c = this.refillCost(); if (S.gold < c) { this.toast('Nincs elég aranyad.', '#ff7a7a'); return; } S.gold -= c; S.potions = G.potMax(); Audio2.play('potion'); this.renderShop(); },
  brew(d) { const S = G.S, E = ELIX[d.id]; for (const m in E.recept) S.mats[m] -= E.recept[m]; S.gold -= E.ar; S.elix[d.id] = (S.elix[d.id] || 0) + 1; Audio2.play('potion'); this.toast(`Elkészült: ${E.nev}`, E.c); this.renderShop(); },
  buyFood(d) { const S = G.S, F = FOODS[d.id]; if (S.gold < F.ar) { this.toast('Nincs elég aranyad.', '#ff7a7a'); return; } S.gold -= F.ar; S.food[d.id] = (S.food[d.id] || 0) + 1; Audio2.play('gold'); this.renderShop(); },
  inn() { const S = G.S, P = G.P, c = this.innCost(); if (S.gold < c) return; S.gold -= c; S.surv.ebren = 100; S.surv.kaja = Math.min(100, S.surv.kaja + 40); S.surv.ital = Math.min(100, S.surv.ital + 40); P.hp = P.mhp; P.sta = P.msta; recalc(P); this.closeAll(); this.sleepFade(); this.toast('Kialudtad magad. Kurta egész éjjel böfögött a szomszéd szobában.', '#c48cff', 4); },
  gamble(d) { const S = G.S, R = REGION[d.r]; S.mats[R.mat] -= 6; S.gold -= R.lvl * 20 + 40; const it = genItem(R.lvl + 4 + G.diffLvl(), RNG, { mf: 80, cls: S.cls }); S.inv.length < INV_MAX ? S.inv.push(it) : S.stash.push(it); Audio2.play(it.rar >= 3 ? 'legend' : 'pickup'); this.toast(`Kaptál: ${it.nev}`, RARITY[it.rar].c, 3); this.renderShop(); this.renderInv(); },
  gambleRelic() { const S = G.S; S.mats.szilank -= 30; const pool = RELICS.filter(r => r.minL <= S.lvl + 3); const it = genItem(Math.max(S.lvl, 1), RNG, { relic: RNG.pick(pool).id }); S.inv.length < INV_MAX ? S.inv.push(it) : S.stash.push(it); Audio2.play('legend'); this.toast(`Ereklye: ${it.nev}`, RARITY[4].c, 4); this.renderShop(); this.renderInv(); },
  respec() { const S = G.S, cost = 100 + S.lvl * 40; if (S.gold < cost) return; S.gold -= cost; let sp = 0; for (const k in S.skills) sp += S.skills[k]; const first = Object.keys(SKILLS).find(k => SKILLS[k].cls === S.cls && SKILLS[k].tipus === 'aktiv'); S.skills = { [first]: 1 }; S.skillPts += sp - 1; let ap = 0; for (const k in S.attrs) { ap += S.attrs[k]; S.attrs[k] = 0; } S.attrPts += ap; S.slots = [first, null, null, null, null].map((x, i) => i === 0 ? first : (S.forbidden.includes(S.slots[i]) ? S.slots[i] : null)); recalc(G.P); this.toast('Mindent elfelejtettél. Kezdheted újra.', '#e6c47a'); this.renderShop(); },
  setName() { const v = $('#vnev').value.trim().slice(0, 24); if (v) { localStorage.setItem('multiverzum-nev', v); this.toast('Név mentve.', '#9fe07a'); } },
  connect() { Univ.connect(); setTimeout(() => this.renderShop(), 1500); },
  retP() { this.closeAll(); G.useReturnPortal(); },
  diff(d) { G.S.prog.diff = +d.d; recalc(G.P); this.kapu(); },
  go(d) { this.closeAll(); G.enterDungeon(d.r, +d.f); },
  hasadek() { this.closeAll(); G.enterHasadek(1, false); },
  hasadekX() { this.closeAll(); G.enterHasadek(Math.floor(G.S.prog.hasadek / 5) * 5, false); },
  weekly() { this.closeAll(); G.weeklyStart = performance.now(); Univ.connect(); G.enterHasadek(1, true); },
  claim(d) { Bounty.claim(+d.i); this.tabla(); },
  morseAns(d) { const { o, ex } = this.morseCtx; if (d.ok === '1') { ex.locked = null; o.inter = null; o.label = 'Megfejtve'; this.toast(`Helyes: ${o.word}. A zár kioldott.`, '#4dffb0'); Audio2.play('legend'); this.closeAll(); } else { this.toast('Rossz megfejtés. Az adó zajt sugároz – közelednek!', '#ff7a7a'); this.closeAll(); for (let i = 0; i < 4; i++) { const e = G.spawnEnemy('zajleny', o.x + RNG.range(-80, 80), o.y + RNG.range(-80, 80), G.map.lvl, {}); e.state = 'chase'; } } },
  morsePlay(d) { let t = 0; const U = 0.09; for (const c of d.w) { for (const s of MORSE[c] || '') { Audio2.tone(700, s === '·' ? U : U * 3, 'sine', 0.08, 0, t); t += (s === '·' ? U : U * 3) + U; } t += U * 2; } },
});
UI.restockShop = function () { const S = G.S; this.shopLvl = S.lvl; this.shopItems = []; for (let i = 0; i < 16; i++) this.shopItems.push(genItem(Math.max(1, S.lvl + RNG.int(-1, 2)), RNG, { cls: S.cls, mf: 50, rar: RNG() < 0.15 ? 2 : RNG() < 0.6 ? 1 : 0 })); };

// ---------------- Toldaléktorony-feladványok ----------------
const NYELV_TORONY = [
  { szo: 'házaimban', tok: ['ház', 'ai', 'm', 'ban'], tipp: 'ház + többes (gazdával: -ai-) + enyém + ban' },
  { szo: 'könyvekről', tok: ['könyv', 'ek', 'ről'], tipp: 'tő + többes + rag' },
  { szo: 'kertjeinkben', tok: ['kert', 'jei', 'nk', 'ben'], tipp: 'kert + jei + miénk + ben' },
  { szo: 'almáitokból', tok: ['almá', 'i', 'tok', 'ból'], tipp: 'almá + i + tiétek + ból' },
  { szo: 'zemlődben', tok: ['zemlő', 'i', 'd', 'ben'], tipp: 'kitalált szó – a sorrend nem a szótól függ' },
  { szo: 'kezeitekkel', tok: ['kez', 'ei', 'tek', 'kel'], tipp: 'a -vel a k után kk lesz' },
  { szo: 'megszentségteleníthetetlenségeitekért', tok: ['meg', 'szent', 'ség', 'telen', 'ít', 'het', 'etlen', 'ség', 'ei', 'tek', 'ért'], tipp: 'tizennégy emelet… ennyi talán elég', vegso: true },
];
const Nyelv = {
  cur: null, built: [],
  render() {
    const S = G.S; S.nyelv = S.nyelv || {};
    let h = '<div class="small">Építsd fel a tornyot: kattints a darabokra alulról felfelé – tő, szám, gazda, rag. Hibátlan torony = jutalom.</div>';
    if (this.cur == null) { h += NYELV_TORONY.map((t, i) => `<div class="row"><span>${S.nyelv[i] ? '✔' : '·'} ${t.vegso ? '<b style="color:#ff8a2a">A végső torony</b>' : `${i + 1}. torony`} <span class="small">(${t.tok.length} emelet)</span></span><button class="sm" data-a="nyStart" data-i="${i}">${S.nyelv[i] ? 'Újra' : 'Építés'}</button></div>`).join(''); return h; }
    const T = NYELV_TORONY[this.cur];
    h += `<div style="text-align:center;margin:10px 0"><div class="h" style="font-size:20px">${T.szo}</div><div class="small">${T.tipp}</div></div>`;
    h += `<div style="display:flex;flex-direction:column-reverse;align-items:center;gap:2px;min-height:60px">${this.built.map(b => `<div style="background:#3a3020;border:1px solid var(--bd);padding:3px 14px;border-radius:3px">${b}</div>`).join('')}</div>`;
    const pool = this.pool || (this.pool = T.tok.map((t, i) => ({ t, i })).sort(() => RNG() - 0.5));
    h += `<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:10px">${pool.map((p, k) => p.used ? '' : `<button data-a="nyPick" data-k="${k}">${p.t}</button>`).join('')}</div><div style="margin-top:8px;text-align:center"><button class="sm" data-a="nyBack">Vissza</button></div>`;
    return h;
  },
};
Object.assign(UI.acts, {
  nyStart(d) { Nyelv.cur = +d.i; Nyelv.built = []; Nyelv.pool = null; this.renderShop(); },
  nyBack() { Nyelv.cur = null; this.renderShop(); },
  nyPick(d) {
    const T = NYELV_TORONY[Nyelv.cur], p = Nyelv.pool[+d.k]; const need = T.tok[Nyelv.built.length];
    if (p.t !== need) { Audio2.play('hurt'); this.toast('Összedőlt! Rossz sorrend.', '#ff7a7a'); Nyelv.built = []; Nyelv.pool.forEach(x => x.used = false); this.renderShop(); return; }
    p.used = true; Nyelv.built.push(p.t); Audio2.play('ui');
    if (Nyelv.built.length === T.tok.length) {
      const S = G.S, first = !S.nyelv[Nyelv.cur]; S.nyelv[Nyelv.cur] = 1; Audio2.play('legend');
      if (first) { if (T.vegso) { const it = genItem(Math.max(S.lvl, 10), RNG, { rar: 3, base: 'amulett' }); it.nev = 'Megszentségteleníthetetlenség amulettje'; S.inv.push(it); S.skillPts += 2; this.toast('A végső torony áll! +2 képességpont és egy legendás amulett.', '#ff8a2a', 5); } else { S.attrPts += 2; S.mats.szilank = (S.mats.szilank || 0) + 4; this.toast(`Torony kész: ${T.szo}! +2 tulajdonságpont, +4 kapuszilánk`, '#9fe07a', 4); } }
      else { S.gold += 20; this.toast(`Torony kész: ${T.szo} (+20 arany)`, '#9fe07a'); }
      if (NYELV_TORONY.slice(0, 6).every((_, i) => S.nyelv[i])) Univ.set('kp:nyelv');
      Nyelv.cur = null;
    }
    this.renderShop();
  },
});
