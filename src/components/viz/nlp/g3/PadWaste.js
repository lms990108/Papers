import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const SETS = [
  {name: '2, 4, 3, 7', lens: [2, 4, 3, 7]},
  {name: '3, 5, 2', lens: [3, 5, 2]},
];

export default function PadWaste() {
  const [si, setSi] = useState(0);
  const [g, setG] = useState(1);
  const [sorted, setSorted] = useState(true);

  const lens = SETS[si].lens;
  const n = lens.length;
  const gg = Math.min(g, n);
  const order = lens.slice();
  if (sorted) order.sort((a, b) => a - b);
  const groups = [];
  order.forEach((l, i) => {
    const k = Math.floor((i * gg) / n);
    if (!groups[k]) groups[k] = [];
    groups[k].push(l);
  });

  const cells = groups.reduce((acc, grp) => acc + Math.max(...grp) * grp.length, 0);
  const real = lens.reduce((a, b) => a + b, 0);
  const pad = cells - real;

  return (
    <Viz
      title="묶음을 나누면 빈 칸이 줄어든다"
      caption="문장 길이(토큰 수)가 다른 문장들을 몇 묶음으로 나눌지 정해 보세요. 한 묶음의 가로는 그 묶음에서 가장 긴 문장의 길이입니다. 파란 칸은 실제 단어이고 주황 칸은 빈 칸입니다."
    >
      <Controls>
        {SETS.map((x, k) => (
          <Btn key={x.name} on={k === si} onClick={() => setSi(k)}>
            문장 길이 {x.name}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="묶음 수" min={1} max={n} value={gg} onChange={setG} />
        <Btn on={sorted} onClick={() => setSorted(!sorted)}>길이순으로 정렬해서 묶기</Btn>
      </Controls>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 14}}>
        {groups.map((grp, k) => {
          const L = Math.max(...grp);
          return (
            <div key={k} style={{padding: 8, border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 8}}>
              <div className={s.ts}>묶음 {k + 1} (가로 {L})</div>
              {grp.map((l, r) => (
                <div key={r} style={{display: 'flex', gap: 2, marginTop: 3, alignItems: 'center'}}>
                  {Array.from({length: L}, (_, i) => (
                    <span
                      key={i}
                      title={i < l ? '실제 단어' : '빈 칸'}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 3,
                        background: i < l ? 'var(--va)' : 'var(--vb)',
                        opacity: i < l ? 0.85 : 0.5,
                      }}
                    />
                  ))}
                  <span className={s.ts} style={{marginLeft: 4}}>길이 {l}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <Stats>
        <Stat label="전체 칸" value={cells} />
        <Stat label="실제 단어" value={real} />
        <Stat label="빈 칸" value={pad} tone={pad > 0 ? 'bad' : 'good'} />
        <Stat label="빈 칸 비율" value={`${fmt((pad / cells) * 100, 1)}%`} tone={pad > 0 ? 'bad' : 'good'} />
      </Stats>
      <Note>
        {!sorted && gg > 1 && gg < n
          ? '정렬하지 않고 주어진 순서대로 묶으면 긴 문장과 짧은 문장이 섞여 빈 칸이 덜 줄어듭니다.'
          : '길이가 비슷한 문장끼리 묶는 방법을 길이별 묶기라고 하며, 학습 때 흔히 씁니다. 묶음마다 결과는 같지만 계산에 드는 칸 수는 다릅니다.'}
      </Note>
    </Viz>
  );
}
