import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const CELLS = 16; // 4x4 행렬의 칸
const PER_TOKEN = 8; // 키 4개 + 값 4개

export default function KvCacheGrowth() {
  const [m, setM] = useState(4);
  const [t, setT] = useState(1);
  const [gone, setGone] = useState(false);
  const L = m + t;

  const withCache = t === 0 ? 2 * m * CELLS : 2 * CELLS;
  const without = 2 * L * CELLS;
  let accWith = 2 * m * CELLS;
  let accWithout = 2 * m * CELLS;
  for (let j = 1; j <= t; j += 1) {
    accWith += 2 * CELLS;
    accWithout += 2 * (m + j) * CELLS;
  }
  const readCache = t === 0 ? 0 : PER_TOKEN * L;

  return (
    <Viz
      title="KV 캐시가 쌓이는 모습"
      caption="token마다 키 4개와 값 4개(수 8개)가 남습니다. 프롬프트 token 수와 decode 횟수를 바꾸며 캐시 크기와, 캐시가 없을 때 다시 해야 하는 연산을 비교해 보세요."
    >
      <Controls>
        <Slider label="프롬프트 token 수" min={1} max={8} value={m} onChange={setM} />
        <Slider label="decode 횟수" min={0} max={8} value={t} onChange={setT} />
        <Btn on={gone} onClick={() => setGone(!gone)}>메모리 부족: 캐시 지우기</Btn>
      </Controls>
      <svg viewBox="0 0 724 150" className={s.svg} role="img" aria-label="token마다 키와 값이 캐시에 한 칸씩 쌓인다">
        {Array.from({length: L}).map((_, i) => {
          const x = 10 + i * 44;
          const prompt = i < m;
          return (
            <g key={i}>
              <text x={x + 18} y={16} textAnchor="middle" className={s.ts}>{i + 1}</text>
              <rect x={x} y={24} width={36} height={36} rx={4} fill={gone ? 'none' : 'var(--va)'} fillOpacity={gone ? 0 : 0.35} stroke="var(--va)" strokeDasharray={gone ? '3 3' : undefined} />
              <text x={x + 18} y={46} textAnchor="middle" className={s.ts}>키 4</text>
              <rect x={x} y={64} width={36} height={36} rx={4} fill={gone ? 'none' : 'var(--vb)'} fillOpacity={gone ? 0 : 0.35} stroke="var(--vb)" strokeDasharray={gone ? '3 3' : undefined} />
              <text x={x + 18} y={86} textAnchor="middle" className={s.ts}>값 4</text>
              <text x={x + 18} y={118} textAnchor="middle" className={s.ts}>{prompt ? '입력' : '출력'}</text>
            </g>
          );
        })}
        <text x={10} y={142} className={s.ts}>입력 = prefill에서 만든 token, 출력 = decode로 이어 쓴 token</text>
      </svg>
      <Stats>
        <Stat label="token 수" value={String(L)} />
        <Stat label="캐시에 있는 수" value={String(gone ? 0 : PER_TOKEN * L)} />
        <Stat label="이번 연산 (캐시 있음)" value={String(withCache)} tone="good" />
        <Stat label="이번 연산 (캐시 없음)" value={String(without)} tone={t > 0 ? 'bad' : undefined} />
        <Stat label="누적 연산 (캐시 있음)" value={String(accWith)} />
        <Stat label="누적 연산 (캐시 없음)" value={String(accWithout)} />
      </Stats>
      <Note>
        {gone
          ? `캐시를 지우면 다음 칸을 만들기 전에 이 요청의 prefill부터 다시 합니다(KV recomputation). ${L}token이라 연산 ${2 * L * CELLS}번입니다.`
          : t === 0
            ? 'prefill이 막 끝난 상태입니다. 캐시에는 프롬프트 token의 키와 값이 모두 있고, decode를 하지 않았으므로 캐시 읽기는 아직 없습니다.'
            : `이번 decode는 가중치 16칸에 더해 캐시 ${readCache}개를 읽습니다. 캐시가 있으면 연산은 32번이지만, 없으면 앞 token의 곱까지 다시 해서 ${without}번입니다.`}
      </Note>
    </Viz>
  );
}
