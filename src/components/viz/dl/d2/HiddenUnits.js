import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {sci} from './lib';

const X = [1, 0.5];
const INIT = {W: [[0.5, -0.3], [0.2, 0.4]], v: [1, 1], t: 0};

const forward = (W, v, t) => {
  const a = W.map((row) => row[0] * X[0] + row[1] * X[1]);
  const h = a.map(Math.tanh);
  const y = v[0] * h[0] + v[1] * h[1];
  return {a, h, y, E: (y - t) * (y - t)};
};

export default function HiddenUnits() {
  const [W, setW] = useState(INIT.W);
  const [v, setV] = useState(INIT.v);
  const [t, setT] = useState(INIT.t);

  const f = forward(W, v, t);
  const dy = 2 * (f.y - t);
  const dv = f.h.map((h) => dy * h);
  const da = f.h.map((h, j) => dy * v[j] * (1 - h * h));
  const dW = da.map((g) => X.map((xi) => g * xi));

  let worst = 0;
  const d = 1e-6;
  [0, 1].forEach((j) => {
    [0, 1].forEach((i) => {
      const Wp = W.map((r) => r.slice());
      const Wm = W.map((r) => r.slice());
      Wp[j][i] += d;
      Wm[j][i] -= d;
      const g = (forward(Wp, v, t).E - forward(Wm, v, t).E) / (2 * d);
      worst = Math.max(worst, Math.abs(g - dW[j][i]));
    });
    const vp = v.slice();
    const vm = v.slice();
    vp[j] += d;
    vm[j] -= d;
    const g = (forward(W, vp, t).E - forward(W, vm, t).E) / (2 * d);
    worst = Math.max(worst, Math.abs(g - dv[j]));
  });

  const setCell = (j, i) => (val) => setW(W.map((r, jj) => r.map((c, ii) => (jj === j && ii === i ? val : c))));
  const setVj = (j) => (val) => setV(v.map((c, jj) => (jj === j ? val : c)));
  const f1 = (q) => fmt(q, 1);
  const max = Math.max(...dW.flat().map(Math.abs), 1e-12);

  return (
    <Viz
      title="은닉 유닛 두 개: 유닛마다 같은 계산을 되풀이"
      caption="입력은 x = [1, 0.5]이고 은닉 유닛 둘, 출력 하나입니다. h는 tanh(Σ W x), y = v₁h₁ + v₂h₂, 오차는 (y − t)²입니다. 기본값에서 h ≈ [0.3364, 0.3799], y ≈ 0.7163이고 W의 기울기가 [[1.2705, 0.6353], [1.2258, 0.6129]]로 나옵니다."
    >
      <Controls>
        {[0, 1].map((j) =>
          [0, 1].map((i) => (
            <Slider key={`${j}${i}`} label={`W${j + 1}${i + 1}`} min={-1} max={1} step={0.1} value={W[j][i]} onChange={setCell(j, i)} format={f1} />
          )),
        )}
        <Slider label="v₁" min={-2} max={2} step={0.1} value={v[0]} onChange={setVj(0)} format={f1} />
        <Slider label="v₂" min={-2} max={2} step={0.1} value={v[1]} onChange={setVj(1)} format={f1} />
        <Slider label="정답 t" min={-1} max={1} step={0.5} value={t} onChange={setT} format={f1} />
        <Btn onClick={() => { setW(INIT.W); setV(INIT.v); setT(INIT.t); }}>처음 값으로</Btn>
      </Controls>
      <div className={s.two}>
        <div>
          <b>순방향</b>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>유닛</th>
                <th>a</th>
                <th>h = tanh(a)</th>
              </tr>
            </thead>
            <tbody>
              {f.a.map((a, j) => (
                <tr key={j}>
                  <td>{j + 1}</td>
                  <td>{fmt(a, 4)}</td>
                  <td>{fmt(f.h[j], 4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Stats>
            <Stat label="출력 y" value={fmt(f.y, 4)} />
            <Stat label="오차 E" value={fmt(f.E, 4)} />
          </Stats>
        </div>
        <div>
          <b>역방향</b>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>유닛</th>
                <th>a의 기울기</th>
                <th>v의 기울기</th>
                <th>W 기울기 (x₁ 쪽, x₂ 쪽)</th>
              </tr>
            </thead>
            <tbody>
              {da.map((g, j) => (
                <tr key={j}>
                  <td>{j + 1}</td>
                  <td>{fmt(g, 4)}</td>
                  <td>{fmt(dv[j], 4)}</td>
                  <td>
                    <span className={Math.abs(dW[j][0]) === max ? s.cellOn : undefined}>{fmt(dW[j][0], 4)}</span>,{' '}
                    <span className={Math.abs(dW[j][1]) === max ? s.cellOn : undefined}>{fmt(dW[j][1], 4)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Stats>
            <Stat label="∂E/∂y = 2(y − t)" value={fmt(dy, 4)} />
            <Stat label="수치 미분과 최대 차이" value={sci(worst)} tone={worst < 1e-6 ? 'good' : 'bad'} />
          </Stats>
        </div>
      </div>
      <Note>
        W의 기울기는 그 유닛의 a 기울기에 그 연결로 들어온 x를 곱한 값입니다. 야코비안 행렬은 어디에도 나오지 않고, 각 단계에서 쓰는 것은 곱셈 몇 번입니다. 가장 큰 기울기 칸을 강조해 두었습니다.
      </Note>
    </Viz>
  );
}
