import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note, styles as s} from '../../Viz';

// 큰 수를 10의 거듭제곱 꼴로 보여 준다.
function big(log10, exact) {
  if (log10 < 15) return exact.toLocaleString('en-US');
  const e = Math.floor(log10);
  const mant = Math.pow(10, log10 - e);
  return `${mant.toFixed(2)} × 10^${e}`;
}

export default function PathCount() {
  const [N, setN] = useState(10);
  const [T, setT] = useState(100);
  const enumLog = T * Math.log10(N);
  const grid = T * N * N;
  const gridLog = Math.log10(grid);
  const maxLog = Math.max(enumLog, gridLog, 1);
  const bar = (v, c) => (
    <div style={{height: 16, borderRadius: 4, background: 'var(--ifm-color-emphasis-100)'}}>
      <div style={{width: `${Math.max(1, (v / maxLog) * 100)}%`, height: '100%', borderRadius: 4, background: c}} />
    </div>
  );

  return (
    <Viz
      title="상태 수와 시각 수에 따라 나열과 격자의 계산 횟수가 어떻게 늘어나나"
      caption="막대의 길이는 계산 횟수의 상용로그입니다(한 칸 늘 때마다 10배). 나열은 상태열 N^T개를 모두 계산하고, 격자는 시각마다 N개 상태에서 N개 상태로 옮기는 계산 N^2번씩을 T번 합니다."
    >
      <Controls>
        <Slider label="상태 수 N" min={2} max={10} step={1} value={N} onChange={setN} />
        <Slider label="시각 T" min={1} max={100} step={1} value={T} onChange={setT} />
      </Controls>
      <div className={s.barRow} style={{gridTemplateColumns: '8em 1fr 11em'}}>
        <span>나열 N^T</span>
        {bar(enumLog, 'var(--vbad)')}
        <b>{big(enumLog, Math.pow(N, T))}</b>
      </div>
      <div className={s.barRow} style={{gridTemplateColumns: '8em 1fr 11em'}}>
        <span>격자 T·N²</span>
        {bar(gridLog, 'var(--vok)')}
        <b>{big(gridLog, grid)}</b>
      </div>
      <Stats>
        <Stat label="나열 / 격자 (10의 거듭제곱)" value={enumLog >= gridLog ? `10^${(enumLog - gridLog).toFixed(1)}배` : `격자가 ${Math.pow(10, gridLog - enumLog).toFixed(2)}배`} />
      </Stats>
      <Note>
        {N === 10 && T === 100 ? '상태 10개, 시각 100이면 나열은 10^100개로 불가능하고, 격자는 10^4번 안팎입니다.' : 'T가 작으면 둘의 차이가 작거나 거꾸로입니다(예: N = 2, T = 3은 8 대 12). T를 키우면 나열은 지수로, 격자는 T에 비례해서 늘어납니다.'}
      </Note>
    </Viz>
  );
}
