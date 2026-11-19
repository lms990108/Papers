// d2 묶음의 공용 계산과 작은 도구 (컴포넌트가 아님)

export const lin = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// 끝의 0을 지운 소수 표기 (1.0800 -> 1.08)
export const tr = (x, n = 4) => {
  if (!isFinite(x)) return '—';
  const v = parseFloat(x.toFixed(n));
  return String(Object.is(v, -0) ? 0 : v);
};

const SUP = {'-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'};
export const sup = (str) => String(str).split('').map((c) => SUP[c] || c).join('');

// 크기가 매우 작거나 큰 수는 과학 표기, 나머지는 유효숫자 6자리
export const sci = (x, digits = 3) => {
  if (x == null || !isFinite(x)) return '—';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e5) return String(parseFloat(x.toPrecision(6)));
  const [m, e] = x.toExponential(digits - 1).split('e');
  return `${m}×10${sup(Number(e))}`;
};

// ----- 경사하강법 -----
export const E1 = (w) => (w - 3) * (w - 3);
export const g1 = (w) => 2 * (w - 3);
export const gdPath = (w0, eps, n, grad = g1) => {
  const p = [w0];
  let w = w0;
  for (let i = 0; i < n; i++) {
    w -= eps * grad(w);
    p.push(w);
  }
  return p;
};

// E(w1, w2) = (w1 - 3)^2 + 10 (w2 - 1)^2
export const E2 = (a, b) => (a - 3) * (a - 3) + 10 * (b - 1) * (b - 1);
export const path2 = (e1, e2, n, w0 = [0, 0]) => {
  const p = [w0];
  let [a, b] = w0;
  for (let i = 0; i < n; i++) {
    a -= e1 * 2 * (a - 3);
    b -= e2 * 20 * (b - 1);
    p.push([a, b]);
  }
  return p;
};

// 두 층 예: h = tanh(w1 x), y = w2 h, E = (y - t)^2
export const net = (x, w1, w2, t) => {
  const a = w1 * x;
  const h = Math.tanh(a);
  const y = w2 * h;
  const E = (y - t) * (y - t);
  const dy = 2 * (y - t);
  const dw2 = dy * h;
  const dh = dy * w2;
  const da = dh * (1 - h * h);
  const dw1 = da * x;
  return {a, h, y, E, dy, dw2, dh, da, dw1};
};

// ----- 확률적 경사하강법 -----
export const T4 = [3, 3, 1, 3];
export const meanE = (w, ts) => ts.reduce((s, t) => s + (w - t) * (w - t), 0) / ts.length;

// 한 에폭을 크기 m의 묶음으로 나눠 돈다. 갱신마다 w를 기록한다.
export const runMini = (ts, eps, epochs, m, decay = false, w0 = 0) => {
  const trace = [{w: w0, ep: 0}];
  const last = [];
  let w = w0;
  for (let e = 1; e <= epochs; e++) {
    const lr = decay ? eps / (1 + (e - 1) / 5) : eps;
    const nb = Math.ceil(ts.length / m);
    last.length = 0;
    for (let b = 0; b < nb; b++) {
      const batch = ts.slice(b * m, b * m + m);
      const g = batch.reduce((s, t) => s + 2 * (w - t), 0) / batch.length;
      w -= lr * g;
      trace.push({w, ep: e - 1 + (b + 1) / nb});
      last.push(w);
    }
  }
  return {trace, last: last.slice(), w};
};

// ----- 기울기 소실 -----
export const sigmoid = (z) => 1 / (1 + Math.exp(-z));
export const ACTS = {
  sig: {name: '시그모이드', f: sigmoid, df: (z) => sigmoid(z) * (1 - sigmoid(z))},
  tanh: {name: 'tanh', f: Math.tanh, df: (z) => 1 - Math.tanh(z) * Math.tanh(z)},
  relu: {name: 'ReLU', f: (z) => Math.max(0, z), df: (z) => (z > 0 ? 1 : 0)},
};
// h_k = act(w h_{k-1}), h_0 = x. 층마다 곱해지는 값과 누적 기울기를 돌려준다.
export const chain = (act, w, x, n) => {
  const {f, df} = ACTS[act];
  const hs = [x];
  const fac = [];
  let h = x;
  for (let k = 0; k < n; k++) {
    const a = w * h;
    fac.push(df(a) * w);
    h = f(a);
    hs.push(h);
  }
  // 출력 쪽에서부터 곱해 오므로 누적은 뒤층부터지만, 곱은 순서와 무관하다
  const cum = [1];
  for (let k = n - 1; k >= 0; k--) cum.push(cum[cum.length - 1] * fac[k]);
  return {hs, fac, cum, g: cum[cum.length - 1], out: h};
};
export const chainOut = (act, w, x, n) => chain(act, w, x, n).out;

// 로그 눈금용: 양수 값의 상용로그(0이면 -Infinity)
export const log10 = (v) => (v > 0 ? Math.log(v) / Math.LN10 : -Infinity);
