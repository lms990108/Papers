import React, {useRef, useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, useDrag, styles as s} from '../../Viz';
import {clamp, r1, num} from './mlCore';

const W = 560;
const H = 300;
const L = 44;
const R = 16;
const T = 14;
const B = 34;
const XMAX = 3.6;
const YMIN = -1;
const YMAX = 8;
const px = (x) => L + (x / XMAX) * (W - L - R);
const py = (y) => H - B - ((y - YMIN) / (YMAX - YMIN)) * (H - T - B);
const iy = (Y) => YMIN + ((H - B - Y) / (H - T - B)) * (YMAX - YMIN);

const PTS = [
  {x: 1, t: 4, name: '연기가 좋다'},
  {x: 2, t: 4, name: '연기가 좋다, 좋다'},
];
const THIRD = {x: 0, t: 2, name: '결말이 나쁘다'};
const PRESETS = [
  {k: 'w = 1, b = 3', w: 1, b: 3},
  {k: 'w = 2, b = 1', w: 2, b: 1},
  {k: 'w = 3, b = 0', w: 3, b: 0},
  {k: 'w = 1, b = 0 (y = x)', w: 1, b: 0},
];

export default function LineFitDrag() {
  const ref = useRef(null);
  const [w, setW] = useState(1);
  const [b, setB] = useState(3);
  const [third, setThird] = useState(false);

  const {start, svgProps} = useDrag(ref, W, H, (id, p) => {
    const y = r1(iy(p[1]));
    if (id === 'b') setB(clamp(y, -2, 7));
    else setW(clamp(r1((y - b) / 3), -1, 4));
  });

  const pts = third ? [THIRD].concat(PTS) : PTS;
  const rows = pts.map((p) => {
    const y = w * p.x + b;
    return {...p, y, d: y - p.t, E: (y - p.t) * (y - p.t)};
  });
  const n = rows.length;
  const sumD = rows.reduce((a, r) => a + r.d, 0);
  const sumE = rows.reduce((a, r) => a + r.E, 0);
  const mse = sumE / n;
  const cancel = Math.abs(sumD) < 1e-9 && sumE > 1e-9;
  const lineEnd = w * XMAX + b;
  const yb = py(clamp(b, YMIN, YMAX));
  const y3 = py(clamp(3 * w + b, YMIN, YMAX));

  return (
    <Viz
      title="직선을 움직여 오차를 줄여 보기"
      caption="주황 직선이 가설 y = wx + b입니다. 직선 양 끝의 동그라미를 끌거나 슬라이더를 움직이면 w와 b가 바뀝니다. 빨간 세로선이 오차(예측 - 정답)입니다."
    >
      <Controls>
        <Slider label="w (기울기)" min={-1} max={4} step={0.1} value={w} onChange={setW} format={(v) => num(v, 1)} />
        <Slider label="b (시작 높이)" min={-2} max={7} step={0.1} value={b} onChange={setB} format={(v) => num(v, 1)} />
      </Controls>
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p.k} on={Math.abs(w - p.w) < 1e-9 && Math.abs(b - p.b) < 1e-9} onClick={() => {
            setW(p.w);
            setB(p.b);
          }}>
            {p.k}
          </Btn>
        ))}
        <Btn on={third} onClick={() => setThird(!third)}>
          결말이 나쁘다(횟수 0, 별점 2) 같이 보기
        </Btn>
      </Controls>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="좋다 횟수에 대한 별점 점들과 직선, 점마다 예측과 정답의 오차 선분" {...svgProps}>
        <clipPath id="m2LineClip">
          <rect x={L} y={T} width={W - L - R} height={H - T - B} />
        </clipPath>
        {[0, 1, 2, 3].map((x) => (
          <g key={x}>
            <line x1={px(x)} y1={T} x2={px(x)} y2={H - B} stroke="var(--vgrid)" />
            <text x={px(x)} y={H - B + 16} className={s.ts} textAnchor="middle">{x}</text>
          </g>
        ))}
        {[0, 2, 4, 6, 8].map((y) => (
          <g key={y}>
            <line x1={L} y1={py(y)} x2={W - R} y2={py(y)} stroke="var(--vgrid)" />
            <text x={L - 6} y={py(y) + 4} className={s.ts} textAnchor="end">{y}</text>
          </g>
        ))}
        <text x={W - R} y={H - 4} className={s.ts} textAnchor="end">좋다 횟수 x</text>
        <text x={L + 4} y={T + 10} className={s.ts}>별점</text>
        <g clipPath="url(#m2LineClip)">
          <line x1={px(0)} y1={py(b)} x2={px(XMAX)} y2={py(lineEnd)} stroke="var(--vb)" strokeWidth="2.5" />
        </g>
        {rows.map((r) => (
          <g key={r.name}>
            <line x1={px(r.x)} y1={py(r.t)} x2={px(r.x)} y2={py(clamp(r.y, YMIN, YMAX))} stroke="var(--vbad)" strokeWidth="2.5" />
            <circle cx={px(r.x)} cy={py(clamp(r.y, YMIN, YMAX))} r="4" fill="var(--vb)" />
            <circle cx={px(r.x)} cy={py(r.t)} r="5.5" fill="var(--ifm-font-color-base)" />
            <text x={px(r.x) + 9} y={py(r.t) + (r.y >= r.t ? 15 : -8)} className={s.t}>
              정답 {r.t}
            </text>
            <text x={px(r.x) + 9} y={py(clamp((r.y + r.t) / 2, YMIN, YMAX)) + 4} className={s.ts} style={{fill: 'var(--vbad)'}}>
              오차 {num(r.d, 2)}
            </text>
          </g>
        ))}
        <circle cx={px(0)} cy={yb} r="11" fill="var(--vb)" fillOpacity="0.15" stroke="var(--vb)" cursor="grab" onPointerDown={start('b')} />
        <circle cx={px(3)} cy={y3} r="11" fill="var(--vb)" fillOpacity="0.15" stroke="var(--vb)" cursor="grab" onPointerDown={start('w')} />
        <text x={px(0) + 14} y={yb - 10} className={s.ts}>b</text>
        <text x={px(3) - 14} y={y3 - 14} className={s.ts} textAnchor="end">x = 3의 예측 {num(3 * w + b, 1)}</text>
      </svg>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>리뷰</th>
            <th>횟수 x</th>
            <th>예측 y = {num(w, 1)}x + {num(b, 1)}</th>
            <th>정답 t</th>
            <th>오차 y - t</th>
            <th>제곱</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td>{r.x}</td>
              <td>{num(r.y, 2)}</td>
              <td>{r.t}</td>
              <td>{num(r.d, 2)}</td>
              <td>{num(r.E, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="오차의 합" value={num(sumD, 2)} tone={cancel ? 'bad' : undefined} />
        <Stat label="제곱 오차의 합" value={num(sumE, 2)} />
        <Stat label={'평균 제곱 오차 MSE (n = ' + n + ')'} value={num(mse, 3)} tone={mse < 0.5 ? 'good' : undefined} />
        <Stat label="x = 0의 예측" value={num(b, 1)} />
        <Stat label="x = 3의 예측 (연장)" value={num(3 * w + b, 1)} />
      </Stats>
      <Note>
        {cancel
          ? '오차를 그냥 더하면 0이라 틀린 곳이 없어 보입니다. 하지만 제곱 오차의 합은 ' + num(sumE, 2) + '입니다. 부호가 반대인 오차가 서로 지웠기 때문입니다.'
          : '직선은 표에 없는 횟수도 말할 수 있습니다. x = 3은 아직 없는 리뷰이고, 예측 ' + num(3 * w + b, 1) + '은 데이터에 있던 답이 아니라 가설이 연장해서 낸 값입니다.'}
      </Note>
    </Viz>
  );
}
