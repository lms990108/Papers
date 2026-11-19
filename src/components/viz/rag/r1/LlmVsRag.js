import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, styles as s} from '../../Viz';
import {box, tint} from './ragToy';

// 설명용 값: 바뀐 규정의 일수(18일)는 장면을 보이려고 정한 값이다.
export default function LlmVsRag() {
  const [changed, setChanged] = useState(false);
  const [wrong, setWrong] = useState(false);
  const days = changed ? 18 : 15;
  const doc = `연차는 ${days}일입니다.`;

  return (
    <Viz
      title="규정이 바뀌면 무엇을 고치나"
      caption="질문은 “연차는 며칠인가요?”입니다. 규정 바꾸기와 검색 틀리게 하기를 눌러 보세요. 바뀐 일수 18일은 설명용 값입니다."
    >
      <Controls>
        <Btn on={changed} onClick={() => setChanged(!changed)}>
          규정 바꾸기 ({changed ? '바뀜' : '그대로'})
        </Btn>
        <Btn on={wrong} onClick={() => setWrong(!wrong)}>
          검색이 병가 청크를 가져옴 ({wrong ? '켜짐' : '꺼짐'})
        </Btn>
      </Controls>
      <div className={s.two}>
        <div style={box()}>
          <b>LLM만</b>
          <div className={s.legend}>모델 안: 학습에 들어간 글(규정 없음)</div>
          <div style={box({marginTop: 6, background: tint('var(--vbad)', 10)})}>답: 보통 15일입니다. (근거 없는 문장)</div>
          <Note>
            {changed
              ? '규정 문서가 바뀌어도 모델 안의 글은 그대로입니다. 반영하려면 다시 학습해야 하고, 학습하지 않으면 새 규정은 반영되지 않습니다.'
              : '규정이 학습에 없어서 근거 없이 잇습니다. 규정이 바뀌면 다시 학습하거나 잊힙니다.'}
          </Note>
        </div>
        <div style={box()}>
          <b>RAG</b>
          <div className={s.legend}>문서 저장소(청크)</div>
          <div style={box({marginTop: 6, background: changed ? tint('var(--vb)', 18) : undefined})}>
            [1] {doc} 입사 첫해는 11일입니다.
            <br />
            [2] 병가는 연차와 별도입니다.
          </div>
          <div className={s.legend} style={{marginTop: 6}}>검색 결과(k = 1)</div>
          <div style={box({marginTop: 2})}>{wrong ? '[2] 병가는 연차와 별도입니다.' : `[1] ${doc} 입사 첫해는 11일입니다.`}</div>
          <div style={box({marginTop: 6, borderColor: wrong ? 'var(--vbad)' : 'var(--vok)', background: tint(wrong ? 'var(--vbad)' : 'var(--vok)', 10)})}>
            {wrong ? '답: 병가는 연차와 별도입니다. (질문의 답이 아님)' : `답: 연차는 ${days}일입니다.`}
          </div>
          <Note>
            {wrong
              ? '검색이 틀린 청크를 가져오면 생성은 그 청크를 근거로 씁니다. 틀린 답은 검색이 틀린 청크를 가져온 뒤 이은 문장일 수도 있습니다.'
              : changed
              ? '문서만 바꾸었는데 검색 결과가 바뀌었고, 답이 따라 바뀝니다.'
              : '문서가 그대로이면 검색 결과도 같습니다.'}
          </Note>
        </div>
      </div>
    </Viz>
  );
}
