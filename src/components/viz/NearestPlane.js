import React, {useRef, useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, useDrag, styles as s} from './Viz';
import {makePoints} from './annSim';

const W = 500;
const H = 340;
const PTS = makePoints(60, 21).map((p) => [20 + p[0] * (W - 40), 20 + p[1] * (H - 40)]);

export default function NearestPlane() {
  const ref = useRef(null);
  const [q, setQ] = useState([250, 170]);
  const [k, setK] = useState(3);
  const {start, svgProps} = useDrag(ref, W, H, (id, p) => {
    setQ([Math.max(8, Math.min(W - 8, p[0])), Math.max(8, Math.min(H - 8, p[1]))]);
  });

  const ranked = PTS.map((p, i) => ({i, d: Math.hypot(p[0] - q[0], p[1] - q[1])})).sort((a, b) => a.d - b.d);
  const near = new Set(ranked.slice(0, k).map((r) => r.i));
  const radius = ranked[k - 1].d;

  return (
    <Viz
      title="가장 가까운 점 k개 찾기"
      caption="질문(주황 점)을 끌어 보세요. 점선 원은 k번째로 가까운 점까지의 거리입니다. 임베딩은 이런 점이고, 1024차원이면 축이 1024개일 뿐 같은 문제입니다."
    >
      <Controls>
        <Slider label="k" min={1} max={10} value={k} onChange={setK} />
      </Controls>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="점들과 질문 점" {...svgProps}>
        <circle cx={q[0]} cy={q[1]} r={radius} fill="var(--vb)" fillOpacity="0.07" stroke="var(--vb)" strokeDasharray="5 4" />
        {PTS.map((p, i) => (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r={near.has(i) ? 6 : 4}
            fill={near.has(i) ? 'var(--va)' : 'var(--ifm-color-emphasis-400)'}
          />
        ))}
        <circle cx={q[0]} cy={q[1]} r={11} fill="var(--vb)" fillOpacity="0.25" stroke="var(--vb)" strokeWidth="2" cursor="grab" onPointerDown={start('q')} />
      </svg>
      <Stats>
        <Stat label="찾은 점 수 k" value={k} />
        <Stat label="질문과 비교한 점 수" value={`${PTS.length}개 (전부)`} />
      </Stats>
    </Viz>
  );
}
