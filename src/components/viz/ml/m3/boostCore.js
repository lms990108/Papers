export const X = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const Y = [1, 1, 1, -1, -1, 1, 1, -1, -1, -1];

// 결정 그루터기 20개: x < t 이면 s, 아니면 -s (파이썬 best_stump와 같은 순서)
export const STUMPS = [];
for (let i = 0; i < 10; i++) {
  [1, -1].forEach((s) => STUMPS.push({t: i + 0.5, s}));
}
export const stumpPred = (st) => X.map((x) => (x < st.t ? st.s : -st.s));
export const stumpLabel = (st) => 'x<' + st.t + ' → ' + (st.s > 0 ? '+1' : '−1');

export const weightedError = (w, pred) => w.reduce((a, wi, i) => a + (pred[i] !== Y[i] ? wi : 0), 0);

export function bestStumpIndex(w) {
  let best = -1;
  let be = Infinity;
  STUMPS.forEach((st, k) => {
    const e = weightedError(w, stumpPred(st));
    if (best < 0 || e < be - 1e-12) {
      be = e;
      best = k;
    }
  });
  return best;
}

// 한 라운드: 가중 오류, 표의 크기, 갱신 전후 가중치
export function round(w, pred) {
  const eps = weightedError(w, pred);
  if (eps <= 0 || eps >= 1) return {eps, alpha: NaN, Z: NaN, factor: [], prod: [], next: w.slice(), bad: true};
  const alpha = 0.5 * Math.log((1 - eps) / eps);
  const factor = pred.map((p, i) => Math.exp(-alpha * Y[i] * p));
  const prod = w.map((wi, i) => wi * factor[i]);
  const Z = prod.reduce((a, v) => a + v, 0);
  return {eps, alpha, Z, factor, prod, next: prod.map((v) => v / Z), bad: false};
}

// 선택한 그루터기 목록으로 라운드를 차례로 돌린다.
export function runRounds(picks) {
  let w = X.map(() => 0.1);
  let F = X.map(() => 0);
  const rounds = [];
  picks.forEach((k) => {
    const pred = stumpPred(STUMPS[k]);
    const r = round(w, pred);
    const alpha = r.bad ? 0 : r.alpha;
    F = F.map((f, i) => f + alpha * pred[i]);
    rounds.push({k, pred, w, ...r, F});
    w = r.bad ? w : r.next;
  });
  return {rounds, w, F};
}
export const errCount = (F) => F.filter((f, i) => (f > 0 ? 1 : -1) !== Y[i]).length;
