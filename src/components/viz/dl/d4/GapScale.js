import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt} from '../../Viz';

const MULTS = [0.25, 0.5, 1, 2, 4, 8, 16];
const mtxt = (i) => `×${MULTS[i]}`;

export default function GapScale() {
  const [pi, setPi] = useState(4);
  const [hi, setHi] = useState(2);
  const [alpha, setAlpha] = useState(0.5);
  const [base, setBase] = useState(0.08);

  const pm = MULTS[pi];
  const hm = MULTS[hi];
  const factor = Math.pow(hm / pm, alpha);
  const out = base * factor;

  return (
    <Viz
      title="간격은 몇 배가 되나: P와 h의 배율로 계산하기"
      caption="k를 몰라도 배율은 계산됩니다. 간격의 배율은 (h의 배율 ÷ P의 배율)의 α제곱입니다. 기본값은 연습 문제 1의 값(1,000개에서 간격 0.08, P를 네 배)입니다. 실제 간격이 식대로 줄지는 않습니다."
    >
      <Controls>
        <Slider label="P(학습 쌍)" min={0} max={MULTS.length - 1} value={pi} onChange={setPi} format={mtxt} />
        <Slider label="h(용량)" min={0} max={MULTS.length - 1} value={hi} onChange={setHi} format={mtxt} />
        <Slider label="α" min={0.5} max={1} step={0.5} value={alpha} onChange={setAlpha} format={(v) => fmt(v, 1)} />
      </Controls>
      <Controls>
        <Slider label="처음 간격" min={0.02} max={0.2} step={0.01} value={base} onChange={setBase} format={(v) => fmt(v, 2)} />
        <Btn
          onClick={() => {
            setPi(4);
            setHi(2);
            setAlpha(0.5);
            setBase(0.08);
          }}
        >
          연습 1 (α=0.5)
        </Btn>
        <Btn
          onClick={() => {
            setPi(4);
            setHi(2);
            setAlpha(1);
            setBase(0.08);
          }}
        >
          연습 1 (α=1)
        </Btn>
        <Btn
          onClick={() => {
            setPi(2);
            setHi(3);
            setAlpha(0.5);
          }}
        >
          h만 두 배
        </Btn>
      </Controls>
      <Stats>
        <Stat label="간격의 배율" value={`${fmt(factor, 3)}배`} tone={factor > 1 ? 'bad' : 'good'} />
        <Stat label="처음 간격" value={fmt(base, 2)} />
        <Stat label="바뀐 간격" value={fmt(out, 3)} />
      </Stats>
      <Note>
        배율 = ({hm} ÷ {pm})^{fmt(alpha, 1)} = {fmt(factor, 3)}. P가 두 배이면 2^−α배, h가 두 배이면 2^α배입니다. α = 0.5이면 0.707배와 1.41배, α = 1이면 0.5배와 2배입니다.
      </Note>
    </Viz>
  );
}
