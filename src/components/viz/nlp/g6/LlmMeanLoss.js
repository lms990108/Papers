import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Bar, Note, fmt, styles as s} from '../../Viz';

const TOKENS = ['오늘', '날씨', '좋다'];
const PRESETS = [
  {t: '글의 값 (0.5, 0.711)', p: [0.5, 0.711]},
  {t: '둘 다 0.5', p: [0.5, 0.5]},
  {t: '둘째 자리가 정답을 베낌 (p=1)', p: [0.5, 1]},
  {t: '균등 (1/4, 1/4)', p: [0.25, 0.25]},
];

export default function LlmMeanLoss() {
  const [p, setP] = useState([0.5, 0.711]);
  const e = p.map((v) => -Math.log(v));
  const mean = (e[0] + e[1]) / 2;
  const ppl = Math.exp(mean);
  const same = (a) => Math.abs(a[0] - p[0]) < 1e-9 && Math.abs(a[1] - p[1]) < 1e-9;
  const set = (i) => (v) => setP(i === 0 ? [v, p[1]] : [p[0], v]);
  const xs = [20, 190, 360];

  return (
    <Viz
      title="글 전체의 오차는 자리별 오차의 평균"
      caption="첫째 자리의 비율 0.5는 평균이 보이게 둔 값이고 학습 결과가 아닙니다. 둘째 자리의 0.711은 점수 0, 0, 2, 0의 소프트맥스입니다. 슬라이더로 정답 칸의 비율을 바꿔 보세요."
    >
      <Controls>
        {PRESETS.map((x) => (
          <Btn key={x.t} on={same(x.p)} onClick={() => setP(x.p)}>
            {x.t}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="첫째 자리의 정답 비율 p (날씨)" min={0.05} max={1} step={0.01} value={p[0]} onChange={set(0)} format={(v) => fmt(v, 3)} />
        <Slider label="둘째 자리의 정답 비율 p (좋다)" min={0.05} max={1} step={0.01} value={p[1]} onChange={set(1)} format={(v) => fmt(v, 3)} />
      </Controls>
      <svg viewBox="0 0 480 120" className={s.svg} role="img" aria-label="오늘 날씨 좋다에서 자리마다 다음 토큰을 맞히고 오차를 낸다">
        {TOKENS.map((w, i) => (
          <g key={w}>
            <rect x={xs[i]} y={62} width={100} height={36} rx={8} fill="none" stroke="var(--ifm-color-emphasis-500)" strokeDasharray={i === 2 ? '4 3' : undefined} />
            <text x={xs[i] + 50} y={85} textAnchor="middle" className={s.t}>{w}</text>
          </g>
        ))}
        {[0, 1].map((i) => (
          <g key={i}>
            <path d={`M ${xs[i] + 100} 74 C ${xs[i] + 125} 74 ${xs[i] + 125} 74 ${xs[i + 1] - 4} 74`} stroke="var(--va)" strokeWidth="2" fill="none" />
            <polygon points={`${xs[i + 1]},74 ${xs[i + 1] - 9},69 ${xs[i + 1] - 9},79`} fill="var(--va)" />
            <text x={xs[i] + 135} y={36} textAnchor="middle" className={s.t}>{`p ${fmt(p[i], 3)}`}</text>
            <text x={xs[i] + 135} y={54} textAnchor="middle" className={s.ts}>{`오차 ${fmt(e[i], 3)}`}</text>
          </g>
        ))}
        <text x={410} y={112} textAnchor="middle" className={s.ts}>다음 토큰이 없어 빠짐</text>
      </svg>
      <Bar label="첫째 자리 오차" value={e[0]} max={3} color="var(--va)" text={fmt(e[0], 3)} />
      <Bar label="둘째 자리 오차" value={e[1]} max={3} color="var(--va)" text={fmt(e[1], 3)} />
      <Bar label="평균 오차" value={mean} max={3} color="var(--vb)" text={fmt(mean, 3)} />
      <Stats>
        <Stat label="평균 오차" value={fmt(mean, 3)} />
        <Stat label="퍼플렉서티 exp(평균)" value={fmt(ppl, 3)} tone={ppl < 4 ? 'good' : undefined} />
        <Stat label="균등일 때 퍼플렉서티" value="4" />
      </Stats>
      <Note>
        {p[1] >= 0.999
          ? '둘째 자리가 정답을 입력에서 보면 비율이 1이 되고 오차는 0입니다. 맞힌 것이 아니라 베낀 것이고, 평균을 끌어내립니다.'
          : ppl < 4
            ? '퍼플렉서티가 4보다 작습니다. 정답 칸의 비율이 1/4보다 크기 때문입니다.'
            : '퍼플렉서티가 4 이상입니다. 사전의 네 단어를 균등하게 고르는 것과 같거나 더 나쁩니다.'}
      </Note>
    </Viz>
  );
}
