import React from 'react';
import {styles as s} from '../../Viz';
import {outSize} from './util';

// 한 줄 칸(패딩 포함) 위에 창이 놓이는 자리를 겹쳐 그린다. 합성곱과 풀링이 함께 쓴다.
export default function Strip({N = 8, K = 3, S = 2, P = 0}) {
  const np = N + 2 * P;
  const O = outSize(N, K, S, P);
  const cw = Math.min(40, 620 / np);
  const left = (640 - np * cw) / 2;
  const rowH = O > 0 ? Math.max(3, Math.min(12, Math.floor(170 / O) - 1)) : 0;
  const used = O > 0 ? (O - 1) * S + K : 0;
  const waste = O > 0 ? np - used : np;
  const H = 52 + O * (rowH + 1) + 26;
  return (
    <svg viewBox={`0 0 640 ${H}`} className={s.svg} role="img" aria-label={`폭 ${np}칸 위에 창 ${K}칸을 ${S}칸씩 옮기면 ${O}자리, 버려지는 칸 ${waste}개`}>
      {Array.from({length: np}, (_, i) => {
        const pad = i < P || i >= P + N;
        const lost = O > 0 && i >= used;
        return (
          <g key={i}>
            <rect x={left + i * cw} y={8} width={cw} height={26} fill={lost ? 'color-mix(in srgb, var(--vbad) 30%, transparent)' : pad ? 'var(--ifm-color-emphasis-100)' : 'none'} stroke="var(--ifm-color-emphasis-500)" strokeDasharray={pad ? '3 2' : undefined} />
            {cw >= 14 ? (
              <text x={left + i * cw + cw / 2} y={26} textAnchor="middle" className={s.ts}>{pad ? 0 : i - P}</text>
            ) : null}
          </g>
        );
      })}
      {Array.from({length: O}, (_, i) => (
        <rect key={i} x={left + i * S * cw} y={44 + i * (rowH + 1)} width={K * cw} height={rowH} rx={2} fill={`color-mix(in srgb, ${i % 2 ? 'var(--vb)' : 'var(--va)'} 38%, transparent)`} stroke={i % 2 ? 'var(--vb)' : 'var(--va)'} />
      ))}
      <text x={left} y={H - 8} className={s.ts}>
        {O === 0 ? '창이 들어갈 자리가 없습니다' : `창 ${O}자리 / 마지막 창이 끝나는 칸 ${used} / 버려지는 칸 ${waste}개${waste > 0 ? ' (빨간 칸)' : ''}`}
      </text>
    </svg>
  );
}
