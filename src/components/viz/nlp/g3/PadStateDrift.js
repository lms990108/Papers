import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

// 설명용: W_x = I, W_h = 0.5 I, h_0 = [0, 0], 빈 칸의 입력은 영 목록
const TOK = {날씨: [0, 1], 좋다: [1, 1], 빈칸: [0, 0]};
const WORDS = ['날씨', '좋다'];

function run(seq, skipPad) {
  let h = [0, 0];
  return seq.map((tk) => {
    if (skipPad && tk === '빈칸') return {tk, a: null, h};
    const x = TOK[tk];
    const a = [0.5 * h[0] + x[0], 0.5 * h[1] + x[1]];
    h = [Math.tanh(a[0]), Math.tanh(a[1])];
    return {tk, a, h};
  });
}
const f = (v) => `[${fmt(v[0], 3)}, ${fmt(v[1], 3)}]`;

export default function PadStateDrift() {
  const [pads, setPads] = useState(2);
  const [front, setFront] = useState(false);
  const [skip, setSkip] = useState(false);

  const padArr = Array(pads).fill('빈칸');
  const seq = front ? padArr.concat(WORDS) : WORDS.concat(padArr);
  const rows = run(seq, skip);
  const real = run(WORDS, false);
  const last = rows[rows.length - 1].h;
  const target = real[real.length - 1].h;
  const same = Math.abs(last[0] - target[0]) < 1e-9 && Math.abs(last[1] - target[1]) < 1e-9;

  return (
    <Viz
      title="빈 칸을 지나가면 마지막 상태가 달라진다"
      caption="“날씨 좋다”에 빈 칸을 붙여 순환 신경망 예(W_x는 단위행렬, W_h는 0.5배 단위행렬, 시작 상태 0)로 읽습니다. 빈 칸의 입력은 영 목록으로 둔 설명용 설정입니다."
    >
      <Controls>
        <Slider label="빈 칸 수" min={0} max={4} value={pads} onChange={setPads} />
        <Btn on={!front} onClick={() => setFront(false)}>뒤에 붙이기</Btn>
        <Btn on={front} onClick={() => setFront(true)}>앞에 붙이기</Btn>
        <Btn on={skip} onClick={() => setSkip(!skip)}>빈 칸에서는 상태를 갱신하지 않기</Btn>
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>칸</th>
            <th>토큰</th>
            <th>tanh 안의 값 a</th>
            <th>상태 h</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td className={r.tk === '빈칸' ? s.cellOn : undefined}>{r.tk === '빈칸' ? '0 (빈 칸)' : r.tk}</td>
              <td>{r.a ? f(r.a) : '건너뜀'}</td>
              <td>{f(r.h)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="마지막 칸의 상태" value={f(last)} />
        <Stat label="마지막 실제 단어(좋다)의 상태" value={f(target)} />
        <Stat label="같은가" value={same ? '같음' : '다름'} tone={same ? 'good' : 'bad'} />
      </Stats>
      <Note>
        뒤에 붙인 빈 칸마다 상태가 한 번씩 더 갱신되어 마지막 칸의 상태가 달라집니다. 그래서 문장 길이를 따로 기억해 실제 마지막 칸의 상태를 꺼내거나, 빈 칸에서는 상태를 갱신하지 않습니다.
        {front ? ' 앞에 붙인 빈 칸은 시작 상태 0에 영 입력을 더하므로 상태가 0 그대로이고, 이 설정에서는 마지막 상태가 같아집니다.' : ''}
      </Note>
    </Viz>
  );
}
