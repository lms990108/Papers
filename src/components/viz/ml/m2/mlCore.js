// m2 공용 계산: 시그모이드, 소프트맥스, 표시용 숫자 정리
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const r1 = (v) => Math.round(v * 10) / 10;
export const r2 = (v) => Math.round(v * 2) / 2;

export const sigmoid = (s) => 1 / (1 + Math.exp(-s));

export const softmax = (v) => {
  const m = Math.max.apply(null, v);
  const e = v.map((x) => Math.exp(x - m));
  const z = e.reduce((a, c) => a + c, 0);
  return e.map((x) => x / z);
};

// 불필요한 0을 지운 숫자 문자열 (-0은 0으로)
export const num = (v, n = 3) => {
  if (!Number.isFinite(v)) return v > 0 ? '∞' : v < 0 ? '-∞' : '—';
  const r = Math.round(v * 10 ** n) / 10 ** n;
  return String(Object.is(r, -0) ? 0 : r);
};

// 정답 칸 비율 p에 대한 로그 오차 (p가 0이어도 크래시하지 않게)
export const nll = (p) => -Math.log(Math.max(p, 1e-300));
