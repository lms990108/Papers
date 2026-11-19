import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, fmt, styles as s} from '../../Viz';
import {ACTS, chain, chainOut, sci} from './lib';

const SETS = [
  {id: 'sig', w: 1, name: '시그모이드, w = 1'},
  {id: 'tanh', w: 1, name: 'tanh, w = 1'},
  {id: 'tanh', w: 2, name: 'tanh, w = 2'},
  {id: 'relu', w: 1, name: 'ReLU, w = 1'},
];
const X0 = 0.5;

export default function ActivationChain() {
  const [act, setAct] = useState('sig');
  const [w, setW] = useState(1);
  const [n, setN] = useState(5);

  const c = chain(act, w, X0, n);
  const d = 1e-6;
  const num = (chainOut(act, w, X0 + d, n) - chainOut(act, w, X0 - d, n)) / (2 * d);
  const maxF = Math.max(1, ...c.fac);
  const geo = Math.pow(Math.abs(c.g), 1 / n);
  const rows = c.fac.map((f, k) => ({k: k + 1, f, h: c.hs[k + 1]}));

  return (
    <Viz
      title="활성화 함수와 가중치에 따른 기울기 소실"
      caption="h_k = f(w·h_{k−1}), h₀ = 0.5를 n번 이어 쓰고 h₀까지의 기울기를 역전파로 구합니다. 층마다 곱해지는 값은 (활성화 기울기) × w입니다. 막대는 그 층의 곱이고 1보다 작을수록 신호가 줄어듭니다."
    >
      <Controls>
        {SETS.map((q) => (
          <Btn
            key={q.name}
            on={act === q.id && Math.abs(w - q.w) < 1e-9}
            onClick={() => {
              setAct(q.id);
              setW(q.w);
            }}
          >
            {q.name}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="가중치 w" min={0.25} max={3} step={0.25} value={w} onChange={setW} format={(v) => fmt(v, 2)} />
        <Slider label="층 수 n" min={1} max={10} step={1} value={n} onChange={setN} />
        <span className={s.ts}>활성화: {ACTS[act].name}</span>
      </Controls>
      {rows.map((q) => (
        <Bar
          key={q.k}
          label={`층 ${q.k}  (출력값 h=${fmt(q.h, 3)})`}
          value={q.f}
          max={maxF}
          color={q.f < 1 ? 'var(--vb)' : 'var(--vc)'}
          text={`× ${fmt(q.f, 3)}`}
        />
      ))}
      <Stats>
        <Stat label={`${n}층 뒤 기울기 (역전파)`} value={sci(c.g)} tone={Math.abs(c.g) < 0.1 ? 'bad' : undefined} />
        <Stat label="수치 미분" value={sci(num)} />
        <Stat label="층당 평균 곱" value={fmt(geo, 3)} />
        <Stat label="시그모이드 한계 0.25ⁿ" value={sci(Math.pow(0.25, n))} />
      </Stats>
      <Note>
        {act === 'sig'
          ? '시그모이드는 층마다 0.25를 넘지 못하므로 위 값이 항상 0.25ⁿ 아래입니다. w를 4보다 크게 키워도 입력이 포화로 밀려 기울기가 다시 줄어드는 경우가 많습니다.'
          : act === 'tanh' && w >= 2
          ? '가중치가 크면 h가 1 근처로 붙어 포화하고, 그 자리의 기울기가 0에 가까워 층당 곱이 작아집니다. 같은 함수라도 값이 어느 구간에 있는가에 따라 소실이 갈립니다.'
          : act === 'tanh'
          ? 'w = 1이면 값이 0 근처에 머물러 기울기가 1에 가깝고, 10층에서도 소실이 크지 않습니다.'
          : 'ReLU는 입력이 양수이면 기울기가 정확히 1이라 층당 곱이 w입니다. 입력이 음수이면 기울기가 0입니다.'}
      </Note>
    </Viz>
  );
}
