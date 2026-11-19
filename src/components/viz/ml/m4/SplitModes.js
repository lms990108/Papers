import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {mulberry32} from '../../annSim';

const MODES = [
  {id: 'nist', name: 'NIST 원래 지정'},
  {id: 'mnist', name: 'MNIST (작가 기준)'},
  {id: 'random', name: '장을 무작위로 섞기 (비교용)'},
];
const WRITERS = 500;
const COLS = 25;

// 설명용 모의: 작가마다 장수가 같다고 두고, 장마다 학습 또는 시험 쪽으로 무작위 배정한다.
function bothSides(perWriter) {
  const r = mulberry32(7);
  const out = [];
  for (let w = 0; w < WRITERS; w += 1) {
    let tr = false;
    let te = false;
    for (let i = 0; i < perWriter && !(tr && te); i += 1) {
      if (r() < 0.5) tr = true;
      else te = true;
    }
    out.push(tr && te ? 'both' : tr ? 'train' : 'test');
  }
  return out;
}

export default function SplitModes() {
  const [mode, setMode] = useState('mnist');
  const [per, setPer] = useState(117);
  const side = bothSides(per);
  const nBoth = side.filter((x) => x === 'both').length;
  const size = 20;
  const gap = 5;
  const th = 10;
  const pitch = 12;
  const rows = Math.ceil(WRITERS / COLS);

  const box = (x, y, w, h, label, sub, tone) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="6" fill="var(--ifm-background-color)" stroke={tone} strokeWidth="2" />
      <text x={x + w / 2} y={y + 22} textAnchor="middle" className={s.t} fontWeight="600">{label}</text>
      <text x={x + w / 2} y={y + 42} textAnchor="middle" className={s.ts}>{sub}</text>
    </g>
  );

  const info = {
    nist: {tr: ['학습', '직원 글씨 (SD-3)'], te: ['시험', '학생 글씨 (SD-1)'], trN: '직원만', teN: '학생만', note: '쉬운 글씨로 배우고 어려운 글씨로 시험합니다. 오류가 높아도 방법이 나쁜지 시험이 어려운지 알 수 없습니다.'},
    mnist: {tr: ['학습 60,000', '직원 + 학생 250명'], te: ['시험 10,000', '직원 + 학생 250명'], trN: '직원 + 학생(앞 250명)', teN: '직원 5,000장 + 학생(나머지 250명) 5,000장', note: '시험의 필체를 학습에서 보지 않고, 시험은 두 출처가 5,000장씩입니다. MNIST 실험이 보고하는 숫자는 이 분할입니다.'},
    random: {tr: ['학습', '장을 섞어서'], te: ['시험', '장을 섞어서'], trN: '모든 작가', teN: '모든 작가', note: '같은 작가의 글씨가 양쪽에 들어갑니다. 시험의 필체를 학습에서 이미 본 셈이라 오류가 낮게 나옵니다.'},
  }[mode];

  return (
    <Viz
      title="학습과 시험을 어떻게 나누느냐에 따라 달라지는 것"
      caption="학생 글씨(SD-1)는 작가 500명입니다. 아래 네모 하나가 작가 한 명입니다(파랑은 학습 쪽, 주황은 시험 쪽, 위아래 반반은 양쪽에 모두 나온 작가). 무작위 섞기의 작가당 장수는 SD-1의 58,527장을 500명으로 나눈 약 117장으로 둔 설명용 모의입니다."
    >
      <Controls>
        {MODES.map((m) => (
          <Btn key={m.id} on={mode === m.id} onClick={() => setMode(m.id)}>{m.name}</Btn>
        ))}
        {mode === 'random' ? <Slider label="작가당 장수" min={1} max={120} step={1} value={per} onChange={setPer} /> : null}
      </Controls>
      <svg viewBox="0 0 640 350" className={s.svg} role="img" aria-label="학습 집합과 시험 집합에 직원 글씨와 학생 글씨, 그리고 학생 작가 500명이 어떻게 들어가는지">
        {box(10, 8, 190, 52, info.tr[0], info.tr[1], 'var(--va)')}
        {box(210, 8, 190, 52, info.te[0], info.te[1], 'var(--vb)')}
        <text x="418" y="24" className={s.t} fontWeight="600">학생 작가 500명 (SD-1)</text>
        <text x="418" y="44" className={s.ts}>네모 하나 = 작가 한 명</text>
        <g transform="translate(10,84)">
          {Array.from({length: WRITERS}, (_, i) => {
            const cx = (i % COLS) * (size + gap);
            const cy = Math.floor(i / COLS) * pitch;
            const st = mode === 'mnist' ? (i < 250 ? 'train' : 'test') : mode === 'nist' ? 'test' : side[i];
            return st === 'both' ? (
              <g key={i}>
                <rect x={cx} y={cy} width={size} height={th / 2} fill="var(--va)" />
                <rect x={cx} y={cy + th / 2} width={size} height={th / 2} fill="var(--vb)" />
              </g>
            ) : (
              <rect key={i} x={cx} y={cy} width={size} height={th} fill={st === 'train' ? 'var(--va)' : 'var(--vb)'} />
            );
          })}
        </g>
        <text x="10" y={84 + rows * pitch + 16} className={s.ts}>
          {mode === 'nist' ? '500명 전체가 시험 쪽(주황)입니다.' : mode === 'mnist' ? '앞 250명은 학습(파랑), 나머지 250명은 시험(주황)입니다.' : '작가를 가르지 않고 장 단위로 섞었습니다.'}
        </text>
      </svg>
      <Stats>
        <Stat label="학습에 나오는 글씨" value={info.trN} />
        <Stat label="시험에 나오는 글씨" value={info.teN} />
        <Stat label="학습과 시험에 모두 나온 작가" value={mode === 'random' ? `${nBoth}명 / 500명` : '0명'} tone={mode === 'random' && nBoth > 0 ? 'bad' : 'good'} />
      </Stats>
      <Note>{info.note}</Note>
    </Viz>
  );
}
