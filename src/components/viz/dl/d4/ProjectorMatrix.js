import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const PROJ = [
  {
    name: '본문의 projector',
    rows: [
      [0.5, 0, 0, 0],
      [0, 0, 0.5, 0],
    ],
  },
  {
    name: '다른 칸을 보는 projector (설명용)',
    rows: [
      [0, 0.5, 0, 0],
      [0, 0, 0, 0.5],
    ],
  },
];
const IMGS = [
  {name: '왼쪽 열이 밝음 [1,0,1,0]', v: [1, 0, 1, 0]},
  {name: '오른쪽 열이 밝음 [0,1,0,1]', v: [0, 1, 0, 1]},
  {name: '네 칸 모두 밝음', v: [1, 1, 1, 1]},
];
const NAMES = ['왼쪽 위', '오른쪽 위', '왼쪽 아래', '오른쪽 아래'];
const TEXT = [1, 0];

export default function ProjectorMatrix() {
  const [pix, setPix] = useState([1, 0, 1, 0]);
  const [pi, setPi] = useState(0);
  const [asToken, setAsToken] = useState(false);

  const rows = PROJ[pi].rows;
  const prods = rows.map((r) => r.reduce((a, w, i) => a + w * pix[i], 0));
  const toggle = (i) => setPix(pix.map((v, j) => (j === i ? 1 - v : v)));

  return (
    <Viz
      title="projector: 픽셀 네 칸을 길이 2인 그림 토큰으로"
      caption="projector는 픽셀 네 칸을 길이 2인 그림 토큰으로 줄이는 행렬입니다. 밝기 칸을 눌러 켜고 끄세요. 줄마다 가중치와 밝기를 곱해 더하면 그림 토큰의 한 칸이 됩니다. 가중치는 계산이 보이게 고른 수입니다. 두 번째 projector와 칸 이름(왼쪽 위 등)은 설명용입니다."
    >
      <Controls>
        {IMGS.map((im) => (
          <Btn key={im.name} on={im.v.join() === pix.join()} onClick={() => setPix(im.v)}>
            {im.name}
          </Btn>
        ))}
      </Controls>
      <Controls>
        {PROJ.map((p, i) => (
          <Btn key={p.name} on={!asToken && pi === i} onClick={() => { setPi(i); setAsToken(false); }}>
            {p.name}
          </Btn>
        ))}
        <Btn on={asToken} onClick={() => setAsToken(true)}>픽셀 한 칸을 토큰으로 쓰기</Btn>
      </Controls>
      <div className={s.two} style={{alignItems: 'start'}}>
        <div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 64px)', gap: 4, justifyContent: 'center'}}>
            {pix.map((v, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                aria-label={`${NAMES[i]} 칸, 밝기 ${v}, 누르면 바뀜`}
                style={{
                  height: 64,
                  borderRadius: 8,
                  border: '1.5px solid var(--vb)',
                  background: v ? 'var(--vb)' : 'transparent',
                  color: v ? '#fff' : 'var(--ifm-font-color-base)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <p className={s.note} style={{textAlign: 'center'}}>밝기 = [{pix.join(', ')}]</p>
        </div>
        {asToken ? (
          <div>
            <p className={s.note}>픽셀 한 칸을 토큰으로 쓰면 길이가 1입니다. 글 토큰 [1, 0]은 길이 2라서 residual로 더할 자리가 없습니다.</p>
            <Stats>
              <Stat label="그림 토큰 (한 칸)" value={`[${pix[0]}]`} />
              <Stat label="글 토큰" value="[1, 0]" />
              <Stat label="더할 수 있는가" value="없음 (길이 1 ≠ 2)" tone="bad" />
            </Stats>
          </div>
        ) : (
          <table className={s.grid}>
            <thead>
              <tr><th>줄</th><th>가중치</th><th>밝기와의 곱</th><th>합</th></tr>
            </thead>
            <tbody>
              {rows.map((r, j) => (
                <tr key={j}>
                  <td>{j + 1}</td>
                  <td>[{r.map((w) => fmt(w, 1)).join(', ')}]</td>
                  <td>
                    {r.some((w, i) => w * pix[i] !== 0)
                      ? r.map((w, i) => (w * pix[i] !== 0 ? `${fmt(w, 1)}×${pix[i]}` : null)).filter(Boolean).join(' + ') + ', 나머지 0'
                      : '전부 0'}
                  </td>
                  <td className={s.cellOn}>{fmt(prods[j], 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {!asToken ? (
        <Stats>
          <Stat label="그림 토큰" value={`[${prods.map((v) => fmt(v, 1)).join(', ')}]`} />
          <Stat label="글 토큰" value="[1, 0]" />
          <Stat label="언어 모델이 읽는 토큰 수 (prefill)" value="2개 (글 1 + 그림 1)" />
          <Stat label="길이가 같아 더할 수 있는가" value="가능" tone="good" />
        </Stats>
      ) : null}
      {!asToken ? (
        <Note>
          본문의 projector는 첫째 칸과 셋째 칸만 봅니다. [1, 0, 1, 0]이면 [0.5, 0.5]이고, [0, 1, 0, 1]이면 [0, 0]입니다. 인코더 출력과 hidden size가 다를 때 projector가 그 사이를 잇습니다.
        </Note>
      ) : null}
    </Viz>
  );
}
