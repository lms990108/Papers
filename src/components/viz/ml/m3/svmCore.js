// 서포트 벡터 머신 계산 (2차원)
const dotp = (w, p) => w[0] * p[0] + w[1] * p[1];

export function gapAt(neg, pos, deg) {
  const r = (deg * Math.PI) / 180;
  const w = [Math.cos(r), Math.sin(r)];
  const mp = Math.min.apply(null, pos.map((p) => dotp(w, p)));
  const mn = Math.max.apply(null, neg.map((p) => dotp(w, p)));
  return {gap: mp - mn, mp, mn, w};
}

// 하드 마진: 방향을 훑은 뒤 이분 탐색으로 다듬는다. 직선으로 못 가르면 null.
export function maxMargin(neg, pos) {
  if (!neg.length || !pos.length) return null;
  let bd = 0;
  let bg = -Infinity;
  for (let d = 0; d < 720; d++) {
    const g = gapAt(neg, pos, d / 2).gap;
    if (g > bg + 1e-12) {
      bg = g;
      bd = d / 2;
    }
  }
  if (bg <= 1e-9) return null;
  let lo = bd - 0.5;
  let hi = bd + 0.5;
  for (let k = 0; k < 60; k++) {
    const m1 = lo + (hi - lo) / 3;
    const m2 = hi - (hi - lo) / 3;
    if (gapAt(neg, pos, m1).gap < gapAt(neg, pos, m2).gap) lo = m1;
    else hi = m2;
  }
  const deg = (lo + hi) / 2;
  const r = gapAt(neg, pos, deg);
  const k = 2 / r.gap;
  return {gap: r.gap, deg, w: [r.w[0] * k, r.w[1] * k], b: -((r.mp + r.mn) / 2) * k};
}

// 소프트 마진: 쌍대 문제를 SMO로 푼다. pts = [{x, y, t}] (t는 +1 또는 -1)
export function softSvm(pts, C, maxIter = 4000) {
  const n = pts.length;
  const K = (i, j) => pts[i].x * pts[j].x + pts[i].y * pts[j].y;
  const a = new Array(n).fill(0);
  const G = new Array(n).fill(-1);
  let gmax = 0;
  let gmin = 0;
  for (let it = 0; it < maxIter; it++) {
    let i = -1;
    let j = -1;
    gmax = -Infinity;
    gmin = Infinity;
    for (let k = 0; k < n; k++) {
      const t = pts[k].t;
      const v = -t * G[k];
      const up = (t === 1 && a[k] < C) || (t === -1 && a[k] > 0);
      const low = (t === 1 && a[k] > 0) || (t === -1 && a[k] < C);
      if (up && v > gmax) { gmax = v; i = k; }
      if (low && v < gmin) { gmin = v; j = k; }
    }
    if (i < 0 || j < 0 || gmax - gmin < 1e-9) break;
    const ti = pts[i].t;
    const tj = pts[j].t;
    const quad = Math.max(K(i, i) + K(j, j) - 2 * K(i, j), 1e-12);
    let d = (gmax - gmin) / quad;
    d = Math.min(d, ti === 1 ? C - a[i] : a[i], tj === 1 ? a[j] : C - a[j]);
    a[i] += ti * d;
    a[j] -= tj * d;
    for (let k = 0; k < n; k++) G[k] += pts[k].t * d * (K(k, i) - K(k, j));
  }
  let w = [0, 0];
  for (let k = 0; k < n; k++) w = [w[0] + a[k] * pts[k].t * pts[k].x, w[1] + a[k] * pts[k].t * pts[k].y];
  let sum = 0;
  let cnt = 0;
  for (let k = 0; k < n; k++) {
    if (a[k] > 1e-9 && a[k] < C - 1e-9) {
      sum += pts[k].t - dotp(w, [pts[k].x, pts[k].y]);
      cnt++;
    }
  }
  const b = cnt ? sum / cnt : Number.isFinite(gmax) && Number.isFinite(gmin) ? (gmax + gmin) / 2 : 0;
  return {w, b, alpha: a};
}
