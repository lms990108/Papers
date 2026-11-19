import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const MAXS = 8;

export default function GradientBoostSteps() {
  const [y, setY] = useState(9);
  const [f0, setF0] = useState(5);
  const [lr, setLr] = useState(0.5);
  const [n, setN] = useState(3);
  // 다음 모델이 남은 오차 y - F를 정확히 맞힌다고 가정하고 F ← F + lr × 오차
  const rows = [];
  let F = f0;
  for (let i = 0; i <= MAXS; i++) {
    rows.push({i, F, r: y - F});
    F = F + lr * (y - F);
  }
  const shown = rows.slice(0, n + 1);
  const cur = rows[n];

  return (
    <Viz
      title="기울기 부스팅: 남은 오차에 다음 모델을 맞춥니다"
      caption="정답 y, 처음 예측 F, 학습률을 바꿔 보세요. 제곱 오차에서는 y − F가 곧 음의 기울기라서, 다음 모델이 그 값을 맞힌다고 하면 F가 F + 학습률 × (y − F)로 갱신됩니다. 기본값 y = 9, F = 5, 학습률 0.5는 본문의 예와 같고 F가 7, 8, 8.5로 다가갑니다."
    >
      <Controls>
        <Slider label="정답 y" min={0} max={20} step={0.5} value={y} onChange={setY} format={(v) => fmt(v, 1)} />
        <Slider label="처음 예측 F" min={0} max={20} step={0.5} value={f0} onChange={setF0} format={(v) => fmt(v, 1)} />
        <Slider label="학습률" min={0.1} max={1} step={0.1} value={lr} onChange={setLr} format={(v) => fmt(v, 1)} />
      </Controls>
      <Controls>
        <Btn onClick={() => setN(Math.min(MAXS, n + 1))}>다음 모델 더하기</Btn>
        <Btn onClick={() => setN(0)}>처음으로</Btn>
        <Btn onClick={() => { setY(9); setF0(5); setLr(0.5); setN(3); }}>본문 값</Btn>
      </Controls>
      {shown.map((r) => (
        <Bar key={r.i} label={r.i === 0 ? '처음 F' : `${r.i}번째 모델 뒤 F`} value={Math.max(0, r.F)} max={20} color={r.i === n ? 'var(--vb)' : 'var(--va)'} text={`${fmt(r.F, 3)} (남은 오차 ${fmt(r.r, 3)})`} />
      ))}
      <Stats>
        <Stat label="정답 y" value={fmt(y, 1)} />
        <Stat label="지금 F" value={fmt(cur.F, 3)} />
        <Stat label="남은 오차 y − F" value={fmt(cur.r, 3)} tone={Math.abs(cur.r) < 0.5 ? 'good' : undefined} />
        <Stat label="한 번에 줄어드는 비율" value={`${fmt(1 - lr, 1)}배로 남음`} />
      </Stats>
      <Note>남은 오차는 라운드마다 (1 − 학습률)배가 됩니다. 학습률 0.5이면 4, 2, 1, 0.5로 절반씩 줄고, 학습률이 1이면 한 번에 정답에 닿습니다. 막대 길이는 F(0 이상만 그림)입니다.</Note>
    </Viz>
  );
}
