import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, Note, fmt} from '../../Viz';

const FREQ = [
  {t: '오늘', f: 3},
  {t: '날씨', f: 3},
  {t: '좋다', f: 2},
  {t: '나쁘다', f: 1},
];

export default function SamplingPower() {
  const [a, setA] = useState(0.75);

  const tot = FREQ.reduce((acc, x) => acc + x.f, 0);
  const w = FREQ.map((x) => Math.pow(x.f, a));
  const z = w.reduce((acc, x) => acc + x, 0);
  const rare = w[3] / z;
  const rareBase = FREQ[3].f / tot;

  return (
    <Viz
      title="무작위 단어는 어떤 비율로 뽑히나"
      caption="학습 글에서 오늘 3번, 날씨 3번, 좋다 2번, 나쁘다 1번 나왔다고 합시다. 빈도에 지수를 씌워 비율로 바꾼 값이 뽑힐 비율입니다. 지수 0.75가 워드투벡터의 값입니다."
    >
      <Controls>
        <Slider label="지수" min={0} max={1.5} step={0.05} value={a} onChange={setA} format={(x) => fmt(x, 2)} />
        <Btn on={a === 0} onClick={() => setA(0)}>0 (모두 같게)</Btn>
        <Btn on={a === 0.75} onClick={() => setA(0.75)}>0.75</Btn>
        <Btn on={a === 1} onClick={() => setA(1)}>1 (빈도 그대로)</Btn>
      </Controls>
      {FREQ.map((x, i) => (
        <div key={x.t}>
          <Bar label={`${x.t} (빈도 ${x.f})`} value={x.f / tot} max={0.6} color="var(--ifm-color-emphasis-500)" text={`빈도 비율 ${fmt(x.f / tot, 3)}`} />
          <Bar label="　뽑힐 비율" value={w[i] / z} max={0.6} color="var(--vb)" text={`뽑힐 비율 ${fmt(w[i] / z, 3)}`} />
        </div>
      ))}
      <Note>
        가장 드문 나쁘다는 {fmt(rareBase, 3)}에서 {fmt(rare, 3)}이 됩니다.
        {a < 1 ? ' 지수가 1보다 작으면 자주 나오는 단어는 덜 뽑히고, 드문 단어는 더 뽑힙니다.' : a > 1 ? ' 지수가 1보다 크면 자주 나오는 단어에 더 쏠립니다.' : ' 지수가 1이면 빈도 비율 그대로입니다.'}
      </Note>
    </Viz>
  );
}
