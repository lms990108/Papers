import React, {useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note} from '../../Viz';

const BASE = [0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0];
const EXTRA = [0, 1, 1, 0, 1, 0, 0, 1, 1, 0]; // 길이를 늘릴 때 덧붙이는 설명용 값
const W1 = [1, -1, 1];
const U2 = [1, -1, 1, -1];
const MAXL = 24;
const relu = (a) => Math.max(a, 0);

const cell = (on, extra) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  height: 30, border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 4,
  fontSize: '0.82rem', fontVariantNumeric: 'tabular-nums',
  background: on ? 'color-mix(in srgb, var(--vb) 22%, transparent)' : 'var(--ifm-background-color)',
  fontWeight: on ? 700 : 400,
  ...extra,
});

export default function SharedCompute() {
  const [bits, setBits] = useState(BASE.concat(EXTRA));
  const [L, setL] = useState(14);
  const [win, setWin] = useState(0);
  const x = bits.slice(0, L);

  // 따로 계산: 창마다 특징 4개를 새로 만든다. 공유: 특징은 한 번씩만.
  let multAlone = 0;
  const feat = (i) => relu(W1[0] * x[i] + W1[1] * x[i + 1] + W1[2] * x[i + 2]);
  const nw = L - 5;
  const alone = [];
  for (let st = 0; st < nw; st += 1) {
    let sc = 0;
    for (let j = 0; j < 4; j += 1) {
      multAlone += 3;
      sc += U2[j] * feat(st + j);
    }
    alone.push(sc);
  }
  const h = [];
  for (let i = 0; i < L - 2; i += 1) h.push(feat(i));
  const shared = alone.map((_, st) => U2.reduce((a, u, j) => a + u * h[st + j], 0));
  const multShared = (L - 2) * 3;
  const w = Math.min(win, nw - 1);
  const same = alone.every((v, i) => v === shared[i]);
  const grid = {display: 'grid', gridTemplateColumns: `repeat(${L}, minmax(26px, 1fr))`, gap: 3, minWidth: L * 29};
  const lab = {fontSize: '0.78rem', margin: '8px 0 3px', color: 'var(--ifm-color-emphasis-700)'};

  return (
    <Viz
      title="따로 계산과 한 번만 계산은 같은 점수를 낸다"
      caption="입력 칸을 눌러 0과 1을 바꿔 보세요. 첫 단계는 폭 3 검출기 (1, −1, 1)에 ReLU, 둘째 단계는 폭 6 창 안의 특징 네 개에 (1, −1, 1, −1)을 곱해 합합니다. 입력이 뭐든 두 방식의 점수는 같고, 곱셈 횟수만 다릅니다."
    >
      <Controls>
        <Slider label="입력 길이" min={8} max={MAXL} value={L} onChange={(v) => { setL(v); setWin(0); }} />
        <Slider label="창 위치" min={0} max={Math.max(0, nw - 1)} value={w} onChange={setWin} />
        <Btn onClick={() => { setBits(BASE.concat(EXTRA)); setL(14); setWin(0); }}>원본 (길이 14)</Btn>
        <Btn onClick={() => { setL(20); setWin(0); }}>길이 20 (연습 문제 2)</Btn>
      </Controls>
      <div style={{overflowX: 'auto'}}>
        <div style={lab}>입력 x (눌러서 0과 1 바꾸기)</div>
        <div style={grid}>
          {x.map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setBits(bits.map((b, j) => (j === i ? 1 - b : b)))}
              aria-label={`입력 ${i}번 칸 값 ${v}, 눌러서 바꾸기`}
              style={{...cell(i >= w && i < w + 6), cursor: 'pointer', color: 'var(--ifm-font-color-base)'}}
            >
              {v}
            </button>
          ))}
        </div>
        <div style={lab}>첫 단계 특징 h (12곳에서 한 번씩만 계산)</div>
        <div style={grid}>
          {h.map((v, i) => (
            <div key={i} style={cell(i >= w && i < w + 4, {gridColumn: i + 1})}>{v}</div>
          ))}
        </div>
        <div style={lab}>창 점수 (창 시작 위치마다 하나)</div>
        <div style={grid}>
          {shared.map((v, i) => (
            <div key={i} style={cell(i === w, {gridColumn: i + 1})}>{v}</div>
          ))}
        </div>
      </div>
      <Stats>
        <Stat label="창이 놓이는 자리" value={nw} />
        <Stat label="폭 3 검출기가 놓이는 자리" value={L - 2} />
        <Stat label="따로 계산(첫 단계 곱셈)" value={multAlone} tone="bad" />
        <Stat label="공유(첫 단계 곱셈)" value={multShared} tone="good" />
        <Stat label="두 방식의 점수" value={same ? '같다' : '다르다'} tone={same ? 'good' : 'bad'} />
      </Stats>
      <Note>
        {`선택한 창은 입력 ${w}~${w + 5}칸을 보고, 특징 ${w}~${w + 3}번을 읽습니다. 이 창의 점수는 ${shared[w]}입니다. 이웃한 창은 특징 세 개를 공유하므로, 창 하나마다 새로 계산하지 않고 특징 표에서 네 칸을 읽으면 됩니다. 둘째 단계의 곱셈 ${nw * 4}번은 양쪽에 똑같이 듭니다.`}
      </Note>
    </Viz>
  );
}
