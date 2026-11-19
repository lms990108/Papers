import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, Stats, Stat, styles as s} from '../../Viz';

const PAIRS = [
  {n: '날씨 좋다 / 좋다 날씨', a: '날씨 좋다', b: '좋다 날씨'},
  {n: 'dog bites man / man bites dog', a: 'dog bites man', b: 'man bites dog'},
  {n: '직접 입력', a: '오늘 날씨 좋다', b: '좋다 날씨 오늘'},
];
const inputStyle = {
  padding: '4px 10px',
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: 8,
  background: 'var(--ifm-background-color)',
  color: 'var(--ifm-font-color-base)',
  fontSize: '0.9rem',
  minWidth: 180,
};

const split = (t) => t.split(/\s+/).filter(Boolean);

function bag(toks, n) {
  const items = n === 1 ? toks : toks.slice(0, Math.max(0, toks.length - 1)).map((t, i) => `${t}→${toks[i + 1]}`);
  const m = {};
  const keys = [];
  items.forEach((it) => {
    if (m[it] === undefined) {
      m[it] = 0;
      keys.push(it);
    }
    m[it] += 1;
  });
  return {m, keys};
}

export default function OrderLoss() {
  const [pi, setPi] = useState(0);
  const [n, setN] = useState(1);
  const [custom, setCustom] = useState([PAIRS[2].a, PAIRS[2].b]);

  const a = pi === 2 ? custom[0] : PAIRS[pi].a;
  const b = pi === 2 ? custom[1] : PAIRS[pi].b;
  const ba = bag(split(a), n);
  const bb = bag(split(b), n);
  const keys = ba.keys.concat(bb.keys.filter((k) => ba.m[k] === undefined));
  const same = keys.every((k) => (ba.m[k] || 0) === (bb.m[k] || 0));
  const sameOrder = split(a).join(' ') === split(b).join(' ');

  return (
    <Viz
      title="순서가 다른 두 문장, 같은 주머니일까"
      caption="두 문장의 주머니를 나란히 놓고 칸마다 횟수를 비교합니다. 2-그램 주머니는 단어 둘씩 묶은 쌍을 칸으로 씁니다."
    >
      <Controls>
        {PAIRS.map((p, i) => (
          <Btn key={p.n} on={pi === i} onClick={() => setPi(i)}>
            {p.n}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Btn on={n === 1} onClick={() => setN(1)}>
          단어 주머니
        </Btn>
        <Btn on={n === 2} onClick={() => setN(2)}>
          2-그램 주머니
        </Btn>
      </Controls>
      {pi === 2 ? (
        <Controls>
          <input type="text" aria-label="문장 A" style={inputStyle} value={custom[0]} onChange={(e) => setCustom([e.target.value, custom[1]])} />
          <input type="text" aria-label="문장 B" style={inputStyle} value={custom[1]} onChange={(e) => setCustom([custom[0], e.target.value])} />
        </Controls>
      ) : null}

      {keys.length ? (
        <table className={s.grid}>
          <thead>
            <tr>
              <th>칸</th>
              <th>A: {a}</th>
              <th>B: {b}</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => {
              const ca = ba.m[k] || 0;
              const cb = bb.m[k] || 0;
              const diff = ca !== cb;
              return (
                <tr key={k}>
                  <td>{k}</td>
                  <td className={diff ? s.cellOn : undefined}>{ca}</td>
                  <td className={diff ? s.cellOn : undefined}>{cb}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <Note>칸이 없습니다. 문장이 비었거나, 2-그램은 단어가 둘 이상이어야 합니다.</Note>
      )}
      <Stats>
        <Stat label="두 주머니" value={same ? '같다 (True)' : '다르다 (False)'} tone={same ? 'bad' : 'good'} />
        <Stat label="두 문장" value={sameOrder ? '같은 문장' : '서로 다른 문장'} />
      </Stats>
      {same && !sameOrder ? (
        <Note>문장은 다른데 주머니가 같습니다. 순서가 목록에 남지 않기 때문입니다.</Note>
      ) : null}
      {!same && n === 2 ? <Note>단어 쌍을 칸으로 쓰면 순서가 조금 들어와서 두 문장이 구별됩니다.</Note> : null}
    </Viz>
  );
}
