import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useColorMode} from '@docusaurus/theme-common';
import {Viz, Controls, Slider, Btn, Stats, Stat, styles as s} from './Viz';
import {makePoints, knnOrder, buildGraph, quantizePoints, search, exactTopK, d2} from './annSim';

const N = 400;
const K = 10;
const W = 520;
const H = 400;
const P = 14;
const POINTS = makePoints(N, 11);
const ORDER = knnOrder(POINTS);
const QUERIES = makePoints(200, 5);
const TRUTH = QUERIES.map((q) => exactTopK(POINTS, q, K));

const graphCache = {};
const getGraph = (M) => graphCache[M] || (graphCache[M] = buildGraph(ORDER, M));
const quantCache = {};
const getApprox = (bits) => (bits ? quantCache[bits] || (quantCache[bits] = quantizePoints(POINTS, bits)) : POINTS);

function run(M, bits, q, ef, refine) {
  const r = search(getGraph(M), getApprox(bits), q, ef, 0);
  const list = refine ? r.pool.slice().sort((a, b) => d2(POINTS[a], q) - d2(POINTS[b], q)) : r.pool;
  return {top: list.slice(0, K), pool: r.pool, visited: r.visited};
}

const BIT_CHOICES = [
  {v: 0, label: 'FP32'},
  {v: 8, label: '8비트'},
  {v: 6, label: '6비트'},
  {v: 4, label: '4비트'},
  {v: 3, label: '3비트'},
  {v: 2, label: '2비트'},
];

const X = (p) => P + p[0] * (W - 2 * P);
const Y = (p) => P + p[1] * (H - 2 * P);

export default function AnnDemo({mode = 'graph'}) {
  const full = mode === 'full';
  const [M, setM] = useState(4);
  const [ef, setEf] = useState(10);
  const [bits, setBits] = useState(0);
  const [refine, setRefine] = useState(false);
  const [q, setQ] = useState(QUERIES[0]);
  const ref = useRef(null);
  const {colorMode} = useColorMode();
  const useBits = full ? bits : 0;
  const useRefine = full ? refine : false;

  const cur = useMemo(() => {
    const r = run(M, useBits, q, ef, useRefine);
    const truth = exactTopK(POINTS, q, K);
    const top = new Set(r.top);
    const pool = new Set(r.pool);
    let hit = 0;
    let order = 0;
    let miss = 0;
    truth.forEach((i) => {
      if (top.has(i)) hit += 1;
      else if (pool.has(i)) order += 1;
      else miss += 1;
    });
    return {...r, truth, hit, order, miss};
  }, [M, useBits, q, ef, useRefine]);

  const avg = useMemo(() => {
    let hit = 0;
    let vis = 0;
    QUERIES.forEach((qq, i) => {
      const r = run(M, useBits, qq, ef, useRefine);
      const t = new Set(TRUTH[i]);
      r.top.forEach((x) => {
        if (t.has(x)) hit += 1;
      });
      vis += r.visited.length;
    });
    return {recall: hit / (QUERIES.length * K), visited: vis / QUERIES.length};
  }, [M, useBits, ef, useRefine]);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const cx = cv.getContext('2d');
    const fg = getComputedStyle(document.documentElement).getPropertyValue('--ifm-font-color-base').trim() || '#222';
    const adj = getGraph(M);
    cx.clearRect(0, 0, W, H);
    cx.strokeStyle = 'rgba(136,135,128,0.32)';
    cx.lineWidth = 0.6;
    for (let i = 0; i < N; i += 1) {
      adj[i].forEach((j) => {
        if (j > i) {
          cx.beginPath();
          cx.moveTo(X(POINTS[i]), Y(POINTS[i]));
          cx.lineTo(X(POINTS[j]), Y(POINTS[j]));
          cx.stroke();
        }
      });
    }
    const vis = new Set(cur.visited);
    for (let i = 0; i < N; i += 1) {
      cx.beginPath();
      cx.arc(X(POINTS[i]), Y(POINTS[i]), vis.has(i) ? 3.6 : 2.2, 0, 6.283);
      cx.fillStyle = vis.has(i) ? '#f59e0b' : 'rgba(136,135,128,0.7)';
      cx.fill();
    }
    cur.pool.forEach((i) => {
      cx.beginPath();
      cx.arc(X(POINTS[i]), Y(POINTS[i]), 6.5, 0, 6.283);
      cx.strokeStyle = '#0d9488';
      cx.lineWidth = 1.2;
      cx.stroke();
    });
    cur.truth.forEach((i) => {
      cx.beginPath();
      cx.arc(X(POINTS[i]), Y(POINTS[i]), 4.6, 0, 6.283);
      cx.fillStyle = '#2563eb';
      cx.fill();
    });
    cur.top.forEach((i) => {
      cx.beginPath();
      cx.arc(X(POINTS[i]), Y(POINTS[i]), 9, 0, 6.283);
      cx.strokeStyle = '#7c3aed';
      cx.lineWidth = 2;
      cx.stroke();
    });
    cx.save();
    cx.translate(X(q), Y(q));
    cx.rotate(Math.PI / 4);
    cx.fillStyle = fg;
    cx.fillRect(-5, -5, 10, 10);
    cx.restore();
  }, [cur, M, q, colorMode]);

  const setFrom = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = (((e.clientX - r.left) / r.width) * W - P) / (W - 2 * P);
    const y = (((e.clientY - r.top) / r.height) * H - P) / (H - 2 * P);
    setQ([Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))]);
  };

  return (
    <Viz
      title={full ? '그래프 탐색 + 양자화 + refine' : '그래프 탐색과 recall'}
      caption="그림을 누르거나 끌어서 질문 위치를 옮길 수 있습니다. 점 400개의 간이 모델이라 실제 HNSW와는 다르고, 실제로는 점이 수백만 개라서 방문 비율이 훨씬 작습니다."
    >
      <Controls>
        <Slider label="M (연결 수)" min={2} max={8} value={M} onChange={setM} />
        <Slider label="ef (후보 수)" min={10} max={80} step={5} value={ef} onChange={setEf} />
        <Btn onClick={() => setQ(QUERIES[Math.floor(Math.random() * QUERIES.length)])}>무작위 질문</Btn>
      </Controls>
      {full ? (
        <Controls>
          <span className={s.ts}>점의 좌표를 저장하는 정밀도</span>
          {BIT_CHOICES.map((b) => (
            <Btn key={b.v} on={bits === b.v} onClick={() => setBits(b.v)}>
              {b.label}
            </Btn>
          ))}
          <Btn on={refine} onClick={() => setRefine(!refine)}>refine (후보를 원래 좌표로 재정렬)</Btn>
        </Controls>
      ) : null}
      <canvas
        ref={ref}
        width={W}
        height={H}
        className={s.canvas}
        role="img"
        aria-label="점 400개의 근접 그래프와 한 질문의 탐색 결과"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setFrom(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons) setFrom(e);
        }}
      />
      <div className={s.legend}>
        <span><i style={{background: '#2563eb'}} />정답 상위 10</span>
        <span><i style={{background: 'transparent', border: '2px solid #7c3aed'}} />반환한 상위 10</span>
        <span><i style={{background: 'transparent', border: '1.5px solid #0d9488'}} />후보 목록 (ef개)</span>
        <span><i style={{background: '#f59e0b'}} />거리를 계산한 점</span>
        <span><i style={{background: 'var(--ifm-font-color-base)', borderRadius: 2, transform: 'rotate(45deg)'}} />질문</span>
      </div>
      <Stats>
        <Stat label="이 질문의 recall" value={`${Math.round((cur.hit / K) * 100)}%`} />
        <Stat label="누락 (후보 밖의 정답)" value={cur.miss} tone={cur.miss ? 'bad' : undefined} />
        <Stat label="순서 오류 (후보 안인데 밀림)" value={cur.order} tone={cur.order ? 'bad' : undefined} />
        <Stat label="200개 질문 평균 recall" value={`${Math.round(avg.recall * 100)}%`} />
        <Stat label="평균 거리 계산 횟수" value={`${Math.round(avg.visited)} / ${N}`} />
      </Stats>
      {full ? (
        <p className={s.note}>
          2차원 좌표 두 개를 낮은 비트로 저장하면 한 칸의 오차가 크게 보입니다. 1024차원에서는 칸마다의 오차가 서로 상쇄되어 훨씬 덜 흔들립니다. refine은 후보 목록 안의 점만 원래 좌표로 다시 정렬하므로, 누락은 줄이지 못하고 순서 오류만 줄입니다.
        </p>
      ) : null}
    </Viz>
  );
}
