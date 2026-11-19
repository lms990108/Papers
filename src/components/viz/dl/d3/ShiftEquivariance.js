import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Note, styles as s} from '../../Viz';
import {trim} from './util';

const X = [0, 0, 1, 3, 1, 0, 0, 0, 0, 0];
// 위치마다 가중치를 따로 둔 경우의 설명용 차이값(위치 0은 공유와 같다)
const D = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [-1, 0, 0], [0, -1, 0], [0, 0, -1], [1, 0, 1]];
const O = X.length - 2;

const shiftBy = (x, k) => x.map((_, i) => (i - k >= 0 ? x[i - k] : 0));

function Row({label, cells, mark, hl}) {
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 6, margin: '3px 0'}}>
      <span className={s.ts} style={{width: 96, flexShrink: 0}}>{label}</span>
      <div style={{display: 'flex', flex: 1, minWidth: 0}}>
        {cells.map((v, i) => (
          <div key={i} style={{flex: '1 1 0', minWidth: 0, textAlign: 'center', padding: '3px 0', fontSize: 13, border: '1px solid var(--ifm-color-emphasis-300)', background: hl && hl[i] ? 'color-mix(in srgb, var(--vb) 25%, transparent)' : v !== 0 && !mark ? 'color-mix(in srgb, var(--va) 16%, transparent)' : 'none', fontWeight: hl && hl[i] ? 700 : 400}}>
            {mark ? mark[i] : trim(v)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShiftEquivariance() {
  const [shift, setShift] = useState(2);
  const [shared, setShared] = useState(true);
  const [w, setW] = useState([1, 0, -1]);
  const setWk = (k) => (v) => setW(w.map((e, i) => (i === k ? v : e)));

  const apply = (x) =>
    Array.from({length: O}, (_, i) => {
      const wi = shared ? w : w.map((e, k) => e + D[i][k]);
      return wi[0] * x[i] + wi[1] * x[i + 1] + wi[2] * x[i + 2];
    });
  const xs = shiftBy(X, shift);
  const y = apply(X);
  const ys = apply(xs);
  const expect = shiftBy(y, shift);
  const same = ys.map((v, i) => Math.abs(v - expect[i]) < 1e-9);
  const allSame = same.every(Boolean);

  return (
    <Viz
      title="입력을 밀면 출력도 같은 만큼 밀릴까"
      caption="입력의 획 (1, 3, 1)을 오른쪽으로 밀어 보세요. 가중치를 공유하면 출력의 모양이 그대로 같이 밀립니다(이동 동변). 위치마다 따로이면 위치마다 가중치가 달라져 모양이 깨집니다. 따로일 때의 값은 설명용입니다. 기본값은 본문 코드의 예입니다."
    >
      <Controls>
        <Btn on={shared} onClick={() => setShared(true)}>가중치 공유</Btn>
        <Btn on={!shared} onClick={() => setShared(false)}>위치마다 따로 (설명용 값)</Btn>
        <Slider label="입력을 민 칸 수" min={0} max={5} value={shift} onChange={setShift} />
      </Controls>
      <Controls>
        {['a', 'b', 'c'].map((n, k) => (
          <Slider key={n} label={`가중치 ${n}`} min={-3} max={3} value={w[k]} onChange={setWk(k)} />
        ))}
        <Btn onClick={() => setW([1, 0, -1])}>(1, 0, −1)</Btn>
      </Controls>
      <Row label="입력 x" cells={X} />
      <Row label={`x를 ${shift}칸 민 것`} cells={xs} />
      <Row label="출력 y = f(x)" cells={y} />
      <Row label="f(밀린 x)" cells={ys} />
      <Row label="y를 같이 민 것" cells={expect.slice(0, O)} />
      <Row label="일치?" cells={same} mark={same.map((b) => (b ? '✓' : '✗'))} hl={same.map((b) => !b)} />
      <Note>
        {shift === 0
          ? '아직 밀지 않았습니다. 슬라이더를 움직여 보세요.'
          : allSame
            ? `f(밀린 x)가 y를 ${shift}칸 민 것과 모든 칸에서 같습니다. 검출기가 입력과 함께 갑니다.`
            : `✗ 칸에서 값이 어긋납니다. 밀린 입력에 다른 가중치가 걸리기 때문입니다.`}
        {shared && w.join() === '1,0,-1' && shift === 2 ? ' 출력은 (−1, −3, 0, 3, 1, 0, 0, 0)이 (0, 0, −1, −3, 0, 3, 1, 0)으로 밀렸습니다.' : ''}
      </Note>
    </Viz>
  );
}
