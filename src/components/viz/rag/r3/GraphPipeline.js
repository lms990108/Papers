import React, {useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note, styles as s} from '../../Viz';
import GraphCanvas from './GraphCanvas';
import {CHUNKS, LEVELS, buildGraph, commOf, GROUP_COLORS} from './graphToy';

const STEPS = ['청크', '개체·관계 추출', '그래프', '커뮤니티', '요약'];
const box = {
  padding: '8px 12px',
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: 8,
  background: 'var(--ifm-background-color)',
  fontSize: '0.88rem',
  lineHeight: 1.55,
};

export default function GraphPipeline() {
  const [step, setStep] = useState(0);
  const [n, setN] = useState(6);
  const shown = CHUNKS.slice(0, n);
  const g = buildGraph(n);
  const entMentions = shown.reduce((a, c) => a + c.ents.length, 0);
  const relMentions = shown.reduce((a, c) => a + c.rels.length, 0);
  const heavy = g.edges.filter((e) => e.w > 1);
  const comms = LEVELS[1].comms;
  const gi = (node) => {
    const c = commOf(1, node);
    return c ? comms.indexOf(c) : -1;
  };

  return (
    <Viz
      title="GraphRAG 색인: 청크에서 요약까지"
      caption="단계 버튼을 누르고, 읽은 청크 수 슬라이더를 움직여 보세요. 청크, 개체, 관계, 커뮤니티 나눔과 요약문은 모두 설명용 값입니다. 실제 LLM이 추출한 결과도, 실제 커뮤니티 탐지 결과도 아닙니다."
    >
      <Controls>
        {STEPS.map((name, i) => (
          <Btn key={name} on={i === step} onClick={() => setStep(i)}>
            {i + 1}. {name}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="읽은 청크 수" min={1} max={CHUNKS.length} value={n} onChange={setN} format={(v) => `${v}개`} />
      </Controls>

      {step <= 1 ? (
        <div style={{display: 'grid', gap: 6}}>
          {shown.map((c) => (
            <div key={c.id} style={box}>
              <b>청크 [{c.id}]</b> {c.text}
              {step === 1 ? (
                <div className={s.legend} style={{marginTop: 4}}>
                  개체: {c.ents.join(', ')}
                  <br />
                  관계: {c.rels.map((r) => `(${r[0]}, ${r[1]}, ${r[2]})`).join(' ')}
                </div>
              ) : null}
            </div>
          ))}
          {step === 0 ? <Note>문서를 청킹으로 나눈 상태입니다. 아직 아무것도 추출하지 않았습니다. 다음 단계에서 LLM이 청크마다 개체와 관계를 뽑습니다.</Note> : null}
        </div>
      ) : null}

      {step === 2 ? <GraphCanvas nodes={g.nodes} edges={g.edges} showRel label={`청크 ${n}개에서 만든 그래프`} /> : null}

      {step === 3 ? (
        <GraphCanvas
          nodes={g.nodes}
          edges={g.edges}
          color={(node) => GROUP_COLORS[Math.max(0, gi(node)) % GROUP_COLORS.length]}
          tag={(node) => (commOf(1, node) ? commOf(1, node).tag : '')}
          edgeOn={(e) => gi(e.a) === gi(e.b)}
          label="커뮤니티별로 색을 칠한 그래프"
        />
      ) : null}

      {step === 4 ? (
        n < CHUNKS.length ? (
          <Note>이 설명용 요약은 청크 6개를 모두 읽은 그래프에 대한 것입니다. 슬라이더를 6으로 올려 보세요.</Note>
        ) : (
          <div className={s.two}>
            {comms.map((c, i) => (
              <div key={c.id} style={{...box, borderColor: GROUP_COLORS[i]}}>
                <b>커뮤니티 {c.tag}</b> ({c.nodes.join(', ')})
                <div>{c.summary}</div>
              </div>
            ))}
          </div>
        )
      ) : null}

      {step === 2 ? (
        <Stats>
          <Stat label="개체 언급 → 노드" value={`${entMentions} → ${g.nodes.length}`} />
          <Stat label="관계 언급 → 엣지" value={`${relMentions} → ${g.edges.length}`} />
          <Stat label="가중치 2 이상 엣지" value={`${heavy.length}개`} />
        </Stats>
      ) : null}
      {step === 2 ? (
        <Note>
          같은 이름은 하나의 노드로 합니다. 같은 관계가 다른 청크에서 또 나오면 엣지는 하나이고 굵기(가중치)만 올라갑니다.
          {heavy.length ? ` 지금은 ${heavy.map((e) => `${e.a}-${e.b}`).join(', ')}(청크 ${heavy[0].chunks.join(', ')})가 그렇습니다.` : ' 청크를 5개 이상 읽으면 알파-결제 시스템이 두 번 나옵니다.'}
        </Note>
      ) : null}
      {step === 3 ? (
        <Note>색과 표지(A, B)가 같은 노드끼리 한 커뮤니티입니다. 점선은 두 커뮤니티를 가로지르는 관계입니다.</Note>
      ) : null}
    </Viz>
  );
}
