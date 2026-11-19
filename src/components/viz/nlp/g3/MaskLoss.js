import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const ROWS = [
  {name: '날씨 좋다', toks: ['날씨', '좋다', '0', '0'], loss: [0.3, 0.3, null, null], mask: [1, 1, 0, 0]},
  {name: '오늘 날씨 정말 좋다', toks: ['오늘', '날씨', '정말', '좋다'], loss: [0.2, 0.4, 0.6, 0.2], mask: [1, 1, 1, 1]},
];

export default function MaskLoss() {
  const [masked, setMasked] = useState(true);
  const [padLoss, setPadLoss] = useState(1);

  const val = (r, i) => (r.loss[i] === null ? padLoss : r.loss[i]);
  const sums = ROWS.map((r) => {
    const all = r.toks.reduce((acc, _, i) => acc + val(r, i), 0);
    const real = r.toks.reduce((acc, _, i) => acc + r.mask[i] * val(r, i), 0);
    return {all, real, n: r.toks.length, m: r.mask.reduce((a, b) => a + b, 0)};
  });
  const totAll = sums.reduce((a, x) => a + x.all, 0) / (sums[0].n + sums[1].n);
  const totReal = sums.reduce((a, x) => a + x.real, 0) / (sums[0].m + sums[1].m);
  const first = masked ? sums[0].real / sums[0].m : sums[0].all / sums[0].n;
  const batch = masked ? totReal : totAll;
  const share = masked ? sums[0].m : sums[0].n;

  return (
    <Viz
      title="평균 오차에서 빈 칸 빼기"
      caption="실제 단어 자리의 오차는 고정이고, 빈 칸 자리의 오차는 슬라이더로 바꿉니다(설명용 값, 기본 1). 마스크를 켜면 빈 칸 자리가 평균에서 빠집니다."
    >
      <Controls>
        <Btn on={masked} onClick={() => setMasked(true)}>마스크 켬 (빈 칸 빼기)</Btn>
        <Btn on={!masked} onClick={() => setMasked(false)}>마스크 끔 (빈 칸 포함)</Btn>
        <Slider label="빈 칸 자리의 오차" min={0} max={2} step={0.1} value={padLoss} onChange={setPadLoss} format={(x) => fmt(x, 1)} />
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>문장</th>
            <th>1</th>
            <th>2</th>
            <th>3</th>
            <th>4</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              {r.toks.map((t, i) => {
                const out = masked && r.mask[i] === 0;
                return (
                  <td key={i} className={r.mask[i] === 0 ? s.cellOn : undefined} style={out ? {opacity: 0.4, textDecoration: 'line-through'} : undefined}>
                    {t}
                    <div className={s.ts}>오차 {fmt(val(r, i), 1)}</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="첫 문장 평균 오차" value={fmt(first, 3)} tone={masked ? 'good' : 'bad'} />
        <Stat label="묶음 전체 평균 오차" value={fmt(batch, 3)} tone={masked ? 'good' : 'bad'} />
        <Stat label="첫 문장 단어 하나의 몫" value={`1/${share}`} />
      </Stats>
      <Note>
        평균은 마스크가 1인 자리의 오차를 더해 마스크가 1인 칸 수로 나눈 값입니다. 빈 칸을 넣으면 나누는 수가 {sums[0].n}로 커져서 실제 단어 하나가 받는 몫이 1/{sums[0].n}로 줄고, 빼면 1/{sums[0].m}입니다. 빈 칸 자리의 오차가 클수록 마스크를 끈 평균이 부풉니다.
      </Note>
    </Viz>
  );
}
