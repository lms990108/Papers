import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const CASES = [
  {
    id: 'cls', name: '리뷰 + 긍정/부정', head: ['입력', '레이블'],
    rows: [['연기가 좋다', '긍정'], ['결말이 나쁘다', '부정']],
    kind: '지도 학습 (분류)', label: '있음', err: '잴 수 있음', good: true,
    note: '레이블이 칸의 이름입니다. 예측한 칸이 맞았는지로 오차를 잽니다.',
  },
  {
    id: 'reg', name: '리뷰 + 별점', head: ['입력', '레이블'],
    rows: [['연기가 좋다', '별점 4'], ['결말이 나쁘다', '별점 2']],
    kind: '지도 학습 (회귀)', label: '있음', err: '잴 수 있음', good: true,
    note: '레이블이 수입니다. 예측이 별점에서 얼마나 떨어졌는지로 오차를 잽니다.',
  },
  {
    id: 'self', name: '다음 단어 가리기', head: ['입력 (설명용 문장)', '가린 단어'],
    rows: [['오늘 날씨', '좋다'], ['연기가', '좋다']],
    kind: '자기 지도 학습', label: '데이터 안에서 만듦', err: '잴 수 있음', good: true,
    note: '다음 단어는 문장 안에 이미 적혀 있습니다. 그 단어를 레이블로 두면 사람이 붙이지 않았는데도 지도 학습의 꼴입니다.',
  },
  {
    id: 'un', name: '리뷰만 있고 묶기', head: ['입력', '레이블'],
    rows: [['연기가 좋다', '?'], ['결말이 나쁘다', '?']],
    kind: '비지도 학습', label: '없음', err: '잴 수 없음', good: false,
    note: '묶음에 붙일 이름이 데이터에 없어서 예측과 답의 차이를 잴 수 없습니다.',
  },
  {
    id: 'rl', name: '행동 뒤에 나중에 점수', head: ['한 일', '점수'],
    rows: [['행동 1', '아직 없음'], ['행동 2', '아직 없음'], ['이어서 한 행동들', '나중에 붙음']],
    kind: '강화 학습', label: '바로는 없음', err: '바로는 잴 수 없음', good: false,
    note: '행동마다 정답이 바로 주어지지 않고, 이어진 행동의 결과로 나중에 점수가 붙습니다.',
  },
];

export default function LearningKinds() {
  const [id, setId] = useState('cls');
  const c = CASES.find((q) => q.id === id) || CASES[0];
  return (
    <Viz
      title="데이터에 무엇이 붙어 있느냐로 학습의 종류가 갈립니다"
      caption="상황을 골라 보세요. 레이블이 있어서 오차를 잴 수 있으면 지도 학습의 꼴입니다."
    >
      <Controls>
        {CASES.map((q) => (
          <Btn key={q.id} on={q.id === id} onClick={() => setId(q.id)}>{q.name}</Btn>
        ))}
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>{c.head.map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {c.rows.map((r) => (
            <tr key={r.join()}>
              {r.map((v, k) => (
                <td key={k} className={v === '?' ? s.cellOn : undefined}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="레이블" value={c.label} tone={c.good ? 'good' : 'bad'} />
        <Stat label="오차" value={c.err} tone={c.good ? 'good' : 'bad'} />
        <Stat label="이름" value={c.kind} />
      </Stats>
      <Note>{c.note}</Note>
    </Viz>
  );
}
