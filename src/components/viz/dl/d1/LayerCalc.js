import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {ACTS, num} from './dlmath';

const W0 = [
  [0.5, -0.2],
  [0.1, 0.4],
];
const V = [1, -1]; // 원문의 출력 줄
const halo = {stroke: 'var(--ifm-background-surface-color)', strokeWidth: 4, paintOrder: 'stroke'};
const ZX = 60;
const HX = 270;
const YX = 470;
const ZY = [55, 135];
const HY = [55, 135];

export default function LayerCalc() {
  const [z, setZ] = useState([1, 1]);
  const [W, setW] = useState(W0);
  const [b, setB] = useState([0, 0]);
  const [mode, setMode] = useState('tanh');
  const f = ACTS[mode].f;
  const a = [0, 1].map((j) => W[j][0] * z[0] + W[j][1] * z[1] + b[j]);
  const h = a.map(f);
  const y = V[0] * h[0] + V[1] * h[1];
  const setWij = (j, i) => (v) => setW(W.map((r, k) => (k === j ? r.map((c, m) => (m === i ? v : c)) : r)));
  const isOrig = W.every((r, j) => r.every((c, i) => c === W0[j][i])) && b[0] === 0 && b[1] === 0 && z[0] === 1 && z[1] === 1;
  const allZero = z[0] === 0 && z[1] === 0;

  return (
    <Viz
      title="두 칸짜리 층을 직접 계산하기"
      caption="z는 입력, a는 가중치를 곱해 더한 합, h는 구부린 값(은닉 값), y는 출력입니다. W의 아래 숫자 둘은 앞이 칸 번호, 뒤가 입력 번호입니다. 첫 층(W, b)은 원문의 두 줄 가중치이고, 출력 칸이 하나인 둘째 층의 가중치는 (1, -1)로 고정했습니다. 기본값에서 a = (0.3, 0.5), h = (0.291, 0.462), y = -0.171이 나옵니다."
    >
      <Controls>
        <Slider label="z₁" min={-2} max={2} step={0.1} value={z[0]} onChange={(v) => setZ([v, z[1]])} format={(v) => fmt(v, 1)} />
        <Slider label="z₂" min={-2} max={2} step={0.1} value={z[1]} onChange={(v) => setZ([z[0], v])} format={(v) => fmt(v, 1)} />
        {['tanh', 'relu', 'sigmoid', 'none'].map((m) => (
          <Btn key={m} on={mode === m} onClick={() => setMode(m)}>
            {m === 'none' ? '함수 없음' : ACTS[m].label}
          </Btn>
        ))}
      </Controls>
      <Controls>
        {[0, 1].map((j) =>
          [0, 1].map((i) => (
            <Slider key={`${j}${i}`} label={`W${j + 1}${i + 1}`} min={-1} max={1} step={0.1} value={W[j][i]} onChange={setWij(j, i)} format={(v) => fmt(v, 1)} />
          )),
        )}
      </Controls>
      <Controls>
        {[0, 1].map((j) => (
          <Slider key={j} label={`바이어스 b${j + 1}`} min={-1} max={1} step={0.1} value={b[j]} onChange={(v) => setB(b.map((c, k) => (k === j ? v : c)))} format={(v) => fmt(v, 1)} />
        ))}
        <Btn
          on={isOrig && mode === 'tanh'}
          onClick={() => {
            setZ([1, 1]);
            setW(W0);
            setB([0, 0]);
            setMode('tanh');
          }}
        >
          원문 값으로
        </Btn>
      </Controls>
      <svg className={s.svg} viewBox="0 0 560 190" role="img" aria-label="입력 z 두 칸이 가중치 W와 활성화 함수를 거쳐 은닉 값 h 두 칸이 되고, 다시 출력 y 하나가 되는 그림">
        {[0, 1].map((j) =>
          [0, 1].map((i) => {
            const t = i === j ? 0.5 : 0.24;
            const ly = ZY[i] + (HY[j] - ZY[i]) * t + (i === j ? -7 : i === 0 ? 11 : -3);
            return (
              <g key={`${j}${i}`}>
                <line x1={ZX + 22} y1={ZY[i]} x2={HX - 50} y2={HY[j]} stroke={W[j][i] >= 0 ? 'var(--va)' : 'var(--vb)'} strokeWidth={1 + Math.abs(W[j][i]) * 4} />
                <text x={ZX + 22 + (HX - 72 - ZX) * t} y={ly} textAnchor="middle" className={s.t} style={halo}>
                  {num(W[j][i], 1)}
                </text>
              </g>
            );
          }),
        )}
        {[0, 1].map((j) => (
          <g key={j}>
            <line x1={HX + 50} y1={HY[j]} x2={YX - 22} y2={95} stroke={V[j] >= 0 ? 'var(--va)' : 'var(--vb)'} strokeWidth={5} />
            <text x={HX + 50 + (YX - 72 - HX) * 0.4} y={HY[j] + (95 - HY[j]) * 0.4 + (j === 0 ? -8 : 15)} textAnchor="middle" className={s.t} style={halo}>
              {V[j]}
            </text>
            <rect x={HX - 50} y={HY[j] - 28} width={100} height={56} rx={8} fill="var(--ifm-background-color)" stroke="var(--ifm-color-emphasis-500)" />
            <text x={HX} y={HY[j] - 8} textAnchor="middle" className={s.ts}>
              a{j + 1} = {fmt(a[j], 3)}
            </text>
            <text x={HX} y={HY[j] + 14} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>
              h{j + 1} = {fmt(h[j], 3)}
            </text>
          </g>
        ))}
        {[0, 1].map((i) => (
          <g key={i}>
            <circle cx={ZX} cy={ZY[i]} r={22} fill="var(--ifm-background-color)" stroke="var(--ifm-color-emphasis-500)" />
            <text x={ZX} y={ZY[i] + 4} textAnchor="middle" className={s.t}>
              {fmt(z[i], 1)}
            </text>
            <text x={ZX - 30} y={ZY[i] + 4} textAnchor="end" className={s.ts}>
              z{i + 1}
            </text>
          </g>
        ))}
        <circle cx={YX} cy={95} r={26} fill="var(--ifm-background-color)" stroke="var(--vok)" strokeWidth={2.5} />
        <text x={YX} y={99} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>
          {fmt(y, 3)}
        </text>
        <text x={YX + 34} y={99} className={s.ts}>
          y
        </text>
      </svg>
      <Stats>
        <Stat label="a (합)" value={`${fmt(a[0], 3)}, ${fmt(a[1], 3)}`} />
        <Stat label={`h = ${ACTS[mode].label === '없음 (직선)' ? 'a 그대로' : ACTS[mode].label + '(a)'}`} value={`${fmt(h[0], 3)}, ${fmt(h[1], 3)}`} />
        <Stat label="y = h₁ − h₂" value={fmt(y, 3)} />
      </Stats>
      <Note>
        {allZero && b[0] === 0 && b[1] === 0
          ? '입력이 전부 0이고 바이어스도 0이면 a가 0이고 h도 0(시그모이드는 0.5)입니다. 바이어스를 올려 보세요. 입력이 0이어도 칸이 0이 아닌 값을 냅니다.'
          : allZero
            ? '입력이 전부 0이어도 바이어스 때문에 칸이 0이 아닌 값을 냅니다.'
            : 'f는 a 하나하나에 따로 적용됩니다. 학습이 고치는 것은 W와 b이고, f에는 고칠 빈칸이 없습니다.'}
      </Note>
    </Viz>
  );
}
