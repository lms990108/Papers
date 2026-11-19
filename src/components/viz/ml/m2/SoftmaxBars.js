import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, styles as s} from '../../Viz';
import {softmax, num} from './mlCore';

const COLORS = ['var(--vb)', 'var(--va)', 'var(--vc)', 'var(--vok)'];
const PRE = [
  {k: '1, 0', v: [1, 0]},
  {k: '2, 0', v: [2, 0]},
  {k: '1, 0, 0', v: [1, 0, 0]},
  {k: '2, 1, 1', v: [2, 1, 1]},
  {k: '2, -1, 0.5', v: [2, -1, 0.5]},
  {k: '0, 0, 0', v: [0, 0, 0]},
  {k: '1, -1', v: [1, -1]},
];

export default function SoftmaxBars() {
  const [sc, setSc] = useState([1, 0, 0, 0]);
  const [n, setN] = useState(2);
  const [naive, setNaive] = useState(false);

  const v = sc.slice(0, n);
  const set = (i) => (x) => setSc(sc.map((a, j) => (j === i ? x : a)));
  const load = (arr) => {
    setN(arr.length);
    setSc(arr.concat([0, 0, 0, 0]).slice(0, 4));
  };
  const total = v.reduce((a, c) => a + c, 0);
  const e = v.map((x) => Math.exp(x));
  const z = e.reduce((a, c) => a + c, 0);
  const p = softmax(v);
  const zero = Math.abs(total) < 1e-9;
  const q = zero ? v.map(() => NaN) : v.map((x) => x / total);
  const shown = naive ? q : p;
  const hasNeg = naive && q.some((x) => x < 0 || x > 1);
  const last = n - 1;

  return (
    <Viz
      title="점수가 비율이 되는 과정"
      caption="점수 슬라이더를 움직이면 지수 e^s, 그 합, 비율이 같이 바뀝니다. 아래 단추로 칸의 수를 바꾸고, 점수를 한꺼번에 더하거나 곱해 보세요. 기본 값 (1, 0)은 0.731과 0.269입니다."
    >
      <Controls>
        <Btn on={!naive} onClick={() => setNaive(false)}>지수로 바꾼 뒤 나누기 (소프트맥스)</Btn>
        <Btn on={naive} onClick={() => setNaive(true)}>점수를 그냥 합으로 나누기</Btn>
      </Controls>
      <Controls>
        {[2, 3, 4].map((k) => (
          <Btn key={k} on={n === k} onClick={() => setN(k)}>
            칸 {k}개
          </Btn>
        ))}
        {PRE.map((o) => (
          <Btn key={o.k} onClick={() => load(o.v)}>
            {o.k}
          </Btn>
        ))}
      </Controls>
      <Controls>
        {v.map((x, i) => (
          <Slider key={i} label={'칸 ' + (i + 1) + ' 점수'} min={-10} max={10} step={0.1} value={x} onChange={set(i)} format={(a) => num(a, 1)} />
        ))}
      </Controls>
      <Controls>
        <Btn onClick={() => v.every((a) => a + 1 <= 10) && setSc(sc.map((a) => a + 1))}>모든 점수에 +1</Btn>
        <Btn onClick={() => v.every((a) => Math.abs(a * 2) <= 10) && setSc(sc.map((a) => a * 2))}>모든 점수 ×2</Btn>
      </Controls>
      <div style={{overflowX: 'auto'}}>
        <table className={s.grid}>
          <thead>
            <tr>
              <th>칸</th>
              <th>점수 s</th>
              {naive ? <th>s ÷ 합</th> : <th>e^s</th>}
              <th>{naive ? '비율?' : '비율 p = e^s ÷ ' + num(z, 3)}</th>
            </tr>
          </thead>
          <tbody>
            {v.map((x, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{num(x, 1)}</td>
                <td>{naive ? (zero ? '÷ 0' : num(x, 1) + ' ÷ ' + num(total, 1)) : num(e[i], 3)}</td>
                <td className={naive && !zero && (q[i] < 0 || q[i] > 1) ? s.cellOn : undefined}>{naive && zero ? '계산 불가' : num(shown[i], 3)}</td>
              </tr>
            ))}
            <tr>
              <th>합</th>
              <th>{num(total, 1)}</th>
              <th>{naive ? '' : num(z, 3)}</th>
              <th>{naive && zero ? '—' : num(shown.reduce((a, c) => a + c, 0), 3)}</th>
            </tr>
          </tbody>
        </table>
      </div>
      {v.map((x, i) => (
        <Bar key={i} label={'칸 ' + (i + 1)} value={naive && zero ? 0 : Math.max(0, shown[i])} max={1} color={COLORS[i]} text={naive && zero ? '계산 불가' : num(shown[i], 3)} />
      ))}
      <Stats>
        <Stat label={'칸 1 ÷ 칸 ' + n + '의 비율의 비'} value={naive ? '—' : num(p[0] / p[last], 3)} />
        <Stat label={'e^(s1 - s' + n + ')'} value={num(Math.exp(v[0] - v[last]), 3)} />
        <Stat label="가장 큰 점수의 칸" value={String(v.indexOf(Math.max.apply(null, v)) + 1) + '번'} />
      </Stats>
      <Note>
        {naive
          ? zero
            ? '점수의 합이 0이라 나눌 수 없습니다.'
            : hasNeg
              ? '음수가 섞이면 비율이 0보다 작거나 1보다 커집니다. 이래서 점수를 그대로 나눌 수 없습니다.'
              : '점수가 모두 0 이상이면 나눠도 되는 것처럼 보입니다. (1, -1)이나 (2, -1, 0.5)를 눌러 음수를 섞어 보세요.'
          : '소프트맥스에서 두 칸의 비율의 비는 점수 차이의 지수 e^(s1 - s' + n + ')입니다. 모든 점수에 같은 수를 더해도 비가 그대로이므로 비율도 그대로입니다. 점수를 두 배로 하면 큰 칸은 두 배가 되지 않고, (1, 0)이 (2, 0)이 되면 0.731이 0.881이 됩니다.'}
      </Note>
    </Viz>
  );
}
