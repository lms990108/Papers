import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, fmt, styles as s} from '../../Viz';

function sci(x) {
  if (x >= 1 && x < 1000) return String(Math.round(x));
  let e = Math.floor(Math.log10(x));
  let m = x / 10 ** e;
  if (Math.round(m * 100) / 100 >= 10) {
    m /= 10;
    e += 1;
  }
  return `${fmt(m, 2)} × 10^${e}`;
}

export default function NgramTableSize() {
  const [v, setV] = useState(10000);
  const [ex, setEx] = useState(8);
  const tokens = 10 ** ex;
  const rows = [1, 2, 3, 4].map((n) => {
    const cells = v ** n;
    return {n, cells, fill: Math.min(1, tokens / cells)};
  });

  return (
    <Viz
      title="n이 커질 때 비율표의 크기"
      caption="n-그램 표의 칸 수는 사전 크기의 n제곱입니다. 학습 글에서 서로 다른 n-그램은 단어 수를 넘을 수 없어서, 채울 수 있는 칸의 비율에는 상한이 있습니다. 막대는 칸 수의 상용로그입니다."
    >
      <Controls>
        <Slider label="사전 크기 |V|" min={1000} max={20000} step={500} value={v} onChange={setV} format={(x) => x.toLocaleString('en-US')} />
        <Slider label="학습 글 단어 수 (10의 거듭제곱)" min={6} max={10} step={0.5} value={ex} onChange={setEx} format={(x) => `10^${x}`} />
      </Controls>
      <Controls>
        <Btn on={v === 3000} onClick={() => setV(3000)}>|V| = 3,000</Btn>
        <Btn on={v === 5000} onClick={() => setV(5000)}>|V| = 5,000</Btn>
        <Btn on={v === 10000} onClick={() => setV(10000)}>|V| = 10,000</Btn>
      </Controls>
      {rows.map((r) => (
        <Bar key={r.n} label={`${r.n}-그램`} value={Math.log10(r.cells)} max={18} color="var(--vb)" text={sci(r.cells)} />
      ))}
      <table className={s.grid}>
        <thead>
          <tr>
            <th>n</th>
            <th>칸 수 |V|^n</th>
            <th>채울 수 있는 칸의 상한</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.n}>
              <td>{r.n}</td>
              <td>{sci(r.cells)}</td>
              <td className={r.fill < 0.01 ? s.cellOn : undefined}>{r.fill >= 1 ? '전부 가능' : sci(r.fill)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Viz>
  );
}
