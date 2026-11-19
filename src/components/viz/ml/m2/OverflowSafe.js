import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, styles as s} from '../../Viz';
import {num} from './mlCore';

const PRE = [
  {k: '1, 0', a: 1, b: 0},
  {k: '1000, 0', a: 1000, b: 0},
  {k: '1000, 999', a: 1000, b: 999},
  {k: '2000, 2000', a: 2000, b: 2000},
];

// 컴퓨터가 표현하는 범위를 넘으면 e^s가 무한대가 됩니다.
const show = (v) => (Number.isFinite(v) ? num(v, 3) : v > 0 ? '넘침' : '계산 불가');

export default function OverflowSafe() {
  const [a, setA] = useState(1000);
  const [b, setB] = useState(0);

  const m = Math.max(a, b);
  const ea = Math.exp(a);
  const eb = Math.exp(b);
  const z = ea + eb;
  const naive = [ea / z, eb / z];
  const overflow = !Number.isFinite(z);
  const sa = Math.exp(a - m);
  const sb = Math.exp(b - m);
  const safe = [sa / (sa + sb), sb / (sa + sb)];

  return (
    <Viz
      title="e^s가 넘칠 때 가장 큰 점수를 빼는 방법"
      caption="점수가 1000이면 e^1000을 계산할 수 없습니다. 두 점수에서 가장 큰 점수를 모두 빼고 계산하면 비율은 같고 지수는 커지지 않습니다. 점수를 키워 어디서 넘치는지 보세요."
    >
      <Controls>
        <Slider label="칸 1 점수" min={0} max={2000} step={10} value={a} onChange={setA} />
        <Slider label="칸 2 점수" min={0} max={2000} step={10} value={b} onChange={setB} />
      </Controls>
      <Controls>
        {PRE.map((o) => (
          <Btn key={o.k} on={a === o.a && b === o.b} onClick={() => {
            setA(o.a);
            setB(o.b);
          }}>
            {o.k}
          </Btn>
        ))}
      </Controls>
      <div className={s.two}>
        <div>
          <b style={{fontSize: '0.85rem'}}>그냥 계산</b>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>칸</th>
                <th>e^s</th>
                <th>비율</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1].map((i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{overflow ? show([ea, eb][i]) : num([ea, eb][i], 3)}</td>
                  <td className={overflow ? s.cellOn : undefined}>{overflow ? '계산 불가' : num(naive[i], 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <b style={{fontSize: '0.85rem'}}>가장 큰 점수 {num(m, 0)}을 빼고 계산</b>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>칸</th>
                <th>s - {num(m, 0)}</th>
                <th>e^(s - {num(m, 0)})</th>
                <th>비율</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1].map((i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{num([a, b][i] - m, 0)}</td>
                  <td>{num([sa, sb][i], 3)}</td>
                  <td className={s.cellOn}>{num(safe[i], 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Bar label="안전한 계산: 칸 1" value={safe[0]} max={1} color="var(--vb)" text={num(safe[0], 3)} />
      <Bar label="안전한 계산: 칸 2" value={safe[1]} max={1} color="var(--va)" text={num(safe[1], 3)} />
      <Stats>
        <Stat label="그냥 계산" value={overflow ? '넘침' : '가능'} tone={overflow ? 'bad' : 'good'} />
        <Stat label="안전한 계산의 비율 합" value={num(safe[0] + safe[1], 3)} tone="good" />
      </Stats>
      <Note>
        {overflow
          ? '지수가 컴퓨터가 다루는 범위를 넘어 무한대가 되고, 무한대를 무한대로 나눌 수 없어 비율을 구하지 못합니다. 가장 큰 점수를 빼면 가장 큰 칸의 지수가 e^0 = 1이 되어 넘치지 않습니다.'
          : '점수가 작으면 두 방법이 같은 비율을 냅니다. 모든 점수에 같은 수를 더해도 비율이 같다는 성질을 쓰기 때문입니다. 슬라이더를 오른쪽으로 밀어 넘치는 자리를 찾아보세요.'}
      </Note>
    </Viz>
  );
}
