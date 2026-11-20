import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {net} from './lib';

const X = 1;
const T = 0;
const loss = (w1, w2) => net(X, w1, w2, T).E;

export default function NetUpdate() {
  const [eps, setEps] = useState(0.1);
  const [hist, setHist] = useState([[0.5, 1]]);

  const [w1, w2] = hist[hist.length - 1];
  const n = net(X, w1, w2, T);
  const d = 1e-6;
  const nw1 = (loss(w1 + d, w2) - loss(w1, w2)) / d;
  const nw2 = (loss(w1, w2 + d) - loss(w1, w2)) / d;
  const step = () => {
    if (hist.length < 12) setHist(hist.concat([[w1 - eps * n.dw1, w2 - eps * n.dw2]]));
  };

  return (
    <Viz
      title="두 층 망의 파라미터를 한 번 고치기"
      caption="입력 1, 정답 0, 시작 w₁ = 0.5, w₂ = 1입니다. 역전파로 구한 기울기와 δ = 10⁻⁶으로 잰 수치 기울기가 같은지 보고, 갱신 버튼으로 오차가 줄어드는 것을 확인하세요."
    >
      <Controls>
        <Slider label="학습률 ε" min={0.01} max={0.5} step={0.01} value={eps} onChange={setEps} format={(v) => fmt(v, 2)} />
        <Btn onClick={step}>한 번 갱신</Btn>
        <Btn onClick={() => setHist([[0.5, 1]])}>처음으로</Btn>
      </Controls>
      <Stats>
        <Stat label="w₁ 기울기 (역전파 식)" value={fmt(n.dw1, 4)} />
        <Stat label="w₁ 기울기 (δ로 잰 값)" value={fmt(nw1, 4)} tone={Math.abs(nw1 - n.dw1) < 1e-3 ? 'good' : 'bad'} />
        <Stat label="w₂ 기울기 (역전파 식)" value={fmt(n.dw2, 4)} />
        <Stat label="w₂ 기울기 (δ로 잰 값)" value={fmt(nw2, 4)} tone={Math.abs(nw2 - n.dw2) < 1e-3 ? 'good' : 'bad'} />
      </Stats>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>갱신 횟수</th>
            <th>w₁</th>
            <th>w₂</th>
            <th>오차</th>
          </tr>
        </thead>
        <tbody>
          {hist.map((h, i) => (
            <tr key={i} className={i === hist.length - 1 ? s.cellOn : undefined}>
              <td>{i}</td>
              <td>{fmt(h[0], 4)}</td>
              <td>{fmt(h[1], 4)}</td>
              <td>{fmt(loss(h[0], h[1]), 4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Note>
        {hist.length === 1
          ? `ε = ${fmt(eps, 2)}로 한 번 갱신하면 w₁ = ${fmt(0.5 - eps * n.dw1, 4)}, w₂ = ${fmt(1 - eps * n.dw2, 4)}이 되고 오차는 ${fmt(n.E, 4)}에서 ${fmt(loss(0.5 - eps * n.dw1, 1 - eps * n.dw2), 4)}로 바뀝니다.`
          : hist.length >= 12
          ? '표가 가득 찼습니다. 처음으로 돌아가 학습률을 바꿔 보세요.'
          : '갱신할 때마다 기울기를 다시 계산합니다. 오차가 줄수록 기울기도 작아져 걸음이 짧아집니다.'}
      </Note>
    </Viz>
  );
}
