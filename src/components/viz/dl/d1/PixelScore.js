import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {dot} from './dlmath';

// 원본: 7용 줄과 1용 줄의 가중치는 계산을 보이려고 손으로 고른 수
const W7 = [1, 1, 1, -1, -1, 1, -1, 1, -1];
const W1 = [-1, 1, -1, -1, 1, -1, -1, 1, -1];
const IMG7 = [1, 1, 1, 0, 0, 1, 0, 1, 0];
const IMG1 = [0, 1, 0, 0, 1, 0, 0, 1, 0];

const pixStyle = (on) => ({
  width: 46,
  height: 46,
  border: '1px solid var(--ifm-color-emphasis-400)',
  borderRadius: 6,
  fontSize: '1.05rem',
  fontWeight: 700,
  cursor: 'pointer',
  background: on ? 'var(--va)' : 'var(--ifm-background-color)',
  color: on ? '#fff' : 'var(--ifm-color-emphasis-700)',
});

export default function PixelScore() {
  const [x, setX] = useState(IMG7);
  const toggle = (i) => setX(x.map((v, j) => (j === i ? 1 - v : v)));
  const s7 = dot(W7, x);
  const s1 = dot(W1, x);
  const read = s7 > s1 ? '7' : s1 > s7 ? '1' : '정하지 못함';
  const rows = [
    ['7용 가중치', W7, false],
    ['7용 곱', W7.map((w, i) => w * x[i]), true],
    ['1용 가중치', W1, false],
    ['1용 곱', W1.map((w, i) => w * x[i]), true],
  ];

  return (
    <Viz
      title="픽셀 아홉 개를 점수 둘로 바꾸기"
      caption="칸을 눌러 밝기를 0과 1로 바꿉니다. 가중치는 원문에서 계산을 보이려고 손으로 고른 수이고, 실제로는 학습이 채웁니다."
    >
      <Controls>
        <Btn on={x.join() === IMG7.join()} onClick={() => setX(IMG7)}>
          원문의 그림
        </Btn>
        <Btn on={x.join() === IMG1.join()} onClick={() => setX(IMG1)}>
          가운데 세로줄
        </Btn>
        <Btn on={x.every((v) => v === 0)} onClick={() => setX([0, 0, 0, 0, 0, 0, 0, 0, 0])}>
          모두 어둡게
        </Btn>
      </Controls>
      <div className={s.two}>
        <div>
          <div className={s.title}>그림 (눌러서 바꾸기)</div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 46px)', gap: 4}}>
            {x.map((v, i) => (
              <button
                key={i}
                type="button"
                style={pixStyle(v === 1)}
                onClick={() => toggle(i)}
                aria-label={`${Math.floor(i / 3) + 1}행 ${(i % 3) + 1}열 밝기 ${v}`}
              >
                {v}
              </button>
            ))}
          </div>
          <Note>한 줄로 펴면 [{x.join(', ')}], 길이 9입니다.</Note>
        </div>
        <div style={{overflowX: 'auto'}}>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>칸</th>
                {x.map((_, i) => (
                  <th key={i}>{i + 1}</th>
                ))}
                <th>합</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>밝기</td>
                {x.map((v, i) => (
                  <td key={i}>{v}</td>
                ))}
                <td />
              </tr>
              {rows.map(([name, arr, isProd]) => (
                <tr key={name}>
                  <td>{name}</td>
                  {arr.map((v, i) => (
                    <td key={i} className={isProd && v !== 0 ? s.cellOn : undefined}>
                      {v}
                    </td>
                  ))}
                  <td>
                    <b>{isProd ? arr.reduce((a, b) => a + b, 0) : ''}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Stats>
        <Stat label="7 점수" value={s7} tone={s7 > s1 ? 'good' : undefined} />
        <Stat label="1 점수" value={s1} tone={s1 > s7 ? 'good' : undefined} />
        <Stat label="큰 점수의 줄" value={read} />
      </Stats>
      <Note>밝은 칸에서만 곱이 0이 아닙니다. 어두운 칸(밝기 0)의 가중치는 이 그림에서는 합에 더해지지 않습니다.</Note>
    </Viz>
  );
}
