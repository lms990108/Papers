// g7 묶음의 공용 계산 도구 (컴포넌트가 아님)
export const dot = (a, b) => a.reduce((acc, v, i) => acc + v * b[i], 0);

// -Infinity 로 가린 칸은 비율 0. 모두 가려졌거나 NaN 이면 전부 0 을 돌려준다.
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
export const trim = (v, d = 3) => {
  const n = Number(v.toFixed(d));
  return String(Object.is(n, -0) ? 0 : n);
};

export const vec = (v, d = 3) => `[${v.map((x) => trim(x, d)).join(', ')}]`;

// 값 0..1 을 파랑 농도로
export const heat = (p, color = 'var(--va)') => {
  const pct = Math.round(Math.max(0, Math.min(1, p)) * 70);
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
};

export const comma = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// 셀프 어텐션 한 층. Xq: 질문을 만드는 시퀀스, Xkv: 열쇠와 값을 만드는 시퀀스
// causal 이면 j > i 인 칸을 소프트맥스 전에 가린다 (Xq 와 Xkv 의 길이가 같을 때만 의미가 있다)
export function attend(Xq, Xkv, WQ, WK, WV, causal = false) {
  const d = WQ[0].length;
  const Q = Xq.map((x) => vecMat(x, WQ));
  const K = Xkv.map((x) => vecMat(x, WK));
  const V = Xkv.map((x) => vecMat(x, WV));
  const S = Q.map((q, i) => K.map((k, j) => (causal && j > i ? -Infinity : dot(q, k) / Math.sqrt(d))));
  const A = S.map((row) => softmax(row));
  const Y = A.map((row) => V[0].map((_, c) => row.reduce((acc, a, j) => acc + a * V[j][c], 0)));
  return {Q, K, V, S, A, Y};
}
