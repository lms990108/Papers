import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, Note, fmt} from '../../Viz';

const PRESETS = [
  {n: '2/3', b: Math.log2(3 / 2)},
  {n: '1/3', b: Math.log2(3)},
  {n: '1/64', b: 6},
];

export default function TokenCountEffect() {
  const [b, setB] = useState(PRESETS[0].b);
  const [n, setN] = useState(3);
  const P = 2 ** -b;
  const at = (m) => 2 ** (b / m);
  const ms = Array.from({length: 12}, (_, i) => i + 1);

  return (
    <Viz
      title="같은 문장 비율, 다른 토큰 수"
      caption="문장 비율 P가 같아도 토큰이 많으면 자리당 평균이 낮아져 퍼플렉서티가 작아집니다. 퍼플렉서티는 P의 −1/N제곱입니다. 토큰화가 다른 모델의 값은 그대로 견줄 수 없습니다."
    >
      <Controls>
        {PRESETS.map((x) => (
          <Btn key={x.n} on={Math.abs(x.b - b) < 1e-9} onClick={() => setB(x.b)}>
            P = {x.n}
          </Btn>
        ))}
        <Slider label="−log2 P (비트)" min={0} max={12} step={0.1} value={Math.round(b * 10) / 10} onChange={setB} format={(v) => fmt(v, 1)} />
        <Slider label="토큰 수 N" min={1} max={12} value={n} onChange={setN} />
      </Controls>
      {ms.map((m) => (
        <Bar
          key={m}
          label={`토큰 ${m}개`}
          value={at(m)}
          max={at(1)}
          color={m === n ? 'var(--vb)' : 'var(--va)'}
          text={fmt(at(m), 3)}
        />
      ))}
      <Note>
        P = {fmt(P, 4)}, N = {n}이면 퍼플렉서티는 {fmt(at(n), 3)}입니다. 주황 막대가 지금의 N입니다.
      </Note>
    </Viz>
  );
}
