import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note, Bar, fmt} from '../../Viz';

export default function StarLine() {
  const [x1, setX1] = useState(1);
  const [x2, setX2] = useState(0);
  const [dlt, setDlt] = useState(1);

  const star = (a, b) => a - b + 3;
  const heightGain = (2 / 3) * dlt;

  return (
    <Viz
      title="별점 식에도 되돌아감이 있을까요"
      caption="y = x1 - x2 + 3에서 좋다를 한 번씩 늘려 보세요. 키의 직선은 기울기 2/3이라 부모가 늘어난 양의 2/3만 자식에게 옮겨 갑니다. 별점 식은 기울기 1입니다."
    >
      <Controls>
        <Slider label="좋다 횟수 x1" min={0} max={5} step={1} value={x1} onChange={setX1} />
        <Slider label="나쁘다 횟수 x2" min={0} max={5} step={1} value={x2} onChange={setX2} />
      </Controls>
      <Stats>
        <Stat label="별점 y = x1 - x2 + 3" value={String(star(x1, x2))} />
        <Stat label="x1을 1 늘리면 y" value={String(star(x1 + 1, x2))} />
        <Stat label="y의 늘어난 양" value={String(star(x1 + 1, x2) - star(x1, x2))} />
      </Stats>
      <Controls>
        <Slider label="입력이 늘어난 양" min={1} max={6} step={1} value={dlt} onChange={setDlt} />
      </Controls>
      <Bar label={'부모 +' + dlt + '인치'} value={dlt} max={6} color="var(--va)" text={String(dlt)} />
      <Bar label="자식 (기울기 2/3)" value={heightGain} max={6} color="var(--vb)" text={fmt(heightGain, 2)} />
      <Bar label={'좋다 +' + dlt + '번'} value={dlt} max={6} color="var(--va)" text={String(dlt)} />
      <Bar label="별점 (기울기 1)" value={dlt} max={6} color="var(--vok)" text={String(dlt)} />
      <Note>
        키: 부모가 +{dlt}인치 늘면 자식은 +{fmt(heightGain, 2)}인치입니다. 그 차이가 평균 쪽으로 돌아간 양입니다. 별점: 좋다가 +{dlt}번 늘면 별점도 +{dlt}이고, 돌아갈 평균이 없습니다. 이름만 키의 자료에서 가져왔습니다.
      </Note>
    </Viz>
  );
}
