import React, {useMemo, useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {makeFrame, clipHalfPlane, clipLine, num} from './geom';

const W = 420;
const H = 300;
const XR = [-0.6, 1.7];
const YR = [-0.6, 1.7];
const {X, Y} = makeFrame(W, H, XR, YR);
const PTS = [[0, 0], [1, 0], [0, 1], [1, 1]];
const TABLES = {
  and: {name: '논리곱', t: [0, 0, 0, 1], w: [1, 1], b: -1.5},
  or: {name: '논리합(하나라도 1)', t: [0, 1, 1, 1], w: [1, 1], b: -0.5},
  xor: {name: '배타적 논리합', t: [0, 1, 1, 0], w: [1, 1], b: -0.5},
};
const hits = (w, b, t) => PTS.reduce((a, p, i) => a + ((w[0] * p[0] + w[1] * p[1] + b > 0 ? 1 : 0) === t[i] ? 1 : 0), 0);

export default function PerceptronBoundary() {
  const [kind, setKind] = useState('and');
  const [w, setW] = useState([1, 1]);
  const [b, setB] = useState(-1.5);
  const tb = TABLES[kind];
  const pick = (k) => {
    setKind(k);
    setW(TABLES[k].w);
    setB(TABLES[k].b);
  };

  // 격자(w는 0.5 간격, b는 0.25 간격) 위의 모든 직선을 시험해 가장 많이 맞히는 것을 찾는다.
  const grid = useMemo(() => {
    const out = {};
    Object.keys(TABLES).forEach((k) => {
      let best = {n: -1};
      let perfect = 0;
      for (let a = -3; a <= 3; a += 0.5) {
        for (let c = -3; c <= 3; c += 0.5) {
          for (let d = -4; d <= 3; d += 0.25) {
            const n = hits([a, c], d, TABLES[k].t);
            if (n === 4) perfect++;
            if (n > best.n) best = {n, w: [a, c], b: d};
          }
        }
      }
      out[k] = {best, perfect};
    });
    return out;
  }, []);

  const sc = PTS.map((p) => w[0] * p[0] + w[1] * p[1] + b);
  const ys = sc.map((v) => (v > 0 ? 1 : 0));
  const ok = ys.filter((y, i) => y === tb.t[i]).length;
  const rect = [[XR[0], YR[0]], [XR[1], YR[0]], [XR[1], YR[1]], [XR[0], YR[1]]];
  const pos = clipHalfPlane(rect, w[0], w[1], b);
  const line = clipLine(w[0], w[1], b, XR[0], XR[1], YR[0], YR[1]);
  const g = grid[kind];

  return (
    <Viz
      title="퍼셉트론 한 개의 경계는 직선 하나입니다"
      caption="표를 고르고 w와 b를 돌려 직선을 옮겨 보세요. 주황 칠한 쪽이 출력 1입니다. 점 안의 숫자는 그 점의 정답입니다. 논리곱과 논리합은 네 점을 모두 맞히는 직선이 있지만, 배타적 논리합은 어떻게 돌려도 네 점을 다 맞히지 못합니다."
    >
      <Controls>
        {Object.keys(TABLES).map((k) => (
          <Btn key={k} on={kind === k} onClick={() => pick(k)}>{TABLES[k].name}</Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="w₁ (x₁에 곱하는 수)" min={-3} max={3} step={0.5} value={w[0]} onChange={(v) => setW([v, w[1]])} format={(v) => num(v, 1)} />
        <Slider label="w₂ (x₂에 곱하는 수)" min={-3} max={3} step={0.5} value={w[1]} onChange={(v) => setW([w[0], v])} format={(v) => num(v, 1)} />
        <Slider label="바이어스 b (더하는 수)" min={-4} max={3} step={0.25} value={b} onChange={setB} format={(v) => num(v, 2)} />
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} style={{maxWidth: 460, margin: '0 auto'}} role="img" aria-label="입력 평면의 네 점과 퍼셉트론의 경계 직선">
        {pos.length > 2 ? <polygon points={pos.map((p) => `${X(p[0])},${Y(p[1])}`).join(' ')} fill="var(--vb)" fillOpacity="0.13" /> : null}
        <line x1={X(XR[0])} y1={Y(0)} x2={X(XR[1])} y2={Y(0)} stroke="var(--vgrid)" />
        <line x1={X(0)} y1={Y(YR[0])} x2={X(0)} y2={Y(YR[1])} stroke="var(--vgrid)" />
        {line ? <line x1={X(line[0][0])} y1={Y(line[0][1])} x2={X(line[1][0])} y2={Y(line[1][1])} stroke="var(--ifm-font-color-base)" strokeWidth="2.5" /> : null}
        {PTS.map((p, i) => {
          const wrong = ys[i] !== tb.t[i];
          return (
            <g key={i}>
              {wrong ? <circle cx={X(p[0])} cy={Y(p[1])} r={20} fill="none" stroke="var(--vbad)" strokeWidth="2.5" strokeDasharray="4 3" /> : null}
              <circle cx={X(p[0])} cy={Y(p[1])} r={13} fill={tb.t[i] === 1 ? 'var(--vb)' : 'var(--va)'} />
              <text x={X(p[0])} y={Y(p[1]) + 5} textAnchor="middle" className={s.t} style={{fill: '#fff', fontWeight: 700}}>{tb.t[i]}</text>
              <text x={X(p[0]) + 18} y={Y(p[1]) + (p[1] === 0 ? 20 : -14)} className={s.ts}>({p[0]}, {p[1]}){wrong ? ' 틀림' : ''}</text>
            </g>
          );
        })}
        <text x={X(XR[1]) - 4} y={Y(0) - 6} textAnchor="end" className={s.ts}>x₁</text>
        <text x={X(0) + 6} y={Y(YR[1]) + 10} className={s.ts}>x₂</text>
        {!line ? <text x={W / 2} y={H - 8} textAnchor="middle" className={s.ts}>w가 (0, 0)이면 경계가 없고 점수는 항상 b입니다</text> : null}
      </svg>
      <Stats>
        <Stat label="맞힌 점" value={`${ok} / 4`} tone={ok === 4 ? 'good' : 'bad'} />
        <Stat label="점수 s (0,0 · 1,0 · 0,1 · 1,1)" value={sc.map((v) => num(v, 2)).join(' · ')} />
        <Stat label={`${tb.name}: 격자 최고`} value={`${g.best.n} / 4`} />
        <Stat label="4개 모두 맞히는 직선 수" value={g.perfect} />
      </Stats>
      <Controls>
        <Btn onClick={() => { setW(g.best.w); setB(g.best.b); }}>격자에서 가장 잘 맞히는 직선으로</Btn>
      </Controls>
      <Note>
        w는 0.5 간격, b는 0.25 간격 격자 위의 직선을 모두 시험한 결과입니다(설명용 탐색 범위).
        {kind === 'xor' ? ' 배타적 논리합은 4개를 모두 맞히는 직선이 하나도 없습니다. 1인 두 점이 대각선에 있기 때문입니다.' : ' 논리곱과 논리합은 직선이 여럿이라는 것을 숫자로 볼 수 있습니다.'}
      </Note>
    </Viz>
  );
}
