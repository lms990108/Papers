import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {lin, clamp, tr, gdPath, E1, g1} from './lib';

const W = 560;
const H = 270;
const X0 = -5;
const X1 = 11;
const YMAX = 64;
const px = lin(X0, X1, 40, W - 16);
const py = lin(0, YMAX, H - 34, 14);
const PRESETS = [0.01, 0.1, 0.5, 1, 1.1];
const MAXT = 12;

const CURVE = (() => {
  const pts = [];
  for (let i = 0; i <= 80; i++) {
    const w = X0 + ((X1 - X0) * i) / 80;
    pts.push(`${px(w)},${py(E1(w))}`);
  }
  return pts.join(' ');
})();

export default function DescentSteps() {
  const [eps, setEps] = useState(0.1);
  const [w0, setW0] = useState(0);
  const [t, setT] = useState(3);

  const path = gdPath(w0, eps, t);
  const f = 1 - 2 * eps;
  const af = Math.abs(f);
  let verdict = '3에 모입니다';
  let tone;
  if (Math.abs(f) < 1e-9) verdict = '한 번에 3에 도착합니다';
  else if (Math.abs(af - 1) < 1e-9) {
    verdict = '왕복하며 오차가 그대로입니다';
    tone = 'bad';
  } else if (af > 1) {
    verdict = '왕복하며 매번 멀어집니다';
    tone = 'bad';
  } else if (f < 0) verdict = '3을 지나쳐 왕복하며 모입니다';
  const pts = path.map((w) => {
    const out = w < X0 || w > X1;
    const cw = clamp(w, X0, X1);
    return {w, out, x: px(cw), y: out ? py(0) : py(E1(w))};
  });
  const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const rows = path.map((w, i) => ({i, w}));
  const anyOut = pts.some((p) => p.out);

  return (
    <Viz
      title="오차 곡선 위를 한 걸음씩 내려가기"
      caption="오차는 (w − 3)의 제곱입니다. 학습률 ε과 시작 위치를 바꾸고 걸음을 늘려 보세요. 가운데 곱 1 − 2ε가 1보다 작을 때만 3에 모입니다."
    >
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p} on={Math.abs(eps - p) < 1e-9} onClick={() => setEps(p)}>
            ε = {p}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="학습률 ε" min={0.01} max={1.2} step={0.01} value={eps} onChange={setEps} format={(v) => fmt(v, 2)} />
        <Slider label="시작 w" min={-3} max={8} step={0.5} value={w0} onChange={setW0} format={(v) => fmt(v, 1)} />
      </Controls>
      <Controls>
        <Btn onClick={() => setT(Math.min(MAXT, t + 1))}>한 걸음</Btn>
        <Btn onClick={() => setT(Math.min(MAXT, t + 5))}>다섯 걸음</Btn>
        <Btn onClick={() => setT(0)}>처음으로</Btn>
        <span className={s.ts}>걸음 수 {t} / {MAXT}</span>
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="오차 곡선 위에서 점이 학습률에 따라 이동하는 모습">
        <line x1={40} y1={py(0)} x2={W - 16} y2={py(0)} stroke="var(--ifm-color-emphasis-400)" />
        <line x1={px(3)} y1={14} x2={px(3)} y2={py(0)} stroke="var(--ifm-color-emphasis-300)" strokeDasharray="4 3" />
        <polyline points={CURVE} fill="none" stroke="var(--ifm-font-color-base)" strokeWidth="2" />
        {[-4, -2, 0, 2, 4, 6, 8, 10].map((v) => (
          <text key={v} x={px(v)} y={H - 16} textAnchor="middle" className={s.ts}>
            {v}
          </text>
        ))}
        <text x={W - 16} y={H - 2} textAnchor="end" className={s.ts}>파라미터 w</text>
        <text x={8} y={12} className={s.ts}>오차</text>
        <text x={px(3)} y={H - 2} textAnchor="middle" className={s.ts} style={{fill: 'var(--vok)'}}>목표 3</text>
        <polyline points={line} fill="none" stroke="var(--vb)" strokeWidth="1.5" strokeDasharray="4 3" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={i === t ? 6 : 4} fill={i === t ? 'var(--vb)' : 'var(--ifm-background-surface-color)'} stroke="var(--vb)" strokeWidth="1.5" />
            {i <= 8 && !p.out ? (
              <text x={p.x + 7} y={p.y - 7} className={s.ts}>
                {i}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      <Stats>
        <Stat label="곱 1 − 2ε" value={fmt(f, 2)} tone={af < 1 - 1e-9 ? 'good' : 'bad'} />
        <Stat label="현재 w" value={tr(path[t], 4)} />
        <Stat label="현재 기울기" value={tr(g1(path[t]), 4)} />
        <Stat label="현재 오차" value={tr(E1(path[t]), 4)} />
      </Stats>
      <Note>
        {verdict}. {anyOut ? '곡선 밖으로 나간 점은 가로축 끝에 빈 점으로 붙여 그렸습니다. 값은 아래 표를 보세요.' : ''}
      </Note>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>걸음 t</th>
            <th>w</th>
            <th>기울기 2(w − 3)</th>
            <th>오차</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.i} className={r.i === t ? s.cellOn : undefined}>
              <td>{r.i}</td>
              <td>{fmt(r.w, 3)}</td>
              <td>{fmt(g1(r.w), 3)}</td>
              <td>{fmt(E1(r.w), 3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Viz>
  );
}
