import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const MEAN = 68.25;
const DEVS = [6, 3, 0, -3, -6];
const W = 480;
const RH = 44;
const H = DEVS.length * RH + 40;
const LO = 60;
const HI = 77;
const X = (v) => 20 + ((v - LO) / (HI - LO)) * (W - 40);
const slopeText = (v) => (Math.abs(v - 2 / 3) < 1e-9 ? '2/3' : fmt(v, 2));

export default function ReturnDumbbell() {
  const [k, setK] = useState(2 / 3);
  const verdict = k < 1 ? '극단이 평균 쪽으로 줄어듭니다 (골턴의 회귀)' : k === 1 ? '자식도 부모만큼 평균에서 멉니다' : '자식이 부모보다 평균에서 더 멀어집니다';

  return (
    <Viz
      title="어느 쪽 극단이든 평균 쪽으로 돌아갑니다"
      caption="윗줄은 키 큰 부모, 아랫줄은 키 작은 부모입니다. 파랑 점이 부모, 주황 점이 자식입니다. 부모의 벗어남 +6, 0, -6은 설명용 값이고 +3, -3은 원문의 예입니다."
    >
      <Controls>
        <Slider label="기울기" min={0} max={1.2} step={0.01} value={k} onChange={setK} format={slopeText} />
        <Btn on={Math.abs(k - 2 / 3) < 1e-9} onClick={() => setK(2 / 3)}>2/3</Btn>
        <Btn on={k === 1} onClick={() => setK(1)}>1</Btn>
        <Btn on={k === 0} onClick={() => setK(0)}>0</Btn>
      </Controls>
      <svg viewBox={'0 0 ' + W + ' ' + H} className={s.svg} role="img" aria-label="부모 키와 자식 키를 잇는 선. 평균 68.25 쪽으로 이동한다">
        <line x1={X(MEAN)} y1={4} x2={X(MEAN)} y2={H - 26} stroke="var(--ifm-color-emphasis-500)" strokeDasharray="4 3" />
        <text x={X(MEAN)} y={H - 10} textAnchor="middle" className={s.ts}>평균 68.25</text>
        {DEVS.map((d, i) => {
          const y = 22 + i * RH;
          const px = MEAN + d;
          const cx = MEAN + k * d;
          return (
            <g key={d}>
              <line x1={X(px)} y1={y} x2={X(cx)} y2={y} stroke="var(--ifm-color-emphasis-500)" strokeWidth="2" />
              <circle cx={X(px)} cy={y} r={7} fill="var(--va)" />
              <circle cx={X(cx)} cy={y} r={7} fill="var(--vb)" />
              <text x={X(px)} y={y - 12} textAnchor="middle" className={s.ts}>부모 {fmt(px, 2)}</text>
              <text x={X(cx)} y={y + 22} textAnchor="middle" className={s.t}>자식 {fmt(cx, 2)}</text>
            </g>
          );
        })}
      </svg>
      <Stats>
        <Stat label="부모 +3 → 자식" value={fmt(MEAN + 3 * k, 2)} />
        <Stat label="부모 -3 → 자식" value={fmt(MEAN - 3 * k, 2)} />
        <Stat label="3인치 중 돌아간 몫" value={fmt(3 * (1 - k), 2)} />
        <Stat label="판정" value={k < 1 ? '평균으로 돌아감' : k === 1 ? '돌아감 없음' : '벌어짐'} tone={k < 1 ? 'good' : k > 1 ? 'bad' : undefined} />
      </Stats>
      <Note>
        {verdict}. 기울기 2/3에서 3인치 중 1인치가 돌아가고, 그 1인치는 3인치의 1/3입니다. 한 세대에서 평균에서의 거리가 부모의 2/3로 준다는 뜻이고, 세대를 거듭해 68.25에 도착한다는 뜻이 아닙니다.
      </Note>
    </Viz>
  );
}
