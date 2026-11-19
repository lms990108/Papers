import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {QUERIES, byId, bm25List, denseList, rrf} from './advData';

// 질문 "휴가 일수"의 1단계 결과: 위 그림과 같은 RRF(k=60) 합친 순서.
const Q = QUERIES[0];
const FIRST = rrf([bm25List(Q.toks), denseList(Q.dense)], 60).order;
// 설명용: 질문과 청크를 한 입력으로 읽는 재정렬 모델이 매긴 점수(c1..c8 순서). 실제 모델 출력이 아닙니다.
const RERANK = {c1: 0.94, c2: 0.12, c3: 0.35, c4: 0.18, c5: 0.02, c6: 0.21, c7: 0.03, c8: 0.01};
const SIZES = [1000, 100000, 1000000];

const short = (t) => (t.length > 26 ? `${t.slice(0, 26)}…` : t);

export default function RerankFunnel() {
  const [n, setN] = useState(2);
  const [m, setM] = useState(1);
  const [ms, setMs] = useState(10);
  const [big, setBig] = useState(1);
  const cand = FIRST.slice(0, n);
  const reranked = cand.slice().sort((a, b) => RERANK[b] - RERANK[a] || a.localeCompare(b));
  const final = reranked.slice(0, Math.min(m, n));
  const ans = Q.answer[0];
  const inCand = cand.indexOf(ans) >= 0;
  const before = FIRST.indexOf(ans) + 1;
  const after = reranked.indexOf(ans) + 1;
  const N = SIZES[big];
  const status = !inCand
    ? '누락. 정답이 후보에 없어서 재정렬 모델이 한 번도 보지 못합니다.'
    : after <= m
      ? '재정렬이 정답을 최종 목록 안으로 올렸습니다.'
      : '후보에는 있지만 최종 개수 m이 작아서 잘렸습니다.';

  return (
    <Viz
      title="후보 수 n과 재정렬"
      caption="질문은 휴가 일수입니다. 1단계 순서는 위 그림의 RRF(k = 60) 결과이고, 재정렬 점수와 쌍당 시간 10ms는 설명용 값입니다. 후보 수 n을 1에서 8까지 움직여 정답 c1이 언제 살아나는지 보세요."
    >
      <Controls>
        <Slider label="후보 수 n" min={1} max={8} value={n} onChange={setN} />
        <Slider label="최종 개수 m" min={1} max={4} value={m} onChange={setM} />
        <Slider label="쌍당 시간(ms)" min={1} max={50} value={ms} onChange={setMs} />
      </Controls>
      <div className={s.two}>
        <div>
          <div className={s.title} style={{margin: '0 0 4px'}}>1단계: 검색이 준 순서</div>
          {FIRST.map((id, i) => (
            <div
              key={id}
              style={{
                padding: '3px 8px',
                marginBottom: 3,
                border: '1px solid var(--ifm-color-emphasis-300)',
                borderRadius: 6,
                fontSize: '0.82rem',
                opacity: i < n ? 1 : 0.4,
                background: id === ans ? 'color-mix(in srgb, var(--vok) 14%, transparent)' : 'transparent',
              }}
            >
              <b>{i + 1}위</b> {id} {short(byId(id).text)}{id === ans ? ' (정답)' : ''}{i < n ? '' : ' [후보 밖]'}
            </div>
          ))}
        </div>
        <div>
          <div className={s.title} style={{margin: '0 0 4px'}}>2단계: 후보 안에서 다시 매긴 순서</div>
          {reranked.map((id, i) => (
            <div
              key={id}
              style={{
                padding: '3px 8px',
                marginBottom: 3,
                border: `1px solid ${i < m ? 'var(--va)' : 'var(--ifm-color-emphasis-300)'}`,
                borderRadius: 6,
                fontSize: '0.82rem',
                background: id === ans ? 'color-mix(in srgb, var(--vok) 14%, transparent)' : 'transparent',
              }}
            >
              <b>{i + 1}위</b> {id} 점수 {fmt(RERANK[id], 2)}{id === ans ? ' (정답)' : ''}{i < m ? ' → 생성에 붙임' : ''}
            </div>
          ))}
        </div>
      </div>
      <Stats>
        <Stat label="정답 순위(재정렬 전 → 후)" value={inCand ? `${before}위 → ${after}위` : `${before}위 → 후보 밖`} tone={inCand && after <= m ? 'good' : 'bad'} />
        <Stat label="재정렬 모델 호출 수" value={`${n}번`} />
        <Stat label="재정렬 시간(순차 가정)" value={`${n * ms}ms`} />
      </Stats>
      <Note>{status}</Note>
      <Controls>
        <span style={{fontSize: '0.85rem'}}>만약 청크 전체를 재정렬 모델로 직접 매기면</span>
        {SIZES.map((x, i) => (
          <Btn key={x} on={i === big} onClick={() => setBig(i)}>청크 {x.toLocaleString('en-US')}개</Btn>
        ))}
      </Controls>
      <Note>
        청크 {N.toLocaleString('en-US')}개를 질문마다 모두 읽히면 {N.toLocaleString('en-US')}번 호출이고, 쌍당 {ms}ms를 순차로 곱하면 {Math.round((N * ms) / 1000).toLocaleString('en-US')}초입니다. 그래서 값싼 검색으로 후보 n개를 먼저 줄입니다. 배치와 병렬을 무시한 단순 계산입니다.
      </Note>
    </Viz>
  );
}
