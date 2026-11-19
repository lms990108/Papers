import React, {useRef, useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, useDrag, styles as s} from '../../Viz';
import {clamp, r2, num} from './mlCore';

const W = 540;
const H = 280;
const L = 40;
const R = 16;
const T = 14;
const B = 32;
const XS = [0, 1, 2];
const T0 = [3, 3, 5];
const XMAX = 2.6;
const YMAX = 8;
const px = (x) => L + ((x + 0.3) / (XMAX + 0.3)) * (W - L - R);
const py = (y) => H - B - (y / YMAX) * (H - T - B);
const iy = (Y) => ((H - B - Y) / (H - T - B)) * YMAX;

export default function LeastSquares() {
  const ref = useRef(null);
  const [t, setT] = useState(T0);
  const [w, setW] = useState(1);
  const [b, setB] = useState(3);
  const [showBest, setShowBest] = useState(true);

  const {start, svgProps} = useDrag(ref, W, H, (i, p) => setT(t.map((v, j) => (j === i ? clamp(r2(iy(p[1])), 0, YMAX) : v))));

  const n = XS.length;
  const mx = XS.reduce((a, c) => a + c, 0) / n;
  const mt = t.reduce((a, c) => a + c, 0) / n;
  const sxy = XS.reduce((a, x, i) => a + (x - mx) * (t[i] - mt), 0);
  const sxx = XS.reduce((a, x) => a + (x - mx) * (x - mx), 0);
  const bw = sxy / sxx;
  const bb = mt - bw * mx;
  const sse = (ww, c) => XS.reduce((a, x, i) => a + (ww * x + c - t[i]) ** 2, 0);
  const cur = sse(w, b);
  const best = sse(bw, bb);
  const same = Math.abs(w - bw) < 0.026 && Math.abs(b - bb) < 0.026;
  const line = (ww, c) => ({x1: px(-0.3), y1: py(ww * -0.3 + c), x2: px(XMAX), y2: py(ww * XMAX + c)});
  const lc = line(w, b);
  const lb = line(bw, bb);

  return (
    <Viz
      title="최소제곱 해: 제곱 오차의 합이 가장 작은 직선"
      caption="입력이 하나이고 점이 적으면 최선의 w와 b를 식으로 바로 구합니다. 점은 위아래로 끌 수 있고, 처음 점은 (0, 3), (1, 3), (2, 5)입니다. 이 세 점은 앞의 리뷰가 아니라 다른 자료입니다."
    >
      <Controls>
        <Slider label="w" min={-1} max={4} step={0.05} value={w} onChange={setW} format={(v) => num(v, 2)} />
        <Slider label="b" min={-2} max={7} step={0.05} value={b} onChange={setB} format={(v) => num(v, 2)} />
      </Controls>
      <Controls>
        <Btn onClick={() => {
          setW(bw);
          setB(bb);
        }}>
          최소제곱 해로 보내기
        </Btn>
        <Btn onClick={() => {
          setW(1);
          setB(3);
        }}>
          w = 1, b = 3
        </Btn>
        <Btn onClick={() => {
          setW(1);
          setB(2);
        }}>
          w = 1, b = 2
        </Btn>
        <Btn on={showBest} onClick={() => setShowBest(!showBest)}>최선의 선 보기</Btn>
        <Btn onClick={() => setT(T0)}>점 원래대로</Btn>
      </Controls>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="세 점과 현재 직선, 최소제곱 직선, 점마다 오차 선분" {...svgProps}>
        <clipPath id="m2LsClip">
          <rect x={L} y={T} width={W - L - R} height={H - T - B} />
        </clipPath>
        {XS.map((x) => (
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
        <g clipPath="url(#m2LsClip)">
          {showBest ? <line {...lb} stroke="var(--vok)" strokeWidth="2.5" strokeDasharray="6 4" /> : null}
          <line {...lc} stroke="var(--vb)" strokeWidth="2.5" />
        </g>
        {XS.map((x, i) => {
          const y = clamp(w * x + b, 0, YMAX);
          return (
            <g key={x}>
              <line x1={px(x)} y1={py(t[i])} x2={px(x)} y2={py(y)} stroke="var(--vbad)" strokeWidth="2.5" />
              <circle cx={px(x)} cy={py(t[i])} r="9" fill="var(--ifm-font-color-base)" fillOpacity="0.15" stroke="var(--ifm-font-color-base)" cursor="grab" onPointerDown={start(i)} />
              <circle cx={px(x)} cy={py(t[i])} r="4" fill="var(--ifm-font-color-base)" />
              <text x={px(x) + 12} y={py(t[i]) - 8} className={s.ts}>({x}, {t[i]})</text>
            </g>
          );
        })}
        <text x={W - R} y={T + 12} className={s.ts} textAnchor="end" style={{fill: 'var(--vb)'}}>주황: 지금 직선</text>
        <text x={W - R} y={T + 28} className={s.ts} textAnchor="end" style={{fill: 'var(--vok)'}}>초록 점선: 최소제곱 직선</text>
      </svg>
      <table className={s.grid}>
        <tbody>
          <tr>
            <th>평균</th>
            <td>x̄ = {num(mx, 3)}, t̄ = {num(mt, 3)}</td>
          </tr>
          <tr>
            <th>분자 Σ(x - x̄)(t - t̄)</th>
            <td>{num(sxy, 3)}</td>
          </tr>
          <tr>
            <th>분모 Σ(x - x̄)²</th>
            <td>{num(sxx, 3)}</td>
          </tr>
          <tr>
            <th>w = 분자 ÷ 분모, b = t̄ - w·x̄</th>
            <td>w = {num(bw, 3)}, b = {num(bb, 3)}</td>
          </tr>
        </tbody>
      </table>
      <Stats>
        <Stat label="지금 직선의 제곱 오차 합" value={num(cur, 3)} tone={same ? 'good' : undefined} />
        <Stat label="최선의 제곱 오차 합" value={num(best, 3)} />
        <Stat label="차이 (지금 - 최선)" value={num(cur - best, 3)} />
      </Stats>
      <Note>
        {same
          ? '지금 직선이 최소제곱 직선과 같습니다. 세 점이 한 직선 위에 없으면 최선의 선에서도 오차의 합은 0이 되지 않습니다.'
          : '최선의 선보다 제곱 오차의 합이 큽니다.' +
            (t.join() === T0.join()
              ? ' 처음 점에서 w = 1일 때 b = 3이면 합이 1, b = 2이면 2이고, 선이 점들의 평균 높이에 맞춰질 때 가장 작아집니다.'
              : ' 점을 옮기면 최선의 선도 따라 움직입니다.')}
      </Note>
    </Viz>
  );
}
