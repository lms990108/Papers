import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {ACTS} from './dlmath';

// 원본: 첫 단계 W1(두 줄 가중치), 둘째 단계 W2
const W1 = [
  [0.5, -0.2],
  [0.1, 0.4],
];
const W2 = [
  [1, 1],
  [0.5, -1],
];
const mv = (M, v) => M.map((r) => r[0] * v[0] + r[1] * v[1]);
const mm = (A, B) => A.map((r) => [0, 1].map((c) => r[0] * B[0][c] + r[1] * B[1][c]));

const MODES = ['none', 'tanh', 'relu'];

function Mat({m, d = 2}) {
  return (
    <table className={s.grid} style={{width: 'auto', display: 'inline-table'}}>
      <tbody>
        {m.map((r, i) => (
          <tr key={i}>
            {r.map((v, j) => (
              <td key={j}>{fmt(v, d)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function LinearCollapse() {
  const [x, setX] = useState([1, 1]);
  const [mode, setMode] = useState('none');
  const f = ACTS[mode].f;
  const a = mv(W1, x);
  const h = a.map(f);
  const y = mv(W2, h);
  const Wm = mm(W2, W1);
  const y1 = mv(Wm, x);
  const diff = Math.max(Math.abs(y[0] - y1[0]), Math.abs(y[1] - y1[1]));
  const same = diff < 1e-9;

  return (
    <Viz
      title="두 단계를 한 단계로 합쳐 보기"
      caption="x는 입력 두 칸의 밝기이고, W₁은 첫 단계의 가중치 묶음, W₂는 둘째 단계의 가중치 묶음입니다(원문의 값). 가운데에 아무것도 끼우지 않으면 두 단계의 결과와 합친 W₂W₁의 결과가 같습니다. tanh나 ReLU는 값을 구부리는 함수인데, 이것을 끼우면 달라집니다. h는 첫 단계 뒤에 사이를 지난 값입니다."
    >
      <Controls>
        <Slider label="x₁" min={-2} max={2} step={0.1} value={x[0]} onChange={(v) => setX([v, x[1]])} format={(v) => fmt(v, 1)} />
        <Slider label="x₂" min={-2} max={2} step={0.1} value={x[1]} onChange={(v) => setX([x[0], v])} format={(v) => fmt(v, 1)} />
        <Btn onClick={() => setX([1, 1])}>입력 (1, 1)로</Btn>
      </Controls>
      <Controls>
        <span className={s.note} style={{margin: 0}}>두 단계 사이에 끼우기:</span>
        {MODES.map((m) => (
          <Btn key={m} on={mode === m} onClick={() => setMode(m)}>
            {ACTS[m].label === '없음 (직선)' ? '아무것도 없음' : ACTS[m].label}
          </Btn>
        ))}
      </Controls>
      <div className={s.two}>
        <div>
          <div className={s.title}>① 두 단계를 차례로</div>
          <table className={s.grid}>
            <tbody>
              <tr>
                <th>첫 단계 W₁x</th>
                <td>{fmt(a[0], 3)}</td>
                <td>{fmt(a[1], 3)}</td>
              </tr>
              <tr>
                <th>{mode === 'none' ? '사이에 끼운 것 없음' : `${ACTS[mode].label} 적용`}</th>
                <td>{fmt(h[0], 3)}</td>
                <td>{fmt(h[1], 3)}</td>
              </tr>
              <tr>
                <th>둘째 단계 W₂h</th>
                <td className={s.cellOn}>{fmt(y[0], 3)}</td>
                <td className={s.cellOn}>{fmt(y[1], 3)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <div className={s.title}>② 합친 W = W₂W₁로 한 번에</div>
          <div style={{display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap'}}>
            <Mat m={Wm} />
            <span>×</span>
            <span>
              ({fmt(x[0], 1)}, {fmt(x[1], 1)})
            </span>
          </div>
          <table className={s.grid}>
            <tbody>
              <tr>
                <th>한 단계 결과</th>
                <td className={s.cellOn}>{fmt(y1[0], 3)}</td>
                <td className={s.cellOn}>{fmt(y1[1], 3)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <Stats>
        <Stat label="두 결과의 차이(최대)" value={fmt(diff, 3)} tone={same ? 'good' : 'bad'} />
        <Stat label="판정" value={same ? '같다' : '다르다'} tone={same ? 'good' : 'bad'} />
      </Stats>
      <Note>
        {mode === 'none'
          ? '곱해서 더하기만 하면 두 단계는 한 단계와 같습니다. 입력을 아무리 바꿔도 차이는 0입니다.'
          : same
            ? '이 입력에서는 우연히 같습니다. ReLU는 값이 모두 양수이면 아무것도 자르지 않고, 입력이 모두 0이면 tanh도 0을 그대로 둡니다. x를 음수 쪽으로 옮겨 보세요.'
            : '가운데 함수가 값을 구부려서 한 단계로는 합칠 수 없습니다. 단계 사이에 구부러지는 함수가 필요한 이유입니다.'}
      </Note>
    </Viz>
  );
}
