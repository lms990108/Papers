import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {num} from './geom';

const REVIEWS = [
  {name: '연기가 좋다', x: [1, 0], t: 1},
  {name: '결말이 나쁘다', x: [0, 1], t: 0},
  {name: '연기가 좋다, 좋다', x: [2, 0], t: 1},
  {name: '결말이 나쁘다, 나쁘다', x: [0, 2], t: 0},
];
const sig = (z) => 1 / (1 + Math.exp(-z));
const lab = (v) => (v == null ? '—' : String(v));

function Arrow({x1, y1, x2, y2}) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = [x2, y2, x2 - 11 * Math.cos(a - 0.4), y2 - 11 * Math.sin(a - 0.4), x2 - 11 * Math.cos(a + 0.4), y2 - 11 * Math.sin(a + 0.4)].join(',');
  return (
    <g stroke="var(--ifm-color-emphasis-600)" fill="var(--ifm-color-emphasis-600)">
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1.5" />
      <polygon points={h} stroke="none" />
    </g>
  );
}

export default function PerceptronCalc() {
  const [x, setX] = useState([1, 0]);
  const [w, setW] = useState([1, -1]);
  const [b, setB] = useState(0);
  const sc = w[0] * x[0] + w[1] * x[1] + b;
  const y = sc > 0 ? 1 : 0;
  const hit = REVIEWS.find((r) => r.x[0] === x[0] && r.x[1] === x[1]);
  const t = hit ? hit.t : null;
  const p = sig(sc);
  const err = t == null ? null : -Math.log(t === 1 ? p : 1 - p);
  const sw = (i, v) => setW(i === 0 ? [v, w[1]] : [w[0], v]);

  return (
    <Viz
      title="퍼셉트론 칸 하나: 곱하고, 더하고, 0보다 큰지 봅니다"
      caption="리뷰 단어 횟수와 가중치, 바이어스를 바꿔 보세요. 바이어스를 1.5로 올리면 부정 리뷰의 점수가 0.5가 되어 출력이 1로 뒤집힙니다. 시그모이드 칸은 같은 점수에서 p와 오차를 보여 주는 비교용입니다."
    >
      <Controls>
        {REVIEWS.map((r) => (
          <Btn key={r.name} on={hit === r} onClick={() => setX(r.x)}>
            {r.name}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="좋다 횟수" min={0} max={3} value={x[0]} onChange={(v) => setX([v, x[1]])} />
        <Slider label="나쁘다 횟수" min={0} max={3} value={x[1]} onChange={(v) => setX([x[0], v])} />
      </Controls>
      <Controls>
        <Slider label="w₁ (좋다 횟수에 곱하는 수)" min={-2} max={2} step={0.5} value={w[0]} onChange={(v) => sw(0, v)} format={(v) => num(v, 1)} />
        <Slider label="w₂ (나쁘다 횟수에 곱하는 수)" min={-2} max={2} step={0.5} value={w[1]} onChange={(v) => sw(1, v)} format={(v) => num(v, 1)} />
        <Slider label="바이어스 b (더하는 수)" min={-2} max={2} step={0.5} value={b} onChange={setB} format={(v) => num(v, 1)} />
        <Btn onClick={() => { setW([1, -1]); setB(0); }}>w = (1, −1), b = 0</Btn>
        <Btn onClick={() => { setW([1, -1]); setB(1.5); }}>b = 1.5</Btn>
      </Controls>
      <svg viewBox="0 0 640 200" className={s.svg} role="img" aria-label={`입력 ${x[0]}, ${x[1]}에 가중치를 곱해 더한 점수 ${num(sc, 1)}, 출력 ${y}`}>
        <g fill="none" stroke="var(--ifm-color-emphasis-600)" strokeWidth="1.5">
          <circle cx="80" cy="52" r="28" />
          <circle cx="80" cy="148" r="28" />
          <circle cx="330" cy="100" r="40" stroke="var(--vb)" strokeWidth="2.5" />
          <circle cx="560" cy="100" r="28" stroke={y === 1 ? 'var(--vok)' : 'var(--va)'} strokeWidth="2.5" />
        </g>
        <Arrow x1={110} y1={56} x2={288} y2={88} />
        <Arrow x1={110} y1={144} x2={288} y2={112} />
        <Arrow x1={372} y1={100} x2={528} y2={100} />
        <g className={s.t} textAnchor="middle">
          <text x="80" y="57">{x[0]}</text>
          <text x="80" y="153">{x[1]}</text>
          <text x="80" y="20" className={s.ts}>좋다</text>
          <text x="80" y="192" className={s.ts}>나쁘다</text>
          <text x="198" y="50">× {num(w[0], 1)}</text>
          <text x="198" y="164">× {num(w[1], 1)}</text>
          <text x="330" y="90">{num(x[0] * w[0] + x[1] * w[1], 1)} + {num(b, 1)}</text>
          <text x="330" y="112" style={{fontWeight: 700}}>s = {num(sc, 1)}</text>
          <text x="450" y="92" className={s.ts}>s &gt; 0 ?</text>
          <text x="560" y="105" style={{fontWeight: 700}}>{y}</text>
          <text x="560" y="150" className={s.ts}>{y === 1 ? '긍정으로 읽음' : '부정으로 읽음'}</text>
        </g>
      </svg>
      <Stats>
        <Stat label="점수 s (곱해서 더한 값)" value={num(sc, 1)} />
        <Stat label="퍼셉트론 출력" value={y} />
        <Stat label="정답" value={lab(t)} />
        <Stat label="시그모이드 비율 p (비교용)" value={num(p, 3)} />
        <Stat label="로지스틱 오차" value={err == null ? '—' : num(err, 3)} tone={err == null ? undefined : err > 0.5 ? 'bad' : 'good'} />
      </Stats>
      <table className={s.grid}>
        <thead>
          <tr><th>리뷰</th><th>(x₁ 좋다, x₂ 나쁘다)</th><th>점수 s</th><th>출력 y</th><th>정답</th></tr>
        </thead>
        <tbody>
          {REVIEWS.map((r) => {
            const rs = w[0] * r.x[0] + w[1] * r.x[1] + b;
            const ry = rs > 0 ? 1 : 0;
            return (
              <tr key={r.name} className={hit === r ? s.cellOn : undefined}>
                <td>{r.name}</td>
                <td>({r.x[0]}, {r.x[1]})</td>
                <td>{num(rs, 1)}</td>
                <td>{ry}</td>
                <td>{r.t}{ry === r.t ? ' (맞음)' : ' (틀림)'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {hit ? <Note>점수 0.5와 5는 출력이 똑같이 1입니다. 퍼셉트론에는 얼마나 틀렸는지가 남지 않고, 시그모이드 칸에는 오차 크기가 남습니다.</Note> : null}
    </Viz>
  );
}
