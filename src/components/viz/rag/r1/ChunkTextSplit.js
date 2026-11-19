import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note, styles as s} from '../../Viz';
import {box, tint} from './ragToy';

// 설명용 문서: 어절을 토큰 대신 쓴다. 연차 문장은 topic 0.
const SENTS = [
  {t: '연차는 15일입니다.', topic: 0},
  {t: '입사 첫해는 11일입니다.', topic: 0},
  {t: '병가는 연차와 별도입니다.', topic: 1},
  {t: '병가는 진단서를 내면 쓸 수 있습니다.', topic: 1},
  {t: '출장비는 출장이 끝난 뒤 정산합니다.', topic: 2},
  {t: '출장 신청은 일주일 전에 합니다.', topic: 2},
];
const WORDS = [];
SENTS.forEach((st, si) => st.t.split(' ').forEach((w) => WORDS.push({w, si})));
const TOTAL = WORDS.length;

export default function ChunkTextSplit() {
  const [size, setSize] = useState(4);
  const [ov, setOv] = useState(0);
  const overlap = Math.min(ov, size - 1);
  const stride = size - overlap;
  const chunks = [];
  for (let st = 0; ; st += stride) {
    chunks.push({a: st, b: Math.min(TOTAL, st + size)});
    if (st + size >= TOTAL) break;
  }
  const sentRange = SENTS.map((_, si) => {
    let a = -1;
    let b = -1;
    WORDS.forEach((x, i) => {
      if (x.si === si) {
        if (a < 0) a = i;
        b = i + 1;
      }
    });
    return [a, b];
  });
  const intact = sentRange.filter(([a, b]) => chunks.some((c) => c.a <= a && c.b >= b));
  const hasWhole = chunks.some((c) => c.a <= sentRange[0][0] && c.b >= sentRange[0][1]);
  const orphan = chunks.some((c) => {
    const ws = WORDS.slice(c.a, c.b);
    return ws.some((x) => x.w === '15일입니다.') && !ws.some((x) => x.w === '연차는');
  });
  // 연차 질문에 가장 알맞은 청크: 연차 문장 어절이 가장 많은 청크
  let best = null;
  chunks.forEach((c) => {
    const rel = WORDS.slice(c.a, c.b).filter((x) => SENTS[x.si].topic === 0).length;
    if (!best || rel > best.rel) best = {rel, len: c.b - c.a};
  });

  return (
    <Viz
      title="같은 문서를 청크 크기와 오버랩으로 나누기"
      caption="어절 하나를 토큰 하나로 본 설명용 문서입니다(실제 토큰 수와는 다릅니다). 파란 글씨가 연차 문장이고, 주황 밑줄은 앞 청크와 겹친 어절입니다. 말줄임표는 문장이 그 자리에서 잘렸다는 표시입니다."
    >
      <Controls>
        <Slider label="청크 크기(어절)" min={1} max={12} value={size} onChange={setSize} />
        <Slider label="오버랩(어절)" min={0} max={Math.max(0, size - 1)} value={overlap} onChange={setOv} />
      </Controls>
      <div className={s.two}>
        {chunks.map((c, i) => {
          const ws = WORDS.slice(c.a, c.b);
          const cutHead = c.a > 0 && WORDS[c.a - 1].si === WORDS[c.a].si;
          const cutTail = c.b < TOTAL && WORDS[c.b - 1].si === WORDS[c.b].si;
          const prevEnd = i > 0 ? chunks[i - 1].b : 0;
          return (
            <div key={i} style={box({padding: '5px 10px', fontSize: '0.85rem'})}>
              <b>청크 {i + 1}</b>{' '}
              {cutHead ? <span style={{color: 'var(--vbad)'}}>…</span> : null}
              {ws.map((x, j) => (
                <span
                  key={j}
                  style={{
                    color: SENTS[x.si].topic === 0 ? 'var(--va)' : undefined,
                    borderBottom: c.a + j < prevEnd ? '2px solid var(--vb)' : undefined,
                    marginRight: 4,
                  }}
                >
                  {x.w}
                </span>
              ))}
              {cutTail ? <span style={{color: 'var(--vbad)'}}>…</span> : null}
            </div>
          );
        })}
      </div>
      <Stats>
        <Stat label="청크 수" value={`${chunks.length}개`} />
        <Stat label="온전히 담긴 문장" value={`${intact.length} / ${SENTS.length}`} tone={intact.length === SENTS.length ? 'good' : 'bad'} />
        <Stat label="연차는 15일입니다가 한 청크에" value={hasWhole ? '있음' : '없음'} tone={hasWhole ? 'good' : 'bad'} />
        <Stat label="연차는 없이 15일입니다만 있는 청크" value={orphan ? '있음' : '없음'} tone={orphan ? 'bad' : 'good'} />
        <Stat label="연차 질문에 가장 알맞은 청크의 관련 어절" value={`${best.rel} / ${best.len}`} />
      </Stats>
      <Note>
        {size <= 2 && overlap === 0
          ? '너무 작게 자르면 “15일입니다”만 남아 무엇의 15일인지 청크 안에 없습니다.'
          : size >= 10
          ? '크게 자르면 연차 문장이 병가나 출장 문장과 한 청크에 섞여, 관련 어절의 비율이 떨어집니다.'
          : overlap > 0
          ? '오버랩이 있으면 경계에서 끊긴 문장이 다음 청크 앞에도 남습니다. 청크 수는 늘어납니다.'
          : '오버랩이 0이면 경계 문장은 한 청크에만 있습니다. 오버랩을 올려 온전한 문장 수가 어떻게 변하는지 보세요.'}
      </Note>
    </Viz>
  );
}
