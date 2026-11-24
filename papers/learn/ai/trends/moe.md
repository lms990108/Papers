---
title: Mixture of Experts (MoE)
sidebar_position: 2
mdx:
  format: mdx
---

import Quiz from '@site/src/components/viz/Quiz';

MoE는 [Transformer block](../nlp/block.md)의 FFN(token마다 같은 가중치로 변환하는 층)을 여러 벌의 expert로 바꾸고, router가 token마다 점수가 높은 k개(top-k)의 expert만 골라 계산하는 구조입니다. attention은 그대로이고, 그래서 모델의 총 파라미터(total)와 token 하나가 쓰는 파라미터(active)가 다릅니다. expert 없이 모든 파라미터를 쓰는 일반 구조는 dense라고 부릅니다.

2026년 11월 기준 정리이고 모델 이름은 예시입니다.

에이전트를 만들 때는 이런 곳에서 만납니다.

- **모델 카드의 이름**: `235B-A22B`처럼 total과 active가 같이 적힙니다.
- **직접 호스팅**: 계산량은 active를 따르는데 GPU 메모리는 total을 따릅니다.
- **서빙 엔진 설정**: expert parallelism 옵션이 나오고 노드 사이 통신이 병목이 됩니다.
- **모델 비교**: active가 작아서 빠를 것 같은 모델이 total 때문에 장비를 더 먹기도 합니다.

## 계산

active가 total의 몇 %인지, router가 expert를 어떻게 고르고 섞는지를 숫자로 봅니다. expert가 8개이고 top-2이며 expert 하나의 FFN 파라미터가 \(P\)입니다. FFN 총량은 \(8P\)이고 token당 쓰는 것은 \(2P\)라서 \(2P / 8P = 25\%\)입니다.

router는 token 벡터에서 expert마다 점수 하나를 만듭니다. 설명을 위해 expert가 4개라고 하고 점수가 \([2.0,\ 1.0,\ 0.5,\ -1.0]\)이면 top-2는 1번(2.0)과 2번(1.0)입니다. 고른 두 expert의 출력을 섞을 비중이 필요하니, 고른 두 점수만 합이 1인 비율로 바꾸는 softmax에 넣습니다.

\[
w = \mathrm{softmax}(2.0,\ 1.0) = \left(\frac{e^{2}}{e^{2} + e^{1}},\ \frac{e^{1}}{e^{2} + e^{1}}\right) \approx (0.731,\ 0.269)
\]

1번 expert의 출력이 \([1,\ 0]\), 2번이 \([0,\ 2]\)라고 합시다(설명용 값). 출력은 가중합 \(0.731 \times [1,\ 0] + 0.269 \times [0,\ 2] = [0.731,\ 0.538]\)이고, 고르지 않은 두 expert는 계산하지 않습니다.

실제 모델의 수치입니다.

- Mixtral 8x7B: 총 46.7B, active 12.9B입니다. \(12.9 / 46.7 \approx 28\%\)로 25%보다 큰 것은 attention과 embedding이 항상 켜져 있기 때문입니다. 이름의 8x7B는 56B가 아닙니다. expert끼리 attention과 embedding을 공유하기 때문입니다.
- DeepSeek-V3: 총 671B, active 37B로 약 5.5%입니다.

## 기억할 것 네 가지

### 메모리는 total, 연산은 active입니다

Mixtral을 fp16(2바이트)으로 올리면 \(46.7\text{B} \times 2 = 93.4\text{GB}\)이고, 80GB GPU 한 장에는 들어가지 않습니다. active 12.9B로 계산한 25.8GB가 아닙니다. 가중치를 8비트 정수로 줄이는 양자화([효율적 추론](./efficient-inference.md))를 해도 약 47GB입니다. DeepSeek-V3는 fp16이면 1,342GB입니다. 쓰지 않는 expert도 언제 선택될지 모르니 전부 올려 둡니다.

### batch가 커지면 decode의 읽기가 늘어납니다

[decode](../nlp/prefill-decode.md)는 가중치 읽기가 시간을 정하는데, batch 1이면 token 하나가 층마다 expert 2개만 읽습니다. batch는 한 step에 함께 처리하는 요청 수이고 요청마다 token 하나씩 만들므로 token이 \(B\)개입니다. router가 고르게 고른다고 하면 token 하나가 특정 expert를 안 고를 확률은 \(6/8 = 0.75\)이고, \(B\)개가 모두 안 고를 확률, 곧 그 expert가 한 번도 안 뽑힐 확률은 \(0.75^B\)입니다. \(B = 8\)이면 0.10, \(B = 16\)이면 0.01이라 expert 8개 중 평균 7.9개가 켜집니다. Mixtral의 한 step당 가중치 읽기는 batch 1에서 약 25.8GB, batch 16에서 약 92GB입니다. dense는 batch를 늘려도 읽는 양이 그대로라 token당 읽기가 줄지만, MoE는 읽는 양이 같이 늘어납니다. 그래서 [continuous batching](../deep-learning/serving.md)으로 동시 요청을 늘려도 token당 읽기가 dense처럼 줄지 않습니다. 실제 router는 균등하지 않아서 이 값은 상한에 가깝습니다.

### expert를 GPU에 나누면 all-to-all 통신이 생깁니다

expert를 GPU 여러 장에 나눠 놓는 것이 expert parallelism입니다. token은 자기 expert가 있는 장으로 가서 계산한 뒤 돌아옵니다. 그래서 층마다 모든 장이 서로 token을 보내는 all-to-all이 두 번(갈 때와 돌아올 때) 생깁니다. 이 통신이 노드 사이 네트워크를 타면 느려집니다. 분산 방식 전반은 [Parallelism](../deep-learning/parallel.md)에 있습니다.

### 학습에서는 expert 쏠림을 막아야 합니다

router가 몇 expert만 계속 고르면 나머지는 학습을 못 받아 더 안 뽑힙니다. expert가 8개일 때 token 1,000개에 top-2이면 배정이 2,000건이라 expert당 250건이 고른 몫인데, 한 expert가 500건을 받으면 나머지 장이 그 expert의 GPU를 기다리므로 그 장이 step 시간을 정합니다. 막는 방법은 두 가지입니다. 쏠릴수록 커지는 보조 손실(load-balancing loss)을 오차에 더하는 방식이 있고, DeepSeek-V3는 expert마다 bias를 두는 방식을 씁니다. 몰린 expert의 bias는 낮추고 한가한 expert는 높여서 고르는 순위만 바꿉니다. 보조 손실이 품질을 깎을 수 있어서 이를 피하려는 방식입니다.

## 이름 읽기와 판단

`235B-A22B`는 total 235B, active 22B입니다. `30B-A3B`도 같은 규칙입니다. A 뒤의 수가 active입니다.

| | dense | MoE |
|---|---|---|
| 같은 total에서 품질·연산 | 연산이 큽니다 | active만큼만 씁니다 |
| 같은 active에서 품질 | 기준선입니다 | total이 큰 만큼 더 높은 품질을 노립니다 |
| GPU 메모리 | total = active | total 전체가 필요합니다 |
| 서빙 난이도 | 낮습니다 | expert parallelism과 통신을 다룹니다 |

흐름은 이렇습니다. Mixtral, DeepSeek-V3, Qwen3-235B-A22B처럼 큰 오픈 가중치 모델에 MoE가 많이 쓰입니다. 작은 active로 큰 모델의 품질을 얻으려는 방향입니다. 작은 모델에는 dense도 여전히 나옵니다.

API로 쓰면 token 단가와 지연만 보이니 MoE인지 신경 쓸 일이 거의 없습니다. 직접 호스팅하면 메모리와 통신이 병목입니다. active 12.9B인 MoE와 13B dense를 연산량만 보고 같다고 하면 안 됩니다. 메모리는 약 3.6배이고 통신이 더 들며, 같은 장비에서 batch를 늘려도 읽기가 따라 늘어납니다.

## 퀴즈

<Quiz items={[
  {ask: '총 46.7B, active 12.9B인 모델을 fp16으로 올릴 때 가중치에 필요한 GPU 메모리는 대략 얼마인가요?', opts: ['약 26GB (active 기준)', '약 93GB (total 기준)', '약 12.9GB'], ans: 1, why: '모든 expert가 메모리에 올라가 있어야 해서 total로 계산합니다. 46.7B x 2바이트는 93.4GB입니다. active는 token당 계산량에만 해당합니다.'},
  {ask: 'expert 8개, top-2, router가 고르게 고릅니다. batch에 token이 16개면 한 expert가 한 번도 안 뽑힐 확률은 대략 얼마인가요?', opts: ['0.75', '0.10', '0.01'], ans: 2, why: '한 token이 그 expert를 안 고를 확률은 1 - 2/8 = 0.75이고, 16개가 모두 안 고를 확률은 0.75의 16제곱으로 약 0.01입니다. 그래서 batch가 크면 거의 모든 expert의 가중치를 읽게 됩니다.'},
  {ask: '모델 이름이 `30B-A3B`입니다. token 하나가 쓰는 파라미터는 대략 얼마인가요?', opts: ['약 30B', '약 3B', '약 33B'], ans: 1, why: 'A 뒤의 수가 active입니다. 총 30B 중 token당 약 3B를 씁니다. 메모리는 30B를 기준으로 잡아야 합니다.'},
]} />

<details>
<summary>더 깊이: Mixtral의 숫자 맞춰 보기, shared expert, router 방식</summary>

- Mixtral 8x7B는 hidden size 4096, FFN 폭 14336, 32층입니다. SwiGLU FFN 하나는 행렬 3개라 \(3 \times 4096 \times 14336 \approx 176\text{M}\)이고, expert 8개에 32층이면 약 45.1B입니다. attention은 key와 value의 head가 8개(GQA)라 층당 약 42M이고 32층에 1.34B, embedding과 출력 행렬이 0.26B이며, 합하면 46.7B입니다. 켜지는 것은 FFN의 2/8인 11.3B에 1.6B를 더한 12.9B입니다. 구성 값은 Mixtral 논문 기준이고, attention 크기는 key와 value head 8개(GQA)를 가정한 계산입니다.
- DeepSeek-V3는 항상 켜지는 shared expert 1개와 256개 중 8개를 고르는 routed expert를 함께 씁니다. active 37B에는 attention과 shared expert가 들어 있습니다.
- Mixtral의 router는 점수에서 top-k를 먼저 고르고 그 점수끼리 softmax를 합니다. 위 계산 예와 같은 순서입니다. softmax를 먼저 하고 고른 가중치를 다시 맞추는 방식도 있어서 모델마다 구현을 확인해야 합니다.
- DeepSeek-V3의 bias는 expert를 고르는 순위에만 더하고, 출력을 섞는 가중치는 원래 점수로 만듭니다.
- 학습 때 expert마다 받을 token 상한(capacity factor)을 두기도 합니다. 상한을 넘은 token은 그 expert를 건너뜁니다.

</details>
