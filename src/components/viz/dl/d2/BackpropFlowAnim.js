import React, {useEffect, useState} from 'react';
import {Viz, Controls, Btn, Note, styles as s} from '../../Viz';
import {net, tr} from './lib';

// 본문 두 단계 망(입력 1, w₁ = 0.5, w₂ = 1, 정답 0)의 순방향 -> 역방향을 자동으로 재생한다.
// 파랑: 순방향 값과 저장해 둔 값. 주황: 역방향 신호와 기울기.

const X = 1;
const W1 = 0.5;
const W2 = 1;
const T = 0;

const W = 600;
const H = 340;
const BW = 64;
const BH = 44;
const TW = 80;
const TH = 26;
const CX = {x: 50, a: 170, h: 290, y: 410, E: 530};
const FY = 34; // 순방향 줄의 위쪽
const TY = 106; // 저장 칸의 위쪽
const SY = 190; // 역방향 신호 줄의 위쪽
const GY = 282; // 파라미터 기울기 줄의 위쪽
const VA = 'var(--va)';
const VB = 'var(--vb)';
const BASE = 'var(--ifm-font-color-base)';
const SURFACE = 'var(--ifm-background-surface-color)';
const STEP_MS = 2600;

// 단계(phase) 번호. 0은 시작 상태, 1~4는 순방향, 5~9는 역방향, 10은 정리.
const PH = {a: 1, h: 2, y: 3, E: 4, dy: 5, dw2: 6, dh: 7, da: 8, dw1: 9, end: 10};
const LAST = PH.end;

// 러너(지금 계산하는 칸을 가리키는 점)의 위치: [열, 줄]
const RUN = [
  ['x', 'f'], ['a', 'f'], ['h', 'f'], ['y', 'f'], ['E', 'f'],
  ['y', 's'], ['y', 'g'], ['h', 's'], ['a', 's'], ['a', 'g'], ['a', 'g'],
];
const ROW_Y = {f: FY, s: SY, g: GY};

function Box({x, y, title, val, on, cur, color, still}) {
  const stroke = cur ? color : on ? BASE : 'var(--ifm-color-emphasis-400)';
  return (
    <g style={{opacity: on ? 1 : 0.3, transition: still ? 'none' : 'opacity 500ms ease'}}>
      <rect
        x={x - BW / 2}
        y={y}
        width={BW}
        height={BH}
        rx={6}
        fill={cur ? `color-mix(in srgb, ${color} 14%, ${SURFACE})` : 'none'}
        stroke={stroke}
        strokeWidth={cur ? 3 : 1.5}
      />
      <text x={x} y={y + 17} textAnchor="middle" className={s.ts} style={{fill: color === VB ? VB : undefined}}>
        {title}
      </text>
      <text x={x} y={y + 36} textAnchor="middle" className={s.t} style={{fontWeight: 600}}>
        {on ? val : '?'}
      </text>
    </g>
  );
}

function HArrow({x1, x2, y, color, on, cur, top, bottom, left, still}) {
  const dir = left ? -1 : 1;
  const tip = left ? x1 : x2;
  const tail = left ? x2 : x1;
  const mid = (x1 + x2) / 2;
  return (
    <g style={{opacity: on ? 1 : 0.3, transition: still ? 'none' : 'opacity 500ms ease'}}>
      <line x1={tail} y1={y} x2={tip - dir} y2={y} stroke={color} strokeWidth={cur ? 2.5 : 1.5} />
      <polygon points={`${tip},${y} ${tip - dir * 8},${y - 4} ${tip - dir * 8},${y + 4}`} fill={color} />
      <text x={mid} y={y - 6} textAnchor="middle" className={s.ts} style={{fill: color, fontWeight: cur ? 700 : 500}}>
        {on || !left ? top : '× ?'}
      </text>
      <text x={mid} y={y + 16} textAnchor="middle" className={s.ts}>
        {bottom}
      </text>
    </g>
  );
}

export default function BackpropFlowAnim() {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [still, setStill] = useState(false);

  useEffect(() => {
    let reduce = false;
    try {
      reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      reduce = false;
    }
    setStill(reduce);
    setPlaying(!reduce);
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setI((k) => (k >= LAST ? 0 : k + 1)), STEP_MS);
    return () => clearInterval(id);
  }, [playing]);

  const n = net(X, W1, W2, T);
  const f = (v) => tr(v, 4); // 끝의 0을 지운 소수 넷째 자리
  const rA = 1 - n.h * n.h; // tanh의 변화율 1 - h²

  const k = Math.min(Math.max(i, 0), LAST);
  const have = (key) => k >= PH[key];
  const cur = (key) => k === PH[key];

  // 저장 칸: 순방향에서 만들어질 때 저장되고, 역방향에서 쓰이며, 끝나면 버린다.
  const tags = [
    {key: 'x', label: `x = ${f(X)}`, savedAt: 1, usedAt: [PH.dw1]},
    {key: 'h', label: `h = ${f(n.h)}`, savedAt: PH.h, usedAt: [PH.dw2, PH.da]},
    {key: 'y', label: `y = ${f(n.y)}`, savedAt: PH.y, usedAt: [PH.dy]},
  ];

  const notes = [
    `입력 x = ${f(X)}, 가중치 w₁ = ${f(W1)}, w₂ = ${f(W2)}, 정답 t = ${f(T)}만 있습니다. 먼저 값을 앞에서 뒤로 만들어 갑니다.`,
    `순방향 1단계: a = w₁ × x = ${f(W1)} × ${f(X)} = ${f(n.a)}. 입력 x는 나중에 w₁의 기울기를 구할 때 쓰므로 저장 칸에 넣어 둡니다.`,
    `순방향 2단계: h = tanh(a) = ${f(n.h)}. h는 나중에 두 번 쓰이므로(w₂의 기울기, tanh의 변화율) 저장 칸에 넣어 둡니다. h에는 정답이 붙어 있지 않습니다.`,
    `순방향 3단계: y = w₂ × h = ${f(W2)} × ${f(n.h)} = ${f(n.y)}. y도 오차의 변화율을 구할 때 쓰므로 저장합니다.`,
    `순방향 4단계: E = (y − t)² = (${f(n.y)} − ${f(T)})² = ${f(n.E)}. 순방향이 끝났고, 저장 칸에는 x, h, y가 들어 있습니다. 이제 오차에서 뒤로 돌아갑니다.`,
    `역방향 1단계: 시작 신호는 1입니다(E가 E에 미치는 영향). 여기에 2(y − t)를 곱하는데, 이때 저장해 둔 y가 필요합니다: 2 × (${f(n.y)} − ${f(T)}) = ${f(n.dy)}. 저장 칸의 y가 파랗게 켜진 것을 보세요.`,
    `역방향 2단계: w₂는 여기서 끝납니다. ∂E/∂w₂ = ${f(n.dy)} × h = ${f(n.dy)} × ${f(n.h)} = ${f(n.dw2)}. 저장해 둔 h를 꺼내 곱합니다.`,
    `역방향 3단계: h로 신호를 넘깁니다. ∂E/∂h = ${f(n.dy)} × w₂ = ${f(n.dy)} × ${f(W2)} = ${f(n.dh)}. w₂는 파라미터라 저장 칸 없이 그대로 쓸 수 있습니다. 이 값은 정답이 아니라 출력 오차가 뒤로 보낸 신호입니다.`,
    `역방향 4단계: a로 신호를 넘깁니다. 이번에는 저장해 둔 h로 tanh의 변화율 1 − h² = 1 − ${f(n.h)}² = ${f(rA)}를 만들어 곱합니다: ∂E/∂a = ${f(n.dh)} × ${f(rA)} = ${f(n.da)}.`,
    `역방향 5단계: w₁도 여기서 끝납니다. ∂E/∂w₁ = ${f(n.da)} × x = ${f(n.da)} × ${f(X)} = ${f(n.dw1)}. 저장해 둔 x를 꺼내 곱합니다.`,
    `정리: 기울기 둘이 모두 나왔습니다. ∂E/∂w₂ = ${f(n.dw2)}, ∂E/∂w₁ = ${f(n.dw1)}. 순방향 한 번, 역방향 한 번이면 충분합니다. 저장해 둔 x, h, y는 이제 쓸 데가 없어서 희미해졌습니다. 보통은 이 시점에 버립니다.`,
  ];

  const [rc, rr] = RUN[k];
  const rx = CX[rc] + BW / 2;
  const ry = ROW_Y[rr];
  const back = k >= PH.dy;
  const fMid = FY + BH / 2;
  const sMid = SY + BH / 2;
  const spring = still ? 'none' : 'transform 800ms ease, fill 400ms ease';
  const fade = still ? 'none' : 'opacity 500ms ease';

  return (
    <Viz
      title="두 단계 망 전체 흐름: 값을 저장하며 앞으로, 신호를 곱하며 뒤로"
      caption="같은 계산을 자동으로 되풀이해 보여 줍니다. 파랑은 순방향 값과 저장해 둔 값, 주황은 뒤로 가는 신호와 기울기입니다. 숫자는 소수 넷째 자리로 반올림해 보여 주므로 곱셈이 끝자리에서 1쯤 어긋날 수 있습니다."
    >
      <Controls>
        <Btn on={playing} onClick={() => setPlaying(!playing)}>{playing ? '일시정지' : '재생'}</Btn>
        <Btn onClick={() => setI(0)}>처음으로</Btn>
        <Btn onClick={() => { setPlaying(false); setI(Math.max(0, k - 1)); }}>이전</Btn>
        <Btn onClick={() => { setPlaying(false); setI(Math.min(LAST, k + 1)); }}>다음</Btn>
        <span className={s.ts}>{k + 1} / {LAST + 1}</span>
      </Controls>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={s.svg}
        role="img"
        aria-label="두 단계 망에서 순방향 값이 오른쪽으로 흐르며 저장되고, 오차에서 시작한 신호가 왼쪽으로 돌아오며 저장한 값을 써서 w₁과 w₂의 기울기가 채워지는 과정"
      >
        <text x={4} y={14} className={s.ts}>순방향 → 값을 만들고 저장합니다</text>

        <Box x={CX.x} y={FY} title="입력 x" val={f(X)} on cur={k === 0} color={VA} still={still} />
        <Box x={CX.a} y={FY} title="a" val={f(n.a)} on={have('a')} cur={cur('a')} color={VA} still={still} />
        <Box x={CX.h} y={FY} title="h" val={f(n.h)} on={have('h')} cur={cur('h')} color={VA} still={still} />
        <Box x={CX.y} y={FY} title="출력 y" val={f(n.y)} on={have('y')} cur={cur('y')} color={VA} still={still} />
        <Box x={CX.E} y={FY} title="오차 E" val={f(n.E)} on={have('E')} cur={cur('E')} color={VA} still={still} />
        {[
          ['x', 'a', '× w₁', f(W1), 'a'],
          ['a', 'h', 'tanh', '', 'h'],
          ['h', 'y', '× w₂', f(W2), 'y'],
          ['y', 'E', '(y−t)²', `t = ${f(T)}`, 'E'],
        ].map(([p, q, lab, sub, key]) => (
          <HArrow
            key={key}
            x1={CX[p] + BW / 2 + 3}
            x2={CX[q] - BW / 2 - 3}
            y={fMid}
            color={BASE}
            on={have(key)}
            cur={cur(key)}
            top={lab}
            bottom={sub}
            still={still}
          />
        ))}

        {tags.map((tg) => {
          const saved = k >= tg.savedAt;
          const used = tg.usedAt.includes(k);
          const gone = k === PH.end;
          const op = !saved ? 0 : gone ? 0.25 : 1;
          return (
            <g key={tg.key} style={{opacity: op, transition: fade}}>
              <line x1={CX[tg.key]} y1={FY + BH} x2={CX[tg.key]} y2={TY} stroke={VA} strokeWidth={1.5} strokeDasharray="3 3" />
              <rect
                x={CX[tg.key] - TW / 2}
                y={TY}
                width={TW}
                height={TH}
                rx={13}
                fill={used ? `color-mix(in srgb, ${VA} 22%, ${SURFACE})` : SURFACE}
                stroke={VA}
                strokeWidth={used ? 3 : 1.5}
              />
              <text x={CX[tg.key]} y={TY + 17} textAnchor="middle" className={s.t} style={{fontWeight: used ? 700 : 500}}>
                {tg.label}
              </text>
            </g>
          );
        })}
        <text x={4} y={TY + TH + 18} className={s.ts} style={{fill: VA}}>
          {k === PH.end
            ? '저장해 둔 값: 역방향이 끝나서 버려도 됩니다'
            : k >= 1
              ? '저장해 둔 값 (두꺼운 칸은 지금 꺼내 쓰는 값)'
              : '저장해 둔 값: 아직 없습니다'}
        </text>

        <text x={4} y={SY - 24} className={s.ts} style={{fill: VB}}>
          ← 역방향: 새 신호 = 뒤에서 온 신호 × 이 칸의 변화율
        </text>

        <Box x={CX.E} y={SY} title="∂E/∂E" val="1" on={have('dy')} cur={cur('dy')} color={VB} still={still} />
        <Box x={CX.y} y={SY} title="∂E/∂y" val={f(n.dy)} on={have('dy')} cur={cur('dy')} color={VB} still={still} />
        <Box x={CX.h} y={SY} title="∂E/∂h" val={f(n.dh)} on={have('dh')} cur={cur('dh')} color={VB} still={still} />
        <Box x={CX.a} y={SY} title="∂E/∂a" val={f(n.da)} on={have('da')} cur={cur('da')} color={VB} still={still} />

        <HArrow left x1={CX.y + BW / 2 + 3} x2={CX.E - BW / 2 - 3} y={sMid} color={VB} on={have('dy')} cur={cur('dy')} top={`× ${f(n.dy)}`} bottom="2(y−t)" still={still} />
        <HArrow left x1={CX.h + BW / 2 + 3} x2={CX.y - BW / 2 - 3} y={sMid} color={VB} on={have('dh')} cur={cur('dh')} top={`× ${f(W2)}`} bottom="w₂" still={still} />
        <HArrow left x1={CX.a + BW / 2 + 3} x2={CX.h - BW / 2 - 3} y={sMid} color={VB} on={have('da')} cur={cur('da')} top={`× ${f(rA)}`} bottom="1 − h²" still={still} />

        {[
          ['y', 'dw2', '∂E/∂w₂', `× h = × ${f(n.h)}`, f(n.dw2)],
          ['a', 'dw1', '∂E/∂w₁', `× x = × ${f(X)}`, f(n.dw1)],
        ].map(([c, key, title, lab, val]) => (
          <g key={key}>
            <g style={{opacity: have(key) ? 1 : 0.3, transition: fade}}>
              <line x1={CX[c]} y1={SY + BH + 2} x2={CX[c]} y2={GY - 3} stroke={VB} strokeWidth={cur(key) ? 2.5 : 1.5} />
              <polygon points={`${CX[c]},${GY} ${CX[c] - 4},${GY - 8} ${CX[c] + 4},${GY - 8}`} fill={VB} />
              <text x={CX[c] + 14} y={(SY + BH + GY) / 2 + 4} className={s.ts} style={{fill: VB, fontWeight: cur(key) ? 700 : 500}}>
                {have(key) ? lab : '× ?'}
              </text>
            </g>
            <Box x={CX[c]} y={GY} title={title} val={val} on={have(key)} cur={cur(key)} color={VB} still={still} />
          </g>
        ))}
        <text x={CX.x} y={SY + 20} textAnchor="middle" className={s.ts}>입력 x의</text>
        <text x={CX.x} y={SY + 36} textAnchor="middle" className={s.ts}>기울기는 불필요</text>

        <g style={{transform: `translate(${rx}px, ${ry}px)`, transition: spring}}>
          <circle r={7} fill={back ? VB : VA} stroke={SURFACE} strokeWidth={2} style={{transition: still ? 'none' : 'fill 400ms ease'}} />
        </g>
      </svg>
      <Note>{notes[k]}</Note>
    </Viz>
  );
}
