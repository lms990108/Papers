import React, {useEffect, useRef, useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

// 채널이 쌓이는 모습을 CSS 3D로 보여 준다. 입력(가로×세로×채널) → 도장 여러 장(각각 채널만큼 겹) → 출력(도장 수만큼 채널).
// 입력 6×6, 창 3×3, stride 1, padding 0이라 출력은 4×4다.

const N = 6;
const K = 3;
const O = N - K + 1;
const CELL = 16;
const GAP = 16;
const SCENE_H = 440;
const STEP_MS = 180;
const KCOL = ['var(--va)', 'var(--vb)', 'var(--vc)', 'var(--vok)', 'var(--vbad)', '#0891b2'];
const CH_NAME = ['R', 'G', 'B'];
const CH_COL = ['#ef4444', '#22c55e', '#3b82f6'];
const GRAY = '#9ca3af';
const LINE = 'rgba(128, 128, 128, 0.22)';

const mix = (c, p) => `color-mix(in srgb, ${c} ${p}%, transparent)`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function Plane({rows, cols, z, cellStyle, edge}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: cols * CELL,
        height: rows * CELL,
        transform: `translateZ(${z}px)`,
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${CELL}px)`,
        gridAutoRows: `${CELL}px`,
        boxShadow: edge ? `0 0 0 2px ${edge}` : undefined,
      }}
    >
      {Array.from({length: rows * cols}, (_, i) => (
        <div key={i} style={{boxSizing: 'border-box', border: '1px solid', borderColor: LINE, ...cellStyle(Math.floor(i / cols), i % cols)}} />
      ))}
    </div>
  );
}

function Group({x, y, w, h, depth, children}) {
  return (
    <div style={{position: 'absolute', left: '50%', top: '50%', width: w, height: h, transformStyle: 'preserve-3d', transform: `translate3d(${x - w / 2}px, ${y - h / 2}px, ${-depth / 2}px)`}}>
      {children}
    </div>
  );
}

export default function ChannelStack3D() {
  const [cin, setCin] = useState(3);
  const [cout, setCout] = useState(4);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [yaw, setYaw] = useState(-32);
  const [pitch, setPitch] = useState(-12);
  const [scale, setScale] = useState(1);
  const [grabbing, setGrabbing] = useState(false);
  const wrap = useRef(null);
  const drag = useRef(null);

  const per = O * O;
  const total = cout * per;
  const st = Math.min(step, total - 1);
  const k = Math.floor(st / per);
  const pos = st % per;
  const wr = Math.floor(pos / O);
  const wc = pos % O;
  const tint = (ch) => (cin === 3 ? CH_COL[ch] : GRAY);

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
    const id = setInterval(() => setStep((v) => (v + 1 >= total ? 0 : v + 1)), STEP_MS);
    return () => clearInterval(id);
  }, [playing, total]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return undefined;
    const fit = () => setScale(Math.max(0.6, Math.min(1.7, el.clientWidth / 460)));
    fit();
    let ro = null;
    try {
      ro = new ResizeObserver(fit);
      ro.observe(el);
    } catch (e) {
      ro = null;
    }
    return () => ro && ro.disconnect();
  }, []);

  const choose = (setter) => (v) => {
    setter(v);
    setStep(0);
  };

  const onDown = (e) => {
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
    setPitch(clamp(drag.current.pitch - (e.clientY - drag.current.y) * 0.4, -80, 80));
  };
  const onUp = () => {
    drag.current = null;
    setGrabbing(false);
  };

  const kernelH = cout * (K * CELL + 10) - 10;
  const inDepth = (cin - 1) * GAP;
  const outDepth = (cout - 1) * GAP;

  return (
    <Viz
      title="채널이 쌓이는 모습 (끌어서 돌려 보세요)"
      caption="왼쪽이 입력, 가운데가 도장(kernel)들, 오른쪽이 출력입니다. 입력의 밝게 칠한 3×3 칸이 지금 창이고, 도장 하나가 창을 입력의 모든 채널에 걸쳐 읽어 출력 한 칸을 채웁니다. 도장 색과 출력 채널 색이 짝입니다."
    >
      <Controls>
        <span className={s.ts}>입력 채널</span>
        <Btn on={cin === 1} onClick={() => choose(setCin)(1)}>1 (흑백)</Btn>
        <Btn on={cin === 3} onClick={() => choose(setCin)(3)}>3 (컬러 RGB)</Btn>
        <span className={s.ts}>도장 수</span>
        {[2, 4, 6].map((v) => (
          <Btn key={v} on={cout === v} onClick={() => choose(setCout)(v)}>{v}장</Btn>
        ))}
      </Controls>
      <Controls>
        <Btn on={playing} onClick={() => setPlaying(!playing)}>{playing ? '일시정지' : '재생'}</Btn>
        <Btn onClick={() => { setPlaying(false); setStep(Math.min(total - 1, st + 1)); }}>다음 자리</Btn>
        <Btn onClick={() => { setPlaying(false); setStep(Math.min(total - 1, (k + 1) * per)); }}>다음 도장</Btn>
        <Btn onClick={() => setStep(0)}>처음으로</Btn>
        <Btn onClick={() => setYaw(yaw - 20)}>◀ 돌리기</Btn>
        <Btn onClick={() => setYaw(yaw + 20)}>돌리기 ▶</Btn>
        <Btn onClick={() => { setYaw(-32); setPitch(-12); }}>시점 되돌리기</Btn>
      </Controls>

      <div
        ref={wrap}
        role="img"
        aria-label={`입력 ${cin}채널 ${N}×${N}을 도장 ${cout}장(각 ${K}×${K}×${cin})으로 훑어 ${cout}채널 ${O}×${O} 출력을 만드는 입체 그림`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{position: 'relative', height: SCENE_H, overflow: 'hidden', perspective: 1100, touchAction: 'pan-y', cursor: grabbing ? 'grabbing' : 'grab', userSelect: 'none'}}
      >
        <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `scale(${Math.min(scale, (SCENE_H - 40) / Math.max(kernelH, 150))}) rotateX(${pitch}deg) rotateY(${yaw}deg)`}}>
          <Group x={-145} y={0} w={N * CELL} h={N * CELL} depth={inDepth}>
            {Array.from({length: cin}, (_, ch) => (
              <Plane
                key={ch}
                rows={N}
                cols={N}
                z={ch * GAP}
                edge={tint(ch)}
                cellStyle={(r, c) => {
                  const inWin = r >= wr && r < wr + K && c >= wc && c < wc + K;
                  return inWin ? {background: mix(tint(ch), 62), borderColor: KCOL[k]} : {background: mix(tint(ch), 14), borderColor: LINE};
                }}
              />
            ))}
          </Group>

          <Group x={-20} y={0} w={K * CELL} h={kernelH} depth={inDepth}>
            {Array.from({length: cout}, (_, kk) => (
              <div key={kk} style={{position: 'absolute', left: 0, top: kk * (K * CELL + 10), width: K * CELL, height: K * CELL, transformStyle: 'preserve-3d', opacity: kk === k ? 1 : 0.4}}>
                {Array.from({length: cin}, (_, ch) => (
                  <Plane key={ch} rows={K} cols={K} z={ch * GAP} edge={KCOL[kk]} cellStyle={() => ({background: mix(tint(ch), kk === k ? 45 : 14), borderColor: LINE})} />
                ))}
              </div>
            ))}
          </Group>

          <Group x={125} y={0} w={O * CELL} h={O * CELL} depth={outDepth}>
            {Array.from({length: cout}, (_, j) => (
              <Plane
                key={j}
                rows={O}
                cols={O}
                z={j * GAP}
                edge={KCOL[j]}
                cellStyle={(r, c) => {
                  const idx = r * O + c;
                  const done = j < k || (j === k && idx <= pos);
                  const cur = j === k && idx === pos;
                  const bg = cur ? mix(KCOL[j], 95) : done ? mix(KCOL[j], 55) : mix(KCOL[j], 6);
                  if (cur) return {background: bg, borderColor: 'var(--ifm-font-color-base)'};
                  return {background: bg, borderColor: j === k ? LINE : 'transparent'};
                }}
              />
            ))}
          </Group>
        </div>
      </div>

      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: '4px 12px', fontSize: '0.8rem', margin: '2px 0 6px', textAlign: 'center'}}>
        <span>입력<br />{N}×{N}, 채널 {cin}장{cin === 3 ? ` (${CH_NAME.join(', ')})` : ''}</span>
        <span>도장 {cout}장<br />한 장이 {K}×{K}×{cin}</span>
        <span>출력<br />{O}×{O}, 채널 {cout}장</span>
      </div>

      <Stats>
        <Stat label="입력 모양 (채널, 세로, 가로)" value={`(${cin}, ${N}, ${N})`} />
        <Stat label="도장 한 장의 가중치" value={`${K}×${K}×${cin} = ${K * K * cin}개`} />
        <Stat label="출력 모양" value={`(${cout}, ${O}, ${O})`} tone="good" />
        <Stat label="파라미터 (바이어스 포함)" value={`(${K * K * cin}+1)×${cout} = ${(K * K * cin + 1) * cout}개`} />
      </Stats>
      <Note>
        도장 {k + 1}이 ({wr + 1}행, {wc + 1}열) 자리에 놓였습니다. 입력 채널 {cin}장 모두에서 {K}×{K} 창을 곱해 전부 더하면({K * K * cin}번 곱셈) 출력 채널 {k + 1}의 한 칸이 됩니다. 도장이 {cout}장이라 이 훑기를 {cout}번 하고, 그 결과가 출력 채널 {cout}장입니다.
      </Note>
    </Viz>
  );
}
