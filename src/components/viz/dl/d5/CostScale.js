import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, fmt, styles as s} from '../../Viz';

const PATCHES = [8, 14, 16, 32];
const WIDTHS = [
  {c: 768, name: 'Base (768)'},
  {c: 1024, name: 'Large (1024)'},
  {c: 1280, name: 'Huge (1280)'},
];
const M2 = 49; // 창 7×7 = 49 토큰
const comma = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function CostScale() {
  const [P, setP] = useState(16);
  const [k, setK] = useState(14);
  const [C, setC] = useState(768);

  const N = k * k;
  const lin = 4 * N * C * C; // 질문, 열쇠, 값, 출력 투영
  const quad = 2 * N * N * C; // QK^T 와 소프트맥스 비율 × V
  const m = Math.min(M2, N);
  const win = 2 * m * N * C; // 7×7 창 안에서만 어텐션
  const mx = Math.max(lin, quad, win);
  const share = (quad / (lin + quad)) * 100;
  const preset = (p, kk) => {
    setP(p);
    setK(kk);
  };

  return (
    <Viz
      title="해상도를 키우면 어텐션 계산이 얼마나 늘어나나"
      caption="N은 토큰 수, C는 토큰 하나의 길이(은닉 길이)입니다. Swin 논문의 식으로 센, 어텐션 한 층의 곱셈과 덧셈 횟수(MSA만, MLP와 소프트맥스는 제외, 분류 토큰은 무시)입니다. 선형 항 4NC²는 질문, 열쇠, 값, 출력의 투영이고, 이차 항 2N²C는 점수 표와 값 섞기입니다. 창 어텐션은 창 7×7 안에서만 계산하는 경우의 2·49·N·C입니다. 한 층, 이미지 한 장 기준의 근사이고 실제 실행 시간이 아닙니다."
    >
      <Controls>
        <span>패치 한 변</span>
        {PATCHES.map((v) => (
          <Btn key={v} on={P === v} onClick={() => setP(v)}>
            {v}
          </Btn>
        ))}
        <span>은닉 길이 C</span>
        {WIDTHS.map((w) => (
          <Btn key={w.c} on={C === w.c} onClick={() => setC(w.c)}>
            {w.name}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="한 변의 패치 수 k" min={2} max={64} step={1} value={k} onChange={setK} />
        <Btn onClick={() => setK(Math.min(64, k * 2))}>해상도 2배 (k × 2)</Btn>
        <Btn onClick={() => preset(16, 14)}>224, 패치 16</Btn>
        <Btn onClick={() => preset(16, 32)}>512, 패치 16</Btn>
        <Btn onClick={() => preset(14, 37)}>518, 패치 14</Btn>
      </Controls>
      <Stats>
        <Stat label="이미지 한 변 (k × 패치)" value={`${k * P}`} />
        <Stat label="토큰 수 N = k²" value={comma(N)} />
        <Stat label="점수 표 칸 수 N²" value={comma(N * N)} />
        <Stat label="224, 패치 16 대비 토큰" value={`${fmt(N / 196, 2)}배`} />
        <Stat label="224, 패치 16 대비 표 칸" value={`${fmt((N * N) / (196 * 196), 1)}배`} tone={N * N > 4 * 196 * 196 ? 'bad' : undefined} />
      </Stats>
      <div style={{marginTop: 10}}>
        <Bar label="선형 항 4NC²" value={lin} max={mx} color="var(--va)" text={`${fmt(lin / 1e9, 3)} G`} />
        <Bar label="이차 항 2N²C" value={quad} max={mx} color="var(--vb)" text={`${fmt(quad / 1e9, 3)} G`} />
        <Bar label="창 어텐션 2·49·N·C" value={win} max={mx} color="var(--vok)" text={`${fmt(win / 1e9, 3)} G`} />
      </div>
      <Note>
        이차 항의 비중은 어텐션 층 전체(선형 항 + 이차 항)의 {fmt(share, 1)}%입니다. 이차 항이 선형 항과 같아지는 토큰 수는 N = 2C = {comma(2 * C)}이고, 한 변으로는 약 {fmt(Math.sqrt(2 * C), 1)}패치입니다. 토큰이 이보다 적으면 투영이 더 크고, 많으면 점수 표가 더 큽니다.
        {N < M2 ? ' 토큰이 49개보다 적으면 창이 이미지 전체보다 커서 창 어텐션은 전역 어텐션과 같습니다.' : ''}
      </Note>
    </Viz>
  );
}
