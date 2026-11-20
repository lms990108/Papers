import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const REF = {
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '7': ['###', '..#', '.#.', '.#.', '.#.'],
  '3': ['###', '..#', '.##', '..#', '###'],
};
const KEYS = ['1', '7', '3'];
const toVec = (rows) => rows.join('').split('').map((ch) => (ch === '#' ? 1 : -1));
const REFV = {};
KEYS.forEach((k) => { REFV[k] = toVec(REF[k]); });
const BLUR7 = toVec(['.##', '..#', '.#.', '##.', '.#.']);
const BLANK = toVec(['...', '...', '...', '...', '...']);
const CELL = 18;

function Mini({label, ref0, x, a, mark}) {
  return (
    <div style={{textAlign: 'center'}}>
      <svg viewBox={`0 0 ${CELL * 3 + 4} ${CELL * 5 + 4}`} style={{width: 74}} role="img" aria-label={`${label}의 기준 그림`}>
        {ref0.map((v, j) => {
          const cx = 2 + (j % 3) * CELL;
          const cy = 2 + Math.floor(j / 3) * CELL;
          const diff = mark && (x[j] > 0) !== (v > 0);
          return (
            <g key={j}>
              <rect x={cx} y={cy} width={CELL - 2} height={CELL - 2} rx={3} fill={v > 0 ? 'var(--ifm-font-color-base)' : 'transparent'} stroke={diff ? 'var(--vbad)' : 'var(--ifm-color-emphasis-400)'} strokeWidth={diff ? 2.5 : 1} />
              {diff ? <text x={cx + (CELL - 2) / 2} y={cy + 13} textAnchor="middle" style={{fill: v > 0 ? 'var(--ifm-background-color)' : 'var(--vbad)', fontSize: 12, fontWeight: 700}}>×</text> : null}
            </g>
          );
        })}
      </svg>
      <div className={s.ts}>{label}의 기준</div>
    </div>
  );
}

export default function RbfBitmapDistance() {
  const [x, setX] = useState(BLUR7);
  const [a, setA] = useState(1);
  const [T, setT] = useState(20);
  const flip = (j) => setX(x.map((v, i) => (i === j ? -v : v)));
  const res = KEYS.map((k) => {
    const w = REFV[k];
    let y = 0;
    let diff = 0;
    w.forEach((wj, j) => {
      y += (a * x[j] - wj) ** 2;
      if ((x[j] > 0) !== (wj > 0)) diff++;
    });
    return {k, y, diff};
  });
  const minY = Math.min.apply(null, res.map((r) => r.y));
  const near = res.find((r) => r.y === minY);
  const tie = res.filter((r) => Math.abs(r.y - minY) < 1e-9).length > 1;
  const reject = minY >= T;
  const same = (v) => x.length === v.length && x.every((q, i) => q === v[i]);

  return (
    <Viz
      title="5×3 비트맵으로 재 보는 RBF 벌점"
      caption="입력 칸을 눌러 # 와 . 를 바꿔 보세요. 같은 칸의 기여는 0, 다른 칸은 4(상태가 ±1일 때)라서 벌점은 다른 칸 수의 4배입니다. 기본값은 7을 쓰려다 두 칸이 틀린 그림이고, 상태 크기를 0.8로 줄이면 본문의 실수 상태 값이 나옵니다."
    >
      <Controls>
        <Btn on={same(BLUR7)} onClick={() => setX(BLUR7)}>흐린 7</Btn>
        <Btn on={same(BLANK)} onClick={() => setX(BLANK)}>빈 칸(전부 −1)</Btn>
        {KEYS.map((k) => <Btn key={k} on={same(REFV[k])} onClick={() => setX(REFV[k])}>{k} 그대로</Btn>)}
      </Controls>
      <Controls>
        <Slider label="상태 크기 a (입력의 ±1에 곱하는 수)" min={0.2} max={1} step={0.1} value={a} onChange={setA} format={(v) => fmt(v, 1)} />
        <Slider label="거부 문턱 T" min={0} max={60} step={1} value={T} onChange={setT} />
      </Controls>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: '14px 18px', alignItems: 'flex-start', margin: '4px 0 10px'}}>
        <div style={{textAlign: 'center'}}>
          <div style={{display: 'grid', gridTemplateColumns: `repeat(3, ${CELL + 12}px)`, gap: 3}}>
            {x.map((v, j) => (
              <button
                key={j}
                type="button"
                onClick={() => flip(j)}
                aria-label={`입력 ${Math.floor(j / 3) + 1}행 ${(j % 3) + 1}열, 지금 ${v > 0 ? '+1' : '-1'}, 누르면 바뀝니다`}
                style={{height: CELL + 12, border: '1px solid var(--ifm-color-emphasis-500)', borderRadius: 5, cursor: 'pointer', fontWeight: 700, background: v > 0 ? 'var(--ifm-font-color-base)' : 'transparent', color: v > 0 ? 'var(--ifm-background-color)' : 'var(--ifm-color-emphasis-600)'}}
              >
                {v > 0 ? '#' : '.'}
              </button>
            ))}
          </div>
          <div className={s.ts}>입력 (눌러서 바꾸기)</div>
        </div>
        {KEYS.map((k) => <Mini key={k} label={k} ref0={REFV[k]} x={x} a={a} mark />)}
      </div>
      {res.map((r) => (
        <Bar key={r.k} label={`${r.k}의 벌점 y`} value={r.y} max={60} color={r.y === minY ? 'var(--vok)' : 'var(--va)'} text={`${fmt(r.y, a === 1 ? 0 : 2)}${a === 1 ? ` = 4 × ${r.diff}칸` : ` (다른 칸 ${r.diff})`}`} />
      ))}
      <Stats>
        <Stat label="가장 가까운 기준" value={tie ? '동점' : near.k} />
        <Stat label="최소 벌점" value={fmt(minY, a === 1 ? 0 : 2)} />
        <Stat label={`문턱 T = ${T}`} value={reject ? '거부(글자 아님)' : tie ? '동점' : `${near.k}로 읽음`} tone={reject ? 'bad' : 'good'} />
      </Stats>
      <Note>
        y = (같은 칸 수)×(1−a)² + (다른 칸 수)×(1+a)²입니다. 빈 칸을 넣으면 # 칸 개수가 1은 8개, 7은 7개, 3은 10개라서 벌점이 32, 28, 40이 됩니다. 가장 가까운 기준을 고르기만 하면 빈 칸도 7로 읽히고, 최솟값을 문턱과 비교해야 거부할 수 있습니다. 최댓값은 4×15 = 60입니다.
      </Note>
    </Viz>
  );
}
