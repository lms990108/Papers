import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {comma} from './dlmath';

// 층마다 가중치 n_in x n_out, 바이어스 n_out
export default function LayerSizes() {
  const [nIn, setNIn] = useState(784);
  const [nOut, setNOut] = useState(10);
  const [layers, setLayers] = useState(1); // 은닉층 수
  const [width, setWidth] = useState(100);
  const [bias, setBias] = useState(true);

  const sizes = [nIn];
  for (let i = 0; i < layers; i += 1) sizes.push(width);
  sizes.push(nOut);
  const rows = [];
  for (let i = 0; i + 1 < sizes.length; i += 1) {
    const w = sizes[i] * sizes[i + 1];
    const b = bias ? sizes[i + 1] : 0;
    rows.push({i, from: sizes[i], to: sizes[i + 1], w, b});
  }
  const total = rows.reduce((a, r) => a + r.w + r.b, 0);
  const preset = (n, o, l, wd) => {
    setNIn(n);
    setNOut(o);
    setLayers(l);
    setWidth(wd);
    setBias(true);
  };

  return (
    <Viz
      title="층의 크기로 빈칸 수 세기"
      caption="한 층의 빈칸은 가중치 n_in × n_out개와 바이어스 n_out개입니다. 기본값 784 → 100 → 10은 본문의 79,510개입니다."
    >
      <Controls>
        <Btn on={nIn === 784 && nOut === 10 && layers === 0} onClick={() => preset(784, 10, 0, 100)}>
          784-10
        </Btn>
        <Btn on={nIn === 784 && nOut === 10 && layers === 1 && width === 100} onClick={() => preset(784, 10, 1, 100)}>
          784-100-10
        </Btn>
        <Btn on={nIn === 784 && nOut === 10 && layers === 2 && width === 100} onClick={() => preset(784, 10, 2, 100)}>
          784-100-100-10
        </Btn>
        <Btn on={nIn === 3 && nOut === 2 && layers === 1 && width === 4} onClick={() => preset(3, 2, 1, 4)}>
          연습 문제 2 (3-4-2)
        </Btn>
      </Controls>
      <Controls>
        <Slider label="입력 칸" min={1} max={784} value={nIn} onChange={setNIn} />
        <Slider label="출력 칸" min={1} max={20} value={nOut} onChange={setNOut} />
      </Controls>
      <Controls>
        {[0, 1, 2, 3].map((l) => (
          <Btn key={l} on={layers === l} onClick={() => setLayers(l)}>
            은닉층 {l}개
          </Btn>
        ))}
        <Slider label="은닉 칸 수" min={1} max={500} value={width} onChange={setWidth} />
        <Btn on={bias} onClick={() => setBias(!bias)}>
          바이어스 {bias ? '포함' : '제외'}
        </Btn>
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>층</th>
            <th>크기</th>
            <th>가중치</th>
            <th>바이어스</th>
            <th>합</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.i}>
              <td>{r.i + 1}</td>
              <td>
                {r.from} → {r.to}
              </td>
              <td>
                {r.from} × {r.to} = {comma(r.w)}
              </td>
              <td>{bias ? comma(r.b) : '세지 않음'}</td>
              <td className={s.cellOn}>{comma(r.w + r.b)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="구조" value={sizes.join('-')} />
        <Stat label="층 수" value={rows.length} />
        <Stat label="전체 빈칸 수" value={comma(total)} />
      </Stats>
      <Note>
        은닉층을 하나 더 쌓으면 {width} → {width} 층의 {comma(width * width + (bias ? width : 0))}개가 더해집니다. 은닉 칸 수는 학습이 정하지 않고 배선을 그릴 때 사람이 정합니다.
      </Note>
    </Viz>
  );
}
