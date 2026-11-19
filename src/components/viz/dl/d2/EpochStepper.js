import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {lin, tr, meanE} from './lib';

const W = 540;
const H = 150;
const px = lin(-0.5, 3.5, 30, W - 20);
const ORDERS = [
  {name: '원본 순서 7, 7, 1, 7', ts: [3, 3, 1, 3]},
  {name: '1을 먼저 1, 7, 7, 7', ts: [1, 3, 3, 3]},
  {name: '1을 마지막에 7, 7, 7, 1', ts: [3, 3, 3, 1]},
];
const EPS = 0.1;
const ALL = [3, 3, 1, 3];

export default function EpochStepper() {
  const [oi, setOi] = useState(0);
  const [k, setK] = useState(0);

  const ts = ORDERS[oi].ts;
  const ws = [0];
  const gs = [];
  for (let i = 0; i < 4; i++) {
    const g = 2 * (ws[i] - ts[i]);
    gs.push(g);
    ws.push(ws[i] - EPS * g);
  }
  const batchW = 0 - EPS * (ALL.reduce((a, t) => a + 2 * (0 - t), 0) / 4);
  const w = ws[k];
  const label = (t) => (t === 1 ? '1' : '7');

  return (
    <Viz
      title="장마다 고치기: 한 에폭 네 번 갱신"
      caption="학습 쌍 네 개의 정답이 3, 3, 1, 3입니다(그림 7, 7, 1, 7). 오차는 (w − 정답)²이고 학습률은 0.1, 시작은 w = 0입니다. 갱신 버튼을 눌러 한 장씩 보세요. 설명용 값입니다."
    >
      <Controls>
        {ORDERS.map((o, i) => (
          <Btn
            key={o.name}
            on={oi === i}
            onClick={() => {
              setOi(i);
              setK(0);
            }}
          >
            {o.name}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Btn onClick={() => setK(Math.min(4, k + 1))}>다음 장으로 갱신</Btn>
        <Btn onClick={() => setK(4)}>한 에폭 끝까지</Btn>
        <Btn onClick={() => setK(0)}>처음으로</Btn>
      </Controls>
      <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', margin: '4px 0 8px'}}>
        {ts.map((t, i) => (
          <div
            key={i}
            style={{
              flex: '1 1 90px',
              padding: '6px 10px',
              borderRadius: 8,
              border: `2px solid ${i === k - 1 ? 'var(--vb)' : 'var(--ifm-color-emphasis-300)'}`,
              opacity: i < k ? 1 : 0.55,
              fontSize: '0.85rem',
            }}
          >
            <b>{i + 1}번째 장</b>: 그림 {label(t)}
            <br />
            정답 {t}
            {i < k ? (
              <span>
                <br />
                기울기 {tr(gs[i])}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="수직선 위에서 w가 장마다 움직이는 모습">
        <line x1={30} y1={80} x2={W - 20} y2={80} stroke="var(--ifm-color-emphasis-400)" />
        {[0, 0.5, 1, 1.5, 2, 2.5, 3].map((v) => (
          <g key={v}>
            <line x1={px(v)} y1={76} x2={px(v)} y2={84} stroke="var(--ifm-color-emphasis-500)" />
            <text x={px(v)} y={98} textAnchor="middle" className={s.ts}>{v}</text>
          </g>
        ))}
        <line x1={px(2.5)} y1={30} x2={px(2.5)} y2={80} stroke="var(--vok)" strokeDasharray="4 3" />
        <text x={px(2.5)} y={24} textAnchor="middle" className={s.ts} style={{fill: 'var(--vok)'}}>평균 오차의 최솟값 2.5</text>
        <text x={px(3)} y={118} textAnchor="middle" className={s.ts}>정답 3 (그림 7)</text>
        <text x={px(1)} y={118} textAnchor="middle" className={s.ts}>정답 1 (그림 1)</text>
        <circle cx={px(batchW)} cy={80} r={7} fill="none" stroke="var(--va)" strokeWidth="2" strokeDasharray="3 2" />
        <text x={px(batchW)} y={62} textAnchor="middle" className={s.ts} style={{fill: 'var(--va)'}}>배치 한 번: {tr(batchW)}</text>
        {ws.slice(0, k + 1).map((v, i) => (
          <g key={i}>
            <circle cx={px(v)} cy={80} r={i === k ? 6 : 4} fill="var(--vb)" fillOpacity={i === k ? 1 : 0.6} />
            <text x={px(v)} y={i % 2 ? 48 : 40} textAnchor="middle" className={s.ts} style={{fill: 'var(--vb)'}}>{i}</text>
          </g>
        ))}
      </svg>
      <Stats>
        <Stat label="현재 w" value={tr(w)} />
        <Stat label="평균 오차" value={fmt(meanE(w, ALL), 3)} />
        <Stat label="지금까지 갱신" value={`${k}번`} />
        <Stat label="배치의 갱신" value="1번 (w = 0.5)" />
      </Stats>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>갱신</th>
            <th>본 표본</th>
            <th>정답</th>
            <th>기울기</th>
            <th>갱신 뒤 w</th>
            <th>평균 오차</th>
          </tr>
        </thead>
        <tbody>
          {ws.slice(1, k + 1).map((v, i) => (
            <tr key={i} className={i === k - 1 ? s.cellOn : undefined}>
              <td>{i + 1}</td>
              <td>{label(ts[i])}</td>
              <td>{ts[i]}</td>
              <td>{tr(gs[i])}</td>
              <td>{tr(v)}</td>
              <td>{fmt(meanE(v, ALL), 3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Note>
        {k === 0
          ? '갱신 전 w = 0의 평균 오차는 7입니다. 버튼을 눌러 한 장씩 고쳐 보세요.'
          : k === 4
          ? `한 에폭이 끝났습니다. SGD는 ${tr(ws[4])}, 배치는 ${tr(batchW)}입니다. 기울기는 둘 다 네 번 계산했고, 달라진 것은 갱신을 네 번에 나눠 썼다는 점입니다.`
          : meanE(ws[k], ALL) > meanE(ws[k - 1], ALL)
          ? `방금 갱신에서 평균 오차가 ${fmt(meanE(ws[k - 1], ALL), 3)}에서 ${fmt(meanE(ws[k], ALL), 3)}로 올랐습니다. 정답이 ${ts[k - 1]}인 장은 w를 ${gs[k - 1] > 0 ? '왼쪽' : '오른쪽'}으로 밀었고, 그 한 장의 오차는 줄어도 전체 평균은 늘 수 있습니다.`
          : `${k}번째 장의 기울기 ${tr(gs[k - 1])}로 w가 ${tr(ws[k - 1])}에서 ${tr(ws[k])}이 되었습니다. 장마다 기울기가 달라 걸음 크기와 방향이 흔들립니다.`}
      </Note>
    </Viz>
  );
}
