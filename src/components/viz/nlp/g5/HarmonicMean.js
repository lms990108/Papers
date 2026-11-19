import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, fmt} from '../../Viz';

export default function HarmonicMean() {
  const [P, setP] = useState(1);
  const [R, setR] = useState(0.1);
  const mean = (P + R) / 2;
  const f1 = P + R > 0 ? (2 * P * R) / (P + R) : 0;

  return (
    <Viz
      title="F1은 산술평균이 아니라 조화평균입니다"
      caption="정밀도와 재현율을 움직여 보세요. 한쪽이 낮으면 F1이 낮은 쪽으로 끌려갑니다."
    >
      <Controls>
        <Slider label="정밀도" min={0} max={1} step={0.01} value={P} onChange={setP} format={(v) => fmt(v, 2)} />
        <Slider label="재현율" min={0} max={1} step={0.01} value={R} onChange={setR} format={(v) => fmt(v, 2)} />
        <Btn onClick={() => { setP(1); setR(0.1); }}>1, 0.1</Btn>
        <Btn onClick={() => { setP(0.75); setR(0.6); }}>0.75, 0.6</Btn>
      </Controls>
      <Bar label="정밀도" value={P} max={1} color="var(--va)" text={fmt(P, 2)} />
      <Bar label="재현율" value={R} max={1} color="var(--vc)" text={fmt(R, 2)} />
      <Bar label="산술평균" value={mean} max={1} color="var(--ifm-color-emphasis-500)" text={fmt(mean, 3)} />
      <Bar label="F1 (조화평균)" value={f1} max={1} color="var(--vb)" text={fmt(f1, 3)} />
      <Stats>
        <Stat label="산술평균 − F1" value={fmt(mean - f1, 3)} tone={mean - f1 > 0.2 ? 'bad' : undefined} />
      </Stats>
      <Note>
        정밀도 1, 재현율 0.1이면 산술평균은 0.55이지만 F1은 2 × 1 × 0.1 / 1.1 ≈ 0.182입니다. 정밀도 0.75, 재현율 0.6이면 F1은 0.667입니다.
      </Note>
    </Viz>
  );
}
