import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, fmt, styles as s} from '../../Viz';

const W0 = [
  [2, -1],
  [-1, 2],
];
const LABELS = ['긍정', '부정'];

export default function ClsFinetune() {
  const [h, setH] = useState([1, 0.5]);
  const [W, setW] = useState(W0);
  const [y, setY] = useState(0);
  const [lr, setLr] = useState(0.5);
  const [steps, setSteps] = useState(0);

  const score = [0, 1].map((c) => h[0] * W[0][c] + h[1] * W[1][c]);
  const e = score.map((v) => Math.exp(v));
  const z = e[0] + e[1];
  const p = e.map((v) => v / z);
  const loss = -Math.log(p[y]);
  const gs = p.map((v, c) => v - (c === y ? 1 : 0));
  const grad = [0, 1].map((r) => [0, 1].map((c) => h[r] * gs[c]));

  const step = () => {
    setW(W.map((row, r) => row.map((v, c) => v - lr * grad[r][c])));
    setSteps(steps + 1);
  };
  const reset = () => {
    setW(W0);
    setSteps(0);
  };

  return (
    <Viz
      title="[CLS] 목록에 분류 줄을 곱해 오차 만들기"
      caption="[CLS] 목록 h와 분류 줄 W(열은 긍정, 부정)로 점수를 만들고 소프트맥스와 오차를 계산합니다. 경사하강 한 걸음을 누르면 W가 기울기의 반대 방향으로 움직입니다. 학습 속도 값은 설명용입니다."
    >
      <Controls>
        <Slider label="[CLS] 목록 h의 첫 칸" min={-2} max={2} step={0.5} value={h[0]} onChange={(v) => setH([v, h[1]])} format={(v) => fmt(v, 1)} />
        <Slider label="[CLS] 목록 h의 둘째 칸" min={-2} max={2} step={0.5} value={h[1]} onChange={(v) => setH([h[0], v])} format={(v) => fmt(v, 1)} />
        {LABELS.map((l, c) => (
          <Btn key={l} on={y === c} onClick={() => setY(c)}>
            정답 = {l}
          </Btn>
        ))}
      </Controls>
      <div className={s.two}>
        <div>
          <div className={s.title}>분류 줄 W (갱신 {steps}번)</div>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>h의 칸 (그 칸에 곱하는 W의 행)</th>
                <th>긍정 열</th>
                <th>부정 열</th>
              </tr>
            </thead>
            <tbody>
              {W.map((row, r) => (
                <tr key={r}>
                  <th>{r + 1}번 칸 (h = {fmt(h[r], 1)})</th>
                  {row.map((v, c) => (
                    <td key={c}>{fmt(v, 3)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div className={s.title}>W의 기울기 h × (p − y)</div>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>h의 칸</th>
                <th>긍정 열</th>
                <th>부정 열</th>
              </tr>
            </thead>
            <tbody>
              {grad.map((row, r) => (
                <tr key={r}>
                  <th>{r + 1}번 칸</th>
                  {row.map((v, c) => (
                    <td key={c} className={c === y ? s.cellOn : undefined}>{fmt(v, 4)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {LABELS.map((l, c) => (
        <Bar key={l} label={l + ' (점수 ' + fmt(score[c], 2) + ')'} value={p[c]} max={1} color={c === 0 ? 'var(--vok)' : 'var(--vbad)'} text={fmt(p[c], 4)} />
      ))}
      <Stats>
        <Stat label={'오차 −log p(' + LABELS[y] + ')'} value={fmt(loss, 4)} tone={loss < 0.3 ? 'good' : loss > 1 ? 'bad' : undefined} />
        <Stat label="점수 차이 (긍정 − 부정)" value={fmt(score[0] - score[1], 2)} />
      </Stats>
      <Controls>
        <Slider label="학습 속도 (한 걸음의 크기)" min={0.1} max={1} step={0.1} value={lr} onChange={setLr} format={(v) => fmt(v, 1)} />
        <Btn onClick={step}>경사하강 한 걸음</Btn>
        <Btn onClick={reset}>W 되돌리기</Btn>
        <Btn onClick={() => setH([1, 0.5])}>h 되돌리기</Btn>
      </Controls>
      <Note>
        기본값에서 긍정 점수는 1 × 2 + 0.5 × (−1) = 1.5, 부정 점수는 0이고, 비율은 0.8176과 0.1824입니다. 정답이 긍정이면 오차 0.2014, 부정이면 1.7014입니다. 정답이 긍정일 때 한 걸음을 누르면 긍정 점수가 올라가고 오차가 줄어듭니다.
      </Note>
    </Viz>
  );
}
