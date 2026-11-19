import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const HIDDEN = [2, 4, 16, 64, 256, 1024, 4096];

export default function ScaleStack() {
  const [blocks, setBlocks] = useState(2);
  const [hi, setHi] = useState(1);
  const [p, setP] = useState(0.711);
  const h = HIDDEN[hi];
  const wBlock = 50 + (Math.log(h) / Math.log(4096)) * 110;
  const x0 = 130 - wBlock / 2;
  const bh = Math.min(22, 200 / blocks);
  const err = -Math.log(p);

  return (
    <Viz
      title="Large는 블록과 목록 길이만 키운다"
      caption="블록 수와 목록 길이(hidden size)를 마음대로 바꿔 보세요. 정답 칸의 비율 p는 따로 정한 값입니다. 오차의 식에는 p만 들어가므로 블록 수와 목록 길이를 바꿔도 식은 그대로입니다."
    >
      <Controls>
        <Slider label="블록 수" min={1} max={12} value={blocks} onChange={setBlocks} />
        <Slider label="목록 길이" min={0} max={HIDDEN.length - 1} value={hi} onChange={setHi} format={(v) => String(HIDDEN[v])} />
        <Slider label="정답 칸 비율 p" min={0.05} max={0.99} step={0.01} value={p} onChange={setP} format={(v) => fmt(v, 3)} />
      </Controls>
      <svg viewBox="0 0 480 250" className={s.svg} role="img" aria-label="블록을 여러 층 쌓아 정답 칸의 비율 p를 만들고, 오차는 p의 마이너스 로그다">
        <rect x={20} y={14} width={220} height={222} rx={10} fill="none" stroke="var(--ifm-color-emphasis-400)" strokeDasharray="5 4" />
        <text x={30} y={32} className={s.ts}>p를 만드는 쪽 (블록이 쌓인 곳)</text>
        {Array.from({length: blocks}).map((_, i) => (
          <g key={i}>
            <rect x={x0} y={222 - (i + 1) * (bh + 2)} width={wBlock} height={bh} rx={4} fill="var(--va)" fillOpacity="0.18" stroke="var(--va)" />
            {bh >= 14 ? (
              <text x={130} y={222 - (i + 1) * (bh + 2) + bh / 2 + 4} textAnchor="middle" className={s.ts}>{`블록 ${i + 1}`}</text>
            ) : null}
          </g>
        ))}
        <line x1={240} y1={125} x2={290} y2={125} stroke="var(--ifm-color-emphasis-600)" strokeWidth="2" />
        <polygon points="296,125 287,120 287,130" fill="var(--ifm-color-emphasis-600)" />
        <rect x={300} y={14} width={160} height={222} rx={10} fill="none" stroke="var(--vb)" />
        <text x={310} y={32} className={s.ts}>오차의 식</text>
        <text x={380} y={100} textAnchor="middle" className={s.t}>정답 칸 비율</text>
        <text x={380} y={124} textAnchor="middle" className={s.t} style={{fontWeight: 600}}>{`p = ${fmt(p, 3)}`}</text>
        <text x={380} y={158} textAnchor="middle" className={s.t}>오차 = -log p</text>
        <text x={380} y={182} textAnchor="middle" className={s.t} style={{fontWeight: 600}}>{`= ${fmt(err, 3)}`}</text>
      </svg>
      <Stats>
        <Stat label="블록 수" value={String(blocks)} />
        <Stat label="목록 길이" value={String(h)} />
        <Stat label="오차 식의 입력" value="p 하나" />
        <Stat label="오차" value={fmt(err, 3)} />
      </Stats>
      <Note>블록과 목록 길이는 p를 만드는 쪽에 있습니다. 어느 쪽으로 움직여도 학습이 보는 수는 정답 칸 비율의 -log입니다.</Note>
    </Viz>
  );
}
