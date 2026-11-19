import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt} from '../../Viz';
import {mulberry32} from '../../annSim';

const PARTS = [
  {key: 'none', label: '안 고름', color: 'var(--ifm-color-emphasis-300)'},
  {key: 'mask', label: '[MASK]', color: 'var(--vb)'},
  {key: 'rand', label: '무작위 토큰', color: 'var(--vc)'},
  {key: 'keep', label: '그대로', color: 'var(--va)'},
];

export default function MaskRatio() {
  const [n, setN] = useState(512);
  const [rate, setRate] = useState(15);
  const [runs, setRuns] = useState(0);
  const [sim, setSim] = useState(null);

  const chosen = (n * rate) / 100;
  const exp = {none: n - chosen, mask: chosen * 0.8, rand: chosen * 0.1, keep: chosen * 0.1};
  const shown = sim || exp;
  const total = n;

  const run = () => {
    const r = mulberry32(100 + runs);
    const c = {none: 0, mask: 0, rand: 0, keep: 0};
    for (let i = 0; i < n; i += 1) {
      if (r() * 100 >= rate) c.none += 1;
      else {
        const u = r();
        c[u < 0.8 ? 'mask' : u < 0.9 ? 'rand' : 'keep'] += 1;
      }
    }
    setRuns(runs + 1);
    setSim(c);
  };
  const reset = (f) => {
    f();
    setSim(null);
  };

  return (
    <Viz
      title="15%를 고르고, 그중 80 / 10 / 10으로 바꾸기"
      caption="토큰 수와 고르는 비율을 바꿔 기대하는 칸 수를 보세요. “뽑아 보기”는 그 확률로 실제로 뽑은 한 번의 결과이며, 누를 때마다 조금씩 다릅니다."
    >
      <Controls>
        <Slider label="토큰 수" min={10} max={10000} step={1} value={n} onChange={(v) => reset(() => setN(v))} />
        <Slider label="고르는 비율(%)" min={5} max={30} step={1} value={rate} onChange={(v) => reset(() => setRate(v))} />
        <Btn onClick={() => reset(() => setN(512))}>512</Btn>
        <Btn onClick={() => reset(() => setN(10000))}>10000</Btn>
      </Controls>
      <div style={{display: 'flex', height: 26, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--ifm-color-emphasis-300)'}} role="img" aria-label="안 고름, 마스크, 무작위 토큰, 그대로의 비율">
        {PARTS.map((p) => (
          <div key={p.key} style={{width: (shown[p.key] / total) * 100 + '%', background: p.color, minWidth: shown[p.key] > 0 ? 2 : 0}} />
        ))}
      </div>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: '0.78rem', marginTop: 6}}>
        {PARTS.map((p) => (
          <span key={p.key}>
            <i style={{display: 'inline-block', width: 10, height: 10, borderRadius: 2, marginRight: 5, background: p.color}} />
            {p.label}
          </span>
        ))}
      </div>
      <Stats>
        <Stat label="고른 칸 (기대값)" value={fmt(chosen, 1)} />
        <Stat label="[MASK]로 바꿈 (80%)" value={fmt(exp.mask, 1)} />
        <Stat label="무작위 토큰 (10%)" value={fmt(exp.rand, 1)} />
        <Stat label="그대로 (10%)" value={fmt(exp.keep, 1)} />
      </Stats>
      <Controls>
        <Btn onClick={run}>뽑아 보기</Btn>
        <Btn onClick={() => setSim(null)}>기대값으로 돌아가기</Btn>
      </Controls>
      {sim ? (
        <Note>
          이번 뽑기: 고른 칸 {sim.mask + sim.rand + sim.keep}개 중 [MASK] {sim.mask}, 무작위 토큰 {sim.rand}, 그대로 {sim.keep}. 기대값과 조금 다른 것이 정상입니다.
        </Note>
      ) : (
        <Note>
          512칸에서 15%면 76.8칸이고 그중 [MASK]는 약 61.4칸입니다. 칸 수는 정수라 실제로는 77칸 안팎입니다. 어느 경우든 정답은 원래 토큰입니다.
        </Note>
      )}
    </Viz>
  );
}
