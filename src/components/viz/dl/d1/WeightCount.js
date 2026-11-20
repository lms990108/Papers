import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, styles as s} from '../../Viz';
import {comma} from './dlmath';

const OUT = 10;

// 바이어스를 세지 않는 가중치 수 (neural-network 페이지)
export default function WeightCount() {
  const [side, setSide] = useState(28);
  const [hidden, setHidden] = useState(100);
  const nIn = side * side;
  const direct = nIn * OUT;
  const withHidden = hidden > 0 ? nIn * hidden + hidden * OUT : direct;
  const ratio = direct > 0 ? withHidden / direct : 1;
  const max = Math.max(direct, withHidden, 1);

  return (
    <Viz
      title="가운데 단계 하나가 가중치를 얼마나 늘리나"
      caption="출력은 점수 10개로 고정했고, 바이어스는 세지 않았습니다. 기본값 28×28과 가운데(은닉) 100칸은 본문의 7,840개와 79,400개입니다."
    >
      <Controls>
        <Slider label="그림 한 변" min={3} max={28} value={side} onChange={setSide} format={(v) => `${v}×${v}`} />
        <Slider
          label="가운데 칸 수"
          min={0}
          max={300}
          step={10}
          value={hidden}
          onChange={setHidden}
          format={(v) => (v === 0 ? '없음' : v)}
        />
        <Btn on={side === 28 && hidden === 100} onClick={() => {setSide(28); setHidden(100);}}>
          본문의 값
        </Btn>
        <Btn on={side === 28 && hidden === 50} onClick={() => {setSide(28); setHidden(50);}}>
          연습 문제 2 (가운데 50칸)
        </Btn>
      </Controls>
      <Bar label={`${nIn} → 10`} value={direct} max={max} color="var(--va)" text={comma(direct)} />
      <Bar
        label={hidden > 0 ? `${nIn} → ${hidden} → 10` : '가운데 단계 없음'}
        value={withHidden}
        max={max}
        color="var(--vb)"
        text={comma(withHidden)}
      />
      <table className={s.grid}>
        <tbody>
          <tr>
            <th>곧바로</th>
            <td>
              {nIn} × 10 = {comma(direct)}
            </td>
          </tr>
          <tr>
            <th>가운데 단계 포함</th>
            <td>
              {hidden > 0
                ? `${nIn} × ${hidden} + ${hidden} × 10 = ${comma(nIn * hidden)} + ${comma(hidden * OUT)} = ${comma(withHidden)}`
                : '가운데 칸이 0이면 곧바로와 같습니다'}
            </td>
          </tr>
        </tbody>
      </table>
      <Stats>
        <Stat label="입력 칸 수" value={comma(nIn)} />
        <Stat label="늘어난 배수" value={hidden > 0 ? `${ratio.toFixed(1)}배` : '1.0배'} tone={ratio > 5 ? 'bad' : undefined} />
      </Stats>
      <Note>가운데 칸 수를 바꿔 보세요. 28×28에서 100칸이면 비워 둘 수가 열 배로 늘어납니다. 빈칸이 많으면 표현할 수 있는 함수가 늘지만 학습 쌍을 외우기도 쉬워집니다.</Note>
    </Viz>
  );
}
