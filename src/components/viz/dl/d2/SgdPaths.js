import React, {useEffect, useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {E2, path2, tr} from './lib';

// 같은 오차 곡면 E(w1, w2) = (w1 - 3)^2 + 10 (w2 - 1)^2 의 등고선 지도 위에서
// full batch 경사하강법(매끈한 길)과 mini-batch SGD(흔들리는 길)를 같은 시작점 (0, 0)에서 비교한다.
// 표본 1,000개는 표본마다 그릇의 바닥 (a, b)가 조금씩 다르고, 평균이 (3, 1)이다.
// 표본 p의 오차는 (w1 - a_p)^2 + 10 (w2 - b_p)^2 이고, 이 평균 기울기가 E의 기울기와 정확히 같다.
// 의사 난수의 씨앗을 고정해서 렌더마다, 서버와 브라우저에서 모두 같은 길이 나온다.

// SIM-START
const N = 1000; // 학습 표본 수
const K = 60; // 보여 줄 갱신 횟수
const EPS = 0.03; // learning rate
const SD = [2.5, 0.5]; // 표본마다 바닥이 흩어진 정도(표준편차)
const BSS = [1, 8, 32]; // 고를 수 있는 batch size

const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const gauss = (rand) => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
const standardize = (v) => {
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - m) * (b - m), 0) / v.length);
  return v.map((e) => (e - m) / sd);
};
const makeData = () => {
  const rand = rng(2024);
  const za = standardize(Array.from({length: N}, () => gauss(rand)));
  const zb = standardize(Array.from({length: N}, () => gauss(rand)));
  return {A: za.map((z) => 3 + SD[0] * z), B: zb.map((z) => 1 + SD[1] * z)};
};
const runSgd = (bs, A, B) => {
  const rand = rng(777);
  const pts = [[0, 0]];
  let [w1, w2] = [0, 0];
  while (pts.length <= K) {
    const order = Array.from({length: N}, (_, i) => i);
    for (let i = N - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    for (let st = 0; st < N && pts.length <= K; st += bs) {
      const batch = order.slice(st, st + bs);
      let g1 = 0;
      let g2 = 0;
      batch.forEach((i) => {
        g1 += 2 * (w1 - A[i]);
        g2 += 20 * (w2 - B[i]);
      });
      w1 -= (EPS * g1) / batch.length;
      w2 -= (EPS * g2) / batch.length;
      pts.push([w1, w2]);
    }
  }
  const loss = pts.map((p) => E2(p[0], p[1]));
  const upAt = loss.map((e, k) => k > 0 && e > loss[k - 1]);
  return {pts, loss, upAt};
};
const build = () => {
  const {A, B} = makeData();
  const gd = path2(EPS, EPS, K);
  const runs = {};
  BSS.forEach((bs) => {
    runs[bs] = runSgd(bs, A, B);
  });
  return {gd, gdLoss: gd.map((p) => E2(p[0], p[1])), runs};
};
// SIM-END

const DATA = build();
const PER_EPOCH = {1: '1,000', 8: '125', 32: '32'};

// ----- 지도(위)와 loss 곡선(아래)의 좌표 -----
const W = 560;
const H = 500;
const L = 46;
const R = 540;
const D1 = [-0.5, 5];
const D2 = [-0.4, 2];
const SC = (R - L) / (D1[1] - D1[0]);
const MT = 14;
const MB = MT + SC * (D2[1] - D2[0]);
const mx = (w1) => L + (w1 - D1[0]) * SC;
const my = (w2) => MB - (w2 - D2[0]) * SC;
const inDomain = (p) => p[0] >= D1[0] && p[0] <= D1[1] && p[1] >= D2[0] && p[1] <= D2[1];
const clampPt = (p) => [Math.min(D1[1], Math.max(D1[0], p[0])), Math.min(D2[1], Math.max(D2[0], p[1]))];

const CT = 296;
const CB = 450;
const EMIN = 0.002;
const EMAX = 30;
const LMIN = Math.log10(EMIN);
const LMAX = Math.log10(EMAX);
const cx = (k) => L + (k / K) * (R - L);
const cy = (e) => CB - ((Math.log10(Math.min(EMAX, Math.max(EMIN, e))) - LMIN) / (LMAX - LMIN)) * (CB - CT);

const LEVELS = [1, 2, 4, 8, 16];
const CONTOURS = (() => {
  const segs = [];
  LEVELS.forEach((c) => {
    let run = [];
    for (let k = 0; k <= 160; k++) {
      const t = (k / 160) * 2 * Math.PI;
      const p = [3 + Math.sqrt(c) * Math.cos(t), 1 + Math.sqrt(c / 10) * Math.sin(t)];
      if (inDomain(p)) {
        run.push(p);
      } else {
        if (run.length > 1) segs.push({c, run});
        run = [];
      }
    }
    if (run.length > 1) segs.push({c, run});
  });
  return segs;
})();
// 등고선 이름표: 타원 위의 한 점(w1 = 3 + 0.55 sqrt(c))에 붙인다
const LABELS = [1, 2, 4, 8].map((c) => ({c, w1: 3 + 0.55 * Math.sqrt(c), w2: 1 + Math.sqrt((c * (1 - 0.3025)) / 10)}));

const pts2 = (arr) => arr.map((p) => `${mx(p[0]).toFixed(1)},${my(p[1]).toFixed(1)}`).join(' ');
const pts3 = (arr) => arr.map((e, k) => `${cx(k).toFixed(1)},${cy(e).toFixed(1)}`).join(' ');

// 시작점 a에서 (dx, dy) 쪽으로 길이 len(px)짜리 화살표
function Arrow({a, dx, dy, color, len = 38}) {
  const n = Math.hypot(dx, dy);
  if (!(n > 1e-12)) return null;
  const ux = dx / n;
  const uy = dy / n;
  const bx = a.X + ux * len;
  const by = a.Y + uy * len;
  const px = -uy;
  const py = ux;
  return (
    <g>
      <line x1={a.X} y1={a.Y} x2={bx} y2={by} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <polygon points={`${bx + ux * 7},${by + uy * 7} ${bx + px * 5},${by + py * 5} ${bx - px * 5},${by - py * 5}`} fill={color} />
    </g>
  );
}

// 숫자 뒤 조사: 끝 숫자가 영·삼·육이면 '으로', 아니면 '로'
const ro = (str) => (/[036]$/.test(str) ? '으로' : '로');

const TICK_MS = 260;
const HOLD = 8; // 끝에서 잠시 멈추는 칸 수

export default function SgdPaths() {
  const [bs, setBs] = useState(8);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);

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
    const id = setInterval(() => setT((v) => (v >= K + HOLD ? 0 : v + 1)), TICK_MS);
    return () => clearInterval(id);
  }, [playing]);

  const k = Math.min(t, K);
  const run = DATA.runs[bs];
  const gd = DATA.gd;
  const gdLoss = DATA.gdLoss;

  const sgdTrail = run.pts.slice(0, k + 1).map(clampPt);
  const gdTrail = gd.slice(0, k + 1).map(clampPt);
  const sgdNow = clampPt(run.pts[k]);
  const gdNow = clampPt(gd[k]);
  const ups = run.upAt.slice(1, k + 1).filter(Boolean).length;
  const up = k > 0 && run.upAt[k];

  // 이번 갱신(k번째)의 방향 비교: 갱신 전 SGD 위치에서 본 두 방향
  let arrows = null;
  if (k > 0) {
    const p0 = run.pts[k - 1];
    const p1 = run.pts[k];
    const a = {X: mx(p0[0]), Y: my(p0[1])};
    arrows = {
      a,
      full: {dx: -2 * (p0[0] - 3), dy: 20 * (p0[1] - 1)}, // 화면 y는 아래가 +라서 부호를 바꿔 준다
      batch: {dx: p1[0] - p0[0], dy: -(p1[1] - p0[1])},
    };
  }

  const choose = (v) => {
    setBs(v);
    setT(0);
  };

  let note;
  if (k === 0) {
    note = `둘 다 (0, 0)에서 출발합니다. 이 자리의 오차는 E = ${tr(gdLoss[0], 3)}입니다. 첫 갱신에서 full batch는 표본 1,000개의 평균 기울기를, SGD는 표본 ${bs}개의 기울기를 씁니다.`;
  } else {
    const pg = gd[k];
    const ps = run.pts[k];
    note = `${k}번째 갱신. full batch는 표본 1,000개를 모두 읽고 (${tr(pg[0], 2)}, ${tr(pg[1], 2)})로 옮겨 E = ${tr(gdLoss[k], 3)}입니다. SGD는 표본 ${bs}개만 읽고 (${tr(ps[0], 2)}, ${tr(ps[1], 2)})로 옮겨 E = ${tr(run.loss[k], 3)}입니다. SGD의 E가 ${tr(run.loss[k - 1], 3)}에서 ${tr(run.loss[k], 3)}${ro(tr(run.loss[k], 3))} ${up ? '올랐습니다. 이번 batch가 가리킨 방향이 전체 평균 방향과 달랐기 때문입니다.' : '내려갔습니다.'}`;
    if (k === K) {
      note += ` 60번 갱신하는 동안 SGD의 E가 오른 갱신은 ${run.upAt.slice(1).filter(Boolean).length}번이고, full batch는 0번입니다. 그래도 SGD의 E는 처음 19에서 크게 내려왔습니다.`;
    }
  }

  const epochs = (K * bs) / N;

  return (
    <Viz
      title="같은 시작점에서 출발한 full batch와 SGD"
      caption={`위는 파라미터 (w₁, w₂)의 지도이고 가는 선은 오차가 같은 점을 이은 등고선입니다(E = 1, 2, 4, 8, 16). 정답 (3, 1)이 가장 안쪽입니다. 표본마다 오차의 바닥이 조금씩 달라서, 표본 하나가 가리키는 방향은 전체 평균과 다릅니다. 평균 기울기는 앞 문서의 곡면 E(w₁, w₂) = (w₁ − 3)² + 10(w₂ − 1)²과 같고, 두 길 모두 learning rate는 ${EPS}입니다. 아래는 갱신할 때마다 전체 데이터로 잰 오차 E이고, 세로 눈금은 한 칸마다 10배(로그 눈금)라서 작은 값의 오르내림도 보입니다. 빨강 점은 E가 오른 갱신입니다.`}
    >
      <Controls>
        <span className={s.ts}>batch size</span>
        {BSS.map((v) => (
          <Btn key={v} on={bs === v} onClick={() => choose(v)}>{v}</Btn>
        ))}
      </Controls>
      <Controls>
        <Btn on={playing} onClick={() => setPlaying(!playing)}>{playing ? '일시정지' : '재생'}</Btn>
        <Btn onClick={() => { setPlaying(false); setT(Math.max(0, k - 1)); }}>이전 갱신</Btn>
        <Btn onClick={() => { setPlaying(false); setT(Math.min(K, k + 1)); }}>다음 갱신</Btn>
        <Btn onClick={() => setT(0)}>처음으로</Btn>
      </Controls>
      <div style={{fontSize: '0.85rem', margin: '4px 0'}}>
        <span style={{color: 'var(--va)', fontWeight: 700}}>파랑 길</span>은 full batch(표본 1,000개 전체의 평균 기울기), <span style={{color: 'var(--vb)', fontWeight: 700}}>주황 길</span>은 batch size {bs}인 SGD입니다. 이번 갱신 직전의 SGD 위치에서 <span style={{color: 'var(--vok)', fontWeight: 700}}>초록 화살표</span>는 전체 평균이 가리키는 내리막 방향, <span style={{color: 'var(--vb)', fontWeight: 700}}>주황 화살표</span>는 이번 batch가 실제로 간 방향입니다.
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} style={{maxWidth: 640, margin: '0 auto', display: 'block'}} role="img" aria-label="등고선 지도 위에서 full batch 경사하강법의 매끈한 경로와 mini-batch SGD의 흔들리는 경로를 비교하고, 아래에 갱신 횟수에 따른 오차 곡선을 보여 주는 그림">
        <rect x={L} y={MT} width={R - L} height={MB - MT} fill="none" stroke="var(--ifm-color-emphasis-400)" />
        {CONTOURS.map((sg, i) => (
          <polyline key={i} points={pts2(sg.run)} fill="none" stroke="var(--ifm-color-emphasis-500)" strokeWidth={1.2} />
        ))}
        {LABELS.map((lb) => (
          <text key={lb.c} x={mx(lb.w1)} y={my(lb.w2) - 3} textAnchor="middle" className={s.ts} style={{fill: 'var(--ifm-color-emphasis-700)', stroke: 'var(--ifm-background-surface-color)', strokeWidth: 3, paintOrder: 'stroke'}}>E = {lb.c}</text>
        ))}
        {[0, 1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line x1={mx(v)} y1={MB} x2={mx(v)} y2={MB + 4} stroke="var(--ifm-color-emphasis-500)" />
            <text x={mx(v)} y={MB + 16} textAnchor="middle" className={s.ts}>{v}</text>
          </g>
        ))}
        {[0, 1, 2].map((v) => (
          <g key={v}>
            <line x1={L - 4} y1={my(v)} x2={L} y2={my(v)} stroke="var(--ifm-color-emphasis-500)" />
            <text x={L - 8} y={my(v) + 4} textAnchor="end" className={s.ts}>{v}</text>
          </g>
        ))}
        <text x={R} y={MB + 30} textAnchor="end" className={s.ts}>w₁</text>
        <text x={L + 4} y={MT + 12} className={s.ts}>w₂</text>

        <circle cx={mx(3)} cy={my(1)} r={5} fill="var(--vok)" />
        <text x={mx(3) + 9} y={my(1) + 4} className={s.ts} style={{fill: 'var(--vok)', fontWeight: 700, stroke: 'var(--ifm-background-surface-color)', strokeWidth: 3, paintOrder: 'stroke'}}>정답 (3, 1)</text>

        <polyline points={pts2(gdTrail)} fill="none" stroke="var(--va)" strokeWidth={2.5} />
        {gdTrail.map((p, i) => (
          <circle key={i} cx={mx(p[0])} cy={my(p[1])} r={2.5} fill="var(--va)" />
        ))}
        <polyline points={pts2(sgdTrail)} fill="none" stroke="var(--vb)" strokeWidth={2} strokeOpacity={0.9} />
        {sgdTrail.map((p, i) => (
          <circle key={i} cx={mx(p[0])} cy={my(p[1])} r={2.5} fill="var(--vb)" />
        ))}

        {arrows ? (
          <g>
            <Arrow a={arrows.a} dx={arrows.full.dx} dy={arrows.full.dy} color="var(--vok)" len={40} />
            <Arrow a={arrows.a} dx={arrows.batch.dx} dy={arrows.batch.dy} color="var(--vb)" len={30} />
          </g>
        ) : null}

        <circle cx={mx(0)} cy={my(0)} r={4.5} fill="none" stroke="var(--ifm-font-color-base)" strokeWidth={1.5} />
        <text x={mx(0) + 8} y={my(0) + 4} className={s.ts}>시작 (0, 0)</text>
        <circle cx={mx(gdNow[0])} cy={my(gdNow[1])} r={6.5} fill="var(--va)" stroke="var(--ifm-background-surface-color)" strokeWidth={2} />
        <circle cx={mx(sgdNow[0])} cy={my(sgdNow[1])} r={6.5} fill="var(--vb)" stroke="var(--ifm-background-surface-color)" strokeWidth={2} />

        {/* loss 곡선 */}
        <text x={L} y={CT - 12} className={s.ts} style={{fontWeight: 700}}>갱신 횟수에 따른 오차 E</text>
        <rect x={L} y={CT} width={R - L} height={CB - CT} fill="none" stroke="var(--ifm-color-emphasis-400)" />
        {[0.01, 0.1, 1, 10].map((v) => (
          <g key={v}>
            <line x1={L} y1={cy(v)} x2={R} y2={cy(v)} stroke="var(--vgrid)" />
            <text x={L - 6} y={cy(v) + 4} textAnchor="end" className={s.ts}>{v}</text>
          </g>
        ))}
        {[0, 10, 20, 30, 40, 50, 60].map((v) => (
          <g key={v}>
            <line x1={cx(v)} y1={CB} x2={cx(v)} y2={CB + 4} stroke="var(--ifm-color-emphasis-500)" />
            <text x={cx(v)} y={CB + 16} textAnchor="middle" className={s.ts}>{v}</text>
          </g>
        ))}
        <text x={R} y={CB + 32} textAnchor="end" className={s.ts}>갱신 횟수</text>
        <polyline points={pts3(gdLoss.slice(0, k + 1))} fill="none" stroke="var(--va)" strokeWidth={2.5} />
        <polyline points={pts3(run.loss.slice(0, k + 1))} fill="none" stroke="var(--vb)" strokeWidth={2} />
        {run.loss.slice(0, k + 1).map((e, i) => (run.upAt[i] ? <circle key={i} cx={cx(i)} cy={cy(e)} r={3.5} fill="var(--vbad)" /> : null))}
        <circle cx={cx(k)} cy={cy(gdLoss[k])} r={5} fill="var(--va)" stroke="var(--ifm-background-surface-color)" strokeWidth={1.5} />
        <circle cx={cx(k)} cy={cy(run.loss[k])} r={5} fill="var(--vb)" stroke="var(--ifm-background-surface-color)" strokeWidth={1.5} />
      </svg>
      <Stats>
        <Stat label="갱신 횟수" value={`${k} / ${K}`} />
        <Stat label="full batch의 E" value={tr(gdLoss[k], 3)} tone="good" />
        <Stat label="SGD의 E" value={tr(run.loss[k], 3)} tone={up ? 'bad' : 'good'} />
        <Stat label="SGD가 E를 올린 갱신" value={`${ups}번`} />
        <Stat label="한 갱신에 읽는 표본" value={`1,000개 / ${bs}개`} />
      </Stats>
      <Note>{note}</Note>
      <Note>
        표본 1,000개에 batch size {bs}이면 한 epoch가 {PER_EPOCH[bs]}번 갱신입니다{bs === 32 ? '(1,000 ÷ 32 = 31.25라서 남는 표본까지 묶어 32번)' : ''}. 그림의 60번 갱신은 {tr(epochs, 2)} epoch에 해당합니다. full batch는 한 갱신에 표본을 모두 읽으므로 갱신 한 번의 계산이 SGD의 {tr(N / bs, 2)}배입니다.
      </Note>
    </Viz>
  );
}
