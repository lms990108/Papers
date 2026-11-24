import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, styles as s} from '../../Viz';

// 본문과 같은 설정: 입력 7칸, 창 3칸, 출력 5칸
const X = [3, 1, 4, 1, 5, 9, 2];
const A = [1, 0, -1]; // 공유되는 가중치 a, b, c
const BIAS = 1;
const K = 3;
const O = X.length - K + 1; // 5
const Y = Array.from({length: O}, (_, i) => A[0] * X[i] + A[1] * X[i + 1] + A[2] * X[i + 2] + BIAS);

const COL = ['var(--va)', 'var(--vb)', 'var(--vc)', 'var(--vok)'];
const SUB = ['₁', '₂', '₃', '₄', '₅'];
const NAMES = ['a', 'b', 'c', '편향'];

const W = 600;
const H = 292;
const BW = 56;
const BH = 36;
const left = (i) => 56 + i * 72;
const outC = (k) => left(k + 1) + BW / 2; // 출력 k는 창 가운데 칸 아래
const IY = 26;
const SY = 104;
const SH = 40;
const OY = 178;

export default function FilterSlide() {
  const [st, setSt] = useState(2);
  const [shared, setShared] = useState(true);

  const p = st - 1; // 지금 창의 위치 (0부터), st=0이면 없음
  const has = st > 0;
  const done = st >= O;
  const used = shared ? 4 : 4 * Math.min(st, O);

  const sx = has ? outC(p) : outC(0);
  const stampLeft = sx - 97;
  const cellX = (j) => stampLeft + j * 50;

  const note = !has
    ? '입력 7칸 위에 3칸짜리 창을 놓고 한 칸씩 옮기며 출력을 만듭니다. 다음 버튼을 눌러 보세요.'
    : shared
      ? `${p + 1}번째 출력: y${p + 1} = ${A[0]}×${X[p]} + ${A[1]}×${X[p + 1]} + (${A[2]})×${X[p + 2]} + ${BIAS} = ${Y[p]}. 가중치 a, b, c와 편향은 앞의 자리에서 쓴 값과 같은 값입니다.`
      : `${p + 1}번째 출력: y${p + 1} = a${SUB[p]}×${X[p]} + b${SUB[p]}×${X[p + 1]} + c${SUB[p]}×${X[p + 2]} + 편향${SUB[p]}. 이 자리 전용으로 값 4개를 따로 둡니다. 자리가 하나 늘 때마다 학습할 값이 4개 늘어납니다.`;

  return (
    <Viz
      title="같은 가중치를 옮겨 가며 쓰기"
      caption="입력 7칸을 창 3칸으로 훑으면 출력 5칸이 나옵니다. 가중치 a, b, c는 창 안 세 칸에 곱하는 값이고, 편향은 곱하지 않고 마지막에 더하는 값입니다. 공유에서는 모든 자리가 이 4개를 돌려 쓰고, 따로 두면 자리마다 새로 4개를 둡니다."
    >
      <Controls>
        <Btn on={shared} onClick={() => setShared(true)}>같은 값을 공유</Btn>
        <Btn on={!shared} onClick={() => setShared(false)}>자리마다 따로</Btn>
        <Btn onClick={() => setSt(Math.max(0, st - 1))}>이전</Btn>
        <Btn onClick={() => setSt(Math.min(O, st + 1))}>다음</Btn>
        <Btn onClick={() => setSt(O)}>끝까지</Btn>
        <Btn onClick={() => setSt(0)}>처음으로</Btn>
        <span className={s.ts}>{st} / {O}자리</span>
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="입력 위에서 창을 옮기며 같은 가중치를 쓰거나 자리마다 다른 가중치를 쓰는 모습">
        <text x={4} y={14} className={s.ts}>입력</text>
        {X.map((v, i) => {
          const inWin = has && i >= p && i < p + K;
          const c = inWin ? COL[i - p] : 'var(--ifm-font-color-base)';
          return (
            <g key={i}>
              <rect x={left(i)} y={IY} width={BW} height={BH} rx={6} fill={inWin ? c : 'none'} fillOpacity={inWin ? 0.14 : 0} stroke={c} strokeWidth={inWin ? 3 : 1.4} />
              <text x={left(i) + BW / 2} y={IY + 15} textAnchor="middle" className={s.ts}>x{i + 1}</text>
              <text x={left(i) + BW / 2} y={IY + 31} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>{v}</text>
            </g>
          );
        })}

        {has ? (
          <g>
            {[0, 1, 2].map((j) => (
              <line key={j} x1={cellX(j) + 22} y1={SY} x2={left(p + j) + BW / 2} y2={IY + BH} stroke={COL[j]} strokeWidth={2} />
            ))}
            {[0, 1, 2, 3].map((j) => (
              <g key={j}>
                <rect x={cellX(j)} y={SY} width={44} height={SH} rx={6} fill={COL[j]} fillOpacity={0.12} stroke={COL[j]} strokeWidth={2} />
                <text x={cellX(j) + 22} y={SY + 16} textAnchor="middle" style={{fill: COL[j], fontSize: 12, fontWeight: 700}}>
                  {NAMES[j]}{shared ? '' : SUB[p]}
                </text>
                <text x={cellX(j) + 22} y={SY + 33} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>
                  {shared ? (j < 3 ? A[j] : BIAS) : '?'}
                </text>
              </g>
            ))}
            <text x={stampLeft - 4} y={SY + 25} textAnchor="end" className={s.ts}>필터</text>
            <line x1={sx} y1={SY + SH} x2={sx} y2={OY - 2} stroke="var(--ifm-font-color-base)" strokeWidth={2} />
            <polygon points={`${sx},${OY} ${sx - 5},${OY - 9} ${sx + 5},${OY - 9}`} fill="var(--ifm-font-color-base)" />
          </g>
        ) : null}

        <text x={4} y={OY - 6} className={s.ts}>출력</text>
        {Y.map((v, k) => {
          const on = k < st;
          const cur = k === p;
          return (
            <g key={k} opacity={on ? 1 : 0.3}>
              <rect x={outC(k) - BW / 2} y={OY} width={BW} height={BH} rx={6} fill="none" stroke="var(--ifm-font-color-base)" strokeWidth={cur ? 3.5 : 1.4} />
              <text x={outC(k)} y={OY + 15} textAnchor="middle" className={s.ts}>y{k + 1}</text>
              <text x={outC(k)} y={OY + 31} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>{on && shared ? v : on ? '✓' : '?'}</text>
            </g>
          );
        })}

        <text x={4} y={250} className={s.ts}>지금까지 쓴 서로 다른 학습 값</text>
        {Array.from({length: 20}, (_, n) => {
          const x = 230 + n * 15;
          const on = n < used;
          return <rect key={n} x={x} y={238} width={12} height={12} rx={2} fill={on ? COL[n % 4] : 'none'} fillOpacity={on ? 0.8 : 0} stroke="var(--ifm-color-emphasis-400)" strokeWidth={1} />;
        })}
        <text x={536} y={249} className={s.t} style={{fontWeight: 700}}>{used}개</text>
        <text x={230} y={274} className={s.ts}>
          {shared ? '4개 (자리가 늘어도 그대로)' : `4개 × ${Math.min(st, O)}자리 (자리마다 새로)`}
        </text>
      </svg>
      <Note>{note}</Note>
      {done ? (
        <Note>
          {shared
            ? '5자리를 모두 계산했는데 서로 다른 학습 값은 4개뿐입니다. 입력이 100칸이어도 필터가 같으면 4개입니다.'
            : '5자리를 모두 계산하니 학습할 값이 4 × 5 = 20개입니다. 입력이 100칸이면 출력이 98칸이라 4 × 98 = 392개가 됩니다. 공유 버튼으로 바꿔 같은 계산이 4개로 되는 것을 확인해 보세요.'}
        </Note>
      ) : null}
    </Viz>
  );
}
