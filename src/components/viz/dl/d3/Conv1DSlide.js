import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {conv1d, trim} from './util';

const X0 = [1, 2, 0, 1, 3, 1, 0];
const CW = 56;
const LEFT = 24;
const NAMES = ['a', 'b', 'c'];

export default function Conv1DSlide() {
  const [x, setX] = useState(X0);
  const [w, setW] = useState([1, 0, -1]);
  const [pos, setPos] = useState(0);
  const [sel, setSel] = useState(2);

  const y = conv1d(x, w);
  const O = y.length;
  const p = Math.min(pos, O - 1);
  const terms = [0, 1, 2].map((k) => w[k] * x[p + k]);
  const setWk = (k) => (v) => setW(w.map((e, i) => (i === k ? v : e)));
  const setXs = (v) => setX(x.map((e, i) => (i === sel ? v : e)));
  const pick = (i) => () => setSel(i);

  return (
    <Viz
      title="창을 한 칸씩 옮기며 곱하고 더하기"
      caption="윗줄 x₀, x₁, …은 입력이고, 창 안 세 칸에 가중치 a, b, c를 곱해 더한 값이 아랫줄의 출력 y입니다. 창 위치 i는 출력 y의 번호입니다. 창이 옮겨 가도 a, b, c는 그대로입니다. 입력 칸을 눌러 고른 뒤 값을 바꾸거나 가중치를 바꾸면 출력이 바로 다시 계산됩니다. 기본값은 본문의 예(a=1, b=0, c=−1)입니다."
    >
      <Controls>
        <Slider label="창 위치 i" min={0} max={O - 1} value={p} onChange={setPos} />
        <Btn onClick={() => setPos((p + O - 1) % O)}>이전 칸</Btn>
        <Btn onClick={() => setPos((p + 1) % O)}>다음 칸</Btn>
      </Controls>
      <Controls>
        {[0, 1, 2].map((k) => (
          <Slider key={k} label={`가중치 ${NAMES[k]}`} min={-3} max={3} value={w[k]} onChange={setWk(k)} />
        ))}
      </Controls>
      <Controls>
        <Slider label={`입력 x${sel}`} min={-3} max={5} value={x[sel]} onChange={setXs} />
        <Btn onClick={() => { setX(X0); setW([1, 0, -1]); }}>처음 값으로</Btn>
      </Controls>

      <svg viewBox="0 0 640 230" className={s.svg} role="img" aria-label={`한 줄 입력 ${x.join(', ')}에 가중치 ${w.join(', ')}의 창이 ${p}번 자리에 놓여 출력 ${y[p]}을 만든다`}>
        {[0, 1, 2].map((k) => (
          <g key={k}>
            <rect x={LEFT + (p + k) * CW + 4} y={18} width={CW - 8} height={34} rx={6} fill="color-mix(in srgb, var(--vb) 18%, transparent)" stroke="var(--vb)" strokeWidth={1.5} />
            <text x={LEFT + (p + k) * CW + CW / 2} y={40} textAnchor="middle" className={s.t} style={{fontWeight: 600}}>
              {NAMES[k]}={w[k]}
            </text>
            <line x1={LEFT + (p + k) * CW + CW / 2} y1={52} x2={LEFT + (p + k) * CW + CW / 2} y2={76} stroke="var(--vb)" strokeWidth={1.2} />
          </g>
        ))}
        {x.map((v, i) => {
          const inWin = i >= p && i < p + 3;
          return (
            <g key={i} onClick={pick(i)} onKeyDown={(e) => e.key === 'Enter' && setSel(i)} role="button" tabIndex={0} aria-label={`입력 x${i} = ${v}`} style={{cursor: 'pointer'}}>
              <rect x={LEFT + i * CW} y={76} width={CW} height={44} fill={inWin ? 'color-mix(in srgb, var(--vb) 14%, transparent)' : 'none'} stroke={i === sel ? 'var(--va)' : 'var(--ifm-color-emphasis-400)'} strokeWidth={i === sel ? 3 : 1.5} />
              <text x={LEFT + i * CW + CW / 2} y={103} textAnchor="middle" className={s.t} style={{fontSize: 16}}>{v}</text>
              <text x={LEFT + i * CW + CW / 2} y={135} textAnchor="middle" className={s.ts}>x{i}</text>
            </g>
          );
        })}
        <rect x={LEFT + p * CW} y={74} width={3 * CW} height={48} fill="none" stroke="var(--vb)" strokeWidth={3} rx={3} />
        <line x1={LEFT + (p + 1.5) * CW} y1={140} x2={LEFT + (p + 1.5) * CW} y2={166} stroke="var(--vb)" strokeWidth={1.5} />
        {y.map((v, i) => {
          const on = i === p;
          const shown = i <= p;
          return (
            <g key={i}>
              <rect x={LEFT + (i + 1) * CW} y={168} width={CW} height={44} fill={on ? 'color-mix(in srgb, var(--vb) 22%, transparent)' : 'none'} stroke={on ? 'var(--vb)' : 'var(--ifm-color-emphasis-400)'} strokeWidth={on ? 3 : 1.5} strokeDasharray={shown ? undefined : '4 3'} />
              <text x={LEFT + (i + 1) * CW + CW / 2} y={196} textAnchor="middle" className={s.t} style={{fontSize: 16, opacity: shown ? 1 : 0.25}}>{shown ? trim(v) : '?'}</text>
              <text x={LEFT + (i + 1) * CW + CW / 2} y={226} textAnchor="middle" className={s.ts}>y{i}</text>
            </g>
          );
        })}
      </svg>

      <Stats>
        <Stat label={`y${p} 계산`} value={`${terms.map((t) => trim(t)).join(' + ')} = ${trim(y[p])}`} />
        <Stat label="입력 칸 수 → 출력 칸 수" value={`${x.length} → ${O}`} />
      </Stats>
      <Note>
        y{p} = a·x{p} + b·x{p + 1} + c·x{p + 2} = ({w[0]})·{x[p]} + ({w[1]})·{x[p + 1]} + ({w[2]})·{x[p + 2]}. 전체 출력은 ({y.map((v) => trim(v)).join(', ')})입니다. 창이 놓일 자리가 {O}곳이라 출력이 {O}칸입니다.
      </Note>
    </Viz>
  );
}
