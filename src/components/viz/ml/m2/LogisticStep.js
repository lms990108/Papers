import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {sigmoid, nll, num} from './mlCore';

const REV = [
  {name: '연기가 좋다', x: [1, 0], t: 1},
  {name: '결말이 나쁘다', x: [0, 1], t: 0},
];
const INIT = [1, -1, 0];
const NAMES = ['w1', 'w2', 'b'];

const forward = (q, r) => sigmoid(q[0] * r.x[0] + q[1] * r.x[1] + q[2]);
const errOf = (q, r) => {
  const p = forward(q, r);
  return nll(r.t === 1 ? p : 1 - p);
};

export default function LogisticStep() {
  const [q, setQ] = useState(INIT);
  const [sel, setSel] = useState(0);
  const [lr, setLr] = useState(0.1);
  const [hist, setHist] = useState([errOf(INIT, REV[0])]);

  const r = REV[sel];
  const p = forward(q, r);
  const d = p - r.t;
  const g = [d * r.x[0], d * r.x[1], d];
  const nq = q.map((v, i) => v - lr * g[i]);
  const E = errOf(q, r);
  const En = errOf(nq, r);
  const h = 1e-6;
  const num1 = (errOf([q[0] + h, q[1], q[2]], r) - errOf([q[0] - h, q[1], q[2]], r)) / (2 * h);
  const apply = (k) => {
    let cur = q;
    const hh = hist.slice();
    for (let i = 0; i < k; i += 1) {
      const pp = forward(cur, r);
      const dd = pp - r.t;
      cur = cur.map((v, j) => v - lr * dd * (j === 0 ? r.x[0] : j === 1 ? r.x[1] : 1));
      hh.push(errOf(cur, r));
    }
    setQ(cur);
    setHist(hh);
  };
  const reset = (k) => {
    setSel(k);
    setQ(INIT);
    setHist([errOf(INIT, REV[k])]);
  };
  const shown = hist.slice(-8);

  return (
    <Viz
      title="로지스틱 회귀의 한 스텝 갱신"
      caption="리뷰와 학습률을 고르고 한 걸음을 눌러 보세요. 점수 기울기는 p - t이고, 가중치의 기울기는 (p - t)·x, 바이어스의 기울기는 p - t입니다. 처음 값은 가중치 (1, -1), 바이어스 0입니다."
    >
      <Controls>
        {REV.map((v, k) => (
          <Btn key={v.name} on={sel === k} onClick={() => reset(k)}>
            {v.name} (정답 {v.t})
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="학습률" min={0.05} max={3} step={0.05} value={lr} onChange={setLr} format={(v) => num(v, 2)} />
        <Btn on={Math.abs(lr - 0.1) < 1e-9} onClick={() => setLr(0.1)}>0.1</Btn>
        <Btn on={Math.abs(lr - 1) < 1e-9} onClick={() => setLr(1)}>1</Btn>
        <Btn onClick={() => apply(1)}>한 걸음</Btn>
        <Btn onClick={() => apply(10)}>10걸음</Btn>
        <Btn onClick={() => reset(sel)}>처음으로</Btn>
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>파라미터</th>
            <th>지금</th>
            <th>기울기</th>
            <th>갱신: 지금 - {num(lr, 2)} × 기울기</th>
          </tr>
        </thead>
        <tbody>
          {NAMES.map((nm, i) => (
            <tr key={nm}>
              <td>{nm}</td>
              <td>{num(q[i], 4)}</td>
              <td className={Math.abs(g[i]) > 1e-12 ? s.cellOn : undefined}>
                {i === 0 ? '(p - t) × x1 = ' : i === 1 ? '(p - t) × x2 = ' : 'p - t = '}
                {num(g[i], 4)}
              </td>
              <td>{num(nq[i], 4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="점수 s" value={num(q[0] * r.x[0] + q[1] * r.x[1] + q[2], 4)} />
        <Stat label="비율 p" value={num(p, 4)} />
        <Stat label="지금의 오차" value={num(E, 4)} />
        <Stat label="한 걸음 뒤의 오차" value={num(En, 4)} tone={En < E - 1e-12 ? 'good' : En > E + 1e-12 ? 'bad' : undefined} />
        <Stat label="수치 미분 (w1)" value={num(num1, 3)} />
      </Stats>
      <p className={s.note}>
        오차의 변화(최근 {shown.length}개): {shown.map((v) => num(v, 4)).join(' → ')}
      </p>
      <Note>
        {Math.abs(g[0]) < 1e-12 && Math.abs(g[1]) < 1e-12 && Math.abs(g[2]) < 1e-12
          ? '기울기가 0이라 더 움직이지 않습니다.'
          : Math.abs(g[1]) < 1e-12 && r.x[1] === 0
            ? '이 리뷰는 x2가 0이라 w2의 기울기가 0이고, w2는 움직이지 않습니다. 기울기가 음수라서 w1과 b가 커집니다. 맞힌 건이라 기울기가 작아서 조금만 움직입니다.'
            : '학습률이 크면 같은 기울기에서 더 멀리 갑니다. 연기가 좋다에서 처음 값으로 한 걸음 가면 학습률 0.1은 w1 = 1.0269, 학습률 1은 w1 = 1.269입니다.'}
      </Note>
    </Viz>
  );
}
