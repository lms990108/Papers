import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, styles as s} from '../../Viz';

// meaning: 같은 값이면 같은 뜻. 어절(eo)과 조사를 뗀 토큰(sp)은 설명용으로 적은 것이다.
const SENTS = [
  {t: '날씨 는 좋다', m: 'a', eo: ['날씨', '는', '좋다'], sp: ['날씨', '는', '좋다']},
  {t: '날씨 좋다', m: 'a', eo: ['날씨', '좋다'], sp: ['날씨', '좋다']},
  {t: '날씨는 좋다', m: 'a', eo: ['날씨는', '좋다'], sp: ['날씨', '는', '좋다']},
  {t: 'not good', m: 'b', eo: ['not', 'good'], sp: ['not', 'good']},
  {t: 'good', m: 'c', eo: ['good'], sp: ['good']},
];
const CANDS = ['는', '가', '은', '이', 'the', 'a', 'of', 'not'];

export default function StopListTest() {
  const [stop, setStop] = useState(['는', '가', '은', '이']);
  const [sp, setSp] = useState(false);

  const toggle = (v) => setStop(stop.indexOf(v) >= 0 ? stop.filter((x) => x !== v) : stop.concat([v]));
  const rows = SENTS.map((x) => {
    const toks = sp ? x.sp : x.eo;
    const kept = toks.filter((t) => stop.indexOf(t) < 0);
    return {...x, toks, kept, key: kept.join(' ')};
  });
  const clash = [];
  const split = [];
  rows.forEach((a, i) => {
    rows.forEach((b, j) => {
      if (j <= i) return;
      if (a.m !== b.m && a.key === b.key) clash.push([a, b]);
      if (a.m === b.m && a.key !== b.key && !split.some((p) => p[1] === b)) split.push([a, b]);
    });
  });

  return (
    <Viz
      title="불용어를 지운 뒤 입력은 어떻게 되나"
      caption="불용어 목록을 켜고 끄고, 토큰 단위를 바꿔 보세요. 지워진 토큰은 취소선으로 보입니다. 같은 뜻이면 같은 입력이어야 하고, 뜻이 반대이면 입력도 달라야 합니다. 조사 분리는 설명용입니다."
    >
      <Controls>
        <span className={s.ts}>불용어 목록:</span>
        {CANDS.map((v) => (
          <Btn key={v} on={stop.indexOf(v) >= 0} onClick={() => toggle(v)}>
            {v}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <span className={s.ts}>토큰 단위:</span>
        <Btn on={!sp} onClick={() => setSp(false)}>
          어절(띄어쓰기)
        </Btn>
        <Btn on={sp} onClick={() => setSp(true)}>
          조사를 뗀 토큰
        </Btn>
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>문장</th>
            <th>토큰</th>
            <th>지운 뒤 입력</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.t}>
              <td>{r.t}</td>
              <td style={{textAlign: 'left'}}>
                {r.toks.map((t, i) => (
                  <span
                    key={i}
                    style={{
                      marginRight: 8,
                      textDecoration: stop.indexOf(t) >= 0 ? 'line-through' : 'none',
                      color: stop.indexOf(t) >= 0 ? 'var(--vbad)' : undefined,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </td>
              <td>
                <b>{r.key || '(빈 입력)'}</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {clash.map(([a, b]) => (
        <Note key={a.t + b.t}>
          <b style={{color: 'var(--vbad)'}}>문제:</b> 뜻이 다른 두 문장(“{a.t}”, “{b.t}”)의 입력이 같아졌습니다(“{a.key}”).
          {a.t === 'not good' || b.t === 'not good' ? ' 감정을 맞히는 문제라면 not을 목록에서 빼야 합니다.' : ''}
        </Note>
      ))}
      {split.map(([a, b]) => (
        <Note key={a.t + b.t}>
          <b style={{color: 'var(--vbad)'}}>문제:</b> 같은 뜻의 두 문장(“{a.t}”, “{b.t}”)의 입력이 다릅니다.
          {(a.t === '날씨는 좋다' || b.t === '날씨는 좋다') && !sp
            ? ' 어절 토큰 “날씨는”은 목록의 “는”과 같지 않아서 지워지지 않습니다. 조사를 먼저 떼어야 합니다.'
            : ' 목록에 없는 토큰이 남아 있어서 입력이 다릅니다.'}
        </Note>
      ))}
      {!clash.length && !split.length ? <Note>같은 뜻은 같은 입력으로, 다른 뜻은 다른 입력으로 남았습니다.</Note> : null}
    </Viz>
  );
}
