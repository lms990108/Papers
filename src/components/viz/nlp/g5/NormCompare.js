import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

function SBar({label, value, max, color}) {
  const pct = Math.min(100, (Math.abs(value) / max) * 100) / 2;
  return (
    <div className={s.barRow}>
      <span>{label}</span>
      <div className={s.barTrack} style={{position: 'relative'}}>
        <div style={{position: 'absolute', top: 0, bottom: 0, left: value >= 0 ? '50%' : 50 - pct + '%', width: pct + '%', background: color, borderRadius: 4}} />
        <div style={{position: 'absolute', top: -2, bottom: -2, left: '50%', width: 1, background: 'var(--ifm-color-emphasis-600)'}} />
      </div>
      <b>{fmt(value, 3)}</b>
    </div>
  );
}

export default function NormCompare() {
  const [x, setX] = useState([1, 0]);
  const set = (i, v) => setX(x.map((q, j) => (j === i ? v : q)));
  const mean = (x[0] + x[1]) / 2;
  const rms = Math.sqrt((x[0] * x[0] + x[1] * x[1]) / 2);
  const std = Math.sqrt(((x[0] - mean) ** 2 + (x[1] - mean) ** 2) / 2);
  const r = rms > 0 ? x.map((v) => v / rms) : [0, 0];
  const l = std > 0 ? x.map((v) => (v - mean) / std) : [0, 0];
  const max = 4;

  return (
    <Viz
      title="RMSNorm과 평균을 빼는 층 정규화 비교"
      caption="두 칸짜리 목록을 바꿔 보세요. RMSNorm은 제곱평균의 제곱근으로만 나누고, 층 정규화는 평균을 빼고 표준편차로 나눕니다. 배율은 1로 둡니다."
    >
      <Controls>
        <Slider label="첫째 칸" min={-3} max={3} step={0.1} value={x[0]} onChange={(v) => set(0, v)} format={(v) => fmt(v, 1)} />
        <Slider label="둘째 칸" min={-3} max={3} step={0.1} value={x[1]} onChange={(v) => set(1, v)} format={(v) => fmt(v, 1)} />
        <Btn onClick={() => setX([1, 0])}>[1, 0]</Btn>
        <Btn onClick={() => setX([0, 2])}>[0, 2]</Btn>
      </Controls>
      <div className={s.two}>
        <div>
          <div className={s.title}>RMSNorm</div>
          <SBar label="입력 1번째 칸" value={x[0]} max={max} color="var(--ifm-color-emphasis-500)" />
          <SBar label="입력 2번째 칸" value={x[1]} max={max} color="var(--ifm-color-emphasis-500)" />
          <SBar label="결과 1번째 칸" value={r[0]} max={max} color="var(--va)" />
          <SBar label="결과 2번째 칸" value={r[1]} max={max} color="var(--va)" />
        </div>
        <div>
          <div className={s.title}>층 정규화 (평균을 뺌)</div>
          <SBar label="입력 1번째 칸" value={x[0]} max={max} color="var(--ifm-color-emphasis-500)" />
          <SBar label="입력 2번째 칸" value={x[1]} max={max} color="var(--ifm-color-emphasis-500)" />
          <SBar label="결과 1번째 칸" value={l[0]} max={max} color="var(--vb)" />
          <SBar label="결과 2번째 칸" value={l[1]} max={max} color="var(--vb)" />
        </div>
      </div>
      <Stats>
        <Stat label="제곱평균 rms" value={fmt(rms, 3)} />
        <Stat label="평균" value={fmt(mean, 3)} />
        <Stat label="표준편차" value={fmt(std, 3)} />
      </Stats>
      <Note>
        [1, 0]에서 rms는 0.707이라 RMSNorm의 결과는 [1.414, 0]이고, 둘째 칸이 0으로 남습니다. 평균 0.5를 빼고 표준편차 0.5로 나누면 층 정규화의 결과는 [1, −1]이 됩니다. [0, 2]는 rms가 1.414라 RMSNorm이 [0, 1.414]를 줍니다. 두 칸이 같으면 표준편차가 0이라 층 정규화를 계산할 수 없습니다(여기서는 0으로 표시).
      </Note>
    </Viz>
  );
}
