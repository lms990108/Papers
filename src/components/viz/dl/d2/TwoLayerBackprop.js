import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {net} from './lib';

// 본문 계산과 같은 값: 입력 1, w₁ = 0.5, w₂ = 1, 정답 0
const X = 1;
const W1 = 0.5;
const W2 = 1;
const T = 0;
const EPS = 0.1;

const W = 600;
const H = 268;
const BW = 64;
const BH = 44;
const CX = {x: 50, a: 170, h: 290, y: 410, E: 530};
const FY = 24; // 순방향 줄의 위쪽
const SY = 112; // 역방향 신호 줄의 위쪽
const GY = 208; // 파라미터 기울기 줄의 위쪽
const VB = 'var(--vb)';
const VA = 'var(--va)';
const BASE = 'var(--ifm-font-color-base)';

const STEPS = [
  {k: 'a', note: '입력 x에 w₁을 곱해 a를 만듭니다. 여기서부터 앞에서 뒤로 값을 만듭니다.'},
  {k: 'h', note: 'a를 tanh에 통과시켜 h를 만듭니다. h에는 붙어 있는 정답이 없습니다.'},
  {k: 'y', note: 'h에 w₂를 곱해 출력 y를 만듭니다.'},
  {k: 'E', note: '정답 t와의 차이를 제곱해 오차 E를 만듭니다. 뒤로 갈 때 다시 쓸 값(x, h, y)은 지우지 않고 저장해 둡니다.'},
  {k: 'dy', uses: ['y'], note: '이제 뒤로 갑니다. 시작 신호는 1입니다(E가 E에 미치는 영향). 여기에 E가 y에 반응하는 비율 2(y − t)를 곱하면 ∂E/∂y입니다. y를 1 올리면 E가 약 0.92 오른다는 뜻입니다.'},
  {k: 'dw2', uses: ['h'], note: 'w₂를 1 올리면 y는 h만큼 오릅니다. 그래서 y의 신호에 순방향에서 저장한 h를 곱해 ∂E/∂w₂를 얻습니다. w₂는 여기서 끝납니다.'},
  {k: 'dh', note: 'h를 1 올리면 y는 w₂만큼 오릅니다. y의 신호에 w₂를 곱해 ∂E/∂h를 얻습니다. 이 값은 정답이 아니라 출력 오차가 뒤로 보낸 신호입니다.'},
  {k: 'da', uses: ['h'], note: 'a를 1 올리면 h는 1 − h²만큼 오릅니다(tanh의 기울기). h의 신호에 저장해 둔 h로 만든 이 값을 곱합니다. h가 1이나 −1에 가까워 포화할수록 이 값은 0에 가까워 신호가 줄어듭니다.'},
  {k: 'dw1', uses: ['x'], note: 'w₁을 1 올리면 a는 x만큼 오릅니다. a의 신호에 x를 곱해 ∂E/∂w₁을 얻습니다. 칸마다 같은 규칙(뒤에서 온 신호 × 이 칸의 변화율)을 반복했을 뿐입니다.'},
];
const NF = 4; // 순방향 칸 수

function Box({x, y, title, val, on, cur, color, used}) {
  const stroke = used ? VA : color || BASE;
  return (
    <g opacity={on ? 1 : 0.3}>
      <rect
        x={x - BW / 2}
        y={y}
        width={BW}
        height={BH}
        rx={6}
        fill="none"
        stroke={stroke}
        strokeWidth={cur || used ? 3 : 1.5}
      />
      <text x={x} y={y + 17} textAnchor="middle" className={s.ts} style={color ? {fill: color} : undefined}>
        {title}
      </text>
      <text x={x} y={y + 36} textAnchor="middle" className={s.t} style={{fontWeight: 600}}>
        {on ? val : '?'}
      </text>
    </g>
  );
}

function HArrow({x1, x2, y, color, on, cur, top, bottom, left}) {
  const dir = left ? -1 : 1;
  const tip = left ? x1 : x2;
  const tail = left ? x2 : x1;
  const mid = (x1 + x2) / 2;
  return (
    <g opacity={on ? 1 : 0.3}>
      <line x1={tail} y1={y} x2={tip - dir * 1} y2={y} stroke={color} strokeWidth={cur ? 2.5 : 1.5} />
      <polygon points={`${tip},${y} ${tip - dir * 8},${y - 4} ${tip - dir * 8},${y + 4}`} fill={color} />
      {top ? (
        <text x={mid} y={y - 6} textAnchor="middle" className={s.ts} style={{fill: color, fontWeight: cur ? 700 : 500}}>
          {left && !on ? '× ?' : top}
        </text>
      ) : null}
      {bottom ? (
        <text x={mid} y={y + 16} textAnchor="middle" className={s.ts}>
          {bottom}
        </text>
      ) : null}
    </g>
  );
}

export default function TwoLayerBackprop() {
  const [st, setSt] = useState(NF);
  const n = net(X, W1, W2, T);
  const idx = (k) => STEPS.findIndex((q) => q.k === k);
  const have = (k) => idx(k) < st;
  const cur = st > 0 ? STEPS[st - 1].k : null;
  const used = st > 0 ? STEPS[st - 1].uses || [] : [];
  const done = st >= STEPS.length;
  const v = (k) => fmt(n[k], 4);

  const nw1 = W1 - EPS * n.dw1;
  const nw2 = W2 - EPS * n.dw2;
  const nE = net(X, nw1, nw2, T).E;
  const rA = 1 - n.h * n.h; // tanh의 변화율

  const fMid = FY + BH / 2;
  const sMid = SY + BH / 2;

  return (
    <Viz
      title="두 단계 망: 값은 앞으로, 신호는 뒤로"
      caption="위 줄은 순방향으로 만든 값이고, 아래 줄은 오차가 뒤로 보내는 신호입니다. 신호는 한 칸 넘어갈 때마다 그 칸의 변화율을 곱한 값이 됩니다. 파란 테두리는 그 단계에서 순방향에 저장해 둔 값을 다시 쓴다는 표시입니다."
    >
      <Controls>
        <Btn onClick={() => setSt(Math.max(0, st - 1))}>이전</Btn>
        <Btn onClick={() => setSt(Math.min(STEPS.length, st + 1))}>다음</Btn>
        <Btn onClick={() => setSt(STEPS.length)}>끝까지</Btn>
        <Btn onClick={() => setSt(0)}>처음으로</Btn>
        <span className={s.ts}>{st} / {STEPS.length}칸</span>
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="두 단계 망의 순방향 값과 역방향 신호">
        <text x={4} y={14} className={s.ts}>순방향 → 값을 만들고 저장합니다</text>

        {['a', 'h', 'y', 'E'].map((c) => (
          <line
            key={c}
            x1={CX[c]}
            y1={FY + BH}
            x2={CX[c]}
            y2={SY}
            stroke="var(--vgrid)"
            strokeDasharray="3 4"
          />
        ))}

        <Box x={CX.x} y={FY} title="입력 x" val={fmt(X, 4)} on used={used.includes('x')} />
        <Box x={CX.a} y={FY} title="a" val={v('a')} on={have('a')} cur={cur === 'a'} used={used.includes('a')} />
        <Box x={CX.h} y={FY} title="h" val={v('h')} on={have('h')} cur={cur === 'h'} used={used.includes('h')} />
        <text
          x={CX.h}
          y={FY + BH + 15}
          textAnchor="middle"
          className={s.ts}
          style={{paintOrder: 'stroke', stroke: 'var(--ifm-background-surface-color)', strokeWidth: 5}}
        >
          정답 없음
        </text>
        <Box x={CX.y} y={FY} title="출력 y" val={v('y')} on={have('y')} cur={cur === 'y'} used={used.includes('y')} />
        <Box x={CX.E} y={FY} title="오차 E" val={v('E')} on={have('E')} cur={cur === 'E'} />
        {[
          ['x', 'a', '× w₁', fmt(W1, 1), 'a'],
          ['a', 'h', 'tanh', '', 'h'],
          ['h', 'y', '× w₂', fmt(W2, 1), 'y'],
          ['y', 'E', '(y−t)²', `t = ${fmt(T, 0)}`, 'E'],
        ].map(([p, q, lab, sub, key]) => (
          <HArrow
            key={key}
            x1={CX[p] + BW / 2 + 3}
            x2={CX[q] - BW / 2 - 3}
            y={fMid}
            color={BASE}
            on={have(key)}
            cur={cur === key}
            top={lab}
            bottom={sub}
          />
        ))}

        <text x={4} y={102} className={s.ts} style={{fill: VB}}>
          ← 역방향 새 신호 = 뒤에서 온 신호 × 이 칸의 변화율
        </text>

        <Box x={CX.E} y={SY} title="∂E/∂E" val="1" on={have('dy')} cur={cur === 'dy'} color={VB} />
        <Box x={CX.y} y={SY} title="∂E/∂y" val={v('dy')} on={have('dy')} cur={cur === 'dy'} color={VB} />
        <Box x={CX.h} y={SY} title="∂E/∂h" val={v('dh')} on={have('dh')} cur={cur === 'dh'} color={VB} />
        <Box x={CX.a} y={SY} title="∂E/∂a" val={v('da')} on={have('da')} cur={cur === 'da'} color={VB} />
        <text x={CX.x} y={SY + 20} textAnchor="middle" className={s.ts}>입력 x의</text>
        <text x={CX.x} y={SY + 36} textAnchor="middle" className={s.ts}>기울기는 불필요</text>

        <HArrow
          left
          x1={CX.y + BW / 2 + 3}
          x2={CX.E - BW / 2 - 3}
          y={sMid}
          color={VB}
          on={have('dy')}
          cur={cur === 'dy'}
          top={`× ${fmt(n.dy, 4)}`}
          bottom="2(y−t)"
        />
        <HArrow
          left
          x1={CX.h + BW / 2 + 3}
          x2={CX.y - BW / 2 - 3}
          y={sMid}
          color={VB}
          on={have('dh')}
          cur={cur === 'dh'}
          top={`× ${fmt(W2, 4)}`}
          bottom="w₂"
        />
        <HArrow
          left
          x1={CX.a + BW / 2 + 3}
          x2={CX.h - BW / 2 - 3}
          y={sMid}
          color={VB}
          on={have('da')}
          cur={cur === 'da'}
          top={`× ${fmt(rA, 4)}`}
          bottom="1 − h²"
        />

        {[
          ['y', 'dw2', '∂E/∂w₂', `× h = × ${fmt(n.h, 4)}`],
          ['a', 'dw1', '∂E/∂w₁', `× x = × ${fmt(X, 4)}`],
        ].map(([c, k, title, lab]) => (
          <g key={k}>
            <g opacity={have(k) ? 1 : 0.3}>
              <line x1={CX[c]} y1={SY + BH + 2} x2={CX[c]} y2={GY - 3} stroke={VB} strokeWidth={cur === k ? 2.5 : 1.5} />
              <polygon points={`${CX[c]},${GY} ${CX[c] - 4},${GY - 8} ${CX[c] + 4},${GY - 8}`} fill={VB} />
              <text x={CX[c] + 8} y={(SY + BH + GY) / 2 + 4} className={s.ts} style={{fill: VB, fontWeight: cur === k ? 700 : 500}}>
                {have(k) ? lab : '× ?'}
              </text>
            </g>
            <Box x={CX[c]} y={GY} title={title} val={v(k)} on={have(k)} cur={cur === k} color={VB} />
          </g>
        ))}
      </svg>
      <Note>{st === 0 ? '입력과 파라미터만 있습니다. 다음 버튼을 눌러 한 칸씩 따라가 보세요.' : STEPS[st - 1].note}</Note>
      {done ? (
        <>
          <Note>
            w₁까지 이어 곱하면 ∂E/∂w₁ = {fmt(n.dy, 4)} × {fmt(W2, 4)} × {fmt(rA, 4)} × {fmt(X, 4)} = {fmt(n.dw1, 4)}입니다. 칸마다 변화율을 곱한 연쇄를 뒤에서부터 풀어 쓴 값입니다.
          </Note>
          <Stats>
            <Stat label="경사하강법 한 번 뒤 w₁ (learning rate 0.1)" value={fmt(nw1, 4)} />
            <Stat label="w₂" value={fmt(nw2, 4)} />
            <Stat label="오차" value={`${fmt(n.E, 4)} → ${fmt(nE, 4)}`} tone={nE < n.E ? 'good' : 'bad'} />
          </Stats>
        </>
      ) : null}
    </Viz>
  );
}
