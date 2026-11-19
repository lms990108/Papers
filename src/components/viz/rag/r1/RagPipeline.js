import React, {useState} from 'react';
import {Viz, Controls, Btn, Slider, Bar, Note, fmt, styles as s} from '../../Viz';
import {CHUNKS, QUESTIONS, rankChunks, box, tint} from './ragToy';

const STEPS = ['문서', '조각(청크)', '검색', '붙이기', '답'];

export default function RagPipeline() {
  const [step, setStep] = useState(0);
  const [qi, setQi] = useState(0);
  const [k, setK] = useState(1);
  const q = QUESTIONS[qi];
  const ranked = rankChunks(q.vec);
  const picked = ranked.slice(0, k);
  const pickedIds = picked.map((c) => c.id);
  const hasNeed = q.need.every((id) => pickedIds.indexOf(id) >= 0);
  const prompt = picked.map((c) => `[${c.id}] ${c.text}`).join('\n') + `\n\n질문: ${q.text}\n답:`;

  return (
    <Viz
      title="RAG 파이프라인: 문서에서 답까지"
      caption="단계 버튼을 눌러 한 칸씩 넘기고, 질문과 k를 바꿔 보세요. 문서, 수 목록, 질문은 모두 설명용 값입니다. 답 칸은 실제 LLM 출력이 아니라, 필요한 청크가 입력에 들어갔는지에 따라 달라지는 장면을 보여 줍니다."
    >
      <Controls>
        {STEPS.map((n, i) => (
          <Btn key={n} on={i === step} onClick={() => setStep(i)}>
            {i + 1}. {n}
          </Btn>
        ))}
      </Controls>
      <Controls>
        {QUESTIONS.map((x, i) => (
          <Btn key={x.text} on={i === qi} onClick={() => setQi(i)}>
            {x.text}
          </Btn>
        ))}
        <Slider label="k (붙일 청크 수)" min={1} max={3} value={k} onChange={setK} />
      </Controls>

      <div style={{display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', fontSize: '0.85rem', margin: '4px 0 10px'}}>
        {STEPS.map((n, i) => (
          <React.Fragment key={n}>
            <span style={box({padding: '2px 10px', borderRadius: 999, fontWeight: i === step ? 700 : 400, background: i === step ? tint('var(--va)', 22) : i < step ? tint('var(--va)', 8) : undefined, borderColor: i === step ? 'var(--va)' : undefined})}>
              {n}
            </span>
            {i < STEPS.length - 1 ? <span aria-hidden="true">→</span> : null}
          </React.Fragment>
        ))}
      </div>

      {step === 0 ? (
        <div style={box()}>
          <b>규정 문서 (설명용)</b>
          <div>{CHUNKS.map((c) => c.text).join(' ')}</div>
          <Note>문서는 아직 한 덩어리입니다. 질문은 “{q.text}”입니다.</Note>
        </div>
      ) : null}

      {step === 1 ? (
        <div className={s.two}>
          {CHUNKS.map((c) => (
            <div key={c.id} style={box()}>
              <b>청크 [{c.id}]</b>
              <div>{c.text}</div>
              <div className={s.legend}>수 목록(연차, 병가, 출장): {c.vec.join(', ')}</div>
            </div>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div>
          {ranked.map((c, i) => (
            <Bar
              key={c.id}
              label={`${i + 1}위 청크 [${c.id}]`}
              value={c.score}
              max={1}
              color={i < k ? 'var(--vok)' : 'var(--ifm-color-emphasis-400)'}
              text={`${fmt(c.score, 3)}${i < k ? ' 선택' : ''}`}
            />
          ))}
          <Note>
            막대는 질문과 청크의 코사인 유사도입니다. 질문 수 목록은 {q.vec.join(', ')}이고, 위의 {k}개만 남깁니다.
            {qi === 1 && k === 1 ? ' 휴가 일수는 연차와 병가 사이에 있어서 병가 청크가 1위입니다. k를 2로 올려 보세요.' : ''}
          </Note>
        </div>
      ) : null}

      {step === 3 ? (
        <div>
          <pre style={box({margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit'})}>{prompt}</pre>
          <Note>고른 청크 {k}개와 질문이 한 입력으로 이어졌습니다. 이 글 전체를 LLM이 먼저 읽습니다.</Note>
        </div>
      ) : null}

      {step === 4 ? (
        <div className={s.two}>
          <div style={box()}>
            <b>LLM만</b>
            <div>입력: {q.text}</div>
            <div style={{color: 'var(--vbad)'}}>답: 보통 15일입니다.</div>
            <div className={s.legend}>규정이 학습에 없으므로 그럴듯하지만 근거가 없는 문장입니다.</div>
          </div>
          <div style={box({borderColor: hasNeed ? 'var(--vok)' : 'var(--vbad)'})}>
            <b>RAG (k = {k})</b>
            <div>입력에 붙은 청크: {pickedIds.map((id) => `[${id}]`).join(' ')}</div>
            {hasNeed ? (
              <div style={{color: 'var(--vok)'}}>답: {q.answer}</div>
            ) : (
              <div style={{color: 'var(--vbad)'}}>답: 필요한 청크 [{q.need.join(', ')}]가 입력에 없습니다. 붙은 청크를 따라가거나 근거 없는 문장을 잇게 됩니다.</div>
            )}
            <div className={s.legend}>{hasNeed ? '근거가 입력에 있습니다.' : '검색 단계에서 이미 빗나간 경우입니다.'}</div>
          </div>
        </div>
      ) : null}
    </Viz>
  );
}
