---
title: 비전 트랜스포머 (Vision Transformer, ViT)
sidebar_position: 46
mdx:
  format: mdx
---

import PatchGrid from '@site/src/components/viz/dl/d5/PatchGrid';
import Quiz from '@site/src/components/viz/Quiz';

비전 트랜스포머(ViT)는 이미지를 같은 크기의 패치로 자르고, 패치 하나를 token 하나로 보고 [트랜스포머](../nlp/transformer.md)에 넣는 모델입니다.

에이전트를 만들 때는 이미지를 받는 LLM을 쓰는 곳에서 만납니다.

- **멀티모달 LLM의 이미지 입력**: CLIP 계열 인코더 등 이미지를 token으로 바꾸는 앞 망으로 ViT가 많이 쓰입니다. → [멀티모달](./multimodal.md)
- **이미지 비용과 지연**: 이미지 한 장이 몇 개의 token이 되는지가 prefill 비용을 정합니다. 해상도와 패치 크기가 그 수를 결정합니다.
- **스크린샷 에이전트**: 글자가 작은 화면은 해상도를 낮추면 읽히지 않고, 높이면 token이 늘어납니다.

## 계산

224×224 이미지를 16×16 패치로 자르면 한 변에 \(224/16 = 14\)개씩, 패치 token이 \(14 \times 14 = 196\)개입니다. 패치 하나는 \(16 \times 16 \times 3 = 768\)개의 수이고, 선형 투영 하나가 이를 token 길이로 바꿉니다. 이미지 전체를 대표하는 분류 token(class token) 1개를 앞에 붙이면 시퀀스 길이는 197입니다.

\[
N = \frac{H W}{P^2}
\]

어텐션 표는 token 수의 제곱칸입니다. 아래 그림에서 해상도와 패치 한 변을 바꾸며, token 수와 어텐션 표 크기가 어떻게 달라지는지 보세요.

<PatchGrid />

```text
이미지     패치   패치 token   어텐션 표 칸(분류 token 제외)
224×224    32     49          2,401
224×224    16     196         38,416
224×224    8      784         614,656
448×448    16     784         614,656
```

패치 한 변을 반으로 줄이면 token이 4배, 표가 16배가 됩니다. 해상도를 두 배로 키워도 같습니다. 패치 한 변의 제곱에 반비례해 token이 늘기 때문입니다.

## 기억할 것 세 가지

### token 수가 곧 비용입니다

이미지 입력의 prefill 비용은 패치 token 수에 따라 커집니다. 고해상도 이미지는 한 번에 넣지 않고 인코더가 학습된 해상도의 조각으로 나눠 각각 인코딩한 뒤 합치는 방식(AnyRes)을 씁니다. 672×672를 한 번에 넣으면 48×48 = 2,304개 token에 표가 5,308,416칸이지만, 336×336 조각 4개로 나누면 표가 \(576^2 = 331{,}776\)칸씩 네 번입니다. 대신 언어 모델이 읽는 token은 늘어납니다. → [멀티모달](./multimodal.md)

### 위치 정보는 따로 더해 줍니다

어텐션은 순서를 모릅니다. 패치마다 학습되는 위치 임베딩을 더해 자리를 알려 줍니다. 해상도가 바뀌면 패치 수가 달라져 위치 임베딩을 그대로 쓸 수 없으므로 2차원으로 보간합니다. 분류 token은 이미지에서 잘라 낸 패치가 아니라 학습되는 목록입니다.

### CNN보다 항상 낫다는 뜻은 아닙니다

[합성곱 신경망](./cnn.md)은 이웃만 본다는 규칙과 같은 검출기를 여러 자리에 쓴다는 규칙이 구조에 들어 있습니다. ViT는 이 규칙이 거의 없어서 데이터가 그 몫을 해야 합니다. 논문(2020)은 대규모 사전학습에서 합성곱망과 견줄 만하거나 앞서고, 중간 규모 데이터(ImageNet)로만 학습하면 비슷한 크기의 ResNet보다 몇 퍼센트포인트 낮다고 보고했습니다. 이후 학습 방법(DeiT)과 구조(Swin)로 이 약점이 줄었고, 합성곱망을 현대화한 ConvNeXt가 맞서는 결과도 나왔습니다.

## 퀴즈

<Quiz items={[
  {ask: '패치 한 변이 16일 때 해상도를 224에서 448로 키우면 어텐션 표의 칸 수는 몇 배가 되나요?', opts: ['2배', '4배', '16배'], ans: 2, why: '한 변이 2배라 token이 4배(196에서 784)가 되고, 표는 token 수의 제곱이라 16배입니다.'},
  {ask: '224×224에서 패치 한 변을 16에서 32로 키우면 패치 token 수는 어떻게 되나요?', opts: ['절반', '4분의 1', '16분의 1'], ans: 1, why: '한 변의 패치 수가 14개에서 7개로 반이 되므로 token은 196개에서 49개, 4분의 1입니다. 표는 16분의 1(38,416칸에서 2,401칸)입니다.'},
  {ask: 'ViT에는 합성곱이 전혀 없다는 말은 맞나요?', opts: ['맞습니다', '패치를 token으로 바꾸는 입구는 합성곱 한 층과 같은 계산입니다', '위치 임베딩이 합성곱입니다'], ans: 1, why: '패치 임베딩은 kernel과 stride가 패치 크기인 합성곱 한 층과 같습니다. 그 뒤로는 어텐션과 MLP만 씁니다.'},
]} />

<details>
<summary>더 깊이: 구조, 모델 크기, 후속 연구</summary>

- 패치 임베딩 행렬 \(E\)는 768×768이라 589,824개이고, 바이어스까지 \((768 + 1) \times 768 = 590{,}592\)개입니다. 합성곱 출력 크기 식에 kernel 16, stride 16, padding 0을 넣으면 \(\lfloor (224 - 16)/16 \rfloor + 1 = 14\)입니다.
- 인코더는 [트랜스포머](../nlp/transformer.md) 블록과 같습니다. 층 정규화(LN)가 각 부분 앞에 있고 MLP는 층 두 개와 GELU입니다.

\[
z'_\ell = \mathrm{MSA}(\mathrm{LN}(z_{\ell-1})) + z_{\ell-1}, \qquad z_\ell = \mathrm{MLP}(\mathrm{LN}(z'_\ell)) + z'_\ell
\]

- 논문의 모델 크기: ViT-Base는 12층, \(D = 768\), 헤드 12개, 86M. ViT-Large는 24층, \(D = 1024\), 307M. ViT-Huge는 32층, \(D = 1280\), 632M입니다. ViT-L/16은 Large에 16×16 패치라는 뜻입니다.
- 위치 임베딩은 1차원 목록으로 충분했습니다. 논문의 ViT-B/16 실험에서 위치 임베딩이 없으면 0.614, 1차원이면 0.642, 2차원이면 0.640이었습니다.
- 사전학습 데이터는 ImageNet(이미지 약 130만 장), ImageNet-21k(약 1,400만 장), JFT-300M(약 3억 300만 장)입니다. 작은 데이터에서는 ViT가 ResNet보다 더 과적합했고, 큰 데이터에서 앞섰습니다. 논문은 이를 합성곱의 귀납 편향이 작은 데이터에서 유용하다는 뜻으로 읽었습니다.
- DeiT(2020)는 구조를 거의 그대로 두고 강한 증강과 정규화, 증류로 ImageNet-1k만으로 DeiT-B(86M) 81.8%(224 입력)를 냈습니다. Swin(2021)은 어텐션을 창 안에서만 계산하고 층마다 창을 밀어, 계산량이 이미지 크기에 선형입니다. ConvNeXt(2022)는 ResNet을 ViT와 Swin 쪽으로 고쳐 맞섰습니다.
- 224 해상도 ViT-Base에서는 어텐션 표가 비용의 대부분이 아니고(이차 항이 약 11%), token이 \(2C = 1{,}536\)개를 넘어서면 표 쪽이 더 커집니다.
- CLIP(2021)은 4억 개의 이미지-글 쌍으로 이미지 인코더와 글 인코더를 함께 학습했고, 이미지 인코더로 ResNet 다섯 가지와 ViT 세 가지를 비교했습니다. LLaVA-1.5는 CLIP-ViT-L-336px를 인코더로 쓰고 연결 모듈을 2층 MLP로 바꿨습니다. 입력 336×336, 패치 14이면 token이 \(24 \times 24 = 576\)개입니다.
- 먼저 읽으면 좋은 페이지는 [가중치 공유](./weight-sharing.md)와 [어텐션](../nlp/attention.md)입니다.

참고 자료는 모두 arXiv 페이지입니다.

- Dosovitskiy 등 (2020). An Image is Worth 16x16 Words. https://arxiv.org/abs/2010.11929
- Touvron 등 (2020). Training data-efficient image transformers & distillation through attention. https://arxiv.org/abs/2012.12877
- Liu 등 (2021). Swin Transformer. https://arxiv.org/abs/2103.14030
- Liu 등 (2022). A ConvNet for the 2020s. https://arxiv.org/abs/2201.03545
- Radford 등 (2021). Learning Transferable Visual Models From Natural Language Supervision (CLIP). https://arxiv.org/abs/2103.00020
- Liu 등 (2023). Improved Baselines with Visual Instruction Tuning (LLaVA-1.5). https://arxiv.org/abs/2310.03744

</details>
