import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, styles as s} from '../../Viz';
import {comma} from './dlmath';

const SIZE = 300;

export default function ConvShare() {
  const [n, setN] = useState(28);
  const [kk, setK] = useState(5);
  const [pos, setPos] = useState(0);
  const k = Math.max(1, Math.min(kk, n));
  const out = n - k + 1;
  const cells = out * out;
  const full = n * n * cells + cells;
  const local = cells * (k * k + 1);
  const shared = k * k + 1;
  const p = Math.max(0, Math.min(pos, cells - 1));
  const r = Math.floor(p / out);
  const c = p % out;
  const cs = SIZE / n;
  const lg = (v) => Math.log10(Math.max(v, 1));
  const maxLog = Math.max(lg(full), lg(local), lg(shared), 1);

  return (
    <Viz
      title="창이 놓이는 자리와 파라미터 수"
      caption="창을 한 칸씩 옮기면 놓이는 자리가 (N − k + 1)²개이고, 자리마다 출력 칸이 하나입니다. 기본값 28, 5는 원문의 576, 452,160, 14,976, 26이고, 32와 5는 연습 문제 3의 784, 26, 20,384입니다. 막대는 값이 크게 차이 나서 로그 눈금으로 그렸습니다."
    >
      <Controls>
        <Slider label="그림 한 변 N" min={6} max={32} value={n} onChange={setN} />
        <Slider label="창 한 변 k" min={1} max={Math.min(n, 12)} value={k} onChange={setK} />
        <Btn on={n === 28 && k === 5} onClick={() => {setN(28); setK(5);}}>
          28, 5
        </Btn>
        <Btn on={n === 32 && k === 5} onClick={() => {setN(32); setK(5);}}>
          32, 5
        </Btn>
      </Controls>
      <Controls>
        <Slider label="창 위치" min={0} max={cells - 1} value={p} onChange={setPos} format={(v) => `${v + 1} / ${cells}`} />
      </Controls>
      <svg className={s.canvas} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{maxWidth: 400}} role="img" aria-label={`그림 ${n}×${n}에서 ${k}×${k} 창이 ${r + 1}행 ${c + 1}열 자리에 놓인 모습`}>
        <rect x={0} y={0} width={SIZE} height={SIZE} fill="var(--ifm-background-color)" />
        {Array.from({length: n + 1}, (_, i) => (
          <g key={i}>
            <line x1={i * cs} x2={i * cs} y1={0} y2={SIZE} stroke="var(--ifm-color-emphasis-200)" />
            <line y1={i * cs} y2={i * cs} x1={0} x2={SIZE} stroke="var(--ifm-color-emphasis-200)" />
          </g>
        ))}
        <rect x={c * cs} y={r * cs} width={k * cs} height={k * cs} fill="var(--vb)" fillOpacity={0.3} stroke="var(--vb)" strokeWidth={2.5} />
      </svg>
      <Bar label="완전 연결" value={lg(full)} max={maxLog} color="var(--vbad)" text={comma(full)} />
      <Bar label="창만 보고 공유 X" value={lg(local)} max={maxLog} color="var(--vb)" text={comma(local)} />
      <Bar label="창만 보고 공유 O" value={lg(shared)} max={maxLog} color="var(--vok)" text={comma(shared)} />
      <Stats>
        <Stat label="창이 놓이는 자리 (한 줄)" value={out} />
        <Stat label="출력 칸 수" value={comma(cells)} />
        <Stat label="공유할 때 파라미터" value={`${k}×${k}+1 = ${shared}`} tone="good" />
      </Stats>
      <Note>
        출력 칸 수는 세 방법이 모두 같습니다. 달라지는 것은 칸마다 따로 두는 빈칸의 수뿐입니다. 창만 보고 공유하는 층이 합성곱입니다.
        {k === n ? ' 창이 그림 전체와 같으면 자리가 하나뿐이라 공유해도 얻는 것이 없습니다.' : ''}
      </Note>
    </Viz>
  );
}
