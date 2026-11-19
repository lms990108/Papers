// 설명용 장난감 데이터: RAG 그림들이 함께 쓰는 작은 문서, 청크, 질문.
// 수 목록은 차원이 (연차, 병가, 출장)인 설명용 값이다.
export const CHUNKS = [
  {id: 1, text: '연차는 15일입니다. 입사 첫해는 11일입니다.', vec: [1, 0, 0]},
  {id: 2, text: '병가는 연차와 별도입니다.', vec: [0.4, 1, 0]},
  {id: 3, text: '출장비는 출장이 끝난 뒤 정산합니다.', vec: [0, 0, 1]},
];

// need: 답에 필요한 청크 id 목록
export const QUESTIONS = [
  {text: '연차는 며칠인가요?', vec: [1, 0, 0], need: [1], answer: '연차는 15일입니다.'},
  {text: '휴가 일수는 며칠인가요?', vec: [0.8, 0.6, 0], need: [1], answer: '연차는 15일입니다.'},
  {text: '출장비는 언제 정산하나요?', vec: [0, 0, 1], need: [3], answer: '출장이 끝난 뒤 정산합니다.'},
];

export const cosine = (a, b) => {
  const dot = a.reduce((s, x, i) => s + x * b[i], 0);
  const na = Math.sqrt(a.reduce((s, x) => s + x * x, 0));
  const nb = Math.sqrt(b.reduce((s, x) => s + x * x, 0));
  return na === 0 || nb === 0 ? 0 : dot / (na * nb);
};

// 점수 큰 순 정렬(동점이면 번호 순)
export const rankChunks = (qvec) =>
  CHUNKS.map((c) => ({...c, score: cosine(qvec, c.vec)})).sort((a, b) => b.score - a.score || a.id - b.id);

export const box = (extra) => ({
  padding: '8px 12px',
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: 8,
  background: 'var(--ifm-background-color)',
  fontSize: '0.88rem',
  lineHeight: 1.55,
  ...extra,
});

export const tint = (c, p = 16) => `color-mix(in srgb, ${c} ${p}%, transparent)`;
