---
title: 서브샘플링 (subsampling)
sidebar_position: 8
---

특징을 찾은 뒤에도 그 특징이 어느 픽셀에 있었는지를 다음 층에 그대로 넘기면, 같은 글자가 다른 글자가 된다. 7은 왼쪽 위에 수평 획의 끝, 오른쪽 위에 구석, 아래쪽에 수직 획의 끝이 있으면 읽을 수 있다. 수평 획의 끝이 두 픽셀 왼쪽인지 오른쪽인지는 글자마다 다르다. 그 좌표까지 맞춰야 한다면, 학습 집합에 없는 위치의 7은 새 패턴이다.

필요한 것은 특징들의 대략적인 배치다. 서브샘플링은 이웃한 몇 칸을 하나의 수로 요약해서, 그 정밀한 좌표를 버린다. 해상도가 낮아지고, 다음 층이 보는 칸 수도 줄어든다.

아래는 4×4를 겹치지 않는 2×2 네 덩어리로 나눈 것이다. 각 덩어리의 평균이 다음 층의 한 칸이 된다. 덩어리 안에서 검은 칸이 왼쪽 위인지 오른쪽 아래인지는 평균에 남지 않는다. 그래서 획이 한 픽셀 움직여도 다음 층은 거의 같은 값을 본다.

<figure>

<svg viewBox="0 0 640 180" role="img" aria-label="4곱하기 4 칸을 2곱하기 2 평균 네 개로 줄인다." style="width:100%;max-width:640px;height:auto;display:block">
  <g stroke="currentColor" stroke-width="1.5">
    <rect x="40" y="24" width="28" height="28" fill="#c2410c"/>
    <rect x="68" y="24" width="28" height="28" fill="#c2410c" fill-opacity="0.35"/>
    <rect x="40" y="52" width="28" height="28" fill="none"/>
    <rect x="68" y="52" width="28" height="28" fill="#c2410c" fill-opacity="0.55"/>
    <rect x="96" y="24" width="28" height="28" fill="none"/>
    <rect x="124" y="24" width="28" height="28" fill="none"/>
    <rect x="96" y="52" width="28" height="28" fill="#c2410c" fill-opacity="0.25"/>
    <rect x="124" y="52" width="28" height="28" fill="none"/>
    <rect x="40" y="80" width="28" height="28" fill="none"/>
    <rect x="68" y="80" width="28" height="28" fill="none"/>
    <rect x="40" y="108" width="28" height="28" fill="#c2410c" fill-opacity="0.7"/>
    <rect x="68" y="108" width="28" height="28" fill="#c2410c"/>
    <rect x="96" y="80" width="28" height="28" fill="#c2410c" fill-opacity="0.45"/>
    <rect x="124" y="80" width="28" height="28" fill="none"/>
    <rect x="96" y="108" width="28" height="28" fill="none"/>
    <rect x="124" y="108" width="28" height="28" fill="#c2410c" fill-opacity="0.2"/>
  </g>
  <line x1="190" y1="80" x2="250" y2="80" stroke="currentColor"/>
  <polygon points="250,80 240,75 240,85" fill="currentColor"/>
  <g stroke="currentColor" stroke-width="1.5">
    <rect x="280" y="40" width="48" height="48" fill="#c2410c" fill-opacity="0.55"/>
    <rect x="328" y="40" width="48" height="48" fill="#c2410c" fill-opacity="0.12"/>
    <rect x="280" y="88" width="48" height="48" fill="#c2410c" fill-opacity="0.75"/>
    <rect x="328" y="88" width="48" height="48" fill="#c2410c" fill-opacity="0.28"/>
  </g>
  <g fill="currentColor" font-size="13">
    <text x="40" y="164">4×4, 칸의 위치까지 있음</text>
    <text x="280" y="164">2×2, 덩어리 평균만 남음</text>
  </g>
</svg>

<figcaption>색이 진할수록 그 칸이 검다. 오른쪽은 2×2마다 평균한 값이다.</figcaption>

</figure>

초기 [합성곱 신경망](./cnn.md)은 이렇게 요약했다. 앞 특징 맵에서 겹치지 않는 2×2를 받아 평균하고, 학습되는 계수를 곱하고, 학습되는 바이어스를 더한 뒤 시그모이드를 통과시킨다. 이웃 유닛이 보는 2×2가 겹치지 않으므로 행과 열이 절반이 된다. LeNet-5에서는 28×28 맵 6장이 14×14 맵 6장이 된다. 학습 파라미터는 맵마다 계수 하나와 바이어스 하나라 12개이고, 연결은 5,880개다.

계수가 작으면 이 유닛은 거의 선형이라, 네 칸을 흐리게 평균하는 정도다. 계수가 크면, 바이어스에 따라 그 네 칸 안에 특징이 있는지를 세게 통과시킨다. 잡음이 있는 OR이나 AND에 가깝다. 계수와 바이어스는 고정이 아니라 손실로 정해진다. “얼마나 흐릴지”도 학습 대상이다.

합성곱과 번갈아 쌓으면 효과는 누적된다. 뒤 층의 유닛 하나가 보는 원본 픽셀의 범위는, 앞선 요약 때문에 넓어진다. 앞층은 작은 획을 보고, 뒷층은 그 획들이 대략 어떻게 놓여 있는지를 본다.

지금은 2×2 평균 대신 맥스 풀링, 스트라이드가 있는 합성곱, 영상을 패치로 잘라 임베딩하는 방식을 쓴다. 식은 다르다. 작은 이동에 덜 민감한 표현으로 내리고 다음 층의 계산량을 줄인다는 역할은 같다. 언어 모델의 토큰은 픽셀보다 이미 거친 단위다. 글자 영상에서 이 층이 하던 좌표 버리기를, 문장을 토큰으로 나누는 단계에서 미리 해 둔 것에 가깝다.
