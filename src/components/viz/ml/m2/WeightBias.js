import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {sigmoid, num} from './mlCore';

const W = 520;
const H = 270;
const L = 42;
const R = 14;
const T = 12;
const B = 30;
const PRE1 = [
  {w: 1, b: 0},
  {w: 2, b: 0},
  {w: 1, b: 1},
];
// 2D 보기: 좋다 횟수 x1, 나쁘다 횟수 x2
const PTS = [
  {name: '연기가 좋다', x: [1, 0]},
  {name: '결말이 나쁘다', x: [0, 1]},
  {name: '연기가 좋다, 좋다', x: [2, 0]},
];
const XR = 3;

function OneD({w, b}) {
  const X0 = -4;
  const X1 = 4;
  const px = (x) => L + ((x - X0) / (X1 - X0)) * (W - L - R);
  const py = (p) => H - B - p * (H - T - B);
  const pts = [];
  for (let i = 0; i <= 100; i += 1) {
    const x = X0 + (i / 100) * (X1 - X0);
    pts.push(px(x) + ',' + py(sigmoid(w * x + b)));
  }
  const mid = w === 0 ? null : -b / w;
  const p1 = sigmoid(w + b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="입력 x에 대한 p = sigmoid(wx + b) 곡선과 x = 1의 리뷰">
      {[-4, -2, 0, 2, 4].map((v) => (
        <g key={v}>
          <line x1={px(v)} y1={T} x2={px(v)} y2={H - B} stroke="var(--vgrid)" />
          <text x={px(v)} y={H - B + 16} className={s.ts} textAnchor="middle">{v}</text>
        </g>
      ))}
      {[0, 0.5, 1].map((v) => (
        <g key={v}>
          <line x1={L} y1={py(v)} x2={W - R} y2={py(v)} stroke="var(--vgrid)" />
          <text x={L - 6} y={py(v) + 4} className={s.ts} textAnchor="end">{v}</text>
        </g>
      ))}
      <text x={W - R} y={H - 4} className={s.ts} textAnchor="end">입력 x (좋다 횟수)</text>
      <text x={L + 4} y={T + 10} className={s.ts}>비율 p</text>
      <line x1={px(1)} y1={T} x2={px(1)} y2={H - B} stroke="var(--va)" strokeDasharray="4 3" />
      <text x={px(1) + 5} y={T + 24} className={s.ts} style={{fill: 'var(--va)'}}>연기가 좋다 (x = 1)</text>
      {mid !== null && mid >= X0 && mid <= X1 ? (
        <g>
          <line x1={px(mid)} y1={py(0.5)} x2={px(mid)} y2={H - B} stroke="var(--vok)" strokeWidth="2" />
          <text x={px(mid) + 5} y={H - B - 6} className={s.ts} style={{fill: 'var(--vok)'}}>p = 0.5가 되는 x = {num(mid, 2)}</text>
        </g>
      ) : null}
      <polyline points={pts.join(' ')} fill="none" stroke="var(--vb)" strokeWidth="2.5" />
      <circle cx={px(1)} cy={py(p1)} r="5.5" fill="var(--va)" />
      <text x={px(1) + 9} y={py(p1) + (p1 > 0.5 ? 16 : -8)} className={s.t}>p = {num(p1, 3)}</text>
    </svg>
  );
}

function TwoD({w1, w2, b}) {
  const XM = -0.6;
  const px = (x) => L + ((x - XM) / (XR - XM)) * (W - L - R);
  const py = (y) => H - B - ((y - XM) / (XR - XM)) * (H - T - B);
  const N = 24;
  const cw = (W - L - R) / N;
  const ch = (H - T - B) / N;
  const cells = [];
  for (let i = 0; i < N; i += 1) {
    for (let j = 0; j < N; j += 1) {
      const p = sigmoid(w1 * (XM + ((i + 0.5) / N) * (XR - XM)) + w2 * (XM + ((j + 0.5) / N) * (XR - XM)) + b);
      cells.push(
        <rect key={i + '-' + j} x={L + i * cw} y={H - B - (j + 1) * ch} width={cw + 0.5} height={ch + 0.5} fill={p > 0.5 ? 'var(--va)' : 'var(--vb)'} fillOpacity={Math.abs(p - 0.5) * 0.7} />,
      );
    }
  }
  let seg = null;
  if (Math.abs(w2) > 1e-9) {
    seg = [XM, XR].map((x) => [px(x), py((-b - w1 * x) / w2)]);
  } else if (Math.abs(w1) > 1e-9) {
    seg = [XM, XR].map((y) => [px(-b / w1), py(y)]);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="좋다 횟수와 나쁘다 횟수 평면에서 비율의 색과 분할 직선, 세 리뷰의 위치">
      <clipPath id="m2WbClip">
        <rect x={L} y={T} width={W - L - R} height={H - T - B} />
      </clipPath>
      <g clipPath="url(#m2WbClip)">{cells}</g>
      {[0, 1, 2, 3].map((v) => (
        <g key={v}>
          <text x={px(v)} y={H - B + 16} className={s.ts} textAnchor="middle">{v}</text>
          <text x={L - 6} y={py(v) + 4} className={s.ts} textAnchor="end">{v}</text>
        </g>
      ))}
      <text x={W - R} y={H - 4} className={s.ts} textAnchor="end">x1 좋다 횟수</text>
      <text x={L + 4} y={T + 10} className={s.ts}>x2 나쁘다 횟수</text>
      <text x={W - R - 6} y={T + 12} className={s.ts} textAnchor="end" style={{fill: 'var(--va)'}}>파랑: 긍정 (p &gt; 0.5)</text>
      <text x={L + 6} y={T + 24} className={s.ts} style={{fill: 'var(--vb)'}}>주황: 부정 (p &lt; 0.5)</text>
      {seg ? (
        <g clipPath="url(#m2WbClip)">
          <line x1={seg[0][0]} y1={seg[0][1]} x2={seg[1][0]} y2={seg[1][1]} stroke="var(--ifm-font-color-base)" strokeWidth="2.5" />
        </g>
      ) : null}
      {PTS.map((q, k) => {
        const p = sigmoid(w1 * q.x[0] + w2 * q.x[1] + b);
        const cx = px(q.x[0]);
        const cy = py(q.x[1]);
        const end = k === 2;
        return (
          <g key={q.name}>
            <circle cx={cx} cy={cy} r="6" fill="var(--ifm-background-color)" stroke="var(--ifm-font-color-base)" strokeWidth="2" />
            <text x={end ? cx + 8 : cx + 10} y={cy - (end ? 26 : 8)} className={s.ts} textAnchor={end ? 'end' : 'start'} stroke="var(--ifm-background-color)" strokeWidth="3" paintOrder="stroke">{q.name} p = {num(p, 3)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function WeightBias() {
  const [two, setTwo] = useState(false);
  const [w, setW] = useState(1);
  const [b, setB] = useState(0);
  const [w2, setW2] = useState(-1);

  const p1 = sigmoid(w + b);
  const mid = w === 0 ? null : -b / w;

  return (
    <Viz
      title="w는 경사를, b는 경계의 위치를 바꿉니다"
      caption={two
        ? '입력이 둘이면 p = 0.5가 되는 점들이 직선(분할)을 이룝니다. 처음 값 w1 = 1, w2 = -1, b = 0이면 분할은 x1 = x2이고, 좋다가 더 많은 쪽이 파랑입니다.'
        : '입력은 연기가 좋다(x = 1) 하나로 두고 w와 b만 바꿉니다. 표의 세 쌍 (1, 0), (2, 0), (1, 1)을 눌러 보세요. 리뷰 하나만 보면 w를 키운 것과 b를 올린 것이 같아 보이지만, 곡선의 모양이 다릅니다.'}
    >
      <Controls>
        <Btn on={!two} onClick={() => setTwo(false)}>입력 하나</Btn>
        <Btn on={two} onClick={() => {
          setTwo(true);
          setW(1);
          setW2(-1);
          setB(0);
        }}>
          입력 둘 (좋다, 나쁘다)
        </Btn>
        {!two
          ? PRE1.map((q) => (
              <Btn key={q.w + '-' + q.b} on={w === q.w && b === q.b} onClick={() => {
                setW(q.w);
                setB(q.b);
              }}>
                w = {q.w}, b = {q.b}
              </Btn>
            ))
          : null}
      </Controls>
      <Controls>
        <Slider label={two ? 'w1 (좋다 횟수에 곱하는 수)' : 'w (좋다 횟수에 곱하는 수)'} min={-3} max={4} step={0.1} value={w} onChange={setW} format={(v) => num(v, 1)} />
        {two ? <Slider label="w2 (나쁘다 횟수에 곱하는 수)" min={-3} max={4} step={0.1} value={w2} onChange={setW2} format={(v) => num(v, 1)} /> : null}
        <Slider label="b (더하는 수)" min={-3} max={3} step={0.1} value={b} onChange={setB} format={(v) => num(v, 1)} />
      </Controls>
      {two ? <TwoD w1={w} w2={w2} b={b} /> : <OneD w={w} b={b} />}
      <Stats>
        {two ? (
          <>
            {PTS.map((q) => (
              <Stat key={q.name} label={q.name + ' p'} value={num(sigmoid(w * q.x[0] + w2 * q.x[1] + b), 3)} />
            ))}
            <Stat label="분할 직선" value={num(w, 1) + '·x1 + ' + num(w2, 1) + '·x2 + ' + num(b, 1) + ' = 0'} />
          </>
        ) : (
          <>
            <Stat label="x = 1의 점수 s = w + b" value={num(w + b, 2)} />
            <Stat label="x = 1의 비율 p" value={num(p1, 3)} />
            <Stat label="p = 0.5가 되는 x = -b ÷ w" value={mid === null ? '없음 (w = 0)' : num(mid, 2)} />
          </>
        )}
      </Stats>
      <Note>
        {two
          ? '(1, -1), 바이어스 0이면 분할은 좋다 횟수와 나쁘다 횟수가 같은 직선입니다. 퍼셉트론도 이 직선으로 가르지만, 직선에서 멀어져도 0이나 1만 냅니다. 로지스틱 회귀는 0.731처럼 사이의 비율을 냅니다.'
          : w === 0
            ? 'w = 0이면 입력이 점수에 영향을 주지 않아서, 곡선이 수평이고 p = 0.5가 되는 자리도 없습니다.'
            : 'w가 크면 곡선이 가팔라져 경계 근처에서 확신이 급히 바뀌고, w가 작으면 0.5 근처에 머뭅니다. b는 곡선을 좌우로 밀어, 어느 입력부터 긍정으로 읽을지를 옮깁니다.'}
      </Note>
    </Viz>
  );
}
