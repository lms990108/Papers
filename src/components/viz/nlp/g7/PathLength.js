import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const N = 21;
const T = 10; // 도착 위치
const CW = 22;
const X0 = 168;
const RH = 15;
const KS = [3, 5, 7];

// 연속 커널 합성곱: 층마다 양쪽으로 (k-1)/2 칸씩 넓어진다
const layersContig = (dist, k) => Math.ceil(dist / ((k - 1) / 2));
// 팽창 합성곱(팽창 1, k, k^2, ...): L 층 뒤의 한쪽 범위는 (k^L - 1) / 2
const reachDil = (L, k) => (k ** L - 1) / 2;
const layersDil = (dist, k) => {
  let L = 1;
  while (reachDil(L, k) < dist) L += 1;
  return L;
};

function Strip({y, lo, hi, src, color, label, sub}) {
  const cells = [];
  for (let p = 0; p < N; p += 1) {
    const on = p >= lo && p <= hi;
    cells.push(
      <rect
        key={p}
        x={X0 + p * CW}
        y={y}
        width={CW - 2}
        height={RH - 3}
        rx="2"
        fill={on ? color : 'none'}
        fillOpacity={on ? 0.35 : 0}
        stroke="var(--ifm-color-emphasis-300)"
        strokeWidth="1"
      />,
    );
  }
  return (
    <g>
      {label ? (
        <text x={4} y={y + RH - 5} className={s.ts}>
          {label}
        </text>
      ) : null}
      {sub ? (
        <text x={X0 - 8} y={y + RH - 5} className={s.ts} textAnchor="end">
          {sub}
        </text>
      ) : null}
      {cells}
      <rect x={X0 + src * CW - 1} y={y - 1} width={CW} height={RH - 1} rx="3" fill="none" stroke="var(--vbad)" strokeWidth="2" />
    </g>
  );
}

export default function PathLength() {
  const [dist, setDist] = useState(8);
  const [k, setK] = useState(3);
  const src = T - dist;
  const r = (k - 1) / 2;
  const Lc = layersContig(dist, k);
  const Ld = layersDil(dist, k);

  const rows = [];
  let y = 22;
  // 순환 신경망: 한 칸씩 이어진 화살표
  rows.push(<Strip key="rnn" y={y} lo={src} hi={T} src={src} color="var(--vb)" label="순환 신경망" sub={`${dist}단계`} />);
  y += RH + 14;
  // 연속 합성곱
  const contig = [];
  for (let l = 1; l <= Lc; l += 1) {
    const reach = l * r;
    contig.push(
      <Strip key={`c${l}`} y={y} lo={Math.max(0, T - reach)} hi={Math.min(N - 1, T + reach)} src={src} color="var(--vc)" label={l === 1 ? `합성곱 (k = ${k})` : ''} sub={`${l}층`} />,
    );
    y += RH;
  }
  rows.push(<g key="contig">{contig}</g>);
  y += 14;
  // 팽창 합성곱
  const dil = [];
  for (let l = 1; l <= Ld; l += 1) {
    const reach = reachDil(l, k);
    dil.push(
      <Strip key={`d${l}`} y={y} lo={Math.max(0, T - reach)} hi={Math.min(N - 1, T + reach)} src={src} color="var(--vok)" label={l === 1 ? '팽창 합성곱' : ''} sub={`${l}층`} />,
    );
    y += RH;
  }
  rows.push(<g key="dil">{dil}</g>);
  y += 14;
  rows.push(<Strip key="att" y={y} lo={0} hi={N - 1} src={src} color="var(--va)" label="셀프 어텐션" sub="1층" />);
  y += RH + 8;
  const H = y + 6;

  return (
    <Viz
      title="멀리 있는 토큰에 닿기까지 거치는 단계"
      caption={`${N}개 토큰 가운데 칸(위치 ${T})이 도착 위치이고, 빨간 테두리가 출발 위치입니다. 합성곱과 셀프 어텐션 줄의 색칠한 칸은 그 층까지 쌓았을 때 도착 위치의 값에 영향을 줄 수 있는 칸입니다. 순환 신경망 줄의 색칠한 칸은 정보가 지나가는 칸이고, 앞에서 뒤로만 읽는 한 방향으로 가정했습니다. 합성곱은 커널 폭이 홀수 k라 층마다 양쪽으로 (k-1)/2칸씩 넓어지고, 팽창 합성곱은 층마다 팽창을 1, k, k², ...로 키웠습니다. 칸 수와 거리는 설명용 값입니다.`}
    >
      <Controls>
        <Slider label="두 토큰 사이의 거리" min={1} max={T} step={1} value={dist} onChange={setDist} />
        {KS.map((v) => (
          <Btn key={v} on={k === v} onClick={() => setK(v)}>
            커널 폭 k = {v}
          </Btn>
        ))}
      </Controls>
      <svg viewBox={`0 0 ${X0 + N * CW + 8} ${H}`} className={s.svg} role="img" aria-label={`거리 ${dist}인 두 토큰을 잇는 데 순환 신경망은 ${dist}단계, 커널 폭 ${k}인 합성곱은 ${Lc}층, 팽창 합성곱은 ${Ld}층, 셀프 어텐션은 1층이 필요하다는 그림`}>
        <text x={X0} y={12} className={s.ts}>
          위치 0
        </text>
        <text x={X0 + N * CW - 2} y={12} className={s.ts} textAnchor="end">
          위치 {N - 1}
        </text>
        {rows}
      </svg>
      <Stats>
        <Stat label="순환 신경망의 경로 길이" value={`${dist}단계`} tone={dist > 1 ? 'bad' : undefined} />
        <Stat label={`합성곱 (k = ${k}) 필요한 층`} value={`${Lc}층`} tone={Lc > 1 ? 'bad' : undefined} />
        <Stat label="팽창 합성곱 필요한 층" value={`${Ld}층`} />
        <Stat label="셀프 어텐션" value="1층" tone="good" />
      </Stats>
      <Note>
        경로 길이는 한 토큰의 정보가 다른 토큰의 출력에 닿기까지 거치는 계산 단계의 수입니다. 순환 신경망은 거리에 비례하고, 연속 커널의 합성곱은 거리를 (k-1)/2로 나눈 만큼의 층이 필요합니다. 셀프 어텐션은 한 층의 행렬 한 칸이 두 토큰을 바로 잇습니다.
      </Note>
    </Viz>
  );
}
