import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note} from '../../Viz';

const MAXLEN = 16;
const SIZES = [1, 2, 4, 8];

const cell = (kind) => ({
  width: 15,
  height: 15,
  borderRadius: 3,
  border: '1px solid var(--ifm-color-emphasis-400)',
  background:
    kind === 'used'
      ? 'var(--va)'
      : kind === 'empty'
      ? 'color-mix(in srgb, var(--vbad) 28%, transparent)'
      : 'transparent',
});

function Row({label, cells, groups}) {
  // groups: 몇 칸씩 한 page로 묶어 보일지 (0이면 한 줄로 이어 붙임)
  const out = [];
  if (groups > 0) {
    for (let i = 0; i < cells.length; i += groups) out.push(cells.slice(i, i + groups));
  } else out.push(cells);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0', fontSize: '0.8rem'}}>
      <span style={{width: '5.5em', flexShrink: 0}}>{label}</span>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: groups > 0 ? 8 : 0}}>
        {out.map((g, i) => (
          <div key={i} style={{display: 'flex', gap: 1, padding: groups > 0 ? 2 : 0, border: groups > 0 ? '1.5px solid var(--vc)' : 'none', borderRadius: 4}}>
            {g.map((k, j) => (
              <span key={j} style={cell(k)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PageAlloc() {
  const [a, setA] = useState(3);
  const [b, setB] = useState(8);
  const [ps, setPs] = useState(4);

  const contCells = (t) => Array.from({length: MAXLEN}, (_, i) => (i < t ? 'used' : 'empty'));
  const pages = (t) => Math.ceil(t / ps);
  const pageCells = (t) => Array.from({length: pages(t) * ps}, (_, i) => (i < t ? 'used' : 'empty'));

  const reserved = 2 * MAXLEN;
  const used = a + b;
  const pagedTotal = (pages(a) + pages(b)) * ps;
  const wasteCont = reserved - used;
  const wastePaged = pagedTotal - used;

  return (
    <Viz
      title="최대 길이를 연속으로 예약하기와 page로 붙이기 (PagedAttention)"
      caption="파랑 칸이 실제 캐시, 빨강 칸이 빈 칸입니다. 보라 테두리 하나가 page 하나이고, page는 메모리 안에서 붙어 있지 않아도 됩니다. 기본값은 A 3 token, B 8 token, page 4 token, 최대 길이 16칸으로 본문의 표와 같습니다."
    >
      <Controls>
        <Slider label="A token" min={1} max={MAXLEN} value={a} onChange={setA} />
        <Slider label="B token" min={1} max={MAXLEN} value={b} onChange={setB} />
      </Controls>
      <Controls>
        <span style={{fontSize: '0.85rem'}}>page 크기</span>
        {SIZES.map((x) => (
          <Btn key={x} on={ps === x} onClick={() => setPs(x)}>
            {x}token
          </Btn>
        ))}
        <Btn
          onClick={() => {
            setA(9);
            setPs(4);
          }}
        >
          연습 2 (9 token)
        </Btn>
      </Controls>
      <b style={{fontSize: '0.85rem'}}>연속 예약: 요청마다 최대 길이 16칸</b>
      <Row label="A" cells={contCells(a)} groups={0} />
      <Row label="B" cells={contCells(b)} groups={0} />
      <b style={{fontSize: '0.85rem'}}>page: 필요한 만큼만 붙임</b>
      <Row label={`A: page ${pages(a)}개`} cells={pageCells(a)} groups={ps} />
      <Row label={`B: page ${pages(b)}개`} cells={pageCells(b)} groups={ps} />
      <Stats>
        <Stat label="연속 예약한 칸" value={String(reserved)} />
        <Stat label="실제 캐시" value={String(used)} />
        <Stat label="연속 예약에서 빈 칸" value={`${wasteCont}칸 (A ${MAXLEN - a}, B ${MAXLEN - b})`} tone="bad" />
        <Stat label="page에서 빈 칸" value={`${wastePaged}칸 (A ${pages(a) * ps - a}, B ${pages(b) * ps - b})`} tone={wastePaged === 0 ? 'good' : undefined} />
      </Stats>
      <Note>
        page를 써도 마지막 page의 남은 칸은 빕니다. 다른 점은 비는 단위가 최대 길이 전체가 아니라 page 하나의 나머지라는 것입니다.
        {a === 9 && ps === 4 ? ' 9 token이면 page 2개가 차고 1칸이 남아 page는 3개이며, 마지막 page 4칸 중 3칸이 빕니다.' : ''}
        {' '}요청이 끝나면 page 번호만 반납하고 다음 요청이 그 번호를 받아 갑니다.
      </Note>
    </Viz>
  );
}
