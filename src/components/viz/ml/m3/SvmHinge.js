import React, {useRef, useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, useDrag, fmt, styles as s} from '../../Viz';
import {makeFrame, clipHalfPlane, clipLine} from './geom';
import {softSvm} from './svmCore';

const W = 420;
const H = 380;
const XR = [-1, 6];
const YR = [-0.8, 5.5];
const {X, Y, ix, iy} = makeFrame(W, H, XR, YR, {l: 10, r: 10, t: 10, b: 10});
const RECT = [[XR[0], YR[0]], [XR[1], YR[0]], [XR[1], YR[1]], [XR[0], YR[1]]];
const BASE = [[0, 0], [1, 0], [0, 1], [1, 1], [3, 3], [4, 3], [3, 4], [4, 4]];
const SCEN = [
  {name: '끼어든 점 없음', p: null},
  {name: '경계 근처에 − 하나', p: [2.5, 2.5]},
  {name: '+ 묶음 속에 − 하나', p: [3.5, 3.5]},
];
const snap = (v) => Math.round(v * 4) / 4;
const cl = (p) => [snap(Math.max(XR[0] + 0.25, Math.min(XR[1] - 0.25, p[0]))), snap(Math.max(YR[0] + 0.25, Math.min(YR[1] - 0.25, p[1])))];
const CW = 320;
const CH = 190;
const zx = (z) => 20 + ((z + 3) / 6) * (CW - 40);
const hy = (h) => CH - 34 - (h / 4) * (CH - 56);

export default function SvmHinge() {
  const ref = useRef(null);
  const [pts, setPts] = useState(BASE.concat([[2.5, 2.5]]));
  const [scen, setScen] = useState(1);
  const [e, setE] = useState(0);
  const {start, svgProps} = useDrag(ref, W, H, (id, q) => {
    const v = cl([ix(q[0]), iy(q[1])]);
    setPts(pts.map((p, i) => (i === id ? v : p)));
  });
  const C = Math.pow(10, e);
  const shown = scen === 0 ? 8 : 9;
  const P = pts.slice(0, shown).map((p, i) => ({x: p[0], y: p[1], t: i < 4 || i === 8 ? -1 : 1}));
  const sol = softSvm(P, C);
  const wn = Math.hypot(sol.w[0], sol.w[1]);
  const f = (p) => sol.w[0] * p.x + sol.w[1] * p.y + sol.b;
  const yf = P.map((p) => p.t * f(p));
  const hinge = yf.map((v) => Math.max(0, 1 - v));
  const reg = 0.5 * wn * wn;
  const hs = hinge.reduce((a, v) => a + v, 0);
  const inside = yf.filter((v) => v > 1e-6 && v < 1 - 1e-6).length;
  const wrong = yf.filter((v) => v <= 1e-6).length;
  const flat = wn < 1e-6;
  const strip = flat ? [] : clipHalfPlane(clipHalfPlane(RECT, sol.w[0], sol.w[1], sol.b + 1), -sol.w[0], -sol.w[1], 1 - sol.b);
  const ln = (c) => clipLine(sol.w[0], sol.w[1], sol.b - c, XR[0], XR[1], YR[0], YR[1]);
  const choose = (k) => {
    setScen(k);
    if (SCEN[k].p) setPts(pts.map((p, i) => (i === 8 ? SCEN[k].p : p)));
  };

  return (
    <Viz
      title="겹치는 데이터: C가 여백과 힌지 오차의 비중을 정합니다"
      caption="C를 올리고 내려 보세요. C가 크면 틀리는 점이 없도록 여백을 줄이고, 작으면 몇 점이 여백 안이나 반대편으로 들어와도 여백을 넓게 둡니다. 점을 끌어도 됩니다. 점 배치는 설명용이고, 해는 최적화 문제를 풀어 구한 값입니다."
    >
      <Controls>
        {SCEN.map((c, k) => <Btn key={c.name} on={scen === k} onClick={() => choose(k)}>{c.name}</Btn>)}
      </Controls>
      <Controls>
        <Slider label="C (오차의 비중, 로그 눈금)" min={-2} max={2} step={0.1} value={e} onChange={setE} format={() => fmt(C, C < 1 ? 3 : 2)} />
        <Btn onClick={() => setE(-2)}>C = 0.01</Btn>
        <Btn onClick={() => setE(0)}>C = 1</Btn>
        <Btn onClick={() => setE(2)}>C = 100</Btn>
      </Controls>
      <div className={s.two}>
        <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="겹치는 두 클래스의 점과 소프트 마진 직선" {...svgProps}>
          {strip.length > 2 ? <polygon points={strip.map((p) => `${X(p[0])},${Y(p[1])}`).join(' ')} fill="var(--vok)" fillOpacity="0.14" /> : null}
          <line x1={X(XR[0])} y1={Y(0)} x2={X(XR[1])} y2={Y(0)} stroke="var(--vgrid)" />
          <line x1={X(0)} y1={Y(YR[0])} x2={X(0)} y2={Y(YR[1])} stroke="var(--vgrid)" />
          {!flat ? [[0, 'var(--ifm-font-color-base)', 2.5, undefined], [1, 'var(--vb)', 1.3, '4 3'], [-1, 'var(--va)', 1.3, '4 3']].map((l) => {
            const q = ln(l[0]);
            return q ? <line key={l[0]} x1={X(q[0][0])} y1={Y(q[0][1])} x2={X(q[1][0])} y2={Y(q[1][1])} stroke={l[1]} strokeWidth={l[2]} strokeDasharray={l[3]} /> : null;
          }) : null}
          {P.map((p, i) => (
            <g key={i}>
              {sol.alpha[i] > 1e-9 ? <circle cx={X(p.x)} cy={Y(p.y)} r={17} fill="none" stroke={yf[i] < 1 - 1e-6 ? 'var(--vbad)' : 'var(--ifm-color-emphasis-700)'} strokeWidth="2.2" /> : null}
              <circle cx={X(p.x)} cy={Y(p.y)} r={11} fill={p.t < 0 ? 'var(--va)' : 'var(--vb)'} />
              <text x={X(p.x)} y={Y(p.y) + 5} textAnchor="middle" style={{fill: '#fff', fontSize: 14, fontWeight: 700, pointerEvents: 'none'}}>{p.t < 0 ? '−' : '+'}</text>
              <circle cx={X(p.x)} cy={Y(p.y)} r={16} fill="transparent" cursor="grab" onPointerDown={start(i)} />
            </g>
          ))}
          <text x={W - 8} y={H - 8} textAnchor="end" className={s.ts}>고리: 서포트 벡터 (빨강은 여백 안이거나 틀린 점)</text>
        </svg>
        <svg viewBox={`0 0 ${CW} ${CH}`} className={s.svg} role="img" aria-label="힌지 오차 곡선과 각 점의 y·f 위치">
          <line x1={20} y1={hy(0)} x2={CW - 20} y2={hy(0)} stroke="var(--ifm-color-emphasis-400)" />
          <line x1={zx(0)} y1={hy(4)} x2={zx(0)} y2={hy(0)} stroke="var(--vgrid)" />
          <polyline points={`${zx(-3)},${hy(4)} ${zx(1)},${hy(0)} ${zx(3)},${hy(0)}`} fill="none" stroke="var(--vb)" strokeWidth="2.5" />
          {P.map((p, i) => {
            const z = Math.max(-3, Math.min(3, yf[i]));
            return <circle key={i} cx={zx(z)} cy={hy(hinge[i])} r={4.5} fill={p.t < 0 ? 'var(--va)' : 'var(--vb)'} stroke="var(--ifm-background-color)" />;
          })}
          {[-2, 0, 1, 2].map((z) => <text key={z} x={zx(z)} y={hy(0) + 14} textAnchor="middle" className={s.ts}>{z}</text>)}
          <text x={CW / 2} y={CH - 6} textAnchor="middle" className={s.ts}>가로축 y·f(x) (양수면 맞힘), 세로축 힌지 오차 max(0, 1 − y·f(x))</text>
          <text x={zx(1) + 6} y={hy(0) - 8} className={s.ts}>1 이상이면 0</text>
        </svg>
      </div>
      <Stats>
        <Stat label="여백 폭 2/‖w‖ (‖w‖는 w의 길이)" value={flat ? '무한대' : fmt(2 / wn, 3)} />
        <Stat label="여백 안으로 들어온 점" value={inside} />
        <Stat label="반대편(y·f ≤ 0) 점" value={wrong} tone={wrong ? 'bad' : 'good'} />
        <Stat label="½‖w‖² (작을수록 여백이 넓음)" value={fmt(reg, 3)} />
        <Stat label="C × 힌지 오차의 합" value={fmt(C * hs, 3)} />
        <Stat label="목적 함수 (최소로 만들 값, 위 두 값의 합)" value={fmt(reg + C * hs, 3)} />
      </Stats>
      {flat ? <Note>w가 0에 가까워 여백이 한없이 넓습니다.</Note> : <Note>½‖w‖²를 줄이면 여백이 넓어지고, C × 힌지 합을 줄이면 위반이 줄어듭니다. C를 바꾸면 두 항이 서로 반대로 움직이는 것을 볼 수 있습니다.</Note>}
    </Viz>
  );
}
