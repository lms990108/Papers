import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const TAGS = ['O', 'B-PER', 'I-PER', 'B-LOC', 'I-LOC', 'B-ORG', 'I-ORG'];
const SENT = [
  {words: ['이민섭', '은', '서울', '특별시', '에', '산다'], gold: ['B-PER', 'O', 'B-LOC', 'I-LOC', 'O', 'O'], pred: ['B-PER', 'O', 'B-LOC', 'O', 'O', 'O']},
  {words: ['삼성', '전자', '는', '수원', '에', '있다'], gold: ['B-ORG', 'I-ORG', 'O', 'B-LOC', 'O', 'O'], pred: ['B-ORG', 'I-ORG', 'O', 'B-LOC', 'O', 'O']},
  {words: ['오늘', '부산', '날씨', '좋다'], gold: ['O', 'B-LOC', 'O', 'O'], pred: ['O', 'O', 'O', 'O']},
];

function spans(tags) {
  const out = [];
  let start = null;
  let kind = null;
  tags.concat(['O']).forEach((t, i) => {
    if (t === 'O' || t.indexOf('B-') === 0 || (t.indexOf('I-') === 0 && t.slice(2) !== kind)) {
      if (kind !== null) out.push([kind, start, i]);
      start = t === 'O' ? null : i;
      kind = t === 'O' ? null : t.slice(2);
    }
  });
  return out;
}
const key = (e) => e.join(':');
const prf = (tp, fp, fn) => {
  const P = tp + fp ? tp / (tp + fp) : 0;
  const R = tp + fn ? tp / (tp + fn) : 0;
  return [P, R, P + R ? (2 * P * R) / (P + R) : 0];
};

export default function NerScore() {
  const [pred, setPred] = useState(SENT.map((x) => x.pred));
  const cycle = (a, i) => setPred(pred.map((row, r) => (r === a ? row.map((t, j) => (j === i ? TAGS[(TAGS.indexOf(t) + 1) % TAGS.length] : t)) : row)));

  const by = {};
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let right = 0;
  let all = 0;
  const detail = SENT.map((x, a) => {
    const G = spans(x.gold).map(key);
    const P = spans(pred[a]).map(key);
    const hit = P.filter((k) => G.indexOf(k) >= 0);
    const extra = P.filter((k) => G.indexOf(k) < 0);
    const miss = G.filter((k) => P.indexOf(k) < 0);
    const bump = (k, idx) => {
      const name = k.split(':')[0];
      by[name] = by[name] || [0, 0, 0];
      by[name][idx] += 1;
    };
    hit.forEach((k) => bump(k, 0));
    extra.forEach((k) => bump(k, 1));
    miss.forEach((k) => bump(k, 2));
    tp += hit.length;
    fp += extra.length;
    fn += miss.length;
    x.gold.forEach((g, j) => {
      all += 1;
      if (g === pred[a][j]) right += 1;
    });
    return {hit: hit.length, extra: extra.length, miss: miss.length};
  });
  const [P, R, F] = prf(tp, fp, fn);
  const kinds = Object.keys(by).sort();
  const macro = kinds.length ? kinds.reduce((a, k) => a + prf(by[k][0], by[k][1], by[k][2])[2], 0) / kinds.length : 0;
  const acc = right / all;

  return (
    <Viz
      title="모델의 표지를 바꿔 보며 개체 단위 점수 세기"
      caption="모델이 낸 표지(아래 줄)를 눌러 바꿔 보세요. 정답은 위 줄에 고정입니다. 종류와 경계가 모두 맞아야 맞은 개체입니다."
    >
      <Controls>
        <Btn on={pred.join() === SENT.map((x) => x.pred).join()} onClick={() => setPred(SENT.map((x) => x.pred))}>원래 예측</Btn>
        <Btn on={pred.join() === SENT.map((x) => x.gold).join()} onClick={() => setPred(SENT.map((x) => x.gold))}>정답과 똑같이</Btn>
        <Btn on={pred.every((r) => r.every((t) => t === 'O'))} onClick={() => setPred(SENT.map((x) => x.pred.map(() => 'O')))}>전부 O로</Btn>
      </Controls>
      {SENT.map((x, a) => (
        <table key={a} className={s.grid}>
          <thead>
            <tr>
              <th>문장 {a + 1}</th>
              {x.words.map((w, i) => (
                <th key={i}>{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>정답</td>
              {x.gold.map((t, i) => (
                <td key={i}>{t}</td>
              ))}
            </tr>
            <tr>
              <td>모델</td>
              {pred[a].map((t, i) => (
                <td key={i} style={t === x.gold[i] ? undefined : {background: 'color-mix(in srgb, var(--vbad) 16%, transparent)'}}>
                  <button type="button" className={s.btn} style={{padding: '1px 8px'}} onClick={() => cycle(a, i)} aria-label={x.words[i] + ' 모델 표지 ' + t + ', 누르면 바뀝니다'}>
                    {t}
                  </button>
                </td>
              ))}
            </tr>
            <tr>
              <td>개체 판정</td>
              <td colSpan={x.words.length}>
                TP {detail[a].hit}, FP {detail[a].extra}, FN {detail[a].miss}
              </td>
            </tr>
          </tbody>
        </table>
      ))}
      <Stats>
        <Stat label="TP, FP, FN" value={tp + ', ' + fp + ', ' + fn} />
        <Stat label="정밀도" value={fmt(P, 3)} />
        <Stat label="재현율" value={fmt(R, 3)} />
        <Stat label="마이크로 F1 (개체 전체를 한꺼번에 센 값)" value={fmt(F, 3)} tone={F >= 0.8 ? 'good' : F < 0.5 ? 'bad' : undefined} />
        <Stat label="매크로 F1 (종류별 F1의 평균)" value={fmt(macro, 3)} />
        <Stat label="토큰 정확도" value={fmt(acc, 3)} />
      </Stats>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>종류</th>
            <th>TP</th>
            <th>FP</th>
            <th>FN</th>
            <th>F1</th>
          </tr>
        </thead>
        <tbody>
          {kinds.map((k) => (
            <tr key={k}>
              <td>{k}</td>
              <td>{by[k][0]}</td>
              <td>{by[k][1]}</td>
              <td>{by[k][2]}</td>
              <td>{fmt(prf(by[k][0], by[k][1], by[k][2])[2], 3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Note>
        기본값은 TP 3, FP 1, FN 2로 정밀도 0.75, 재현율 0.6, 마이크로 F1 0.667, 매크로 F1 0.8, 토큰 정확도 0.875입니다. “전부 O로”를 누르면 토큰 정확도는 9/16 = 0.563인데 F1은 0입니다.
      </Note>
    </Viz>
  );
}
