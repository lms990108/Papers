import React, {useRef, useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, useDrag, styles as s} from '../../Viz';
import {clamp, num} from './mlCore';

// 두 리뷰 (x=1, 정답 4), (x=2, 정답 4)의 평균 제곱 오차를 (w, b) 평면에 그립니다.
const W = 540;
const H = 330;
const L = 42;
const R = 14;
const T = 12;
const B = 32;
const WMIN = -1;
const WMAX = 4;
const BMIN = -2;
const BMAX = 6;
const px = (w) => L + ((w - WMIN) / (WMAX - WMIN)) * (W - L - R);
const py = (b) => H - B - ((b - BMIN) / (BMAX - BMIN)) * (H - T - B);
const iw = (X) => WMIN + ((X - L) / (W - L - R)) * (WMAX - WMIN);
const ib = (Y) => BMIN + ((H - B - Y) / (H - T - B)) * (BMAX - BMIN);
const LEVELS = [0.1, 0.5, 1, 2.5, 5, 10, 20, 40];
const START = [1, 3];
const MARKS = [
  {w: 1, b: 3, k: '0.5'},
  {w: 2, b: 1, k: '1'},
  {w: 3, b: 0, k: '2.5'},
];

const mseOf = (w, b) => ((w + b - 4) ** 2 + (2 * w + b - 4) ** 2) / 2;
const gradOf = (w, b) => {
  const e1 = w + b - 4;
  const e2 = 2 * w + b - 4;
  return [e1 + 2 * e2, e1 + e2];
};

const CELLS = (() => {
  const a = [];
  const nw = 40;
  const nb = 32;
  for (let i = 0; i < nw; i += 1) {
    for (let j = 0; j < nb; j += 1) {
      const w = WMIN + ((i + 0.5) / nw) * (WMAX - WMIN);
      const b = BMIN + ((j + 0.5) / nb) * (BMAX - BMIN);
      const m = mseOf(w, b);
      let band = 0;
      LEVELS.forEach((lv) => {
        if (m >= lv) band += 1;
      });
      a.push({x: px(WMIN + (i / nw) * (WMAX - WMIN)), y: py(BMIN + ((j + 1) / nb) * (BMAX - BMIN)), band, k: i + '-' + j});
    }
  }
  return {list: a, cw: (W - L - R) / nw + 0.6, ch: (H - T - B) / nb + 0.6};
})();

export default function ErrorBowl() {
  const ref = useRef(null);
  const [pos, setPos] = useState(START);
  const [path, setPath] = useState([START]);
  const [lr, setLr] = useState(0.1);

  const {start, svgProps} = useDrag(ref, W, H, (id, p) => {
    const q = [clamp(Math.round(iw(p[0]) * 20) / 20, WMIN, WMAX), clamp(Math.round(ib(p[1]) * 20) / 20, BMIN, BMAX)];
    setPos(q);
    setPath([q]);
  });

  const [w, b] = pos;
  const m = mseOf(w, b);
  const g = gradOf(w, b);
  const go = (k) => {
    let q = pos;
    const nextPath = path.slice();
    for (let i = 0; i < k; i += 1) {
      if (mseOf(q[0], q[1]) > 1e6) break;
      const gg = gradOf(q[0], q[1]);
      q = [q[0] - lr * gg[0], q[1] - lr * gg[1]];
      nextPath.push(q);
    }
    setPos(q);
    setPath(nextPath);
  };
  const shown = path.map((q) => [px(clamp(q[0], WMIN, WMAX)), py(clamp(q[1], BMIN, BMAX))]);
  const diverged = m > 50;

  return (
    <Viz
      title="오차의 그릇: (w, b)마다 평균 제곱 오차"
      caption="두 리뷰 (횟수 1, 정답 4), (횟수 2, 정답 4)의 MSE입니다. 색이 진할수록 오차가 큽니다. 동그라미를 끌어 직선을 바꾸고, 한 걸음 버튼으로 기울기의 반대 방향으로 내려가 보세요. 이 그림의 값은 모두 설명용 계산입니다."
    >
      <Controls>
        <Slider label="w" min={WMIN} max={WMAX} step={0.05} value={clamp(w, WMIN, WMAX)} onChange={(v) => {
          setPos([v, b]);
          setPath([[v, b]]);
        }} format={(v) => num(v, 2)} />
        <Slider label="b" min={BMIN} max={BMAX} step={0.05} value={clamp(b, BMIN, BMAX)} onChange={(v) => {
          setPos([w, v]);
          setPath([[w, v]]);
        }} format={(v) => num(v, 2)} />
      </Controls>
      <Controls>
        <Slider label="학습률" min={0.01} max={0.4} step={0.01} value={lr} onChange={setLr} format={(v) => num(v, 2)} />
        <Btn onClick={() => go(1)}>한 걸음</Btn>
        <Btn onClick={() => go(10)}>10걸음</Btn>
        <Btn onClick={() => {
          setPos(START);
          setPath([START]);
        }}>
          (1, 3)에서 다시
        </Btn>
        {MARKS.map((q) => (
          <Btn key={q.k} onClick={() => {
            setPos([q.w, q.b]);
            setPath([[q.w, q.b]]);
          }}>
            w = {q.w}, b = {q.b}
          </Btn>
        ))}
      </Controls>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="w와 b에 대한 평균 제곱 오차 등고선과 경사하강 경로" {...svgProps}>
        {CELLS.list.map((c) => (
          <rect key={c.k} x={c.x} y={c.y} width={CELLS.cw} height={CELLS.ch} fill="var(--vb)" fillOpacity={0.05 + c.band * 0.1} />
        ))}
        {[-1, 0, 1, 2, 3, 4].map((v) => (
          <g key={'w' + v}>
            <line x1={px(v)} y1={T} x2={px(v)} y2={H - B} stroke="var(--vgrid)" />
            <text x={px(v)} y={H - B + 16} className={s.ts} textAnchor="middle">{v}</text>
          </g>
        ))}
        {[-2, 0, 2, 4, 6].map((v) => (
          <g key={'b' + v}>
            <line x1={L} y1={py(v)} x2={W - R} y2={py(v)} stroke="var(--vgrid)" />
            <text x={L - 6} y={py(v) + 4} className={s.ts} textAnchor="end">{v}</text>
          </g>
        ))}
        <text x={W - R} y={H - 4} className={s.ts} textAnchor="end">w (기울기)</text>
        <text x={L + 4} y={T + 10} className={s.ts}>b (시작 높이)</text>
        {MARKS.map((q) => (
          <g key={q.k}>
            <circle cx={px(q.w)} cy={py(q.b)} r="3.5" fill="none" stroke="var(--ifm-font-color-base)" />
            <text x={px(q.w) + 7} y={py(q.b) - 5} className={s.ts}>MSE {q.k}</text>
          </g>
        ))}
        <rect x={px(0) - 4} y={py(4) - 4} width="8" height="8" fill="var(--vok)" transform={`rotate(45 ${px(0)} ${py(4)})`} />
        <text x={px(0) + 8} y={py(4) - 6} className={s.ts}>바닥 w = 0, b = 4 (MSE 0)</text>
        {shown.length > 1 ? <polyline points={shown.map((q) => q[0] + ',' + q[1]).join(' ')} fill="none" stroke="var(--vc)" strokeWidth="2" /> : null}
        {shown.map((q, i) => (i > 0 ? <circle key={i} cx={q[0]} cy={q[1]} r="2.5" fill="var(--vc)" /> : null))}
        <circle cx={px(clamp(w, WMIN, WMAX))} cy={py(clamp(b, BMIN, BMAX))} r="10" fill="var(--va)" fillOpacity="0.25" stroke="var(--va)" strokeWidth="2" cursor="grab" onPointerDown={start('p')} />
      </svg>
      <Stats>
        <Stat label="지금의 (w, b)" value={'(' + num(w, 3) + ', ' + num(b, 3) + ')'} />
        <Stat label="평균 제곱 오차" value={diverged ? '너무 큼' : num(m, 4)} tone={diverged ? 'bad' : m < 0.01 ? 'good' : undefined} />
        <Stat label="오차를 w로 미분" value={diverged ? '—' : num(g[0], 3)} />
        <Stat label="오차를 b로 미분" value={diverged ? '—' : num(g[1], 3)} />
        <Stat label="걸음 수" value={path.length - 1} />
      </Stats>
      <Note>
        {diverged
          ? '학습률이 너무 커서 바닥을 지나 반대 비탈로 올라가며 오차가 더 커졌습니다. 학습률을 줄이고 처음부터 다시 해 보세요.'
          : '(1, 3)에서 시작해 학습률 0.1로 내려가면 오차가 줄어듭니다. 학습률이 0.3을 넘으면 걸음이 바닥을 지나쳐서 오히려 올라갑니다. 기울기가 큰 비탈에서는 크게, 바닥 가까이에서는 작게 움직입니다.'}
      </Note>
    </Viz>
  );
}
