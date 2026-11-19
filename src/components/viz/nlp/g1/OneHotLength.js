import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note, Bar, fmt, styles as s} from '../../Viz';

const SIZES = [4, 10, 30, 100, 300, 1000, 3000, 10000, 30000, 50000];
const HIDDEN = [10, 50, 100, 300];
const ID = 2; // 좋다의 번호
const nf = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function OneHotLength() {
  const [si, setSi] = useState(0);
  const [hi, setHi] = useState(2);
  const V = SIZES[si];
  const H = HIDDEN[hi];

  // 앞 8칸 + 말줄임 + 마지막 칸만 그린다. 작은 사전은 전부 그린다.
  const shown = V <= 12 ? Array.from({length: V}, (_, i) => i) : [0, 1, 2, 3, 4, 5, 6, 7, -1, V - 1];
  const CW = 40;
  const vw = shown.length * CW + 8;

  return (
    <Viz
      title="사전이 커지면 목록도 길어진다"
      caption="사전 크기를 올리면 원-핫 목록의 칸이 늘고, 1은 여전히 한 칸입니다. 같은 사전에 은닉 크기 H의 표를 두면 파라미터는 사전 크기 × H입니다. 사전 5만, H = 100이면 5,000,000개입니다."
    >
      <Controls>
        <Slider label="사전 크기" min={0} max={SIZES.length - 1} value={si} onChange={setSi} format={(v) => nf(SIZES[v])} />
        <Slider label="은닉 크기 H" min={0} max={HIDDEN.length - 1} value={hi} onChange={setHi} format={(v) => String(HIDDEN[v])} />
      </Controls>
      <svg viewBox={`0 0 ${vw} 56`} className={s.svg} style={{maxWidth: Math.min(620, vw * 1.8)}} role="img" aria-label={`길이 ${V}의 원-핫 목록. 좋다 번호 2의 칸만 1이다.`}>
        {shown.map((i, p) => {
          const x = 4 + p * CW;
          if (i === -1)
            return (
              <text key={p} x={x + CW / 2} y={34} textAnchor="middle" className={s.t}>
                ⋯
              </text>
            );
          const hot = i === ID;
          return (
            <g key={p}>
              <rect x={x} y={12} width={CW - 4} height={30} rx={4} fill={hot ? 'var(--vb)' : 'none'} fillOpacity={hot ? 0.25 : 0} stroke={hot ? 'var(--vb)' : 'var(--ifm-color-emphasis-400)'} />
              <text x={x + (CW - 4) / 2} y={32} textAnchor="middle" className={s.t}>
                {hot ? 1 : 0}
              </text>
              <text x={x + (CW - 4) / 2} y={53} textAnchor="middle" className={s.ts}>
                {i}
              </text>
            </g>
          );
        })}
      </svg>
      <Stats>
        <Stat label="목록의 길이" value={nf(V)} />
        <Stat label="0인 칸의 비율" value={`${fmt(((V - 1) / V) * 100, V >= 1000 ? 3 : 1)}%`} />
        <Stat label="임베딩 표 파라미터 (V × H)" value={nf(V * H)} />
      </Stats>
      <Bar label="원-핫 길이 V" value={V} max={50000} color="var(--va)" text={nf(V)} />
      <Bar label="임베딩 길이 H" value={H} max={50000} color="var(--vb)" text={String(H)} />
      <Note>
        {V > H
          ? `원-핫은 ${nf(V)}칸 중 한 칸만 1이고 나머지는 0입니다. 임베딩은 이것을 ${H}개의 수로 줄입니다.`
          : '사전이 은닉 크기보다 작으면 원-핫이 더 짧습니다. 사전이 커질 때 차이가 벌어집니다.'}
      </Note>
    </Viz>
  );
}
