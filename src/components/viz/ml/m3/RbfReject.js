import React, {useRef, useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, useDrag, fmt, styles as s} from '../../Viz';
import {makeFrame} from './geom';

const W = 520;
const H = 300;
const XR = [-4, 4];
const YR = [-2.3, 2.3];
const {X, Y, ix, iy} = makeFrame(W, H, XR, YR, {l: 10, r: 10, t: 10, b: 10});
const clampP = (p) => [Math.max(XR[0] + 0.2, Math.min(XR[1] - 0.2, p[0])), Math.max(YR[0] + 0.2, Math.min(YR[1] - 0.2, p[1]))];
const START = {p: [-0.7, 0.45], a: [-2, 1.2], b: [1.8, -0.9]};

export default function RbfReject() {
  const ref = useRef(null);
  const [p, setP] = useState(START.p);
  const [a, setA] = useState(START.a);
  const [b, setB] = useState(START.b);
  const [T, setT] = useState(4);
  const {start, svgProps} = useDrag(ref, W, H, (id, q) => {
    const v = clampP([ix(q[0]), iy(q[1])]);
    if (id === 'p') setP(v);
    else if (id === 'a') setA(v);
    else setB(v);
  });
  const yA = (p[0] - a[0]) ** 2 + (p[1] - a[1]) ** 2;
  const yB = (p[0] - b[0]) ** 2 + (p[1] - b[1]) ** 2;
  const minY = Math.min(yA, yB);
  const reject = minY >= T;
  const nearer = yA < yB ? '3' : '8';
  const R = Math.sqrt(T);
  const sx = (X(1) - X(0));
  const sy = (Y(0) - Y(1));

  const star = (c, label, id, tone) => (
    <g key={id}>
      <ellipse cx={X(c[0])} cy={Y(c[1])} rx={R * sx} ry={R * sy} fill={tone} fillOpacity="0.08" stroke={tone} strokeDasharray="5 4" />
      <text x={X(c[0])} y={Y(c[1]) + 8} textAnchor="middle" style={{fill: tone, fontSize: 24, fontWeight: 700, pointerEvents: 'none'}}>★</text>
      <circle cx={X(c[0])} cy={Y(c[1])} r={16} fill="transparent" cursor="grab" onPointerDown={start(id)} />
      <text x={X(c[0]) + 16} y={Y(c[1]) - 12} className={s.t} style={{fill: tone}}>{label}의 기준</text>
    </g>
  );
  return (
    <Viz
      title="기준에서 멀면 글자가 아니라고 거부합니다"
      caption="점(앞 층이 낸 상태)과 별(클래스 기준)을 끌어 보세요. 벌점은 거리의 제곱이고, 점선 원은 문턱 T 안쪽(벌점이 T보다 작은 영역)입니다. 어느 원에도 들어가지 않으면 가장 가까운 별이 있어도 거부합니다. 좌표와 문턱은 설명용 값입니다."
    >
      <Controls>
        <Slider label="문턱 T (최소 벌점이 이 값 이상이면 거부)" min={0.25} max={12} step={0.25} value={T} onChange={setT} format={(v) => fmt(v, 2)} />
        <Btn onClick={() => { setP(START.p); setA(START.a); setB(START.b); }}>처음 위치</Btn>
        <Btn onClick={() => setP([3.2, 1.7])}>멀리 보내기</Btn>
      </Controls>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={s.canvas} style={{maxWidth: 560}} role="img" aria-label="앞 층 상태 평면: 점과 두 클래스 기준, 문턱 원" {...svgProps}>
        {star(a, '3', 'a', 'var(--va)')}
        {star(b, '8', 'b', 'var(--vc)')}
        <line x1={X(p[0])} y1={Y(p[1])} x2={X(a[0])} y2={Y(a[1])} stroke="var(--va)" strokeWidth={yA <= yB ? 2.5 : 1.2} strokeDasharray={yA <= yB ? undefined : '4 3'} />
        <line x1={X(p[0])} y1={Y(p[1])} x2={X(b[0])} y2={Y(b[1])} stroke="var(--vc)" strokeWidth={yB < yA ? 2.5 : 1.2} strokeDasharray={yB < yA ? undefined : '4 3'} />
        <text x={(X(p[0]) + X(a[0])) / 2} y={(Y(p[1]) + Y(a[1])) / 2 - 6} textAnchor="middle" className={s.ts}>y₃ = {fmt(yA, 2)}</text>
        <text x={(X(p[0]) + X(b[0])) / 2} y={(Y(p[1]) + Y(b[1])) / 2 - 6} textAnchor="middle" className={s.ts}>y₈ = {fmt(yB, 2)}</text>
        <circle cx={X(p[0])} cy={Y(p[1])} r={8} fill={reject ? 'var(--vbad)' : 'var(--vb)'} />
        <circle cx={X(p[0])} cy={Y(p[1])} r={16} fill="transparent" cursor="grab" onPointerDown={start('p')} />
        <text x={X(p[0]) + 12} y={Y(p[1]) + 20} className={s.t} style={{fill: reject ? 'var(--vbad)' : 'var(--vb)'}}>지금 입력{reject ? ' (거부)' : ''}</text>
      </svg>
      <Stats>
        <Stat label="3의 벌점 y₃ (3의 별까지 거리의 제곱)" value={fmt(yA, 2)} />
        <Stat label="8의 벌점 y₈ (8의 별까지 거리의 제곱)" value={fmt(yB, 2)} />
        <Stat label="더 가까운 기준" value={nearer} />
        <Stat label={`최소 벌점 ≥ 문턱(${fmt(T, 2)})?`} value={reject ? '예: 거부' : `아니오: ${nearer}로 읽음`} tone={reject ? 'bad' : 'good'} />
      </Stats>
      <Note>가까운 쪽을 고르는 일과 글자인지 판단하는 일은 따로입니다. 점을 두 별에서 멀리 보내면 더 가까운 별은 여전히 정해지지만 최소 벌점이 문턱을 넘어 거부됩니다.</Note>
    </Viz>
  );
}
