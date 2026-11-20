import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const METHODS = [
  {name: '선형 분류기', err: 12, note: '기울기 보정 8.4%'},
  {name: '클래스 쌍 45개', err: 7.6},
  {name: '유클리드 K-최근접 이웃', err: 5.0, note: '기울기 보정, k=3이면 2.4%'},
  {name: '은닉 300, 완전 연결', err: 4.7, note: '1,000개면 4.5%. 기울기 보정과 300개면 1.6%'},
  {name: '가우스 RBF 1,000개', err: 3.6},
  {name: '주성분 40개 + 2차 다항식', err: 3.3},
  {name: '은닉 300-100', err: 3.05, note: '1,000-150이면 2.95%'},
  {name: 'LeNet-1', err: 1.7},
  {name: 'LeNet-4', err: 1.1},
  {name: '접선 거리', err: 1.1, note: '16×16'},
  {name: '정규 SVM', err: 1.4, note: '다른 구현 1.1%'},
  {name: '축소 집합 SVM', err: 1.1},
  {name: 'LeNet-5', err: 0.95, note: '변형 학습 0.8%'},
  {name: '부스팅 LeNet-4', err: 0.7},
  {name: '(괄호 값) K-최근접 이웃, 기울기 보정 k=3', err: 2.4},
  {name: '(괄호 값) LeNet-5 변형 학습 오분류 82장', err: 0.82},
];
const NS = [1000, 3000, 10000, 30000, 100000];
const se = (e, n) => Math.sqrt((e / 100) * (1 - e / 100) / n) * 100;
const MAX = 14;

export default function ErrorCompare() {
  const [a, setA] = useState(8);
  const [b, setB] = useState(12);
  const [ni, setNi] = useState(2);
  const n = NS[ni];
  const A = METHODS[a];
  const B = METHODS[b];
  const sa = se(A.err, n);
  const sb = se(B.err, n);
  const sd = Math.sqrt(sa * sa + sb * sb);
  const diff = Math.abs(A.err - B.err);
  const ratio = sd > 0 ? diff / sd : 0;
  const pct = (v) => `${(Math.max(0, Math.min(MAX, v)) / MAX) * 100}%`;

  return (
    <Viz
      title="시험 오류의 불확실성 구간과 두 방법의 차이"
      caption="막대가 오류율, 가는 선이 95% 구간(오류 ± 1.96 × 표준오차)입니다. 비교할 두 방법을 고르고 시험 장수를 바꿔 보세요. 표준오차는 시험 장수가 유한해서 생기는 오류율의 흔들림 크기이고 √(p(1-p)/n)입니다. p는 오류율, n은 시험 장수입니다. 두 오류가 독립이라고 근사해 차이의 표준오차를 구합니다."
    >
      <Controls>
        <label className={s.ctl}>
          <span>방법 A</span>
          <select value={a} onChange={(e) => setA(Number(e.target.value))} aria-label="방법 A">
            {METHODS.map((m, i) => <option key={m.name} value={i}>{m.name} ({m.err}%)</option>)}
          </select>
        </label>
        <label className={s.ctl}>
          <span>방법 B</span>
          <select value={b} onChange={(e) => setB(Number(e.target.value))} aria-label="방법 B">
            {METHODS.map((m, i) => <option key={m.name} value={i}>{m.name} ({m.err}%)</option>)}
          </select>
        </label>
        <Slider label="시험 장수 n" min={0} max={NS.length - 1} step={1} value={ni} onChange={setNi} format={(v) => NS[v].toLocaleString('en-US')} />
      </Controls>
      <div>
        {METHODS.map((m, i) => {
          const sm = se(m.err, n);
          const lo = m.err - 1.96 * sm;
          const hi = m.err + 1.96 * sm;
          const sel = i === a || i === b;
          return (
            <div key={m.name} style={{display: 'grid', gridTemplateColumns: 'minmax(9em, 14em) 1fr 4.2em', gap: 8, alignItems: 'center', margin: '3px 0', fontSize: '0.8rem', fontWeight: sel ? 700 : 400}}>
              <span>{m.name}{i === a ? ' (A)' : ''}{i === b ? ' (B)' : ''}</span>
              <div style={{position: 'relative', height: 14, borderRadius: 4, background: 'var(--ifm-color-emphasis-100)'}}>
                <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: pct(m.err), borderRadius: 4, background: sel ? 'var(--vb)' : 'var(--va)', opacity: sel ? 1 : 0.55}} />
                <div style={{position: 'absolute', left: pct(lo), width: `calc(${pct(hi)} - ${pct(lo)})`, top: 6, height: 2, background: 'var(--ifm-font-color-base)'}} />
              </div>
              <b>{m.err}%</b>
            </div>
          );
        })}
      </div>
      <Stats>
        <Stat label={`A 표준오차`} value={`${fmt(sa, 2)}%p`} />
        <Stat label={`B 표준오차`} value={`${fmt(sb, 2)}%p`} />
        <Stat label="오류 차이" value={`${fmt(diff, 2)}%p`} />
        <Stat label="차이의 표준오차" value={`${fmt(sd, 2)}%p`} />
        <Stat label="차이 / 표준오차" value={fmt(ratio, 2)} tone={ratio >= 2 ? 'good' : 'bad'} />
      </Stats>
      <Note>
        {a === b
          ? '같은 방법을 두 번 골랐습니다. 다른 방법을 골라 주세요.'
          : ratio >= 2
            ? `차이가 표준오차의 ${fmt(ratio, 1)}배라서 시험 표본 변동만으로는 설명되지 않습니다.`
            : `차이가 표준오차의 ${fmt(ratio, 1)}배밖에 되지 않아, 이 시험 장수에서는 차이만으로 방법의 우열을 말하기 어렵습니다.`}
        {' 기본값은 LeNet-4(1.1%)와 LeNet-5(0.95%)이고, n = 10,000에서 차이 0.15%p의 표준오차가 0.14%p입니다.'}
      </Note>
    </Viz>
  );
}
