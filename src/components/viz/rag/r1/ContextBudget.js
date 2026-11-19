import React, {useState} from 'react';
import {Viz, Controls, Slider, Bar, Stats, Stat, Note} from '../../Viz';

const QTOK = 50; // 설명용: 지시와 질문이 차지하는 토큰
const f = (n) => Math.round(n).toLocaleString('en-US');

export default function ContextBudget() {
  const [n, setN] = useState(1000);
  const [size, setSize] = useState(200);
  const [limit, setLimit] = useState(8000);
  const [k, setK] = useState(3);
  const all = n * size;
  const rag = k * size + QTOK;
  const max = Math.max(all, limit, rag);
  const fits = (x) => x <= limit;

  return (
    <Viz
      title="전부 붙일까, k개만 붙일까"
      caption="청크 수, 청크 크기, 입력 한도, k를 바꿔 보세요. 입력 한도 8,000 토큰과 지시·질문 50 토큰은 설명용 값입니다. 청크 크기 200은 토큰 200~500 구간에서 고른 값입니다."
    >
      <Controls>
        <Slider label="청크 수" min={10} max={5000} step={10} value={n} onChange={setN} format={f} />
        <Slider label="청크 크기(토큰)" min={50} max={500} step={50} value={size} onChange={setSize} />
      </Controls>
      <Controls>
        <Slider label="입력 한도(토큰)" min={2000} max={32000} step={1000} value={limit} onChange={setLimit} format={f} />
        <Slider label="k" min={1} max={10} value={k} onChange={setK} />
      </Controls>
      <Bar label="입력 한도" value={limit} max={max} color="var(--ifm-color-emphasis-500)" text={`${f(limit)} 토큰`} />
      <Bar label="전부 붙이기" value={all} max={max} color={fits(all) ? 'var(--vok)' : 'var(--vbad)'} text={`${f(all)} 토큰`} />
      <Bar label={`k = ${k}개만`} value={rag} max={max} color={fits(rag) ? 'var(--vok)' : 'var(--vbad)'} text={`${f(rag)} 토큰`} />
      <Stats>
        <Stat label="전부 붙이면" value={fits(all) ? '들어감' : `한도의 ${(all / limit).toFixed(1)}배`} tone={fits(all) ? 'good' : 'bad'} />
        <Stat label={`k = ${k}개만 붙이면`} value={fits(rag) ? '들어감' : `한도의 ${(rag / limit).toFixed(1)}배`} tone={fits(rag) ? 'good' : 'bad'} />
        <Stat label="읽는 양 비율(전부 / k개)" value={`${(all / rag).toFixed(1)}배`} />
      </Stats>
      <Note>
        k를 키우면 다시 칸이 부족해집니다. k를 10, 청크 크기를 500으로 두고 한도를 줄여 보세요. 그래서 k는 근거의 양과 입력 길이 사이의 선택입니다.
      </Note>
    </Viz>
  );
}
