import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const C = 16;

function Grid({x, y, rows, cols, fill, op, label, val}) {
  const cells = [];
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      cells.push(
        <rect key={`${i}-${j}`} x={x + j * C} y={y + i * C} width={C - 1.5} height={C - 1.5} rx={2} fill={fill} fillOpacity={op} stroke={fill} strokeOpacity="0.6">
          {val ? <title>{val(i, j)}</title> : null}
        </rect>,
      );
    }
  }
  return (
    <g>
      {cells}
      <text x={x + (cols * C) / 2} y={y - 6} textAnchor="middle" className={s.ts}>{label}</text>
    </g>
  );
}

export default function LoraCells() {
  const [h, setH] = useState(4);
  const [r, setR] = useState(1);
  const [q, setQ] = useState(false);
  const rr = Math.min(r, h);
  const train = 2 * h * rr;
  const frozen = h * h;
  const out = Array.from({length: h}).map((_, i) => (i === 0 ? 0.5 : 0));
  const verdict = train < frozen ? '줄었습니다' : train === frozen ? '줄지 않습니다 (같음)' : '오히려 많습니다';
  const wW = h * C;
  const xA = 30 + wW + 50;
  const xB = xA + rr * C + 40;
  const top = 30;

  return (
    <Viz
      title="LoRA: 얼린 행렬 옆에 폭이 좁은 곱만 학습"
      caption="hidden size h(원래 행렬 한 변의 칸 수)와 폭 r(곱하는 두 행렬의 좁은 변)을 바꿔 학습하는 칸 수를 보세요. 회색 칸은 얼려 둔 원래 행렬이고, 색 칸이 학습하는 칸입니다. 칸의 값은 글의 예(첫 칸만 1, 0.5)를 따른 설명용 값입니다."
    >
      <Controls>
        <Slider label="hidden size h (행렬 한 변의 칸 수)" min={2} max={8} value={h} onChange={(v) => { setH(v); if (r > v) setR(v); }} />
        <Slider label="폭 r (좁은 곱의 폭)" min={1} max={h} value={rr} onChange={setR} />
        <Btn on={q} onClick={() => setQ(!q)}>QLoRA로 보기</Btn>
      </Controls>
      <svg viewBox="0 0 560 190" className={s.svg} role="img" aria-label="얼린 h×h 행렬 옆에 h×r 행렬과 r×h 행렬이 더해진다">
        <Grid x={10} y={top} rows={h} cols={h} fill="var(--ifm-color-emphasis-500)" op={0.25} label={q ? `원래 ${h}×${h} (얼림, 4비트)` : `원래 ${h}×${h} (얼림)`} />
        <text x={10 + wW + 17} y={top + (h * C) / 2 + 5} textAnchor="middle" className={s.t}>+</text>
        <Grid x={xA} y={top} rows={h} cols={rr} fill="var(--vb)" op={0.5} label={`${h}×${rr}`} val={(i, j) => (i === j ? '1' : '0')} />
        <text x={xA + rr * C + 20} y={top + (h * C) / 2 + 5} textAnchor="middle" className={s.t}>×</text>
        <Grid x={xB} y={top} rows={rr} cols={h} fill="var(--vb)" op={0.5} label={`${rr}×${h}`} val={(i, j) => (i === 0 && j === 0 ? '0.5' : '0')} />
        <text x={10} y={175} className={s.ts}>
          {q ? '움직이는 색 칸은 16비트로 둡니다.' : '추론 때는 원래 출력에 곱의 결과를 더합니다.'}
        </text>
      </svg>
      <Stats>
        <Stat label="얼린 칸" value={String(frozen)} />
        <Stat label="학습하는 칸 (h×r + r×h)" value={String(train)} tone={train < frozen ? 'good' : train > frozen ? 'bad' : undefined} />
        <Stat label="입력 [1, 0, …]의 덧셈" value={`[${out.slice(0, 4).join(', ')}${h > 4 ? ', …' : ''}]`} />
      </Stats>
      <Note>
        h = 4일 때 폭 1이면 8칸으로 줄고, 폭 2이면 16칸으로 같고, 폭 4이면 32칸으로 얼린 16칸보다 많습니다. 학습하는 칸이 줄려면 2hr이 h의 제곱보다 작아야 합니다. 지금 값(h = {h}, r = {rr})에서는 학습 칸이 {verdict}.
      </Note>
    </Viz>
  );
}
