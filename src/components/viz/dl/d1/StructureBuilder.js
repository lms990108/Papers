import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {comma} from './dlmath';

const IN = 784;
const OUT = 10;
const CAP = 8; // 그림에 그리는 칸 수의 한계
const VW = 600;
const VH = 250;

const ys = (n) => {
  const k = Math.min(n, CAP);
  const gap = Math.min(22, 200 / Math.max(k, 1));
  return Array.from({length: k}, (_, i) => VH / 2 - 14 + (i - (k - 1) / 2) * gap);
};

export default function StructureBuilder() {
  const [layers, setLayers] = useState(1);
  const [width, setWidth] = useState(30);

  const sizes = [IN];
  for (let i = 0; i < layers; i += 1) sizes.push(width);
  sizes.push(OUT);
  const counts = [];
  for (let i = 0; i + 1 < sizes.length; i += 1) counts.push(sizes[i] * sizes[i + 1] + sizes[i + 1]);
  const total = counts.reduce((a, b) => a + b, 0);
  const xs = sizes.map((_, i) => 70 + (i * (VW - 140)) / (sizes.length - 1));

  return (
    <Viz
      title="구조를 고르면 파라미터 수가 정해진다"
      caption="입력 784와 출력 10은 고정이고, 가운데 구조만 고릅니다. 은닉은 입력과 출력 사이에 있는 가운데 층입니다. 784 → 30 → 10은 입력 칸 784개, 가운데 칸 30개, 출력 칸 10개라는 뜻입니다. 선 하나마다 가중치가 하나이고, 칸마다 바이어스가 하나입니다. 그림에는 칸을 8개까지만 그렸습니다. 784 → 30 → 10은 23,860개, 784 → 100 → 10은 79,510개로 본문과 같습니다."
    >
      <Controls>
        <Btn on={layers === 0} onClick={() => setLayers(0)}>
          784 → 10
        </Btn>
        <Btn on={layers === 1 && width === 30} onClick={() => {setLayers(1); setWidth(30);}}>
          784 → 30 → 10
        </Btn>
        <Btn on={layers === 1 && width === 100} onClick={() => {setLayers(1); setWidth(100);}}>
          784 → 100 → 10
        </Btn>
      </Controls>
      <Controls>
        {[0, 1, 2].map((l) => (
          <Btn key={l} on={layers === l} onClick={() => setLayers(l)}>
            은닉층 {l}개
          </Btn>
        ))}
        <Slider label="은닉 칸 수" min={1} max={300} value={width} onChange={setWidth} />
      </Controls>
      <svg className={s.svg} viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={`구조 ${sizes.join(' 다음 ')}의 칸과 선, 층마다의 파라미터 수`}>
        {sizes.slice(0, -1).map((n, c) => {
          const a = ys(n);
          const b = ys(sizes[c + 1]);
          return (
            <g key={c}>
              {a.map((y0, i) =>
                b.map((y1, j) => (
                  <line key={`${i}-${j}`} x1={xs[c] + 9} y1={y0} x2={xs[c + 1] - 9} y2={y1} stroke="var(--ifm-color-emphasis-400)" strokeWidth={0.8} />
                ))
              )}
              <text x={(xs[c] + xs[c + 1]) / 2} y={22} textAnchor="middle" className={s.t} style={{fontWeight: 600}}>
                {comma(counts[c])}개
              </text>
            </g>
          );
        })}
        {sizes.map((n, c) => (
          <g key={c}>
            {ys(n).map((y, i) => (
              <circle key={i} cx={xs[c]} cy={y} r={8} fill={c === 0 ? 'var(--va)' : c === sizes.length - 1 ? 'var(--vok)' : 'var(--vb)'} />
            ))}
            {n > CAP ? (
              <text x={xs[c]} y={VH - 28} textAnchor="middle" className={s.ts}>
                ⋮
              </text>
            ) : null}
            <text x={xs[c]} y={VH - 10} textAnchor="middle" className={s.t}>
              {c === 0 ? `입력 ${n}` : c === sizes.length - 1 ? `출력 ${n}` : `은닉 ${n}`}
            </text>
          </g>
        ))}
      </svg>
      <Stats>
        {counts.map((c, i) => (
          <Stat key={i} label={`${i + 1}층 ${sizes[i]} → ${sizes[i + 1]}`} value={comma(c)} />
        ))}
        <Stat label="파라미터 합" value={comma(total)} tone="good" />
      </Stats>
      <Note>학습은 이 선 위의 수를 고칠 뿐이고, 칸을 더하거나 줄이지 않습니다. 은닉 칸을 바꾸면 다른 모델입니다.</Note>
    </Viz>
  );
}
