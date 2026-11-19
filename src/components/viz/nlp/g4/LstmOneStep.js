import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {sigmoid, trim} from './util';

// 문마다 (W: x에 곱, U: h에 곱, b: 바이어스) — 상태 크기 1
const P = {f: [1, 1, 0], i: [2, 0, -1], g: [1, -1, 0], o: [0, 2, 0]};
const NAMES = {f: '잊는 문 f', i: '넣는 문 i', g: '넣을 내용 g', o: '내보내는 문 o'};

function step(x, hPrev, cPrev) {
  const z = {};
  Object.keys(P).forEach((k) => {
    z[k] = P[k][0] * x + P[k][1] * hPrev + P[k][2];
  });
  const f = sigmoid(z.f);
  const i = sigmoid(z.i);
  const g = Math.tanh(z.g);
  const o = sigmoid(z.o);
  const c = f * cPrev + i * g;
  const th = Math.tanh(c);
  return {z, val: {f, i, g, o}, keep: f * cPrev, add: i * g, c, th, h: o * th};
}

// 부호를 살린 덧셈 식: [1, -0.5, 0] -> "1 − 0.5 + 0"
const signed = (terms) =>
  terms.map((v, k) => (k === 0 ? trim(v) : `${v < 0 ? '−' : '+'} ${trim(Math.abs(v))}`)).join(' ');

const box = {fill: 'var(--ifm-background-surface-color)', stroke: 'var(--ifm-color-emphasis-500)', strokeWidth: 1.5, rx: 6};

export default function LstmOneStep() {
  const [x1, setX1] = useState(1);
  const [h0, setH0] = useState(0.5);
  const [c0, setC0] = useState(2);
  const [x2, setX2] = useState(0);
  const [which, setWhich] = useState(1);

  const r1 = step(x1, h0, c0);
  const r2 = step(x2, r1.h, r1.c);
  const cur = which === 1 ? r1 : r2;
  const x = which === 1 ? x1 : x2;
  const hp = which === 1 ? h0 : r1.h;
  const cp = which === 1 ? c0 : r1.c;

  return (
    <Viz
      title="한 스텝 계산: 문의 값은 어디서 나오나"
      caption="입력과 이전 상태를 바꿔 보세요. 가중치는 본문 표의 값(W, U, b)으로 고정되어 있고, 상태의 크기는 1입니다. 기본값이면 본문 표와 같은 숫자가 나옵니다."
    >
      <Controls>
        <Btn on={which === 1} onClick={() => setWhich(1)}>첫 스텝</Btn>
        <Btn on={which === 2} onClick={() => setWhich(2)}>다음 자리 (입력 x2)</Btn>
      </Controls>
      <Controls>
        {which === 1 ? (
          <Slider label="입력 x" min={-2} max={2} step={0.1} value={x1} onChange={setX1} format={(v) => fmt(v, 1)} />
        ) : (
          <Slider label="다음 입력 x2" min={-2} max={2} step={0.1} value={x2} onChange={setX2} format={(v) => fmt(v, 1)} />
        )}
        <Slider label="처음의 h" min={-1} max={1} step={0.1} value={h0} onChange={setH0} format={(v) => fmt(v, 1)} />
        <Slider label="처음의 c" min={-3} max={3} step={0.1} value={c0} onChange={setC0} format={(v) => fmt(v, 1)} />
      </Controls>
      <p className={s.note}>
        {which === 1
          ? '지금 보는 스텝: 입력 x와 이전 상태(h, c)로 시작합니다.'
          : `지금 보는 스텝: 첫 스텝의 결과(h = ${trim(r1.h, 4)}, c = ${trim(r1.c, 4)})가 이전 상태로 들어옵니다.`}
      </p>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>문</th>
            <th>(W, U, b)</th>
            <th>z = W·x + U·h + b</th>
            <th>활성화</th>
            <th>값</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(P).map((k) => (
            <tr key={k}>
              <td>{NAMES[k]}</td>
              <td>({P[k].join(', ')})</td>
              <td>
                {signed([P[k][0] * x, P[k][1] * hp, P[k][2]])} = <b>{trim(cur.z[k])}</b>
              </td>
              <td>{k === 'g' ? 'tanh' : '시그모이드'}({trim(cur.z[k])})</td>
              <td className={s.cellOn}>{fmt(cur.val[k], 4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <svg viewBox="0 0 640 100" className={s.svg} role="img" aria-label="이전 통로에 잊는 문 값을 곱하고, 넣는 값을 더해 새 통로를 만든다.">
        <rect x={6} y={30} width={110} height={46} {...box} />
        <text x={61} y={50} className={s.ts} textAnchor="middle">c(t-1)</text>
        <text x={61} y={68} className={s.t} textAnchor="middle" fontWeight="600">{fmt(cp, 3)}</text>
        <rect x={160} y={30} width={110} height={46} {...box} stroke="var(--vb)" />
        <text x={215} y={50} className={s.ts} textAnchor="middle">× f {fmt(cur.val.f, 3)}</text>
        <text x={215} y={68} className={s.t} textAnchor="middle" fontWeight="600">{fmt(cur.keep, 3)}</text>
        <text x={298} y={59} className={s.t} textAnchor="middle" fontSize="18">+</text>
        <rect x={326} y={30} width={110} height={46} {...box} stroke="var(--va)" />
        <text x={381} y={50} className={s.ts} textAnchor="middle">i × g</text>
        <text x={381} y={68} className={s.t} textAnchor="middle" fontWeight="600">{fmt(cur.add, 3)}</text>
        <text x={462} y={59} className={s.t} textAnchor="middle" fontSize="18">=</text>
        <rect x={488} y={30} width={140} height={46} {...box} />
        <text x={558} y={50} className={s.ts} textAnchor="middle">c(t)</text>
        <text x={558} y={68} className={s.t} textAnchor="middle" fontWeight="600">{fmt(cur.c, 3)}</text>
      </svg>
      <Stats>
        <Stat label="새 통로 c" value={fmt(cur.c, 4)} />
        <Stat label="tanh(c)" value={fmt(cur.th, 4)} />
        <Stat label="숨은 상태 h = o·tanh(c)" value={fmt(cur.h, 4)} />
        <Stat label="이전 통로에서 남은 비율" value={`${fmt(cur.val.f * 100, 0)}%`} />
      </Stats>
      {which === 2 && Math.abs(x2) < 1e-9 ? (
        <Note>입력이 0인데도 h가 바뀌었습니다. 직전 h가 문에 들어가기 때문입니다. g가 음수이면 통로에 음수가 더해져 c가 줄어듭니다.</Note>
      ) : null}
    </Viz>
  );
}
