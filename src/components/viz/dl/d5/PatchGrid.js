import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const PATCHES = [8, 14, 16, 32];
const SIZES = [224, 448];
const BASE = 197 * 197; // 224 x 224, 패치 16: 분류 토큰 포함 197개
const comma = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// 그림 대신 쓰는 설명용 장면 (300 x 300)
function Scene() {
  return (
    <g>
      <rect x="0" y="0" width="300" height="300" fill="var(--va)" fillOpacity="0.22" />
      <circle cx="225" cy="70" r="34" fill="var(--vb)" fillOpacity="0.9" />
      <path d="M0 300 L0 225 Q90 165 180 220 T300 205 L300 300 Z" fill="var(--vok)" fillOpacity="0.6" />
      <rect x="70" y="180" width="76" height="64" fill="var(--vc)" fillOpacity="0.7" />
      <polygon points="58,180 108,138 158,180" fill="var(--vbad)" fillOpacity="0.65" />
    </g>
  );
}

export default function PatchGrid() {
  const [size, setSize] = useState(224);
  const [P, setP] = useState(16);
  const [pick, setPick] = useState(0);

  const k = size / P;
  const N = k * k;
  const n = N + 1;
  const sel = Math.min(pick, N - 1);
  const row = Math.floor(sel / k);
  const col = sel % k;
  const cell = 300 / k;

  const onPick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const c = Math.min(k - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * k)));
    const rr = Math.min(k - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * k)));
    setPick(rr * k + c);
  };

  const side = 270;
  const mc = side / n; // 어텐션 표 한 칸의 크기
  const band = Math.max(mc, 3);
  const lines = [];
  for (let i = 0; i <= k; i += 1) {
    lines.push(<line key={`h${i}`} x1="0" y1={i * cell} x2="300" y2={i * cell} />);
    lines.push(<line key={`v${i}`} x1={i * cell} y1="0" x2={i * cell} y2="300" />);
  }

  return (
    <Viz
      title="이미지를 패치 격자로 자르면 토큰이 몇 개인가"
      caption="왼쪽은 이미지를 패치 격자로 자른 모습이고, 오른쪽은 그 토큰들의 어텐션 표(헤드 하나, 층 하나)입니다. 장면은 설명용 그림입니다. 패치를 누르면 그 토큰의 행과 열이 표에 표시됩니다. 분류 토큰 1개는 맨 앞에 붙은 것으로 셉니다."
    >
      <Controls>
        <span>이미지</span>
        {SIZES.map((v) => (
          <Btn key={v} on={size === v} onClick={() => setSize(v)}>
            {v}×{v}
          </Btn>
        ))}
        <span>패치 한 변</span>
        {PATCHES.map((v) => (
          <Btn key={v} on={P === v} onClick={() => setP(v)}>
            {v}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="선택한 패치 번호" min={0} max={N - 1} step={1} value={sel} onChange={setPick} />
      </Controls>
      <div className={s.two}>
        <svg
          viewBox="0 0 300 300"
          className={s.svg}
          role="img"
          aria-label={`${size}×${size} 이미지를 ${P}×${P} 패치로 잘라 가로 ${k}개, 세로 ${k}개, 모두 ${N}개의 패치를 만든 그림`}
        >
          <Scene />
          <g stroke="var(--ifm-font-color-base)" strokeOpacity={k > 32 ? 0.35 : 0.6} strokeWidth={k > 32 ? 0.4 : 0.8}>
            {lines}
          </g>
          <rect x={col * cell} y={row * cell} width={cell} height={cell} fill="var(--vb)" fillOpacity="0.55" stroke="var(--vb)" strokeWidth="2" />
          <rect x="0" y="0" width="300" height="300" fill="transparent" style={{cursor: 'pointer'}} onClick={onPick} />
        </svg>
        <svg
          viewBox="0 0 300 300"
          className={s.svg}
          role="img"
          aria-label={`토큰 ${n}개의 어텐션 표 ${n}×${n}칸, 모두 ${comma(n * n)}칸`}
        >
          <defs>
            <pattern id="vit-pg-grid" width={mc} height={mc} patternUnits="userSpaceOnUse" x="15" y="15">
              <rect width={mc} height={mc} fill="none" stroke="var(--ifm-color-emphasis-400)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect x="15" y="15" width={side} height={side} fill="var(--va)" fillOpacity="0.12" />
          {mc >= 2.5 ? <rect x="15" y="15" width={side} height={side} fill="url(#vit-pg-grid)" /> : null}
          <rect x="15" y="15" width={side} height={band} fill="var(--vc)" fillOpacity="0.45" />
          <rect x="15" y="15" width={band} height={side} fill="var(--vc)" fillOpacity="0.45" />
          <rect x="15" y={15 + (sel + 1) * mc - (band - mc) / 2} width={side} height={band} fill="var(--vb)" fillOpacity="0.6" />
          <rect x={15 + (sel + 1) * mc - (band - mc) / 2} y="15" width={band} height={side} fill="var(--vb)" fillOpacity="0.6" />
          <rect x="15" y="15" width={side} height={side} fill="none" stroke="var(--ifm-font-color-base)" strokeWidth="1.2" />
          <text x="150" y="294" textAnchor="middle" className={s.ts}>
            {n} × {n} = {comma(n * n)}칸
          </text>
        </svg>
      </div>
      <Stats>
        <Stat label="한 변의 패치 수" value={k} />
        <Stat label="패치 토큰 수" value={comma(N)} />
        <Stat label="분류 토큰 포함 길이 n" value={comma(n)} />
        <Stat label="패치 하나의 길이 (P×P×3)" value={comma(P * P * 3)} />
        <Stat label="어텐션 칸 수 n²" value={comma(n * n)} tone={n * n > 1000000 ? 'bad' : undefined} />
        <Stat label="224, 패치 16 대비" value={`${fmt(n * n / BASE, 1)}배`} />
      </Stats>
      <Note>
        선택한 패치는 {row + 1}행 {col + 1}열이고, 시퀀스에서는 {sel + 1}번 자리입니다(0번 자리는 분류 토큰). 오른쪽 표에서 주황 띠가 이 토큰의 행과 열이고, 보라 띠가 분류 토큰입니다. 패치를 절반 크기로 줄이면 토큰은 4배, 표의 칸은 약 16배가 됩니다.
      </Note>
    </Viz>
  );
}
