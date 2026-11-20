import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {num} from './util';

const COL = ['var(--va)', 'var(--vb)', 'var(--vc)', 'var(--vok)', 'var(--vbad)'];
const NAME = ['a', 'b', 'c', 'd', 'e'];
const MODES = [
  ['fc', '완전 연결'],
  ['local', '국소 수용장, 위치마다 따로'],
  ['shared', '국소 수용장 + 공유'],
];
const MAXDRAW = 12;

function counts(L, K) {
  const O = Math.max(0, L - K + 1);
  return {
    O,
    fc: {conn: (L + 1) * O, par: (L + 1) * O},
    local: {conn: (K + 1) * O, par: (K + 1) * O},
    shared: {conn: (K + 1) * O, par: K + 1},
  };
}

export default function SharedWires() {
  const [L, setL] = useState(7);
  const [K0, setK] = useState(3);
  const [mode, setMode] = useState('shared');
  const K = Math.min(K0, L - 1);
  const c = counts(L, K);
  const O = c.O;
  const draw = L <= MAXDRAW;
  const gap = 560 / Math.max(L, 1);
  const xi = (i) => 40 + (i + 0.5) * gap;
  const xo = (i) => 40 + (i + K / 2) * gap;

  const edges = [];
  if (draw) {
    for (let o = 0; o < O; o++) {
      for (let i = 0; i < L; i++) {
        const k = i - o;
        if (mode === 'fc' || (k >= 0 && k < K)) {
          edges.push({o, i, k: k >= 0 && k < K ? k : -1});
        }
      }
    }
  }

  return (
    <Viz
      title="연결선 하나가 가중치 하나일까"
      caption="국소 수용장은 출력 칸 하나가 보는 입력의 작은 이웃(창)입니다. 출력 칸마다 입력을 몇 칸 보는지, 그리고 그 가중치를 서로 나눠 쓰는지 바꿔 보세요. 공유 방식에서는 같은 색 선이 같은 값 하나입니다. 기본값(입력 7칸, 창 3칸)은 본문의 40개, 20개, 4개입니다."
    >
      <Controls>
        {MODES.map(([id, name]) => (
          <Btn key={id} on={mode === id} onClick={() => setMode(id)}>{name}</Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="입력 칸 수" min={4} max={100} value={L} onChange={setL} />
        <Slider label="창 크기 K" min={2} max={5} value={K} onChange={setK} />
        <Btn onClick={() => { setL(7); setK(3); }}>입력 7칸</Btn>
        <Btn onClick={() => { setL(100); setK(3); }}>입력 100칸</Btn>
      </Controls>

      {draw && O > 0 ? (
        <svg viewBox="0 0 640 190" className={s.svg} role="img" aria-label={`입력 ${L}칸과 출력 ${O}칸을 잇는 연결선 ${edges.length}개. 방식: ${MODES.find((m) => m[0] === mode)[1]}`}>
          {edges.map((e) => (
            <line key={`${e.o}-${e.i}`} x1={xo(e.o)} y1={44} x2={xi(e.i)} y2={146} stroke={mode === 'shared' && e.k >= 0 ? COL[e.k] : 'var(--ifm-color-emphasis-500)'} strokeWidth={mode === 'shared' ? 2.2 : 1.2} strokeOpacity={mode === 'fc' ? 0.45 : 0.9} />
          ))}
          {Array.from({length: O}, (_, o) => (
            <g key={o}>
              <circle cx={xo(o)} cy={36} r={10} fill="var(--ifm-background-color)" stroke="var(--ifm-font-color-base)" strokeWidth={1.5} />
              <text x={xo(o)} y={40} textAnchor="middle" className={s.ts}>y{o}</text>
            </g>
          ))}
          {Array.from({length: L}, (_, i) => (
            <g key={i}>
              <circle cx={xi(i)} cy={154} r={10} fill="var(--ifm-background-color)" stroke="var(--ifm-font-color-base)" strokeWidth={1.5} />
              <text x={xi(i)} y={158} textAnchor="middle" className={s.ts}>x{i}</text>
            </g>
          ))}
          <text x={4} y={20} className={s.ts}>출력</text>
          <text x={4} y={184} className={s.ts}>입력</text>
        </svg>
      ) : (
        <Note>{O === 0 ? '창이 입력보다 큽니다.' : `입력이 ${MAXDRAW}칸보다 길어 연결선 그림은 생략하고 개수만 셉니다.`}</Note>
      )}
      {mode === 'shared' && draw ? (
        <div className={s.legend}>
          {Array.from({length: K}, (_, k) => (
            <span key={k}><i style={{background: COL[k]}} />가중치 {NAME[k]} (창의 {k + 1}번째 칸)</span>
          ))}
        </div>
      ) : null}

      <table className={s.grid}>
        <thead>
          <tr><th>방식</th><th>연결 수 (바이어스 포함)</th><th>서로 다른 값 = 학습 파라미터</th></tr>
        </thead>
        <tbody>
          {MODES.map(([id, name]) => (
            <tr key={id}>
              <td className={id === mode ? s.cellOn : undefined}>{name}</td>
              <td className={id === mode ? s.cellOn : undefined}>{num(c[id].conn)}</td>
              <td className={id === mode ? s.cellOn : undefined}>{num(c[id].par)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="출력 칸 수" value={`${L} − ${K} + 1 = ${O}`} />
        <Stat label="공유로 줄어든 비" value={c.shared.par > 0 ? `${num(c.local.par)} → ${num(c.shared.par)}` : '-'} tone="good" />
      </Stats>
      <Note>연결 수는 국소 방식이든 공유든 {num(c.local.conn)}개로 같습니다. 공유가 줄이는 것은 서로 다른 값의 개수입니다. 완전 연결은 ({L} + 1) × {O}, 국소는 ({K} + 1) × {O}, 공유는 {K} + 1입니다.</Note>
    </Viz>
  );
}
