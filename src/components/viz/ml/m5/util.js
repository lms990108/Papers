// m5 묶음(비터비, 과분할, GTN, SDNN)이 함께 쓰는 계산과 데이터.
// 값은 모두 원본 페이지의 표와 파이썬 출력에서 가져왔습니다.

// ---------- 과분할 격자 "41" ----------
export const ARC_KEYS = ['0-1', '1-2', '2-3', '0-2', '1-3'];
export const LABELS = ['1', '4', 'j'];
export const LABEL_NAME = {'1': '1', '4': '4', j: '쓰레기'};
export const SPAN_NAME = {
  '0-1': '조각 1',
  '1-2': '조각 2',
  '2-3': '조각 3',
  '0-2': '조각 1+2',
  '1-3': '조각 2+3',
};

export const PEN0 = {
  '0-1': {'1': 2.4, '4': 3.5, j: 0.2},
  '1-2': {'1': 1.8, '4': 4.0, j: 1.5},
  '2-3': {'1': 0.4, '4': 5.0, j: 3.0},
  '0-2': {'1': 3.5, '4': 0.5, j: 2.8},
  '1-3': {'1': 3.2, '4': 4.5, j: 0.3},
};

export const clonePen = (p) => {
  const o = {};
  Object.keys(p).forEach((k) => {
    o[k] = {...p[k]};
  });
  return o;
};

const ends = (k) => k.split('-').map(Number);

// 노드 목록(nodes)에 양 끝이 모두 있는 호만 써서, 0에서 3까지 가는 경로를 전부 나열합니다.
export function listPaths(pen, nodes, allowed) {
  const out = [];
  const rec = (n, acc, cost) => {
    if (n === 3) {
      out.push({arcs: acc, cost, label: acc.map((a) => a[1]).join('')});
      return;
    }
    ARC_KEYS.forEach((k) => {
      const [s, e] = ends(k);
      if (s !== n || nodes.indexOf(e) < 0) return;
      LABELS.forEach((l) => {
        if (allowed.indexOf(l) < 0) return;
        rec(e, acc.concat([[k, l]]), cost + pen[k][l]);
      });
    });
  };
  if (nodes.indexOf(0) >= 0 && nodes.indexOf(3) >= 0) rec(0, [], 0);
  return out;
}

export const bestPath = (paths) => {
  let b = null;
  paths.forEach((p) => {
    if (!b || p.cost < b.cost - 1e-12) b = p;
  });
  return b;
};

export const logadd = (xs) => {
  const m = Math.min.apply(null, xs);
  return m - Math.log(xs.reduce((a, x) => a + Math.exp(-(x - m)), 0));
};

export const arcId = (k, l) => `${k}:${l}`;
export const arcText = (k, l) => `${k.replace('-', '→')}, ${l === 'j' ? '쓰레기' : l}`;

// 두 비용의 차 E = Cc - Cu 와 호별 기울기.
export function errorStats(pen, target, nodes = [0, 1, 2, 3]) {
  const every = listPaths(pen, nodes, ['1', '4']);
  const right = every.filter((p) => p.label === target);
  if (!every.length || !right.length) return null;
  const bc = bestPath(right);
  const bu = bestPath(every);
  const fc = logadd(right.map((p) => p.cost));
  const fu = logadd(every.map((p) => p.cost));
  const use = (group) => {
    const w = group.map((p) => Math.exp(-p.cost));
    const z = w.reduce((a, b) => a + b, 0);
    const prob = {};
    group.forEach((p, i) => {
      p.arcs.forEach((a) => {
        prob[arcId(a[0], a[1])] = (prob[arcId(a[0], a[1])] || 0) + w[i] / z;
      });
    });
    return prob;
  };
  const pc = use(right);
  const pu = use(every);
  const inPath = (p, id) => (p.arcs.some((a) => arcId(a[0], a[1]) === id) ? 1 : 0);
  const gradV = {};
  const gradF = {};
  const ids = [];
  ARC_KEYS.forEach((k) =>
    ['1', '4'].forEach((l) => {
      const id = arcId(k, l);
      ids.push(id);
      gradV[id] = inPath(bc, id) - inPath(bu, id);
      gradF[id] = (pc[id] || 0) - (pu[id] || 0);
    }),
  );
  return {
    every,
    right,
    bc,
    bu,
    vitC: bc.cost,
    vitU: bu.cost,
    fwdC: fc,
    fwdU: fu,
    ev: bc.cost - bu.cost,
    ef: fc - fu,
    gradV,
    gradF,
    pc,
    pu,
    ids,
  };
}

// ---------- 비터비: 날씨 격자 ----------
export const W_STATES = ['맑음', '비'];
export const W_OBS = ['산책', '쇼핑', '청소'];
const W_PI = [0.6, 0.4];
const W_B = [
  [0.6, 0.3, 0.1],
  [0.1, 0.4, 0.5],
];

// pSS: 맑음→맑음, pRR: 비→비 (나머지는 1에서 뺀 값)
export function weatherA(pSS = 0.7, pRR = 0.6) {
  return [
    [pSS, 1 - pSS],
    [1 - pRR, pRR],
  ];
}
export const weatherEmit = (s, t) => W_B[s][t];
export const weatherStart = (s) => W_PI[s];

export function trellis(A, T = 3) {
  const v = [[W_PI[0] * W_B[0][0], W_PI[1] * W_B[1][0]]];
  const back = [[null, null]];
  const cand = [[null, null]];
  for (let t = 1; t < T; t += 1) {
    const vt = [];
    const bt = [];
    const ct = [];
    for (let s = 0; s < 2; s += 1) {
      const c = [v[t - 1][0] * A[0][s], v[t - 1][1] * A[1][s]];
      const r = c[1] > c[0] ? 1 : 0;
      vt.push(c[r] * W_B[s][t]);
      bt.push(r);
      ct.push(c);
    }
    v.push(vt);
    back.push(bt);
    cand.push(ct);
  }
  return {v, back, cand};
}

export function backtrace(back, v, T) {
  let s = v[T - 1][1] > v[T - 1][0] ? 1 : 0;
  const path = [s];
  for (let t = T - 1; t > 0; t -= 1) {
    s = back[t][s];
    path.push(s);
  }
  return path.reverse();
}

export function allWeatherPaths(A) {
  const out = [];
  for (let a = 0; a < 2; a += 1) {
    for (let b = 0; b < 2; b += 1) {
      for (let c = 0; c < 2; c += 1) {
        const p = W_PI[a] * W_B[a][0] * A[a][b] * W_B[b][1] * A[b][c] * W_B[c][2];
        out.push({path: [a, b, c], p});
      }
    }
  }
  return out;
}

// ---------- SDNN ----------
export const SD_LABELS = ['_', '4', '1'];
export const SD_OUT = [
  [0.2, 3.0, 3.0],
  [1.5, 0.9, 2.8],
  [2.8, 0.2, 2.9],
  [1.8, 1.4, 1.1],
  [0.3, 3.0, 2.6],
  [1.7, 3.1, 0.8],
  [2.9, 3.3, 0.1],
  [1.2, 2.9, 1.0],
  [0.2, 3.0, 3.0],
  [0.1, 3.0, 3.0],
];

export function sdRead(out) {
  const read = out.map((row) => {
    let b = 0;
    row.forEach((x, k) => {
      if (x < row[b]) b = k;
    });
    return SD_LABELS[b];
  });
  const collapsed = read
    .filter((c, i) => c !== '_' && (i === 0 || c !== read[i - 1]))
    .join('');
  const cost = out.reduce((a, row) => a + Math.min.apply(null, row), 0);
  return {read, collapsed, cost};
}

// 정답 문자열 target만 허용하는 강제 정렬. 상태는 _ c1 _ c2 _ ... 순서입니다.
export function sdForced(out, target) {
  const chars = target.split('');
  const stLab = ['_'];
  chars.forEach((c) => {
    stLab.push(c);
    stLab.push('_');
  });
  const n = stLab.length;
  const idx = (c) => SD_LABELS.indexOf(c);
  const moves = [];
  for (let s = 0; s < n; s += 1) {
    const m = [s];
    if (s + 1 < n) m.push(s + 1);
    if (s + 2 < n && stLab[s + 2] !== '_' && stLab[s] !== stLab[s + 2]) m.push(s + 2);
    moves.push(m);
  }
  const INF = Infinity;
  if (out.length < chars.length) return null;
  let v = new Array(n).fill(INF);
  v[0] = out[0][idx('_')];
  v[1] = out[0][idx(stLab[1])];
  const back = [];
  for (let i = 1; i < out.length; i += 1) {
    const nv = new Array(n).fill(INF);
    const bp = new Array(n).fill(null);
    for (let s = 0; s < n; s += 1) {
      if (v[s] === INF) continue;
      moves[s].forEach((t) => {
        const c = v[s] + out[i][idx(stLab[t])];
        if (c < nv[t] - 1e-12) {
          nv[t] = c;
          bp[t] = s;
        }
      });
    }
    v = nv;
    back.push(bp);
  }
  let s = n - 1;
  if (v[n - 2] < v[n - 1]) s = n - 2;
  if (v[s] === INF) return null;
  const cost = v[s];
  const states = [s];
  for (let i = back.length - 1; i >= 0; i -= 1) {
    s = back[i][s];
    states.push(s);
  }
  states.reverse();
  return {cost, aligned: states.map((x) => stLab[x]), states};
}

// 마지막 합성곱층(C5)의 위치 수. 폭이 32 + 4k일 때 k + 1곳.
export function c5Layers(width) {
  const c1 = width - 4;
  const s2 = Math.floor(c1 / 2);
  const c3 = s2 - 4;
  const s4 = Math.floor(c3 / 2);
  const c5 = s4 - 4;
  return {c1, s2, c3, s4, c5};
}
