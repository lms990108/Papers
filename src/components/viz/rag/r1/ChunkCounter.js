import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note, styles as s} from '../../Viz';

const W = 560;
const f = (n) => n.toLocaleString('en-US');
const ROWS = 3;
const COLORS = ['var(--va)', 'var(--vb)', 'var(--vc)'];
const MAX_DRAW = 600;

export const chunkCount = (n, size, overlap) => {
  const stride = size - overlap;
  return n <= size ? 1 : 1 + Math.ceil((n - size) / stride);
};

export default function ChunkCounter() {
  const [n, setN] = useState(10000);
  const [size, setSize] = useState(500);
  const [ov, setOv] = useState(0);
  const overlap = Math.min(ov, size - 10);
  const stride = size - overlap;
  const count = chunkCount(n, size, overlap);
  const chunks = [];
  for (let i = 0; i < count && i < MAX_DRAW; i += 1) {
    const a = i * stride;
    chunks.push({a, b: Math.min(n, a + size)});
  }
  let stored = 0;
  for (let i = 0; i < count; i += 1) stored += Math.min(n, i * stride + size) - i * stride;
  const X = (t) => 10 + (t / n) * (W - 20);
  const H = 24 + ROWS * 18;

  return (
    <Viz
      title="청크 수 세기"
      caption="문서 길이, 청크 크기, 오버랩을 바꿔 보세요. 기본값(문서 10,000 토큰, 청크 500, 오버랩 0)에서 20개가 나옵니다. 오버랩을 50으로 올리면 23개입니다. 청크 수 = 1 + 올림((문서 − 청크 크기) / (청크 크기 − 오버랩))이고, 문서가 청크 한 개보다 짧으면 1개입니다."
    >
      <Controls>
        <Slider label="문서 길이(토큰)" min={1000} max={20000} step={500} value={n} onChange={setN} format={f} />
        <Slider label="청크 크기" min={100} max={2000} step={50} value={size} onChange={setSize} />
        <Slider label="오버랩" min={0} max={Math.min(size - 10, 1000)} step={10} value={overlap} onChange={setOv} />
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label={`문서 ${n} 토큰을 청크 ${count}개로 나눈 모습`}>
        <rect x={10} y={4} width={W - 20} height={10} fill="var(--ifm-color-emphasis-200)" />
        <text x={10} y={H - 4} className={s.ts}>0</text>
        <text x={W - 10} y={H - 4} textAnchor="end" className={s.ts}>{f(n)} 토큰</text>
        {chunks.map((c, i) => (
          <rect
            key={i}
            x={X(c.a)}
            y={20 + (i % ROWS) * 18}
            width={Math.max(0.8, X(c.b) - X(c.a) - 0.6)}
            height={14}
            fill={COLORS[i % ROWS]}
            fillOpacity="0.45"
            stroke={COLORS[i % ROWS]}
            strokeWidth="0.6"
          />
        ))}
      </svg>
      <Stats>
        <Stat label="청크 수" value={`${f(count)}개`} />
        <Stat label="청크 간격(크기 − 오버랩)" value={`${f(stride)} 토큰`} />
        <Stat label="저장되는 토큰 합" value={f(stored)} />
        <Stat label="문서 대비 저장량" value={`${(stored / n).toFixed(2)}배`} tone={stored > n ? 'bad' : 'good'} />
      </Stats>
      <Note>
        {overlap === 0
          ? '오버랩이 0이면 청크가 서로 겹치지 않아 저장량이 문서와 같습니다(나눗셈 그대로).'
          : '오버랩만큼 같은 토큰이 두 청크에 저장됩니다. 경계 문장은 지켜 주지만 청크 수와 저장량이 늘어납니다.'}
        {count > MAX_DRAW ? ` 그림에는 처음 ${MAX_DRAW}개만 그렸습니다.` : ''}
      </Note>
    </Viz>
  );
}
