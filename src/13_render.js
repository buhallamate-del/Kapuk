// ============================================================
//  MEGJELENÍTÉS
// ============================================================
const R = {
  init(canvas) {
    this.c = canvas; this.g = canvas.getContext('2d'); this.light = document.createElement('canvas'); this.lg = this.light.getContext('2d');
    this.resize(); addEventListener('resize', () => this.resize());
  },
  resize() {
    const dpr = Math.min(2, devicePixelRatio || 1); this.c.width = Math.floor(innerWidth * dpr); this.c.height = Math.floor(innerHeight * dpr);
    G.zoom = Math.max(this.c.width / 1400, this.c.height / 820); G.W = this.c.width / G.zoom; G.H = this.c.height / G.zoom;
    this.light.width = Math.ceil(this.c.width / 2); this.light.height = Math.ceil(this.c.height / 2);
  },
  frame() {
    const g = this.g, m = G.map; if (!m) return;
    const z = G.zoom, cw = this.c.width, ch = this.c.height;
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = G.pal.void; g.fillRect(0, 0, cw, ch);
    const sx = (RNG() - 0.5) * G.cam.shake, sy = (RNG() - 0.5) * G.cam.shake;
    const ox = G.cam.x - G.W / 2 + sx, oy = G.cam.y - G.H / 2 + sy;
    g.setTransform(z, 0, 0, z, -ox * z, -oy * z);
    this.ox = ox; this.oy = oy;
    // statikus réteg
    const vx0 = Math.max(0, Math.floor(ox)), vy0 = Math.max(0, Math.floor(oy)), vw = Math.min(G.staticLayer.width - vx0, Math.ceil(G.W) + 2), vh = Math.min(G.staticLayer.height - vy0, Math.ceil(G.H) + 2);
    if (vw > 0 && vh > 0) g.drawImage(G.staticLayer, vx0, vy0, vw, vh, vx0, vy0, vw, vh);
    this.hazAnim(g, m, ox, oy);
    this.grounds(g); this.teles(g);
    const vis = o => o.x > ox - 80 && o.x < ox + G.W + 80 && o.y > oy - 80 && o.y < oy + G.H + 80;
    for (const o of m.objs) if (!o.dead && vis(o)) this.obj(g, o);
    for (const p of G.pickups) if (vis(p)) this.pickup(g, p);
    if (m.region === 'otthon') Home.overlay(g);
    // entitások y szerint
    const ents = G.enemies.filter(e => !e.dead && vis(e));
    ents.push(G.P); for (const a of G.allies) if (vis(a)) ents.push(a);
    ents.sort((a, b) => a.y - b.y);
    for (const e of ents) { if (e === G.P) this.player(g, e); else if (e.kind) this.ally(g, e); else this.enemy(g, e); }
    for (const l of G.lobs) { const t = l.t / l.dur, x = lerp(l.x0, l.x1, t), y = lerp(l.y0, l.y1, t) - Math.sin(t * Math.PI) * 80; g.fillStyle = '#3a4a2a'; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(lerp(l.x0, l.x1, t), lerp(l.y0, l.y1, t), 6, 3, 0, 0, 7); g.fill(); }
    for (const p of G.projs) if (vis(p)) this.proj(g, p);
    for (const e of G.enemies) if (e.beam && !e.dead) this.beam(g, e);
    this.particles(g);
    // fények
    this.lighting(g, m, ox, oy);
    g.setTransform(z, 0, 0, z, -ox * z, -oy * z);
    this.labels(g, ox, oy);
    for (const t of G.texts) { const a = 1 - t.t / t.life; g.globalAlpha = Math.min(1, a * 2); g.font = `bold ${t.size}px system-ui,sans-serif`; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.75)'; g.strokeText(t.s, t.x, t.y); g.fillStyle = t.c; g.fillText(t.s, t.x, t.y); }
    g.globalAlpha = 1;
    // képernyő-effektek
    g.setTransform(1, 0, 0, 1, 0, 0);
    const P = G.P;
    if (P.hp < P.mhp * 0.3 && !P.dead) { const a = (1 - P.hp / (P.mhp * 0.3)) * (0.35 + 0.15 * Math.sin(G.t * 6)); const gr = g.createRadialGradient(cw / 2, ch / 2, ch * 0.3, cw / 2, ch / 2, ch * 0.8); gr.addColorStop(0, 'rgba(120,0,0,0)'); gr.addColorStop(1, `rgba(150,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, cw, ch); }
    if (P.bulletTime) { g.fillStyle = 'rgba(242,211,107,0.08)'; g.fillRect(0, 0, cw, ch); }
    if (G.mapIs('eh') && P.w) { g.fillStyle = `rgba(150,90,255,${Math.abs(P.w) * 0.03})`; g.fillRect(0, 0, cw, ch); }
    if (G.flash > 0) { g.fillStyle = `rgba(255,255,255,${G.flash * 0.6})`; g.fillRect(0, 0, cw, ch); }
    if (G.hurtFlash > 0) { const a = Math.min(0.45, G.hurtFlash); const gr = g.createRadialGradient(cw / 2, ch / 2, ch * 0.35, cw / 2, ch / 2, ch * 0.75); gr.addColorStop(0, 'rgba(255,0,0,0)'); gr.addColorStop(1, `rgba(220,20,20,${a})`); g.fillStyle = gr; g.fillRect(0, 0, cw, ch); }
    if (G.slowmo > 0) { g.fillStyle = `rgba(200,240,255,${Math.min(0.12, G.slowmo * 0.35)})`; g.fillRect(0, 0, cw, ch); }
    if (UI.sleepT > 0) { g.fillStyle = `rgba(0,0,10,${Math.min(1, UI.sleepT)})`; g.fillRect(0, 0, cw, ch); }
  },
  hazAnim(g, m, ox, oy) {
    const R0 = REGION[m.region]; if (!R0) return; const fx = R0.haz.fx;
    if (fx !== 'burn' && fx !== 'pull' && fx !== 'drain') return;
    const x0 = Math.max(0, Math.floor(ox / TILE)), y0 = Math.max(0, Math.floor(oy / TILE)), x1 = Math.min(m.w - 1, Math.ceil((ox + G.W) / TILE)), y1 = Math.min(m.h - 1, Math.ceil((oy + G.H) / TILE));
    const t = G.t;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (m.t[y * m.w + x] !== T_HAZ) continue; const s = m.shade[y * m.w + x] / 255;
      const a = 0.25 + 0.2 * Math.sin(t * 2 + s * 10);
      g.fillStyle = fx === 'burn' ? `rgba(255,${120 + 60 * Math.sin(t + s * 6) | 0},20,${a})` : fx === 'pull' ? `rgba(120,60,220,${a})` : `rgba(80,255,170,${a * 0.6})`;
      g.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  },
  grounds(g) {
    for (const q of G.grounds) {
      const a = Math.min(1, q.t / 0.6) * 0.5;
      if (q.own === 'honey') g.fillStyle = `rgba(230,160,20,${a})`; else g.fillStyle = q.dt === 'tuz' ? `rgba(255,${90 + 50 * Math.sin(G.t * 9 + q.x) | 0},20,${a})` : `rgba(160,120,255,${a})`;
      g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.fill();
      if (q.dt === 'tuz' && RNG() < 0.25) G.parts.push({ x: q.x + RNG.range(-q.r, q.r) * 0.7, y: q.y + RNG.range(-q.r, q.r) * 0.7, vx: 0, vy: -40, t: 0, life: 0.5, c: '#ffb347', size: 3, drag: 1, glow: true });
    }
  },
  teles(g) {
    for (const t of G.teles) {
      const k = t.t / t.delay;
      if (t.line) { g.save(); g.translate(t.x, t.y); g.rotate(t.a); g.fillStyle = `rgba(255,60,60,${0.12 + k * 0.2})`; g.fillRect(0, -t.w / 2, t.len, t.w); g.restore(); continue; }
      const enemy = t.own === 'e' || t.own === 'env';
      g.strokeStyle = enemy ? 'rgba(255,70,70,.8)' : 'rgba(255,220,120,.7)'; g.lineWidth = 2;
      g.beginPath(); g.arc(t.x, t.y, t.r, 0, 7); g.stroke();
      g.fillStyle = enemy ? `rgba(255,40,40,${0.12 + 0.25 * k})` : `rgba(255,200,80,${0.1 + 0.2 * k})`;
      g.beginPath(); g.arc(t.x, t.y, t.r * k, 0, 7); g.fill();
    }
  },
  shadow(g, x, y, r) { g.fillStyle = 'rgba(0,0,0,.32)'; g.beginPath(); g.ellipse(x, y + r * 0.8, r * 1.05, r * 0.45, 0, 0, 7); g.fill(); },
  obj(g, o) {
    const t = G.t;
    switch (o.type) {
      case 'exit': {
        const lock = (G.map.mech === 'eh' && G.P.w !== G.map.exitW) || o.locked;
        for (let i = 3; i > 0; i--) { g.fillStyle = `rgba(${lock ? '200,80,80' : '120,200,255'},${0.12 * i})`; g.beginPath(); g.ellipse(o.x, o.y, o.r * (1 + i * 0.25) + Math.sin(t * 3) * 2, o.r * 0.6 * (1 + i * 0.25), 0, 0, 7); g.fill(); }
        g.fillStyle = '#050508'; g.beginPath(); g.ellipse(o.x, o.y, o.r, o.r * 0.55, 0, 0, 7); g.fill();
        g.strokeStyle = lock ? '#ff6a6a' : '#9fe8ff'; g.lineWidth = 2; g.beginPath(); g.ellipse(o.x, o.y, o.r, o.r * 0.55, 0, 0, 7); g.stroke();
        for (let i = 0; i < 3; i++) { const a = t * 2 + i * 2.1; g.fillStyle = lock ? '#ff9a9a' : '#dff8ff'; g.fillRect(o.x + Math.cos(a) * o.r * 0.7, o.y + Math.sin(a) * o.r * 0.35, 2, 2); }
        break;
      }
      case 'portal': case 'kapu': {
        const r = o.r, c = o.c || '#9fe8ff';
        const gr = g.createRadialGradient(o.x, o.y, 2, o.x, o.y, r * 1.4); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, c); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.beginPath(); g.ellipse(o.x, o.y, r * 0.8 + Math.sin(t * 2) * 3, r * 1.2, 0, 0, 7); g.fill();
        g.strokeStyle = o.type === 'kapu' ? '#d9a441' : c; g.lineWidth = o.type === 'kapu' ? 6 : 3; g.beginPath(); g.ellipse(o.x, o.y, r * 0.85, r * 1.25, 0, 0, 7); g.stroke();
        if (o.type === 'kapu') { g.fillStyle = '#7d6a4a'; g.fillRect(o.x - r - 8, o.y + r * 1.1, 2 * r + 16, 10); for (let i = 0; i < 7; i++) { const a = t * 0.6 + i * 0.9; g.fillStyle = ['#9fe8ff', '#ffd34d', '#ff8ac8', '#c48cff', '#ff7a2a', '#4dffb0', '#dfefff'][i]; g.beginPath(); g.arc(o.x + Math.cos(a) * r * 1.5, o.y + Math.sin(a) * r * 1.6, 4, 0, 7); g.fill(); } }
        break;
      }
      case 'chest': this.shadow(g, o.x, o.y, 12); g.fillStyle = o.open ? '#4a3420' : o.gold ? '#d9a441' : o.rich ? '#8a5a2a' : '#6b4a2a'; g.fillRect(o.x - 13, o.y - 9, 26, 18); g.fillStyle = o.gold ? '#fff0a0' : '#c9a050'; g.fillRect(o.x - 13, o.y - 3, 26, 3); g.fillRect(o.x - 2, o.y - 5, 4, 6); if (o.open) { g.fillStyle = '#2a1a10'; g.fillRect(o.x - 12, o.y - 15, 24, 6); } else if (o.rich || o.gold) { g.fillStyle = `rgba(255,220,100,${0.2 + 0.15 * Math.sin(t * 3)})`; g.beginPath(); g.arc(o.x, o.y, 22, 0, 7); g.fill(); } break;
      case 'barrel': this.shadow(g, o.x, o.y, 10); g.fillStyle = o.boom ? '#a83a2a' : '#7a5a34'; g.beginPath(); g.ellipse(o.x, o.y, 10, 12, 0, 0, 7); g.fill(); g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(o.x - 10, o.y - 4); g.lineTo(o.x + 10, o.y - 4); g.moveTo(o.x - 10, o.y + 4); g.lineTo(o.x + 10, o.y + 4); g.stroke(); if (o.boom) { g.fillStyle = '#ffcc33'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.fillText('!', o.x, o.y + 3); } break;
      case 'shrine': g.fillStyle = '#555'; g.fillRect(o.x - 10, o.y - 4, 20, 14); g.fillStyle = o.used ? '#444' : o.c; g.beginPath(); g.moveTo(o.x, o.y - 26); g.lineTo(o.x + 8, o.y - 4); g.lineTo(o.x - 8, o.y - 4); g.closePath(); g.fill(); if (!o.used) { g.fillStyle = o.c + '44'; g.beginPath(); g.arc(o.x, o.y - 10, 24 + Math.sin(t * 3) * 3, 0, 7); g.fill(); } break;
      case 'node': { const N = NODES[o.kind]; this.shadow(g, o.x, o.y, 11); g.font = '20px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(N.ikon, o.x, o.y); g.textBaseline = 'alphabetic'; g.strokeStyle = N.c; g.globalAlpha = 0.4 + 0.3 * Math.sin(t * 3); g.lineWidth = 1.5; g.beginPath(); g.arc(o.x, o.y, 16, 0, 7); g.stroke(); g.globalAlpha = 1; break; }
      case 'hive': if (o.hp <= 0) break; this.shadow(g, o.x, o.y, 14); g.fillStyle = '#c98a14'; g.beginPath(); g.ellipse(o.x, o.y - 4, 14, 18, 0, 0, 7); g.fill(); g.strokeStyle = '#7a5208'; g.lineWidth = 2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(o.x - 13, o.y - 4 + i * 6); g.lineTo(o.x + 13, o.y - 4 + i * 6); g.stroke(); } g.fillStyle = '#222'; g.beginPath(); g.arc(o.x, o.y + 4, 3, 0, 7); g.fill(); this.hpbar(g, o.x, o.y - 26, 26, o.hp / o.mhp, '#ffcc00'); break;
      case 'jelado': g.fillStyle = '#3a2a66'; g.fillRect(o.x - 4, o.y - 20, 8, 26); g.fillStyle = `rgba(196,140,255,${0.5 + 0.5 * Math.sin(t * 5)})`; g.beginPath(); g.arc(o.x, o.y - 22, 6, 0, 7); g.fill(); break;
      case 'radio': g.fillStyle = '#4b5240'; g.fillRect(o.x - 12, o.y - 10, 24, 18); g.fillStyle = '#171a14'; g.beginPath(); g.arc(o.x - 4, o.y, 5, 0, 7); g.fill(); g.strokeStyle = '#d8c48a'; g.beginPath(); g.moveTo(o.x + 8, o.y - 10); g.lineTo(o.x + 14, o.y - 28); g.stroke(); g.fillStyle = Math.sin(t * 8) > 0 ? '#4dffb0' : '#1a3a2a'; g.fillRect(o.x + 4, o.y - 6, 4, 4); break;
      case 'buborek': { const vis = G.P.w === o.w ? 1 : 0.12; g.globalAlpha = vis; const gr = g.createRadialGradient(o.x, o.y, 2, o.x, o.y, o.r * 1.5); gr.addColorStop(0, '#fff'); gr.addColorStop(0.4, 'rgba(196,140,255,.6)'); gr.addColorStop(1, 'rgba(196,140,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(o.x, o.y, o.r * 1.5 + Math.sin(t * 2) * 3, 0, 7); g.fill(); g.globalAlpha = 1; break; }
      case 'npc': this.npc(g, o); break;
      case 'tabla': g.fillStyle = '#5a4026'; g.fillRect(o.x - 2, o.y - 6, 4, 18); g.fillStyle = '#8a6a40'; g.fillRect(o.x - 16, o.y - 22, 32, 20); g.fillStyle = '#e8dcc0'; for (let i = 0; i < 3; i++) g.fillRect(o.x - 13 + i * 9, o.y - 19, 7, 9); break;
      case 'stash': g.fillStyle = '#2a3a52'; g.fillRect(o.x - 14, o.y - 14, 28, 26); g.fillStyle = '#e07b26'; g.fillRect(o.x - 14, o.y - 14, 28, 4); g.fillStyle = '#f2c230'; g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.fillText('976', o.x, o.y + 4); break;
      case 'anvil': g.fillStyle = '#3a3a40'; g.fillRect(o.x - 12, o.y - 6, 24, 8); g.fillRect(o.x - 5, o.y + 2, 10, 8); g.fillStyle = `rgba(255,140,40,${0.4 + 0.3 * Math.sin(t * 7)})`; g.beginPath(); g.arc(o.x + 18, o.y, 6, 0, 7); g.fill(); break;
      case 'cauldron': g.fillStyle = '#222'; g.beginPath(); g.ellipse(o.x, o.y, 13, 10, 0, 0, 7); g.fill(); g.fillStyle = '#7fd06a'; g.beginPath(); g.ellipse(o.x, o.y - 4, 10, 4, 0, 0, 7); g.fill(); if (RNG() < 0.2) G.parts.push({ x: o.x + RNG.range(-6, 6), y: o.y - 6, vx: 0, vy: -30, t: 0, life: 0.8, c: 'rgba(160,255,140,.6)', size: 3, drag: 0.5 }); break;
      case 'bed': g.fillStyle = '#6b3a2a'; g.fillRect(o.x - 14, o.y - 8, 28, 16); g.fillStyle = '#e8e0d0'; g.fillRect(o.x - 13, o.y - 7, 9, 14); g.fillStyle = '#5a7ab0'; g.fillRect(o.x - 4, o.y - 7, 17, 14); break;
    }
  },
  npc(g, o) {
    const N = NPCS[o.id], L = N.look, x = o.x, y = o.y + Math.sin(G.t * 2 + x) * 1;
    this.shadow(g, x, y, 11);
    g.fillStyle = L.c; g.beginPath(); g.ellipse(x, y, 10, 12, 0, 0, 7); g.fill();
    g.fillStyle = '#f0c8a0'; g.beginPath(); g.arc(x, y - 14, 7, 0, 7); g.fill();
    g.fillStyle = L.c2;
    switch (L.hat) {
      case 'cap': g.fillRect(x - 8, y - 22, 16, 5); g.fillRect(x, y - 19, 10, 2); break;
      case 'veil': g.globalAlpha = 0.6; g.beginPath(); g.arc(x, y - 16, 11, Math.PI, 0); g.fill(); g.fillRect(x - 11, y - 16, 22, 8); g.globalAlpha = 1; break;
      case 'kendo': g.beginPath(); g.arc(x, y - 15, 8, Math.PI * 1.05, -0.05); g.fill(); g.fillStyle = '#b45a8a'; g.fillRect(x - 9, y - 16, 18, 3); break;
      case 'goggles': g.fillStyle = '#ffcc33'; g.fillRect(x - 7, y - 16, 5, 3); g.fillRect(x + 2, y - 16, 5, 3); break;
      case 'helmet': g.fillStyle = '#ffdd55'; g.beginPath(); g.arc(x, y - 16, 8, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - 2, y - 22, 4, 3); break;
      case 'phones': g.strokeStyle = '#222'; g.lineWidth = 2; g.beginPath(); g.arc(x, y - 15, 8, Math.PI, 0); g.stroke(); g.fillStyle = '#222'; g.fillRect(x - 9, y - 16, 3, 5); g.fillRect(x + 6, y - 16, 3, 5); break;
      case 'helmet2': g.strokeStyle = '#e8e8f0'; g.lineWidth = 2; g.beginPath(); g.arc(x, y - 14, 9, 0, 7); g.stroke(); g.fillStyle = 'rgba(160,200,255,.3)'; g.beginPath(); g.arc(x, y - 14, 8, 0, 7); g.fill(); break;
      case 'beard': g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(x, y - 10, 6, 0, Math.PI); g.fill(); g.fillStyle = '#ffd0e8'; g.fillRect(x - 4, y - 2, 8, 3); break;
      case 'bald': g.fillStyle = '#f0f0f0'; g.beginPath(); g.moveTo(x - 4, y - 9); g.lineTo(x, y - 2); g.lineTo(x + 4, y - 9); g.fill(); break;
      case 'glasses': g.strokeStyle = '#222'; g.lineWidth = 1.5; g.strokeRect(x - 6, y - 16, 5, 4); g.strokeRect(x + 1, y - 16, 5, 4); break;
      case 'hair': g.fillStyle = '#c23a3a'; g.beginPath(); g.arc(x, y - 17, 8, Math.PI, 0); g.fill(); g.fillRect(x - 8, y - 18, 3, 9); break;
    }
    const hasQ = Quests.available(o.id).length, done = Quests.active().some(q => q.giver === o.id && G.S.quests[q.id].st === 'kesz');
    if (done || hasQ) { g.font = 'bold 16px sans-serif'; g.textAlign = 'center'; g.fillStyle = done ? '#9fe07a' : '#ffd34d'; g.fillText(done ? '?' : '!', x, y - 28 + Math.sin(G.t * 4) * 2); }
  },
  pickup(g, p) {
    const y = p.y + p.z, t = G.t;
    if (p.kind === 'gold') { g.fillStyle = '#ffd34d'; g.beginPath(); g.ellipse(p.x, y, 5, 3.5, 0, 0, 7); g.fill(); g.fillStyle = '#fff6b0'; g.fillRect(p.x - 1, y - 2, 2, 2); }
    else if (p.kind === 'potion') { g.fillStyle = '#ff3355'; g.beginPath(); g.arc(p.x, y, 5, 0, 7); g.fill(); g.fillStyle = '#ddd'; g.fillRect(p.x - 2, y - 9, 4, 4); }
    else if (p.kind === 'food') { g.font = '14px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(FOODS[p.v].ikon, p.x, y); g.textBaseline = 'alphabetic'; }
    else if (p.kind === 'mat') { g.fillStyle = MATS[p.v].c; g.beginPath(); g.moveTo(p.x, y - 6); g.lineTo(p.x + 5, y); g.lineTo(p.x, y + 6); g.lineTo(p.x - 5, y); g.closePath(); g.fill(); }
    else if (p.kind === 'quest') { const Q = QITEMS[p.v]; g.fillStyle = `rgba(255,230,120,${0.25 + 0.2 * Math.sin(t * 4)})`; g.beginPath(); g.arc(p.x, y, 18, 0, 7); g.fill(); g.font = '18px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(Q.ikon, p.x, y); g.textBaseline = 'alphabetic'; }
    else if (p.kind === 'item') {
      const c = RARITY[p.it.rar].c; if (p.it.rar >= 2) { g.fillStyle = c + '33'; g.beginPath(); g.arc(p.x, y, 16 + Math.sin(t * 4) * 2, 0, 7); g.fill(); }
      if (p.it.rar >= 3) { g.strokeStyle = c; g.globalAlpha = 0.5; g.beginPath(); g.moveTo(p.x, y); g.lineTo(p.x, y - 140); g.lineWidth = 3; g.stroke(); g.globalAlpha = 1; }
      g.font = '15px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(BASES[p.it.base].ikon, p.x, y); g.textBaseline = 'alphabetic';
    }
  },
  labels(g, ox, oy) {
    // tárgycímkék a földön (Alt-tal mindet)
    const P = G.P, all = Input.keys.has('Alt');
    g.font = 'bold 10px system-ui,sans-serif'; g.textAlign = 'center';
    for (const p of G.pickups) {
      if (p.kind !== 'item') continue; if (!all && dist(p, P) > 160 && p.it.rar < 2) continue;
      const s = p.it.nev, w = g.measureText(s).width + 8;
      g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(p.x - w / 2, p.y - 26, w, 13); g.fillStyle = RARITY[p.it.rar].c; g.fillText(s, p.x, p.y - 16);
    }
    // interakció
    const ni = G.nearInteract();
    if (ni && !P.dead) { const s = `[E] ${ni.label || ''}`; g.font = 'bold 12px system-ui,sans-serif'; const w = g.measureText(s).width + 12; g.fillStyle = 'rgba(0,0,0,.7)'; g.fillRect(ni.x - w / 2, ni.y - (ni.r || 14) - 34, w, 18); g.fillStyle = '#ffe9b0'; g.fillText(s, ni.x, ni.y - (ni.r || 14) - 21); }
    // NPC nevek
    for (const o of G.map.objs) if (o.type === 'npc' && dist(o, P) < 260) { g.font = '10px system-ui,sans-serif'; g.fillStyle = 'rgba(255,240,200,.85)'; g.fillText(NPCS[o.id].nev, o.x, o.y + 26); }
    // ellenfél nevek
    for (const e of G.enemies) {
      if (e.dead || (!e.elite && !e.champion && !e.named && !e.ancient) || dist(e, P) > 500) continue;
      const nm = e.nameTxt || (e.mods.map(m => ELITE_MODS[m] ? ELITE_MODS[m].nev : '').join(', ') + ' ' + e.def.nev);
      g.font = `bold ${e.ancient ? 12 : 10}px system-ui,sans-serif`; g.fillStyle = e.ancient ? '#ff3355' : e.named ? '#ffb347' : e.champion ? '#ffd34d' : '#6fa8ff';
      g.fillText(nm + (e.ancient ? ` · ${e.lvl}. szint` : ''), e.x, e.y - e.r - 16);
    }
  },
  hpbar(g, x, y, w, f, c) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x - w / 2 - 1, y - 1, w + 2, 5); g.fillStyle = c; g.fillRect(x - w / 2, y, w * clamp(f, 0, 1), 3); },
  player(g, P) {
    if (P.dead) return;
    const C = CLASSES[G.S.cls], x = P.x, y = P.y, a = P.aim, t = G.t;
    if (P.invul > 0 && Math.floor(t * 20) % 2) g.globalAlpha = 0.6;
    this.shadow(g, x, y, 11);
    // lépés
    const bob = Math.sin(P.step * 2) * 1.5;
    if (P.shieldV > 0) { g.strokeStyle = 'rgba(160,230,255,.5)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y - 4, 18, 0, 7); g.stroke(); }
    // köpeny / test
    g.fillStyle = '#20232a'; g.beginPath(); g.ellipse(x, y + 2, 10, 9, 0, 0, 7); g.fill();
    g.fillStyle = C.szin; g.beginPath(); g.ellipse(x, y - 2 + bob * 0.3, 9, 10, 0, 0, 7); g.fill();
    if (G.S.cls === 'mernok') { g.fillStyle = '#556070'; g.fillRect(x - 8 - Math.cos(a) * 4, y - 8, 7, 10); }
    if (G.S.cls === 'elem') { g.fillStyle = '#2a3a7a'; g.beginPath(); g.moveTo(x - 10, y + 8); g.lineTo(x + 10, y + 8); g.lineTo(x, y - 6); g.closePath(); g.fill(); }
    // fej
    g.fillStyle = '#f0c8a0'; g.beginPath(); g.arc(x, y - 12 + bob * 0.3, 6, 0, 7); g.fill();
    if (G.S.cls === 'elem') { g.fillStyle = '#2a3a7a'; g.beginPath(); g.moveTo(x - 7, y - 13); g.lineTo(x + 7, y - 13); g.lineTo(x + 2, y - 26); g.closePath(); g.fill(); }
    if (G.S.cls === 'penge') { g.fillStyle = '#9aa3ad'; g.beginPath(); g.arc(x, y - 13, 6.5, Math.PI, 0); g.fill(); }
    if (G.S.cls === 'loves') { g.fillStyle = '#4a5a3a'; g.fillRect(x - 7, y - 18, 14, 4); }
    if (G.S.cls === 'mernok') { g.fillStyle = '#ffcc33'; g.fillRect(x - 5, y - 15, 4, 3); g.fillRect(x + 1, y - 15, 4, 3); }
    // fegyver
    const w = G.S.eq.fegyver, B = w ? BASES[w.base] : null;
    g.save(); g.translate(x, y - 4);
    if (B && B.kind === 'melee') {
      const sw = P.swing > 0 ? (P.swing / 0.18) : 0; const aa = a + (sw ? (0.5 - sw) * B.arc * 1.2 : 0.9);
      g.rotate(aa); g.fillStyle = '#d8d8e0'; g.fillRect(8, -2, B.range * 0.55, 4); g.fillStyle = '#6b4a2a'; g.fillRect(4, -3, 6, 6);
      if (w.base === 'poroly') { g.fillStyle = '#8a8a90'; g.fillRect(B.range * 0.45, -8, 12, 16); }
      if (w.base === 'lancfuresz') { g.fillStyle = '#ffcc33'; g.fillRect(8, -4, B.range * 0.5, 2); }
    } else if (B) {
      g.rotate(a); const rc = P.recoil > 0 ? -4 : 0;
      if (B.kind === 'spell') { g.fillStyle = '#6b4a2a'; g.fillRect(6, -1.5, 22, 3); g.fillStyle = DT[B.dtype].c; g.beginPath(); g.arc(30, 0, 4 + Math.sin(t * 8), 0, 7); g.fill(); }
      else { g.fillStyle = '#2a2d33'; g.fillRect(6 + rc, -3, w.base === 'puska' ? 28 : w.base === 'raketaveto' ? 26 : 16, w.base === 'raketaveto' ? 7 : 5); g.fillStyle = '#6b4a2a'; g.fillRect(4 + rc, -2, 6, 6); }
    }
    g.restore();
    P.swing = Math.max(0, (P.swing || 0) - 1 / 60); P.recoil = Math.max(0, (P.recoil || 0) - 1 / 60);
    g.globalAlpha = 1;
    // csatornázás
    if (P.chan) { const f = P.chan.t / P.chan.dur; g.strokeStyle = P.chan.c; g.lineWidth = 3; g.beginPath(); g.arc(x, y - 4, 22, -Math.PI / 2, -Math.PI / 2 + f * 6.283); g.stroke(); }
  },
  ally(g, a) {
    const t = G.t;
    if (a.kind === 'dron') { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(a.x, a.y + 14, 6, 2, 0, 0, 7); g.fill(); g.fillStyle = a.grey ? '#9a9a9a' : '#5fa0c0'; g.beginPath(); g.arc(a.x, a.y, 6, 0, 7); g.fill(); g.strokeStyle = '#ccc'; g.lineWidth = 1; g.beginPath(); g.moveTo(a.x - 9, a.y - 2 + Math.sin(t * 40)); g.lineTo(a.x + 9, a.y - 2 - Math.sin(t * 40)); g.stroke(); g.fillStyle = '#7fd8ff'; g.fillRect(a.x - 1, a.y - 1, 2, 2); }
    else if (a.kind === 'torony') { this.shadow(g, a.x, a.y, 10); g.fillStyle = '#556070'; g.fillRect(a.x - 9, a.y - 6, 18, 14); g.save(); g.translate(a.x, a.y - 4); g.rotate(a.aim || 0); g.fillStyle = '#2a2f38'; g.fillRect(0, -2, 16, 4); g.restore(); g.fillStyle = '#ffcc33'; g.beginPath(); g.arc(a.x, a.y - 4, 4, 0, 7); g.fill(); }
    else if (a.kind === 'meh') { g.fillStyle = '#ffcc00'; g.beginPath(); g.ellipse(a.x, a.y, 4, 3, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(a.x, a.y - 3, 3, 2, 0, 0, 7); g.fill(); }
    else if (a.kind === 'orbit') { g.save(); g.translate(a.x, a.y); g.rotate(a.ang + Math.PI / 2); g.fillStyle = 'rgba(200,230,255,.8)'; g.fillRect(-2, -14, 4, 24); g.restore(); }
    else if (a.kind === 'mine') { g.fillStyle = '#3a3a3a'; g.beginPath(); g.arc(a.x, a.y, 7, 0, 7); g.fill(); g.fillStyle = Math.sin(t * 10) > 0 ? '#ff3333' : '#550000'; g.beginPath(); g.arc(a.x, a.y, 2, 0, 7); g.fill(); }
    else if (a.kind === 'bh') { const r = 40; const gr = g.createRadialGradient(a.x, a.y, 4, a.x, a.y, r * 2.2); gr.addColorStop(0, '#000'); gr.addColorStop(0.45, '#000'); gr.addColorStop(0.55, '#ffb347'); gr.addColorStop(1, 'rgba(196,140,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(a.x, a.y, r * 2.2, 0, 7); g.fill(); }
  },
  enemy(g, e) {
    const L = e.look, x = e.x, y = e.y, r = e.r, t = G.t + (e.x % 7);
    if (e.invisNow) { g.globalAlpha = 0.07 + 0.05 * Math.sin(t * 10); }
    if (e.wphase && G.mapIs('eh') && e.w !== G.P.w) g.globalAlpha = 0.25;
    if (e.ancient) { g.fillStyle = `rgba(255,30,60,${0.15 + 0.1 * Math.sin(t * 3)})`; g.beginPath(); g.arc(x, y, r * 1.8, 0, 7); g.fill(); }
    else if (L.glow) { g.fillStyle = L.glow + '30'; g.beginPath(); g.arc(x, y, r * 1.5, 0, 7); g.fill(); }
    if (e.def.ai !== 'turret' || L.s !== 'chain') this.shadow(g, x, y, r);
    const fl = e.flash > 0;
    const c = fl ? '#ffffff' : (e.freeze > 0 ? '#9fe8ff' : L.c), c2 = fl ? '#ffffff' : L.c2;
    const face = e.face != null ? e.face : 0;
    // előjelzések a talajon: lendítés-ék, robbanó kör, célzó izzás
    if (e.wind > 0 && e.windR && !e.boss) { const k = 1 - e.wind / (e.windMax || 0.5); g.fillStyle = `rgba(255,60,50,${0.1 + 0.28 * k})`; g.beginPath(); g.moveTo(x, y); g.arc(x, y, e.windR * (0.35 + 0.65 * k), e.windA - e.windW, e.windA + e.windW); g.closePath(); g.fill(); g.strokeStyle = `rgba(255,120,100,${0.35 + 0.5 * k})`; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, e.windR, e.windA - e.windW, e.windA + e.windW); g.stroke(); }
    if (e.fuse > 0) { const k = 1 - e.fuse / (e.fuseMax || 0.6); g.strokeStyle = `rgba(255,120,40,${0.5 + 0.4 * k})`; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 80, 0, 7); g.stroke(); g.fillStyle = `rgba(255,90,20,${0.08 + 0.22 * k})`; g.beginPath(); g.arc(x, y, 80 * k, 0, 7); g.fill(); }
    if (e.aimT > 0 && !e.invisNow) { const P = G.P, k = 1 - e.aimT / 0.4, a = Math.atan2(P.y - y, P.x - x); g.strokeStyle = `rgba(255,90,90,${0.12 + 0.3 * k})`; g.lineWidth = 1; g.setLineDash([4, 6]); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 260, y + Math.sin(a) * 260); g.stroke(); g.setLineDash([]); g.fillStyle = `rgba(255,230,150,${0.5 + 0.5 * k})`; g.beginPath(); g.arc(x + Math.cos(a) * (r + 3), y + Math.sin(a) * (r + 3), 2 + 3 * k, 0, 7); g.fill(); }
    g.save(); g.translate(x, y);
    if (e.wind > 0 || e.fuse > 0) { const k = Math.sin(t * 40) * 1.5; g.translate(k, 0); }
    if (e.hitT > 0) { const k = e.hitT / 0.14; g.scale(1 + 0.22 * k, 1 - 0.16 * k); e.hitT -= 1 / 60; }
    if (e.boss) this.bossShape(g, e, c, c2, t);
    else switch (L.s) {
      case 'bug': for (let i = -1; i <= 1; i++) { g.strokeStyle = c2; g.lineWidth = 1.5; g.beginPath(); g.moveTo(i * r * 0.5, 0); g.lineTo(i * r * 0.5 + Math.sin(t * 15 + i) * 3, r * 1.1); g.moveTo(i * r * 0.5, 0); g.lineTo(i * r * 0.5 - Math.sin(t * 15 + i) * 3, -r * 1.1); g.stroke(); } g.fillStyle = c; g.beginPath(); g.ellipse(0, 0, r, r * 0.75, face, 0, 7); g.fill(); g.fillStyle = c2; g.beginPath(); g.arc(Math.cos(face) * r * 0.7, Math.sin(face) * r * 0.7, r * 0.35, 0, 7); g.fill(); break;
      case 'box': { const op = Math.abs(Math.sin(t * 6)) * 4 * (e.wind > 0 ? 2 : 1); g.fillStyle = c; g.fillRect(-r, -r * 0.8, r * 2, r * 1.6); g.fillStyle = c2; g.fillRect(-r, -r * 0.8 - op, r * 2, 4); g.fillStyle = '#000'; g.fillRect(-r * 0.6, -r * 0.3, r * 1.2, 3); g.fillStyle = '#fff'; for (let i = 0; i < 4; i++) g.fillRect(-r * 0.55 + i * r * 0.32, -r * 0.3, 3, 4); g.fillStyle = '#ff3333'; g.fillRect(-r * 0.5, -r * 0.6, 4, 3); g.fillRect(r * 0.3, -r * 0.6, 4, 3); break; }
      case 'forklift': g.rotate(e.charging > 0 ? Math.atan2(e.cvy, e.cvx) : face); g.fillStyle = c; g.fillRect(-r, -r * 0.7, r * 1.5, r * 1.4); g.fillStyle = '#333'; g.fillRect(-r * 0.7, -r * 0.5, r * 0.7, r); g.fillStyle = '#888'; g.fillRect(r * 0.5, -r * 0.6, r * 0.7, 3); g.fillRect(r * 0.5, r * 0.6 - 3, r * 0.7, 3); g.fillStyle = '#111'; g.fillRect(-r * 0.9, -r * 0.85, 7, 4); g.fillRect(-r * 0.9, r * 0.85 - 4, 7, 4); if (Math.sin(t * 10) > 0) { g.fillStyle = '#ff9a00'; g.fillRect(-r * 0.5, -3, 5, 5); } break;
      case 'humanoid': case 'agent': g.fillStyle = c; g.beginPath(); g.ellipse(0, 0, r * 0.75, r * 0.9, 0, 0, 7); g.fill(); g.fillStyle = c2; g.beginPath(); g.arc(0, -r * 0.95, r * 0.5, 0, 7); g.fill(); if (L.chain) { g.strokeStyle = '#ccd2e0'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-r * 0.7, -r * 0.3); g.lineTo(r * 0.7, r * 0.3); g.stroke(); } if (L.helmet) { g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -r * 0.95, r * 0.55, Math.PI, 0); g.fill(); } if (L.s === 'agent') { g.fillStyle = '#111'; g.fillRect(-r * 0.6, -r * 1.35, r * 1.2, r * 0.25); g.fillRect(-r * 0.4, -r * 1.6, r * 0.8, r * 0.3); } g.strokeStyle = c2; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(face) * r * 1.2, Math.sin(face) * r * 1.2); g.stroke(); break;
      case 'ghost': { g.fillStyle = c; g.globalAlpha *= 0.85; g.beginPath(); g.arc(0, -r * 0.2, r, Math.PI, 0); for (let i = 0; i <= 4; i++) g.lineTo(r - i * r / 2, r * 0.8 + Math.sin(t * 6 + i) * 3); g.closePath(); g.fill(); g.globalAlpha /= 0.85; g.fillStyle = '#111'; g.beginPath(); g.arc(-r * 0.35, -r * 0.3, r * 0.18, 0, 7); g.arc(r * 0.35, -r * 0.3, r * 0.18, 0, 7); g.fill(); break; }
      case 'bee': { g.fillStyle = 'rgba(255,255,255,.6)'; const fl2 = Math.sin(t * 50) * 3; g.beginPath(); g.ellipse(-3, -r * 0.7, r * 0.5, r * 0.3 + fl2 * 0.2, -0.4, 0, 7); g.ellipse(3, -r * 0.7, r * 0.5, r * 0.3 - fl2 * 0.2, 0.4, 0, 7); g.fill(); g.fillStyle = c; g.beginPath(); g.ellipse(0, 0, r, r * 0.7, face, 0, 7); g.fill(); g.strokeStyle = c2; g.lineWidth = 2.5; for (let i = -1; i <= 1; i++) { g.beginPath(); const px = Math.cos(face + 1.57) * r * 0.7, py = Math.sin(face + 1.57) * r * 0.7, qx = Math.cos(face) * i * r * 0.4, qy = Math.sin(face) * i * r * 0.4; g.moveTo(qx - px, qy - py); g.lineTo(qx + px, qy + py); g.stroke(); } break; }
      case 'golem': g.fillStyle = c; g.beginPath(); g.moveTo(-r, r * 0.6); g.lineTo(-r * 0.9, -r * 0.5); g.lineTo(-r * 0.3, -r); g.lineTo(r * 0.4, -r * 0.9); g.lineTo(r, -r * 0.3); g.lineTo(r * 0.8, r * 0.7); g.closePath(); g.fill(); g.fillStyle = c2; g.fillRect(-r * 0.45, -r * 0.45, r * 0.3, r * 0.2); g.fillRect(r * 0.15, -r * 0.45, r * 0.3, r * 0.2); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(-r * 0.9, r * 0.1, r * 1.8, r * 0.15); break;
      case 'beast': g.fillStyle = c; g.beginPath(); g.ellipse(0, 0, r, r * 0.75, face, 0, 7); g.fill(); g.fillStyle = c2; g.beginPath(); g.arc(Math.cos(face) * r * 0.8, Math.sin(face) * r * 0.8, r * 0.5, 0, 7); g.fill(); g.fillStyle = c; g.beginPath(); g.arc(Math.cos(face - 0.5) * r * 1.05, Math.sin(face - 0.5) * r * 1.05, r * 0.2, 0, 7); g.arc(Math.cos(face + 0.5) * r * 1.05, Math.sin(face + 0.5) * r * 1.05, r * 0.2, 0, 7); g.fill(); break;
      case 'hive': g.fillStyle = c; g.beginPath(); g.ellipse(0, 0, r * 0.85, r, 0, 0, 7); g.fill(); g.strokeStyle = c2; g.lineWidth = 2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(-r * 0.8, i * r * 0.35); g.lineTo(r * 0.8, i * r * 0.35); g.stroke(); } for (let i = 0; i < 3; i++) { const a = t * 4 + i * 2; g.fillStyle = '#ffcc00'; g.fillRect(Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3, 3, 3); } break;
      case 'worm': { for (let i = 4; i >= 0; i--) { const k = i / 4; const px = -Math.cos(face) * i * r * 0.55 + Math.sin(t * 6 - i) * 3 * Math.sin(face), py = -Math.sin(face) * i * r * 0.55 - Math.sin(t * 6 - i) * 3 * Math.cos(face); g.fillStyle = i % 2 ? c : c2; g.beginPath(); g.arc(px, py, r * (1 - k * 0.45), 0, 7); g.fill(); } break; }
      case 'turtle': g.fillStyle = '#5a4a40'; for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.78 + Math.sin(t * 4) * 0.1; g.beginPath(); g.arc(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85, r * 0.25, 0, 7); g.fill(); } g.fillStyle = c; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.fillStyle = c2; for (let i = 0; i < 6; i++) { const a = i * 1.047; g.beginPath(); g.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3); g.lineTo(Math.cos(a + 0.3) * r * 0.9, Math.sin(a + 0.3) * r * 0.9); g.lineTo(Math.cos(a - 0.3) * r * 0.9, Math.sin(a - 0.3) * r * 0.9); g.fill(); } break;
      case 'blob': { const s = 1 + Math.sin(t * 8) * 0.08 * (e.fuse > 0 ? 3 : 1); const gr = g.createRadialGradient(0, 0, 1, 0, 0, r * s); gr.addColorStop(0, c2); gr.addColorStop(1, c); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * s, 0, 7); g.fill(); break; }
      case 'static': { for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? c : c2; g.fillRect(RNG.range(-r, r), RNG.range(-r, r), RNG.range(2, 6), RNG.range(1, 3)); } g.strokeStyle = c; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); break; }
      case 'antenna': g.fillStyle = c; g.fillRect(-r * 0.5, -r * 0.2, r, r * 1); g.strokeStyle = c; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r * 1.8); g.stroke(); g.lineWidth = 1.5; for (let i = 1; i <= 3; i++) { g.beginPath(); g.moveTo(-r * 0.25 * i, -r * 0.5 * i); g.lineTo(r * 0.25 * i, -r * 0.5 * i); g.stroke(); } g.fillStyle = Math.sin(t * 6) > 0 ? c2 : '#300'; g.beginPath(); g.arc(0, -r * 1.85, 3, 0, 7); g.fill(); break;
      case 'chain': { g.strokeStyle = c; g.lineWidth = 5; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(0, -r + i * r * 0.7, r * 0.35, r * 0.5, 0, 0, 7); g.stroke(); } g.fillStyle = c2; g.beginPath(); g.arc(0, r * 0.9, 5, 0, 7); g.fill(); break; }
      case 'rocket': g.rotate(face); g.fillStyle = c; g.fillRect(-r, -r * 0.4, r * 1.6, r * 0.8); g.fillStyle = c2; g.beginPath(); g.moveTo(r * 0.6, -r * 0.4); g.lineTo(r * 1.2, 0); g.lineTo(r * 0.6, r * 0.4); g.fill(); g.fillRect(-r, -r * 0.7, r * 0.4, r * 1.4); g.fillStyle = '#ffb347'; g.beginPath(); g.moveTo(-r, -r * 0.3); g.lineTo(-r - 6 - Math.random() * 8, 0); g.lineTo(-r, r * 0.3); g.fill(); break;
      case 'robot': g.fillStyle = c; g.fillRect(-r * 0.8, -r * 0.7, r * 1.6, r * 1.4); g.fillStyle = '#2a2f38'; g.fillRect(-r * 0.6, -r * 1.2, r * 1.2, r * 0.6); g.fillStyle = c2; g.fillRect(-r * 0.4, -r * 1.05, r * 0.25, r * 0.2); g.fillRect(r * 0.15, -r * 1.05, r * 0.25, r * 0.2); g.fillStyle = '#ffcc33'; for (let i = 0; i < 4; i++) g.fillRect(-r * 0.8 + i * r * 0.45, r * 0.5, r * 0.2, r * 0.2); g.strokeStyle = '#8b98a8'; g.lineWidth = 4; g.beginPath(); g.moveTo(Math.cos(face) * r * 0.6, Math.sin(face) * r * 0.6); g.lineTo(Math.cos(face) * r * 1.4, Math.sin(face) * r * 1.4); g.stroke(); break;
      case 'turret': g.fillStyle = c2; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.fillStyle = c; g.beginPath(); g.arc(0, 0, r * 0.7, 0, 7); g.fill(); { const a = Math.atan2(G.P.y - y, G.P.x - x); g.rotate(a); g.fillStyle = '#1a1d22'; g.fillRect(0, -4, r * 1.4, 3); g.fillRect(0, 1, r * 1.4, 3); } break;
      case 'tidal': { for (let i = 0; i < 3; i++) { g.fillStyle = i === 0 ? c : i === 1 ? c2 + '88' : c + '55'; g.beginPath(); g.ellipse(0, 0, r * (1 + i * 0.25) * (1 + Math.sin(t * 3 + i) * 0.15), r * (1 - i * 0.15), t + i, 0, 7); g.fill(); } break; }
      case 'echo': { for (let i = 3; i >= 0; i--) { g.globalAlpha = 0.25 + (3 - i) * 0.2; g.fillStyle = i ? c : c2; g.beginPath(); g.ellipse(-Math.cos(face) * i * 6, -Math.sin(face) * i * 6, r * 0.7, r * 0.9, 0, 0, 7); g.fill(); } g.globalAlpha = 1; break; }
      case 'orb': { const gr = g.createRadialGradient(0, 0, 1, 0, 0, r * 1.4); gr.addColorStop(0, '#fff'); gr.addColorStop(0.5, c); gr.addColorStop(1, 'rgba(255,180,70,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * 1.4, 0, 7); g.fill(); for (let i = 0; i < 5; i++) { const a = t * 3 + i * 1.25; g.fillStyle = c2; g.fillRect(Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.2, 2, 2); } break; }
      case 'bird': { const fl2 = Math.sin(t * 14) * 0.6; g.rotate(face); g.fillStyle = c; g.beginPath(); g.moveTo(r, 0); g.lineTo(-r * 0.5, -r * (0.9 + fl2)); g.lineTo(-r * 0.2, 0); g.lineTo(-r * 0.5, r * (0.9 + fl2)); g.closePath(); g.fill(); g.fillStyle = c2; g.beginPath(); g.arc(r * 0.5, 0, 2, 0, 7); g.fill(); break; }
      default: g.fillStyle = c; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    }
    g.restore(); g.globalAlpha = 1;
    // állapot-ikonok
    if (e.burn) { g.fillStyle = '#ff7a2e'; g.fillRect(x - 2, y - r - 14, 4, 4); }
    if (e.stun > 0) { for (let i = 0; i < 3; i++) { const a = G.t * 5 + i * 2.1; g.fillStyle = '#ffe14d'; g.fillRect(x + Math.cos(a) * 10, y - r - 8 + Math.sin(a) * 3, 3, 3); } }
    if (e.mark > 0) { g.strokeStyle = '#ff4444'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, r + 4, 0, 7); g.stroke(); }
    if (e.immune) { g.strokeStyle = 'rgba(255,220,120,.7)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r + 10, 0, 7); g.stroke(); }
    if (e.shieldMul && e.shieldMul < 1) { g.strokeStyle = 'rgba(77,255,176,.6)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r + 10, 0, 7); g.stroke(); }
    if (e.bossLink && !e.bossLink.dead) { g.strokeStyle = 'rgba(255,210,122,.5)'; g.lineWidth = 3; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(x, y); g.lineTo(e.bossLink.x, e.bossLink.y); g.stroke(); g.setLineDash([]); }
    if (!e.boss && e.hp < e.mhp && !e.invisNow) this.hpbar(g, x, y - r - 8, Math.max(24, r * 2), e.hp / e.mhp, e.ancient ? '#ff3355' : e.elite || e.champion || e.named ? '#ffb347' : '#e04848');
  },
  bossShape(g, e, c, c2, t) {
    const r = e.r, s = e.look.s;
    if (s === 'leltar') { g.fillStyle = c; g.fillRect(-r, -r, r * 2, r * 2); g.fillStyle = '#e07b26'; g.fillRect(-r, -r, 6, r * 2); g.fillRect(r - 6, -r, 6, r * 2); for (let i = 0; i < 3; i++) { g.fillStyle = '#b48a5a'; g.fillRect(-r + 10, -r + 8 + i * r * 0.65, r * 2 - 20, r * 0.4); } g.fillStyle = '#000'; g.beginPath(); g.arc(0, 0, r * 0.45, 0, 7); g.fill(); g.fillStyle = c2; g.beginPath(); g.arc(Math.cos(t) * 4, Math.sin(t * 1.3) * 4, r * 0.18, 0, 7); g.fill(); }
    else if (s === 'queen') { g.fillStyle = 'rgba(255,255,255,.5)'; const f = Math.sin(t * 40) * 6; g.beginPath(); g.ellipse(-r * 0.6, -r * 0.8, r * 0.8, r * 0.4 + f * 0.3, -0.5, 0, 7); g.ellipse(r * 0.6, -r * 0.8, r * 0.8, r * 0.4 - f * 0.3, 0.5, 0, 7); g.fill(); g.fillStyle = c; g.beginPath(); g.ellipse(0, r * 0.2, r * 0.7, r, 0, 0, 7); g.fill(); g.fillStyle = c2; for (let i = 0; i < 4; i++) g.fillRect(-r * 0.7, -r * 0.3 + i * r * 0.4, r * 1.4, r * 0.12); g.fillStyle = c; g.beginPath(); g.arc(0, -r * 0.8, r * 0.45, 0, 7); g.fill(); g.fillStyle = '#ffd34d'; g.beginPath(); g.moveTo(-r * 0.4, -r * 1.1); for (let i = 0; i < 5; i++) { g.lineTo(-r * 0.4 + i * r * 0.2, -r * (i % 2 ? 1.2 : 1.55)); } g.lineTo(r * 0.4, -r * 1.1); g.fill(); }
    else if (s === 'heart') { const p = 1 + Math.sin(t * 5) * 0.08; g.scale(p, p); g.fillStyle = c; g.beginPath(); g.moveTo(0, r * 0.9); g.bezierCurveTo(-r * 1.5, -r * 0.2, -r * 0.6, -r * 1.3, 0, -r * 0.4); g.bezierCurveTo(r * 0.6, -r * 1.3, r * 1.5, -r * 0.2, 0, r * 0.9); g.fill(); g.strokeStyle = c2; g.lineWidth = 2; g.beginPath(); g.moveTo(-r * 0.3, -r * 0.2); g.lineTo(0, r * 0.2); g.lineTo(r * 0.2, -r * 0.1); g.stroke(); if (e.immune) { g.strokeStyle = '#9aa3b8'; g.lineWidth = 4; g.beginPath(); g.moveTo(-r, -r * 0.2); g.lineTo(r, r * 0.3); g.moveTo(-r, r * 0.3); g.lineTo(r, -r * 0.2); g.stroke(); } }
    else if (s === 'core') { const gr = g.createRadialGradient(0, 0, 2, 0, 0, r * 1.3); gr.addColorStop(0, '#fff'); gr.addColorStop(0.4, c2); gr.addColorStop(0.8, c); gr.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * 1.3, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,200,120,.6)'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(0, 0, r * (1.4 + i * 0.25), r * 0.4, t * (0.5 + i * 0.3), 0, 7); g.stroke(); } }
    else if (s === 'radiohead') { g.fillStyle = c; g.fillRect(-r * 0.8, -r * 0.2, r * 1.6, r * 1.1); g.fillStyle = '#171a14'; g.beginPath(); g.arc(-r * 0.3, r * 0.35, r * 0.3, 0, 7); g.fill(); g.fillStyle = c2; g.fillRect(r * 0.15, 0, r * 0.45, r * 0.15); g.fillRect(r * 0.15, r * 0.3, r * 0.45, r * 0.15); g.strokeStyle = c2; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -r * 0.2); g.lineTo(0, -r * 1.5); g.stroke(); for (let i = 1; i <= 3; i++) { g.globalAlpha = (Math.sin(t * 4 - i) + 1) / 2; g.beginPath(); g.arc(0, -r * 1.5, i * 10, -2.6, -0.5); g.stroke(); } g.globalAlpha = 1; }
    else if (s === 'mech') { g.fillStyle = '#555'; g.fillRect(-r * 0.9, r * 0.3, r * 0.5, r * 0.7); g.fillRect(r * 0.4, r * 0.3, r * 0.5, r * 0.7); g.fillStyle = c; g.fillRect(-r * 0.6, -r * 1.1, r * 1.2, r * 1.6); g.fillStyle = c2; g.beginPath(); g.moveTo(-r * 0.6, -r * 1.1); g.lineTo(0, -r * 1.7); g.lineTo(r * 0.6, -r * 1.1); g.fill(); g.fillStyle = '#222'; g.fillRect(-r * 0.6, -r * 0.3, r * 1.2, r * 0.12); g.fillStyle = '#ffcc33'; g.fillText ? 0 : 0; g.fillStyle = '#ff4422'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.fillText('N-1', 0, -r * 0.5); g.fillStyle = '#ffb347'; for (let i = -1; i <= 1; i += 2) { g.beginPath(); g.moveTo(i * r * 0.65, r * 1); g.lineTo(i * r * 0.65 - 4, r * 1.3 + Math.random() * 10); g.lineTo(i * r * 0.65 + 4, r * 1); g.fill(); } }
    else if (s === 'self') { const C = CLASSES[G.S.cls]; for (let i = 3; i >= 1; i--) { g.globalAlpha = 0.15 * i; g.fillStyle = '#c48cff'; g.beginPath(); g.arc(Math.sin(t * 2 + i) * i * 4, Math.cos(t * 2 + i) * i * 4, r * 1.2, 0, 7); g.fill(); } g.globalAlpha = 1; g.fillStyle = C.szin; g.beginPath(); g.ellipse(0, -2, 10, 11, 0, 0, 7); g.fill(); g.fillStyle = '#e8d8ff'; g.beginPath(); g.arc(0, -13, 7, 0, 7); g.fill(); g.fillStyle = '#000'; g.fillRect(-4, -15, 2, 2); g.fillRect(2, -15, 2, 2); }
    else if (s === 'singularity') { const rr = r * 1.6; for (let i = 0; i < 40; i++) { const a = t * 0.8 + i / 40 * 6.283, d = rr * (1.1 + 0.25 * Math.sin(i * 3)); g.fillStyle = i % 3 ? '#ffb347' : '#fff1c0'; g.fillRect(Math.cos(a) * d, Math.sin(a) * d * 0.35, 3, 2); } g.fillStyle = '#000'; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.strokeStyle = '#ffd27a'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, r + 3, 0, 7); g.stroke(); g.strokeStyle = 'rgba(255,180,70,.6)'; g.lineWidth = 8; g.beginPath(); g.ellipse(0, -r * 0.2, rr * 1.1, rr * 0.35, 0, Math.PI, 0); g.stroke(); }
  },
  proj(g, p) {
    const a = Math.atan2(p.vy, p.vx), c = p.col || DT[p.dt].c;
    g.save(); g.translate(p.x, p.y); g.rotate(a);
    switch (p.kind) {
      case 'bullet': g.fillStyle = c; g.fillRect(-8, -1.2, 12, 2.4); break;
      case 'rail': g.fillStyle = '#e8f8ff'; g.fillRect(-30, -2, 40, 4); g.fillStyle = 'rgba(120,200,255,.5)'; g.fillRect(-60, -4, 70, 8); break;
      case 'laser': g.fillStyle = c; g.fillRect(-10, -1, 14, 2); break;
      case 'rocket': g.fillStyle = '#ddd'; g.fillRect(-7, -2.5, 12, 5); g.fillStyle = '#ff7a2e'; g.beginPath(); g.moveTo(-7, -3); g.lineTo(-13 - Math.random() * 6, 0); g.lineTo(-7, 3); g.fill(); break;
      case 'fireball': { const gr = g.createRadialGradient(0, 0, 1, 0, 0, p.r * 1.8); gr.addColorStop(0, '#fff6c0'); gr.addColorStop(0.5, '#ff7a2e'); gr.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, p.r * 1.8, 0, 7); g.fill(); break; }
      case 'forklift': g.fillStyle = '#f2b01e'; g.fillRect(-22, -15, 34, 30); g.fillStyle = '#333'; g.fillRect(-16, -10, 14, 20); g.fillStyle = '#888'; g.fillRect(12, -12, 16, 4); g.fillRect(12, 8, 16, 4); break;
      case 'feather': g.fillStyle = c; g.beginPath(); g.ellipse(0, 0, 7, 2.5, 0, 0, 7); g.fill(); break;
      case 'stinger': g.fillStyle = c; g.beginPath(); g.moveTo(6, 0); g.lineTo(-4, -2); g.lineTo(-4, 2); g.fill(); break;
      case 'box': g.fillStyle = '#c9a06a'; g.fillRect(-p.r, -p.r, p.r * 2, p.r * 2); g.strokeStyle = '#6b4f2f'; g.strokeRect(-p.r, -p.r, p.r * 2, p.r * 2); break;
      case 'rock': g.fillStyle = c; g.beginPath(); g.arc(0, 0, p.r, 0, 7); g.fill(); g.fillStyle = '#5a2a10'; g.fillRect(-2, -2, 3, 3); break;
      case 'wave': g.strokeStyle = c; g.lineWidth = 2.5; g.beginPath(); g.arc(-p.r, 0, p.r * 1.3, -1, 1); g.stroke(); break;
      case 'spark': g.fillStyle = '#f4f06a'; g.fillRect(-3, -1, 6, 2); break;
      default: { const gr = g.createRadialGradient(0, 0, 1, 0, 0, p.r * 1.8); gr.addColorStop(0, '#fff'); gr.addColorStop(0.45, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, p.r * 1.8, 0, 7); g.fill(); }
    }
    g.restore();
  },
  beam(g, e) {
    const B = e.beam, warm = B.t < B.warm, len = 900;
    g.save(); g.translate(e.x, e.y); g.rotate(B.a);
    if (warm) { g.fillStyle = `rgba(255,80,80,${0.15 + 0.2 * (B.t / B.warm)})`; g.fillRect(0, -3, len, 6); }
    else { g.fillStyle = 'rgba(77,255,176,.35)'; g.fillRect(0, -22, len, 44); g.fillStyle = 'rgba(220,255,240,.9)'; g.fillRect(0, -6, len, 12); }
    g.restore();
  },
  particles(g) {
    for (const p of G.parts) {
      const k = p.t / p.life, a = 1 - k;
      if (p.ring) { g.strokeStyle = p.c; g.globalAlpha = a; g.lineWidth = p.w * a + 0.5; g.beginPath(); g.arc(p.x, p.y, p.r * (0.3 + 0.7 * Math.sqrt(k)), 0, 7); g.stroke(); g.globalAlpha = 1; continue; }
      if (p.bolt) { g.strokeStyle = p.c; g.globalAlpha = a; g.lineWidth = 2.5; g.beginPath(); g.moveTo(p.x1, p.y1); const n = 6; for (let i = 1; i < n; i++) g.lineTo(lerp(p.x1, p.x2, i / n) + RNG.range(-10, 10), lerp(p.y1, p.y2, i / n) + RNG.range(-10, 10)); g.lineTo(p.x2, p.y2); g.stroke(); g.globalAlpha = 1; continue; }
      if (p.arc) { g.fillStyle = p.c; g.globalAlpha = a * (p.heavy ? 0.8 : 0.55); g.beginPath(); g.moveTo(p.x, p.y); g.arc(p.x, p.y, p.range * (0.6 + 0.4 * k), p.a - p.arc / 2, p.a + p.arc / 2); g.closePath(); g.fill(); g.globalAlpha = 1; continue; }
      if (p.slash) { g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(-1500, -3 * a, 3000, 6 * a); g.restore(); continue; }
      if (p.papucs) { const x = lerp(p.x1, p.x2, k), y = lerp(p.y1, p.y2, k) - Math.sin(k * Math.PI) * 30; g.save(); g.translate(x, y); g.rotate(k * 12); g.fillStyle = '#ff8ac8'; g.beginPath(); g.ellipse(0, 0, 8, 4, 0, 0, 7); g.fill(); g.restore(); continue; }
      g.globalAlpha = a; g.fillStyle = p.c;
      if (p.streak) { g.fillRect(p.x, p.y, 14, 1.5); } else g.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    g.globalAlpha = 1;
  },
  lighting(g, m, ox, oy) {
    const R0 = REGION[m.region]; let dark = m.region === 'varos' || m.region === 'otthon' ? 0.18 + 0.12 * (0.5 + 0.5 * Math.sin(G.t / 120)) : (R0 ? R0.dark : 0.5);
    if (G.darkBoost > 0) dark = Math.min(0.92, dark + 0.35);
    if (dark <= 0.02) return;
    const lc = this.light, lg = this.lg, sc = lc.width / this.c.width * G.zoom;
    lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, lc.width, lc.height);
    lg.fillStyle = `rgba(0,0,${m.region === 'eh' ? 12 : 4},${dark})`; lg.fillRect(0, 0, lc.width, lc.height);
    lg.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, k = 1) => { const sx = (x - ox) * sc, sy = (y - oy) * sc, sr = r * sc; if (sx < -sr || sy < -sr || sx > lc.width + sr || sy > lc.height + sr) return; const gr = lg.createRadialGradient(sx, sy, 0, sx, sy, sr); gr.addColorStop(0, `rgba(0,0,0,${k})`); gr.addColorStop(0.6, `rgba(0,0,0,${k * 0.6})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); lg.fillStyle = gr; lg.beginPath(); lg.arc(sx, sy, sr, 0, 7); lg.fill(); };
    const P = G.P; hole(P.x, P.y, 330 + (P.fx.radio ? 80 : 0), 1);
    for (const l of m.lights) hole(l.x, l.y, l.r, 0.8);
    for (const o of m.objs) if (!o.dead && (o.type === 'exit' || o.type === 'portal' || o.type === 'kapu' || o.type === 'shrine' && !o.used || o.type === 'buborek')) hole(o.x, o.y, 140, 0.7);
    for (const p of G.projs) if (p.own === 'p' && (p.kind === 'fireball' || p.kind === 'orb' || p.kind === 'bolt' || p.kind === 'rocket')) hole(p.x, p.y, 70, 0.6); else if (p.own === 'e') hole(p.x, p.y, 40, 0.5);
    if (G.flashes) for (const f of G.flashes) hole(f.x, f.y, f.r, 1 - f.t / f.life);
    for (const q of G.grounds) if (q.dt === 'tuz') hole(q.x, q.y, q.r * 2, 0.5);
    if (REGION[m.region] && REGION[m.region].haz.fx === 'burn') { /* láva világít */ }
    for (const e of G.enemies) if (!e.dead && (e.boss || e.ancient)) hole(e.x, e.y, e.r * 4, 0.5);
    g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(lc, 0, 0, this.c.width, this.c.height);
  },
};
