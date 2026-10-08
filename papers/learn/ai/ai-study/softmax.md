---
title: 소프트맥스 (softmax)
sidebar_position: 13
---

점수 1과 0이 있으면, 1이 0보다 크다는 것까지는 알 수 있다. 학습 손실은 그 순서가 아니라 비율을 쓴다. 칸마다 0 이상이고, 전부 더하면 1이어야 한다. 점수 목록을 그런 비율로 바꾸는 함수가 소프트맥스다. softmax와 같은 말이다.

## 두 점수

점수가 \(1\)과 \(0\)이라고 하자. 각 점수에 지수함수를 씌운 뒤, 그 합으로 나눈다. \(e^{1}\)은 약 2.718이고 \(e^{0}\)은 1이다. 합은 약 3.718이다.

\[
p_1 = \frac{2.718}{3.718} \approx 0.731, \quad p_2 = \frac{1}{3.718} \approx 0.269
\]

0.731과 0.269를 더하면 1이다. 1이었던 칸이 여전히 더 크다. 차이는 비율이 되면서 0과 1 사이로 들어온다.

수로는 이렇게 쓴다. 점수 목록이 \(s\)이면 \(i\)번째 비율은 자기 지수를 지수 전체의 합으로 나눈 값이다.

\[
p_i = \frac{e^{s_i}}{\sum_j e^{s_j}}
\]

점수 차이를 벌리면 비율 차이도 벌어진다. 점수가 2와 0이면 \(e^{2}\)는 약 7.389, 합은 약 8.389, 비율은 약 0.881과 0.119다. 모든 점수에 같은 수를 더해도 비율은 같다. 지수끼리 같은 배수가 되어 약분되기 때문이다. 칸이 하나뿐이면 비율은 1이다. [어텐션](./attention.md)에서 뒤를 가리고 남은 칸이 하나일 때 이 성질을 쓴다.

<figure>

<svg viewBox="0 0 680 240" role="img" aria-label="점수 1과 0이 비율 0.731과 0.269가 된다." style="width:100%;max-width:680px;height:auto;display:block">
  <line x1="48" y1="28" x2="48" y2="190" stroke="currentColor" stroke-opacity="0.45"/>
  <line x1="48" y1="190" x2="300" y2="190" stroke="currentColor" stroke-opacity="0.45"/>
  <line x1="380" y1="28" x2="380" y2="190" stroke="currentColor" stroke-opacity="0.45"/>
  <line x1="380" y1="190" x2="640" y2="190" stroke="currentColor" stroke-opacity="0.45"/>
  <rect x="90" y="70" width="48" height="120" fill="#c2410c"/>
  <rect x="190" y="182" width="48" height="8" fill="currentColor"/>
  <rect x="430" y="102" width="48" height="88" fill="#c2410c"/>
  <rect x="530" y="158" width="48" height="32" fill="currentColor"/>
  <g fill="currentColor" font-size="13" text-anchor="middle">
    <text x="114" y="62">1</text>
    <text x="214" y="174">0</text>
    <text x="454" y="94">0.731</text>
    <text x="554" y="150">0.269</text>
    <text x="174" y="214">점수</text>
    <text x="510" y="214">비율</text>
  </g>
</svg>

<figcaption>왼쪽은 넣기 전의 점수다. 오른쪽은 더한 값이 1인 비율이다. 큰 칸은 그대로 크다.</figcaption>

</figure>

## 어디에 쓰나

단어마다 나온 점수를 다음 단어의 비율로 바꿀 때 이 식을 쓴다. 정답 칸의 비율에 로그를 씌워 손실로 만드는 계산은 [다음 토큰](./next-token.md)에 있다. 토큰이 다른 토큰을 얼마만큼 섞을지도 같은 식으로 비율을 만든다. 그 계산은 [어텐션](./attention.md)이다.

클래스 점수 10개에도 같은 식을 쓸 수 있다. [LeNet-5](./lenet-5.md)의 출력은 이 변환이 아니라 [RBF](./rbf.md) 거리다.
