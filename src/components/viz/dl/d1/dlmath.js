// d1 묶음의 공용 계산 도구 (컴포넌트가 아님)
export const ACTS = {
  none: {label: '없음 (직선)', f: (a) => a},
  tanh: {label: 'tanh', f: (a) => Math.tanh(a)},
  relu: {label: 'ReLU', f: (a) => Math.max(0, a)},
  sigmoid: {label: '시그모이드', f: (a) => 1 / (1 + Math.exp(-a))},
};

export const comma = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const dot = (w, x) => w.reduce((a, wi, i) => a + wi * x[i], 0);

export const sgn = (v) => (v < 0 ? '-' : '+');

// 부호 포함 문자열 (음수는 괄호 없이 -0.2)
export const num = (v, n = 1) => {
  const r = Math.round(v * 10 ** n) / 10 ** n;
  return String(Object.is(r, -0) ? 0 : r);
};
