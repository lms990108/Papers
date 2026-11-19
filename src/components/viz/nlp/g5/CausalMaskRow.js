import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, fmt} from '../../Viz';

const NAMES = ['과거', '현재', '미래'];
const COLORS = ['var(--va)', 'var(--vc)', 'var(--vb)'];

export default function CausalMaskRow() {
  const [sc, setSc] = useState([2, 1, 3]);
  const e = sc.map((v) => Math.exp(v));
  const z = e[0] + e[1] + e[2];
  const open = e.map((v) => v / z);
  const zm = e[0] + e[1];
  const masked = [e[0] / zm, e[1] / zm, 0];
  const set = (i, v) => setSc(sc.map((q, j) => (j === i ? v : q)));

  return (
    <Viz
      title="미래 칸을 가리면 정답이 새지 않습니다"
      caption="한 자리가 과거, 현재, 미래 토큰에 준 점수입니다. 값은 설명용입니다. 가리면 미래 칸의 점수를 아주 작은 수로 바꿔 소프트맥스에서 지수가 0에 가까워집니다."
    >
      <Controls>
        {NAMES.map((nm, i) => (
          <Slider key={nm} label={nm + ' 점수'} min={-2} max={5} step={0.5} value={sc[i]} onChange={(v) => set(i, v)} format={(v) => fmt(v, 1)} />
        ))}
        <Btn onClick={() => setSc([2, 1, 3])}>2, 1, 3</Btn>
        <Btn onClick={() => setSc([1, 1, 1])}>1, 1, 1</Btn>
      </Controls>
      <div style={{fontSize: '0.85rem', fontWeight: 600, marginTop: 4}}>가리지 않았을 때 (지수의 합 {fmt(z, 3)})</div>
      {NAMES.map((nm, i) => (
        <Bar key={nm} label={nm} value={open[i]} max={1} color={COLORS[i]} text={fmt(open[i], 3)} />
      ))}
      <div style={{fontSize: '0.85rem', fontWeight: 600, marginTop: 8}}>미래를 가렸을 때 (지수의 합 {fmt(zm, 3)})</div>
      {NAMES.map((nm, i) => (
        <Bar key={nm} label={nm} value={masked[i]} max={1} color={COLORS[i]} text={i === 2 ? '0 (가림)' : fmt(masked[i], 3)} />
      ))}
      <Stats>
        <Stat label="미래가 가져간 비율 (안 가림)" value={fmt(open[2], 3)} tone={open[2] > 0.5 ? 'bad' : undefined} />
        <Stat label="과거 칸의 비율: 안 가림 → 가림" value={fmt(open[0], 3) + ' → ' + fmt(masked[0], 3)} />
      </Stats>
      <Note>
        점수 2, 1, 3이면 지수는 7.389, 2.718, 20.086이고 합은 30.193이라 미래가 0.665를 가져갑니다. 가리면 합이 10.107이 되어 0.731, 0.269, 0입니다. 점수가 1, 1, 1이면 과거는 가리지 않을 때 0.333, 가릴 때 0.5입니다.
      </Note>
    </Viz>
  );
}
