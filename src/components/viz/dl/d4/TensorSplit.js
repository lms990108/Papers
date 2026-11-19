import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const W = [
  [1, 2],
  [3, 4],
];
const MODES = [
  {id: 'one', name: '한 장에서 계산'},
  {id: 'col', name: '열로 나눔'},
  {id: 'row', name: '행으로 나눔'},
];
const v = (a) => `[${a.join(', ')}]`;

export default function TensorSplit() {
  const [x, setX] = useState([1, 1]);
  const [mode, setMode] = useState('col');
  const [skip, setSkip] = useState(false);

  const full = [W[0][0] * x[0] + W[0][1] * x[1], W[1][0] * x[0] + W[1][1] * x[1]];
  // 열 나눔: GPU j는 W의 j번째 열과 x의 j번째 칸을 곱한다 → 부분 출력 2개를 더해야 최종
  const colParts = [0, 1].map((j) => [W[0][j] * x[j], W[1][j] * x[j]]);
  const colSum = [colParts[0][0] + colParts[1][0], colParts[0][1] + colParts[1][1]];
  // 행 나눔: GPU i는 W의 i번째 행과 x 전체를 곱한다 → 출력 한 칸, 이어 붙임
  const rowParts = [0, 1].map((i) => W[i][0] * x[0] + W[i][1] * x[1]);
  const result = mode === 'col' ? (skip ? colParts[0] : colSum) : full;

  return (
    <Viz
      title="tensor parallelism: 행렬 W를 GPU 두 장에 나눠 곱하기"
      caption="W = [[1, 2], [3, 4]]이고 x는 슬라이더로 바꿉니다. 기본 x = [1, 1]이면 Wx = [3, 7]입니다. 열로 나누면 부분 출력을 더하고, 행으로 나누면 부분 출력을 이어 붙입니다."
    >
      <Controls>
        {MODES.map((m) => (
          <Btn key={m.id} on={mode === m.id} onClick={() => setMode(m.id)}>
            {m.name}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="x의 첫째 칸" min={-3} max={4} value={x[0]} onChange={(a) => setX([a, x[1]])} />
        <Slider label="x의 둘째 칸" min={-3} max={4} value={x[1]} onChange={(a) => setX([x[0], a])} />
        <Btn onClick={() => setX([1, 1])}>x = [1, 1]</Btn>
        <Btn onClick={() => setX([2, 0])}>연습 2: x = [2, 0]</Btn>
      </Controls>
      <div className={s.two}>
        {mode === 'one' ? (
          <div className={s.stat}>
            <span>GPU 1장</span>
            <b>
              Wx = [{W[0][0]}×{x[0]} + {W[0][1]}×{x[1]}, {W[1][0]}×{x[0]} + {W[1][1]}×{x[1]}] = {v(full)}
            </b>
          </div>
        ) : null}
        {mode === 'col'
          ? [0, 1].map((j) => (
              <div key={j} className={s.stat}>
                <span>GPU {j + 1}: W의 {j + 1}번째 열 {v([W[0][j], W[1][j]])} × x의 {j + 1}번째 칸 {x[j]}</span>
                <b>부분 출력 {v(colParts[j])}</b>
              </div>
            ))
          : null}
        {mode === 'row'
          ? [0, 1].map((i) => (
              <div key={i} className={s.stat}>
                <span>GPU {i + 1}: W의 {i + 1}번째 행 {v(W[i])} · x {v(x)}</span>
                <b>출력 {i + 1}번째 칸 {rowParts[i]}</b>
              </div>
            ))
          : null}
      </div>
      {mode === 'col' ? (
        <Controls>
          <Btn on={skip} onClick={() => setSkip(!skip)}>all-reduce(더하기)를 건너뛰고 1장의 부분 출력만 쓰기</Btn>
        </Controls>
      ) : null}
      <Stats>
        <Stat label="최종 출력" value={v(result)} tone={result[0] === full[0] && result[1] === full[1] ? 'good' : 'bad'} />
        <Stat label="한 장에서 구한 Wx" value={v(full)} />
        <Stat label="합치는 방법" value={mode === 'col' ? 'all-reduce로 더하기' : mode === 'row' ? 'all-gather로 이어 붙이기' : '필요 없음'} />
      </Stats>
      <Note>
        {mode === 'col' && skip
          ? '부분 출력은 최종 출력이 아닙니다. 둘째 장의 부분과 더해야 합니다.'
          : '어느 쪽이든 한 장에서 구한 값과 같습니다. 나누는 것은 배치가 아니라 행렬의 열이나 행이고, 배치는 data parallelism이 나눕니다.'}
        {mode === 'col' && x[1] === 0 && !skip ? ' x의 둘째 칸이 0이면 GPU 2의 부분은 0입니다.' : ''}
      </Note>
    </Viz>
  );
}
