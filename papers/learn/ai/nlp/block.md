---
title: Decoder block
sidebar_position: 39
mdx:
  format: mdx
---

import BlockSteps from '@site/src/components/viz/nlp/g5/BlockSteps';
import Quiz from '@site/src/components/viz/Quiz';

decoder block은 LLM을 이루는 층 하나입니다. 어텐션 한 번과 FFN 한 번을, 각각 입력에 더하는 방식으로 묶습니다. 이 층을 수십 번 쌓은 것이 decoder-only LLM입니다.

모델을 고르고 서빙할 때 이 구조가 숫자로 드러납니다.

- **모델 설정 읽기**: 모델 카드의 층 수(layers), hidden size, head 수, intermediate size가 모두 이 블록의 크기입니다. 파라미터 수와 필요한 GPU 메모리를 가늠하는 출발점입니다.
- **context window와 메모리**: 어텐션 계산이 층마다 들어 있어서, 긴 prompt는 층 수만큼 곱해진 KV cache를 만듭니다. → [Prefill, decode](./prefill-decode.md)
- **한 token씩 생성하는 이유**: causal mask 때문에 각 자리는 앞 token만 봅니다. 그래서 생성은 앞에서부터 한 token씩 이어집니다.

## 한 층의 계산

한 층을 식으로 쓰면 이렇습니다.

\[
h = x + \mathrm{Attn}(\mathrm{Norm}(x)), \quad y = h + \mathrm{FFN}(\mathrm{Norm}(h))
\]

입력 \(x = [1,\ 0]\)으로 따라가 봅니다. 길이 2는 칸을 보이게 줄인 것이고 실제 모델은 수천 칸입니다.

1. Norm: 칸의 제곱을 평균 낸 값의 제곱근(rms)으로 나눕니다. rms는 \(\sqrt{(1^2 + 0^2)/2} \approx 0.707\)이라 \([1.414,\ 0]\)이 됩니다. 이 방식이 RMSNorm입니다.
2. Attn: 어텐션이 \([0.2,\ 0.1]\)을 돌려준다고 합시다(설명용으로 고른 값입니다).
3. 더하기(residual): 원래 입력에 더해 \(h = [1,\ 0] + [0.2,\ 0.1] = [1.2,\ 0.1]\)입니다. 입력이 사라지지 않고 어텐션 결과가 붙습니다.
4. FFN: 정규화한 \(h\)를 칸마다 같은 가중치로 변환하고, 그 결과를 다시 \(h\)에 더해 \(y\)를 얻습니다.

버튼을 눌러 단계별로 따라가 보세요.

<BlockSteps />

## 기억할 것 세 가지

### residual은 대체가 아니라 덧붙임입니다

어텐션이나 FFN의 결과로 입력을 바꾸지 않고 더합니다. 그래서 층을 많이 쌓아도 입력에서 출력까지 더하기만으로 닿는 길이 남아, 학습 신호가 앞쪽 층까지 전해집니다. → [기울기 소실](../deep-learning/gradient-vanishing.md)

### 정규화는 값이 커지는 것을 막습니다

정규화 없이 층마다 더하면 칸의 값이 계속 커집니다. 값이 커지면 어텐션의 [소프트맥스](../machine-learning/softmax.md)가 한 칸으로 몰립니다. 점수 1과 0이면 비율이 0.731과 0.269인데, 10과 0이면 큰 칸이 거의 1입니다. 요즘 블록은 어텐션과 FFN에 들어가기 직전에 정규화하고(pre-norm), 평균을 빼지 않는 RMSNorm을 많이 씁니다.

### causal mask가 미래를 가립니다

점수가 과거 2, 현재 1, 미래 3일 때 가리지 않으면 미래 칸이 비율의 약 0.665를 가져갑니다. 미래 칸의 점수를 아주 작은 수로 바꾸면 비율은 과거 0.731, 현재 0.269, 미래 0이 됩니다. 이 마스크 덕에 학습은 문장 전체를 한 번에 병렬로 하고, 각 자리는 앞 token만 보고 다음 token을 맞힙니다. 앞뒤를 모두 보는 [버트](./bert.md)와 갈리는 지점입니다.

## 퀴즈

<Quiz items={[
  {
    ask: 'decoder block 안의 FFN은 token들의 정보를 서로 섞는 층일까요?',
    opts: ['섞는다. 어텐션과 같은 일을 한다', '섞지 않는다. token마다 자기 벡터만 변환한다', '앞 token과만 섞는다'],
    ans: 1,
    why: 'FFN은 자리마다 같은 가중치를 따로 적용합니다. 다른 token을 보지 않습니다. token끼리 정보를 섞는 것은 앞단의 어텐션뿐입니다.',
  },
  {
    ask: '다음 token을 맞히는 학습에서 causal mask 없이 어텐션을 쓰면 어떻게 될까요?',
    opts: ['학습이 더 잘 된다. 더 많은 정보를 보기 때문이다', '정답이 되는 미래 token을 보고 베끼게 되어, 생성할 때 쓸 수 없는 모델이 된다', '속도만 느려진다'],
    ans: 1,
    why: '정답이 입력에 들어 있으면 오차는 줄지만 아무것도 배우지 못합니다. 생성할 때는 미래 token이 없으니 그 능력이 쓸모가 없습니다. 위 예에서 미래 칸이 비율의 0.665를 가져갔습니다.',
  },
]} />

<details>
<summary>더 깊이: RMSNorm과 LayerNorm, SwiGLU, head, weight tying</summary>

- 평균을 빼는 LayerNorm으로 \([1,\ 0]\)을 정규화하면 평균 0.5를 빼고 표준편차 0.5로 나눠 \([1,\ -1]\)입니다. RMSNorm은 \([1.414,\ 0]\)이라 0이 0으로 남습니다. 둘 다 크기를 맞추지만 평균을 빼는지가 다릅니다.
- FFN은 입력을 넓혔다가 다시 줄이는 두 층입니다. 넓힌 폭이 intermediate size입니다. 보통 모델 파라미터의 큰 부분이 FFN에 있습니다. 요즘은 한 갈래를 문으로 쓰는 SwiGLU를 많이 씁니다. 문은 \(\mathrm{SiLU}(z) = z\,\sigma(z)\)이고 \(\mathrm{SiLU}(1) = 1 \times 0.731 = 0.731\)입니다. 음수에서도 완전히 0이 되지는 않아서 \(\mathrm{SiLU}(-1) \approx -0.269\)입니다.
- hidden size(\(d_{\text{model}}\))는 벡터의 길이입니다. 블록의 입력과 출력 모양이 같아서 같은 블록을 몇 층이든 쌓을 수 있습니다.
- head는 벡터를 나눠 어텐션을 여러 번 하는 조각입니다. 길이 4에 head가 둘이면 head 하나가 길이 2를 봅니다. head마다 따로 계산한 뒤 이어 붙이고 출력 행렬을 곱합니다. → [트랜스포머](./transformer.md)
- token을 벡터로 만드는 임베딩 표와, 마지막에 단어별 점수를 만드는 행렬이 같은 수를 쓰는 것이 weight tying입니다. 사전 4개, hidden size 2이면 표 8칸과 점수 행렬 8칸이 한 벌 8칸으로 줄어듭니다.
- 이 블록만 반복하는 모델이 decoder-only이고, 입력을 따로 읽는 인코더 블록이 없습니다. 이렇게 쌓은 모델은 [LLM](./llm.md)에서 이어집니다.

</details>
