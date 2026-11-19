import React, {useState} from 'react';
import {Viz, Controls, Slider, Bar, Note} from './Viz';

const nf = (n) => n.toLocaleString('ko-KR');

export default function TableSize() {
  const [e, setE] = useState(4);
  const [d, setD] = useState(100);
  const V = Math.round(10 ** e);
  const max = Math.max(V, d);

  return (
    <Viz
      title="원-핫 목록과 임베딩 목록의 길이"
      caption="사전 크기 V를 키워 보세요. 원-핫은 V칸으로 길어지지만, 임베딩의 한 행은 사람이 정한 길이 d 그대로입니다."
    >
      <Controls>
        <Slider
          label="사전 크기 V"
          min={2}
          max={6}
          step={0.1}
          value={e}
          onChange={setE}
          format={() => nf(V)}
        />
        <Slider label="행의 길이 d" min={8} max={1024} step={8} value={d} onChange={setD} />
      </Controls>
      <Bar label="원-핫 목록의 길이" value={V} max={max} color="var(--vb)" text={`${nf(V)}칸`} />
      <Bar label="임베딩 행의 길이" value={d} max={max} color="var(--va)" text={`${nf(d)}칸`} />
      <Note>
        표의 수(파라미터) = V × d = {nf(V)} × {nf(d)} = <b>{nf(V * d)}</b>개입니다. 사전이 커지면 표의 행이 늘어날 뿐, 한 토큰이 망에 들어가는 목록의 길이는 d로 그대로입니다.
      </Note>
    </Viz>
  );
}
