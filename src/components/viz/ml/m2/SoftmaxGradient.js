import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {softmax, nll, num} from './mlCore';

const COLORS = ['var(--vb)', 'var(--va)', 'var(--vc)'];
const W = 520;
const ROW = 30;

// 가운데 0선 기준으로 좌우로 뻗는 막대
function SignedBars({title, vals, max, fmtText}) {
  const H = vals.length * ROW + 24;
  const mid = 280;
  const half = 150;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label={title}>
      <text x="6" y="14" className={s.ts}>{title}</text>
      <line x1={mid} y1="20" x2={mid} y2={H - 2} stroke="var(--ifm-color-emphasis-500)" />
      {vals.map((v, i) => {
        const len = Math.min(1, Math.abs(v) / max) * half;
        const y = 26 + i * ROW;
        return (
          <g key={i}>
            <text x="6" y={y + 14} className={s.t}>칸 {i + 1}</text>
            <rect x={v >= 0 ? mid : mid - len} y={y} width={len} height="18" fill={COLORS[i]} fillOpacity={v >= 0 ? 0.55 : 1} stroke={COLORS[i]} />
            <text x={v >= 0 ? mid + len + 6 : mid - len - 6} y={y + 14} className={s.t} textAnchor={v >= 0 ? 'start' : 'end'}>{fmtText(v)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function SoftmaxGradient() {
  const [sc, setSc] = useState([1, 0, 0]);
  const [ans, setAns] = useState(0);
  const [lr, setLr] = useState(0.5);
  const [steps, setSteps] = useState(0);

  const set = (i) => (x) => {
    setSc(sc.map((a, j) => (j === i ? x : a)));
    setSteps(0);
  };
  const p = softmax(sc);
  const t = [0, 1, 2].map((i) => (i === ans ? 1 : 0));
  const g = p.map((x, i) => x - t[i]);
  const E = nll(p[ans]);
  const gsum = g.reduce((a, c) => a + c, 0);
  const go = (k) => {
    let cur = sc;
    for (let i = 0; i < k; i += 1) {
      const pp = softmax(cur);
      cur = cur.map((v, j) => v - lr * (pp[j] - t[j]));
    }
    setSc(cur);
    setSteps(steps + k);
  };

  return (
    <Viz
      title="정답 칸을 고르면 오차와 점수 기울기가 정해집니다"
      caption="정답 칸은 t가 1인 한 칸이고, 점수 s의 기울기는 p - t입니다. 점수 (1, 0, 0), 정답이 칸 1이면 오차 0.551, 기울기 (-0.424, 0.212, 0.212)입니다. 한 걸음 버튼은 점수를 기울기의 반대로 옮기는 설명용 계산입니다."
    >
      <Controls>
        {[0, 1, 2].map((i) => (
          <Btn key={i} on={ans === i} onClick={() => setAns(i)}>
            정답은 칸 {i + 1}
          </Btn>
        ))}
        <Btn onClick={() => {
          setSc([1, 0, 0]);
          setSteps(0);
        }}>
          점수 (1, 0, 0)
        </Btn>
      </Controls>
      <Controls>
        {sc.map((x, i) => (
          <Slider key={i} label={'칸 ' + (i + 1) + ' 점수'} min={-4} max={4} step={0.1} value={x} onChange={set(i)} format={(a) => num(a, 2)} />
        ))}
      </Controls>
      <SignedBars title="비율 p" vals={p} max={1} fmtText={(v) => num(v, 3)} />
      <SignedBars title="정답 t" vals={t} max={1} fmtText={(v) => num(v, 0)} />
      <SignedBars title="기울기 p - t (음수는 점수를 올리라는 뜻)" vals={g} max={1} fmtText={(v) => num(v, 3)} />
      <Stats>
        <Stat label={'오차 -log p (칸 ' + (ans + 1) + ')'} value={num(E, 3)} />
        <Stat label="기울기의 합" value={num(gsum, 3)} tone="good" />
        <Stat label="기울기 p - t" value={'(' + g.map((v) => num(v, 3)).join(', ') + ')'} />
      </Stats>
      <Controls>
        <Slider label="학습률" min={0.1} max={3} step={0.1} value={lr} onChange={setLr} format={(a) => num(a, 1)} />
        <Btn onClick={() => go(1)}>점수를 한 걸음</Btn>
        <Btn onClick={() => go(10)}>10걸음</Btn>
        <span style={{fontSize: '0.85rem'}}>걸음 수 {steps}</span>
      </Controls>
      <Note>
        {Math.abs(E) < 0.01
          ? '정답 칸의 비율이 1에 가까워서 오차와 기울기가 거의 0입니다.'
          : '정답 칸의 점수는 올리고 나머지는 내리며, 기울기의 합이 0이라 한 칸이 올라간 만큼 다른 칸이 내려갑니다. 점수 (1, 0, 0)에서 정답을 칸 2로 바꾸면 오차가 1.551, 기울기가 (0.576, -0.788, 0.212)입니다.'}
      </Note>
    </Viz>
  );
}
