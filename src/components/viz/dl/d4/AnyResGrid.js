import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const mk = (on) => Array.from({length: 16}, (_, i) => (on(Math.floor(i / 4), i % 4) ? 1 : 0));
const PRESETS = [
  {name: '왼쪽 위 사분면만 밝게', v: mk((r, c) => r < 2 && c < 2)},
  {name: '오른쪽 아래 사분면만 밝게', v: mk((r, c) => r >= 2 && c >= 2)},
  {name: '모두 켜기', v: mk(() => true)},
  {name: '모두 끄기', v: mk(() => false)},
];
const QN = ['왼쪽 위', '오른쪽 위', '왼쪽 아래', '오른쪽 아래'];

// 4x4 칸에서 q번째 사분면의 2x2 조각 [왼위, 오위, 왼아래, 오아래]
const patch = (v, q) => {
  const r0 = q < 2 ? 0 : 2;
  const c0 = q % 2 === 0 ? 0 : 2;
  return [v[r0 * 4 + c0], v[r0 * 4 + c0 + 1], v[(r0 + 1) * 4 + c0], v[(r0 + 1) * 4 + c0 + 1]];
};
const proj = (p) => [0.5 * p[0], 0.5 * p[2]];
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

export default function AnyResGrid() {
  const [v, setV] = useState(PRESETS[0].v);
  const [mode, setMode] = useState('patch');

  const patches = [0, 1, 2, 3].map((q) => patch(v, q));
  const qm = patches.map(mean);
  const pooled = mean(v);
  const tokens = mode === 'patch' ? 4 : 1;

  return (
    <Viz
      title="4×4 그림을 token으로: 한 칸으로 평균내기와 2×2 조각 나누기"
      caption="projector는 조각을 길이 2인 그림 token으로 줄이는 행렬입니다. 칸을 눌러 밝기를 바꾸세요. 한 칸으로 평균내면 어느 사분면이 밝았는지 사라지고, 조각을 유지하면 그 정보가 token 자리에 남습니다. 조각마다 projector(첫째·셋째 칸 × 0.5)를 통과시킨 token도 함께 보입니다."
    >
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p.name} on={p.v.join() === v.join()} onClick={() => setV(p.v)}>
            {p.name}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Btn on={mode === 'pool'} onClick={() => setMode('pool')}>한 칸으로 평균내기</Btn>
        <Btn on={mode === 'patch'} onClick={() => setMode('patch')}>2×2 조각 네 개 유지</Btn>
      </Controls>
      <div className={s.two} style={{alignItems: 'start'}}>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 44px)', gap: 3, justifyContent: 'center'}}>
          {v.map((x, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${Math.floor(i / 4) + 1}행 ${(i % 4) + 1}열, 밝기 ${x}`}
              onClick={() => setV(v.map((y, j) => (j === i ? 1 - y : y)))}
              style={{
                height: 44,
                borderRadius: 6,
                border: '1px solid var(--vb)',
                background: x ? 'var(--vb)' : 'transparent',
                color: x ? '#fff' : 'var(--ifm-font-color-base)',
                fontWeight: 600,
                cursor: 'pointer',
                marginRight: i % 4 === 1 ? 8 : 0,
                marginBottom: Math.floor(i / 4) === 1 ? 8 : 0,
              }}
            >
              {x}
            </button>
          ))}
        </div>
        <div>
          {mode === 'pool' ? (
            <div>
              <Stats>
                <Stat label="사분면 평균 (왼쪽 위, 오른쪽 위, 왼쪽 아래, 오른쪽 아래)" value={qm.map((x) => fmt(x, 2)).join(', ')} />
                <Stat label="네 수를 평균낸 한 칸" value={fmt(pooled, 2)} />
                <Stat label="token 수" value="1개" />
              </Stats>
              <p className={s.note}>어느 사분면이 밝았는지는 이 한 수에 남지 않습니다. 왼쪽 위만 밝은 그림과 오른쪽 아래만 밝은 그림이 같은 0.25입니다.</p>
            </div>
          ) : (
            <table className={s.grid}>
              <thead>
                <tr><th>조각</th><th>밝기 평균</th><th>projector 뒤 token</th></tr>
              </thead>
              <tbody>
                {patches.map((p, q) => (
                  <tr key={q} className={qm[q] > 0 ? s.cellOn : undefined}>
                    <td>{QN[q]}</td>
                    <td>{fmt(qm[q], 2)}</td>
                    <td>[{proj(p).map((x) => fmt(x, 2)).join(', ')}]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Stats>
        <Stat label="언어 모델이 읽는 token (prefill)" value={`${tokens}개`} />
        <Stat label="1개일 때보다 연산" value={`${tokens}배`} tone={tokens > 1 ? 'bad' : 'good'} />
      </Stats>
      <Note>
        조각을 유지하면 위치가 남지만 token이 늘어납니다. token이 1개에서 4개로 늘면 prefill의 연산도 token 수에 비례해 늘어서, token 수가 4배이면 그 구간의 연산도 4배입니다.
      </Note>
    </Viz>
  );
}
