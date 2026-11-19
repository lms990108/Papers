import React, {useState} from 'react';
import {Viz, Controls, Slider, Bar, Stats, Stat, Note, styles as s} from '../../Viz';

export default function RnnWeightShare() {
  const [T, setT] = useState(3);
  const [d, setD] = useState(2);

  const rnn = 2 * d * d;
  const sep = T * rnn;
  const maxSep = 12 * 2 * 8 * 8;

  return (
    <Viz
      title="같은 가중치를 매 자리에서 재사용"
      caption="문장 길이와 상태의 크기를 바꿔 보세요. 파라미터는 W_h의 d², W_x의 d²개입니다(바이어스 생략). 아래 비교용 막대는 자리마다 가중치를 따로 둔다고 가정한 설명용 계산입니다."
    >
      <Controls>
        <Slider label="문장 길이 T" min={1} max={12} value={T} onChange={setT} />
        <Slider label="상태의 크기 d" min={1} max={8} value={d} onChange={setD} />
      </Controls>

      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', margin: '4px 0 10px'}}>
        {Array.from({length: T}, (_, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <span className={s.ts}>→</span> : null}
            <div style={{border: '2px solid var(--vb)', borderRadius: 8, padding: '4px 8px', textAlign: 'center', minWidth: 62}}>
              <div style={{fontWeight: 600, fontSize: 13}}>{i + 1}번째</div>
              <div className={s.ts}>같은 W_h, W_x</div>
            </div>
          </React.Fragment>
        ))}
      </div>

      <Stats>
        <Stat label="순환 신경망의 파라미터" value={rnn} tone="good" />
        <Stat label="W_h를 곱하는 횟수" value={T} />
        <Stat label="W_x를 곱하는 횟수" value={T} />
        <Stat label="상태의 크기" value={d} />
      </Stats>

      <Bar label="순환 신경망 (재사용)" value={rnn} max={maxSep} color="var(--vok)" text={`${rnn}개`} />
      <Bar label="자리마다 따로 (비교)" value={sep} max={maxSep} color="var(--vbad)" text={`${sep}개`} />
      <Note>
        T를 늘려도 순환 신경망의 파라미터 {rnn}개는 그대로입니다. 늘어나는 것은 같은 행렬을 곱하는 횟수입니다. 자리마다 가중치가 따로 있다면 {T} × {rnn} = {sep}개가 되고, 첫 자리에서 배운 것을 셋째 자리에서 쓰지도 못합니다.
      </Note>
    </Viz>
  );
}
