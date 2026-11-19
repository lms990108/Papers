import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar} from '../../Viz';
import {outSize, num} from './util';

const PRESETS = {
  '한 줄 예 (입력 7칸)': {d: 1, N: 7, K: 3, P: 0, Cin: 1, Cout: 1},
  'LeNet-5의 C1': {d: 2, N: 32, K: 5, P: 0, Cin: 1, Cout: 6},
  'RGB 3×3, 64장': {d: 2, N: 32, K: 3, P: 0, Cin: 3, Cout: 64},
  '연습 3 (28×28, same)': {d: 2, N: 28, K: 3, P: 1, Cin: 1, Cout: 8},
};

export default function ParamLadder() {
  const [v, setV] = useState(PRESETS['LeNet-5의 C1']);
  const {d, N, K, P, Cin, Cout} = v;
  const set = (key) => (x) => setV({...v, [key]: x});
  const one = d === 1;
  const Ci = one ? 1 : Cin;
  const Co = one ? 1 : Cout;
  const O = outSize(N, K, 1, P);
  const pos = one ? O : O * O;
  const units = Co * pos;
  const nIn = (one ? N : N * N) * Ci;
  const kIn = (one ? K : K * K) * Ci;
  const fc = (nIn + 1) * units;
  const local = (kIn + 1) * units;
  const shared = (kIn + 1) * Co;
  const lg = (x) => Math.log10(Math.max(1, x));
  const top = Math.max(lg(fc), 1);
  const ok = O > 0;

  return (
    <Viz
      title="세 방식의 파라미터 수"
      caption="입력 크기를 키워도 공유한 합성곱의 파라미터는 그대로입니다. 막대는 로그 눈금이라 한 칸 늘 때마다 10배입니다. 버튼은 본문과 연습 문제의 값입니다. 바이어스는 출력 유닛마다 하나(공유하면 맵마다 하나)로 셉니다."
    >
      <Controls>
        {Object.keys(PRESETS).map((name) => (
          <Btn key={name} on={JSON.stringify(PRESETS[name]) === JSON.stringify(v)} onClick={() => setV(PRESETS[name])}>{name}</Btn>
        ))}
      </Controls>
      <Controls>
        <Btn on={one} onClick={() => setV({...v, d: 1})}>한 줄 입력</Btn>
        <Btn on={!one} onClick={() => setV({...v, d: 2, N: Math.min(N, 64)})}>이미지 입력</Btn>
        <Slider label={one ? '입력 칸 N' : '입력 한 변 N'} min={4} max={one ? 100 : 64} value={N} onChange={set('N')} />
        <Slider label="커널 K" min={1} max={9} value={K} onChange={set('K')} />
        <Slider label="패딩 P" min={0} max={4} value={P} onChange={set('P')} />
        {one ? null : <Slider label="입력 채널" min={1} max={3} value={Cin} onChange={set('Cin')} />}
        {one ? null : <Slider label="출력 맵 수" min={1} max={64} value={Cout} onChange={set('Cout')} />}
      </Controls>
      {ok ? (
        <>
          <Bar label="완전 연결" value={lg(fc)} max={top} color="var(--vbad)" text={num(fc)} />
          <Bar label="국소, 위치마다 따로" value={lg(local)} max={top} color="var(--vb)" text={num(local)} />
          <Bar label="국소 + 공유" value={lg(shared)} max={top} color="var(--vok)" text={num(shared)} />
          <Stats>
            <Stat label="출력 한 변 / 유닛 수" value={`${O} / ${num(units)}`} />
            <Stat label="완전 연결 ÷ 공유" value={`약 ${num(fc / shared)}배`} />
            <Stat label="따로 ÷ 공유 (= 위치 수)" value={`${num(local / shared)}배`} />
          </Stats>
          <Note>
            완전 연결은 ({num(nIn)} + 1) × {num(units)}, 국소는 ({num(kIn)} + 1) × {num(units)}, 공유는 ({num(kIn)} + 1) × {Co}입니다. 공유로 줄어드는 배수는 맵 한 장의 위치 수({num(pos)})와 같습니다. N을 키워 보세요. 공유의 {num(shared)}개는 변하지 않습니다.
          </Note>
        </>
      ) : (
        <Note>커널이 패딩 후 입력보다 커서 출력이 없습니다. K를 줄이거나 N, P를 키워 보세요.</Note>
      )}
    </Viz>
  );
}
