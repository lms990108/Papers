import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {CHUNKS, bm25List} from './advData';

// dense: c1..c8 순서의 설명용 코사인. toks: 키워드 검색(BM25)이 보는 설명용 토큰(없으면 임베딩 전용).
const CASES = [
  {
    name: '대화 속 짧은 질문',
    intro: '앞 턴에서 연차 규정을 물었고, 다음 턴에서 그건 며칠이에요?라고 묻는 경우입니다. 정답은 c1입니다.',
    variants: [
      {name: '원 질문', text: '그건 며칠이에요?', toks: ['그건', '며칠'], dense: [0.31, 0.3, 0.34, 0.36, 0.27, 0.33, 0.22, 0.18]},
      {name: '재작성(맥락을 채움)', text: '연차는 며칠인가요?', toks: ['연차', '며칠'], dense: [0.88, 0.52, 0.6, 0.2, 0.08, 0.25, 0.35, 0.06]},
      {name: '재작성이 엇나간 경우', text: '병가는 며칠인가요?', toks: ['병가', '며칠'], dense: [0.45, 0.9, 0.3, 0.15, 0.08, 0.2, 0.1, 0.06]},
    ],
  },
  {
    name: '말이 안 겹치는 질문',
    intro: '질문이 쉬는 날이 얼마나 돼요?이고 규정에는 연차는 15일이라고 적혀 있는 경우입니다. 정답은 c1입니다.',
    variants: [
      {name: '원 질문', text: '쉬는 날이 얼마나 돼요?', toks: ['쉬는', '날'], dense: [0.52, 0.5, 0.53, 0.57, 0.2, 0.58, 0.15, 0.1]},
      {name: 'HyDE(가상 문서를 임베딩)', text: '연차는 15일이고, 입사 첫해에는 11일입니다.', toks: null, dense: [0.93, 0.55, 0.62, 0.3, 0.08, 0.35, 0.3, 0.05]},
      {name: 'HyDE가 엇나간 경우', text: '출장비 정산은 출장이 끝난 뒤 며칠 안에 합니다.', toks: null, dense: [0.2, 0.15, 0.18, 0.3, 0.9, 0.25, 0.22, 0.2]},
    ],
  },
];

const rankOf = (dense) =>
  CHUNKS.map((c, i) => ({id: c.id, s: dense[i]})).sort((a, b) => b.s - a.s || a.id.localeCompare(b.id));

export default function QueryRewrite() {
  const [ci, setCi] = useState(0);
  const [vi, setVi] = useState(0);
  const [k, setK] = useState(3);
  const cs = CASES[ci];
  const v = cs.variants[vi];
  const rows = rankOf(v.dense);
  const ansRank = rows.findIndex((r) => r.id === 'c1') + 1;
  const kwList = v.toks ? bm25List(v.toks) : null;
  const kwRank = kwList ? kwList.indexOf('c1') + 1 : 0;

  const pickCase = (i) => {
    setCi(i);
    setVi(0);
  };

  return (
    <Viz
      title="질의를 바꾸면 검색 결과가 바뀐다"
      caption="두 경우에서 질의 변형을 골라 보세요. 임베딩 코사인은 설명용 값이고, 키워드 순위는 같은 BM25 함수로 계산했습니다. 엇나간 경우는 일부러 만든 반례입니다."
    >
      <Controls>
        {CASES.map((c, i) => (
          <Btn key={c.name} on={i === ci} onClick={() => pickCase(i)}>{c.name}</Btn>
        ))}
        <Slider label="k" min={1} max={8} value={k} onChange={setK} />
      </Controls>
      <div className={s.note} style={{margin: '0 0 6px'}}>{cs.intro}</div>
      <Controls>
        {cs.variants.map((x, i) => (
          <Btn key={x.name} on={i === vi} onClick={() => setVi(i)}>{x.name}</Btn>
        ))}
      </Controls>
      <div
        style={{
          padding: '6px 10px',
          border: '1px solid var(--ifm-color-emphasis-300)',
          borderRadius: 8,
          fontSize: '0.88rem',
          margin: '4px 0 8px',
        }}
      >
        검색에 넣는 글: {v.text}
      </div>
      {rows.map((r, i) => (
        <div key={r.id}>
          <div className={s.note} style={{margin: '6px 0 0', opacity: i < k ? 1 : 0.5}}>
            {i + 1}위. {r.id} {CHUNKS.find((c) => c.id === r.id).text}{r.id === 'c1' ? ' (정답)' : ''}{i < k ? '' : ' [k 밖]'}
          </div>
          <Bar label="코사인(설명용)" value={r.s} max={1} color={r.id === 'c1' ? 'var(--vok)' : 'var(--va)'} text={fmt(r.s, 2)} />
        </div>
      ))}
      <Stats>
        <Stat label="임베딩 검색에서 정답 순위" value={`${ansRank}위`} tone={ansRank <= k ? 'good' : 'bad'} />
        <Stat label={`상위 ${k}개에 정답이`} value={ansRank <= k ? '들어옴' : '못 들어옴'} tone={ansRank <= k ? 'good' : 'bad'} />
        <Stat
          label="키워드 검색에서 정답 순위"
          value={kwList === null ? '해당 없음' : kwRank ? `${kwRank}위(후보 ${kwList.length}개)` : kwList.length ? '목록 밖' : '결과 없음'}
          tone={kwList === null ? undefined : kwRank === 1 ? 'good' : 'bad'}
        />
      </Stats>
      <Note>
        {kwList === null
          ? 'HyDE는 가상 문서를 임베딩해서 쓰는 방법이라 키워드 순위는 보이지 않습니다. 가상 문서가 질문의 뜻을 맞게 짚으면 정답 쪽으로, 엉뚱하게 짚으면 엉뚱한 쪽으로 질의 벡터가 갑니다.'
          : vi === 0
            ? '원 질문은 그대로 두 검색에 들어갑니다. 키워드 검색은 질문의 글자가 청크에 있어야 하고, 임베딩 검색은 점수가 비슷비슷하면 순위가 불안정합니다.'
            : '재작성은 글자를 바꾸므로 키워드 검색과 임베딩 검색 모두에 영향을 줍니다. 재작성이 질문의 뜻을 바꾸면 검색도 그 뜻을 따라갑니다.'}
      </Note>
    </Viz>
  );
}
