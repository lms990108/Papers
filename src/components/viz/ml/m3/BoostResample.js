import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {mulberry32} from '../../annSim';

const N = 20;
const shuffled = (n, seed) => {
  const a = Array.from({length: n}, (_, i) => i);
  const r = mulberry32(seed);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
};

function Dot({label, kind, on, onClick, title}) {
  const wrong = kind === 'wrong' || kind === 'synth';
  const base = {
    width: 28, height: 28, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, padding: 0, margin: 0,
    border: `2px ${kind === 'synth' ? 'dashed' : 'solid'} ${wrong ? 'var(--vb)' : 'var(--va)'}`,
    background: wrong ? 'transparent' : 'var(--va)', color: wrong ? 'var(--vb)' : '#fff',
  };
  if (on) { base.background = 'var(--vok)'; base.border = '2px solid var(--vok)'; base.color = '#fff'; }
  const body = wrong ? '×' : label;
  if (onClick) return <button type="button" onClick={onClick} title={title} aria-pressed={!!on} aria-label={title} style={{...base, cursor: 'pointer'}}>{on ? '≠' : body}</button>;
  return <span role="img" aria-label={title} title={title} style={base}>{body}</span>;
}

const Row = ({name, children}) => (
  <div style={{margin: '8px 0'}}>
    <div className={s.ts} style={{marginBottom: 4}}>{name}</div>
    <div style={{display: 'flex', flexWrap: 'wrap', gap: 5}}>{children}</div>
  </div>
);

export default function BoostResample() {
  const [m, setM] = useState(3);
  const [seed, setSeed] = useState(1);
  const [synth, setSynth] = useState(false);
  const [dis, setDis] = useState({});
  const perm = shuffled(N, seed);
  const wrongSet = perm.slice(0, m);
  const isWrong = (i) => wrongSet.indexOf(i) >= 0;
  const rights = perm.slice(m);
  const extra = synth ? 4 : 0;
  const nWrong = m + extra;
  const nRight = Math.min(nWrong, rights.length);
  const pickRight = shuffled(rights.length, seed + 100).slice(0, nRight).map((k) => rights[k]);
  const second = wrongSet.slice().sort((a, b) => a - b).map((i) => ({id: 'w' + i, kind: 'wrong', label: i + 1}))
    .concat(Array.from({length: extra}, (_, k) => ({id: 'x' + k, kind: 'synth', label: '변'})))
    .concat(pickRight.slice().sort((a, b) => a - b).map((i) => ({id: 'r' + i, kind: 'right', label: i + 1})));
  const nDis = Object.keys(dis).filter((k) => dis[k]).length;
  const frac = second.length ? nWrong / second.length : 0;

  return (
    <Viz
      title="Drucker 등의 세 망: 둘째는 틀린 예를 반반으로 섞어 봅니다"
      caption="첫째가 틀린 예 수를 바꾸고 다시 뽑아 보세요. 둘째의 학습 데이터는 첫째가 틀린 예 전부와 같은 수의 맞힌 예입니다. 틀린 예가 적으면 둘째가 볼 데이터가 작아지고, 이때 변형 영상으로 틀린 경우를 더 만들어 채웁니다. 셋째 줄은 눌러서 정합니다. 예시 20개와 숫자는 설명용 값입니다."
    >
      <Controls>
        <Slider label="첫째가 틀린 예(20개 중)" min={1} max={10} value={m} onChange={setM} />
        <Btn onClick={() => setSeed(seed + 1)}>맞힌 예 다시 뽑기</Btn>
        <Btn on={synth} onClick={() => setSynth(!synth)}>변형으로 틀린 예 4개 더 만들기</Btn>
      </Controls>
      <Row name="첫째: 학습 데이터 전부 (× 는 첫째가 틀린 예)">
        {Array.from({length: N}, (_, i) => <Dot key={i} kind={isWrong(i) ? 'wrong' : 'right'} label={i + 1} title={`예 ${i + 1}: 첫째가 ${isWrong(i) ? '틀림' : '맞힘'}`} />)}
      </Row>
      <Row name={`둘째: 틀린 예 ${nWrong}개 + 맞힌 예 ${nRight}개 (점선은 변형으로 만든 예)`}>
        {second.map((d) => <Dot key={d.id} kind={d.kind} label={d.label} title={d.kind === 'right' ? `예 ${d.label}: 맞힌 예` : d.kind === 'wrong' ? `예 ${d.label}: 틀린 예` : '변형 영상으로 만든 틀린 예'} />)}
      </Row>
      <Row name="셋째: 둘째의 답이 첫째와 다른 예를 눌러 보세요(≠ 표시, 설명용)">
        {Array.from({length: N}, (_, i) => (
          <Dot key={i} kind={isWrong(i) ? 'wrong' : 'right'} label={i + 1} on={!!dis[i]} onClick={() => setDis({...dis, [i]: !dis[i]})} title={`예 ${i + 1}: 둘째와 의견이 ${dis[i] ? '갈림' : '같음'}, 누르면 바뀝니다`} />
        ))}
      </Row>
      <Stats>
        <Stat label="첫째의 학습 데이터" value={`${N}개`} />
        <Stat label="둘째의 학습 데이터" value={`${second.length}개`} />
        <Stat label="그중 틀린 예 비율" value={`${Math.round(frac * 100)}%`} tone={frac === 0.5 ? 'good' : 'bad'} />
        <Stat label="셋째의 학습 데이터" value={`${nDis}개`} tone={nDis === 0 ? 'bad' : undefined} />
      </Stats>
      {m + extra > rights.length ? <Note>맞힌 예가 모자라 반반을 못 맞춥니다. 틀린 예가 많은 쪽에서는 이 방식이 오히려 맞힌 예를 부족하게 만듭니다.</Note> : null}
      {m <= 2 && !synth ? <Note>첫째가 거의 다 맞히면 둘째가 볼 틀린 예가 {m}개뿐입니다. 본문의 LeNet-4도 시험 오류가 1.1%로 낮아 틀린 예시가 부족했고, 인공 변형 영상으로 틀린 경우를 더 만들었습니다.</Note> : null}
      {nDis === 0 ? <Note>둘이 동의하는 예뿐이면 셋째가 볼 정보가 없습니다. 의견이 갈리는 예를 눌러 보세요.</Note> : <Note>시험할 때는 세 출력을 더합니다. 첫째가 확신이 높으면 나머지 둘은 호출하지 않아서, 부스팅 LeNet-4의 평균 계산 비용은 망 하나의 약 1.75배였습니다.</Note>}
    </Viz>
  );
}
