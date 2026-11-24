---
title: Parallelism
sidebar_position: 59
mdx:
  format: mdx
---

import AllReduceGrads from '@site/src/components/viz/dl/d4/AllReduceGrads';
import PipelineBubble from '@site/src/components/viz/dl/d4/PipelineBubble';
import Quiz from '@site/src/components/viz/Quiz';

parallelism은 모델이나 데이터를 여러 GPU에 나눠 두고, 나눈 뒤에도 한 장에서 계산한 것과 같은 결과를 내도록 중간 결과를 주고받는 방법입니다.

에이전트를 만들 때 직접 학습을 분산할 일은 많지 않습니다. 모델을 서빙하고 고를 때 만납니다.

- **큰 모델 서빙**: 가중치가 GPU 한 장에 안 들어가면 여러 장에 나눕니다. vLLM 같은 서빙 엔진의 `--tensor-parallel-size` 설정이 이것입니다.
- **MoE 모델 읽기**: 전체 파라미터는 큰데 token마다 일부 expert만 계산합니다. 메모리와 계산량이 따로 움직입니다.
- **긴 문맥**: token 축으로 나누는 context parallelism이 있습니다.
- **fine-tuning 인프라**: FSDP, ZeRO 같은 이름이 설정에 나옵니다.

## 왜 필요한가

GPU 한 장의 메모리는 정해져 있습니다. 파라미터 700억 개 모델을 bfloat16(수 하나에 2바이트)으로 두면 가중치만 \(70 \times 10^9 \times 2 = 140\)GB이고, 80GB짜리 GPU 한 장에는 들어가지 않습니다. 서빙은 여기에 KV cache가 더해지고, 학습은 기울기와 optimizer state까지 필요합니다. [Continuous batching](./serving.md)의 캐시 메모리 한도는 장 하나의 메모리를 기준으로 한 이야기였고, 이 페이지는 그 한도를 장 여러 개로 넓힙니다.

장을 늘린다고 일이 저절로 나뉘지는 않습니다. 장마다 서로 다른 batch를 처리하는 방법은 모델 전체가 장마다 한 벌씩 들어가야 하므로 140GB 문제를 풀지 못합니다. 그래서 모델 자체를 나눕니다. 큰 행렬 하나를 쪼개 장마다 일부를 계산하거나, 층 묶음을 장마다 배정합니다. 어느 쪽이든 나눈 결과를 합쳐야 한 장에서 계산한 것과 같아져서 장 사이 통신이 생기고, 이 통신은 장 안의 메모리 읽기보다 느립니다. 병렬화의 비용은 이 통신과 장이 쉬는 시간이고, 아래 세 방식은 무엇을 나누느냐에 따라 이 비용이 달라집니다.

## 계산

GPU 4장(장은 GPU 한 개)이 서로 다른 batch를 보고, 각자 기울기([역전파](./backpropagation.md)가 구하는 값)를 만듭니다. 한 줄만 적으면 \([1, 0, 0, 0]\), \([0, 2, 0, 0]\), \([0, 0, 3, 0]\), \([0, 0, 0, 4]\)입니다. 칸마다 더하면 \([1, 2, 3, 4]\)이고, 이 합을 네 장이 모두 가져야 다음 가중치가 같습니다. 모두가 가진 값을 더해 모두에게 보내는 통신이 all-reduce입니다. 합은 평균의 4배라서 장 수 4로 나눈 \([0.25, 0.5, 0.75, 1]\)로 갱신합니다. 이것이 data parallelism입니다. 네 장의 평균은 batch를 네 배로 키워 한 장에서 구한 기울기와 같습니다.

아래 그림에서 단계를 눌러 네 장이 기울기를 모으는 모습을 보세요. 기울기 칸을 눌러 값을 바꿔도 됩니다.

<AllReduceGrads />

한 행렬을 나누는 것은 tensor parallelism입니다. \(W\)의 열이 \([1, 3]\)과 \([2, 4]\)이고 입력 \(x = [1, 1]\)이면 \(Wx = [3, 7]\)입니다. 열을 GPU 두 장에 나눠, 1장은 첫 열에 입력의 첫 칸을 곱한 \([1, 3]\), 2장은 둘째 열에 둘째 칸을 곱한 \([2, 4]\)를 계산합니다. all-reduce로 더하면 같은 \([3, 7]\)입니다. 각 장이 \(W\)의 절반만 가지면 되므로 가중치 메모리가 반으로 줄고, 대가로 부분 결과를 더하는 통신이 생깁니다. 이 통신은 층을 지날 때마다 반복됩니다.

층을 순서대로 다른 장에 두면 pipeline parallelism입니다. batch를 잘게 쪼갠 조각이 microbatch이고, 이것을 차례로 흘려 보냅니다. 층 2개, 장 2개, microbatch 4개이면 5회전이 걸립니다.

```text
회전   1장(첫째 층)   2장(둘째 층)
1      batch 1        쉼
2      batch 2        batch 1
3      batch 3        batch 2
4      batch 4        batch 3
5      쉼             batch 4
```

쉬는 칸을 bubble이라 하고, 전체 10칸 중 2개라 bubble 비율은 \(2/10 = 0.2\)입니다. 아래 그림에서 장 수와 microbatch 수를 바꿔 쉬는 칸이 어떻게 달라지는지 보세요.

<PipelineBubble />

## 서빙 설정에서는

vLLM의 `--tensor-parallel-size 4`는 모든 층의 행렬을 위 tensor parallelism으로 4장에 나눕니다. 140GB 가중치는 장당 35GB가 되어 80GB 장에 들어가고, 남은 메모리가 KV cache 몫이 됩니다. 블록마다 all-reduce가 들어가므로 장 사이 연결이 느린 서버(NVLink 없이 PCIe로만 이은 경우 등)에서는 장을 늘려도 기대만큼 빨라지지 않습니다.

## 기억할 것 네 가지

### 모델이 한 장에 들어가는지가 출발점입니다

한 장에 들어가면 data parallelism만으로 충분합니다. 안 들어가면 한 서버 안의 빠른 연결을 믿고 tensor parallelism으로 나누고, 그래도 모자랄 때 서버 사이를 pipeline parallelism으로 잇는 순서가 흔합니다. 통신이 잦은 방식일수록 빠른 연결이 필요하기 때문입니다.

### all-reduce의 합으로 바로 갱신하면 안 됩니다

네 장의 합은 평균의 4배입니다. 4로 나누지 않고 쓰면 learning rate를 네 배로 키운 것과 같아집니다.

### pipeline은 장을 늘린 만큼 빨라지지 않습니다

위 표에서 10칸 중 2칸이 쉽니다. microbatch가 1개뿐이면 1장이 일하는 동안 2장이 쉬고 그다음엔 반대라 쉬는 비율이 0.5로 더 큽니다. microbatch를 늘리면 비율이 줄어듭니다.

### MoE는 token이 몰리면 일부 expert가 쉽니다

FFN(블록 안에서 token마다 따로 변환하는 층)을 여러 벌 두고 각 벌을 expert라 하며, router가 token마다 몇 벌만 고릅니다. token 4개, expert 2개, token마다 1개씩 고르면 고르게 갔을 때 expert마다 2 token입니다. 4 token이 모두 첫째 expert로 가면 둘째 expert는 놉니다. 한 expert가 받을 token 상한(capacity factor)을 넘은 token은 넘칩니다. 그래서 학습 때 배정이 한쪽으로 몰릴수록 커지는 항(load-balancing loss)을 오차에 더합니다.

## 퀴즈

<Quiz items={[
  {ask: '네 GPU의 기울기가 모두 [1, 0, 0, 0]입니다. all-reduce로 더한 합을 그대로 갱신에 쓰면 어떻게 되나요?', opts: ['정상적으로 갱신됩니다', '평균 기울기의 4배로 갱신한 것과 같습니다', '장마다 다른 가중치가 됩니다'], ans: 1, why: '합은 [4, 0, 0, 0]이고 평균은 [1, 0, 0, 0]입니다. 합을 쓰면 learning rate를 네 배로 키운 것과 같습니다. all-reduce 뒤에는 모든 장이 같은 값을 가지므로 가중치는 같게 유지됩니다.'},
  {ask: 'microbatch 4개의 pipeline에서 층과 장을 2개에서 4개로 늘리면 bubble 비율은 어떻게 되나요?', opts: ['줄어듭니다', '그대로입니다', '늘어납니다'], ans: 2, why: 'bubble 비율은 (장 수 - 1) / (microbatch 수 + 장 수 - 1)입니다. 장 2개에서는 1/5 = 0.2이고, 4개에서는 3/7 = 약 0.43입니다. 장을 늘릴수록 쉬는 칸이 늘어 같은 microbatch로는 효율이 떨어집니다.'},
]} />

<details>
<summary>더 깊이: ZeRO, 1F1B, 긴 문맥, MFU</summary>

- reduce-scatter는 더한 뒤 각 장에 합의 조각만 남기는 것이고, all-gather는 조각을 모아 모두에게 완성본을 주는 것입니다. FSDP는 optimizer state와 기울기, 가중치까지 조각으로 나눠 갖습니다. ZeRO의 1단계는 optimizer state만, 2단계는 기울기까지, 3단계는 가중치까지 나눕니다. 3단계에서는 행렬 곱 직전에 그 층의 가중치를 all-gather로 모았다가 곱이 끝나면 자기 조각만 남깁니다.
- 행으로 나누면 부분 출력을 이어 붙입니다. 1장은 \([1, 2]\)와 \([1, 1]\)의 곱 3, 2장은 \([3, 4]\)와의 곱 7을 계산하고 all-gather로 \([3, 7]\)을 모읍니다. 열로 나누면 부분 합을 더하고, 행으로 나누면 이어 붙입니다.
- pipeline에서 순방향 한 번과 역방향 한 번을 번갈아 하는 일정을 1F1B라고 합니다. 순방향만 먼저 몰아서 하면 중간 활성화가 메모리에 쌓입니다.
- 긴 문맥은 token 축으로 나누고(context parallelism), 어텐션이 다른 장의 키와 값을 필요로 하므로 키와 값을 장 고리를 따라 한 칸씩 넘깁니다(ring attention).
- MFU는 기계가 낼 수 있는 연산 중 가중치에 실제로 곱한 연산의 비율입니다. 1초에 100번 연산할 수 있는 기계에서 40번을 곱했다면 0.4입니다. 나머지는 all-reduce 대기, pipeline의 쉬는 칸, decode처럼 바이트당 연산이 작은 구간입니다.
- token 128개의 어텐션 표는 \(128 \times 128 = 16{,}384\)칸입니다. 이 표를 메모리에 다 썼다가 읽으면 곱보다 읽기가 시간을 가져갑니다. 타일로 나눠 타일 안에서 소프트맥스와 값의 곱까지 끝내는 구현이 FlashAttention입니다.
- 이 페이지의 GPU 장 수와 연산 횟수는 계산이 보이게 고른 수이고 측정값이 아닙니다. 먼저 읽으면 좋은 페이지는 [경사하강법](./gradient-descent.md)이고, 한 장 안의 prefill과 decode는 [Prefill, decode](../nlp/prefill-decode.md)에 있습니다.

</details>
