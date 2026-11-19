import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {num} from './mlCore';

const REV = [
  {name: '연기가 좋다', x: [1, 0], t: 4},
  {name: '결말이 나쁘다', x: [0, 1], t: 2},
  {name: '연기가 좋다, 좋다', x: [2, 0], t: 4},
];
const INIT = {w1: 1, w2: -1, b: 3};

const evalRows = (p) =>
  REV.map((r) => {
    const lin = p.w1 * r.x[0] + p.w2 * r.x[1];
    const y = lin + p.b;
    const d = y - r.t;
    return {...r, lin, y, d, E: d * d};
  });
const meanE = (rows) => rows.reduce((a, r) => a + r.E, 0) / rows.length;

// step이 꺼져 있으면 w1, w2, b를 직접 바꿔 보는 표, 켜져 있으면 한 스텝 갱신 계산기
export default function ReviewModel({step = false}) {
  const [p, setP] = useState(INIT);
  const [sel, setSel] = useState(2);
  const [lr, setLr] = useState(0.1);
  const [count, setCount] = useState(0);

  const rows = evalRows(p);
  const mse = meanE(rows);
  const cur = rows[sel];
  const g = [2 * cur.d * cur.x[0], 2 * cur.d * cur.x[1], 2 * cur.d];
  const next = {w1: p.w1 - lr * g[0], w2: p.w2 - lr * g[1], b: p.b - lr * g[2]};
  const after = evalRows(next);
  const mseAfter = meanE(after);
  const names = ['w1', 'w2', 'b'];
  const now = [p.w1, p.w2, p.b];
  const nxt = [next.w1, next.w2, next.b];
  const set = (k) => (v) => setP({...p, [k]: v});
  const stuck = g[0] === 0 && g[1] === 0 && g[2] === 0;

  if (!step) {
    return (
      <Viz
        title="세 리뷰의 예측과 오차 표"
        caption="모델은 y = w1·x1 + w2·x2 + b이고 x1은 좋다 횟수, x2는 나쁘다 횟수입니다. 처음 값은 w1 = 1, w2 = -1, b = 3이고, 표의 숫자가 글의 계산과 같습니다."
      >
        <Controls>
          <Slider label="w1" min={-3} max={3} step={0.1} value={p.w1} onChange={set('w1')} format={(v) => num(v, 1)} />
          <Slider label="w2" min={-3} max={3} step={0.1} value={p.w2} onChange={set('w2')} format={(v) => num(v, 1)} />
          <Slider label="b" min={-1} max={6} step={0.1} value={p.b} onChange={set('b')} format={(v) => num(v, 1)} />
        </Controls>
        <Controls>
          <Btn onClick={() => setP(INIT)}>원래 값 (1, -1, 3)</Btn>
          <Btn onClick={() => setP({w1: 1, w2: -1, b: 4})}>바이어스를 4로</Btn>
          <Btn onClick={() => setP({w1: 1, w2: 0, b: 3})}>w2 = 0 (나쁘다 무시)</Btn>
        </Controls>
        <div style={{overflowX: 'auto'}}>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>리뷰</th>
                <th>(x1, x2)</th>
                <th>w1·x1 + w2·x2</th>
                <th>+ b</th>
                <th>예측 y</th>
                <th>정답 t</th>
                <th>차이 y - t</th>
                <th>제곱 오차</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td>({r.x[0]}, {r.x[1]})</td>
                  <td>{num(r.lin, 2)}</td>
                  <td>{num(p.b, 2)}</td>
                  <td>{num(r.y, 2)}</td>
                  <td>{r.t}</td>
                  <td className={Math.abs(r.d) > 1e-9 ? s.cellOn : undefined}>{num(r.d, 2)}</td>
                  <td>{num(r.E, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Stats>
          <Stat label="세 오차의 평균 (MSE)" value={num(mse, 3)} tone={mse < 1e-9 ? 'good' : undefined} />
          <Stat label="맞힌 리뷰 수" value={rows.filter((r) => Math.abs(r.d) < 1e-9).length + ' / 3'} />
        </Stats>
        <Note>
          {Math.abs(p.b - 4) < 1e-9 && p.w1 === 1 && p.w2 === -1
            ? '바이어스를 4로 올리면 (1, 0)의 예측이 5가 되어 정답 4와 차이가 1입니다. 이번 오차는 횟수가 아니라 바이어스에서 옵니다.'
            : '기본 값에서는 앞 두 건이 맞고 셋째 건만 별점이 1 높습니다. 슬라이더로 평균 오차를 0에 가깝게 만들 수 있는지 해 보세요.'}
        </Note>
      </Viz>
    );
  }

  return (
    <Viz
      title="리뷰 하나로 한 걸음 내려가기"
      caption="리뷰를 고르고 학습률을 정한 뒤 한 걸음을 눌러 보세요. 기울기는 2(y - t)x1, 2(y - t)x2, 2(y - t)이고, 새 값 = 지금 값 - 학습률 × 기울기입니다."
    >
      <Controls>
        {REV.map((r, i) => (
          <Btn key={r.name} on={sel === i} onClick={() => setSel(i)}>
            {r.name}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="학습률" min={0.05} max={1} step={0.05} value={lr} onChange={setLr} format={(v) => num(v, 2)} />
        <Btn on={Math.abs(lr - 0.1) < 1e-9} onClick={() => setLr(0.1)}>0.1</Btn>
        <Btn on={Math.abs(lr - 0.25) < 1e-9} onClick={() => setLr(0.25)}>0.25</Btn>
        <Btn onClick={() => {
          setP(next);
          setCount(count + 1);
        }}>
          한 걸음 내려가기
        </Btn>
        <Btn onClick={() => {
          setP(INIT);
          setCount(0);
        }}>
          처음으로
        </Btn>
      </Controls>
      <p className={s.note}>
        선택한 리뷰: {cur.name}, (x1, x2) = ({cur.x[0]}, {cur.x[1]}), 예측 y = {num(cur.y, 3)}, 정답 t = {cur.t}, 차이 y - t = {num(cur.d, 3)}
      </p>
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
          {names.map((nm, i) => (
            <tr key={nm}>
              <td>{nm}</td>
              <td>{num(now[i], 4)}</td>
              <td className={g[i] === 0 ? undefined : s.cellOn}>{num(g[i], 4)}</td>
              <td>{num(nxt[i], 4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{overflowX: 'auto'}}>
        <table className={s.grid}>
          <thead>
            <tr>
              <th>리뷰</th>
              <th>정답 t</th>
              <th>지금 예측</th>
              <th>갱신 후 예측</th>
              <th>지금 제곱 오차</th>
              <th>갱신 후 제곱 오차</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td>{r.t}</td>
                <td>{num(r.y, 3)}</td>
                <td className={i === sel ? s.cellOn : undefined}>{num(after[i].y, 3)}</td>
                <td>{num(r.E, 3)}</td>
                <td>{num(after[i].E, 3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Stats>
        <Stat label="지금 평균 오차 MSE" value={num(mse, 3)} />
        <Stat label="갱신 후 평균 오차" value={num(mseAfter, 3)} tone={mseAfter < mse - 1e-12 ? 'good' : mseAfter > mse + 1e-12 ? 'bad' : undefined} />
        <Stat label="내려간 걸음 수" value={count} />
      </Stats>
      <Note>
        {stuck
          ? '이 리뷰는 오차가 0이라 기울기도 0입니다. 파라미터가 움직이지 않습니다.'
          : g[1] === 0 && cur.x[1] === 0
            ? '이 리뷰는 x2가 0이라 w2의 기울기도 0이고, w2는 움직이지 않습니다. 다른 리뷰도 같은 가중치를 공유하므로, 이 갱신이 그 리뷰들의 예측을 바꿉니다.'
            : '한 리뷰에 맞춘 갱신이 다른 리뷰의 예측을 바꾸는 것을 아래 표에서 확인해 보세요. 학습은 모든 리뷰의 평균 오차를 보며 조금씩 고치는 일입니다.'}
      </Note>
    </Viz>
  );
}
