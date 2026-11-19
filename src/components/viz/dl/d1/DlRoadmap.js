import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, styles as s} from '../../Viz';

// 이 섹션의 글 목록을 순서대로 묶은 것 (제목은 목차 그대로)
const GROUPS = [
  {name: '신경망의 몸', pages: ['신경망 (neural network)', '층 (layer)', '신경망의 구조 (neural network)']},
  {
    name: '가중치 채우기',
    pages: ['경사하강법 (gradient descent)', '확률적 경사하강법 (SGD)', '역전파 (backpropagation)', '기울기 소실 (vanishing gradient)', '용량과 정칙화 (capacity, regularization)'],
  },
  {
    name: '합성곱',
    pages: ['합성곱 신경망 (convolutional neural network, CNN)', '가중치 공유 (weight sharing)', '서브샘플링 (subsampling)', 'LeNet-5'],
  },
  {name: '생성 모델', pages: ['Multimodal', 'Diffusion, flow']},
  {name: '서빙과 병렬화', pages: ['Continuous batching', 'Parallelism']},
  {name: '평가', pages: ['Evaluation']},
];

export default function DlRoadmap() {
  const [g, setG] = useState(0);
  const cur = GROUPS[g];
  const before = GROUPS.slice(0, g).reduce((a, x) => a + x.pages.length, 0);

  return (
    <Viz
      title="딥러닝 섹션의 지도"
      caption="이 섹션의 글을 목차 순서대로 묶은 지도입니다. 묶음을 누르면 그 묶음에 들어 있는 글이 보입니다."
    >
      <Controls>
        {GROUPS.map((x, i) => (
          <Btn key={x.name} on={i === g} onClick={() => setG(i)}>
            {i + 1}. {x.name}
          </Btn>
        ))}
      </Controls>
      <ol start={before + 1} style={{margin: '0 0 0 1.2rem', padding: 0, lineHeight: 1.9}}>
        {cur.pages.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>
      <Note>
        {g === 0
          ? '곱하고 더하는 한 단계(층)를 쌓고, 어떻게 이을지(구조)를 정합니다. 여기서부터 읽습니다.'
          : `${g + 1}번째 묶음입니다. 아래 목록의 링크로 바로 이동할 수 있습니다.`}
      </Note>
      <span className={s.legend}>
        <span>글 {GROUPS.reduce((a, x) => a + x.pages.length, 0)}편 · 묶음 {GROUPS.length}개</span>
      </span>
    </Viz>
  );
}
