import React, {useMemo, useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {TRAIN_X, TRAIN_Y, TEST_X, TEST_Y, fit, poly, mse} from './capData';

const LAMS = [0, 0.001, 0.01, 0.03, 0.1, 0.3, 1];
const PRESETS = [
  {deg: 1, li: 0, name: '1차'},
  {deg: 3, li: 0, name: '3차'},
  {deg: 7, li: 0, name: '7차'},
  {deg: 7, li: 2, name: '7차, λ=0.01'},
  {deg: 7, li: 4, name: '7차, λ=0.1'},
];
const lamText = (v) => (v === 0 ? '0' : String(v));

const W1 = 360;
const H1 = 250;
const PX = {l: 34, r: 10, t: 12, b: 26};
const YMIN = -1.7;
const YMAX = 1.7;
const sx = (x) => PX.l + ((x + 1) / 2) * (W1 - PX.l - PX.r);
const sy = (y) => PX.t + ((YMAX - Math.max(YMIN, Math.min(YMAX, y))) / (YMAX - YMIN)) * (H1 - PX.t - PX.b);

export default function FitDegree() {
  const [deg, setDeg] = useState(3);
  const [li, setLi] = useState(0);
  const [showTest, setShowTest] = useState(false);

  const lam = LAMS[li];
  const table = useMemo(() => {
    return LAMS.map((l) =>
      [1, 2, 3, 4, 5, 6, 7].map((d) => {
        const w = fit(TRAIN_X, TRAIN_Y, d, l);
        return {tr: mse(w, TRAIN_X, TRAIN_Y), te: mse(w, TEST_X, TEST_Y)};
      }),
    );
  }, []);
  const w = useMemo(() => fit(TRAIN_X, TRAIN_Y, deg, lam), [deg, lam]);
  const rows = table[li];
  const cur = rows[deg - 1];
  const best = rows.reduce((b, r, i) => (r.te < rows[b].te ? i : b), 0);

  const curve = [];
  for (let i = 0; i <= 80; i += 1) {
    const x = -1 + (2 * i) / 80;
    curve.push(`${sx(x).toFixed(1)},${sy(poly(w, x)).toFixed(1)}`);
  }
  const truth = [];
  for (let i = 0; i <= 80; i += 1) {
    const x = -1 + (2 * i) / 80;
    truth.push(`${sx(x).toFixed(1)},${sy(Math.sin(Math.PI * x)).toFixed(1)}`);
  }

  const W2 = 360;
  const H2 = 250;
  const ymax = Math.max.apply(null, rows.map((r) => Math.max(r.tr, r.te))) * 1.1;
  const ex = (d) => 40 + ((d - 1) / 6) * (W2 - 40 - 14);
  const ey = (v) => 14 + (1 - v / ymax) * (H2 - 14 - 30);
  const line = (key) => rows.map((r, i) => `${ex(i + 1).toFixed(1)},${ey(r[key]).toFixed(1)}`).join(' ');
  const gap = cur.te - cur.tr;
  const verdict = deg === 1 || deg === 2 ? '과소적합: 학습도 시험도 높습니다' : cur.tr < 0.002 ? '점 8개를 거의 외웠습니다' : deg === best + 1 ? '시험 오차가 가장 낮은 차수입니다' : '용량이 더 커져 시험이 다시 나쁩니다';

  return (
    <Viz
      title="차수(용량)를 올리며 점 8개에 곡선 맞추기"
      caption="차수는 곡선이 얼마나 휠 수 있는지를 정하는 수입니다. λ는 정칙화(곡선이 너무 휘지 않게 가중치를 누르는 일)의 세기이며 0이면 누르지 않고, 정칙화는 아래에서 자세히 봅니다. 오른쪽 그래프의 '잡음 바닥 0.04' 선은 점에 섞인 잡음 때문에 시험 오차가 평균적으로 내려갈 수 없는 값(0.2²)입니다. 본문의 파이썬 코드와 같은 점(학습 8개, 시험 200개)과 같은 계산입니다. 왼쪽 그래프에서 파랑 점이 학습 쌍이고, 점선은 잡음 없는 참값 sin(πx)입니다. 아래 오차는 평균 제곱 오차(MSE)입니다."
    >
      <Controls>
        <Slider label="차수" min={1} max={7} value={deg} onChange={setDeg} />
        <Slider label="정칙화 λ (가중치를 누르는 세기)" min={0} max={LAMS.length - 1} value={li} onChange={setLi} format={(i) => lamText(LAMS[i])} />
        <Btn on={showTest} onClick={() => setShowTest(!showTest)}>시험 점 200개 보기</Btn>
      </Controls>
      <Controls>
        {PRESETS.map((p) => (
          <Btn
            key={p.name}
            on={p.deg === deg && p.li === li}
            onClick={() => {
              setDeg(p.deg);
              setLi(p.li);
            }}
          >
            {p.name}
          </Btn>
        ))}
      </Controls>
      <div className={s.two}>
        <svg viewBox={`0 0 ${W1} ${H1}`} className={s.svg} role="img" aria-label={`${deg}차 다항식이 학습 점 8개를 지나는 모양`}>
          <line x1={PX.l} y1={sy(0)} x2={W1 - PX.r} y2={sy(0)} stroke="var(--vgrid)" />
          <line x1={sx(0)} y1={PX.t} x2={sx(0)} y2={H1 - PX.b} stroke="var(--vgrid)" />
          <polyline points={truth.join(' ')} fill="none" stroke="var(--ifm-color-emphasis-600)" strokeDasharray="4 4" strokeWidth="1.5" />
          {showTest
            ? TEST_X.map((x, i) => <circle key={i} cx={sx(x)} cy={sy(TEST_Y[i])} r={2} fill="var(--vb)" fillOpacity="0.45" />)
            : null}
          <polyline points={curve.join(' ')} fill="none" stroke="var(--vc)" strokeWidth="2.5" />
          {TRAIN_X.map((x, i) => (
            <circle key={i} cx={sx(x)} cy={sy(TRAIN_Y[i])} r={4.5} fill="var(--va)" stroke="var(--ifm-background-color)" />
          ))}
          <text x={PX.l + 4} y={PX.t + 10} className={s.ts}>보라 곡선 = {deg}차 맞춤</text>
          <text x={W1 - PX.r} y={H1 - 8} className={s.ts} textAnchor="end">x (−1 ~ 1)</text>
        </svg>
        <svg viewBox={`0 0 ${W2} ${H2}`} className={s.svg} role="img" aria-label="차수에 따른 학습 오차와 시험 오차">
          <line x1={40} y1={ey(0)} x2={W2 - 14} y2={ey(0)} stroke="var(--vgrid)" />
          <line x1={40} y1={14} x2={40} y2={ey(0)} stroke="var(--vgrid)" />
          {0.04 < ymax ? (
            <g>
              <line x1={40} y1={ey(0.04)} x2={W2 - 14} y2={ey(0.04)} stroke="var(--ifm-color-emphasis-500)" strokeDasharray="3 4" />
              <text x={W2 - 16} y={ey(0.04) - 4} className={s.ts} textAnchor="end">잡음 바닥 0.04</text>
            </g>
          ) : null}
          <polyline points={line('tr')} fill="none" stroke="var(--va)" strokeWidth="2" />
          <polyline points={line('te')} fill="none" stroke="var(--vb)" strokeWidth="2" />
          {rows.map((r, i) => (
            <g key={i} onClick={() => setDeg(i + 1)} style={{cursor: 'pointer'}}>
              <circle cx={ex(i + 1)} cy={ey(r.tr)} r={i + 1 === deg ? 6 : 3.5} fill="var(--va)" />
              <circle cx={ex(i + 1)} cy={ey(r.te)} r={i + 1 === deg ? 6 : 3.5} fill="var(--vb)" />
              <text x={ex(i + 1)} y={H2 - 12} className={s.ts} textAnchor="middle" fontWeight={i + 1 === deg ? 700 : 400}>{i + 1}차</text>
            </g>
          ))}
          <text x={ex(best + 1)} y={ey(rows[best].te) - 10} className={s.ts} textAnchor="middle">시험 최저</text>
          <text x={46} y={22} className={s.ts} style={{fill: 'var(--va)'}}>학습 오차</text>
          <text x={46} y={36} className={s.ts} style={{fill: 'var(--vb)'}}>시험 오차</text>
          <text x={4} y={14} className={s.ts}>MSE</text>
        </svg>
      </div>
      <Stats>
        <Stat label="학습 오차" value={fmt(cur.tr, 4)} />
        <Stat label="시험 오차" value={fmt(cur.te, 4)} />
        <Stat label="간격 (시험 − 학습)" value={fmt(gap, 4)} tone={gap > 0.05 ? 'bad' : undefined} />
        <Stat label="시험이 가장 낮은 차수" value={`${best + 1}차`} tone="good" />
      </Stats>
      <Note>{verdict}. 오른쪽 그래프의 점을 눌러도 차수가 바뀝니다. λ를 올리면 7차 곡선이 얌전해지고 학습 오차가 오릅니다. 본문 표는 (1차, 0), (3차, 0), (7차, 0), (7차, 0.01), (7차, 0.1)의 다섯 줄입니다.</Note>
    </Viz>
  );
}
