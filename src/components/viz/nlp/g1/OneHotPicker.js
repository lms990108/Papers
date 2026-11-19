import React, {useState} from 'react';
import {Viz, Controls, Btn, Slider, Note, fmt, styles as s} from '../../Viz';

const TOKENS = ['오늘', '날씨', '좋다', '나쁘다'];
const W = [0, 0.2, -1, 1]; // 단어 주머니의 가중치

export default function OneHotPicker() {
  const [k, setK] = useState(2);
  const [w, setW] = useState(-1);

  return (
    <Viz
      title="번호를 원-핫 목록으로 바꾸기"
      caption="토큰을 고르면 번호의 칸만 1인 목록이 보입니다. 아래 표는 번호에 가중치 하나를 곱한 값과, 원-핫에 토큰마다 다른 가중치를 곱한 값을 견줍니다."
    >
      <Controls>
        {TOKENS.map((t, i) => (
          <Btn key={t} on={i === k} onClick={() => setK(i)}>
            {t} ({i})
          </Btn>
        ))}
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>{TOKENS[k]}의 원-핫</th>
            {TOKENS.map((t, i) => (
              <th key={t}>
                {i}번 칸
                <div className={s.ts}>{t}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>목록</td>
            {TOKENS.map((t, i) => (
              <td key={t} className={i === k ? s.cellOn : undefined}>
                {i === k ? 1 : 0}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <Note>
        {TOKENS[k]} → [{TOKENS.map((t, i) => (i === k ? 1 : 0)).join(', ')}]. 칸의 자리는 사전 번호와 같습니다.
      </Note>
      <Controls>
        <Slider label="번호에 곱하는 가중치 w" min={-3} max={3} step={0.5} value={w} onChange={setW} format={(v) => fmt(v, 1)} />
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>토큰</th>
            <th>번호 인코딩: 번호 × w</th>
            <th>원-핫 · 가중치 [0, 0.2, -1, 1]</th>
          </tr>
        </thead>
        <tbody>
          {TOKENS.map((t, i) => (
            <tr key={t}>
              <td className={i === k ? s.cellOn : undefined}>{t}</td>
              <td className={i === k ? s.cellOn : undefined}>
                {i} × {fmt(w, 1)} = {fmt(i * w, 1)}
              </td>
              <td className={i === k ? s.cellOn : undefined}>{fmt(W[i], 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Note>
        번호 인코딩은 w 하나로 값이 정해져서 번호만큼 커집니다(w = -1이면 0, -1, -2, -3). 원-핫은 토큰마다 가중치를 따로 가질 수 있어서, 1이 있는 칸의 가중치 하나만 남습니다.
      </Note>
    </Viz>
  );
}
