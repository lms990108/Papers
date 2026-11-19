export function mulberry32(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const d2 = (a, b) => {
  const x = a[0] - b[0];
  const y = a[1] - b[1];
  return x * x + y * y;
};

export function makePoints(n, seed) {
  const r = mulberry32(seed);
  return Array.from({length: n}, () => [r(), r()]);
}

export function knnOrder(points) {
  return points.map((p, i) =>
    points
      .map((o, j) => [d2(p, o), j])
      .filter((x) => x[1] !== i)
      .sort((a, b) => a[0] - b[0])
      .map((x) => x[1]),
  );
}

export function buildGraph(order, M) {
  const adj = order.map(() => new Set());
  order.forEach((nbrs, i) => {
    nbrs.slice(0, M).forEach((j) => {
      adj[i].add(j);
      adj[j].add(i);
    });
  });
  return adj.map((s) => Array.from(s));
}

export function quantizePoints(points, bits) {
  const L = 2 ** bits - 1;
  return points.map((p) => p.map((x) => Math.round(x * L) / L));
}

export function exactTopK(points, q, K) {
  return points
    .map((p, j) => [d2(p, q), j])
    .sort((a, b) => a[0] - b[0])
    .slice(0, K)
    .map((x) => x[1]);
}

export function search(adj, pts, q, ef, entry = 0) {
  const vis = new Set([entry]);
  const d0 = d2(pts[entry], q);
  const cand = [[d0, entry]];
  const res = [[d0, entry]];
  while (cand.length) {
    let bi = 0;
    for (let i = 1; i < cand.length; i += 1) if (cand[i][0] < cand[bi][0]) bi = i;
    const [dc, c] = cand.splice(bi, 1)[0];
    res.sort((a, b) => a[0] - b[0]);
    if (res.length >= ef && dc > res[ef - 1][0]) break;
    for (const nb of adj[c]) {
      if (!vis.has(nb)) {
        vis.add(nb);
        const dn = d2(pts[nb], q);
        res.sort((a, b) => a[0] - b[0]);
        if (res.length < ef || dn < res[res.length - 1][0]) {
          cand.push([dn, nb]);
          res.push([dn, nb]);
          res.sort((a, b) => a[0] - b[0]);
          if (res.length > ef) res.pop();
        }
      }
    }
  }
  res.sort((a, b) => a[0] - b[0]);
  return {pool: res.map((x) => x[1]), visited: Array.from(vis)};
}

export function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

export const normalCdf = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
