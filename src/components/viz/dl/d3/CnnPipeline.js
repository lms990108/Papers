import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, fmt, styles as s} from '../../Viz';

// 작은 CNN 하나를 숫자로 끝까지 따라가는 그림.
// 6×6 이미지 → 합성곱(kernel 2장) → ReLU → 2×2 풀링 → 펴기 → 완전 연결 → softmax
const A = [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]]; // 세로 경계: 오른쪽 열 − 왼쪽 열
const B = [[-1, -1, -1], [0, 0, 0], [1, 1, 1]]; // 가로 경계: 아래 줄 − 위 줄
const W_CLASS = [
  [1, 1, 1, 1, 0, 0, 0, 0], // '세로 띠' 클래스: A 맵의 값에만 가중치 1
  [0, 0, 0, 0, 1, 1, 1, 1], // '가로 띠' 클래스: B 맵의 값에만 가중치 1
];
const CLASSES = ['세로 띠', '가로 띠'];

const IMAGES = {
  v: {label: '세로 띠 이미지', make: () => Array.from({length: 6}, () => [0, 0, 1, 1, 0, 0])},
  h: {label: '가로 띠 이미지', make: () => Array.from({length: 6}, (_, r) => Array(6).fill(r === 2 || r === 3 ? 1 : 0))},
};

const conv = (x, k) =>
  Array.from({length: 4}, (_, i) =>
    Array.from({length: 4}, (_, j) => {
      let t = 0;
      for (let a = 0; a < 3; a += 1) for (let b = 0; b < 3; b += 1) t += x[i + a][j + b] * k[a][b];
      return t;
    }),
  );
const relu = (m) => m.map((r) => r.map((v) => Math.max(0, v)));
const pool = (m) =>
  [0, 1].map((i) => [0, 1].map((j) => Math.max(m[2 * i][2 * j], m[2 * i][2 * j + 1], m[2 * i + 1][2 * j], m[2 * i + 1][2 * j + 1])));

const W = 650;
const H = 318;
const num = (v) => (v < 0 ? `−${-v}` : String(v));
const heat = (v) => (v > 0 ? {fill: 'var(--va)', op: 0.15 + 0.3 * Math.min(1, v / 3)} : v < 0 ? {fill: 'var(--vbad)', op: 0.28} : {fill: 'none', op: 0});

function Grid({x, y, cell, m, label, on = true, hi = false}) {
  const n = m.length;
  return (
    <g opacity={on ? 1 : 0.18}>
      <text x={x} y={y - 7} className={s.ts} style={hi ? {fontWeight: 700} : undefined}>{label}</text>
      {m.map((row, i) =>
        row.map((v, j) => {
          const h = heat(v);
          return (
            <g key={`${i}-${j}`}>
              <rect x={x + j * cell} y={y + i * cell} width={cell} height={cell} fill={h.fill} fillOpacity={h.op} stroke="var(--ifm-color-emphasis-400)" strokeWidth={1} />
              <text x={x + j * cell + cell / 2} y={y + i * cell + cell / 2 + 4} textAnchor="middle" className={s.t} style={{fontSize: cell < 20 ? 11 : 13, fontWeight: 600}}>{num(v)}</text>
            </g>
          );
        }),
      )}
      {hi ? <rect x={x - 2} y={y - 2} width={n * cell + 4} height={n * cell + 4} fill="none" stroke="var(--vb)" strokeWidth={2.5} rx={3} /> : null}
    </g>
  );
}

function Kernel({x, y, k, label, on}) {
  return (
    <g opacity={on ? 1 : 0.18}>
      <text x={x} y={y - 7} className={s.ts}>{label}</text>
      {k.map((row, i) =>
        row.map((v, j) => (
          <g key={`${i}-${j}`}>
            <rect x={x + j * 17} y={y + i * 17} width={17} height={17} fill="var(--vc)" fillOpacity={v === 0 ? 0 : 0.18} stroke="var(--ifm-color-emphasis-400)" strokeWidth={1} />
            <text x={x + j * 17 + 8.5} y={y + i * 17 + 12.5} textAnchor="middle" className={s.ts} style={{fontSize: 10}}>{num(v)}</text>
          </g>
        )),
      )}
    </g>
  );
}

const STAGE = ['입력', '합성곱', 'ReLU', '풀링', '완전 연결', 'softmax'];

export default function CnnPipeline() {
  const [kind, setKind] = useState('v');
  const [st, setSt] = useState(0);

  const img = IMAGES[kind].make();
  const ca = conv(img, A);
  const cb = conv(img, B);
  const ra = relu(ca);
  const rb = relu(cb);
  const pa = pool(ra);
  const pb = pool(rb);
  const flat = [...pa.flat(), ...pb.flat()];
  const scores = W_CLASS.map((w) => w.reduce((t, wi, i) => t + wi * flat[i], 0));
  const exps = scores.map((v) => Math.exp(v));
  const probs = exps.map((e) => e / exps.reduce((a, b) => a + b, 0));
  const best = probs[0] >= probs[1] ? 0 : 1;
  const name = kind === 'v' ? '세로' : '가로';
  const hot = kind === 'v' ? 'A' : 'B';
  const idle = kind === 'v' ? 'B' : 'A';

  const notes = [
    `6×6 흑백 이미지입니다. 가운데 두 줄이 밝은 ${name} 띠입니다. 이 이미지를 왼쪽에서 오른쪽으로 흘려 보내며 단계마다 값이 어떻게 바뀌는지 봅니다. 아래 버튼으로 이미지를 바꿔도 kernel과 가중치는 그대로이고 달라지는 것은 중간 값뿐입니다.`,
    `합성곱: kernel A(세로 경계를 찾는 견본)와 kernel B(가로 경계를 찾는 견본)를 각각 이미지 전체에 옮겨 가며 곱하고 더합니다. 6×6에 3×3 창이면 출력은 4×4이고, kernel이 2장이라 feature map도 2장입니다. ${name} 띠에는 ${hot} 맵에만 값이 나오고 ${idle} 맵은 전부 0입니다.`,
    `ReLU: 음수를 0으로 자릅니다. 띠의 한쪽 경계는 어두운 곳에서 밝은 곳으로(+3), 다른 쪽 경계는 밝은 곳에서 어두운 곳으로(−3) 가는데, ${hot} 맵의 −3이 0이 되고 +3만 남습니다.`,
    `풀링: 2×2 덩어리마다 가장 큰 값 하나만 남겨 4×4를 2×2로 줄입니다. 칸 수가 4분의 1이 되고, 경계가 덩어리 안 어느 칸인지는 사라지고 "이쯤에 있다"만 남습니다.`,
    `완전 연결: 남은 8개 값(${hot} 맵 4개와 ${idle} 맵 4개)을 한 줄로 펴서, 클래스마다 가중치를 곱해 더합니다. 이 그림의 가중치는 설명하려고 고른 값이라서 "${CLASSES[0]}" 클래스는 A 맵 값에, "${CLASSES[1]}" 클래스는 B 맵 값에 1을 곱합니다. 이 이미지의 점수는 ${CLASSES[0]} ${scores[0]}, ${CLASSES[1]} ${scores[1]}입니다. 실제 망에서는 이 가중치도 학습으로 정해집니다.`,
    `softmax: 점수를 합이 1인 확률로 바꿉니다. e^${scores[best]} ÷ (e^${scores[0]} + e^${scores[1]}) = ${fmt(probs[best], 4)}로 "${CLASSES[best]}"가 선택됩니다. 이미지를 바꿔서 같은 망에 넣으면 선택이 바뀌는 것을 확인해 보세요. 학습으로 정해진 kernel과 가중치는 그대로입니다.`,
  ];

  // 열의 위치
  const X_IMG = 10;
  const X_K = 160;
  const X_CONV = 224;
  const X_RELU = 338;
  const X_POOL = 452;
  const X_FC = 520;
  const Y_A = 52;
  const Y_B = 184;
  const Y_IMG = 118;
  const col = (i) => st >= i;
  const hi = (i) => st === i;

  return (
    <Viz
      title="작은 CNN에 이미지를 넣어 점수가 나올 때까지"
      caption="6×6 이미지가 합성곱, ReLU, 풀링, 완전 연결, softmax를 차례로 지나갑니다. kernel 값과 완전 연결의 가중치는 설명용으로 고른 값이고, 실제로는 학습으로 정해집니다. 아직 거치지 않은 단계는 흐리게 보입니다."
    >
      <Controls>
        {Object.keys(IMAGES).map((k) => (
          <Btn key={k} on={kind === k} onClick={() => setKind(k)}>{IMAGES[k].label}</Btn>
        ))}
        <Btn onClick={() => setSt(Math.max(0, st - 1))}>이전</Btn>
        <Btn onClick={() => setSt(Math.min(5, st + 1))}>다음</Btn>
        <Btn onClick={() => setSt(5)}>끝까지</Btn>
        <Btn onClick={() => setSt(0)}>처음으로</Btn>
        <span className={s.ts}>{st + 1} / 6단계: {STAGE[st]}</span>
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="6×6 이미지가 합성곱, ReLU, 풀링, 완전 연결, softmax를 지나 클래스 점수가 되는 과정">
        <Grid x={X_IMG} y={Y_IMG} cell={22} m={img} label="입력 6×6" hi={hi(0)} />

        <Kernel x={X_K} y={Y_A} k={A} label="kernel A" on={col(1)} />
        <Kernel x={X_K} y={Y_B} k={B} label="kernel B" on={col(1)} />
        <Grid x={X_CONV} y={Y_A} cell={24} m={ca} label="맵 A (4×4)" on={col(1)} hi={hi(1)} />
        <Grid x={X_CONV} y={Y_B} cell={24} m={cb} label="맵 B (4×4)" on={col(1)} hi={hi(1)} />

        <Grid x={X_RELU} y={Y_A} cell={24} m={ra} label="ReLU 후 A" on={col(2)} hi={hi(2)} />
        <Grid x={X_RELU} y={Y_B} cell={24} m={rb} label="ReLU 후 B" on={col(2)} hi={hi(2)} />

        <Grid x={X_POOL} y={Y_A + 22} cell={26} m={pa} label="풀링 A" on={col(3)} hi={hi(3)} />
        <Grid x={X_POOL} y={Y_B + 22} cell={26} m={pb} label="풀링 B" on={col(3)} hi={hi(3)} />

        {CLASSES.map((c, i) => {
          const y = (i === 0 ? Y_A : Y_B) + 2;
          const win = st >= 5 && best === i;
          return (
            <g key={c} opacity={col(4) ? 1 : 0.18}>
              <rect x={X_FC} y={y} width={126} height={92} rx={8} fill={win ? 'var(--vok)' : 'none'} fillOpacity={win ? 0.16 : 0} stroke={hi(4) || win ? 'var(--vb)' : 'var(--ifm-color-emphasis-400)'} strokeWidth={hi(4) || win ? 2.5 : 1.2} />
              <text x={X_FC + 10} y={y + 20} className={s.t} style={{fontWeight: 700}}>{c}</text>
              <text x={X_FC + 10} y={y + 44} className={s.t}>점수 = {scores[i]}</text>
              <text x={X_FC + 10} y={y + 66} className={s.t} style={{opacity: st >= 5 ? 1 : 0.25}}>확률 = {st >= 5 ? fmt(probs[i], 4) : '?'}</text>
              {win ? <text x={X_FC + 10} y={y + 84} className={s.ts} style={{fontWeight: 700, fill: 'var(--vok)'}}>← 선택</text> : null}
            </g>
          );
        })}
        <text x={X_FC} y={Y_A - 7} className={s.ts} style={{opacity: col(4) ? 1 : 0.18}}>완전 연결 → 클래스</text>

        {[[X_IMG + 138, 0], [X_CONV + 100, 1], [X_RELU + 100, 2], [X_POOL + 56, 3]].map(([x, i]) => (
          <text key={i} x={x} y={Y_A + 52} className={s.ts} style={{opacity: st > i ? 1 : 0.18}}>→</text>
        ))}
        <text x={X_IMG} y={H - 10} className={s.ts}>칸 색: 파랑은 양수, 빨강은 음수, 흰색은 0</text>
      </svg>
      <Note>{notes[st]}</Note>
    </Viz>
  );
}
