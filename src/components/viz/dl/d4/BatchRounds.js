import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const PROMPT = 8; // B의 프롬프트 토큰
const COST = 16; // 4x4 행렬의 칸 수. 연산 = 2 x M x 16
const ops = (m) => 2 * m * COST;
const W = 560;
const L = 12;

function Lane({y, rounds, scale, label}) {
  let x = L;
  return (
    <g>
      <text x={L} y={y - 6} className={s.ts}>{label}</text>
      {rounds.map((r, i) => {
        const w = r.ops * scale;
        const g = (
          <g key={i}>
            <rect x={x} y={y} width={Math.max(w - 2, 1)} height={34} rx={4} fill={r.color} fillOpacity="0.28" stroke={r.color} />
            {w > 46 ? <text x={x + w / 2} y={y + 21} className={s.ts} textAnchor="middle">{r.text}</text> : null}
            {r.token ? <circle cx={x + w - 6} cy={y - 4} r={3.5} fill="var(--vok)" /> : null}
          </g>
        );
        x += w;
        return g;
      })}
    </g>
  );
}

export default function BatchRounds() {
  const [chunk, setChunk] = useState(4);
  const [split, setSplit] = useState(false);

  // 한 기계: B의 prefill을 chunk칸씩 자르고, 매 회전에 A의 decode 1칸을 같이 넣는다
  const rounds = [];
  let left = PROMPT;
  while (left > 0) {
    const c = Math.min(chunk, left);
    const m = 1 + c;
    rounds.push({ops: ops(m), m, text: `M=${m}, ${ops(m)}`, color: 'var(--va)', token: true, a: 'decode', b: `prefill ${PROMPT - left + 1}–${PROMPT - left + c}`});
    left -= c;
  }
  rounds.push({ops: ops(2), m: 2, text: `M=2, ${ops(2)}`, color: 'var(--vc)', token: true, a: 'decode', b: 'decode'});
  const total = rounds.reduce((a, r) => a + r.ops, 0);
  const preTotal = rounds.slice(0, rounds.length - 1).reduce((a, r) => a + r.ops, 0);

  // 분리: A는 decode 전용 기계에서 매 회전 M=1, B의 prefill은 다른 기계에서 한 번에
  const preOps = ops(PROMPT);
  const aRounds = Math.round(preOps / ops(1));
  const scaleOne = (W - 2 * L) / total;
  const scaleSplit = (W - 2 * L) / Math.max(preOps, ops(1) * aRounds);

  return (
    <Viz
      title="A의 decode 1칸과 B의 프롬프트 8토큰을 한 회전에 넣기"
      caption="가중치 읽기는 늘 32바이트이고, 한 회전의 연산은 2 × M × 16입니다. 초록 점은 그 회전이 끝날 때 A가 토큰 하나를 받는 시점입니다. 칸 수를 8로 하면 B의 8토큰을 한 번에 넣는 경우입니다. 'prefill 전용 기계를 따로 둠'은 B의 prefill을 다른 기계가 맡는 경우이고, 아래 Prefill-decode disaggregation에서 설명합니다."
    >
      <Controls>
        <Btn on={!split} onClick={() => setSplit(false)}>한 기계에서 번갈아</Btn>
        <Btn on={split} onClick={() => setSplit(true)}>prefill 전용 기계를 따로 둠</Btn>
        {!split ? <Slider label="회전당 prefill 칸" min={1} max={PROMPT} value={chunk} onChange={setChunk} /> : null}
      </Controls>
      {!split ? (
        <div>
          <svg viewBox={`0 0 ${W} 80`} className={s.svg} role="img" aria-label="회전별 연산 길이 막대">
            <Lane y={30} rounds={rounds} scale={scaleOne} label="한 기계의 회전 (막대 길이 = 연산)" />
          </svg>
          <table className={s.grid}>
            <thead>
              <tr><th>회전</th><th>A</th><th>B</th><th>M</th><th>연산</th></tr>
            </thead>
            <tbody>
              {rounds.map((r, i) => (
                <tr key={i} className={i === 0 ? s.cellOn : undefined}>
                  <td>{i + 1}</td>
                  <td>{r.a} 1칸</td>
                  <td>{r.b}{r.b.indexOf('decode') === 0 ? ' 1칸' : ''}</td>
                  <td>{r.m}</td>
                  <td>{r.ops}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Stats>
            <Stat label="A가 첫 토큰을 받을 때까지의 연산" value={String(rounds[0].ops)} tone={rounds[0].ops > 160 ? 'bad' : 'good'} />
            <Stat label="B의 prefill이 끝날 때까지 A가 받는 토큰" value={`${rounds.length - 1}개`} />
            <Stat label="B의 prefill이 끝날 때까지 연산의 합" value={String(preTotal)} />
            <Stat label="가중치 읽기 (회전마다)" value="32바이트" />
          </Stats>
          <Note>
            A만 있었다면 연산 32면 끝납니다. {chunk >= PROMPT ? '8토큰을 한 번에 넣으면 M = 9, 연산 288이 끝나야 A의 다음 토큰이 나옵니다. 첫 토큰 시간이 B의 prefill 길이로 밀립니다.' : chunk === 4 ? '4칸씩 두 회전이면 160, 160, 그다음 B도 decode라 64입니다. 두 회전의 합 320은 한 번에 넣은 288보다 큰데, A의 decode가 두 번 들어갔기 때문입니다.' : '칸을 줄이면 A는 더 자주 토큰을 받고, 회전의 합은 A의 decode가 들어간 횟수만큼 늡니다.'}
          </Note>
        </div>
      ) : (
        <div>
          <svg viewBox={`0 0 ${W} 150`} className={s.svg} role="img" aria-label="decode 전용 기계와 prefill 전용 기계의 두 줄">
            <Lane
              y={30}
              rounds={Array.from({length: aRounds}, () => ({ops: ops(1), text: '', color: 'var(--va)', token: true}))}
              scale={scaleSplit}
              label={`decode 전용 기계: A의 회전은 매번 M=1, 연산 ${ops(1)}`}
            />
            <Lane
              y={100}
              rounds={[{ops: preOps, text: `B의 prefill M=${PROMPT}, ${preOps}`, color: 'var(--vb)'}]}
              scale={scaleSplit}
              label="prefill 전용 기계: B의 8토큰을 읽고 캐시를 만듦"
            />
          </svg>
          <Stats>
            <Stat label="A가 첫 토큰을 받을 때까지의 연산" value={String(ops(1))} tone="good" />
            <Stat label="B의 prefill 연산 (별도 기계)" value={String(preOps)} />
            <Stat label="넘기는 키와 값" value="수 64개" />
          </Stats>
          <Note>
            넘기는 것은 가중치가 아니라 B의 키와 값입니다. 8토큰이면 수 64개입니다. 이 그림은 두 기계의 속도가 같다고 두고 막대 길이를 맞춘 설명용 계산이고, B의 prefill에 A의 칸이 끼지 않아 연산이 2 × 8 × 16 = 256입니다. A의 decode 줄은 B의 행렬 곱을 기다리지 않습니다.
          </Note>
        </div>
      )}
    </Viz>
  );
}
