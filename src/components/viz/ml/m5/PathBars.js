import React, {useMemo, useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note, Bar, fmt} from '../../Viz';
import {W_STATES, weatherA, trellis, allWeatherPaths} from './util';

const fp = (x) => String(+x.toPrecision(4));

export default function PathBars() {
  const [pSS, setPSS] = useState(0.7);
  const [pRR, setPRR] = useState(0.6);
  const A = useMemo(() => weatherA(pSS, pRR), [pSS, pRR]);
  const data = useMemo(() => {
    const all = allWeatherPaths(A);
    const tr = trellis(A, 3);
    // 시각마다 v가 가장 큰 노드만 이어 붙인 경로
    const greedy = tr.v.map((col) => (col[1] > col[0] ? 1 : 0));
    const key = (p) => p.join('');
    const total = all.reduce((a, x) => a + x.p, 0);
    const sorted = all.slice().sort((x, y) => y.p - x.p);
    const g = all.filter((x) => key(x.path) === key(greedy))[0];
    return {sorted, total, best: sorted[0], greedy, gp: g.p, key};
  }, [A]);
  const {sorted, total, best, greedy, gp, key} = data;
  const same = key(greedy) === key(best.path);

  return (
    <Viz
      title="여덟 경로 전부와 비터비가 고른 경로"
      caption="막대는 경로 하나의 확률입니다. 비터비의 값은 가장 긴 막대 하나이고, 관측열 전체의 확률은 여덟 막대의 합입니다. 전이 확률을 바꿔 시각마다 가장 큰 노드만 이은 경로가 어긋나는 때를 찾아보세요."
    >
      <Controls>
        <Slider label="맑음→맑음" min={0.05} max={0.95} step={0.05} value={pSS} onChange={setPSS} format={(x) => fmt(x, 2)} />
        <Slider label="비→비" min={0.05} max={0.95} step={0.05} value={pRR} onChange={setPRR} format={(x) => fmt(x, 2)} />
        <Btn onClick={() => { setPSS(0.7); setPRR(0.6); }}>원본 값 (0.7, 0.6)</Btn>
      </Controls>
      {sorted.map((x) => {
        const k = key(x.path);
        const isBest = k === key(best.path);
        const isGreedy = k === key(greedy);
        const tags = [isBest ? '비터비' : null, isGreedy ? '시각마다 최대만' : null].filter(Boolean);
        return (
          <Bar
            key={k}
            label={x.path.map((q) => W_STATES[q]).join('-') + (tags.length ? ` [${tags.join(', ')}]` : '')}
            value={x.p}
            max={best.p}
            color={isBest ? 'var(--vok)' : isGreedy ? 'var(--vb)' : 'var(--va)'}
            text={fp(x.p)}
          />
        );
      })}
      <Stats>
        <Stat label="비터비의 값(경로 하나)" value={fp(best.p)} tone="good" />
        <Stat label="시각마다 최대만 이은 경로" value={`${greedy.map((q) => W_STATES[q]).join('-')} ${fp(gp)}`} tone={same ? undefined : 'bad'} />
        <Stat label="관측열 전체 확률(합)" value={fp(total)} />
        <Stat label="최대 ÷ 합" value={`${fmt((best.p / total) * 100, 0)}%`} />
      </Stats>
      <Note>
        {same
          ? '이 전이 확률에서는 시각마다 가장 큰 노드를 이어도 최적 경로가 나옵니다. 그래도 그렇게 되는 것이 보장되지는 않습니다.'
          : '시각마다 가장 큰 노드만 이으면 최적 경로를 놓칩니다. 시각 2에서 더 작은 노드를 버리지 않는 것이 비터비의 핵심입니다.'}
      </Note>
    </Viz>
  );
}
