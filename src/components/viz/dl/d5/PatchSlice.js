import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, fmt, styles as s} from '../../Viz';

// 본문의 작은 예와 같은 값: 흑백 4×4 이미지, 패치 한 변 P = 2
const IMG = [
  [1, 2, 5, 6],
  [3, 4, 7, 8],
  [9, 0, 3, 4],
  [1, 2, 5, 6],
];
const P = 2;
const COLORS = ['var(--va)', 'var(--vb)', 'var(--vc)', 'var(--vok)'];
const MARK = ['①', '②', '③', '④'];
const CELL = 40;
const GX = 24;
const GY = 34;
const W = 600;
const H = 214;

const STEPS = [
  '흑백 4×4 이미지입니다. 칸(픽셀)마다 값이 하나 있습니다.',
  '패치 한 변 P = 2로 자릅니다. 패치 하나가 가로 2칸, 세로 2칸이어서 한 줄에 4 ÷ 2 = 2개, 패치는 모두 4개입니다.',
  '패치마다 안의 값을 왼쪽에서 오른쪽, 위에서 아래 순서로 한 줄로 펼칩니다. 이 줄이 선형 투영의 입력입니다.',
  '같은 행렬 E(윗줄 평균, 아랫줄 평균)를 곱하면 패치마다 길이 2인 token 벡터가 하나씩 나옵니다. 이 4개가 트랜스포머에 들어가는 token입니다.',
];

const patchOf = (r, c) => Math.floor(r / P) * 2 + Math.floor(c / P);
const flat = (p) => {
  const pr = Math.floor(p / 2) * P;
  const pc = (p % 2) * P;
  return [IMG[pr][pc], IMG[pr][pc + 1], IMG[pr + 1][pc], IMG[pr + 1][pc + 1]];
};
const tok = (p) => {
  const [a, b, c, d] = flat(p);
  return [(a + b) / 2, (c + d) / 2];
};

export default function PatchSlice() {
  const [st, setSt] = useState(1);
  const cut = st >= 1;
  const rowY = (p) => GY + 8 + p * 40;

  return (
    <Viz
      title="4×4 이미지를 패치로 자르고 token으로 만들기"
      caption="패치 한 변(P)은 패치 하나의 가로(= 세로)에 든 칸 수입니다. 색은 같은 패치를 뜻합니다. 행렬 E는 계산이 보이게 고른 값이고, 실제로는 학습으로 정해집니다."
    >
      <Controls>
        <Btn onClick={() => setSt(Math.max(0, st - 1))}>이전</Btn>
        <Btn onClick={() => setSt(Math.min(STEPS.length - 1, st + 1))}>다음</Btn>
        <Btn onClick={() => setSt(STEPS.length - 1)}>끝까지</Btn>
        <Btn onClick={() => setSt(0)}>처음으로</Btn>
        <span className={s.ts}>{st + 1} / {STEPS.length}단계</span>
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="4×4 이미지를 2×2 패치 네 개로 자르고 펼쳐 token으로 바꾸는 과정">
        <text x={GX} y={16} className={s.ts}>이미지 (4×4)</text>
        {IMG.map((row, r) =>
          row.map((v, c) => {
            const p = patchOf(r, c);
            return (
              <g key={`${r}-${c}`}>
                <rect
                  x={GX + c * CELL}
                  y={GY + r * CELL}
                  width={CELL}
                  height={CELL}
                  fill={cut ? COLORS[p] : 'none'}
                  fillOpacity={cut ? 0.2 : 0}
                  stroke="var(--ifm-color-emphasis-400)"
                  strokeWidth={1}
                />
                <text
                  x={GX + c * CELL + CELL / 2}
                  y={GY + r * CELL + CELL / 2 + 5}
                  textAnchor="middle"
                  className={s.t}
                  style={{fontWeight: 600}}
                >
                  {v}
                </text>
              </g>
            );
          })
        )}
        {cut
          ? [0, 1, 2, 3].map((p) => {
              const x = GX + (p % 2) * P * CELL;
              const y = GY + Math.floor(p / 2) * P * CELL;
              return (
                <g key={p}>
                  <rect x={x} y={y} width={P * CELL} height={P * CELL} fill="none" stroke={COLORS[p]} strokeWidth={3} />
                  <text x={x + 6} y={y + 15} style={{fill: COLORS[p], fontSize: 14, fontWeight: 700}}>{MARK[p]}</text>
                </g>
              );
            })
          : null}
        {cut ? (
          <g>
            <line x1={GX} y1={GY - 6} x2={GX + P * CELL} y2={GY - 6} stroke="var(--ifm-font-color-base)" strokeWidth={1.5} />
            <line x1={GX} y1={GY - 10} x2={GX} y2={GY - 2} stroke="var(--ifm-font-color-base)" strokeWidth={1.5} />
            <line x1={GX + P * CELL} y1={GY - 10} x2={GX + P * CELL} y2={GY - 2} stroke="var(--ifm-font-color-base)" strokeWidth={1.5} />
            <text x={GX + P * CELL + 8} y={GY - 3} className={s.ts}>패치 한 변 P = {P}칸</text>
          </g>
        ) : null}

        {st >= 2 ? (
          <g>
            <text x={250} y={16} className={s.ts}>펼친 값 (4개)</text>
            {[0, 1, 2, 3].map((p) => (
              <g key={p}>
                <text x={250} y={rowY(p) + 20} style={{fill: COLORS[p], fontSize: 14, fontWeight: 700}}>{MARK[p]}</text>
                <text x={272} y={rowY(p) + 20} className={s.t} style={{fontWeight: 600}}>[{flat(p).join(', ')}]</text>
              </g>
            ))}
          </g>
        ) : null}

        {st >= 3 ? (
          <g>
            <text x={430} y={16} className={s.ts}>× E → token (길이 2)</text>
            {[0, 1, 2, 3].map((p) => (
              <g key={p}>
                <text x={430} y={rowY(p) + 20} className={s.ts}>→</text>
                <text x={452} y={rowY(p) + 20} className={s.t} style={{fontWeight: 700, fill: COLORS[p]}}>
                  [{tok(p).map((v) => fmt(v, 1)).join(', ')}]
                </text>
              </g>
            ))}
          </g>
        ) : null}
      </svg>
      <Note>{STEPS[st]}</Note>
    </Viz>
  );
}
