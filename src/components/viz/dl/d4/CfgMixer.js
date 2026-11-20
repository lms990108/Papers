import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, fmt} from '../../Viz';

export default function CfgMixer() {
  const [u, setU] = useState(-0.5);
  const [c, setC] = useState(-1);
  const [w, setW] = useState(2);
  const h = 0.25;

  const mix = u + w * (c - u);
  const next = 1 + h * mix;
  const condOnly = 1 + h * c;
  const uncond = 1 + h * u;
  const M = Math.max(1, Math.abs(u), Math.abs(c), Math.abs(mix));

  return (
    <Viz
      title="CFG: 조건 없는 속도와 문장 조건의 속도를 섞기"
      caption="섞은 속도 = 조건 없는 속도 + 세기 × (조건 속도 − 조건 없는 속도)입니다. 보폭은 0.25, 출발은 x = 1입니다. 기본값은 본문의 −0.5, −1, 세기 2입니다."
    >
      <Controls>
        <Slider label="조건 없는 속도" min={-3} max={0} step={0.25} value={u} onChange={setU} format={(v) => fmt(v, 2)} />
        <Slider label="문장 조건 속도" min={-3} max={0} step={0.25} value={c} onChange={setC} format={(v) => fmt(v, 2)} />
      </Controls>
      <Controls>
        <Slider label="세기" min={0} max={5} step={0.5} value={w} onChange={setW} format={(v) => fmt(v, 1)} />
        {[0, 1, 2].map((v) => (
          <Btn key={v} on={w === v} onClick={() => setW(v)}>
            세기 {v}
          </Btn>
        ))}
        <Btn
          onClick={() => {
            setU(0);
            setC(-1);
            setW(3);
          }}
        >
          연습 2 (0, −1, 3)
        </Btn>
        <Btn
          onClick={() => {
            setU(-0.5);
            setC(-1);
            setW(2);
          }}
        >
          본문 값
        </Btn>
      </Controls>
      <Bar label="조건 없는 속도" value={Math.abs(u)} max={M} color="var(--ifm-color-emphasis-600)" text={fmt(u, 2)} />
      <Bar label="문장 조건 속도" value={Math.abs(c)} max={M} color="var(--va)" text={fmt(c, 2)} />
      <Bar label="섞은 속도" value={Math.abs(mix)} max={M} color="var(--vb)" text={fmt(mix, 2)} />
      <Stats>
        <Stat label="섞은 속도" value={fmt(mix, 3)} />
        <Stat label="한 걸음 뒤 x (섞은 속도)" value={fmt(next, 3)} />
        <Stat label="조건만 따를 때 x" value={fmt(condOnly, 3)} />
        <Stat label="조건 없을 때 x" value={fmt(uncond, 3)} />
      </Stats>
      <Note>
        {fmt(u, 2)} + {fmt(w, 1)} × ({fmt(c, 2)} − ({fmt(u, 2)})) = {fmt(mix, 2)}이고, 1 + 0.25 × ({fmt(mix, 2)}) = {fmt(next, 3)}입니다.{' '}
        {w === 0
          ? '세기 0이면 조건 없는 속도만 남아 문장을 무시합니다.'
          : w === 1
          ? '세기 1은 조건 속도 그대로입니다.'
          : '세기를 키우면 한 걸음이 문장 쪽으로 더 기울어집니다. 세기는 조건 속도에 곱해지는 것이 아니라 두 속도의 차이에 곱해집니다.'}
      </Note>
    </Viz>
  );
}
