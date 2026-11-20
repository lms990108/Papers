import React, {useMemo, useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {pyRandom} from './pyRandom';

const N = 10000;
const P = 0.01;

// 원문 코드와 같은 난수열(파이썬 random.seed(0))을 쓰므로 기본값에서 같은 숫자가 나옵니다.
export function run(k, seed) {
  const r = pyRandom(seed);
  const rate = () => {
    let c = 0;
    for (let i = 0; i < N; i += 1) if (r() < P) c += 1;
    return c / N;
  };
  const scores = [];
  for (let i = 0; i < k; i += 1) scores.push(rate());
  return {scores, fresh: rate()};
}

const VW = 640;
const VH = 190;

export default function SelectionBias() {
  const [k, setK] = useState(20);
  const [seed, setSeed] = useState(0);
  const {scores, fresh} = useMemo(() => run(k, seed), [k, seed]);
  const best = Math.min(...scores);
  const worst = Math.max(...scores);
  const bi = scores.indexOf(best);
  const lo = 0.5;
  const hi = 1.6;
  const py = (v) => VH - 30 - ((100 * v - lo) / (hi - lo)) * (VH - 55);
  const pxi = (i) => 50 + ((i + 0.5) / Math.max(k, 1)) * 380;

  return (
    <Viz
      title="실력이 똑같은 설정 여러 개 중 시험 오류가 가장 낮은 것을 고르면"
      caption={`설정마다 진짜 오류율은 1.0%이고, 각각 시험 ${N.toLocaleString('en-US')}장에서 오류를 셉니다. 기본값(설정 20개, 난수 0번)은 원문 코드와 같은 난수열이라 같은 숫자가 나옵니다.`}
    >
      <Controls>
        <Slider label="설정 개수 k" min={1} max={50} step={1} value={k} onChange={setK} />
        <Btn on={false} onClick={() => setSeed(seed + 1)}>난수를 바꿔 다시 돌리기</Btn>
        <Btn on={false} onClick={() => { setSeed(0); setK(20); }}>본문 값으로</Btn>
        <span className={s.ts}>난수 번호 {seed}</span>
      </Controls>
      <svg viewBox={`0 0 ${VW} ${VH}`} className={s.svg} role="img" aria-label="설정마다의 시험 오류와 진짜 오류율 1%, 그리고 고른 설정을 새 시험에서 다시 잰 값">
        <line x1="40" x2={VW - 10} y1={py(0.01)} y2={py(0.01)} stroke="var(--ifm-color-emphasis-500)" strokeDasharray="5 4" />
        <text x="456" y={py(0.01) - 7} className={s.ts}>진짜 오류율 1.0%</text>
        {[0.6, 0.8, 1.0, 1.2, 1.4].map((v) => (
          <text key={v} x="36" y={py(v / 100) + 4} textAnchor="end" className={s.ts}>{v.toFixed(1)}%</text>
        ))}
        {scores.map((v, i) => (
          <circle key={i} cx={pxi(i)} cy={py(v)} r={i === bi ? 6 : 4} fill={i === bi ? 'var(--vbad)' : 'var(--va)'} opacity={i === bi ? 1 : 0.75} />
        ))}
        <text x={pxi(bi)} y={py(best) + 20} textAnchor="middle" className={s.ts} style={{fill: 'var(--vbad)'}}>최소 {fmt(100 * best, 2)}%</text>
        <rect x="436" y={py(fresh) - 5} width="10" height="10" fill="var(--vok)" />
        <text x="456" y={py(0.01) + 36} className={s.ts} style={{fill: 'var(--vok)'}}>새 시험에서 다시 잼 {fmt(100 * fresh, 2)}%</text>
        <text x="46" y={VH - 6} className={s.ts}>설정 1 ~ {k} (같은 실력)</text>
      </svg>
      <Stats>
        <Stat label={`시험 오류 ${k}개 중 최소`} value={`${fmt(100 * best, 2)}%`} tone="bad" />
        <Stat label="최대" value={`${fmt(100 * worst, 2)}%`} />
        <Stat label="고른 설정을 새 시험 10,000장에 다시" value={`${fmt(100 * fresh, 2)}%`} tone="good" />
      </Stats>
      <Note>
        {k === 1
          ? '설정이 하나뿐이면 고를 것이 없어서 시험 오류가 그냥 진짜 값 근처입니다. k를 늘려 보세요.'
          : '설정을 많이 둘수록 최소가 진짜 값 1.0%보다 더 낮게 나오고, 새 시험에서는 진짜 값 근처로 돌아옵니다. 시험 집합으로 설정을 고르면 오류가 낮게 보이는 이유입니다.'}
      </Note>
    </Viz>
  );
}
