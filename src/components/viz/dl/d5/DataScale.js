import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const X0 = 50;
const X1 = 520;
const Y0 = 20;
const Y1 = 235;
const T0 = 6;
const T1 = 8.7;
const px = (t) => X0 + ((t - T0) / (T1 - T0)) * (X1 - X0);
const py = (a) => Y1 - ((a - 0.5) / 0.45) * (Y1 - Y0);

// 설명용 곡선: b가 클수록 규칙을 구조에 많이 넣은 모델 (바닥이 높고 천장이 낮으며 빨리 포화)
const acc = (t, b) => {
  const floor = 0.55 + 0.15 * b;
  const top = 0.92 - 0.08 * b;
  const rate = 1.1 + 1.1 * b;
  return top - (top - floor) * Math.exp(-rate * (t - T0));
};

const path = (b) => {
  const pts = [];
  for (let t = T0; t <= T1 + 1e-9; t += 0.05) pts.push(`${pts.length ? 'L' : 'M'}${px(t).toFixed(1)} ${py(acc(t, b)).toFixed(1)}`);
  return pts.join(' ');
};

const SETS = [
  {t: Math.log10(1.28e6), name: 'ImageNet 1.3M', row: 0},
  {t: Math.log10(14e6), name: 'ImageNet-21k 14M', row: 0},
  {t: Math.log10(303e6), name: 'JFT-300M 303M', row: 0},
  {t: Math.log10(9e6), name: '9M', row: 1},
  {t: Math.log10(9e7), name: '90M', row: 1},
];

export default function DataScale() {
  const [t, setT] = useState(Math.log10(9e6));
  const [b, setB] = useState(0.5);
  const cnn = acc(t, 0.9);
  const vit = acc(t, 0.1);
  const mine = acc(t, b);
  const best = Math.max(cnn, vit, mine);
  const who = best === cnn ? 'CNN 계열 곡선' : best === vit ? 'ViT 계열 곡선' : '내 곡선';
  const size = Math.pow(10, t) / 1e6;

  return (
    <Viz
      title="규칙을 구조에 넣은 정도와 사전학습 데이터 양"
      caption="b는 이웃만 보기 같은 규칙을 구조에 넣은 양을 나타내는 설명용 숫자이고, CNN 계열 곡선은 0.9, ViT 계열 곡선은 0.1로 그렸습니다. 설명용 곡선입니다. 세로축에 값이 없고, 실제 실험 결과나 정확한 교차 지점이 아닙니다. 데이터 양의 눈금(ImageNet 약 1.3M, ImageNet-21k 14M, JFT-300M 303M)과 9M, 90M 부분집합은 ViT 논문이 쓴 크기이고, 논문이 보고한 관찰은 9M에서 ViT가 같은 크기의 ResNet보다 더 과적합했고 90M 이상에서는 ViT가 앞선다는 것입니다. 곡선의 모양만 보세요."
    >
      <Controls>
        <Slider label="사전학습 이미지 수" min={T0} max={T1} step={0.05} value={t} onChange={setT} format={(v) => `${fmt(Math.pow(10, v) / 1e6, 1)}M`} />
        <Slider label="내 모델의 b (규칙의 양)" min={0} max={1} step={0.05} value={b} onChange={setB} format={(v) => fmt(v, 2)} />
      </Controls>
      <Controls>
        <Btn on={Math.abs(t - SETS[0].t) < 0.03} onClick={() => setT(SETS[0].t)}>
          ImageNet 1.3M
        </Btn>
        <Btn on={Math.abs(t - SETS[3].t) < 0.03} onClick={() => setT(SETS[3].t)}>
          9M
        </Btn>
        <Btn on={Math.abs(t - SETS[4].t) < 0.03} onClick={() => setT(SETS[4].t)}>
          90M
        </Btn>
        <Btn on={Math.abs(t - SETS[2].t) < 0.03} onClick={() => setT(SETS[2].t)}>
          JFT-300M
        </Btn>
        <Btn on={b === 0.9} onClick={() => setB(0.9)}>
          내 모델을 CNN 쪽으로
        </Btn>
        <Btn on={b === 0.1} onClick={() => setB(0.1)}>
          내 모델을 ViT 쪽으로
        </Btn>
      </Controls>
      <svg viewBox="0 0 540 290" className={s.svg} role="img" aria-label="가로축은 사전학습 데이터 양(로그), 세로축은 설명용 정확도. CNN 계열은 데이터가 적을 때 높고 빨리 평평해지며, ViT 계열은 낮게 시작해 데이터가 많을 때 더 높아지는 설명용 곡선">
        <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke="var(--ifm-font-color-base)" />
        <line x1={X0} y1={Y0} x2={X0} y2={Y1} stroke="var(--ifm-font-color-base)" />
        <text x={14} y={(Y0 + Y1) / 2} className={s.ts} transform={`rotate(-90 14 ${(Y0 + Y1) / 2})`} textAnchor="middle">
          정확도 (설명용, 값 없음)
        </text>
        {SETS.map((d) => (
          <g key={d.name}>
            <line x1={px(d.t)} y1={Y0} x2={px(d.t)} y2={Y1} stroke="var(--ifm-color-emphasis-400)" strokeDasharray={d.row ? '2 4' : '5 3'} />
            <text x={px(d.t)} y={Y1 + 18 + d.row * 16} textAnchor="middle" className={s.ts}>
              {d.name}
            </text>
          </g>
        ))}
        <path d={path(0.9)} fill="none" stroke="var(--vb)" strokeWidth="2.5" />
        <path d={path(0.1)} fill="none" stroke="var(--va)" strokeWidth="2.5" />
        <path d={path(b)} fill="none" stroke="var(--vc)" strokeWidth="2.5" strokeDasharray="6 4" />
        <line x1={px(t)} y1={Y0} x2={px(t)} y2={Y1} stroke="var(--ifm-font-color-base)" strokeWidth="1.5" />
        <circle cx={px(t)} cy={py(cnn)} r="4.5" fill="var(--vb)" />
        <circle cx={px(t)} cy={py(vit)} r="4.5" fill="var(--va)" />
        <circle cx={px(t)} cy={py(mine)} r="4.5" fill="var(--vc)" />
        <text x={X1 - 4} y={py(acc(T1, 0.9)) + 16} textAnchor="end" className={s.t} style={{fill: 'var(--vb)'}}>
          CNN 계열 (b = 0.9)
        </text>
        <text x={X1 - 4} y={py(acc(T1, 0.1)) - 8} textAnchor="end" className={s.t} style={{fill: 'var(--va)'}}>
          ViT 계열 (b = 0.1)
        </text>
        <text x={X0 + 6} y={Y0 + 12} className={s.t} style={{fill: 'var(--vc)'}}>
          점선: 내 모델 (b = {fmt(b, 2)})
        </text>
      </svg>
      <Stats>
        <Stat label="고른 데이터 양" value={`${fmt(size, 1)}M장`} />
        <Stat label="이 지점에서 가장 높은 곡선" value={who} />
        <Stat label="CNN 계열과 ViT 계열 (그림 속)" value={cnn > vit ? 'CNN 계열이 위' : 'ViT 계열이 위'} />
      </Stats>
      <Note>
        b는 “이웃만 본다, 같은 검출기를 여러 자리에 쓴다” 같은 규칙을 구조에 얼마나 넣었는지를 나타내는 설명용 숫자입니다. b가 크면 적은 데이터에서 유리하고 일찍 평평해집니다. b가 작으면 적은 데이터에서 불리하지만 데이터가 늘수록 더 올라갑니다. 훈련 방법과 구조를 바꾸어 이 약점을 줄이는 모델이 뒤에서 다룰 DeiT와 Swin입니다.
      </Note>
    </Viz>
  );
}
