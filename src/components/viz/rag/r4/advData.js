// 설명용 장난감 데이터: 고급 RAG 그림들이 함께 쓰는 작은 청크 8개와 질문.
// 청크의 token은 사람이 미리 나눈 설명용 값(조사 제거)입니다.
// 임베딩 코사인(dense)은 실제 모델 출력이 아니라 설명용 값입니다.
export const CHUNKS = [
  {id: 'c1', text: '연차는 15일입니다. 입사 첫해는 11일입니다.', toks: ['연차', '15일', '입사', '첫해', '11일']},
  {id: 'c2', text: '병가는 연차와 별도입니다.', toks: ['병가', '연차', '별도']},
  {id: 'c3', text: '미사용 연차는 다음 해로 최대 5일까지 이월됩니다.', toks: ['미사용', '연차', '다음', '해', '이월', '최대', '5일']},
  {id: 'c4', text: '휴가 신청은 사흘 전까지 시스템에 등록합니다.', toks: ['휴가', '신청', '사흘', '전', '시스템', '등록']},
  {id: 'c5', text: '출장비는 출장이 끝난 뒤 정산합니다.', toks: ['출장비', '출장', '종료', '정산']},
  {id: 'c6', text: '경조사 휴가는 결혼 5일, 부고 3일입니다.', toks: ['경조사', '휴가', '결혼', '5일', '부고', '3일', '지급']},
  {id: 'c7', text: 'ERR-4021: 연차 신청 시스템 오류입니다. 인사팀에 문의하세요.', toks: ['ERR-4021', '연차', '신청', '시스템', '오류', '인사팀', '문의']},
  {id: 'c8', text: 'ERR-4012: 급여 명세서 조회 오류입니다.', toks: ['ERR-4012', '급여', '명세서', '조회', '오류']},
];

export const IDS = CHUNKS.map((c) => c.id);
export const byId = (id) => CHUNKS.find((c) => c.id === id);

// toks: BM25가 보는 질문 token. dense: 청크 순서(c1..c8)대로 설명용 코사인.
export const QUERIES = [
  {
    key: 'vac',
    text: '휴가 일수',
    toks: ['휴가', '일수'],
    answer: ['c1'],
    dense: [0.82, 0.55, 0.71, 0.58, 0.12, 0.66, 0.2, 0.1],
    note: '정답 청크(c1)에 “휴가”도 “일수”도 없어서 키워드 검색 목록에 아예 들어오지 못합니다.',
  },
  {
    key: 'carry',
    text: '연차 이월',
    toks: ['연차', '이월'],
    answer: ['c3'],
    dense: [0.6, 0.5, 0.9, 0.3, 0.08, 0.35, 0.28, 0.05],
    note: '두 방식이 같은 청크를 1등으로 고르는 경우입니다.',
  },
  {
    key: 'err',
    text: 'ERR-4021',
    toks: ['ERR-4021'],
    answer: ['c7'],
    dense: [0.15, 0.12, 0.1, 0.2, 0.18, 0.1, 0.49, 0.5],
    note: '코드 번호는 임베딩 점수가 비슷비슷해서 임베딩이 1등을 틀리게 고른 경우입니다.',
  },
];

// BM25 (Lucene 형태의 idf). k1, b는 인자로 받는다.
export const bm25Parts = (toks, k1, b) => {
  const N = CHUNKS.length;
  const avgdl = CHUNKS.reduce((s, c) => s + c.toks.length, 0) / N;
  const rows = CHUNKS.map((c) => {
    let score = 0;
    const terms = toks.map((t) => {
      const df = CHUNKS.filter((d) => d.toks.indexOf(t) >= 0).length;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      const tf = c.toks.filter((x) => x === t).length;
      const norm = k1 * (1 - b + (b * c.toks.length) / avgdl);
      const part = tf === 0 ? 0 : (idf * tf * (k1 + 1)) / (tf + norm);
      score += part;
      return {t, df, idf, tf, part};
    });
    return {id: c.id, len: c.toks.length, score, terms};
  });
  return {avgdl, rows};
};

// 점수 > 0 인 청크만 점수 큰 순(동점이면 번호 순)으로. 점수 0은 목록에 오르지 않는다.
export const bm25List = (toks, k1 = 1.2, b = 0.75) =>
  bm25Parts(toks, k1, b)
    .rows.filter((r) => r.score > 0)
    .sort((x, y) => y.score - x.score || x.id.localeCompare(y.id))
    .map((r) => r.id);

export const denseList = (dense) =>
  IDS.map((id, i) => ({id, s: dense[i]}))
    .sort((x, y) => y.s - x.s || x.id.localeCompare(y.id))
    .map((r) => r.id);

// 순위 목록들을 RRF로 합친다. 목록에 없는 청크는 그 목록의 항을 받지 못한다.
export const rrf = (lists, k) => {
  const score = {};
  IDS.forEach((id) => {
    score[id] = 0;
  });
  lists.forEach((list) => {
    list.forEach((id, i) => {
      score[id] += 1 / (k + i + 1);
    });
  });
  const order = IDS.filter((id) => lists.some((l) => l.indexOf(id) >= 0)).sort(
    (x, y) => score[y] - score[x] || x.localeCompare(y),
  );
  return {score, order};
};
