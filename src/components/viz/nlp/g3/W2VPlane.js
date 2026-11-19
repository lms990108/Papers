import React, {useRef, useState} from 'react';
import {Viz, Controls, Btn, Note, useDrag, fmt, styles as s} from '../../Viz';

const W = 440;
const H = 320;
const OX = 150;
const OY = 160;
const SC = 120;
const toPx = (v) => [OX + v[0] * SC, OY - v[1] * SC];
const fromPx = (p) => [(p[0] - OX) / SC, (OY - p[1]) / SC];
const len = (v) => Math.hypot(v[0], v[1]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const limit = (v, m = 1.3) => {
  const l = len(v);
  return l > m ? [(v[0] * m) / l, (v[1] * m) / l] : v;
};

const BASE = [1, 0];
const INIT = {좋다: [0.8, 0.6], 오늘: [0.6, 0.8], 자동차: [0, 1]};
const COLORS = {좋다: 'var(--va)', 오늘: 'var(--vc)', 자동차: 'var(--vok)'};

export default function W2VPlane({cbow = false}) {
  const ref = useRef(null);
  const [p, setP] = useState(INIT);
  const [cos, setCos] = useState(false);
  const [avg, setAvg] = useState(cbow);

  const {start, svgProps} = useDrag(ref, W, H, (id, pt) => setP((q) => ({...q, [id]: limit(fromPx(pt))})));

  const score = (v) => {
    if (!cos) return dot(v, BASE);
    const l = len(v);
    return l > 0.01 ? dot(v, BASE) / l : NaN;
  };
  const mean = [(p.오늘[0] + p.좋다[0]) / 2, (p.오늘[1] + p.좋다[1]) / 2];
  const names = Object.keys(INIT);
  const [bx, by] = toPx(BASE);

  return (
    <Viz
      title="날씨와의 곱을 평면에서 읽기"
      caption="날씨는 [1, 0]에 고정이고, 나머지 세 단어의 점을 끌어서 옮겨 보세요. 날씨와의 곱은 점의 첫 칸(가로 값)과 같습니다. 설명용 값입니다."
    >
      <Controls>
        <Btn onClick={() => setP(INIT)}>표의 값으로</Btn>
        <Btn onClick={() => setP({...p, 좋다: [0.9, 0.6]})}>좋다를 [0.9, 0.6]으로</Btn>
        <Btn on={avg} onClick={() => setAvg(!avg)}>CBOW 평균 보기</Btn>
        <Btn on={cos} onClick={() => setCos(!cos)}>곱 대신 코사인</Btn>
      </Controls>
      <div className={s.two}>
        <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="날씨와 좋다, 오늘, 자동차 목록의 위치" {...svgProps}>
          <line x1={10} y1={OY} x2={W - 10} y2={OY} stroke="var(--vgrid)" />
          <line x1={OX} y1={10} x2={OX} y2={H - 10} stroke="var(--vgrid)" />
          <line x1={OX} y1={OY} x2={bx} y2={by} stroke="var(--vb)" strokeWidth="3" />
          <circle cx={bx} cy={by} r="7" fill="var(--vb)" />
          <text x={bx + 2} y={by + 22} className={s.t} style={{fill: 'var(--vb)'}}>날씨</text>
          {avg ? (
            <g>
              <line x1={toPx(p.오늘)[0]} y1={toPx(p.오늘)[1]} x2={toPx(p.좋다)[0]} y2={toPx(p.좋다)[1]} stroke="var(--ifm-color-emphasis-500)" strokeDasharray="4 3" />
              <rect x={toPx(mean)[0] - 6} y={toPx(mean)[1] - 6} width="12" height="12" fill="var(--ifm-font-color-base)" />
              <text x={toPx(mean)[0] + 10} y={toPx(mean)[1] + 16} className={s.ts}>평균</text>
            </g>
          ) : null}
          {names.map((nm) => {
            const [x, y] = toPx(p[nm]);
            return (
              <g key={nm}>
                <line x1={OX} y1={OY} x2={x} y2={y} stroke={COLORS[nm]} strokeWidth="1.5" opacity="0.6" />
                <line x1={x} y1={y} x2={x} y2={OY} stroke={COLORS[nm]} strokeDasharray="3 3" opacity="0.7" />
                <circle cx={x} cy={y} r="13" fill={COLORS[nm]} fillOpacity="0.2" stroke={COLORS[nm]} strokeWidth="2" cursor="grab" onPointerDown={start(nm)} />
                <text x={x + 16} y={y - 8} className={s.t} style={{fill: COLORS[nm]}}>{nm}</text>
              </g>
            );
          })}
          <text x={W - 10} y={H - 8} className={s.ts} textAnchor="end">점선 = 날씨와의 곱이 되는 가로 값</text>
        </svg>
        <div>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>단어</th>
                <th>목록</th>
                <th>{cos ? '날씨와의 코사인' : '날씨와의 곱'}</th>
              </tr>
            </thead>
            <tbody>
              {names.map((nm) => (
                <tr key={nm}>
                  <td style={{color: COLORS[nm]}}>{nm}</td>
                  <td>{fmt(p[nm][0], 2)}, {fmt(p[nm][1], 2)}</td>
                  <td className={s.cellOn}>{Number.isNaN(score(p[nm])) ? '—' : fmt(score(p[nm]), 2)}</td>
                </tr>
              ))}
              {avg ? (
                <tr>
                  <td>평균(오늘, 좋다)</td>
                  <td>{fmt(mean[0], 2)}, {fmt(mean[1], 2)}</td>
                  <td className={s.cellOn}>{fmt(score(mean), 2)}</td>
                </tr>
              ) : null}
              <tr>
                <td>좋다 · 자동차</td>
                <td colSpan={2}>{fmt(dot(p.좋다, p.자동차), 2)}</td>
              </tr>
            </tbody>
          </table>
          <Note>
            날씨의 둘째 칸이 0이라서 점을 위아래로 움직여도 날씨와의 곱은 그대로입니다. 좋다·자동차는 자동차의 첫 칸이 0일 때 좋다의 가로 값을 바꿔도 변하지 않습니다.
          </Note>
        </div>
      </div>
    </Viz>
  );
}
