import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, fmt, styles as s} from '../../Viz';

const comb = (n, k) => {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i += 1) r = (r * (n - k + i)) / i;
  return Math.round(r);
};
const g = (x) => fmt(x, 3).replace(/0+$/, '').replace(/\.$/, '.0');
const passAt = (n, c, k) => (comb(n, k) > 0 ? 1 - comb(n - c, k) / comb(n, k) : NaN);

function subsets(n, k) {
  const out = [];
  for (let m = 0; m < 1 << n; m += 1) {
    const ids = [];
    for (let i = 0; i < n; i += 1) if (m & (1 << i)) ids.push(i);
    if (ids.length === k) out.push(ids);
  }
  return out;
}

export default function PassAtK() {
  const [n, setN] = useState(5);
  const [c, setC] = useState(2);
  const [k, setK] = useState(3);

  const setNn = (v) => {
    setN(v);
    setC(Math.min(c, v));
    setK(Math.min(k, v));
  };
  const total = comb(n, k);
  const bad = comb(n - c, k);
  const p = passAt(n, c, k);
  const list = subsets(n, k);

  return (
    <Viz
      title="pass@k: 뽑기 n번 중 c번 맞았을 때, k번을 고르면"
      caption="앞쪽 c개가 맞은 뽑기이고 나머지는 틀린 뽑기입니다. 아래 칸 하나가 'n개 중 k개를 고르는 경우' 하나입니다. 초록은 하나 이상 맞은 경우, 빨강은 틀린 것만 고른 경우입니다. 기본값 5, 2, 3은 원문의 값입니다."
    >
      <Controls>
        <Slider label="뽑은 횟수 n" min={1} max={8} value={n} onChange={setNn} />
        <Slider label="맞은 횟수 c" min={0} max={n} value={c} onChange={setC} />
        <Slider label="고르는 수 k" min={1} max={n} value={k} onChange={setK} />
      </Controls>
      <Controls>
        <Btn
          onClick={() => {
            setN(5);
            setC(2);
            setK(3);
          }}
        >
          원문 (5, 2, 3)
        </Btn>
        <Btn
          onClick={() => {
            setN(5);
            setC(0);
            setK(3);
          }}
        >
          온도 0이고 오답 (c=0)
        </Btn>
        <Btn
          onClick={() => {
            setN(5);
            setC(5);
            setK(3);
          }}
        >
          전부 정답 (c=n)
        </Btn>
      </Controls>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, margin: '4px 0 10px'}}>
        {Array.from({length: n}, (_, i) => (
          <span
            key={i}
            className={s.stat}
            style={{
              minWidth: 54,
              textAlign: 'center',
              border: `2px solid ${i < c ? 'var(--vok)' : 'var(--vbad)'}`,
            }}
          >
            <span>{i + 1}번째</span>
            <b className={i < c ? s.good : s.bad}>{i < c ? '맞음' : '틀림'}</b>
          </span>
        ))}
      </div>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 5, fontSize: '0.78rem'}} aria-label="고를 수 있는 모든 경우">
        {list.map((ids, j) => {
          const hit = ids.some((i) => i < c);
          return (
            <span
              key={j}
              style={{
                padding: '2px 7px',
                borderRadius: 6,
                border: `1px solid ${hit ? 'var(--vok)' : 'var(--vbad)'}`,
                background: `color-mix(in srgb, ${hit ? 'var(--vok)' : 'var(--vbad)'} 14%, transparent)`,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {ids.map((i) => i + 1).join(' ')} {hit ? '✓' : '✗'}
            </span>
          );
        })}
      </div>
      <Stats>
        <Stat label={`고르는 경우의 수 C(${n},${k})`} value={String(total)} />
        <Stat label={`틀린 것만 고르는 경우 C(${n - c},${k})`} value={String(bad)} />
        <Stat label={`pass@${k}`} value={g(p)} tone={p >= 0.5 ? 'good' : 'bad'} />
        <Stat label="pass@1 = c/n" value={g(c / n)} />
      </Stats>
      <Note>
        pass@{k} = 1 − {bad}/{total} = {g(p)}.{' '}
        {n - c < k
          ? `틀린 횟수(${n - c})가 k(${k})보다 작아서 틀린 것만 고를 수 없고, pass@k는 1입니다.`
          : c === 0
          ? 'c가 0이면 어떤 k에서도 0입니다. 온도 0에서 그 하나의 답이 틀리면 k를 키워도 고를 답이 그 오답뿐입니다.'
          : 'k를 키우면 틀린 것만 고르는 경우가 줄어듭니다.'}
      </Note>
      {Array.from({length: n}, (_, i) => i + 1).map((kk) => (
        <Bar
          key={kk}
          label={`pass@${kk}`}
          value={passAt(n, c, kk)}
          max={1}
          color={kk === k ? 'var(--vb)' : 'var(--va)'}
          text={g(passAt(n, c, kk))}
        />
      ))}
    </Viz>
  );
}
