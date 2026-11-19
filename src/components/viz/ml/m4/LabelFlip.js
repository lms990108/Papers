import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

export const logadd = (xs) => {
  const m = Math.min(...xs);
  return m - Math.log(xs.reduce((a, x) => a + Math.exp(-(x - m)), 0));
};

const VW = 640;
const MAXC = 8;
const px = (v) => 40 + (v / MAXC) * (VW - 80);

export default function LabelFlip() {
  const [c1, setC1] = useState(3);
  const [c2, setC2] = useState(3.2);
  const [c3, setC3] = useState(2.7);
  const vit = Math.min(c1, c2);
  const fw = logadd([c1, c2]);
  const tie = (a, b) => Math.abs(a - b) < 1e-9;
  const verdict = (ab, other) => (tie(ab, other) ? '동점' : ab < other ? 'ab' : '다른 라벨');
  const vV = verdict(vit, c3);
  const vF = verdict(fw, c3);
  const flip = vV !== vF;

  return (
    <Viz
      title="같은 라벨을 내는 두 경로: 하나만 남기면 비터비, 더하면 전방"
      caption="라벨 ab를 내는 경로 둘의 비용과, 경로가 하나뿐인 다른 라벨의 비용을 정합니다. 비용이 작을수록 좋습니다. 기본값은 원문의 3, 3.2입니다. 다른 라벨은 비용 3.1이면 비터비도 ab를 고르므로(3이 3.1보다 작음) 판단이 갈리는 2.7로 두었습니다."
    >
      <Controls>
        <Slider label="ab 경로 1" min={0} max={MAXC} step={0.1} value={c1} onChange={setC1} format={(v) => fmt(v, 1)} />
        <Slider label="ab 경로 2" min={0} max={MAXC} step={0.1} value={c2} onChange={setC2} format={(v) => fmt(v, 1)} />
        <Slider label="다른 라벨" min={0} max={MAXC} step={0.1} value={c3} onChange={setC3} format={(v) => fmt(v, 1)} />
      </Controls>
      <svg viewBox="0 0 640 170" className={s.svg} role="img" aria-label="비용 수직선 위에 ab의 두 경로, 비터비 비용, 전방 비용, 다른 라벨의 비용이 놓여 있다">
        <line x1={px(0)} x2={px(MAXC)} y1="90" y2="90" stroke="var(--ifm-color-emphasis-500)" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((v) => (
          <g key={v}>
            <line x1={px(v)} x2={px(v)} y1="86" y2="94" stroke="var(--ifm-color-emphasis-500)" />
            <text x={px(v)} y="108" textAnchor="middle" className={s.ts}>{v}</text>
          </g>
        ))}
        <circle cx={px(c1)} cy="90" r="7" fill="var(--va)" />
        <circle cx={px(c2)} cy="90" r="7" fill="var(--va)" opacity="0.6" />
        <polygon points={`${px(c3)},90 ${px(c3) - 8},68 ${px(c3) + 8},68`} fill="var(--vc)" />
        <text x={px(c3)} y="58" textAnchor="middle" className={s.ts} style={{fill: 'var(--vc)'}}>다른 라벨 {fmt(c3, 2)}</text>
        <rect x={px(vit) - 6} y="120" width="12" height="12" fill="var(--vbad)" />
        <text x={px(vit)} y="150" textAnchor="middle" className={s.ts} style={{fill: 'var(--vbad)'}}>비터비 {fmt(vit, 2)}</text>
        <rect x={px(fw) - 6} y="120" width="12" height="12" fill="var(--vok)" />
        <text x={px(fw) + (Math.abs(px(fw) - px(vit)) < 70 ? -70 : 0)} y="166" textAnchor="middle" className={s.ts} style={{fill: 'var(--vok)'}}>전방 {fmt(fw, 2)}</text>
        <text x="10" y="20" className={s.ts}>파랑 동그라미: ab의 두 경로 / 보라 삼각형: 다른 라벨 / 비용이 낮을수록 좋음</text>
      </svg>
      <Stats>
        <Stat label="비터비: ab = min" value={fmt(vit, 3)} />
        <Stat label="전방: ab = logadd" value={fmt(fw, 3)} tone="good" />
        <Stat label="다른 라벨" value={fmt(c3, 3)} />
        <Stat label="비터비의 판단" value={vV} tone={vV === 'ab' ? 'good' : 'bad'} />
        <Stat label="전방의 판단" value={vF} tone={vF === 'ab' ? 'good' : 'bad'} />
      </Stats>
      <Note>
        {flip
          ? '판단이 뒤집혔습니다. 경로를 하나씩 비교하면 다른 라벨이 이기고, 경로를 합치면 ab가 이깁니다.'
          : '두 방식의 판단이 같습니다. ab의 두 경로 비용이 비슷하고 다른 라벨이 둘 사이쯤에 있을 때 판단이 갈립니다.'}
        {' 전방 비용은 어떤 한 경로의 비용보다도 작거나 같습니다.'}
      </Note>
    </Viz>
  );
}
