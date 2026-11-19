import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {sigmoid, nll, num} from './mlCore';

const PW = 250;
const PH = 190;
const L = 34;
const R = 8;
const T = 14;
const B = 26;
const SMAX = 6;
const px = (v) => L + ((v + SMAX) / (2 * SMAX)) * (PW - L - R);
const PRE = [
  {k: 's = 1, 정답 긍정', s: 1, t: 1},
  {k: 's = 1, 정답 부정', s: 1, t: 0},
  {k: 's = 2, 정답 긍정', s: 2, t: 1},
  {k: 's = 2, 정답 부정', s: 2, t: 0},
  {k: 's = -4, 정답 긍정', s: -4, t: 1},
];

// 한 칸짜리 작은 그래프: 두 곡선과 지금 점
function Panel({title, fa, fb, ymin, ymax, sc, ticks, aria}) {
  const py = (y) => PH - B - ((y - ymin) / (ymax - ymin)) * (PH - T - B);
  const line = (f) => {
    const a = [];
    for (let i = 0; i <= 80; i += 1) {
      const v = -SMAX + (i / 80) * 2 * SMAX;
      a.push(px(v) + ',' + py(Math.max(ymin, Math.min(ymax, f(v)))));
    }
    return a.join(' ');
  };
  return (
    <svg viewBox={`0 0 ${PW} ${PH}`} className={s.svg} role="img" aria-label={aria}>
      <text x={L} y={T - 3} className={s.ts}>{title}</text>
      {ticks.map((y) => (
        <g key={y}>
          <line x1={L} y1={py(y)} x2={PW - R} y2={py(y)} stroke="var(--vgrid)" />
          <text x={L - 4} y={py(y) + 4} className={s.ts} textAnchor="end">{y}</text>
        </g>
      ))}
      {[-6, -3, 0, 3, 6].map((v) => (
        <text key={v} x={px(v)} y={PH - B + 14} className={s.ts} textAnchor="middle">{v}</text>
      ))}
      <polyline points={line(fa)} fill="none" stroke="var(--va)" strokeWidth="2.2" />
      <polyline points={line(fb)} fill="none" stroke="var(--vb)" strokeWidth="2.2" />
      <line x1={px(sc)} y1={T} x2={px(sc)} y2={PH - B} stroke="var(--ifm-color-emphasis-600)" strokeDasharray="3 3" />
      <circle cx={px(sc)} cy={py(Math.max(ymin, Math.min(ymax, fa(sc))))} r="4.5" fill="var(--va)" />
      <circle cx={px(sc)} cy={py(Math.max(ymin, Math.min(ymax, fb(sc))))} r="4.5" fill="var(--vb)" />
    </svg>
  );
}

export default function LossGradient() {
  const [sc, setSc] = useState(-4);
  const [t, setT] = useState(1);

  const p = sigmoid(sc);
  const ce = nll(t === 1 ? p : 1 - p);
  const sq = (p - t) * (p - t);
  const gCe = p - t;
  const gSq = 2 * (p - t) * p * (1 - p);
  const fCe = (v) => nll(t === 1 ? sigmoid(v) : 1 - sigmoid(v));
  const fSq = (v) => (sigmoid(v) - t) ** 2;
  const gC = (v) => sigmoid(v) - t;
  const gS = (v) => 2 * (sigmoid(v) - t) * sigmoid(v) * (1 - sigmoid(v));

  return (
    <Viz
      title="로그 오차와 제곱 오차: 크게 틀린 자리의 기울기"
      caption="점수 s와 정답을 고르면 두 오차와 점수 기울기가 나옵니다. 파랑이 로그 오차(크로스 엔트로피), 주황이 시그모이드 뒤에 붙인 제곱 오차입니다. 정답 긍정에서 s를 -4 근처로 내리면 주황 기울기만 사라집니다."
    >
      <Controls>
        <Slider label="점수 s" min={-SMAX} max={SMAX} step={0.1} value={sc} onChange={setSc} format={(v) => num(v, 1)} />
        <Btn on={t === 1} onClick={() => setT(1)}>정답 긍정 (t = 1)</Btn>
        <Btn on={t === 0} onClick={() => setT(0)}>정답 부정 (t = 0)</Btn>
      </Controls>
      <Controls>
        {PRE.map((q) => (
          <Btn key={q.k} on={sc === q.s && t === q.t} onClick={() => {
            setSc(q.s);
            setT(q.t);
          }}>
            {q.k}
          </Btn>
        ))}
      </Controls>
      <div className={s.two}>
        <Panel title="오차 (파랑: 로그, 주황: 제곱)" fa={fCe} fb={fSq} ymin={0} ymax={5} sc={sc} ticks={[0, 1, 2, 3, 4, 5]} aria="점수에 대한 로그 오차와 제곱 오차 곡선" />
        <Panel title="점수 s의 기울기" fa={gC} fb={gS} ymin={-1.05} ymax={1.05} sc={sc} ticks={[-1, -0.5, 0, 0.5, 1]} aria="점수에 대한 두 오차의 기울기 곡선" />
      </div>
      <Stats>
        <Stat label="비율 p" value={num(p, 3)} />
        <Stat label="로그 오차" value={num(ce, 3)} />
        <Stat label="제곱 오차 (p - t)²" value={num(sq, 3)} />
        <Stat label="로그 오차의 s 기울기 p - t" value={num(gCe, 3)} tone="good" />
        <Stat label="제곱 오차의 s 기울기" value={num(gSq, 3)} tone={Math.abs(gSq) < 0.05 && Math.abs(gCe) > 0.5 ? 'bad' : undefined} />
      </Stats>
      <Note>
        {Math.abs(gSq) < 0.05 && Math.abs(gCe) > 0.5
          ? '크게 틀렸는데 제곱 오차의 기울기는 거의 0입니다. 가중치가 거의 움직이지 않아서 가장 많이 틀린 리뷰를 고치지 못합니다. 로그 오차는 이 끝에서도 기울기가 큽니다.'
          : '로그 오차의 기울기는 p - t 하나라 계산이 짧습니다. 정답 칸의 비율이 같으면 정답이 긍정이든 부정이든 오차가 같습니다.'}
      </Note>
    </Viz>
  );
}
