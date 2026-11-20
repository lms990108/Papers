import React, {useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note, styles as s} from '../../Viz';
import GraphCanvas from './GraphCanvas';
import {CHUNKS, FULL, ALL_NODES, LEVELS, QUESTIONS, vectorSearch, localSearch, hybridSearch, globalSearch, enough} from './graphToy';

const MODES = [
  {id: 'vec', name: '벡터 검색'},
  {id: 'local', name: '로컬 검색'},
  {id: 'global', name: '글로벌 검색'},
  {id: 'hyb', name: '하이브리드'},
];
const box = {padding: '6px 10px', border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 8, background: 'var(--ifm-background-color)', fontSize: '0.86rem', lineHeight: 1.5};

export default function QueryModes() {
  const [qi, setQi] = useState(1);
  const [mode, setMode] = useState('vec');
  const [k, setK] = useState(2);
  const [h, setH] = useState(1);
  const [lv, setLv] = useState(1);
  const q = QUESTIONS[qi];
  const seeds = mode === 'local' ? q.seeds : [];

  let ctx;
  if (mode === 'vec') ctx = vectorSearch(q, k);
  else if (mode === 'local') ctx = localSearch(q.seeds, h);
  else if (mode === 'hyb') ctx = hybridSearch(q, k, h);
  else ctx = {...globalSearch(lv), chunks: []};
  const isGlobal = mode === 'global';
  const ok = enough(q, ctx);
  // 글로벌 검색은 요약을 모으므로, 세부 관계를 묻는 질문은 판정하지 않는다.
  const verdict = isGlobal && q.need !== 'cover' ? '판정 안 함' : ok ? '예' : '아니오';
  const verdictTone = verdict === '예' ? 'good' : verdict === '아니오' ? 'bad' : undefined;
  const hint = (() => {
    if (mode === 'local' && q.seeds.length === 0) return '질문에 개체 이름이 없어 시작점을 못 잡았습니다. 로컬 검색은 특정 개체를 묻는 질문에 맞는 방식입니다.';
    if (isGlobal && q.need !== 'cover') return '글로벌 검색은 커뮤니티 요약을 모아 종합합니다. 이 질문은 특정 개체의 세부 관계를 묻기 때문에 요약만으로 충분한지는 요약문이 그 관계를 남겨 뒀는지에 달렸습니다.';
    if (mode === 'vec' && qi === 2 && !ok) return `청크 ${CHUNKS.length}개 가운데 ${ctx.chunks.length}개만 가져왔습니다. 논문의 팟캐스트 코퍼스처럼 청크가 1,669개라면 k를 5로 해도 0.3%입니다.`;
    if (mode === 'vec' && qi === 1) return '벡터 검색은 질문과 닮은 청크를 가져옵니다. 두 사람을 잇는 중간 청크는 질문과 닮지 않아 순위에 들지 않습니다.';
    if ((mode === 'local' || mode === 'hyb') && h >= 2) return '이웃을 더 멀리 따라가면 필요한 청크가 들어오지만 상관없는 청크도 같이 들어옵니다. 실제 구현은 우선순위와 토큰 예산으로 거릅니다.';
    return '';
  })();

  return (
    <Viz
      title="같은 질문, 다른 방식: 무엇을 가져오나"
      caption="질문과 방식을 바꿔 보세요. 코퍼스, 핵심어 점수(질문과 청크가 핵심어를 얼마나 공유하는지를 잰 이진 코사인), 시작 개체, 요약은 모두 설명용 값입니다. 진하게 칠한 개체와 관계가 가져온 것이고, 초록 고리는 로컬 검색의 시작 개체입니다. 홉 수는 시작 개체에서 관계를 몇 번 따라가는지입니다. 로컬 검색과 하이브리드는 이웃을 따라가는 방식을 홉 수로 단순화한 장난감이고, 실제 구현과 같지 않습니다."
    >
      <Controls>
        {QUESTIONS.map((x, i) => (
          <Btn key={x.text} on={i === qi} onClick={() => setQi(i)}>{x.text}</Btn>
        ))}
      </Controls>
      <Controls>
        {MODES.map((m) => (
          <Btn key={m.id} on={m.id === mode} onClick={() => setMode(m.id)}>{m.name}</Btn>
        ))}
      </Controls>
      <Controls>
        {mode === 'vec' || mode === 'hyb' ? <Slider label="k (청크 수)" min={1} max={CHUNKS.length} value={k} onChange={setK} /> : null}
        {mode === 'local' || mode === 'hyb' ? <Slider label="홉 수" min={1} max={3} value={h} onChange={setH} /> : null}
        {isGlobal
          ? LEVELS.map((l, i) => (
              <Btn key={l.name} on={i === lv} onClick={() => setLv(i)}>{l.name}</Btn>
            ))
          : null}
      </Controls>

      <GraphCanvas
        nodes={ALL_NODES}
        nodeOn={(n) => ctx.nodes.indexOf(n) >= 0}
        edgeOn={(e) => ctx.edges.indexOf(e.id) >= 0}
        ring={(n) => seeds.indexOf(n) >= 0}
        label={`${MODES.find((m) => m.id === mode).name}이 가져온 개체와 관계`}
      />

      {isGlobal ? (
        <div className={s.two}>
          {LEVELS[lv].comms.map((c) => (
            <div key={c.id} style={box}><b>요약 {c.tag}</b><div>{c.summary}</div></div>
          ))}
        </div>
      ) : (
        <div style={{display: 'grid', gap: 4}}>
          {ctx.chunks.length === 0 ? <div style={box}>가져온 청크가 없습니다.</div> : null}
          {ctx.chunks.map((id) => (
            <div key={id} style={box}><b>청크 [{id}]</b> {CHUNKS[id - 1].text}</div>
          ))}
        </div>
      )}

      <Stats>
        <Stat label={isGlobal ? '모은 요약' : '가져온 청크'} value={isGlobal ? `${ctx.summaries}개` : `${ctx.chunks.length} / ${CHUNKS.length}`} />
        <Stat label="닿은 개체" value={`${ctx.nodes.length} / ${ALL_NODES.length}`} />
        <Stat label="닿은 관계" value={`${ctx.edges.length} / ${FULL.edges.length}`} />
        <Stat label="필요한 근거가 있나" value={verdict} tone={verdictTone} />
      </Stats>
      <Note>필요한 근거: {q.needText}{hint ? ` ${hint}` : ''}</Note>
    </Viz>
  );
}
