import React, {useRef, useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const N = 28;
const blank = () => new Array(N * N).fill(0);

function stamp(g, cx, cy, r, v) {
  const ri = Math.ceil(r);
  for (let y = cy - ri; y <= cy + ri; y += 1) {
    for (let x = cx - ri; x <= cx + ri; x += 1) {
      if (x >= 0 && x < N && y >= 0 && y < N && (x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.5) g[y * N + x] = v;
    }
  }
}
function line(g, a, b) {
  const n = 30;
  for (let i = 0; i <= n; i += 1) stamp(g, Math.round(a[0] + ((b[0] - a[0]) * i) / n), Math.round(a[1] + ((b[1] - a[1]) * i) / n), 0.5, 255);
}
// 설명용 그림: 일부러 한쪽 구석에 작게 둔다.
const PRESETS = {
  1: (g) => { line(g, [6, 2], [6, 12]); line(g, [4, 4], [6, 2]); },
  7: (g) => { line(g, [3, 3], [11, 3]); line(g, [11, 3], [5, 14]); },
  0: (g) => { const pts = [[4, 3], [8, 3], [10, 6], [10, 10], [8, 13], [4, 13], [2, 10], [2, 6], [4, 3]]; for (let i = 0; i < pts.length - 1; i += 1) line(g, pts[i], pts[i + 1]); },
};

export function stats(g, n) {
  let m = 0;
  let sx = 0;
  let sy = 0;
  let cnt = 0;
  let x0 = n;
  let x1 = -1;
  let y0 = n;
  let y1 = -1;
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      const v = g[y * n + x];
      if (v > 0) {
        cnt += 1;
        m += v;
        sx += v * (x + 0.5);
        sy += v * (y + 0.5);
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
    }
  }
  return m > 0 ? {cnt, cx: sx / m, cy: sy / m, w: x1 - x0 + 1, h: y1 - y0 + 1, x0, y0} : null;
}

const sample = (g, x, y) => {
  const fx = Math.max(0, Math.min(N - 1, x - 0.5));
  const fy = Math.max(0, Math.min(N - 1, y - 0.5));
  const ix = Math.floor(fx);
  const iy = Math.floor(fy);
  const ax = fx - ix;
  const ay = fy - iy;
  const at = (xx, yy) => g[Math.min(N - 1, yy) * N + Math.min(N - 1, xx)];
  return at(ix, iy) * (1 - ax) * (1 - ay) + at(ix + 1, iy) * ax * (1 - ay) + at(ix, iy + 1) * (1 - ax) * ay + at(ix + 1, iy + 1) * ax * ay;
};

// 1단계: 종횡비를 유지한 채 20x20 상자에 맞춘다(보간 때문에 회색 단계가 생긴다). 상자는 28x28의 한가운데에 둔다.
export function fit(g) {
  const st = stats(g, N);
  if (!st) return null;
  const k = 20 / Math.max(st.w, st.h);
  const nw = Math.max(1, Math.round(st.w * k));
  const nh = Math.max(1, Math.round(st.h * k));
  const ox = Math.floor((N - nw) / 2);
  const oy = Math.floor((N - nh) / 2);
  const out = blank();
  for (let y = 0; y < nh; y += 1) {
    for (let x = 0; x < nw; x += 1) {
      let acc = 0;
      for (let a = 0; a < 3; a += 1) {
        for (let b = 0; b < 3; b += 1) {
          acc += sample(g, st.x0 + ((x + (a + 0.5) / 3) / nw) * st.w, st.y0 + ((y + (b + 0.5) / 3) / nh) * st.h);
        }
      }
      out[(oy + y) * N + ox + x] = Math.round(acc / 9);
    }
  }
  return out;
}

// 2단계: 질량 중심이 28x28의 한가운데(14, 14)에 오도록 옮긴다. 밖으로 나가지 않는 데까지만 옮긴다.
export function center(g) {
  const st = stats(g, N);
  if (!st) return null;
  let dx = Math.round(N / 2 - st.cx);
  let dy = Math.round(N / 2 - st.cy);
  dx = Math.max(-st.x0, Math.min(N - (st.x0 + st.w), dx));
  dy = Math.max(-st.y0, Math.min(N - (st.y0 + st.h), dy));
  const out = blank();
  for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) if (g[y * N + x] > 0) out[(y + dy) * N + x + dx] = g[y * N + x];
  return out;
}

export function pad(g) {
  const M = N + 4;
  const out = new Array(M * M).fill(0);
  for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) out[(y + 2) * M + x + 2] = g[y * N + x];
  return out;
}

const STAGES = ['그린 그림', '1. 20×20 상자에 맞춤', '2. 질량 중심을 가운데로', '3. 32×32로 여백 추가'];

export default function PixelPaint() {
  const [g, setG] = useState(() => { const x = blank(); PRESETS[7](x); return x; });
  const [stage, setStage] = useState(0);
  const [erase, setErase] = useState(false);
  const [brush, setBrush] = useState(1);
  const [row, setRow] = useState(5);
  const [last, setLast] = useState(null);
  const down = useRef(false);
  const svgRef = useRef(null);

  const s1 = fit(g);
  const s2 = s1 ? center(s1) : null;
  const s3 = s2 ? pad(s2) : null;
  const imgs = [g, s1, s2, s3];
  const cur = imgs[stage] || g;
  const n = stage === 3 ? N + 4 : N;
  const st = stats(cur, n);

  const paintAt = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * N);
    const y = Math.floor(((e.clientY - r.top) / r.height) * N);
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    const ng = g.slice();
    stamp(ng, x, y, brush === 1 ? 0.5 : 1.5, erase ? 0 : 255);
    setG(ng);
    setLast([y, x]);
  };
  const rowIdx = Math.min(row, n - 1);
  const rowVals = Array.from({length: n}, (_, x) => cur[rowIdx * n + x]);

  return (
    <Viz
      title="그림을 칠하면 입력 벡터가 만들어지는 과정"
      caption="칸마다 0(배경)에서 255(진한 잉크)까지 8비트 회색 단계 하나입니다. 칠한 뒤 단계 버튼을 눌러 20×20 상자에 맞추고, 질량 중심(빨간 점)을 가운데로 옮기고, 32×32로 늘려 보세요. 설명용 그림이며 실제 MNIST 처리와 같은 순서입니다."
    >
      <Controls>
        {STAGES.map((nm, i) => (
          <Btn key={nm} on={stage === i} onClick={() => setStage(i)}>{nm}</Btn>
        ))}
      </Controls>
      <Controls>
        <Btn on={!erase} onClick={() => setErase(false)}>칠하기</Btn>
        <Btn on={erase} onClick={() => setErase(true)}>지우개</Btn>
        <Btn on={brush === 1} onClick={() => setBrush(1)}>가는 붓</Btn>
        <Btn on={brush === 2} onClick={() => setBrush(2)}>굵은 붓</Btn>
        {Object.keys(PRESETS).map((k) => (
          <Btn key={k} on={false} onClick={() => { const x = blank(); PRESETS[k](x); setG(x); setStage(0); }}>예: {k}</Btn>
        ))}
        <Btn on={false} onClick={() => { setG(blank()); setStage(0); setLast(null); }}>모두 지우기</Btn>
      </Controls>
      <div className={s.two}>
        <div>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${n} ${n}`}
            className={s.canvas}
            style={{cursor: stage === 0 ? 'crosshair' : 'default'}}
            role="img"
            aria-label={`${n}×${n} 칸의 회색 그림. 0단계에서는 끌어서 칠할 수 있습니다.`}
            onPointerDown={(e) => { if (stage !== 0) { setStage(0); return; } down.current = true; if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId); paintAt(e); }}
            onPointerMove={(e) => { if (down.current && stage === 0) paintAt(e); }}
            onPointerUp={() => { down.current = false; }}
            onPointerCancel={() => { down.current = false; }}
          >
            <rect x="0" y="0" width={n} height={n} fill="var(--ifm-background-color)" />
            {Array.from({length: n * n}, (_, i) => (cur[i] > 0 ? <rect key={i} x={i % n} y={Math.floor(i / n)} width="1" height="1" fill="var(--ifm-font-color-base)" fillOpacity={cur[i] / 255} /> : null))}
            <path d={Array.from({length: n + 1}, (_, i) => `M${i},0V${n}M0,${i}H${n}`).join('')} stroke="var(--ifm-color-emphasis-300)" strokeWidth="0.04" fill="none" />
            {stage >= 1 ? <rect x={(n - 20) / 2} y={(n - 20) / 2} width="20" height="20" fill="none" stroke="var(--va)" strokeWidth="0.15" strokeDasharray="0.6 0.4" /> : null}
            {stage >= 2 ? <path d={`M${n / 2},0V${n}M0,${n / 2}H${n}`} stroke="var(--vok)" strokeWidth="0.08" strokeDasharray="0.5 0.5" /> : null}
            {st ? <circle cx={st.cx} cy={st.cy} r="0.55" fill="var(--vbad)" stroke="var(--ifm-background-color)" strokeWidth="0.12" /> : null}
            {rowIdx >= 0 ? <rect x="0" y={rowIdx} width={n} height="1" fill="none" stroke="var(--vb)" strokeWidth="0.12" /> : null}
          </svg>
          <p className={s.note}>
            파랑 점선은 20×20 상자, 초록 점선은 한가운데, 빨간 점은 질량 중심입니다. 주황 테두리 줄은 아래에서 펼쳐 볼 행입니다.
          </p>
        </div>
        <div>
          <Stats>
            <Stat label="한 장의 칸 수" value={`${n}×${n} = ${n * n}`} />
            <Stat label="칠한 칸" value={st ? String(st.cnt) : '0'} />
            <Stat label="질량 중심 (가로, 세로)" value={st ? `${fmt(st.cx, 1)}, ${fmt(st.cy, 1)}` : '-'} tone={st && Math.abs(st.cx - n / 2) < 0.75 && Math.abs(st.cy - n / 2) < 0.75 ? 'good' : undefined} />
            <Stat label="글자 크기" value={st ? `${st.w}×${st.h}` : '-'} />
          </Stats>
          <Slider label="펼쳐 볼 행" min={0} max={n - 1} step={1} value={rowIdx} onChange={setRow} />
          <p className={s.note} style={{wordBreak: 'break-all', fontVariantNumeric: 'tabular-nums'}}>
            행 {rowIdx}은 벡터의 {rowIdx * n}번째부터 {rowIdx * n + n - 1}번째 칸입니다.<br />
            [{rowVals.join(', ')}]
          </p>
          <p className={s.note}>
            {last && stage === 0 ? `마지막으로 칠한 칸은 행 ${last[0]}, 열 ${last[1]}이고 벡터의 ${last[0] * N + last[1]}번째 칸입니다(0번째부터 셈).` : '그림 위를 끌어 칠하면 칸의 번호가 벡터의 어느 자리인지 보입니다.'}
          </p>
        </div>
      </div>
      <Note>
        {stage === 0 && !st ? '아무것도 칠하지 않았습니다. 그림을 칠하거나 예 버튼을 눌러 보세요.' : null}
        {stage >= 1 && !s1 ? '칠한 칸이 없어서 상자에 맞출 수 없습니다. 0단계에서 먼저 칠해 주세요.' : null}
        {stage === 3 ? '32×32는 28×28 둘레에 여백 2칸씩을 더한 것입니다. LeNet-5의 입력이 이 크기입니다.' : null}
        {stage === 2 ? '질량 중심이 가운데에 오도록 옮겼습니다. 글자가 구석에 붙어 있으면 위치 차이만으로 다른 입력이 되기 때문입니다.' : null}
        {stage === 1 ? '긴 쪽이 20칸이 되도록 크기를 맞췄습니다. 보간 때문에 가장자리에 회색 단계가 생깁니다.' : null}
        {' 학습 60,000장을 28×28로 저장하면 60,000 × 784 = 47,040,000바이트, 20×20이면 60,000 × 400 = 24,000,000바이트입니다.'}
      </Note>
    </Viz>
  );
}
