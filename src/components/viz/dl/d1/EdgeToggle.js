import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const halo = {stroke: 'var(--ifm-background-surface-color)', strokeWidth: 4, paintOrder: 'stroke'};
// 원문: 선 위의 수 0.5와 -0.2, 출력 선은 1
const WS = [0.5, -0.2];

export default function EdgeToggle() {
  const [x, setX] = useState([1, 0]);
  const [edge, setEdge] = useState([true, true]);
  const a = (edge[0] ? WS[0] * x[0] : 0) + (edge[1] ? WS[1] * x[1] : 0);
  const h = Math.tanh(a);
  const y = 1 * h;
  const params = edge.filter(Boolean).length;
  const Y = [50, 130];

  return (
    <Viz
      title="선을 그리면 빈칸이 생기고, 안 그리면 없다"
      caption="은닉 칸 하나가 두 픽셀을 봅니다. 선 위의 수 0.5와 -0.2는 원문의 값입니다. 선을 지우면 그 가중치라는 빈칸은 존재하지 않습니다."
    >
      <Controls>
        <Slider label="x₁" min={0} max={1} step={0.1} value={x[0]} onChange={(v) => setX([v, x[1]])} format={(v) => fmt(v, 1)} />
        <Slider label="x₂" min={0} max={1} step={0.1} value={x[1]} onChange={(v) => setX([x[0], v])} format={(v) => fmt(v, 1)} />
      </Controls>
      <Controls>
        <Btn on={edge[0]} onClick={() => setEdge([!edge[0], edge[1]])}>
          x₁ 선 {edge[0] ? '있음' : '지움'}
        </Btn>
        <Btn on={edge[1]} onClick={() => setEdge([edge[0], !edge[1]])}>
          x₂ 선 {edge[1] ? '있음' : '지움'}
        </Btn>
      </Controls>
      <svg className={s.svg} viewBox="0 0 560 180" role="img" aria-label="두 픽셀이 선으로 은닉 칸에 이어지고 tanh를 거쳐 출력이 되는 그림">
        {[0, 1].map((i) => (
          <g key={i}>
            {edge[i] ? (
              <>
                <line x1={90 + 22} y1={Y[i]} x2={290 - 36} y2={90} stroke={WS[i] >= 0 ? 'var(--va)' : 'var(--vb)'} strokeWidth={1 + Math.abs(WS[i]) * 5} strokeDasharray={x[i] === 0 ? '4 4' : undefined} />
                <text x={90 + 22 + (290 - 36 - 112) * 0.35} y={Y[i] + (90 - Y[i]) * 0.35 + (i === 0 ? -8 : 15)} textAnchor="middle" className={s.t} style={halo}>
                  {fmt(WS[i], 1)}
                </text>
              </>
            ) : (
              <text x={190} y={Y[i] + (i === 0 ? -6 : 18)} textAnchor="middle" className={s.ts}>
                선 없음 (빈칸 없음)
              </text>
            )}
            <circle cx={90} cy={Y[i]} r={22} fill="var(--ifm-background-color)" stroke="var(--ifm-color-emphasis-500)" />
            <text x={90} y={Y[i] + 4} textAnchor="middle" className={s.t}>
              {fmt(x[i], 1)}
            </text>
            <text x={58} y={Y[i] + 4} textAnchor="end" className={s.ts}>
              x{i + 1}
            </text>
          </g>
        ))}
        <rect x={254} y={64} width={72} height={52} rx={8} fill="var(--ifm-background-color)" stroke="var(--ifm-color-emphasis-500)" />
        <text x={290} y={84} textAnchor="middle" className={s.ts}>
          a = {fmt(a, 2)}
        </text>
        <text x={290} y={104} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>
          h = {fmt(h, 3)}
        </text>
        <line x1={330} y1={90} x2={448} y2={90} stroke="var(--va)" strokeWidth={6} />
        <text x={390} y={80} textAnchor="middle" className={s.t} style={halo}>
          1
        </text>
        <circle cx={480} cy={90} r={26} fill="var(--ifm-background-color)" stroke="var(--vok)" strokeWidth={2.5} />
        <text x={480} y={94} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>
          {fmt(y, 3)}
        </text>
      </svg>
      <Stats>
        <Stat label="이 칸의 파라미터 수 (선)" value={params} />
        <Stat label="a (합)" value={fmt(a, 2)} />
        <Stat label="h = tanh(a)" value={fmt(h, 3)} />
        <Stat label="출력 y" value={fmt(y, 3)} />
      </Stats>
      <Note>
        {edge[1] && x[1] === 0
          ? 'x₂가 0이라 −0.2는 이번 합에 더해지지 않습니다. 그래도 그 선은 구조에 남아 있습니다. x₂를 1로 올리면 a가 0.5에서 0.3으로 내려갑니다.'
          : !edge[1] && x[1] === 0
            ? 'x₂ 선을 지웠습니다. 이번 입력에서는 값이 같지만 파라미터는 2개에서 1개로 줄었으니 다른 모델입니다. x₂를 올려도 값이 달라지지 않습니다.'
            : '선을 지우면 그 입력은 이 칸에 아무 영향도 주지 못합니다. 어느 선을 둘지가 구조입니다.'}
      </Note>
    </Viz>
  );
}
