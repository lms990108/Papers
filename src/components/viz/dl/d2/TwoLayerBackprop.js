import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {net} from './lib';

const W = 700;
const H = 270;
const CX = {x: 66, a: 196, h: 326, y: 456, E: 586};
const EPS = 0.1;

const STEPS = [
  {k: 'a', f: 'a = w₁ × x', note: '입력에 w₁을 곱합니다. 여기서부터 앞에서 뒤로 값을 만듭니다.'},
  {k: 'h', f: 'h = tanh(a)', note: 'tanh에 넣어 중간 값 h를 만듭니다. h에는 붙어 있는 정답이 없습니다.'},
  {k: 'y', f: 'y = w₂ × h', note: 'w₂를 곱해 출력 y를 만듭니다.'},
  {k: 'E', f: 'E = (y − t)²', note: '정답과의 차이를 제곱해 오차로 삼습니다. 역방향에서 h와 a를 다시 쓰므로 이 값들은 지우지 않고 둡니다.'},
  {k: 'dy', f: '∂E/∂y = 2(y − t)', note: '이제 뒤에서 앞으로 갑니다. 출력이 정답 쪽으로 가려면 y를 얼마나 바꿔야 하는지의 신호입니다.'},
  {k: 'dw2', f: '∂E/∂w₂ = ∂E/∂y × h', note: 'w₂를 키우면 y는 h만큼 커집니다. 그래서 y의 신호에 h를 곱합니다.'},
  {k: 'dh', f: '∂E/∂h = ∂E/∂y × w₂', note: 'h를 키우면 y는 w₂만큼 커집니다. 이 값은 정답이 아니라 출력 오차가 뒤로 보낸 신호입니다.'},
  {k: 'da', f: '∂E/∂a = ∂E/∂h × (1 − h²)', note: 'tanh의 기울기 1 − h²를 곱합니다. 이 값은 입력이 0일 때 1이고, 포화에 가까울수록 0에 가까워 신호가 줄어듭니다.'},
  {k: 'dw1', f: '∂E/∂w₁ = ∂E/∂a × x', note: 'a = w₁ × x이므로 x를 곱합니다. 이것이 앞 파라미터의 기울기입니다.'},
];

function Box({x, y, w = 92, h = 46, title, val, on, cur, color}) {
  return (
    <g opacity={on ? 1 : 0.35}>
      <rect x={x - w / 2} y={y} width={w} height={h} rx={6} fill="none" stroke={color || 'var(--ifm-font-color-base)'} strokeWidth={cur ? 3 : 1.5} />
      <text x={x} y={y + 18} textAnchor="middle" className={s.ts} style={color ? {fill: color} : undefined}>{title}</text>
      <text x={x} y={y + 37} textAnchor="middle" className={s.t} style={{fontWeight: 600}}>{on ? val : '?'}</text>
    </g>
  );
}

export default function TwoLayerBackprop() {
  const [x, setX] = useState(1);
  const [w1, setW1] = useState(0.5);
  const [w2, setW2] = useState(1);
  const [t, setT] = useState(0);
  const [st, setSt] = useState(4);

  const n = net(x, w1, w2, t);
  const have = (k) => STEPS.findIndex((q) => q.k === k) < st;
  const cur = st > 0 ? STEPS[st - 1].k : null;
  const nw1 = w1 - EPS * n.dw1;
  const nw2 = w2 - EPS * n.dw2;
  const nE = net(x, nw1, nw2, t).E;
  const v = (k) => fmt(n[k], 4);
  const done = st >= STEPS.length;

  return (
    <Viz
      title="두 층 망의 순방향과 역방향을 한 칸씩"
      caption="기본값은 입력 1, w₁ = 0.5, w₂ = 1, 정답 0입니다. 위 줄은 순방향 값, 아래 줄은 오차가 뒤로 보내는 신호입니다. 다음 버튼으로 한 칸씩 진행하고, 슬라이더로 값을 바꿔 보세요(값을 바꿔도 진행 칸은 그대로입니다)."
    >
      <Controls>
        <Btn onClick={() => setSt(Math.max(0, st - 1))}>이전</Btn>
        <Btn onClick={() => setSt(Math.min(STEPS.length, st + 1))}>다음</Btn>
        <Btn onClick={() => setSt(4)}>순방향 끝까지</Btn>
        <Btn onClick={() => setSt(STEPS.length)}>역방향 끝까지</Btn>
        <Btn onClick={() => setSt(0)}>처음으로</Btn>
        <span className={s.ts}>{st} / {STEPS.length}칸</span>
      </Controls>
      <Controls>
        <Slider label="입력 x" min={-2} max={2} step={0.1} value={x} onChange={setX} format={(q) => fmt(q, 1)} />
        <Slider label="w₁" min={-2} max={2} step={0.1} value={w1} onChange={setW1} format={(q) => fmt(q, 1)} />
        <Slider label="w₂" min={-2} max={2} step={0.1} value={w2} onChange={setW2} format={(q) => fmt(q, 1)} />
        <Slider label="정답 t" min={-1} max={1} step={0.5} value={t} onChange={setT} format={(q) => fmt(q, 1)} />
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="두 층 망의 순방향 값과 역방향 기울기">
        <text x={4} y={14} className={s.ts}>순방향 →</text>
        <Box x={CX.x} y={28} title="입력 x" val={fmt(x, 4)} on />
        <Box x={CX.a} y={28} title="a (첫 합)" val={v('a')} on={have('a')} cur={cur === 'a'} />
        <Box x={CX.h} y={28} title="h (정답 없음)" val={v('h')} on={have('h')} cur={cur === 'h'} />
        <Box x={CX.y} y={28} title="출력 y" val={v('y')} on={have('y')} cur={cur === 'y'} />
        <Box x={CX.E} y={28} title="오차 E" val={v('E')} on={have('E')} cur={cur === 'E'} />
        {[['w₁ 곱', 'x', 'a'], ['tanh', 'a', 'h'], ['w₂ 곱', 'h', 'y'], ['(y−t)²', 'y', 'E']].map(([lab, p, q]) => (
          <g key={lab}>
            <line x1={CX[p] + 48} y1={51} x2={CX[q] - 50} y2={51} stroke="var(--ifm-font-color-base)" />
            <polygon points={`${CX[q] - 50},51 ${CX[q] - 58},47 ${CX[q] - 58},55`} fill="var(--ifm-font-color-base)" />
            <text x={(CX[p] + CX[q]) / 2} y={44} textAnchor="middle" className={s.ts}>{lab}</text>
          </g>
        ))}
        <text x={(CX.x + CX.a) / 2} y={100} textAnchor="middle" className={s.ts}>w₁ = {fmt(w1, 1)}</text>
        <text x={(CX.h + CX.y) / 2} y={100} textAnchor="middle" className={s.ts}>w₂ = {fmt(w2, 1)}</text>
        <text x={CX.E} y={100} textAnchor="middle" className={s.ts}>정답 t = {fmt(t, 1)}</text>
        <text x={4} y={132} className={s.ts} style={{fill: 'var(--vb)'}}>← 역방향</text>
        <Box x={CX.y} y={142} title="∂E/∂y" val={v('dy')} on={have('dy')} cur={cur === 'dy'} color="var(--vb)" />
        <Box x={CX.h} y={142} title="∂E/∂h" val={v('dh')} on={have('dh')} cur={cur === 'dh'} color="var(--vb)" />
        <Box x={CX.a} y={142} title="∂E/∂a" val={v('da')} on={have('da')} cur={cur === 'da'} color="var(--vb)" />
        <Box x={(CX.h + CX.y) / 2} y={206} title="∂E/∂w₂" val={v('dw2')} on={have('dw2')} cur={cur === 'dw2'} color="var(--vb)" />
        <Box x={(CX.x + CX.a) / 2} y={206} title="∂E/∂w₁" val={v('dw1')} on={have('dw1')} cur={cur === 'dw1'} color="var(--vb)" />
        <text x={CX.x} y={166} textAnchor="middle" className={s.ts}>x의 기울기는 필요 없음</text>
      </svg>
      <Note>{st === 0 ? '입력과 파라미터만 있습니다. 다음 버튼을 눌러 보세요.' : STEPS[st - 1].note}</Note>
      <Stats>
        <Stat label="1 − h²" value={fmt(1 - n.h * n.h, 4)} />
        <Stat label="갱신 뒤 w₁ (ε = 0.1)" value={done ? fmt(nw1, 4) : '—'} />
        <Stat label="갱신 뒤 w₂" value={done ? fmt(nw2, 4) : '—'} />
        <Stat label="갱신 뒤 오차" value={done ? fmt(nE, 4) : '—'} tone={done ? (nE < n.E ? 'good' : 'bad') : undefined} />
      </Stats>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>단계</th>
            <th>식</th>
            <th>값</th>
          </tr>
        </thead>
        <tbody>
          {STEPS.slice(0, st).map((q, i) => (
            <tr key={q.k} className={i === st - 1 ? s.cellOn : undefined}>
              <td>{i + 1}</td>
              <td style={{textAlign: 'left'}}>{q.f}</td>
              <td>{v(q.k)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Viz>
  );
}
