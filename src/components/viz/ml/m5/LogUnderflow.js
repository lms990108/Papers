import React, {useMemo, useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note, Bar, fmt} from '../../Viz';

export default function LogUnderflow() {
  const [n, setN] = useState(400);
  const [p, setP] = useState(0.1);

  const info = useMemo(() => {
    // 실수로 n번 곱한 값과, 같은 일을 비용(-log)의 합으로 한 값.
    let prod = 1;
    let sum = 0;
    let firstZero = null;
    const unit = -Math.log(p);
    for (let i = 1; i <= 600; i += 1) {
      prod *= p;
      sum += unit;
      if (prod === 0 && firstZero === null) firstZero = i;
      if (i === n) return {prod, sum, firstZero, unit};
    }
    return {prod: 1, sum: 0, firstZero, unit};
  }, [n, p]);

  const zero = info.prod === 0;
  const firstZeroAll = useMemo(() => {
    let prod = 1;
    for (let i = 1; i <= 600; i += 1) {
      prod *= p;
      if (prod === 0) return i;
    }
    return null;
  }, [p]);

  return (
    <Viz
      title="확률을 계속 곱하면 0이 되는 이유"
      caption="확률 p를 n번 곱합니다. 실수(double)의 한계를 넘으면 곱은 0.0이 되지만, 같은 일을 비용(−log p)의 합으로 하면 값이 멀쩡합니다."
    >
      <Controls>
        <Slider label="곱하는 횟수 n" min={1} max={500} value={n} onChange={setN} />
        <Slider label="확률 p" min={0.05} max={0.5} step={0.05} value={p} onChange={setP} format={(x) => fmt(x, 2)} />
        <Btn onClick={() => { setN(400); setP(0.1); }}>원본 예 (0.1을 400번)</Btn>
      </Controls>
      <Stats>
        <Stat label={`곱한 값 (p = ${fmt(p, 2)}, ${n}번)`} value={zero ? '0.0' : info.prod.toExponential(3)} tone={zero ? 'bad' : undefined} />
        <Stat label={`비용의 합 (${n}번)`} value={fmt(info.sum, 1)} tone="good" />
        <Stat label="비용 한 번" value={fmt(info.unit, 3)} />
      </Stats>
      <Bar label="비용 합" value={info.sum} max={Math.max(1, -Math.log(p) * 500)} color="var(--va)" text={fmt(info.sum, 1)} />
      <Note>
        {zero
          ? `곱이 0.0이 되었습니다. 이 확률에서는 n이 ${firstZeroAll}번째부터 0.0입니다. 0.0끼리는 어느 경로가 나은지 비교할 수 없습니다.`
          : firstZeroAll
            ? `아직 0이 아닙니다. 이 확률에서는 n이 ${firstZeroAll}번째에서 0.0이 됩니다. 비용으로는 n이 500이어도 문제가 없습니다.`
            : '이 범위의 n에서는 곱이 0이 되지 않습니다. p를 작게 하거나 n을 늘려 보세요.'}
      </Note>
    </Viz>
  );
}
