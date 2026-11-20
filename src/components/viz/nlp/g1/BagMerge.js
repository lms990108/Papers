import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const ENDS = ['았다', '아요', '었다', '어요', '다'];
const stem = (w) => {
  for (let i = 0; i < ENDS.length; i += 1) {
    if (w.endsWith(ENDS[i]) && w.length > ENDS[i].length) return w.slice(0, w.length - ENDS[i].length);
  }
  return w;
};

// 원문: 코퍼스에서 좋다 5번, 좋았다 3번, 좋아요 2번. 좋다만 가중치 -1을 학습했다.
const COUNTS = [['좋다', 5], ['좋았다', 3], ['좋아요', 2]];
const REVIEWS = ['연기가 좋다', '연기가 좋았다', '연기가 좋아요'];
// 설명용 값: 바는 불만 쪽(+1), 날씨는 0.2 (단어 주머니의 가중치와 같은 값).
const W_OFF = {좋다: -1, 바: 1, 날씨: 0.2};
const W_ON = {좋: -1, 바: 1, 날씨: 0.2};

const chip = (extra) => ({
  display: 'inline-block',
  padding: '1px 9px',
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: 6,
  background: 'var(--ifm-background-color)',
  ...extra,
});

export default function BagMerge() {
  const [on, setOn] = useState(false);
  const [bada, setBada] = useState(false);

  const weights = on ? W_ON : W_OFF;
  const key = (w) => (on ? stem(w) : w);
  const wOf = (w) => weights[key(w)] || 0;
  const score = (text) => text.split(' ').reduce((a, w) => a + wOf(w), 0);

  // 칸(행)과 횟수
  const rows = [];
  COUNTS.forEach(([w, c]) => {
    const k = key(w);
    const hit = rows.filter((r) => r.k === k)[0];
    if (hit) {
      hit.c += c;
      hit.from.push(w);
    } else rows.push({k, c, from: [w]});
  });
  const reviews = bada ? REVIEWS.concat(['바다 날씨 좋다']) : REVIEWS;
  const total = COUNTS.reduce((a, x) => a + x[1], 0);

  return (
    <Viz
      title="어간 추출 전후로 칸이 합쳐지는 모습"
      caption="좋다만 가중치 -1을 학습한 상황입니다. 코퍼스는 학습에 쓰는 글 모음이고, 코퍼스 횟수는 그 안에서 센 횟수입니다. 어간 추출을 켜면 세 말의 횟수가 한 칸에 모이고, 세 리뷰가 같은 가중치를 받습니다. 바다 예의 가중치(바 +1, 날씨 0.2)는 설명용 값입니다."
    >
      <Controls>
        <Btn on={!on} onClick={() => setOn(false)}>
          어간 추출 전
        </Btn>
        <Btn on={on} onClick={() => setOn(true)}>
          어간 추출 후
        </Btn>
        <Btn on={bada} onClick={() => setBada(!bada)}>
          바다 · 바도 같이 보기
        </Btn>
      </Controls>
      <div className={s.two}>
        <div>
          <div className={s.title}>사전의 칸</div>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>칸</th>
                <th>코퍼스 횟수</th>
                <th>가중치</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.k}>
                  <td className={r.from.length > 1 ? s.cellOn : undefined}>{r.k}</td>
                  <td className={r.from.length > 1 ? s.cellOn : undefined}>{r.c}</td>
                  <td>{weights[r.k] !== undefined ? weights[r.k] : '배우지 못함(0)'}</td>
                </tr>
              ))}
              {bada ? (
                <tr>
                  <td>{on ? '바 (바다도 여기로)' : '바다'}</td>
                  <td>—</td>
                  <td>{on ? '+1' : '행 없음(0)'}</td>
                </tr>
              ) : null}
              {bada && !on ? (
                <tr>
                  <td>바</td>
                  <td>—</td>
                  <td>+1</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div>
          <div className={s.title}>리뷰 점수</div>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>리뷰</th>
                <th>점수</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((t) => {
                const v = score(t);
                const isBada = t.indexOf('바다') === 0;
                return (
                  <tr key={t}>
                    <td>{t}</td>
                    <td className={v !== 0 ? s.cellOn : undefined} style={isBada ? {color: 'var(--vbad)'} : undefined}>
                      {fmt(v, 1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Stats>
        <Stat label="사전의 행 수(좋 계열)" value={rows.length} />
        <Stat label="좋 칸의 코퍼스 횟수" value={on ? total : '5 / 3 / 2로 흩어짐'} />
        <Stat label="가중치를 받은 리뷰" value={`${REVIEWS.filter((t) => score(t) !== 0).length} / 3`} tone={on ? 'good' : 'bad'} />
      </Stats>
      <span style={chip({marginTop: 8})}>
        {on ? '좋았다, 좋아요, 좋다 → 좋' : '좋다 · 좋았다 · 좋아요는 서로 다른 칸'}
      </span>
      {bada ? (
        <Note>
          바다를 바로 자르면 바다가 바의 가중치(+1)를 가져옵니다. “바다 날씨 좋다”의 점수가 {on ? '0.2' : '-0.8'}입니다. 표제어 추출은 바다를 사전의 기본형으로 두고 바와 더하지 않습니다.
        </Note>
      ) : null}
    </Viz>
  );
}
