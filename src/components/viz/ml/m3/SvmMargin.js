import React, {useRef, useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, useDrag, fmt, styles as s} from '../../Viz';
import {makeFrame, clipHalfPlane, clipLine} from './geom';
import {maxMargin} from './svmCore';

const W = 420;
const H = 380;
const XR = [-1, 6];
const YR = [-0.8, 5.5];
const M = {l: 10, r: 10, t: 10, b: 10};
const {X, Y, ix, iy} = makeFrame(W, H, XR, YR, M);
const RECT = [[XR[0], YR[0]], [XR[1], YR[0]], [XR[1], YR[1]], [XR[0], YR[1]]];
const START = [[0, 0], [1, 0], [0, 1], [1, 1], [3, 3], [4, 3], [3, 4], [4, 4]];
const T0 = [2, 3.5];
const snap = (v) => Math.round(v * 4) / 4;
const cl = (p) => [snap(Math.max(XR[0] + 0.25, Math.min(XR[1] - 0.25, p[0]))), snap(Math.max(YR[0] + 0.25, Math.min(YR[1] - 0.25, p[1])))];
const lab = (i) => (i < 4 ? -1 : 1);

function solve(pts, keep) {
  const idx = pts.map((_, i) => i).filter((i) => keep(i));
  const sol = maxMargin(idx.filter((i) => i < 4).map((i) => pts[i]), idx.filter((i) => i >= 4).map((i) => pts[i]));
  return sol;
}

export default function SvmMargin() {
  const ref = useRef(null);
  const [pts, setPts] = useState(START);
  const [tp, setTp] = useState(T0);
  const [only, setOnly] = useState(false);
  const [showW, setShowW] = useState(true);
  const {start, svgProps} = useDrag(ref, W, H, (id, q) => {
    const v = cl([ix(q[0]), iy(q[1])]);
    if (id === 't') setTp(v);
    else setPts(pts.map((p, i) => (i === id ? v : p)));
  });

  const full = solve(pts, () => true);
  const f0 = (sol, p) => sol.w[0] * p[0] + sol.w[1] * p[1] + sol.b;
  const isSv = (sol, i) => !!sol && Math.abs(lab(i) * f0(sol, pts[i]) - 1) < 1e-3;
  const svSet = full ? pts.map((_, i) => isSv(full, i)) : pts.map(() => false);
  const sol = only && full ? solve(pts, (i) => svSet[i]) : full;
  const wn = sol ? Math.hypot(sol.w[0], sol.w[1]) : 0;
  const ft = sol ? f0(sol, tp) : 0;
  const same = only && full && sol && Math.abs(sol.w[0] - full.w[0]) < 1e-3 && Math.abs(sol.w[1] - full.w[1]) < 1e-3 && Math.abs(sol.b - full.b) < 1e-3;
  const strip = sol ? clipHalfPlane(clipHalfPlane(RECT, sol.w[0], sol.w[1], sol.b + 1), -sol.w[0], -sol.w[1], 1 - sol.b) : [];
  const ln = (c) => clipLine(sol.w[0], sol.w[1], sol.b - c, XR[0], XR[1], YR[0], YR[1]);
  let arrow = null;
  if (sol && wn > 1e-9) {
    const c0 = [2.5, 2.4];
    const k = f0(sol, c0) / (wn * wn);
    const tail = [c0[0] - k * sol.w[0], c0[1] - k * sol.w[1]];
    const head = [tail[0] + (0.9 * sol.w[0]) / wn, tail[1] + (0.9 * sol.w[1]) / wn];
    const [tx, ty, hx, hy] = [X(tail[0]), Y(tail[1]), X(head[0]), Y(head[1])];
    const len = Math.hypot(hx - tx, hy - ty) || 1;
    const [ux, uy] = [(hx - tx) / len, (hy - ty) / len];
    arrow = {tx, ty, hx, hy, wing: [[hx - 11 * ux - 5 * uy, hy - 11 * uy + 5 * ux], [hx - 11 * ux + 5 * uy, hy - 11 * uy - 5 * ux]], lx: hx + 10 * ux, ly: hy + 10 * uy + 4};
  }

  return (
    <Viz
      title="여백이 가장 큰 직선: 점을 끌어 보세요"
      caption="점 여덟 개와 시험 점(초록 네모)을 끌어 보세요. 두 묶음을 가르는 직선 가운데 양쪽 가장 가까운 점까지의 거리가 같고 가장 큰 직선을 매번 새로 구합니다. 고리 친 점이 서포트 벡터이고, 서포트 벡터가 아닌 점을 옮겨도 여백 안으로 들어오지 않는 한 직선은 그대로입니다."
    >
      <Controls>
        <Btn on={only} onClick={() => setOnly(!only)}>서포트 벡터만 남기기</Btn>
        <Btn onClick={() => { setPts(START); setTp(T0); setOnly(false); }}>본문의 점으로</Btn>
        <Btn onClick={() => setPts(pts.map((p, i) => (i === 3 ? [2, 2] : p)))}>(1,1)을 (2,2)로 옮기기</Btn>
        <Btn on={showW} onClick={() => setShowW(!showW)}>w 방향 화살표</Btn>
      </Controls>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={s.canvas} style={{maxWidth: 480}} role="img" aria-label="두 클래스의 점, 최대 여백 직선, 서포트 벡터" {...svgProps}>
        {strip.length > 2 ? <polygon points={strip.map((p) => `${X(p[0])},${Y(p[1])}`).join(' ')} fill="var(--vok)" fillOpacity="0.14" /> : null}
        <line x1={X(XR[0])} y1={Y(0)} x2={X(XR[1])} y2={Y(0)} stroke="var(--vgrid)" />
        <line x1={X(0)} y1={Y(YR[0])} x2={X(0)} y2={Y(YR[1])} stroke="var(--vgrid)" />
        {sol ? [[0, 'var(--ifm-font-color-base)', 2.5, undefined], [1, 'var(--vb)', 1.3, '4 3'], [-1, 'var(--va)', 1.3, '4 3']].map((l) => {
          const q = ln(l[0]);
          return q ? <line key={l[0]} x1={X(q[0][0])} y1={Y(q[0][1])} x2={X(q[1][0])} y2={Y(q[1][1])} stroke={l[1]} strokeWidth={l[2]} strokeDasharray={l[3]} /> : null;
        }) : null}
        {pts.map((p, i) => {
          const hidden = only && full && !svSet[i];
          const c = lab(i) < 0 ? 'var(--va)' : 'var(--vb)';
          return (
            <g key={i} opacity={hidden ? 0.22 : 1}>
              {!hidden && svSet[i] ? <circle cx={X(p[0])} cy={Y(p[1])} r={17} fill="none" stroke="var(--vbad)" strokeWidth="2.2" /> : null}
              <circle cx={X(p[0])} cy={Y(p[1])} r={hidden ? 6 : 11} fill={c} />
              {!hidden ? <text x={X(p[0])} y={Y(p[1]) + 5} textAnchor="middle" style={{fill: '#fff', fontSize: 14, fontWeight: 700, pointerEvents: 'none'}}>{lab(i) < 0 ? '−' : '+'}</text> : null}
              {!hidden ? <circle cx={X(p[0])} cy={Y(p[1])} r={16} fill="transparent" cursor="grab" onPointerDown={start(i)} /> : null}
            </g>
          );
        })}
        {showW && arrow ? (
          <g style={{pointerEvents: 'none'}}>
            <line x1={arrow.tx} y1={arrow.ty} x2={arrow.hx} y2={arrow.hy} stroke="var(--vc)" strokeWidth="3" />
            <polygon points={`${arrow.hx},${arrow.hy} ${arrow.wing[0].join(',')} ${arrow.wing[1].join(',')}`} fill="var(--vc)" />
            <text x={arrow.lx} y={arrow.ly} className={s.t} style={{fill: 'var(--vc)', fontWeight: 700}}>w</text>
          </g>
        ) : null}
        <rect x={X(tp[0]) - 8} y={Y(tp[1]) - 8} width={16} height={16} fill="var(--vok)" fillOpacity="0.85" />
        <rect x={X(tp[0]) - 16} y={Y(tp[1]) - 16} width={32} height={32} fill="transparent" cursor="grab" onPointerDown={start('t')} />
        <text x={X(tp[0]) + 12} y={Y(tp[1]) - 12} className={s.t} style={{fill: 'var(--vok)'}}>시험 점</text>
      </svg>
      {sol ? (
        <Stats>
          <Stat label="w₁ (가로 위치에 곱하는 수)" value={fmt(sol.w[0], 3)} />
          <Stat label="w₂ (세로 위치에 곱하는 수)" value={fmt(sol.w[1], 3)} />
          <Stat label="b (직선을 미는 수)" value={fmt(sol.b, 3)} />
          <Stat label="여백 폭 (2 ÷ w의 길이)" value={fmt(2 / wn, 3)} />
          <Stat label="서포트 벡터 수" value={svSet.filter(Boolean).length} />
          <Stat label="시험 점의 점수 f → 예측" value={`${fmt(ft, 3)} → ${ft > 0 ? '+' : '−'}`} tone={Math.abs(ft) < 1 ? 'bad' : 'good'} />
          <Stat label="시험 점에서 직선까지 거리" value={fmt(Math.abs(ft) / wn, 3)} />
          {only ? <Stat label="전체 점으로 푼 면과 같은가" value={same ? '같음' : '다름'} tone={same ? 'good' : 'bad'} /> : null}
        </Stats>
      ) : (
        <Note>직선 하나로 두 묶음을 가를 수 없습니다. 여백 조건을 모두 만족하는 면이 없는 경우입니다. 점을 원래 자리로 돌리거나 아래의 힌지 오차 그림에서 일부 위반을 허용해 보세요.</Note>
      )}
      {sol ? (
        <table className={s.grid}>
          <thead>
            <tr><th>점 (x₁, x₂)</th><th>라벨 y</th><th>점수 f</th><th>y × f</th><th>역할</th></tr>
          </thead>
          <tbody>
            {pts.map((p, i) => {
              const f = f0(sol, p);
              const yf = lab(i) * f;
              const role = (only && !svSet[i]) ? '지움' : svSet[i] ? '서포트 벡터' : '여백 밖';
              return (
                <tr key={i} className={svSet[i] ? s.cellOn : undefined}>
                  <td>({fmt(p[0], 2)}, {fmt(p[1], 2)})</td><td>{lab(i) < 0 ? '−' : '+'}</td><td>{fmt(f, 2)}</td><td>{fmt(yf, 2)}</td><td>{role}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
      {sol ? <Note>y × f가 1이면 점이 점선 위(서포트 벡터), 1보다 크면 여백 밖, 0 이하이면 직선 반대편입니다. 점수 f는 w₁x₁ + w₂x₂ + b이고, 0이면 직선 위입니다.</Note> : null}
    </Viz>
  );
}
