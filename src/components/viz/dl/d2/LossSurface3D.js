import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {E2, path2, tr} from './lib';

// 두 파라미터의 오차 곡면 E(w1, w2) = (w1 - 3)^2 + 10 (w2 - 1)^2 위를 경사하강법으로 내려가는 모습.
// 곡면은 직접 투영해 SVG 다각형으로 그린다(라이브러리 없음). 먼 칸부터 그려서 가려지는 순서를 맞춘다.

const D1 = [-1, 7];
const D2 = [-1, 3];
const EMAX = E2(D1[0], D2[0]); // 모서리의 오차 (56)
const NG = 22;
const ZH = 1.1;
const LEVELS = [2, 6, 12, 20, 32, 46];
const TILT = {yaw: 32, pitch: 38};
const TOP = {yaw: 0, pitch: 90};
const FLOOR = -0.08;
const W = 560;
const H = 360;
const CX = 280;
const MAXSTEP = 12;
const STEP_MS = 1000;
const LRS = [
  {e: 0.02, t: '느림'},
  {e: 0.05, t: 'w₂를 한 번에'},
  {e: 0.09, t: '지그재그'},
  {e: 0.11, t: '발산'},
];
const NOTES = {
  0.02: 'w₂ 방향은 한 걸음에 0.6배씩 빠르게, w₁ 방향은 0.96배씩 느리게 줄어듭니다. 그래서 계곡 바닥에 먼저 내려앉은 뒤 계곡을 따라 천천히 걸어갑니다.',
  0.05: 'w₂ 방향의 곱이 0이라 한 걸음에 계곡 바닥(w₂ = 1)에 닿습니다. 그다음에는 w₁만 0.9배씩 줄어듭니다.',
  0.09: 'w₂ 방향의 곱이 -0.8이라 계곡 양쪽 벽을 번갈아 오가며 조금씩 줄어듭니다. w₁ 방향은 0.82배씩 줄어서 전체로는 지그재그로 나아갑니다.',
  0.11: 'w₂ 방향의 곱이 -1.2라 벽을 오갈 때마다 커집니다. w₁ 방향은 0.78배씩 줄고 있는데도, 가파른 쪽이 먼저 곡면 밖으로 튕겨 나갑니다.',
};

const inDomain = (p) => p[0] >= D1[0] && p[0] <= D1[1] && p[1] >= D2[0] && p[1] <= D2[1];
// 두 축을 같은 비율(4칸 = 1)로 줄여서 등고선과 기울기가 직각으로 보이게 한다
const world = (w1, w2, z) => ({x: (w1 - 3) / 4, y: (w2 - 1) / 4, z});
const heightOf = (w1, w2) => (E2(w1, w2) / EMAX) * ZH;

function project(p, yaw, pitch) {
  const th = (yaw * Math.PI) / 180;
  const ph = (pitch * Math.PI) / 180;
  const xr = p.x * Math.cos(th) - p.y * Math.sin(th);
  const yr = p.x * Math.sin(th) + p.y * Math.cos(th);
  const u = xr;
  const v = p.z * Math.cos(ph) + yr * Math.sin(ph);
  const d = yr * Math.cos(ph) - p.z * Math.sin(ph);
  const k = Math.max(0, Math.min(1, (90 - pitch) / 52)); // 0: 위에서, 1: 비스듬히
  const sc = 240 - 90 * k;
  const cy = 180 + 72 * k;
  return {X: CX + sc * u, Y: cy - sc * v, d};
}

export default function LossSurface3D() {
  const [eps, setEps] = useState(0.09);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [yaw, setYaw] = useState(TILT.yaw);
  const [pitch, setPitch] = useState(TILT.pitch);
  const [grabbing, setGrabbing] = useState(false);
  const [showSlice, setShowSlice] = useState(true);
  const drag = useRef(null);

  useEffect(() => {
    let reduce = false;
    try {
      reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      reduce = false;
    }
    setPlaying(!reduce);
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setStep((v) => (v >= MAXSTEP ? 0 : v + 1)), STEP_MS);
    return () => clearInterval(id);
  }, [playing]);

  const path = useMemo(() => path2(eps, eps, MAXSTEP), [eps]);
  const shown = path.slice(0, step + 1);
  const inside = shown.filter(inDomain);
  const cur = path[step];
  const curIn = inDomain(cur);

  const quads = useMemo(() => {
    const w1 = (i) => D1[0] + ((D1[1] - D1[0]) * i) / NG;
    const w2 = (j) => D2[0] + ((D2[1] - D2[0]) * j) / NG;
    const vert = [];
    for (let i = 0; i <= NG; i++) {
      vert.push([]);
      for (let j = 0; j <= NG; j++) vert[i].push(project(world(w1(i), w2(j), heightOf(w1(i), w2(j))), yaw, pitch));
    }
    const out = [];
    for (let i = 0; i < NG; i++) {
      for (let j = 0; j < NG; j++) {
        const q = [vert[i][j], vert[i + 1][j], vert[i + 1][j + 1], vert[i][j + 1]];
        const e = E2((w1(i) + w1(i + 1)) / 2, (w2(j) + w2(j + 1)) / 2);
        out.push({q, d: (q[0].d + q[1].d + q[2].d + q[3].d) / 4, t: Math.min(1, e / EMAX)});
      }
    }
    return out.sort((a, b) => b.d - a.d);
  }, [yaw, pitch]);

  const contours = useMemo(() => {
    const segs = [];
    LEVELS.forEach((c) => {
      let run = [];
      for (let k = 0; k <= 120; k++) {
        const t = (k / 120) * 2 * Math.PI;
        const p = [3 + Math.sqrt(c) * Math.cos(t), 1 + Math.sqrt(c / 10) * Math.sin(t)];
        if (inDomain(p)) {
          run.push(project(world(p[0], p[1], (c / EMAX) * ZH + 0.01), yaw, pitch));
        } else if (run.length > 1) {
          segs.push(run);
          run = [];
        } else {
          run = [];
        }
      }
      if (run.length > 1) segs.push(run);
    });
    return segs;
  }, [yaw, pitch]);

  const sliceA = useMemo(() => Array.from({length: 41}, (_, i) => {
    const w1 = D1[0] + ((D1[1] - D1[0]) * i) / 40;
    return project(world(w1, 1, heightOf(w1, 1)), yaw, pitch);
  }), [yaw, pitch]);
  const sliceB = useMemo(() => Array.from({length: 41}, (_, i) => {
    const w2 = D2[0] + ((D2[1] - D2[0]) * i) / 40;
    return project(world(3, w2, heightOf(3, w2)), yaw, pitch);
  }), [yaw, pitch]);

  const P = (w1, w2, z) => project(world(w1, w2, z), yaw, pitch);
  const surf = (p) => P(p[0], p[1], heightOf(p[0], p[1]));
  const floorPt = (p) => P(p[0], p[1], FLOOR);

  const corners = [[D1[0], D2[0]], [D1[1], D2[0]], [D1[1], D2[1]], [D1[0], D2[1]]].map((c) => P(c[0], c[1], FLOOR));
  const axis1 = P(D1[1] + 0.5, D2[0], FLOOR);
  const axis2 = P(D1[0], D2[1] + 0.35, FLOOR);

  let arrow = null;
  if (curIn) {
    const g = [2 * (cur[0] - 3), 20 * (cur[1] - 1)];
    const len = Math.hypot(g[0], g[1]) || 1;
    const k = 0.4 / len;
    const a = floorPt(cur);
    const b = project({x: (cur[0] - 3) / 4 - g[0] * k, y: (cur[1] - 1) / 4 - g[1] * k, z: FLOOR}, yaw, pitch);
    const ang = Math.atan2(b.Y - a.Y, b.X - a.X);
    const hx = (r) => [b.X - 9 * Math.cos(ang - r), b.Y - 9 * Math.sin(ang - r)];
    const h1 = hx(0.45);
    const h2 = hx(-0.45);
    arrow = {a, b, head: `${b.X},${b.Y} ${h1[0]},${h1[1]} ${h2[0]},${h2[1]}`};
  }

  const onDown = (e) => {
    if (anim.current) cancelAnimationFrame(anim.current);
    drag.current = {x: e.clientX, y: e.clientY, yaw, pitch};
    setGrabbing(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      /* 지원하지 않는 환경 */
    }
  };
  const onMove = (e) => {
    if (!drag.current) return;
    setYaw(drag.current.yaw + (e.clientX - drag.current.x) * 0.5);
    setPitch(Math.max(15, Math.min(90, drag.current.pitch + (e.clientY - drag.current.y) * 0.4)));
  };
  const onUp = () => {
    drag.current = null;
    setGrabbing(false);
  };

  const anim = useRef(null);
  const tiltTo = (target) => {
    if (anim.current) cancelAnimationFrame(anim.current);
    const y0 = yaw;
    const p0 = pitch;
    const t0 = performance.now();
    const run = (now) => {
      const r = Math.min(1, (now - t0) / 700);
      const e = r * r * (3 - 2 * r);
      setYaw(y0 + (target.yaw - y0) * e);
      setPitch(p0 + (target.pitch - p0) * e);
      anim.current = r < 1 ? requestAnimationFrame(run) : null;
    };
    anim.current = requestAnimationFrame(run);
  };

  const choose = (e) => {
    setEps(e);
    setStep(0);
  };

  const g1 = 2 * (cur[0] - 3);
  const g2 = 20 * (cur[1] - 1);

  return (
    <Viz
      title="오차 곡선이 곡면이 되는 모습"
      caption="바닥 평면의 한 점이 파라미터 (w₁, w₂) 한 쌍이고, 높이가 오차입니다. 곡면을 w₂ = 1에서 자른 검은 실선은 앞에서 본 포물선 (w₁ − 3)²과 같고, w₁ = 3에서 자른 점선은 열 배 가파른 포물선입니다. 빨강 공이 지금 위치이고 초록 화살표는 내리막 방향(−기울기)입니다. 보라 선이 지나온 길입니다. 시작은 (0, 0)이고 두 파라미터가 같은 learning rate ε을 씁니다. 끌어서 돌릴 수 있고, 위에서 보기를 누르면 검은 등고선(오차가 같은 점을 이은 선)이 있는 지도가 됩니다."
    >
      <Controls>
        <span className={s.ts}>learning rate ε</span>
        {LRS.map((r) => (
          <Btn key={r.e} on={eps === r.e} onClick={() => choose(r.e)}>{r.e} ({r.t})</Btn>
        ))}
      </Controls>
      <Controls>
        <Btn on={playing} onClick={() => setPlaying(!playing)}>{playing ? '일시정지' : '재생'}</Btn>
        <Btn onClick={() => { setPlaying(false); setStep(Math.min(MAXSTEP, step + 1)); }}>다음 걸음</Btn>
        <Btn onClick={() => setStep(0)}>처음으로</Btn>
        <Btn on={pitch < 89} onClick={() => tiltTo(TILT)}>입체로 보기</Btn>
        <Btn on={pitch >= 89} onClick={() => tiltTo(TOP)}>위에서 보기 (등고선)</Btn>
        <Btn on={showSlice} onClick={() => setShowSlice(!showSlice)}>단면 곡선 {showSlice ? '끄기' : '켜기'}</Btn>
      </Controls>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={s.svg}
        role="img"
        aria-label="두 파라미터의 오차 곡면과 그 위를 경사하강법으로 내려가는 경로"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{touchAction: 'pan-y', cursor: grabbing ? 'grabbing' : 'grab', userSelect: 'none'}}
      >
        <polygon points={corners.map((c) => `${c.X},${c.Y}`).join(' ')} fill="var(--ifm-color-emphasis-200)" fillOpacity={0.5} stroke="var(--ifm-color-emphasis-500)" strokeWidth={1} />
        {quads.map((q, i) => (
          <polygon
            key={i}
            points={q.q.map((v) => `${v.X.toFixed(1)},${v.Y.toFixed(1)}`).join(' ')}
            fill={`color-mix(in srgb, var(--vb) ${Math.round(Math.sqrt(q.t) * 100)}%, var(--va))`}
            fillOpacity={0.82}
            stroke="var(--ifm-color-emphasis-500)"
            strokeOpacity={0.35}
            strokeWidth={0.4}
          />
        ))}
        {pitch >= 60 ? contours.map((seg, i) => (
          <polyline key={i} points={seg.map((v) => `${v.X.toFixed(1)},${v.Y.toFixed(1)}`).join(' ')} fill="none" stroke="var(--ifm-font-color-base)" strokeOpacity={0.6} strokeWidth={1.1} />
        )) : null}
        {showSlice && pitch < 60 ? (
          <g>
            {[{pts: sliceA, dash: undefined, label: 'w₂ = 1로 자른 단면 (w₁ − 3)²'}, {pts: sliceB, dash: '6 4', label: 'w₁ = 3으로 자른 단면 10(w₂ − 1)²'}].map((sl, i) => (
              <g key={i}>
                <polyline points={sl.pts.map((v) => `${v.X.toFixed(1)},${v.Y.toFixed(1)}`).join(' ')} fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
                <polyline points={sl.pts.map((v) => `${v.X.toFixed(1)},${v.Y.toFixed(1)}`).join(' ')} fill="none" stroke="#111" strokeWidth={3} strokeDasharray={sl.dash} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ))}
            <text x={sliceA[sliceA.length - 1].X + 6} y={sliceA[sliceA.length - 1].Y} className={s.ts} style={{fontWeight: 700}}>w₂ = 1 단면</text>
            <text x={sliceB[sliceB.length - 1].X + 6} y={sliceB[sliceB.length - 1].Y} className={s.ts} style={{fontWeight: 700}}>w₁ = 3 단면 (열 배 가파름)</text>
          </g>
        ) : null}
        <text x={axis1.X} y={axis1.Y + 4} className={s.ts} style={{fontWeight: 700}}>w₁</text>
        <text x={axis2.X} y={axis2.Y + 4} className={s.ts} style={{fontWeight: 700}}>w₂</text>

        {inside.length > 1 ? (
          <g>
            <polyline points={inside.map((p) => { const f = floorPt(p); return `${f.X},${f.Y}`; }).join(' ')} fill="none" stroke="var(--ifm-font-color-base)" strokeOpacity={0.55} strokeDasharray="4 3" strokeWidth={1.5} />
            <polyline points={inside.map((p) => { const f = surf(p); return `${f.X},${f.Y}`; }).join(' ')} fill="none" stroke="var(--vc)" strokeWidth={2.5} />
            {inside.map((p, i) => {
              const f = surf(p);
              return <circle key={i} cx={f.X} cy={f.Y} r={3} fill="var(--vc)" />;
            })}
          </g>
        ) : null}

        {curIn ? (
          <g>
            <line x1={surf(cur).X} y1={surf(cur).Y} x2={floorPt(cur).X} y2={floorPt(cur).Y} stroke="var(--vbad)" strokeDasharray="2 2" />
            {arrow ? (
              <g>
                <line x1={arrow.a.X} y1={arrow.a.Y} x2={arrow.b.X} y2={arrow.b.Y} stroke="var(--vok)" strokeWidth={3} />
                <polygon points={arrow.head} fill="var(--vok)" />
              </g>
            ) : null}
            <circle cx={surf(cur).X} cy={surf(cur).Y} r={6.5} fill="var(--vbad)" stroke="#fff" strokeWidth={2} />
          </g>
        ) : null}
        <text x={8} y={H - 8} className={s.ts}>색이 주황일수록 오차가 큽니다</text>
      </svg>
      <Stats>
        <Stat label="걸음 수" value={`${step} / ${MAXSTEP}`} />
        <Stat label="위치 (w₁, w₂)" value={curIn ? `(${tr(cur[0], 3)}, ${tr(cur[1], 3)})` : '곡면 밖'} tone={curIn ? undefined : 'bad'} />
        <Stat label="오차 E" value={curIn ? tr(E2(cur[0], cur[1]), 3) : '—'} tone={curIn ? 'good' : 'bad'} />
        <Stat label="기울기 (w₁, w₂ 방향)" value={curIn ? `(${tr(g1, 2)}, ${tr(g2, 2)})` : '—'} />
      </Stats>
      <Note>{curIn ? NOTES[eps] : `${NOTES[eps]} 지금은 곡면 밖으로 나가 공이 보이지 않습니다. 이것이 발산입니다.`}</Note>
    </Viz>
  );
}
