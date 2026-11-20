import React, {useState} from 'react';
import {Viz, Controls, Btn, Bar, Note, fmt, styles as s} from './Viz';

const CASES = [
  {
    q: '휴가 일수',
    note: '질문의 단어와 겹치지 않아도 뜻이 가까운 청크를 임베딩이 찾습니다.',
    answer: 0,
    chunks: [
      {t: '연차는 15일입니다.', cos: 0.82},
      {t: '병가는 최대 30일까지 쓸 수 있습니다.', cos: 0.55},
      {t: '휴가 일수 계산 시 주말은 제외합니다.', cos: 0.71},
      {t: '식대는 월 20만원까지 지원합니다.', cos: 0.12},
    ],
  },
  {
    q: 'ERR-4021',
    note: '고유한 번호는 임베딩 점수가 비슷비슷해서, 같은 글자가 있는지 보는 키워드 검색이 더 직접적입니다.',
    answer: 0,
    chunks: [
      {t: 'ERR-4021: 결제 모듈 초기화 실패', cos: 0.48},
      {t: 'ERR-4012: 인증 토큰 만료', cos: 0.47},
      {t: '결제 오류가 나면 고객센터에 문의하세요.', cos: 0.4},
      {t: 'ERR-3999: 네트워크 시간 초과', cos: 0.45},
    ],
  },
];

export default function KeywordVsEmbedding() {
  const [ci, setCi] = useState(0);
  const [mode, setMode] = useState('keyword');
  const cs = CASES[ci];
  const words = cs.q.split(' ');

  const rows = cs.chunks
    .map((c, i) => ({
      ...c,
      i,
      kw: words.filter((w) => c.t.includes(w)).length,
    }))
    .sort((a, b) => (mode === 'keyword' ? b.kw - a.kw : b.cos - a.cos) || a.i - b.i);

  const top = rows[0];
  const ok = top.i === cs.answer && (mode === 'embedding' || top.kw > 0);

  return (
    <Viz
      title="키워드 검색과 임베딩 검색 비교"
      caption="질문을 고르고 검색 방식을 바꿔 보세요. 임베딩 점수는 설명용 값이고, 코사인은 질문과 청크의 방향이 같을수록 1에 가까워지는 값입니다."
    >
      <Controls>
        {CASES.map((c, i) => (
          <Btn key={c.q} on={i === ci} onClick={() => setCi(i)}>
            질문: {c.q}
          </Btn>
        ))}
        <Btn on={mode === 'keyword'} onClick={() => setMode('keyword')}>키워드 검색</Btn>
        <Btn on={mode === 'embedding'} onClick={() => setMode('embedding')}>임베딩 검색</Btn>
      </Controls>
      {rows.map((r, rank) => (
        <div key={r.t}>
          <div className={s.note} style={{margin: '8px 0 0'}}>
            {rank + 1}위. {r.t}
            {r.i === cs.answer ? ' (정답)' : ''}
          </div>
          {mode === 'keyword' ? (
            <Bar label="겹친 단어 수" value={r.kw} max={Math.max(2, ...rows.map((x) => x.kw))} color="var(--va)" text={`${r.kw}개`} />
          ) : (
            <Bar label="코사인" value={r.cos} max={1} color="var(--vb)" text={fmt(r.cos)} />
          )}
        </div>
      ))}
      <Note>
        {ok ? '정답 청크가 1위입니다. ' : '정답 청크가 1위가 아닙니다. '}
        {cs.note}
      </Note>
    </Viz>
  );
}
