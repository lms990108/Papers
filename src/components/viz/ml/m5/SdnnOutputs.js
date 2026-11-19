import React, {useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {SD_LABELS, SD_OUT, sdRead, sdForced} from './util';

const TARGETS = ['41', '4', '1', '14'];
const copy = (o) => o.map((r) => r.slice());

export default function SdnnOutputs() {
  const [out, setOut] = useState(SD_OUT);
  const [sel, setSel] = useState([3, 1]);
  const [target, setTarget] = useState('41');

  const rd = sdRead(out);
  const al = sdForced(out, target);
  const diff = al ? al.aligned.map((a, i) => (a !== rd.read[i] ? i : -1)).filter((i) => i >= 0) : [];
  const err = al ? al.cost - rd.cost : 0;
  const setVal = (v) => {
    const o = copy(out);
    o[sel[0]][sel[1]] = v;
    setOut(o);
  };
  const edited = JSON.stringify(out) !== JSON.stringify(SD_OUT);

  return (
    <Viz
      title="위치별 벌점 표: 최솟값만 찍으면 틀리는 이유"
      caption="위치마다 클래스(공백 _, 4, 1)의 벌점입니다(작을수록 그 클래스로 읽을 만함). 주황 칸이 위치별 최솟값, 파란 테두리가 정답 라벨로 강제 정렬한 경로입니다. 칸을 눌러 벌점을 바꿔 보세요. 기본값은 원본 표입니다."
    >
      <Controls>
        {TARGETS.map((t) => (
          <Btn key={t} on={t === target} onClick={() => setTarget(t)}>정답 “{t}”</Btn>
        ))}
        <Btn onClick={() => { setOut(SD_OUT); setSel([3, 1]); }}>원본 값으로</Btn>
        <Btn
          onClick={() => {
            const o = copy(SD_OUT);
            o[3][1] = 3.0;
            setOut(o);
            setTarget('41');
            setSel([3, 1]);
          }}
        >
          위치 3의 4를 3.0으로 (연습 문제 3)
        </Btn>
      </Controls>
      <div style={{overflowX: 'auto'}}>
        <table className={s.grid}>
          <thead>
            <tr>
              <th>위치</th>
              {out.map((_, i) => (<th key={i}>{i}</th>))}
            </tr>
          </thead>
          <tbody>
            {SD_LABELS.map((lab, c) => (
              <tr key={lab}>
                <th>{lab === '_' ? '_ (공백)' : lab}</th>
                {out.map((row, i) => {
                  const isMin = rd.read[i] === lab;
                  const isAl = al && al.aligned[i] === lab;
                  const isSel = sel[0] === i && sel[1] === c;
                  return (
                    <td
                      key={i}
                      className={isMin ? s.cellOn : undefined}
                      style={{
                        boxShadow: isAl ? 'inset 0 0 0 2px var(--va)' : undefined,
                        outline: isSel ? '2px dashed var(--ifm-font-color-base)' : undefined,
                        outlineOffset: -3,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setSel([i, c])}
                        aria-label={`위치 ${i}, 클래스 ${lab}, 벌점 ${fmt(row[c], 1)} 선택`}
                        style={{all: 'unset', cursor: 'pointer', display: 'block', width: '100%'}}
                      >
                        {fmt(row[c], 1)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Controls>
        <Slider
          label={`선택: 위치 ${sel[0]}, ${SD_LABELS[sel[1]] === '_' ? '공백' : SD_LABELS[sel[1]]}`}
          min={0} max={4} step={0.1}
          value={out[sel[0]][sel[1]]}
          onChange={setVal}
          format={(v) => fmt(v, 1)}
        />
      </Controls>
      <Stats>
        <Stat label="위치별 최솟값" value={rd.read.join('')} />
        <Stat label="합치고 공백 지움" value={rd.collapsed ? `“${rd.collapsed}”` : '(없음)'} tone={rd.collapsed === target ? 'good' : 'bad'} />
        <Stat label="최소 비용" value={fmt(rd.cost, 1)} />
      </Stats>
      {al ? (
        <Stats>
          <Stat label={`정답 “${target}”로 강제 정렬`} value={al.aligned.join('')} tone="good" />
          <Stat label="정렬 비용" value={fmt(al.cost, 1)} />
          <Stat label="오차 = 정렬 비용 − 최소 비용" value={fmt(err < 1e-9 ? 0 : err, 1)} tone={err < 1e-9 ? 'good' : 'bad'} />
        </Stats>
      ) : (
        <Note>이 위치 수로는 정답 “{target}”를 만들 수 없습니다.</Note>
      )}
      <Note>
        {al && diff.length
          ? diff.map((i) => `위치 ${i}: 정답 경로는 ${al.aligned[i] === '_' ? '공백' : al.aligned[i]}, 최소 경로는 ${rd.read[i] === '_' ? '공백' : rd.read[i]}.`).join(' ') +
            ' 비터비로 읽으면 정답 경로 쪽 칸에 +1, 최소 경로 쪽 칸에 −1이 가서, 학습이 정답 쪽 벌점을 내리고 최소 경로 쪽 벌점을 올립니다. 사람이 위치를 알려 주지 않았는데도 어긋난 자리가 나옵니다.'
          : al
            ? '정렬 경로가 위치별 최솟값과 같은 자리뿐입니다. 오차가 0이면 기울기도 없습니다.'
            : ''}
        {edited ? '' : ' 위치별 최솟값을 그대로 합치면 “411”이 되어, 위치 3의 1이 4 옆에 글자 하나를 더 만듭니다.'}
      </Note>
    </Viz>
  );
}
