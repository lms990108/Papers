import React, {useMemo, useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {mulberry32} from '../../annSim';

const NS = [10, 20, 40, 100];
const W = 480;
const L = 24;
const R = 24;
const X = (v) => L + v * (W - L - R);

// 진짜 정확도 0.5인 후보 K개 각각을 n개 문장으로 재었을 때, 최댓값 정확도의 기댓값
function expectedMax(n, K) {
  const cdf = [];
  let c = Math.pow(0.5, n);
  let acc = c;
  cdf.push(acc);
  for (let k = 1; k <= n; k += 1) {
    c = (c * (n - k + 1)) / k;
    acc += c;
    cdf.push(acc);
  }
  let e = 0;
  let prev = 0;
  for (let k = 0; k <= n; k += 1) {
    const cur = Math.pow(Math.min(1, cdf[k]), K);
    e += k * (cur - prev);
    prev = cur;
  }
  return e / n;
}

function Strip({title, vals, pick, y}) {
  const seen = {};
  return (
    <g>
      <text x={L} y={y - 44} className={s.ts}>{title}</text>
      <line x1={X(0)} y1={y} x2={X(1)} y2={y} stroke="var(--ifm-color-emphasis-400)" />
      <line x1={X(0.5)} y1={y - 40} x2={X(0.5)} y2={y} stroke="var(--vgrid)" strokeDasharray="3 3" />
      {vals.map((v, i) => {
        const key = Math.round(v * 1000);
        seen[key] = (seen[key] || 0) + 1;
        const row = seen[key] - 1;
        const on = i === pick;
        return <circle key={i} cx={X(v) + Math.floor(row / 4) * 7} cy={y - 7 - (row % 4) * 8} r={on ? 6 : 3.5} fill={on ? 'var(--vb)' : 'var(--va)'} fillOpacity={on ? 1 : 0.6} />;
      })}
      {[0, 0.5, 1].map((v) => (
        <text key={v} x={X(v)} y={y + 14} textAnchor="middle" className={s.ts}>{v}</text>
      ))}
    </g>
  );
}

export default function SelectionBias() {
  const [K, setK] = useState(20);
  const [ni, setNi] = useState(1);
  const [seed, setSeed] = useState(1);
  const n = NS[ni];

  const trial = useMemo(() => {
    const r = mulberry32(seed * 7919 + K * 31 + n);
    const acc = () => {
      let h = 0;
      for (let i = 0; i < n; i += 1) if (r() < 0.5) h += 1;
      return h / n;
    };
    const val = [];
    const test = [];
    for (let i = 0; i < K; i += 1) val.push(acc());
    for (let i = 0; i < K; i += 1) test.push(acc());
    let best = 0;
    val.forEach((v, i) => {
      if (v > val[best]) best = i;
    });
    return {val, test, best};
  }, [K, n, seed]);

  const em = expectedMax(n, K);

  return (
    <Viz
      title="찍는 것과 같은 후보도 많이 고르면 점수가 부풀려집니다"
      caption="진짜 정확도가 모두 0.5인 후보 K개를 문장 n개로 재어 가장 높은 것을 고릅니다. 위 줄은 후보들의 검증 점수, 아래 줄은 같은 후보를 새 시험으로 잰 점수입니다. 주황 점이 고른 후보입니다."
    >
      <Controls>
        <Slider label="후보 수 K" min={1} max={50} step={1} value={K} onChange={setK} />
        <Slider label="문장 수 n" min={0} max={NS.length - 1} step={1} value={ni} onChange={setNi} format={() => String(n)} />
        <Btn onClick={() => setSeed(seed + 1)}>한 번 더 해 보기</Btn>
        <Btn on={K === 20 && n === 20} onClick={() => {setK(20); setNi(1);}}>원문 설정 (20, 20)</Btn>
      </Controls>
      <svg viewBox={'0 0 ' + W + ' 190'} className={s.svg} role="img" aria-label="후보들의 검증 점수와 같은 후보의 새 시험 점수">
        <Strip title="후보 K개의 검증 점수" vals={trial.val} pick={trial.best} y={70} />
        <Strip title="같은 후보들의 새 시험 점수" vals={trial.test} pick={trial.best} y={160} />
      </svg>
      <Stats>
        <Stat label="고른 후보의 검증 점수 (이번 시도)" value={fmt(trial.val[trial.best], 3)} />
        <Stat label="그 후보의 새 시험 점수 (이번 시도)" value={fmt(trial.test[trial.best], 3)} />
        <Stat label="고른 점수의 기댓값 (정확한 계산)" value={fmt(em, 3)} tone={em > 0.55 ? 'bad' : undefined} />
        <Stat label="새 시험 점수의 기댓값" value="0.500" tone="good" />
      </Stats>
      <Note>
        K = 20, n = 20이면 기댓값이 0.706입니다. 원문의 1000번 평균 0.709와 0.706은 이 값 둘레에서 나온 것이고, 그 후보를 새 시험으로 재면 0.498로 0.5에 가깝습니다. 후보가 많을수록, 문장이 적을수록 부풀림이 커집니다. K = 1이면 고르는 일이 없어 부풀림도 없습니다.
      </Note>
    </Viz>
  );
}
