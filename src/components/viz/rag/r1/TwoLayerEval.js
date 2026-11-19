import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, styles as s} from '../../Viz';
import {box, tint} from './ragToy';

// 질문: 연차는 며칠인가요? 정답 문장: 연차는 15일입니다.
const CELLS = {
  '11': {name: '정상', answer: '15일입니다.', msg: '검색이 정답 문장이 있는 청크를 올렸고, 생성이 그 문장을 반영했습니다.', look: '고칠 곳이 없습니다.', tone: 'var(--vok)'},
  '10': {name: '생성이 따르지 않음', answer: '14일입니다.', msg: '입력에 “연차는 15일입니다”가 있는데 모델이 14일을 이었습니다. 검색은 실패하지 않았습니다.', look: '생성 쪽(프롬프트, 모델)을 먼저 봅니다.', tone: 'var(--vbad)'},
  '01': {name: '검색 실패가 가려짐', answer: '15일입니다.', msg: '정답 문장이 입력에 없는데 답이 우연히 맞았습니다. 입력에 없으면 그 사실을 맞힐 수단이 더 없으므로, 근거 없는 추측이 일치한 경우입니다.', look: '답만 보면 정상처럼 보이지만 검색을 먼저 봅니다.', tone: 'var(--vb)'},
  '00': {name: '검색 실패', answer: '16일입니다.', msg: '정답 문장이 입력에 없고, 입력에 없는 16일을 이었습니다.', look: '검색(청킹, k, 검색 방식)을 먼저 봅니다.', tone: 'var(--vbad)'},
};

export default function TwoLayerEval() {
  const [ret, setRet] = useState(1);
  const [gen, setGen] = useState(1);
  const key = `${ret}${gen}`;
  const c = CELLS[key];

  return (
    <Viz
      title="평가는 두 층으로 나눈다"
      caption="두 스위치로 네 가지 경우를 만들어 보세요. 정답은 연차는 15일입니다이고, 14일과 16일은 원문 예시의 값입니다. 한쪽만 보면 다른 쪽 실수를 가립니다."
    >
      <Controls>
        <span style={{fontSize: '0.85rem'}}>① 검색</span>
        <Btn on={ret === 1} onClick={() => setRet(1)}>정답 문장이 있는 청크를 올림</Btn>
        <Btn on={ret === 0} onClick={() => setRet(0)}>올리지 못함</Btn>
      </Controls>
      <Controls>
        <span style={{fontSize: '0.85rem'}}>② 최종 답</span>
        <Btn on={gen === 1} onClick={() => setGen(1)}>정답과 같음</Btn>
        <Btn on={gen === 0} onClick={() => setGen(0)}>정답과 다름</Btn>
      </Controls>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', fontSize: '0.85rem', margin: '6px 0'}}>
        <span style={box({padding: '3px 10px'})}>질문: 연차는 며칠인가요?</span>
        <span aria-hidden="true">→</span>
        <span style={box({padding: '3px 10px', borderColor: ret ? 'var(--vok)' : 'var(--vbad)'})}>
          검색: {ret ? '[연차는 15일입니다] 올림' : '정답 청크 없음'}
        </span>
        <span aria-hidden="true">→</span>
        <span style={box({padding: '3px 10px', borderColor: c.tone, background: tint(c.tone, 14)})}>답: {c.answer}</span>
      </div>
      <table className={s.grid}>
        <thead>
          <tr>
            <th />
            <th>답이 정답과 같음</th>
            <th>답이 정답과 다름</th>
          </tr>
        </thead>
        <tbody>
          {[1, 0].map((r) => (
            <tr key={r}>
              <td><b>검색 {r ? '성공' : '실패'}</b></td>
              {[1, 0].map((g) => (
                <td key={g} className={r === ret && g === gen ? s.cellOn : undefined}>
                  {CELLS[`${r}${g}`].name}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Note>
        <b>{c.name}.</b> {c.msg} {c.look}
      </Note>
    </Viz>
  );
}
