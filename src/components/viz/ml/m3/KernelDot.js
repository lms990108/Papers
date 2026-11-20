import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

// n개 변수의 정확히 k차인 항(중복 조합)의 수 = C(n+k-1, k)
const terms = (n, k) => {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - 1 + i)) / i;
  return Math.round(r);
};
const group = (v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const R2 = Math.SQRT2;

export default function KernelDot() {
  const [x, setX] = useState([1, 2]);
  const [z, setZ] = useState([3, 1]);
  const [n, setN] = useState(784);
  const [k, setK] = useState(2);
  const phi = (v) => [v[0] * v[0], R2 * v[0] * v[1], v[1] * v[1]];
  const px = phi(x);
  const pz = phi(z);
  const dotXZ = x[0] * z[0] + x[1] * z[1];
  const viaK = dotXZ * dotXZ;
  const viaPhi = px[0] * pz[0] + px[1] * pz[1] + px[2] * pz[2];
  const cnt = terms(n, k);
  const set = (v, i, q) => (i === 0 ? [q, v[1]] : [v[0], q]);
  const f3 = (v) => `(${fmt(v[0], 2)}, ${fmt(v[1], 2)}, ${fmt(v[2], 2)})`;

  return (
    <Viz
      title="커널 트릭: 올린 공간의 내적을 원래 좌표의 곱 하나로"
      caption="x와 z를 바꿔 보세요. 세 좌표로 올린 뒤 내적한 값과 원래 좌표에서 내적하고 제곱한 값이 언제나 같습니다. 아래쪽은 입력 변수가 n개일 때 k차 항이 몇 개인지 세는 슬라이더로, 항을 목록으로 만들지 않아도 되는 이유를 보여 줍니다."
    >
      <Controls>
        <Btn onClick={() => { setX([1, 2]); setZ([3, 1]); }}>x = (1, 2), z = (3, 1)</Btn>
        <Btn onClick={() => { setX([2, 1]); setZ([1, 3]); }}>x = (2, 1), z = (1, 3)</Btn>
      </Controls>
      <Controls>
        <Slider label="x의 첫째 수 x₁" min={-4} max={4} value={x[0]} onChange={(q) => setX(set(x, 0, q))} />
        <Slider label="x의 둘째 수 x₂" min={-4} max={4} value={x[1]} onChange={(q) => setX(set(x, 1, q))} />
        <Slider label="z의 첫째 수 z₁" min={-4} max={4} value={z[0]} onChange={(q) => setZ(set(z, 0, q))} />
        <Slider label="z의 둘째 수 z₂" min={-4} max={4} value={z[1]} onChange={(q) => setZ(set(z, 1, q))} />
      </Controls>
      <div className={s.two}>
        <div className={s.stat}>
          <span>방법 1: φ로 올린 뒤 내적 (세 좌표를 만듦)</span>
          <div className={s.t}>φ(x) = {f3(px)}</div>
          <div className={s.t}>φ(z) = {f3(pz)}</div>
          <b>φ(x)·φ(z) = {fmt(viaPhi, 3)}</b>
        </div>
        <div className={s.stat}>
          <span>방법 2: 원래 좌표에서 내적하고 제곱</span>
          <div className={s.t}>x·z = {dotXZ}</div>
          <div className={s.t}>(x·z)² = {dotXZ}² </div>
          <b>k(x, z) = (x·z)² = {viaK}</b>
        </div>
      </div>
      <Stats>
        <Stat label="두 값의 차이" value={fmt(Math.abs(viaPhi - viaK), 6)} tone="good" />
      </Stats>
      <Controls>
        <Slider label="입력 변수 수 n (픽셀 수)" min={2} max={1000} step={1} value={n} onChange={setN} />
        <Slider label="차수 k (곱하는 변수 개수)" min={1} max={5} value={k} onChange={setK} />
        <Btn onClick={() => { setN(784); setK(2); }}>784 픽셀, 2차</Btn>
        <Btn onClick={() => { setN(784); setK(4); }}>784 픽셀, 4차</Btn>
        <Btn onClick={() => { setN(40); setK(2); }}>주성분 40개, 2차</Btn>
      </Controls>
      <Stats>
        <Stat label={`${n}개 변수의 ${k}차 항`} value={group(cnt)} />
        <Stat label="커널로 계산하는 횟수" value="내적 1번 + 거듭제곱" tone="good" />
      </Stats>
      <Note>784 픽셀의 2차 항은 307,720개, 4차 항은 15,862,504,420개이고 주성분 40개의 2차 항은 820개입니다(본문과 같은 값). 정확히 k차인 항의 수는 C(n+k−1, k)로 셉니다.</Note>
    </Viz>
  );
}
