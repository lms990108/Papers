import React, {useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import LatticeSvg from './LatticeSvg';
import {PEN0, ARC_KEYS, LABELS, LABEL_NAME, SPAN_NAME, clonePen, listPaths, bestPath} from './util';

const SEGS = [
  ['0-1', '1-2', '2-3'],
  ['0-2', '2-3'],
  ['0-1', '1-3'],
];

export default function ArcPenaltyLab() {
  const [pen, setPen] = useState(PEN0);
  const [sel, setSel] = useState(['0-2', '4']);
  const [junk, setJunk] = useState(true);
  const allowed = junk ? LABELS : ['1', '4'];
  const nodes = [0, 1, 2, 3];
  const best = bestPath(listPaths(pen, nodes, allowed));
  const onLab = {};
  best.arcs.forEach((a) => {
    onLab[a[0]] = a[1];
  });

  const arcs = ARC_KEYS.map((k) => ({
    key: k,
    on: !!onLab[k],
    lines: allowed.map((l) => ({text: `${LABEL_NAME[l]} · ${fmt(pen[k][l], 1)}`, on: onLab[k] === l})),
  }));

  const segCost = (seg) => seg.reduce((a, k) => a + Math.min.apply(null, allowed.map((l) => pen[k][l])), 0);
  const costs = SEGS.map(segCost);
  const minIdx = costs.indexOf(Math.min.apply(null, costs));
  const reading = best.arcs
    .filter((a) => a[1] !== 'j')
    .map((a) => a[1])
    .join('');
  const changed = JSON.stringify(pen) !== JSON.stringify(PEN0);

  const setVal = (x) => {
    const p = clonePen(pen);
    p[sel[0]][sel[1]] = x;
    setPen(p);
  };

  return (
    <Viz
      title="인식기의 벌점을 바꿔 가장 싼 분할 찾기"
      caption="표에서 칸을 눌러 고르고 슬라이더로 벌점을 바꿔 보세요(작을수록 그 클래스로 읽을 만하다는 뜻). 기본값은 원본 표입니다. 쓰레기 호를 막으면 문법을 합성한 것과 같습니다."
    >
      <Controls>
        <Btn on={junk} onClick={() => setJunk(true)}>쓰레기 허용 (문법 전)</Btn>
        <Btn on={!junk} onClick={() => setJunk(false)}>숫자만 (문법 뒤)</Btn>
        <Btn
          onClick={() => {
            setPen(PEN0);
            setSel(['0-2', '4']);
          }}
        >
          원본 값으로
        </Btn>
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>호</th>
            <th>잉크</th>
            <th>1</th>
            <th>4</th>
            <th>쓰레기</th>
          </tr>
        </thead>
        <tbody>
          {ARC_KEYS.map((k) => (
            <tr key={k}>
              <td>{k.replace('-', '→')}</td>
              <td>{SPAN_NAME[k]}</td>
              {LABELS.map((l) => {
                const on = sel[0] === k && sel[1] === l;
                const off = !junk && l === 'j';
                return (
                  <td key={l} className={on ? s.cellOn : undefined} style={off ? {opacity: 0.4} : undefined}>
                    <button
                      type="button"
                      onClick={() => setSel([k, l])}
                      aria-label={`${k} ${LABEL_NAME[l]} 벌점 ${fmt(pen[k][l], 1)} 선택`}
                      style={{all: 'unset', cursor: 'pointer', display: 'block', width: '100%'}}
                    >
                      {fmt(pen[k][l], 1)}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <Controls>
        <Slider
          label={`선택: ${sel[0].replace('-', '→')} ${LABEL_NAME[sel[1]]}`}
          min={0}
          max={6}
          step={0.1}
          value={pen[sel[0]][sel[1]]}
          onChange={setVal}
          format={(x) => fmt(x, 1)}
        />
      </Controls>
      <LatticeSvg arcs={arcs} label="호마다 클래스별 벌점이 적힌 격자. 굵은 호가 가장 싼 경로입니다." />
      <table className={s.grid}>
        <thead>
          <tr>
            <th>분할</th>
            <th>{junk ? '쓰레기 포함, 호마다 최저' : '숫자만'}</th>
          </tr>
        </thead>
        <tbody>
          {SEGS.map((seg, i) => (
            <tr key={i}>
              <td className={i === minIdx ? s.cellOn : undefined}>{seg.map((k) => k.replace('-', '→')).join(', ')}</td>
              <td className={i === minIdx ? s.cellOn : undefined}>{fmt(costs[i], 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="최소 비용" value={fmt(best.cost, 1)} />
        <Stat label="읽은 글자" value={reading ? `“${reading}”` : '없음'} tone={reading === '41' ? 'good' : reading ? undefined : 'bad'} />
      </Stats>
      <Note>
        {junk && !reading
          ? '쓰레기 호만으로 이루어진 경로가 이겼습니다. 읽어 낸 글자가 하나도 없으니 문자열 인식에서는 쓸 수 없고, 그래서 문법이 이런 경로를 지웁니다.'
          : changed
            ? '표의 값 하나만 바뀌어도 읽은 결과가 달라질 수 있습니다. 0→2의 4를 4.5로 올려 보세요(연습 문제 2).'
            : '기본값에서 숫자만 읽으면 0→2의 4와 2→3의 1, 곧 “41”이고 비용은 0.9입니다.'}
      </Note>
    </Viz>
  );
}
