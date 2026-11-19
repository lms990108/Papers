import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

// 설명용 값: 3의 평균 -1, 8의 평균 +1, 분산이 같은 가우스.
const MU0 = -1;
const MU1 = 1;
const PTS = [
  {x: -1.2, y: 0},
  {x: -0.8, y: 0},
  {x: 0.8, y: 1},
  {x: 1.2, y: 1},
];
const VW = 640;
const VH = 268;
const X0 = -4;
const X1 = 4;
const px = (x) => 30 + ((x - X0) / (X1 - X0)) * (VW - 60);
const AX = 215; // 가로축 y
const sig = (z) => 1 / (1 + Math.exp(-z));

function ce(w, b) {
  let t = 0;
  PTS.forEach((p) => {
    const q = sig(w * p.x + b);
    t += -Math.log(Math.max(p.y === 1 ? q : 1 - q, 1e-12));
  });
  return t / PTS.length;
}

export default function GenVsDisc() {
  const [sd, setSd] = useState(1);
  const [prior, setPrior] = useState(0.5);
  const [w, setW] = useState(4);
  const [b, setB] = useState(0);

  const wg = (MU1 - MU0) / (sd * sd);
  const bg = Math.log(prior / (1 - prior));
  const ys = (v) => AX - v * 150;
  const xs = [];
  for (let i = 0; i <= 160; i += 1) xs.push(X0 + ((X1 - X0) * i) / 160);
  const path = (f) => xs.map((x, i) => `${i ? 'L' : 'M'}${px(x).toFixed(1)},${ys(f(x)).toFixed(1)}`).join(' ');
  const bound = (ww, bb) => (ww > 1e-9 ? -bb / ww : null);
  const xg = bound(wg, bg);
  const xd = bound(w, b);

  return (
    <Viz
      title="생성 모델이 만든 확률과 판별 모델이 직접 놓은 확률 비교"
      caption="설명용 값입니다. 3은 평균 -1, 8은 평균 +1이고 분산이 같은 가우스라고 둡니다. 파랑 곡선은 생성 모델이 베이즈 정리로 계산한 8일 확률, 주황 곡선은 계수 w, b를 곧바로 놓은 확률입니다. 점 네 개(3 둘, 8 둘)는 아래 붕괴 실험과 같은 입력입니다."
    >
      <div className={s.two}>
        <div>
          <b style={{fontSize: '0.85rem'}}>생성: 클래스별 모양을 둡니다</b>
          <Controls>
            <Slider label="표준편차 σ" min={0.3} max={2} step={0.05} value={sd} onChange={setSd} format={(v) => fmt(v, 2)} />
            <Slider label="8의 비율" min={0.1} max={0.9} step={0.05} value={prior} onChange={setPrior} format={(v) => fmt(v, 2)} />
          </Controls>
        </div>
        <div>
          <b style={{fontSize: '0.85rem'}}>판별: 계수를 바로 놓습니다</b>
          <Controls>
            <Slider label="기울기 w" min={0} max={10} step={0.1} value={w} onChange={setW} format={(v) => fmt(v, 1)} />
            <Slider label="절편 b" min={-3} max={3} step={0.1} value={b} onChange={setB} format={(v) => fmt(v, 1)} />
          </Controls>
        </div>
      </div>
      <Controls>
        <Btn on={false} onClick={() => { setW(Math.min(10, Math.round(wg * 10) / 10)); setB(Math.max(-3, Math.min(3, Math.round(bg * 10) / 10))); }}>
          생성의 값을 판별에 복사
        </Btn>
      </Controls>
      <svg viewBox={`0 0 ${VW} ${VH}`} className={s.svg} role="img" aria-label="입력 x에 대한 3과 8의 가우스 모양과, 생성 모델과 판별 모델이 낸 8일 확률 곡선">
        <line x1={px(X0)} x2={px(X1)} y1={AX} y2={AX} stroke="var(--ifm-color-emphasis-400)" />
        <line x1={px(0)} x2={px(0)} y1={30} y2={AX} stroke="var(--ifm-color-emphasis-200)" />
        {/* 가우스 모양: 3은 점선 파랑, 8은 점선 주황 */}
        <path d={path((x) => 0.8 * (1 - prior) * Math.exp(-((x - MU0) ** 2) / (2 * sd * sd)))} fill="none" stroke="var(--va)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.75" />
        <path d={path((x) => 0.8 * prior * Math.exp(-((x - MU1) ** 2) / (2 * sd * sd)))} fill="none" stroke="var(--vb)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.75" />
        {/* 확률 곡선 */}
        <path d={path((x) => sig(wg * x + bg))} fill="none" stroke="var(--va)" strokeWidth="2.6" />
        <path d={path((x) => sig(w * x + b))} fill="none" stroke="var(--vb)" strokeWidth="2.6" />
        {xg !== null && xg > X0 && xg < X1 ? <line x1={px(xg)} x2={px(xg)} y1={AX - 160} y2={AX + 4} stroke="var(--va)" strokeWidth="1.2" /> : null}
        {xd !== null && xd > X0 && xd < X1 ? <line x1={px(xd)} x2={px(xd)} y1={AX - 160} y2={AX + 4} stroke="var(--vb)" strokeWidth="1.2" /> : null}
        {PTS.map((p, i) => (
          <g key={i}>
            <circle cx={px(p.x)} cy={AX + 14} r="9" fill="var(--ifm-background-color)" stroke={p.y ? 'var(--vb)' : 'var(--va)'} strokeWidth="2" />
            <text x={px(p.x)} y={AX + 18} textAnchor="middle" className={s.t} fontSize="12">{p.y ? 8 : 3}</text>
          </g>
        ))}
        {[-3, -2, -1, 0, 1, 2, 3].map((t) => (
          <text key={t} x={px(t)} y={AX + 40} textAnchor="middle" className={s.ts}>{t}</text>
        ))}
        <text x={px(X1) - 2} y={AX - 138} textAnchor="end" className={s.ts}>확률 1</text>
        <text x={px(X0) + 2} y={AX - 4} className={s.ts}>0</text>
        <text x={px(X0) + 4} y={20} className={s.ts} >점선: 3(파랑)과 8(주황)의 모양(높이는 비율)</text>
      </svg>
      <div className={s.legend}>
        <span><i style={{background: 'var(--va)'}} />생성: 8일 확률 곡선 (파랑)</span>
        <span><i style={{background: 'var(--vb)'}} />판별: 8일 확률 곡선 (주황)</span>
        <span>세로선: 확률 0.5가 되는 경계</span>
      </div>
      <Stats>
        <Stat label="생성이 만든 w = 2/σ²" value={fmt(wg, 2)} />
        <Stat label="생성이 만든 b = ln(8의 비율/3의 비율)" value={fmt(bg, 2)} />
        <Stat label="경계 (생성 / 판별)" value={`${xg === null ? '-' : fmt(xg, 2)} / ${xd === null ? '-' : fmt(xd, 2)}`} />
        <Stat label="네 점의 정답 오차 (생성)" value={fmt(ce(wg, bg), 3)} />
        <Stat label="네 점의 정답 오차 (판별)" value={fmt(ce(w, b), 3)} tone={ce(w, b) < ce(wg, bg) ? 'good' : undefined} />
      </Stats>
      <Note>
        σ를 줄이면 생성이 만든 w가 커져 곡선이 가팔라지고, 8의 비율을 바꾸면 경계가 움직입니다. 생성 쪽은 σ와 비율에서 w, b가 정해지고, 판별 쪽은 w, b를 곧바로 맞춥니다. 판별의 w를 키워 보면 네 점의 오차가 줄어듭니다.
      </Note>
    </Viz>
  );
}
