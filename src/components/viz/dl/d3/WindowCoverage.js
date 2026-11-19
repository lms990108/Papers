import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {outSize} from './util';

// 원래 입력의 각 픽셀이 몇 개의 창에 들어가는지 센다.
function coverage(N, K, S, P) {
  const O = outSize(N, K, S, P);
  const cnt = Array.from({length: N}, () => Array(N).fill(0));
  for (let r = 0; r < O; r++)
    for (let c = 0; c < O; c++)
      for (let i = 0; i < K; i++)
        for (let j = 0; j < K; j++) {
          const a = r * S + i - P;
          const b = c * S + j - P;
          if (a >= 0 && a < N && b >= 0 && b < N) cnt[a][b] += 1;
        }
  return {cnt, O};
}

export default function WindowCoverage() {
  const [v, setV] = useState({N: 5, K: 3, S: 1, P: 0});
  const {N, K, S, P} = v;
  const set = (key) => (x) => setV({...v, [key]: x});
  const {cnt, O} = coverage(N, K, S, P);
  const flat = cnt.reduce((a, row) => a.concat(row), []);
  const mx = Math.max(1, ...flat);
  const corner = cnt[0][0];
  const mid = cnt[Math.floor(N / 2)][Math.floor(N / 2)];

  return (
    <Viz
      title="각 픽셀이 몇 개의 창에 들어갈까"
      caption="칸의 숫자는 그 픽셀을 덮는 창의 수입니다. 기본값(5, 3, 1, 0)이 본문의 표입니다. 패딩을 늘리면 가장자리가 더 많은 창에 들어가지만, 두른 칸은 0이라 새 내용은 없습니다."
    >
      <Controls>
        <Slider label="입력 N" min={4} max={8} value={N} onChange={set('N')} />
        <Slider label="커널 K" min={1} max={5} value={K} onChange={set('K')} />
        <Slider label="스트라이드 S" min={1} max={3} value={S} onChange={set('S')} />
        <Slider label="패딩 P" min={0} max={2} value={P} onChange={set('P')} />
        <Btn onClick={() => setV({N: 5, K: 3, S: 1, P: 0})}>본문 예</Btn>
      </Controls>
      {O === 0 ? (
        <Note>창이 놓일 자리가 없습니다. 커널을 줄이거나 패딩을 늘려 보세요.</Note>
      ) : (
        <>
          <table className={s.grid} style={{maxWidth: 420, margin: '8px auto 0'}}>
            <tbody>
              {cnt.map((row, i) => (
                <tr key={i}>
                  {row.map((n, j) => (
                    <td key={j} style={{background: `color-mix(in srgb, var(--va) ${Math.round((n / mx) * 55)}%, transparent)`, fontWeight: n === mx ? 700 : 400}}>{n}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <Stats>
            <Stat label="창 자리 수" value={`${O}×${O} = ${O * O}`} />
            <Stat label="모서리 픽셀이 든 창" value={corner} tone={corner === 0 ? 'bad' : undefined} />
            <Stat label="한가운데 픽셀이 든 창" value={mid} />
          </Stats>
          {corner === 0 ? <Note>모서리 픽셀이 어느 창에도 들어가지 않아 출력에 반영되지 않습니다.</Note> : null}
        </>
      )}
    </Viz>
  );
}
