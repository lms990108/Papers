import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const COLORS = ['var(--va)', 'var(--vb)', 'var(--vc)', 'var(--vok)', 'var(--vbad)', 'var(--ifm-color-emphasis-600)', 'var(--va)', 'var(--vb)'];

export default function PipelineBubble() {
  const [S, setS] = useState(2);
  const [m, setM] = useState(4);

  const rounds = m + S - 1;
  const cells = S * rounds;
  const idle = S * rounds - S * m;
  const ratio = cells > 0 ? idle / cells : NaN;

  return (
    <Viz
      title="pipeline parallelism의 bubble"
      caption="행이 장(층 순서), 열이 회전입니다. 칸의 숫자는 그 회전에 그 장이 처리하는 microbatch이고 '쉼'이 bubble입니다. 장 2개와 microbatch 4개가 본문의 예입니다. 장 3개 이상은 같은 규칙을 넓힌 설명용 계산입니다."
    >
      <Controls>
        <Slider label="장(층) 수" min={2} max={4} value={S} onChange={setS} />
        <Slider label="microbatch 수" min={1} max={8} value={m} onChange={setM} />
        <Btn
          onClick={() => {
            setS(2);
            setM(4);
          }}
        >
          본문 (2, 4)
        </Btn>
        <Btn
          onClick={() => {
            setS(2);
            setM(2);
          }}
        >
          연습 3 (2, 2)
        </Btn>
        <Btn
          onClick={() => {
            setS(2);
            setM(1);
          }}
        >
          microbatch 1개
        </Btn>
      </Controls>
      <div style={{overflowX: 'auto'}}>
        <table className={s.grid}>
          <thead>
            <tr>
              <th>회전</th>
              {Array.from({length: rounds}, (_, r) => (
                <th key={r}>{r + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({length: S}, (_, k) => (
              <tr key={k}>
                <th>{k + 1}장</th>
                {Array.from({length: rounds}, (_, r) => {
                  const mb = r - k;
                  const work = mb >= 0 && mb < m;
                  return (
                    <td
                      key={r}
                      style={
                        work
                          ? {background: `color-mix(in srgb, ${COLORS[mb % COLORS.length]} 26%, transparent)`}
                          : {color: 'var(--ifm-color-emphasis-600)'}
                      }
                    >
                      {work ? `배치 ${mb + 1}` : '쉼'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Stats>
        <Stat label="회전 수" value={String(rounds)} />
        <Stat label="전체 칸" value={String(cells)} />
        <Stat label="쉬는 칸" value={String(idle)} tone={idle > 0 ? 'bad' : undefined} />
        <Stat label="bubble 비율" value={Number.isFinite(ratio) ? fmt(ratio, 3) : '—'} />
      </Stats>
      <Note>
        2장, microbatch 4개이면 10칸 중 쉬는 칸이 2개라 bubble 비율은 2/10 = 0.2입니다. microbatch를 늘리면 가운데 회전이 길어져 이 비율은 줄고, microbatch가 1개뿐이면 1장이 일하는 동안 2장이 쉬고 그다음엔 반대라 비율이 더 큽니다. 위 칸 세기에서 쉬는 칸은 (장 수 − 1) × 장 수입니다.
      </Note>
    </Viz>
  );
}
