import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, fmt} from '../../Viz';

function Cand({name, tr, va, setTr, setVa}) {
  return (
    <div>
      <div style={{fontWeight: 600, margin: '8px 0 4px'}}>{name}</div>
      <Controls>
        <Slider label="학습 6개 중 맞힘" min={0} max={6} step={1} value={tr} onChange={setTr} />
        <Slider label="검증 2개 중 맞힘" min={0} max={2} step={1} value={va} onChange={setVa} />
      </Controls>
      <Bar label="학습 오류" value={1 - tr / 6} max={1} color="var(--vb)" text={fmt(1 - tr / 6, 3)} />
      <Bar label="검증 오류" value={1 - va / 2} max={1} color="var(--va)" text={fmt(1 - va / 2, 2)} />
    </div>
  );
}

export default function OverfitReadout() {
  const [newTr, setNewTr] = useState(6);
  const [newVa, setNewVa] = useState(0);
  const [oldTr, setOldTr] = useState(5);
  const [oldVa, setOldVa] = useState(1);

  const eNew = 1 - newVa / 2;
  const eOld = 1 - oldVa / 2;
  const keep = eNew === eOld ? '같음' : eNew < eOld ? '새 가중치' : '이전 가중치';
  const gap = eNew - (1 - newTr / 6);

  return (
    <Viz
      title="학습 오류가 0이어도 보고할 수는 검증 쪽입니다"
      caption="두 가중치의 학습과 검증 결과를 바꿔 보세요. 기본값은 원문의 경우로, 새 가중치는 학습 6개를 다 맞히고 검증 둘을 다 틀립니다. 이전 가중치의 검증 결과는 설명용 값입니다."
    >
      <Controls>
        <Btn onClick={() => {setNewTr(6); setNewVa(0);}}>새: 학습 0, 검증 둘 다 틀림</Btn>
        <Btn onClick={() => setNewVa(1)}>새: 검증 하나만 맞힘</Btn>
      </Controls>
      <Cand name="새 가중치" tr={newTr} va={newVa} setTr={setNewTr} setVa={setNewVa} />
      <Cand name="이전 가중치" tr={oldTr} va={oldVa} setTr={setOldTr} setVa={setOldVa} />
      <Stats>
        <Stat label="새 가중치: 검증 오류 - 학습 오류" value={fmt(gap, 2)} tone={gap > 0.3 ? 'bad' : undefined} />
        <Stat label="검증이 더 낮아 남기는 쪽" value={keep} tone={keep === '같음' ? undefined : 'good'} />
      </Stats>
      <Note>
        {newTr === 6 && newVa === 0
          ? '학습 0과 검증 1이 같이 나오면 빈칸이 여섯 문장에 붙어 검증을 놓친 것입니다. 보고할 수는 학습 0이 아니라 검증 1 쪽입니다.'
          : '시험 둘은 이 선택에 들어가지 않습니다. 남길 쪽을 정한 뒤에 시험 오류를 한 번 적습니다.'}
        {keep === '같음' ? ' 검증이 같으면 이 둘만으로는 고를 수 없습니다.' : ''}
      </Note>
    </Viz>
  );
}
