import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const PRESETS = [
  {t: '1, 0, 0, 1', r: [1, 0, 0, 1]},
  {t: '모두 1', r: [1, 1, 1, 1]},
  {t: '모두 0', r: [0, 0, 0, 0]},
];

export default function GrpoAdvantage() {
  const [r, setR] = useState([1, 0, 0, 1]);
  const [rej, setRej] = useState(false);
  const mean = r.reduce((a, b) => a + b, 0) / r.length;
  const adv = r.map((v) => v - mean);
  const flat = adv.every((v) => Math.abs(v) < 1e-9);
  const toggle = (i) => setR(r.map((v, j) => (j === i ? 1 - v : v)));
  const kept = r.filter((v) => v === 1).length;

  return (
    <Viz
      title="GRPO의 우위와 rejection sampling"
      caption="답 네 개의 보상을 눌러 0과 1로 바꿔 보세요. 우위는 보상에서 평균을 뺀 값입니다. 아래 버튼으로 같은 보상을 rejection sampling 관점에서 볼 수 있습니다. rejection sampling은 보상이 높은 답만 골라 SFT의 답으로 쓰는 방법입니다."
    >
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p.t} on={p.r.join() === r.join()} onClick={() => setR(p.r)}>
            보상 {p.t}
          </Btn>
        ))}
        <Btn on={rej} onClick={() => setRej(!rej)}>rejection sampling으로 보기</Btn>
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>답</th>
            <th>보상 (눌러서 바꾸기)</th>
            <th>우위 = 보상 − 평균</th>
            <th>{rej ? 'SFT의 답으로' : 'GRPO에서의 방향'}</th>
          </tr>
        </thead>
        <tbody>
          {r.map((v, i) => (
            <tr key={i}>
              <td>답 {i + 1}</td>
              <td>
                <Btn on={v === 1} onClick={() => toggle(i)}>
                  {v}
                </Btn>
              </td>
              <td className={adv[i] > 1e-9 ? s.cellOn : undefined}>{fmt(adv[i], 2)}</td>
              <td>
                {rej
                  ? v === 1
                    ? '넣음 (토큰을 -log p로 맞춤)'
                    : '빠짐'
                  : adv[i] > 1e-9
                    ? '확률이 오름'
                    : adv[i] < -1e-9
                      ? '확률이 내림'
                      : '변화 없음'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="보상 평균" value={fmt(mean, 2)} />
        <Stat label="우위의 합" value={fmt(adv.reduce((a, b) => a + b, 0), 2)} />
        <Stat label="SFT에 넣는 답" value={`${kept}개`} />
      </Stats>
      <Note>
        {flat
          ? '네 보상이 모두 같으면 우위가 전부 0입니다. 전부 맞았어도 서로 차이가 없으면 이 배치에서는 갱신할 방향이 없습니다.'
          : '평균보다 높은 답만 확률이 오릅니다. 같은 보상 1, 0, 0, 1에서 rejection sampling은 0인 둘을 빼고 1인 둘만 SFT의 답으로 씁니다.'}
      </Note>
    </Viz>
  );
}
