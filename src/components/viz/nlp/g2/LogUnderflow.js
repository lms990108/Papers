import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Note, Stats, Stat, fmt, styles as s} from '../../Viz';

const PS = [0.5, 0.1, 0.01];
const X0 = 50;
const X1 = 530;
const Y0 = 14;
const Y1 = 170;
const TMAX = 800;
const sx = (t) => X0 + (t / TMAX) * (X1 - X0);
const sy = (y) => Y0 + (Math.min(0, Math.max(-1000, y)) / -1000) * (Y1 - Y0);

export default function LogUnderflow() {
  const [p, setP] = useState(0.1);
  const [t, setT] = useState(400);

  const prod = Math.pow(p, t);
  const logsum = t * Math.log(p);
  const zero = prod === 0;
  const l10 = Math.log10(p);
  const tEnd = Math.min(TMAX, 1000 / -l10);

  return (
    <Viz
      title="곱하면 0이 되고, 로그를 더하면 멀쩡합니다"
      caption="비율 p인 자리가 T개 이어진 문장입니다. 컴퓨터의 실수는 약 10^-324보다 작은 수를 0으로 만듭니다. 곡선은 로그의 합을 상용로그로 본 값이고, 점선 아래에서 곱이 0이 됩니다."
    >
      <Controls>
        {PS.map((x) => (
          <Btn key={x} on={p === x} onClick={() => setP(x)}>
            p = {x}
          </Btn>
        ))}
        <Slider label="자리 수 T" min={1} max={TMAX} value={t} onChange={setT} />
      </Controls>
      <Stats>
        <Stat label={`p ** T (곱)`} value={zero ? '0.0' : prod.toExponential(2)} tone={zero ? 'bad' : undefined} />
        <Stat label="로그의 합 (자연로그)" value={fmt(logsum, 1)} tone="good" />
        <Stat label="평균 오차 −로그의 평균" value={fmt(-Math.log(p), 3)} />
      </Stats>
      <svg viewBox="0 0 560 215" className={s.svg} role="img" aria-label="자리 수에 따른 곱의 상용로그. 약 -324 아래에서 곱이 0이 된다.">
        <line x1={X0} y1={Y0} x2={X0} y2={Y1} stroke="var(--ifm-color-emphasis-300)" />
        <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke="var(--ifm-color-emphasis-300)" />
        <line x1={X0} y1={sy(-324)} x2={X1} y2={sy(-324)} stroke="var(--vbad)" strokeDasharray="5 4" />
        <text x={X1} y={sy(-324) - 5} textAnchor="end" className={s.ts}>약 -324: 이 아래에서 곱이 0</text>
        {[0, -250, -500, -750, -1000].map((y) => (
          <text key={y} x={X0 - 6} y={sy(y) + 4} textAnchor="end" className={s.ts}>{y}</text>
        ))}
        {[0, 200, 400, 600, 800].map((x) => (
          <text key={x} x={sx(x)} y={Y1 + 16} textAnchor="middle" className={s.ts}>{x}</text>
        ))}
        <text x={(X0 + X1) / 2} y={Y1 + 34} textAnchor="middle" className={s.ts}>자리 수 T</text>
        <text x={X0 + 6} y={Y0 + 12} className={s.ts}>log10(곱)</text>
        <line x1={sx(0)} y1={sy(0)} x2={sx(tEnd)} y2={sy(tEnd * l10)} stroke="var(--va)" strokeWidth="2.5" />
        <circle cx={sx(t)} cy={sy(t * l10)} r="5" fill={zero ? 'var(--vbad)' : 'var(--vb)'} />
      </svg>
      {zero ? (
        <Note>곱이 0.0이 되어 어떤 문장인지 구별할 수 없습니다. 로그의 합은 {fmt(logsum, 1)}로 그대로 쓸 수 있습니다.</Note>
      ) : (
        <Note>아직 곱이 표현됩니다. T를 늘려 점이 점선 아래로 내려가는 곳을 찾아 보세요.</Note>
      )}
    </Viz>
  );
}
