import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {conv2d, chunk, trim} from './util';

const N = 5;
const K = 3;
const IMG0 = [1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0];
const EDGE = [0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1]; // 한 줄이 0 0 0 1 1인 5줄
const KER0 = [-1, -1, -1, 0, 0, 0, 1, 1, 1];
const KERS = {
  '가로 모서리': KER0,
  '세로 모서리': [-1, 0, 1, -1, 0, 1, -1, 0, 1],
  '모두 더하기': [1, 1, 1, 1, 1, 1, 1, 1, 1],
  '가운데만': [0, 0, 0, 0, 1, 0, 0, 0, 0],
};

export default function Conv2DStep() {
  const [img, setImg] = useState(IMG0);
  const [ker, setKer] = useState(KER0);
  const [selK, setSelK] = useState(0);
  const [stride, setStride] = useState(1);
  const [pad, setPad] = useState(0);
  const [step, setStep] = useState(0);

  const {z, out, o} = conv2d(chunk(img, N), chunk(ker, K), stride, pad);
  const total = o * o;
  const st = Math.min(step, total - 1);
  const r = Math.floor(st / o);
  const c = st % o;
  const np = N + 2 * pad;
  const cs = Math.min(44, Math.floor(330 / np));
  const size = np * cs + 4;
  const rowSums = [0, 1, 2].map((i) => [0, 1, 2].map((j) => z[r * stride + i][c * stride + j] * ker[i * K + j]));

  const toggle = (i) => () => setImg(img.map((v, k) => (k === i ? 1 - v : v)));
  const setKv = (v) => setKer(ker.map((e, i) => (i === selK ? v : e)));

  return (
    <Viz
      title="3×3 커널이 5×5 입력 위를 훑는 모습"
      caption="입력 칸을 누르면 0과 1이 바뀝니다. 커널 칸을 눌러 고른 뒤 슬라이더로 값을 바꾸세요. 스트라이드와 패딩을 바꾸면 출력 크기가 O = ⌊(N + 2P − K) / S⌋ + 1에 따라 달라집니다. 여기서 N은 입력 한 변, K는 커널 한 변입니다. 기본값은 7 모양과 가로 모서리 검출기이고, 본문의 경계 예는 '왼쪽 어둡고 오른쪽 밝음' 입력과 '세로 모서리' 커널을 고르면 됩니다."
    >
      <Controls>
        <Slider label="스트라이드 S (창을 옮기는 칸 수)" min={1} max={3} value={stride} onChange={setStride} />
        <Slider label="패딩 P (가장자리에 두르는 0의 겹 수)" min={0} max={2} value={pad} onChange={setPad} />
        <Slider label="창 자리" min={0} max={total - 1} value={st} onChange={setStep} format={(v) => `${v + 1} / ${total}`} />
        <Btn onClick={() => setStep((st + 1) % total)}>다음 자리</Btn>
        <Btn onClick={() => setStep(total - 1)}>모두 채우기</Btn>
      </Controls>
      <Controls>
        {Object.keys(KERS).map((name) => (
          <Btn key={name} on={KERS[name].join() === ker.join()} onClick={() => setKer(KERS[name])}>{name}</Btn>
        ))}
        <Btn onClick={() => setImg(EDGE)}>입력: 왼쪽 어둡고 오른쪽 밝음</Btn>
        <Btn onClick={() => setImg(IMG0)}>입력: 7 모양</Btn>
      </Controls>

      <div className={s.two}>
        <div>
          <div className={s.title}>입력 ({N}×{N}, 패딩 {pad}겹)</div>
          <svg viewBox={`0 0 ${size} ${size}`} className={s.svg} style={{maxWidth: 320}} role="img" aria-label={`입력 ${N}×${N}에 패딩 ${pad}겹을 두르고 3×3 창이 ${r + 1}행 ${c + 1}열 자리에 놓인 그림`}>
            {z.map((row, i) =>
              row.map((v, j) => {
                const real = i >= pad && i < pad + N && j >= pad && j < pad + N;
                const idx = (i - pad) * N + (j - pad);
                return (
                  <g key={`${i}-${j}`} onClick={real ? toggle(idx) : undefined} onKeyDown={real ? (e) => e.key === 'Enter' && toggle(idx)() : undefined} role={real ? 'button' : undefined} tabIndex={real ? 0 : undefined} aria-label={real ? `입력 ${i - pad + 1}행 ${j - pad + 1}열 ${v}` : undefined} style={{cursor: real ? 'pointer' : 'default'}}>
                    <rect x={2 + j * cs} y={2 + i * cs} width={cs} height={cs} fill={v ? 'color-mix(in srgb, var(--va) 30%, transparent)' : real ? 'none' : 'var(--ifm-color-emphasis-100)'} stroke="var(--ifm-color-emphasis-400)" strokeDasharray={real ? undefined : '3 2'} />
                    <text x={2 + j * cs + cs / 2} y={2 + i * cs + cs / 2 + 5} textAnchor="middle" className={real ? s.t : s.ts}>{v}</text>
                  </g>
                );
              }),
            )}
            <rect x={2 + c * stride * cs} y={2 + r * stride * cs} width={K * cs} height={K * cs} fill="color-mix(in srgb, var(--vb) 14%, transparent)" stroke="var(--vb)" strokeWidth={3} pointerEvents="none" />
          </svg>
        </div>
        <div>
          <div className={s.title}>커널 (눌러서 고르기)</div>
          <table className={s.grid} style={{maxWidth: 200}}>
            <tbody>
              {[0, 1, 2].map((i) => (
                <tr key={i}>
                  {[0, 1, 2].map((j) => (
                    <td key={j} onClick={() => setSelK(i * K + j)} onKeyDown={(e) => e.key === 'Enter' && setSelK(i * K + j)} role="button" tabIndex={0} className={i * K + j === selK ? s.cellOn : undefined} style={{cursor: 'pointer'}}>{ker[i * K + j]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <Controls>
            <Slider label={`커널 ${Math.floor(selK / 3) + 1}행 ${(selK % 3) + 1}열`} min={-3} max={3} value={ker[selK]} onChange={setKv} />
          </Controls>
          <div className={s.title}>출력 ({o}×{o}) — 창이 지나간 칸만 채워집니다</div>
          <table className={s.grid} style={{maxWidth: 260}}>
            <tbody>
              {out.map((row, i) => (
                <tr key={i}>
                  {row.map((v, j) => {
                    const idx = i * o + j;
                    return (
                      <td key={j} className={idx === st ? s.cellOn : undefined} style={{opacity: idx <= st ? 1 : 0.3}}>{idx <= st ? trim(v) : '·'}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Stats>
        <Stat label="출력 한 변 O" value={`⌊(${N}+2·${pad}−${K})/${stride}⌋+1 = ${o}`} />
        <Stat label={`현재 자리 (${r + 1}행 ${c + 1}열)의 값`} value={trim(out[r][c])} tone="good" />
      </Stats>
      <Note>
        줄별 곱의 합: {rowSums.map((row, i) => `${i + 1}번째 줄 ${row.map((t) => trim(t)).join(' + ')} = ${trim(row.reduce((a, b) => a + b, 0))}`).join(' / ')}. 세 줄을 더하면 {trim(out[r][c])}입니다. 커널을 뒤집지 않고 그대로 겹쳐 곱합니다.
      </Note>
    </Viz>
  );
}
