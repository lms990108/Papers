import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {num, trim} from './util';

const TEST = 10000;
const MAXN = 200;
const X = (n) => 24 + (n / MAXN) * 592;

export default function ErrorCount() {
  const [n, setN] = useState(95);
  const rate = (n / TEST) * 100;

  return (
    <Viz
      title="시험 10,000장에서 몇 장을 틀렸는가"
      caption="틀린 장 수를 움직여 오류율을 보세요. 95장이면 0.95%(변형 없는 학습), 80장이면 0.8%(변형 학습)입니다. 논문이 그림으로 보인 오분류 82장은 0.82%라서 0.8% 쪽의 수치입니다."
    >
      <Controls>
        <Slider label="틀린 장 수" min={0} max={MAXN} value={n} onChange={setN} />
        <Btn on={n === 95} onClick={() => setN(95)}>95장 (0.95%)</Btn>
        <Btn on={n === 82} onClick={() => setN(82)}>82장 (0.82%)</Btn>
        <Btn on={n === 80} onClick={() => setN(80)}>80장 (0.8%)</Btn>
      </Controls>
      <svg viewBox="0 0 640 100" className={s.svg} role="img" aria-label={`시험 ${TEST}장 중 ${n}장이 틀리면 오류율 ${trim(rate, 2)}퍼센트`}>
        <rect x={24} y={34} width={592} height={20} rx={4} fill="var(--ifm-color-emphasis-100)" />
        <rect x={24} y={34} width={Math.max(0, X(n) - 24)} height={20} rx={4} fill="var(--vbad)" fillOpacity={0.7} />
        {[0, 50, 100, 150, 200].map((t) => (
          <g key={t}>
            <line x1={X(t)} y1={54} x2={X(t)} y2={60} stroke="var(--ifm-color-emphasis-500)" />
            <text x={X(t)} y={74} textAnchor="middle" className={s.ts}>{t}</text>
          </g>
        ))}
        {[[82, '82'], [95, '95']].map(([t, name]) => (
          <g key={t}>
            <line x1={X(t)} y1={26} x2={X(t)} y2={54} stroke="var(--ifm-font-color-base)" strokeWidth={1.5} />
            <text x={X(t) + (t === 82 ? -4 : 4)} y={22} textAnchor={t === 82 ? 'end' : 'start'} className={s.ts}>{name}장</text>
          </g>
        ))}
        <text x={320} y={95} textAnchor="middle" className={s.ts}>틀린 장 수 (전체 {num(TEST)}장)</text>
      </svg>
      <Stats>
        <Stat label="시험 장 수" value={num(TEST)} />
        <Stat label="틀린 장 수" value={n} />
        <Stat label="오류율" value={`${trim(rate, 2)}%`} tone={n === 0 ? 'good' : undefined} />
        <Stat label="95장(0.95%)과의 차이" value={n - 95 > 0 ? `+${n - 95}` : `${n - 95}`.replace('-', '−')} />
      </Stats>
      <Note>
        {n === 95 ? '0.95%는 10,000장 중 95장입니다. 시험 오류는 학습 집합을 10번쯤 통과한 뒤 이 값에서 안정되고, 학습 오류는 19번 통과 후 0.35%입니다.' : null}
        {n === 82 ? '82장은 0.82%입니다. 변형 학습의 0.8%에 해당하고, 변형 없는 모델의 0.95%(95장)와는 맞지 않습니다.' : null}
        {n === 80 ? '0.8%는 10,000장 중 80장입니다. 원본 60,000장에 이동, 확대, 전단을 섞은 변형 540,000장을 더한 학습의 시험 오류입니다.' : null}
        {n !== 95 && n !== 82 && n !== 80 ? '오류율 = 틀린 장 수 ÷ 10,000입니다. 95장, 82장, 80장 버튼으로 본문의 수치를 확인해 보세요.' : null}
      </Note>
    </Viz>
  );
}
