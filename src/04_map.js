// ============================================================
//  TÉRKÉP: generálás, ütközés, statikus réteg, minitérkép
// ============================================================
const T_WALL = 0, T_FLOOR = 1, T_HAZ = 2, T_OBST = 3;

function makeMapObj(W, H) {
  return { w: W, h: H, t: new Uint8Array(W * H), shade: new Uint8Array(W * H), seen: new Uint8Array(W * H), rooms: [], objs: [], spawns: [], lights: [] };
}
const mIdx = (m, x, y) => y * m.w + x;
function tileAt(m, x, y) { if (x < 0 || y < 0 || x >= m.w || y >= m.h) return T_WALL; return m.t[y * m.w + x]; }
function solidTile(m, x, y) { const t = tileAt(m, x, y); return t === T_WALL || t === T_OBST; }
function solidAt(m, px, py) { return solidTile(m, Math.floor(px / TILE), Math.floor(py / TILE)); }
function walkTile(m, x, y) { const t = tileAt(m, x, y); return t === T_FLOOR || t === T_HAZ; }

// Kör–rács ütközés feloldása (tengelyenként)
function moveCircle(m, e, dx, dy) {
  const r = e.r;
  const tryAxis = (nx, ny) => {
    const x0 = Math.floor((nx - r) / TILE), x1 = Math.floor((nx + r) / TILE), y0 = Math.floor((ny - r) / TILE), y1 = Math.floor((ny + r) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (!solidTile(m, tx, ty)) continue;
      const cx = clamp(nx, tx * TILE, tx * TILE + TILE), cy = clamp(ny, ty * TILE, ty * TILE + TILE);
      if ((nx - cx) * (nx - cx) + (ny - cy) * (ny - cy) < r * r) return false;
    }
    return true;
  };
  let hit = false;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / (r * 0.8)));
  const sx = dx / steps, sy = dy / steps;
  for (let i = 0; i < steps; i++) {
    if (sx) { if (tryAxis(e.x + sx, e.y)) e.x += sx; else hit = true; }
    if (sy) { if (tryAxis(e.x, e.y + sy)) e.y += sy; else hit = true; }
  }
  return hit;
}
// Látóvonal (DDA)
function los(m, ax, ay, bx, by) {
  const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / (TILE * 0.45));
  for (let i = 1; i < n; i++) { const x = ax + (bx - ax) * i / n, y = ay + (by - ay) * i / n; if (solidAt(m, x, y)) return false; }
  return true;
}

// BFS távolságmező (az ellenfelek útkeresése)
function flowField(m, sx, sy, maxD = 60) {
  const W = m.w, N = W * m.h;
  if (!m.field || m.field.length !== N) { m.field = new Int16Array(N); m.q = new Int32Array(N); }
  const f = m.field, q = m.q; f.fill(-1);
  const s = sy * W + sx; if (s < 0 || s >= N) return;
  let h = 0, tl = 0; q[tl++] = s; f[s] = 0;
  while (h < tl) {
    const c = q[h++], d = f[c]; if (d >= maxD) continue;
    const cx = c % W, cy = (c / W) | 0;
    if (cx > 0) { const n = c - 1; if (f[n] < 0 && walkTile(m, cx - 1, cy)) { f[n] = d + 1; q[tl++] = n; } }
    if (cx < W - 1) { const n = c + 1; if (f[n] < 0 && walkTile(m, cx + 1, cy)) { f[n] = d + 1; q[tl++] = n; } }
    if (cy > 0) { const n = c - W; if (f[n] < 0 && walkTile(m, cx, cy - 1)) { f[n] = d + 1; q[tl++] = n; } }
    if (cy < m.h - 1) { const n = c + W; if (f[n] < 0 && walkTile(m, cx, cy + 1)) { f[n] = d + 1; q[tl++] = n; } }
  }
}
function flowDir(m, x, y) {
  const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE), f = m.field; if (!f) return null;
  const c = f[ty * m.w + tx]; if (c < 0) return null;
  let best = c, bx = 0, by = 0;
  for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
    if (!ox && !oy) continue; const nx = tx + ox, ny = ty + oy;
    if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
    const v = f[ny * m.w + nx]; if (v < 0) continue;
    if (ox && oy && (!walkTile(m, tx + ox, ty) || !walkTile(m, tx, ty + oy))) continue; // ne vágjon sarkot
    if (v < best) { best = v; bx = ox; by = oy; }
  }
  if (!bx && !by) return null;
  const gx = (tx + bx + 0.5) * TILE, gy = (ty + by + 0.5) * TILE;
  return Math.atan2(gy - y, gx - x);
}

// ---------------- kazamata-generátor ----------------
function genDungeon(seed, region, floorNo, opts = {}) {
  const rng = makeRng(seed);
  const W = opts.w || 76, H = opts.h || 76;
  const m = makeMapObj(W, H);
  m.region = region.id; m.floor = floorNo; m.seed = seed; m.style = region.style;
  const rooms = m.rooms;
  if (opts.boss) { const bw = 26, bh = 22; rooms.push({ x: W - bw - 4, y: H - bh - 4, w: bw, h: bh, boss: true }); }
  const want = opts.rooms || rng.int(10, 14);
  for (let i = 0; i < 500 && rooms.length < want; i++) {
    const w = rng.int(7, 15), h = rng.int(7, 13);
    const x = rng.int(2, W - w - 3), y = rng.int(2, H - h - 3);
    if (rooms.some(r => x < r.x + r.w + 3 && x + w + 3 > r.x && y < r.y + r.h + 3 && y + h + 3 > r.y)) continue;
    rooms.push({ x, y, w, h });
  }
  rooms.forEach(r => { r.cx = r.x + (r.w >> 1); r.cy = r.y + (r.h >> 1); for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) m.t[y * W + x] = T_FLOOR; });
  // Prim-féle feszítőfa + néhány extra él
  const conn = [0], edges = [];
  const left = new Set(rooms.map((_, i) => i)); left.delete(0);
  while (left.size) {
    let best = null, bd = 1e9;
    for (const a of conn) for (const b of left) { const d = Math.abs(rooms[a].cx - rooms[b].cx) + Math.abs(rooms[a].cy - rooms[b].cy); if (d < bd) { bd = d; best = [a, b]; } }
    edges.push(best); conn.push(best[1]); left.delete(best[1]);
  }
  for (let i = 0; i < 3; i++) { const a = rng.int(0, rooms.length - 1), b = rng.int(0, rooms.length - 1); if (a !== b && !(opts.boss && (rooms[a].boss || rooms[b].boss))) edges.push([a, b]); }
  const carve = (x, y) => { if (x > 0 && y > 0 && x < W - 1 && y < H - 1 && m.t[y * W + x] === T_WALL) m.t[y * W + x] = T_FLOOR; };
  for (const [a, b] of edges) {
    const A = rooms[a], B = rooms[b], wd = rng.int(2, 3);
    const horizFirst = rng() < 0.5;
    const hx = (y, x0, x1) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let k = 0; k < wd; k++) carve(x, y + k); };
    const vy = (x, y0, y1) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let k = 0; k < wd; k++) carve(x + k, y); };
    if (horizFirst) { hx(A.cy, A.cx, B.cx); vy(B.cx, A.cy, B.cy); } else { vy(A.cx, A.cy, B.cy); hx(B.cy, A.cx, B.cx); }
  }
  // kezdő terem: a bossteremtől legtávolabbi (vagy a 0. ha nincs boss)
  const bfsFrom = (x, y) => { flowField(m, x, y, 9999); return m.field; };
  let startI;
  if (opts.boss) {
    const f = bfsFrom(rooms[0].cx, rooms[0].cy); let bd = -1; startI = 1;
    rooms.forEach((r, i) => { if (i === 0) return; const d = f[r.cy * W + r.cx]; if (d > bd) { bd = d; startI = i; } });
  } else startI = rng.int(0, rooms.length - 1);
  const S = rooms[startI]; S.start = true;
  const f = bfsFrom(S.cx, S.cy);
  let exitI = 0, ed = -1;
  rooms.forEach((r, i) => { const d = f[r.cy * W + r.cx]; r.dist = d; if (!opts.boss && i !== startI && d > ed) { ed = d; exitI = i; } });
  if (opts.boss) exitI = 0;
  rooms[exitI].exit = true;
  m.start = { x: (S.cx + 0.5) * TILE, y: (S.cy + 0.5) * TILE };
  m.exitRoom = rooms[exitI];

  // akadályok – a terem 2 csempés szegélye mindig szabad marad, így az összeköttetés nem sérül
  rooms.forEach(r => {
    if (r.start) return;
    const ix0 = r.x + 2, iy0 = r.y + 2, ix1 = r.x + r.w - 3, iy1 = r.y + r.h - 3;
    if (ix1 - ix0 < 2 || iy1 - iy0 < 2) return;
    const st = r.boss ? 'pillars' : region.style;
    const put = (x, y) => { if (x >= ix0 && x <= ix1 && y >= iy0 && y <= iy1 && m.t[y * W + x] === T_FLOOR) m.t[y * W + x] = T_OBST; };
    if (st === 'shelves') {
      const vertical = r.h > r.w;
      if (vertical) { for (let x = ix0; x <= ix1; x += 3) { const gap = rng.int(iy0 + 1, iy1 - 1); for (let y = iy0; y <= iy1; y++) if (Math.abs(y - gap) > 0) put(x, y); } }
      else { for (let y = iy0; y <= iy1; y += 3) { const gap = rng.int(ix0 + 1, ix1 - 1); for (let x = ix0; x <= ix1; x++) if (Math.abs(x - gap) > 0) put(x, y); } }
    } else if (st === 'pillars') {
      for (let y = iy0 + 1; y < iy1; y += 4) for (let x = ix0 + 1; x < ix1; x += 4) if (rng() < (r.boss ? 0.5 : 0.7)) { put(x, y); if (!r.boss) { put(x + 1, y); put(x, y + 1); put(x + 1, y + 1); } }
    } else {
      const dens = st === 'rocks' ? 0.07 : 0.045;
      for (let y = iy0; y <= iy1; y++) for (let x = ix0; x <= ix1; x++) if (rng() < dens) { put(x, y); if (rng() < 0.4) put(x + 1, y); }
    }
    // veszélyes talaj
    if (region.haz && !r.boss && rng() < 0.75) {
      const n = rng.int(1, 3);
      for (let k = 0; k < n; k++) {
        const hx = rng.int(r.x + 1, r.x + r.w - 2), hy = rng.int(r.y + 1, r.y + r.h - 2), rad = rng.range(1.3, 3.2);
        for (let y = Math.floor(hy - rad); y <= hy + rad; y++) for (let x = Math.floor(hx - rad); x <= hx + rad; x++)
          if ((x - hx) ** 2 + (y - hy) ** 2 <= rad * rad && tileAt(m, x, y) === T_FLOOR) m.t[y * W + x] = T_HAZ;
      }
    }
  });
  for (let i = 0; i < W * H; i++) m.shade[i] = Math.floor(rng() * 255);
  return m;
}

// véletlen szabad pont egy teremben
function roomSpot(m, r, rng, margin = 1) {
  for (let i = 0; i < 40; i++) {
    const x = rng.int(r.x + margin, r.x + r.w - 1 - margin), y = rng.int(r.y + margin, r.y + r.h - 1 - margin);
    if (tileAt(m, x, y) === T_FLOOR) return { x: (x + 0.5) * TILE, y: (y + 0.5) * TILE };
  }
  return { x: (r.cx + 0.5) * TILE, y: (r.cy + 0.5) * TILE };
}

// ---------------- Kapuváros (kézzel tervezett központ) ----------------
function genTown() {
  const W = 60, H = 50, m = makeMapObj(W, H); m.region = 'varos'; m.floor = 0; m.style = 'town';
  const rect = (x, y, w, h, v) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) m.t[j * W + i] = v; };
  rect(3, 3, W - 6, H - 6, T_FLOOR);
  // épületek (akadályként), előttük az NPC
  const houses = [[6, 6, 8, 5], [18, 5, 7, 5], [36, 5, 7, 5], [47, 6, 8, 5], [6, 38, 8, 6], [47, 38, 8, 6], [18, 40, 6, 5], [37, 40, 6, 5]];
  houses.forEach(h => rect(h[0], h[1], h[2], h[3], T_OBST));
  // szökőkút-gyűrű a Kapu körül
  for (let a = 0; a < 24; a++) { const x = Math.round(30 + Math.cos(a / 24 * 6.283) * 6), y = Math.round(25 + Math.sin(a / 24 * 6.283) * 5); if (a % 6 !== 0) m.t[y * W + x] = T_OBST; }
  // fák
  const rng = makeRng(77);
  for (let i = 0; i < 40; i++) { const x = rng.int(4, W - 5), y = rng.int(13, 36); if ((x - 30) ** 2 + (y - 25) ** 2 > 110 && Math.abs(x - 30) > 3 && m.t[y * W + x] === T_FLOOR && rng() < 0.5) m.t[y * W + x] = T_OBST; }
  for (let i = 0; i < W * H; i++) m.shade[i] = Math.floor(rng() * 255);
  m.start = { x: 30.5 * TILE, y: 32 * TILE };
  m.houses = houses;
  return m;
}

// ---------------- statikus réteg kirajzolása ----------------
function renderStatic(m, pal) {
  const c = document.createElement('canvas'); c.width = m.w * TILE; c.height = m.h * TILE;
  const g = c.getContext('2d');
  g.fillStyle = pal.void; g.fillRect(0, 0, c.width, c.height);
  const rgb = hex => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  const fl = rgb(pal.floor), fl2 = rgb(pal.floor2), wl = rgb(pal.wall), hz = rgb(pal.haz || '#000000');
  const mix = (a, b, t) => `rgb(${a[0] + (b[0] - a[0]) * t | 0},${a[1] + (b[1] - a[1]) * t | 0},${a[2] + (b[2] - a[2]) * t | 0})`;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const t = m.t[y * m.w + x], s = m.shade[y * m.w + x] / 255, px = x * TILE, py = y * TILE;
    if (t === T_FLOOR || t === T_HAZ || t === T_OBST) {
      g.fillStyle = mix(fl, fl2, s * 0.6 + ((x + y) & 1) * 0.15); g.fillRect(px, py, TILE, TILE);
      if (pal.grid) { g.strokeStyle = pal.grid; g.lineWidth = 1; g.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1); }
      if (s > 0.86 && pal.speck) { g.fillStyle = pal.speck; g.fillRect(px + (s * 97 % 24) + 3, py + (s * 61 % 24) + 3, 3, 2); }
    }
    if (t === T_HAZ) {
      g.fillStyle = mix(hz, fl, 0.15 + s * 0.2); g.fillRect(px, py, TILE, TILE);
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.arc(px + 8 + s * 16, py + 10 + (1 - s) * 12, 3 + s * 4, 0, 7); g.fill();
    }
  }
  // falak: felső lap + oldalfal a padló felé
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const t = m.t[y * m.w + x]; if (t !== T_WALL) continue;
    const nearFloor = !solidTile(m, x, y + 1) || !solidTile(m, x + 1, y) || !solidTile(m, x - 1, y) || !solidTile(m, x, y - 1) || !solidTile(m, x + 1, y + 1) || !solidTile(m, x - 1, y - 1) || !solidTile(m, x + 1, y - 1) || !solidTile(m, x - 1, y + 1);
    if (!nearFloor) continue;
    const s = m.shade[y * m.w + x] / 255, px = x * TILE, py = y * TILE;
    g.fillStyle = mix(wl, [255, 255, 255], 0.05 + s * 0.06); g.fillRect(px, py, TILE, TILE);
    if (tileAt(m, x, y + 1) !== T_WALL && tileAt(m, x, y + 1) !== T_OBST) { g.fillStyle = mix(wl, [0, 0, 0], 0.45); g.fillRect(px, py + TILE - 10, TILE, 10); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(px, py, TILE, 2);
    if (pal.wallLine) { g.strokeStyle = pal.wallLine; g.lineWidth = 1; g.beginPath(); g.moveTo(px, py + 11 + (x & 1) * 6); g.lineTo(px + TILE, py + 11 + (x & 1) * 6); g.stroke(); }
  }
  // akadályok (stílusonként)
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (m.t[y * m.w + x] !== T_OBST) continue;
    drawObstacle(g, m, x, y, pal, m.shade[y * m.w + x] / 255);
  }
  return c;
}
function drawObstacle(g, m, x, y, pal, s) {
  const px = x * TILE, py = y * TILE, st = m.style;
  g.save();
  if (st === 'shelves') { // raklapos polc
    g.fillStyle = '#2a3a52'; g.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
    g.fillStyle = '#e07b26'; g.fillRect(px + 1, py + 1, 3, TILE - 2); g.fillRect(px + TILE - 4, py + 1, 3, TILE - 2);
    const cols = ['#b48a5a', '#c9a06a', '#8f6c45', '#d7c39a', '#5f7c9b'];
    g.fillStyle = cols[Math.floor(s * 5)]; g.fillRect(px + 6, py + 5, TILE - 12, 10);
    g.fillStyle = cols[Math.floor(s * 13) % 5]; g.fillRect(px + 6, py + 18, TILE - 12, 9);
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.strokeRect(px + 6.5, py + 5.5, TILE - 13, 9);
  } else if (st === 'town') {
    if (m.houses && m.houses.some(h => x >= h[0] && x < h[0] + h[2] && y >= h[1] && y < h[1] + h[3])) {
      const h = m.houses.find(h => x >= h[0] && x < h[0] + h[2] && y >= h[1] && y < h[1] + h[3]);
      const roofRow = y - h[1] < h[3] - 2;
      g.fillStyle = roofRow ? (((x + y) & 1) ? '#7a3b2e' : '#6e3428') : '#c9b48f'; g.fillRect(px, py, TILE, TILE);
      if (!roofRow) { g.fillStyle = '#5b4632'; if (x === h[0] + (h[2] >> 1) && y === h[1] + h[3] - 1) g.fillRect(px + 8, py + 6, 16, 26); else if ((x - h[0]) % 3 === 1) { g.fillStyle = '#ffd27a'; g.fillRect(px + 9, py + 8, 14, 10); } }
      else { g.strokeStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(px, py + 16); g.lineTo(px + TILE, py + 16); g.stroke(); }
    } else if (Math.hypot(x - 30, y - 25) < 8) {
      g.fillStyle = '#7d8a9a'; g.fillRect(px + 2, py + 2, TILE - 4, TILE - 4); g.fillStyle = '#9fb0c2'; g.fillRect(px + 2, py + 2, TILE - 4, 6);
    } else { // fa
      g.fillStyle = '#3c2b1d'; g.fillRect(px + 13, py + 18, 6, 12);
      g.fillStyle = '#2f5a2a'; g.beginPath(); g.arc(px + 16, py + 14, 13, 0, 7); g.fill();
      g.fillStyle = '#3f7a37'; g.beginPath(); g.arc(px + 12, py + 11, 7, 0, 7); g.fill();
    }
  } else {
    const c = pal.obst || pal.wall;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(px + 16, py + 27, 14, 5, 0, 0, 7); g.fill();
    if (st === 'crystal') {
      g.fillStyle = c; g.beginPath(); g.moveTo(px + 16, py + 1); g.lineTo(px + 28, py + 14); g.lineTo(px + 22, py + 29); g.lineTo(px + 10, py + 29); g.lineTo(px + 4, py + 14); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(px + 16, py + 1); g.lineTo(px + 22, py + 29); g.lineTo(px + 16, py + 29); g.closePath(); g.fill();
    } else if (st === 'comb') {
      g.fillStyle = c; g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + 0.52; g.lineTo(px + 16 + Math.cos(a) * 14, py + 15 + Math.sin(a) * 14); } g.closePath(); g.fill();
      g.strokeStyle = 'rgba(80,40,0,.6)'; g.lineWidth = 2; g.stroke(); g.fillStyle = 'rgba(255,220,120,.5)'; g.beginPath(); g.arc(px + 16, py + 15, 5, 0, 7); g.fill();
    } else if (st === 'machine') {
      g.fillStyle = c; g.fillRect(px + 2, py + 3, TILE - 4, TILE - 6); g.fillStyle = '#ffcc33'; for (let i = 0; i < 4; i++) g.fillRect(px + 2 + i * 8, py + 3, 4, 3);
      g.fillStyle = s > 0.5 ? '#ff4433' : '#33ff88'; g.fillRect(px + 22, py + 12, 4, 4); g.fillStyle = '#1b1f26'; g.fillRect(px + 6, py + 12, 12, 10);
    } else if (st === 'radio') {
      g.fillStyle = c; g.fillRect(px + 3, py + 4, TILE - 6, TILE - 8); g.fillStyle = '#171a14'; g.beginPath(); g.arc(px + 11, py + 16, 6, 0, 7); g.fill();
      g.fillStyle = '#d8c48a'; g.fillRect(px + 19, py + 9, 7, 3); g.fillRect(px + 19, py + 15, 7, 3); g.fillStyle = s > 0.5 ? '#ffb347' : '#a8ff6a'; g.fillRect(px + 20, py + 22, 3, 3);
    } else if (st === 'void') {
      const gr = g.createRadialGradient(px + 16, py + 16, 2, px + 16, py + 16, 15); gr.addColorStop(0, '#000'); gr.addColorStop(0.7, '#1a0d2e'); gr.addColorStop(1, 'rgba(196,140,255,.5)');
      g.fillStyle = gr; g.beginPath(); g.arc(px + 16, py + 16, 15, 0, 7); g.fill();
    } else { // kő / oszlop
      g.fillStyle = c; g.beginPath(); g.moveTo(px + 4, py + 26); g.lineTo(px + 3, py + 10); g.lineTo(px + 12, py + 3); g.lineTo(px + 24, py + 4); g.lineTo(px + 29, py + 14); g.lineTo(px + 27, py + 27); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(px + 3, py + 10); g.lineTo(px + 12, py + 3); g.lineTo(px + 24, py + 4); g.lineTo(px + 16, py + 12); g.closePath(); g.fill();
    }
  }
  g.restore();
}
