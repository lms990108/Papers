import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const REVIEWS = [
  {t: '연기가 좋다 (별점 4, 긍정)', star: 4, c: 1},
  {t: '결말이 나쁘다 (별점 2, 부정)', star: 2, c: 0},
];
const W = 240;
const H = 170;
const L = 34;
const R = 10;
const T = 12;
const B = 28;
const XR = 4;
const sig = (v) => 1 / (1 + Math.exp(-v));
const logErr = (sc, c) => Math.log(1 + Math.exp(c === 1 ? -sc : sc));

function Panel({title, fn, ymax, sc, label, ticks}) {
  const X = (v) => L + ((v + XR) / (2 * XR)) * (W - L - R);
  const Y = (v) => T + (1 - Math.min(v, ymax) / ymax) * (H - T - B);
  const pts = [];
  for (let i = 0; i <= 80; i += 1) {
    const v = -XR + (i * 2 * XR) / 80;
    pts.push(X(v) + ',' + Y(fn(v)));
  }
  return (
    <svg viewBox={'0 0 ' + W + ' ' + H} className={s.svg} style={{maxWidth: 340}} role="img" aria-label={title}>
      <text x={L} y={9} className={s.ts}>{title}</text>
      <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="var(--ifm-color-emphasis-400)" />
      <line x1={L} y1={T} x2={L} y2={H - B} stroke="var(--ifm-color-emphasis-400)" />
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} y1={Y(v)} x2={W - R} y2={Y(v)} stroke="var(--vgrid)" />
          <text x={L - 4} y={Y(v) + 4} textAnchor="end" className={s.ts}>{v}</text>
        </g>
      ))}
      {[-4, -2, 0, 2, 4].map((v) => (
        <text key={v} x={X(v)} y={H - B + 14} textAnchor="middle" className={s.ts}>{v}</text>
      ))}
      <text x={(L + W - R) / 2} y={H - 4} textAnchor="middle" className={s.ts}>점수 s</text>
      <polyline points={pts.join(' ')} fill="none" stroke="var(--va)" strokeWidth="2.5" />
      <line x1={X(sc)} y1={Y(fn(sc))} x2={X(sc)} y2={H - B} stroke="var(--vb)" strokeDasharray="4 3" />
      <circle cx={X(sc)} cy={Y(fn(sc))} r={5.5} fill="var(--vb)" />
      <text x={Math.min(X(sc) + 8, W - 50)} y={Math.max(Y(fn(sc)) - 8, T + 8)} className={s.t}>{label}</text>
    </svg>
  );
}

export default function ErrorCurves() {
  const [i, setI] = useState(0);
  const [sc, setSc] = useState(1);
  const [wrong, setWrong] = useState(false);
  const r = REVIEWS[i];
  const cLab = wrong ? 1 - r.c : r.c;
  const y = sc + 3;
  const sq = (y - r.star) ** 2;
  const le = logErr(sc, cLab);

  return (
    <Viz
      title="점수를 움직이면 두 오차가 반대로 움직입니다"
      caption="회귀는 y = s + 3이 별점에 가까울수록, 분류는 s가 정답 쪽으로 클수록 오차가 줄어듭니다. 설명용으로 점수를 -4에서 4까지 움직입니다."
    >
      <Controls>
        {REVIEWS.map((q, k) => (
          <Btn key={q.t} on={k === i} onClick={() => setI(k)}>{q.t}</Btn>
        ))}
        <Btn on={wrong} onClick={() => setWrong(!wrong)}>분류 레이블을 틀리게 붙이기</Btn>
      </Controls>
      <Controls>
        <Slider label="점수 s" min={-4} max={4} step={0.1} value={sc} onChange={setSc} format={(v) => fmt(v, 1)} />
        <Btn onClick={() => setSc(i === 0 ? 1 : -1)}>원래 점수</Btn>
        <Btn onClick={() => setSc(i === 0 ? 2 : -2)}>점수 2배</Btn>
      </Controls>
      <div className={s.two}>
        <Panel title="회귀: 제곱 오차" fn={(v) => (v + 3 - r.star) ** 2} ymax={25} sc={sc} label={fmt(sq, 2)} ticks={[0, 10, 20]} />
        <Panel title={'분류: 로그 오차 (정답 ' + (cLab === 1 ? '긍정' : '부정') + ')'} fn={(v) => logErr(v, cLab)} ymax={4.2} sc={sc} label={fmt(le, 3)} ticks={[0, 1, 2, 3, 4]} />
      </div>
      <Stats>
        <Stat label={'회귀 예측 y = s + 3 (별점 ' + r.star + ')'} value={fmt(y, 1)} />
        <Stat label="제곱 오차" value={fmt(sq, 2)} tone={sq < 0.05 ? 'good' : undefined} />
        <Stat label="분류 비율 p (긍정)" value={fmt(sig(sc), 3)} />
        <Stat label="로그 오차" value={fmt(le, 3)} tone={le < 0.2 ? 'good' : le > 1 ? 'bad' : undefined} />
      </Stats>
      <Note>
        {wrong
          ? '레이블이 틀리면 같은 비율에서 오차가 몇 배로 커집니다. 원래 점수에서 0.313이던 오차가 1.313이 됩니다.'
          : '연기가 좋다에서 s = 1이면 회귀 오차는 0이지만 분류 오차는 0.313입니다. s = 2이면 회귀는 1만큼 틀리고 분류는 0.127로 더 잘 맞습니다.'}
      </Note>
    </Viz>
  );
}
