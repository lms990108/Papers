// g4 묶음의 공용 계산 도구 (컴포넌트가 아님)
export const sigmoid = (z) => 1 / (1 + Math.exp(-z));

export const dot = (a, b) => a.reduce((acc, v, i) => acc + v * b[i], 0);

export const softmax = (s) => {
  const m = Math.max.apply(null, s);
  if (!isFinite(m)) return s.map(() => 0);
  const e = s.map((v) => Math.exp(v - m));
  const t = e.reduce((acc, v) => acc + v, 0);
  return e.map((v) => v / t);
};

// 행 벡터 x 와 행렬 W (행 수 = x 의 길이) 의 곱
export const vecMat = (x, W) => W[0].map((_, c) => x.reduce((acc, v, r) => acc + v * W[r][c], 0));

// 소수점 아래 0 을 떼어 내고 문자열로 (예: 1.500 -> "1.5")
export const trim = (v, d = 3) => String(Number(v.toFixed(d)));

// 값 0..1 을 파랑 농도로
export const heat = (p, color = 'var(--va)') => {
  const pct = Math.round(Math.max(0, Math.min(1, p)) * 70);
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
};

// 쉼표 넣은 정수
export const comma = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
