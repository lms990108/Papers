import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, Stats, Stat, Note, styles as s} from '../../Viz';
import {comma} from './util';

export default function TransformerParamCount() {
  const [d, setD] = useState(8);
  const [len, setLen] = useState(16);

  const att = 4 * d * d;
  const ffn = 8 * d * d;
  const total = att + ffn;

  return (
    <Viz
      title="블록 하나의 파라미터 수 (바이어스 제외)"
      caption="입력 길이 d를 바꿔 보세요. 가운데 칸 수는 4d로 둡니다. 어텐션은 W_Q, W_K, W_V, W_O 네 개로 4d², 칸마다의 층은 W_1, W_2로 2 × d × 4d = 8d²입니다."
    >
      <Controls>
        <Btn on={d === 8} onClick={() => setD(8)}>d = 8 (연습 문제 3)</Btn>
        <Btn on={d === 512} onClick={() => setD(512)}>d = 512 (2017년 논문)</Btn>
      </Controls>
      <Controls>
        <Slider label="입력 길이 d" min={4} max={1024} step={4} value={d} onChange={setD} />
        <Slider label="문장 길이 (토큰 수)" min={1} max={128} step={1} value={len} onChange={setLen} />
      </Controls>
      <Bar label="어텐션 4d²" value={att} max={total} color="var(--va)" text={comma(att)} />
      <Bar label="칸마다의 층 8d²" value={ffn} max={total} color="var(--vb)" text={comma(ffn)} />
      <Stats>
        <Stat label="블록 하나 12d²" value={comma(total)} />
        <Stat label="칸마다의 층 비중" value="2/3" />
        <Stat label={`문장 ${len}토큰일 때 파라미터`} value={comma(total)} />
      </Stats>
      <Note>문장 길이를 바꿔도 파라미터 수는 그대로입니다. 문장 길이는 이 수에 들어가지 않습니다.</Note>
    </Viz>
  );
}
