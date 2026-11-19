// g2 공용 계산: 엔그램/언어 모델 페이지가 같은 세 줄짜리 코퍼스를 쓴다.
export const V = ['오늘', '날씨', '좋다', '나쁘다'];
export const CORPUS = [
  ['오늘', '날씨', '좋다'],
  ['오늘', '날씨', '나쁘다'],
  ['오늘', '날씨', '좋다'],
];

function countAll(corpus) {
  const uni = {};
  const big = {};
  const hist = {};
  V.forEach((a) => {
    uni[a] = 0;
    hist[a] = 0;
    big[a] = {};
    V.forEach((b) => {
      big[a][b] = 0;
    });
  });
  corpus.forEach((s) => {
    s.forEach((w) => {
      uni[w] += 1;
    });
    for (let i = 0; i < s.length - 1; i += 1) {
      big[s[i]][s[i + 1]] += 1;
      hist[s[i]] += 1;
    }
  });
  const total = V.reduce((acc, w) => acc + uni[w], 0);
  return {uni, big, hist, total};
}

export const COUNTS = countAll(CORPUS);

// 더하기-k 스무딩. 앞 단어를 본 적이 없고 k가 0이면 정의되지 않아 NaN.
export function pBigram(w, h, k) {
  const den = COUNTS.hist[h] + k * V.length;
  return den === 0 ? NaN : (COUNTS.big[h][w] + k) / den;
}

export const pUnigram = (w) => COUNTS.uni[w] / COUNTS.total;

// 문장의 자리별 비율. 첫 단어 비율은 1로 둔다(원본과 같은 약속).
export function ratios(model, sent, k) {
  if (model === 'uniform') return sent.map(() => 1 / V.length);
  if (model === 'unigram') return sent.map((w) => pUnigram(w));
  return sent.map((w, i) => (i === 0 ? 1 : pBigram(w, sent[i - 1], k)));
}

export const safe = (p) => (Number.isNaN(p) ? 0 : p);

export function ppl(ps) {
  if (ps.length === 0) return NaN;
  if (ps.some((p) => !(p > 0))) return Infinity;
  return Math.exp(-ps.reduce((acc, p) => acc + Math.log(p), 0) / ps.length);
}

export const showPpl = (x) => (x === Infinity ? '한없이 큼' : Number.isNaN(x) ? '—' : x.toFixed(3));
