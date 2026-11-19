import React, {useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note, styles as s} from '../../Viz';
import {box, tint} from './ragToy';

const INSTR = '다음 글만 근거로 답하세요. 글에 없으면 모른다고 하세요.';
const PIECES = [
  {id: 1, text: '연차는 15일입니다. 입사 첫해는 11일입니다.'},
  {id: 2, text: '병가는 연차와 별도입니다.'},
];
// 설명용 질문: 두 번째는 두 조각이 모두 있어야 답할 수 있게 만든 예이다.
const QS = [
  {text: '연차는 며칠인가요?', need: [1], ok: '15일입니다.', no: '필요한 조각이 입력에 없어, 글에 없다고 답해야 합니다.'},
  {text: '병가를 쓰면 연차 15일에서 빠지나요?', need: [1, 2], ok: '아니요. 병가는 연차와 별도입니다.', no: '한쪽 조각만 붙어서 병가와 연차의 관계를 알 수 없습니다.'},
];

export default function PromptAssembly() {
  const [qi, setQi] = useState(0);
  const [k, setK] = useState(2);
  const [after, setAfter] = useState(false);
  const [shown, setShown] = useState(99);
  const q = QS[qi];
  const picked = PIECES.slice(0, k);

  const piece = picked.map((p) => ({tag: `조각 [${p.id}]`, text: `[${p.id}] ${p.text}`, color: 'var(--vok)'}));
  const blocks = [{tag: '지시', text: INSTR, color: 'var(--vc)'}]
    .concat(after ? [{tag: '질문', text: `질문: ${q.text}`, color: 'var(--va)'}].concat(piece) : piece.concat([{tag: '질문', text: `질문: ${q.text}`, color: 'var(--va)'}]))
    .concat([{tag: '생성 시작', text: '답:', color: 'var(--vb)'}]);
  const n = Math.min(shown, blocks.length);
  const chunkText = picked.map((p) => `[${p.id}] ${p.text}`).join('\n');
  const qText = `질문: ${q.text}`;
  const full = [INSTR].concat(after ? [qText, chunkText] : [chunkText, qText], ['답:']).join('\n\n');
  const gotAll = q.need.every((id) => picked.some((p) => p.id === id));

  return (
    <Viz
      title="프롬프트 조립"
      caption="한 칸씩 붙여 가며 조각과 질문이 한 입력이 되는 과정을 보세요. 지시문은 원문의 예이고, 두 번째 질문은 두 조각이 모두 필요하도록 만든 설명용 예입니다. 모델은 마지막 답: 뒤에서부터 토큰을 잇습니다."
    >
      <Controls>
        {QS.map((x, i) => (
          <Btn key={x.text} on={i === qi} onClick={() => setQi(i)}>
            {x.text}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="k (붙일 조각 수)" min={1} max={2} value={k} onChange={setK} />
        <Btn on={!after} onClick={() => setAfter(false)}>조각을 질문 앞에</Btn>
        <Btn on={after} onClick={() => setAfter(true)}>조각을 질문 뒤에</Btn>
      </Controls>
      <Controls>
        <Btn onClick={() => setShown(0)}>처음부터</Btn>
        <Btn onClick={() => setShown(Math.min(n + 1, blocks.length))}>한 칸 붙이기</Btn>
        <Btn onClick={() => setShown(99)}>전부 보기</Btn>
        <span style={{fontSize: '0.85rem'}}>{n} / {blocks.length}칸</span>
      </Controls>
      <div style={{display: 'grid', gap: 6}}>
        {blocks.map((b, i) => (
          <div
            key={i}
            style={box({
              borderLeft: `5px solid ${b.color}`,
              opacity: i < n ? 1 : 0.18,
              background: i < n ? tint(b.color, 9) : undefined,
              whiteSpace: 'pre-wrap',
            })}
          >
            <span className={s.legend} style={{display: 'inline', marginRight: 8, fontWeight: 600}}>{b.tag}</span>
            {b.text}
          </div>
        ))}
      </div>
      <Stats>
        <Stat label="입력 글자 수(공백 포함)" value={full.length} />
        <Stat label="필요한 조각이 붙었나" value={`${q.need.filter((id) => picked.some((p) => p.id === id)).length} / ${q.need.length}`} tone={gotAll ? 'good' : 'bad'} />
        <Stat label="답: 뒤에 이을 수 있는 말" value={gotAll ? q.ok : '근거 부족'} tone={gotAll ? 'good' : 'bad'} />
      </Stats>
      <Note>
        {gotAll ? '근거 문장이 입력 칸에 있으므로 모델이 그 문장을 읽고 이을 수 있습니다. 반드시 베끼지는 않습니다.' : q.no}
        {' '}순서를 바꾸면 어텐션이 보는 자리가 바뀝니다. 어떤 순서가 항상 최적인지는 이 그림이 답하지 않습니다.
      </Note>
    </Viz>
  );
}
