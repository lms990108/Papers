import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {outSize} from './util';

const N = 32;
const COL = ['var(--va)', 'var(--vb)', 'var(--vc)', 'var(--vok)', 'var(--vbad)'];
const NAMES = ['C1', 'S2', 'C3', 'S4', 'C5'];

// r += (K - 1) * j,  j *= S
function chain(K, p) {
  const spec = [[K, 1], [p, p], [K, 1], [p, p], [K, 1]];
  let r = 1;
  let j = 1;
  let n = N;
  return spec.map(([k, st], i) => {
    r += (k - 1) * j;
    j *= st;
    n = outSize(n, k, st, 0);
    return {name: NAMES[i], K: k, S: st, r, j, n};
  });
}

export default function ReceptiveField() {
  const [K, setK] = useState(5);
  const [p, setP] = useState(2);
  const rows = chain(K, p);
  const plain = chain(K, 1);
  const cs = 10;

  return (
    <Viz
      title="층마다 한 유닛이 보는 원본 범위(수용장)"
      caption="합성곱 창 K와 서브샘플링 창을 바꿔 보세요. 서브샘플링 창 1은 서브샘플링이 없는 것과 같습니다. 정사각형은 32×32 입력 한가운데 유닛의 수용장입니다. 기본값(5, 2)은 본문의 5, 6, 14, 16, 32이고, 서브샘플링을 빼면 5, 9, 13입니다."
    >
      <Controls>
        <Slider label="합성곱 창 K" min={1} max={7} value={K} onChange={setK} />
        <Slider label="서브샘플링 창" min={1} max={4} value={p} onChange={setP} format={(v) => (v === 1 ? '1 (없음)' : `${v}×${v}`)} />
        <Btn onClick={() => { setK(5); setP(2); }}>LeNet-5</Btn>
        <Btn onClick={() => setP(1)}>서브샘플링 빼기</Btn>
      </Controls>
      <div className={s.two}>
        <svg viewBox={`0 0 ${N * cs + 4} ${N * cs + 4}`} className={s.svg} style={{maxWidth: 340}} role="img" aria-label={`입력 ${N}×${N} 위에 층별 수용장 ${rows.map((r) => `${r.name} ${r.r}`).join(', ')}`}>
          <rect x={2} y={2} width={N * cs} height={N * cs} fill="none" stroke="var(--ifm-color-emphasis-500)" strokeWidth={2} />
          {rows.map((r, i) => {
            const w = Math.min(r.r, N);
            const o = (N - w) / 2;
            return (
              <g key={r.name}>
                <rect x={2 + o * cs} y={2 + o * cs} width={w * cs} height={w * cs} fill={COL[i]} fillOpacity={0.08} stroke={COL[i]} strokeWidth={2.2} strokeDasharray={i % 2 ? '6 3' : undefined} />
                <text x={2 + o * cs + 4} y={2 + o * cs + 14 + (i % 2) * 14} className={s.ts} style={{fill: COL[i], fontWeight: 700}}>{r.name}</text>
              </g>
            );
          })}
        </svg>
        <div>
          <table className={s.grid}>
            <thead>
              <tr><th>층</th><th>창 K</th><th>보폭 S</th><th>수용장 한 변 r</th><th>간격 j</th><th>맵 한 변</th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const off = i % 2 === 1 && p === 1;
                return (
                  <tr key={r.name}>
                    <td style={{color: COL[i], fontWeight: 700}}>{r.name}{off ? ' (없음)' : ''}</td>
                    <td>{r.K}</td>
                    <td>{r.S}</td>
                    <td className={s.cellOn}>{r.r}</td>
                    <td>{r.j}</td>
                    <td>{r.n > 0 ? r.n : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Note>r ← r + (K − 1)·j 로 늘고, 보폭이 있으면 j ← j·S 로 이후 층의 간격 단위가 커집니다.</Note>
        </div>
      </div>
      <Stats>
        <Stat label="C3 수용장: 서브샘플링 있음 / 없음" value={`${rows[2].r} / ${plain[2].r}`} />
        <Stat label="C5 수용장: 있음 / 없음" value={`${rows[4].r} / ${plain[4].r}`} tone={rows[4].r >= N ? 'good' : undefined} />
      </Stats>
      <Note>
        {rows[4].r >= N
          ? `C5의 수용장은 ${rows[4].r}×${rows[4].r}로 입력 전체(${N}×${N})를 덮습니다. 그래서 C5는 “어디에”라는 좌표 없이 “무엇이 있는지”만 낼 수 있습니다.`
          : `C5의 수용장 ${rows[4].r}×${rows[4].r}은 입력 ${N}×${N}을 다 덮지 못합니다.`}
        {' '}좌표를 줄이는 서브샘플링이 끼면 수용장이 훨씬 빨리 넓어집니다.
        {rows.some((r) => r.n <= 0) ? ' 창이 맵보다 커서 입력이 어느 층에서 바닥나는 설정입니다(맵 한 변 −).' : ''}
      </Note>
    </Viz>
  );
}
