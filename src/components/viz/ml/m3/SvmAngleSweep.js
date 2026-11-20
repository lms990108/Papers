import React, {useMemo, useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {makeFrame, clipHalfPlane, clipLine} from './geom';
import {gapAt} from './svmCore';

const NEG = [[0, 0], [1, 0], [0, 1], [1, 1]];
const POS = [[3, 3], [4, 3], [3, 4], [4, 4]];
const W = 360;
const H = 360;
const XR = [-1, 5];
const YR = [-1, 5];
const {X, Y} = makeFrame(W, H, XR, YR, {l: 10, r: 10, t: 10, b: 10});
const RECT = [[XR[0], YR[0]], [XR[1], YR[0]], [XR[1], YR[1]], [XR[0], YR[1]]];
const dot = (w, p) => w[0] * p[0] + w[1] * p[1];

export default function SvmAngleSweep() {
  const [deg, setDeg] = useState(20);
  const [two, setTwo] = useState(false);
  const neg = two ? [[1, 1]] : NEG;
  const pos = two ? [[3, 3]] : POS;
  const gaps = useMemo(() => Array.from({length: 360}, (_, d) => gapAt(neg, pos, d).gap), [two]);
  let bd = 0;
  gaps.forEach((g, d) => { if (g > gaps[bd] + 1e-12) bd = d; });
  const dg = Math.max(0, Math.min(359, Math.round(deg)));
  const r = gapAt(neg, pos, dg);
  const mid = (r.mp + r.mn) / 2;
  const ok = r.gap > 0;
  const strip = ok ? clipHalfPlane(clipHalfPlane(RECT, r.w[0], r.w[1], -r.mn), -r.w[0], -r.w[1], r.mp) : [];
  const ln = (v) => clipLine(r.w[0], r.w[1], -v, XR[0], XR[1], YR[0], YR[1]);
  const lines = [[mid, 'var(--ifm-font-color-base)', 2.5, undefined], [r.mp, 'var(--vb)', 1.3, '4 3'], [r.mn, 'var(--va)', 1.3, '4 3']];

  const CW = 340;
  const CH = 280;
  const lo = Math.min.apply(null, gaps);
  const hi = 3.3;
  const cx = (d) => 36 + (d / 359) * (CW - 50);
  const cy = (g) => 14 + (1 - (g - lo) / (hi - lo)) * (CH - 50);

  return (
    <Viz
      title="방향을 돌려 가며 두 묶음 사이의 빈 폭을 재 봅니다"
      caption="각도 슬라이더로 w의 방향을 돌려 보세요. 두 묶음을 w 방향으로 눌러 편 뒤, 양쪽 가장 가까운 점 사이의 빈 폭이 여백입니다. 오른쪽 곡선은 모든 방향의 폭이고, 45도에서 2.8284로 가장 큽니다. 서포트 벡터 둘만 남겨도 같은 곡선 꼭대기가 나옵니다."
    >
      <Controls>
        <Slider label="w의 방향 θ (가로축에서 잰 각도)" min={0} max={359} step={1} value={deg} onChange={setDeg} format={(v) => `${v}°`} />
        <Btn on={deg === bd} onClick={() => setDeg(bd)}>최적 방향으로</Btn>
        <Btn on={two} onClick={() => setTwo(!two)}>서포트 벡터 (1,1), (3,3)만 쓰기</Btn>
      </Controls>
      <div className={s.two}>
        <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="두 묶음의 점과 현재 방향의 여백 띠">
          {strip.length > 2 ? <polygon points={strip.map((p) => `${X(p[0])},${Y(p[1])}`).join(' ')} fill="var(--vok)" fillOpacity="0.14" /> : null}
          <line x1={X(-1)} y1={Y(0)} x2={X(5)} y2={Y(0)} stroke="var(--vgrid)" />
          <line x1={X(0)} y1={Y(-1)} x2={X(0)} y2={Y(5)} stroke="var(--vgrid)" />
          {lines.map((l, i) => {
            const q = ln(l[0]);
            if (!q || (i > 0 && !ok)) return null;
            return <line key={i} x1={X(q[0][0])} y1={Y(q[0][1])} x2={X(q[1][0])} y2={Y(q[1][1])} stroke={l[1]} strokeWidth={l[2]} strokeDasharray={l[3]} />;
          })}
          {neg.map((p, i) => (
            <g key={'n' + i}>
              {Math.abs(dot(r.w, p) - r.mn) < 1e-9 ? <circle cx={X(p[0])} cy={Y(p[1])} r={15} fill="none" stroke="var(--vbad)" strokeWidth="2" /> : null}
              <circle cx={X(p[0])} cy={Y(p[1])} r={9} fill="var(--va)" />
              <text x={X(p[0])} y={Y(p[1]) + 4} textAnchor="middle" style={{fill: '#fff', fontSize: 13, fontWeight: 700}}>−</text>
            </g>
          ))}
          {pos.map((p, i) => (
            <g key={'p' + i}>
              {Math.abs(dot(r.w, p) - r.mp) < 1e-9 ? <circle cx={X(p[0])} cy={Y(p[1])} r={15} fill="none" stroke="var(--vbad)" strokeWidth="2" /> : null}
              <circle cx={X(p[0])} cy={Y(p[1])} r={9} fill="var(--vb)" />
              <text x={X(p[0])} y={Y(p[1]) + 4} textAnchor="middle" style={{fill: '#fff', fontSize: 13, fontWeight: 700}}>+</text>
            </g>
          ))}
          <text x={W - 8} y={H - 8} textAnchor="end" className={s.ts}>빨간 고리: 이 방향에서 가장 가까운 점</text>
        </svg>
        <svg viewBox={`0 0 ${CW} ${CH}`} className={s.svg} role="img" aria-label="방향에 따른 여백 폭 곡선">
          <line x1={36} y1={cy(0)} x2={CW - 14} y2={cy(0)} stroke="var(--ifm-color-emphasis-400)" />
          <polyline points={gaps.map((g, d) => `${cx(d)},${cy(g)}`).join(' ')} fill="none" stroke="var(--vb)" strokeWidth="2" />
          <line x1={cx(dg)} y1={14} x2={cx(dg)} y2={CH - 36} stroke="var(--ifm-color-emphasis-500)" strokeDasharray="4 3" />
          <circle cx={cx(dg)} cy={cy(gaps[dg])} r={6} fill="var(--vb)" />
          <circle cx={cx(bd)} cy={cy(gaps[bd])} r={9} fill="none" stroke="var(--vok)" strokeWidth="2" />
          {[0, 90, 180, 270, 359].map((d) => (
            <text key={d} x={cx(d)} y={CH - 20} textAnchor="middle" className={s.ts}>{d}°</text>
          ))}
          <text x={36} y={CH - 4} className={s.ts}>세로축: 여백 폭 (0 아래는 두 묶음이 겹침)</text>
        </svg>
      </div>
      <Stats>
        <Stat label="이 방향의 여백 폭" value={fmt(r.gap, 4)} tone={ok ? 'good' : 'bad'} />
        <Stat label="가장 넓은 방향" value={`${bd}°`} />
        <Stat label="그때의 폭 (= 2/‖w‖, ‖w‖는 w의 길이)" value={fmt(gaps[bd], 4)} />
      </Stats>
      {!ok ? <Note>이 방향으로 눌러 펴면 두 묶음이 겹쳐 가를 수 없습니다. 폭이 음수라는 뜻입니다.</Note> : null}
    </Viz>
  );
}
