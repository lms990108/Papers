import React, {useMemo, useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note} from '../../Viz';
import {mulberry32} from '../../annSim';

const MOVIES = ['영화 A', '영화 B', '영화 C', '영화 D', '영화 E', '영화 F'];
const ITEMS = [];
MOVIES.forEach((m, mi) => {
  ITEMS.push({id: mi * 2, movie: mi, name: m + ' 리뷰 1'});
  ITEMS.push({id: mi * 2 + 1, movie: mi, name: m + ' 리뷰 2'});
});

const shuffled = (arr, seed) => {
  const a = arr.slice();
  const r = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(r() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
};

export default function LeakCheck() {
  const [byMovie, setByMovie] = useState(false);
  const [seed, setSeed] = useState(3);

  const isTest = useMemo(() => {
    const flag = {};
    if (byMovie) {
      shuffled([0, 1, 2, 3, 4, 5], seed).slice(0, 2).forEach((m) => {
        flag[m * 2] = true;
        flag[m * 2 + 1] = true;
      });
    } else {
      shuffled(ITEMS.map((x) => x.id), seed).slice(0, 4).forEach((id) => {
        flag[id] = true;
      });
    }
    return flag;
  }, [byMovie, seed]);

  const trainMovies = {};
  ITEMS.forEach((x) => {
    if (!isTest[x.id]) trainMovies[x.movie] = true;
  });
  const leaked = ITEMS.filter((x) => isTest[x.id] && trainMovies[x.movie]).length;

  const chip = (x) => {
    const t = !!isTest[x.id];
    const leak = t && trainMovies[x.movie];
    const color = t ? 'var(--vc)' : 'var(--vb)';
    return (
      <span key={x.id} style={{display: 'inline-block', margin: '2px 6px 2px 0', padding: '3px 9px', borderRadius: 8, border: '2px solid ' + (leak ? 'var(--vbad)' : color), fontSize: '0.8rem'}}>
        <b style={{color}}>{t ? '시험' : '학습'}</b> {x.name}{leak ? ' (누수)' : ''}
      </span>
    );
  };

  return (
    <Viz
      title="같은 영화의 리뷰가 양쪽에 있으면 시험이 새 문장이 아닙니다"
      caption="영화 여섯 편에 리뷰가 둘씩 있다고 둡니다(설명용 값). 학습 8개, 시험 4개로 나누는 두 방법을 비교해 보세요."
    >
      <Controls>
        <Btn on={!byMovie} onClick={() => setByMovie(false)}>리뷰 단위로 섞어서 나누기</Btn>
        <Btn on={byMovie} onClick={() => setByMovie(true)}>영화 단위로 통째로 나누기</Btn>
        <Btn onClick={() => setSeed(seed + 1)}>다시 나누기</Btn>
      </Controls>
      {MOVIES.map((m, mi) => (
        <div key={m} style={{margin: '4px 0'}}>{ITEMS.filter((x) => x.movie === mi).map(chip)}</div>
      ))}
      <Stats>
        <Stat label="시험 리뷰" value="4개" />
        <Stat label="학습에 같은 영화가 있는 시험 리뷰" value={leaked + '개'} tone={leaked > 0 ? 'bad' : 'good'} />
      </Stats>
      <Note>
        {leaked > 0
          ? '이 시험 리뷰들은 영화 이름만 외워도 맞힌 것처럼 보이므로 오류가 낮게 나옵니다. 섞기 전에 묶음 단위로 나눕니다.'
          : '같은 영화가 학습과 시험에 걸치지 않아서 시험이 새 영화의 리뷰입니다.'}
      </Note>
    </Viz>
  );
}
