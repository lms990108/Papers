import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const LABELS = ['날씨', '좋다', '빈 칸', '빈 칸'];
const PRESETS = [
  {t: '점수 전부 0', v: [0, 0, 0, 0]},
  {t: '점수 2, 1, 0, 0', v: [2, 1, 0, 0]},
  {t: '점수 0, 1, 0, 0', v: [0, 1, 0, 0]},
];

function softmax(xs, mask) {
  const es = xs.map((x, i) => (mask[i] ? Math.exp(x) : 0));
  const z = es.reduce((a, b) => a + b, 0);
  return es.map((e) => e / z);
}

export default function MaskAttention() {
  const [sc, setSc] = useState([2, 1, 0, 0]);

  const open = softmax(sc, [1, 1, 1, 1]);
  const hid = softmax(sc, [1, 1, 0, 0]);
  const padShare = open[2] + open[3];
  const setOne = (i, v) => setSc(sc.map((x, k) => (k === i ? v : x)));

  return (
    <Viz
      title="어텐션 점수에서 빈 칸 가리기"
      caption="네 칸의 점수를 바꿔 보세요. 왼쪽은 빈 칸도 소프트맥스에 넣은 비율이고, 오른쪽은 빈 칸의 점수를 -∞로 가려서 지수가 0이 된 비율입니다."
    >
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p.t} on={p.v.join() === sc.join()} onClick={() => setSc(p.v)}>
            {p.t}
          </Btn>
        ))}
      </Controls>
      <Controls>
        {LABELS.map((l, i) => (
          <Slider key={i} label={`${i + 1}번 ${l}`} min={-3} max={4} step={0.5} value={sc[i]} onChange={(v) => setOne(i, v)} format={(x) => fmt(x, 1)} />
        ))}
      </Controls>
      <div className={s.two}>
        <div>
          <div className={s.title}>빈 칸을 넣었을 때</div>
          {LABELS.map((l, i) => (
            <Bar key={i} label={`${i + 1}번 ${l}`} value={open[i]} max={1} color={i < 2 ? 'var(--va)' : 'var(--vb)'} text={fmt(open[i], 3)} />
          ))}
        </div>
        <div>
          <div className={s.title}>빈 칸을 가렸을 때</div>
          {LABELS.map((l, i) => (
            <Bar key={i} label={`${i + 1}번 ${l}`} value={hid[i]} max={1} color={i < 2 ? 'var(--va)' : 'var(--vb)'} text={i < 2 ? fmt(hid[i], 3) : '0 (가림)'} />
          ))}
        </div>
      </div>
      <Stats>
        <Stat label="빈 칸이 가져간 비율" value={fmt(padShare, 3)} tone={padShare > 0.001 ? 'bad' : 'good'} />
        <Stat label="실제 단어 둘의 합 (넣음)" value={fmt(open[0] + open[1], 3)} />
        <Stat label="실제 단어 둘의 합 (가림)" value={fmt(hid[0] + hid[1], 3)} tone="good" />
      </Stats>
      <Note>
        파란 막대는 실제 단어, 주황 막대는 빈 칸입니다. 점수가 전부 0이면 넣었을 때 칸마다 0.25이고 가리면 0.5씩입니다. 가리면 실제 단어 둘의 합이 항상 1입니다.
      </Note>
    </Viz>
  );
}
