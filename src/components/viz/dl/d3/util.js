// d3 묶음 공용 계산. (컴포넌트가 아니라 순수 함수 모음)

// 출력 한 변: floor((N + 2P - K) / S) + 1. 창이 들어갈 자리가 없으면 0.
export const outSize = (N, K, S = 1, P = 0) => {
  const w = N + 2 * P - K;
  if (!(S >= 1) || w < 0) return 0;
  return Math.floor(w / S) + 1;
};

// 천 단위 쉼표
export const num = (x) => {
  if (!isFinite(x)) return '-';
  const neg = x < 0;
  const t = String(Math.round(Math.abs(x))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return neg ? '−' + t : t;
};

// 소수 n자리까지, 끝의 0은 지우고 음수는 −로 표시
export const trim = (x, n = 4) => {
  if (!isFinite(x)) return '-';
  const v = +x.toFixed(n);
  const t = String(Math.abs(v));
  return v < 0 ? '−' + t : t;
};

// 한 줄 합성곱(상호상관): y_i = sum_k w_k x_{i+k}
export const conv1d = (x, w) => {
  const o = x.length - w.length + 1;
  const y = [];
  for (let i = 0; i < o; i++) {
    let s = 0;
    for (let k = 0; k < w.length; k++) s += w[k] * x[i + k];
    y.push(s);
  }
  return y;
};

// 2차원 합성곱(상호상관). x, k는 정사각 2차원 배열.
export const conv2d = (x, k, stride = 1, pad = 0) => {
  const n = x.length;
  const m = k.length;
  const np = n + 2 * pad;
  const z = [];
  for (let i = 0; i < np; i++) {
    const row = [];
    for (let j = 0; j < np; j++) {
      const a = i - pad;
      const b = j - pad;
      row.push(a >= 0 && a < n && b >= 0 && b < n ? x[a][b] : 0);
    }
    z.push(row);
  }
  const o = outSize(n, m, stride, pad);
  const out = [];
  for (let r = 0; r < o; r++) {
    const row = [];
    for (let c = 0; c < o; c++) {
      let s = 0;
      for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) s += z[r * stride + i][c * stride + j] * k[i][j];
      row.push(s);
    }
    out.push(row);
  }
  return {z, out, o};
};

export const chunk = (flat, n) => {
  const out = [];
  for (let i = 0; i < flat.length; i += n) out.push(flat.slice(i, i + n));
  return out;
};
