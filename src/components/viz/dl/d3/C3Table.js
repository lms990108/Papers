import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {num} from './util';

// C3 맵 16장이 S2 맵 6장 중 어느 것을 보는지. 장 수의 구성은 본문(3장 6개, 4장 9개, 6장 1개)과 같다.
const IN = 6;
const OUT = 16;
const rot = (i, n) => Array.from({length: n}, (_, k) => (i + k) % IN);
const DEFAULT_ROWS = [
  ...Array.from({length: 6}, (_, i) => rot(i, 3)),
  ...Array.from({length: 6}, (_, i) => rot(i, 4)),
  [0, 1, 3, 4],
  [1, 2, 4, 5],
  [0, 2, 3, 5],
  [0, 1, 2, 3, 4, 5],
];
const toGrid = (rows) => rows.map((r) => Array.from({length: IN}, (_, j) => r.indexOf(j) >= 0));
const KERNEL = 25;
const POS = 100;

export default function C3Table() {
  const [g, setG] = useState(toGrid(DEFAULT_ROWS));
  const toggle = (i, j) => () => setG(g.map((row, a) => (a === i ? row.map((v, b) => (b === j ? !v : v)) : row)));
  const taps = g.map((row) => row.filter(Boolean).length);
  const params = taps.reduce((a, t) => a + KERNEL * t + 1, 0);
  const full = (KERNEL * IN + 1) * OUT;
  const groups = {};
  taps.forEach((t) => { groups[t] = (groups[t] || 0) + 1; });
  const formula = Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b)
    .map((t) => `${groups[t]}·${KERNEL * t + 1}`)
    .join(' + ');
  const empty = taps.some((t) => t === 0);

  return (
    <Viz
      title="C3의 연결 표: 어느 맵이 어느 맵을 볼까"
      caption="행은 C3의 맵 16장, 열은 S2의 맵 6장입니다. 칸을 눌러 연결을 켜고 끄면 학습 파라미터가 (25·t + 1)의 합으로 바로 다시 계산됩니다(t는 그 맵이 보는 S2 맵 수). 처음 배치는 3장을 보는 맵 6개, 4장을 보는 맵 9개, 6장을 다 보는 맵 1개입니다. 칸의 정확한 위치는 설명용 배치입니다."
    >
      <Controls>
        <Btn onClick={() => setG(toGrid(DEFAULT_ROWS))}>처음 배치</Btn>
        <Btn onClick={() => setG(g.map((r) => r.map(() => true)))}>전부 잇기</Btn>
        <Btn onClick={() => setG(g.map((r) => r.map((_, j) => j < 3)))}>모두 앞의 3장만</Btn>
      </Controls>
      <table className={s.grid} style={{maxWidth: 440, margin: '0 auto'}}>
        <thead>
          <tr>
            <th>C3 맵</th>
            {Array.from({length: IN}, (_, j) => <th key={j}>S2 {j}</th>)}
            <th>t</th>
            <th>25t + 1</th>
          </tr>
        </thead>
        <tbody>
          {g.map((row, i) => (
            <tr key={i}>
              <td>{i}</td>
              {row.map((on, j) => (
                <td key={j} onClick={toggle(i, j)} className={on ? s.cellOn : undefined} style={{cursor: 'pointer', userSelect: 'none'}} onKeyDown={(e) => e.key === 'Enter' && toggle(i, j)()} tabIndex={0} role="button" aria-pressed={on} aria-label={`C3 ${i}번 맵과 S2 ${j}번 맵 연결 ${on ? '켜짐' : '꺼짐'}`}>
                  {on ? '●' : '·'}
                </td>
              ))}
              <td>{taps[i]}</td>
              <td>{KERNEL * taps[i] + 1}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="C3 학습 파라미터" value={`${formula} = ${num(params)}`} tone={params === 1516 ? 'good' : undefined} />
        <Stat label="연결 (파라미터 × 100)" value={num(params * POS)} />
        <Stat label="전부 이었을 때" value={`(25·6 + 1)·16 = ${num(full)}`} />
        <Stat label="연결 표가 줄인 수" value={num(full - params)} />
      </Stats>
      {empty ? <Note>입력이 하나도 없는 맵이 있습니다. 그 맵은 바이어스 1개만 남아 아무 특징도 볼 수 없습니다.</Note> : null}
      <Note>연결 표를 두는 것은 연결 수를 줄이는 것도 이유지만, 더 중요한 이유는 맵마다 다른 조합을 보게 하는 것입니다. 전부 같은 입력을 보면 맵들이 같은 특징만 뽑기 쉽습니다.</Note>
    </Viz>
  );
}
