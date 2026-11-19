import React, {useState} from 'react';
import {Viz, Controls, Slider, Bar, Note, fmt, styles as s} from './Viz';

const R2 = Math.SQRT2;

export default function LengthVsDirection() {
  const [m, setM] = useState(2);
  const dSame = (m - 1) * R2;
  const dOther = R2;

  let distNote;
  if (m === 1) distNote = 'a와 완전히 같은 문장이라 거리가 0입니다.';
  else if (m === 2) distNote = '두 거리가 같습니다. 거리는 내용이 같은 쌍과 다른 쌍을 구별하지 못합니다.';
  else distNote = '내용이 같은 쪽이 오히려 더 멀게 나옵니다. 거리가 길이 차이에 끌려갑니다.';

  return (
    <Viz
      title="기준 문장 a와의 비교"
      caption="a는 “날씨 좋다”, b는 “날씨 나쁘다”입니다. 같은 문장 a를 이어 붙인 횟수를 바꿔 보세요."
    >
      <Controls>
        <Slider label="a를 이어 붙인 횟수" min={1} max={8} value={m} onChange={setM} format={(v) => `${v}번`} />
      </Controls>
      <div className={s.two}>
        <div>
          <div className={s.title}>칸마다의 차이로 잰 거리</div>
          <Bar label={`내용이 같은 문장 (a를 ${m}번)`} value={dSame} max={10} color="var(--va)" text={fmt(dSame)} />
          <Bar label="내용이 다른 문장 (b)" value={dOther} max={10} color="var(--vb)" text={fmt(dOther)} />
          <Note>{distNote}</Note>
        </div>
        <div>
          <div className={s.title}>코사인 유사도</div>
          <Bar label={`내용이 같은 문장 (a를 ${m}번)`} value={1} max={1} color="var(--va)" text="1.00" />
          <Bar label="내용이 다른 문장 (b)" value={0.5} max={1} color="var(--vb)" text="0.50" />
          <Note>몇 번을 이어 붙여도 같은 내용은 1, 다른 내용은 0.5로 그대로입니다.</Note>
        </div>
      </div>
      <p className={s.note}>
        a = [0, 1, 1, 0], 이어 붙인 문장 = [0, {m}, {m}, 0], b = [0, 1, 0, 1]
      </p>
    </Viz>
  );
}
