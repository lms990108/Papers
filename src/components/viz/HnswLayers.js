import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, styles as s} from './Viz';

const L2 = [[90, 78], [240, 68], [380, 88]];
const L1 = [[90, 198], [175, 188], [240, 203], [310, 183], [380, 208]];
const L0 = [[60, 348], [105, 328], [150, 358], [190, 333], [230, 363], [270, 338], [305, 368], [350, 343], [390, 363], [420, 338]];
const E2 = [[0, 1], [1, 2]];
const E1 = [[0, 1], [1, 2], [2, 3], [3, 4]];
const E0 = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [2, 4], [5, 7]];
const QUERY = [300, 418];

const STEPS = [
  {t: '1. 진입', d: '최상위 레이어의 정해진 점에서 시작합니다.', l2: [0], p2: [], l1: [], p1: [], l0: [], best: -1},
  {t: '2. 최상위 레이어에서 이동', d: '질문에 더 가까운 이웃으로 옮겨 가다가, 더 가까워지지 않으면 멈춥니다. 링크가 길어서 멀리 있는 곳으로 크게 건너뜁니다.', l2: [0, 1], p2: [[0, 1]], l1: [], p1: [], l0: [], best: -1},
  {t: '3. 한 층 아래에서 다시 이동', d: '멈춘 점의 바로 아래 노드에서 시작해, 한 층 아래에서 같은 방식으로 이동합니다. 층이 내려갈수록 링크가 짧아져 더 세밀하게 찾습니다.', l2: [0, 1], p2: [[0, 1]], l1: [2, 3], p1: [[2, 3]], l0: [], best: -1},
  {t: '4. 레이어 0에서 상세 탐색', d: '모든 점이 있는 레이어 0에서 후보 ef개를 유지하며 이웃을 방문해, 가장 가까운 k개를 반환합니다.', l2: [0, 1], p2: [[0, 1]], l1: [2, 3], p1: [[2, 3]], l0: [5, 6, 7], best: 6},
];

const PURPLE = '#7c3aed';
const GRAY = 'var(--ifm-color-emphasis-400)';

function Layer({nodes, edges, hl, path, label, y0, y1, amber, best}) {
  return (
    <g>
      <rect x={30} y={y0} width={410} height={y1 - y0} rx={8} fill="none" stroke="var(--ifm-color-emphasis-300)" />
      <text x={40} y={y0 + 16} className={s.ts}>{label}</text>
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="var(--ifm-color-emphasis-400)" strokeWidth="0.9" />
      ))}
      {path.map(([a, b], i) => (
        <line key={`p${i}`} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke={PURPLE} strokeWidth="2.5" />
      ))}
      {nodes.map((n, i) => {
        const isHl = hl.includes(i);
        const isAmber = amber && amber.includes(i);
        const isBest = best === i;
        return (
          <circle
            key={i}
            cx={n[0]}
            cy={n[1]}
            r={isHl || isAmber ? 7 : 5}
            fill={isBest || isHl ? PURPLE : isAmber ? '#f59e0b' : GRAY}
          />
        );
      })}
    </g>
  );
}

export default function HnswLayers() {
  const [step, setStep] = useState(0);
  const st = STEPS[step];
  return (
    <Viz
      title="HNSW의 계층 구조와 검색 경로"
      caption="단계를 눌러 검색이 어떻게 진행되는지 따라가 보세요. 위 레이어일수록 점이 적고 링크가 깁니다."
    >
      <Controls>
        {STEPS.map((x, i) => (
          <Btn key={x.t} on={i === step} onClick={() => setStep(i)}>
            {x.t.split('.')[0]}단계
          </Btn>
        ))}
      </Controls>
      <svg viewBox="0 0 480 450" className={s.svg} style={{maxWidth: 500}} role="img" aria-label="HNSW 레이어와 검색 경로">
        <Layer nodes={L2} edges={E2} hl={st.l2} path={st.p2} label="레이어 2 (점 적음, 링크 김)" y0={30} y1={120} />
        <Layer nodes={L1} edges={E1} hl={st.l1} path={st.p1} label="레이어 1" y0={150} y1={240} />
        <Layer nodes={L0} edges={E0} hl={[]} path={[]} label="레이어 0 (모든 점)" y0={270} y1={395} amber={st.l0} best={st.best} />
        {step >= 2 ? <line x1={240} y1={68} x2={240} y2={203} stroke={PURPLE} strokeWidth="1.5" strokeDasharray="4 3" /> : null}
        {step >= 3 ? <line x1={310} y1={183} x2={305} y2={368} stroke={PURPLE} strokeWidth="1.5" strokeDasharray="4 3" /> : null}
        <polygon points={`${QUERY[0]},${QUERY[1] - 9} ${QUERY[0] + 8},${QUERY[1]} ${QUERY[0]},${QUERY[1] + 9} ${QUERY[0] - 8},${QUERY[1]}`} fill="var(--vb)" />
        <text x={QUERY[0] + 14} y={QUERY[1] + 4} className={s.ts}>질문</text>
      </svg>
      <Note>
        <b>{st.t}</b>. {st.d}
      </Note>
    </Viz>
  );
}
