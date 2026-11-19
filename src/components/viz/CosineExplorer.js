import React, {useRef, useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, useDrag, fmt, styles as s} from './Viz';

const W = 480;
const H = 330;
const OX = 240;
const OY = 165;
const SC = 100;

const toPx = (v) => [OX + v[0] * SC, OY - v[1] * SC];
const fromPx = (p) => [(p[0] - OX) / SC, (OY - p[1]) / SC];
const len = (v) => Math.hypot(v[0], v[1]);
const limit = (v, m = 1.5) => {
  const l = len(v);
  return l > m ? [(v[0] * m) / l, (v[1] * m) / l] : v;
};
const scale = (v, k) => [v[0] * k, v[1] * k];

function Arrow({v, color, dashed, width = 2.5}) {
  const l = len(v);
  if (l < 0.03) return <circle cx={OX} cy={OY} r={4} fill={color} />;
  const [x, y] = toPx(v);
  const ux = v[0] / l;
  const uy = -v[1] / l;
  const bx = x - ux * 13;
  const by = y - uy * 13;
  const nx = -uy * 5;
  const ny = ux * 5;
  return (
    <g>
      <line
        x1={OX}
        y1={OY}
        x2={bx}
        y2={by}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? '5 4' : undefined}
      />
      <polygon points={`${x},${y} ${bx + nx},${by + ny} ${bx - nx},${by - ny}`} fill={color} />
    </g>
  );
}

export default function CosineExplorer() {
  const ref = useRef(null);
  const [a, setA] = useState([1.2, 0.3]);
  const [b, setB] = useState([0.55, 0.95]);
  const [unit, setUnit] = useState(false);

  const {start, svgProps} = useDrag(ref, W, H, (id, p) => {
    const v = limit(fromPx(p));
    if (id === 'a') setA(v);
    else setB(v);
  });

  const la = len(a);
  const lb = len(b);
  const ok = la > 0.03 && lb > 0.03;
  const dot = a[0] * b[0] + a[1] * b[1];
  const cos = ok ? Math.max(-1, Math.min(1, dot / (la * lb))) : NaN;
  const ang = ok ? (Math.acos(cos) * 180) / Math.PI : NaN;
  const dist = Math.hypot(a[0] - b[0], a[1] - b[1]);

  let arc = null;
  let arcLabel = null;
  if (ok) {
    const ta = Math.atan2(a[1], a[0]);
    const tb = Math.atan2(b[1], b[0]);
    const d = ((((tb - ta + 3 * Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
    const R = 36;
    const pa = [OX + R * Math.cos(ta), OY - R * Math.sin(ta)];
    const pb = [OX + R * Math.cos(tb), OY - R * Math.sin(tb)];
    arc = `M ${pa[0]} ${pa[1]} A ${R} ${R} 0 0 ${d > 0 ? 0 : 1} ${pb[0]} ${pb[1]}`;
    const tm = ta + d / 2;
    arcLabel = [OX + 58 * Math.cos(tm), OY - 58 * Math.sin(tm)];
  }

  const ua = la > 0.03 ? scale(a, 1 / la) : [1, 0];
  const ub = lb > 0.03 ? scale(b, 1 / lb) : [0, 1];
  const ta = toPx(a);
  const tb = toPx(b);

  return (
    <Viz
      title="두 화살표의 방향 비교"
      caption="화살표 끝의 동그라미를 끌어서 움직여 보세요. 길이를 늘려도 코사인은 그대로이고, 내적과 거리는 바뀝니다."
    >
      <Controls>
        <Btn onClick={() => setB(scale(ua, 1))}>같은 방향</Btn>
        <Btn onClick={() => setB([-ua[1], ua[0]])}>직각</Btn>
        <Btn onClick={() => setB(scale(ua, -0.9))}>반대 방향</Btn>
        <Btn onClick={() => setB(limit(scale(b, 1.5)))}>b를 1.5배 길게</Btn>
        <Btn on={unit} onClick={() => setUnit(!unit)}>길이 1로 줄여 보기</Btn>
      </Controls>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="두 벡터와 사이각" {...svgProps}>
        <line x1={20} y1={OY} x2={W - 20} y2={OY} stroke="var(--vgrid)" />
        <line x1={OX} y1={14} x2={OX} y2={H - 14} stroke="var(--vgrid)" />
        <circle cx={OX} cy={OY} r={SC} fill="none" stroke="var(--vgrid)" strokeDasharray="4 4" />
        {unit ? (
          <g>
            <Arrow v={ua} color="var(--va)" dashed width={1.5} />
            <Arrow v={ub} color="var(--vb)" dashed width={1.5} />
          </g>
        ) : null}
        {arc ? <path d={arc} fill="none" stroke="var(--ifm-color-emphasis-600)" strokeWidth="1.5" /> : null}
        <Arrow v={a} color="var(--va)" />
        <Arrow v={b} color="var(--vb)" />
        {arcLabel ? (
          <text x={arcLabel[0]} y={arcLabel[1]} className={s.ts} textAnchor="middle" dominantBaseline="central">
            {fmt(ang, 0)}°
          </text>
        ) : null}
        <circle cx={ta[0]} cy={ta[1]} r={13} fill="var(--va)" fillOpacity="0.15" stroke="var(--va)" cursor="grab" onPointerDown={start('a')} />
        <circle cx={tb[0]} cy={tb[1]} r={13} fill="var(--vb)" fillOpacity="0.15" stroke="var(--vb)" cursor="grab" onPointerDown={start('b')} />
        <text x={ta[0] + 16} y={ta[1] - 8} className={s.t} fill="var(--va)" style={{fill: 'var(--va)'}}>a</text>
        <text x={tb[0] + 16} y={tb[1] - 8} className={s.t} style={{fill: 'var(--vb)'}}>b</text>
        <text x={W - 12} y={H - 10} className={s.ts} textAnchor="end">점선 원의 반지름 = 길이 1</text>
      </svg>
      <Stats>
        <Stat label="a의 길이" value={fmt(la)} />
        <Stat label="b의 길이" value={fmt(lb)} />
        <Stat label="사이각" value={ok ? `${fmt(ang, 1)}°` : '—'} />
        <Stat label="코사인" value={ok ? fmt(cos) : '정의 안 됨'} tone={ok ? undefined : 'bad'} />
        <Stat label="내적 a·b" value={fmt(dot)} />
        <Stat label="거리 |a−b|" value={fmt(dist)} />
      </Stats>
      {unit && ok ? (
        <p className={s.note}>
          길이 1로 줄인 두 화살표의 내적은 {fmt(ua[0] * ub[0] + ua[1] * ub[1], 3)}이고, 코사인과 같은 값입니다.
        </p>
      ) : null}
      {!ok ? (
        <p className={s.note}>길이가 0인 목록은 방향이 없어서 코사인을 계산할 수 없습니다.</p>
      ) : null}
    </Viz>
  );
}
