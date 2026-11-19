import React, {useMemo, useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import GraphView from './GraphView';
import {CHUNKS, QUESTIONS, TRIPLES, KG_TALL, buildGraph, graphWalk, parseTriples, rank, TRIPLE_TEXT} from './kgToy';

const sel = {padding: '3px 6px', border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 6, background: 'var(--ifm-background-color)', color: 'var(--ifm-font-color-base)', fontSize: '0.85rem', maxWidth: '100%'};
const tripleName = (i) => `(${TRIPLES[i].join(', ')})`;

export default function HopCompare() {
  const [qi, setQi] = useState(2);
  const [k, setK] = useState(2);
  const [step, setStep] = useState(3);
  const [drop, setDrop] = useState(-1);
  const q = QUESTIONS[qi];
  const ranked = useMemo(() => rank(q.vec), [q]);
  const kk = Math.min(k, ranked.length);
  const topIds = ranked.slice(0, kk).map((r) => r.id);
  const got = q.need.filter((id) => topIds.indexOf(id) >= 0).length;
  const full = got === q.need.length;

  const walk = useMemo(() => graphWalk(q, drop), [q, drop]);
  const {nodes, edges} = useMemo(() => buildGraph(parseTriples(TRIPLE_TEXT).triples), []);
  const shownStep = Math.max(0, Math.min(step, walk.hops.length - 1));
  const hlEdges = {};
  const hlNodes = {};
  walk.hops.slice(0, shownStep + 1).forEach((h) => {
    h.edges.forEach((i) => {
      hlEdges[`e${i}`] = true;
      hlNodes[edges[i].s] = true;
      hlNodes[edges[i].o] = true;
    });
  });
  if (q.start && shownStep >= 0) hlNodes[`E:${q.start}`] = true;
  const shownEdges = edges.filter((e, i) => i !== drop);
  const shownNodes = nodes.filter((n) => shownEdges.some((e) => e.s === n.id || e.o === n.id));
  const pickQ = (i) => {
    setQi(i);
    setStep(9);
    setK(2);
  };

  return (
    <Viz
      title="벡터 검색과 그래프 따라가기"
      caption="왼쪽은 질문 목록과 청크 목록의 코사인으로 고른 상위 k개입니다. 청크의 목록은 연차, 병가, 인사팀, 재무팀, 팀장, 관리 여섯 칸을 사람이 정한 설명용 값입니다(실제 임베딩 값이 아닙니다). 동점은 번호 순으로 둡니다. 오른쪽은 같은 내용을 세 쌍으로 쌓은 그래프에서 간선을 따라간 길입니다."
    >
      <Controls>
        {QUESTIONS.map((x, i) => (
          <Btn key={x.id} on={i === qi} onClick={() => pickQ(i)}>
            {x.text}
          </Btn>
        ))}
      </Controls>
      <div className={s.two}>
        <div>
          <Controls>
            <Slider label="k" min={1} max={CHUNKS.length} value={kk} onChange={setK} />
          </Controls>
          <div style={{display: 'grid', gap: 5}}>
            {ranked.map((r, i) => {
              const inK = i < kk;
              const need = q.need.indexOf(r.id) >= 0;
              return (
                <div
                  key={r.id}
                  style={{
                    padding: '5px 9px',
                    border: '1px solid var(--ifm-color-emphasis-300)',
                    borderLeft: `5px solid ${need ? 'var(--vok)' : 'var(--ifm-color-emphasis-300)'}`,
                    borderRadius: 6,
                    fontSize: '0.82rem',
                    lineHeight: 1.5,
                    opacity: inK ? 1 : 0.4,
                    background: inK ? 'color-mix(in srgb, var(--va) 10%, transparent)' : undefined,
                  }}
                >
                  {i + 1}위 c{r.id} 코사인 {fmt(r.score, 3)}
                  {r.tie ? ' (동점)' : ''} {need ? ' [답에 필요]' : ''}
                  <div>{r.text}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <Controls>
            <label className={s.ctl}>
              <span>간선 따라가기</span>
              <input type="range" min={0} max={walk.hops.length - 1} value={shownStep} onChange={(e) => setStep(Number(e.target.value))} />
              <b>{shownStep} / {walk.hops.length - 1}</b>
            </label>
          </Controls>
          <Controls>
            <label className={s.ctl}>
              <span>추출에서 빠졌다고 치기</span>
              <select style={sel} value={drop} onChange={(e) => setDrop(Number(e.target.value))} aria-label="추출에서 빠진 세 쌍">
                <option value={-1}>빠진 것 없음</option>
                {TRIPLES.map((t, i) => (
                  <option key={i} value={i}>
                    {tripleName(i)}
                  </option>
                ))}
              </select>
            </label>
          </Controls>
          <GraphView nodes={shownNodes} edges={shownEdges} uid="hc" W={380} H={340} fixed={KG_TALL} hlEdges={hlEdges} hlNodes={hlNodes} label="질문을 따라 간선을 걷는 그래프" />
          <Note>{walk.hops[shownStep].label}.</Note>
        </div>
      </div>
      <Stats>
        <Stat label="벡터: 필요한 청크" value={`${got} / ${q.need.length}`} tone={full ? 'good' : 'bad'} />
        <Stat label="벡터: 들어간 청크" value={`${kk}개`} />
        <Stat label="그래프: 답" value={shownStep === walk.hops.length - 1 ? walk.answer : '…'} tone={shownStep === walk.hops.length - 1 ? (walk.ok ? 'good' : 'bad') : undefined} />
        <Stat label="그래프: 건넌 홉 수" value={Math.max(0, walk.hops.length - 1)} />
      </Stats>
      <Note>
        {q.id === 'B'
          ? '질문에 인사팀이라는 말이 없어서, 인사팀의 팀장 청크와 재무팀의 팀장 청크가 질문에 똑같이 가깝습니다. 필요한 둘을 모두 넣으려면 k를 4까지 올려야 하고, 그만큼 무관한 청크도 들어옵니다. 그래프는 인사팀을 간선에서 찾아냅니다.'
          : q.id === 'C'
            ? '벡터 검색은 정답이 몇 개인지 모르는 채로 k를 정해야 합니다. 그래프는 조건에 맞는 간선을 모두 세어 개수를 바로 냅니다. 규정이 수천 개라면 k로는 셀 수 없습니다.'
            : '질문에 개체 이름이 그대로 있으면 벡터 검색도 첫 번째로 맞는 청크를 올립니다. 한 홉짜리 질문에서는 둘이 크게 다르지 않습니다.'}
        {drop >= 0 ? ' 그래프의 세 쌍이 하나라도 빠지면 길이 끊깁니다. 그래프의 답은 만들어진 그래프만큼만 정확합니다.' : ''}
      </Note>
    </Viz>
  );
}
