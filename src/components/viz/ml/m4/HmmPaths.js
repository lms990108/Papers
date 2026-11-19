import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note, styles as s} from '../../Viz';
import {STATES, DEFAULT_PARAMS, toModel, enumerate, trim, ParamControls, ObsPicker} from './hmmCore';

export default function HmmPaths() {
  const [p, setP] = useState(DEFAULT_PARAMS);
  const [T, setT] = useState(3);
  const [o, setO] = useState([0, 1, 2, 0]);
  const m = toModel(p);
  const obs = o.slice(0, T);
  const rows = enumerate(m, obs).sort((a, b) => b.p - a.p);
  const total = rows.reduce((a, r) => a + r.p, 0);
  const best = rows[0].p;
  const top2 = rows.length > 1 ? rows[0].p + rows[1].p : rows[0].p;
  const ok = total > 0;

  return (
    <Viz
      title="모든 상태열을 나열해 관측열의 확률 구하기"
      caption="관측열은 그날그날 한 일입니다. 상태열 2^T개의 확률을 모두 계산해 큰 순서로 늘어놓고, 최댓값과 합계를 비교합니다. 기본값(3일, 산책-쇼핑-청소)은 원문의 여덟 경로입니다."
    >
      <ParamControls p={p} set={setP} />
      <Controls>
        <Slider label="날 수 T" min={1} max={4} step={1} value={T} onChange={setT} />
      </Controls>
      <ObsPicker obs={o} set={setO} T={T} />
      <div>
        {rows.map((r, i) => (
          <div key={r.q.join('')} style={{display: 'grid', gridTemplateColumns: 'minmax(9.5em, 12em) 1fr 5.5em', gap: 8, alignItems: 'center', margin: '3px 0', fontSize: '0.8rem'}}>
            <span style={{fontWeight: i === 0 ? 700 : 400}}>{r.q.map((x) => STATES[x]).join(' - ')}</span>
            <div style={{height: 14, borderRadius: 4, background: 'var(--ifm-color-emphasis-100)'}}>
              <div style={{width: `${best > 0 ? (r.p / best) * 100 : 0}%`, height: '100%', borderRadius: 4, background: i === 0 ? 'var(--vb)' : i === 1 ? 'var(--vc)' : 'var(--va)'}} />
            </div>
            <b style={{fontVariantNumeric: 'tabular-nums'}}>{trim(r.p, 6)}</b>
          </div>
        ))}
      </div>
      <Stats>
        <Stat label="경로 수" value={`2^${T} = ${rows.length}`} />
        <Stat label="합계 (관측열의 확률)" value={trim(total, 6)} tone="good" />
        <Stat label="최대" value={trim(best, 6)} />
        <Stat label="최대 / 합계" value={ok ? (best / total).toFixed(3) : '-'} />
        <Stat label="비용 -ln (최대, 합)" value={ok ? `${(-Math.log(best)).toFixed(3)}, ${(-Math.log(total)).toFixed(3)}` : '-'} />
        <Stat label="상위 두 경로의 몫" value={ok ? `${(100 * top2 / total).toFixed(1)}%` : '-'} />
      </Stats>
      <Note>
        {!ok
          ? '모든 경로의 확률이 0입니다. 이 관측열은 이 모델에서 나올 수 없습니다.'
          : '최댓값(주황)은 합계의 일부일 뿐입니다. 경로 하나만 보는 일과 경로를 전부 더하는 일이 다른 답을 주는 이유입니다. T를 1로 두고 쇼핑을 고르면 0.18 + 0.16 = 0.34가 나옵니다.'}
      </Note>
    </Viz>
  );
}
