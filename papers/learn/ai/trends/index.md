---
title: 최신 동향
sidebar_position: 0
---

LLM과 에이전트를 만들 때 요즘 자주 마주치는 흐름을 모았습니다. 앞의 섹션이 오래 바뀌지 않는 원리라면, 이곳은 빠르게 바뀌는 쪽입니다. 2026년 11월 기준으로 정리했고 모델과 제품 이름은 예시입니다. 이름은 바뀌어도 아래 개념은 남습니다.

- **추론 모델**: 답하기 전에 긴 생각 token을 쓰는 모델입니다. 정확도를 token과 시간으로 삽니다. → [추론 모델](./reasoning-models.md)
- **Mixture of Experts**: 총 파라미터는 크고 token당 쓰는 파라미터는 작은 구조입니다. 호스팅할 때 메모리가 병목입니다. → [MoE](./moe.md)
- **에이전트와 도구**: 도구 호출 루프, MCP, context engineering, 오류 누적을 다룹니다. → [에이전트와 도구](./agents-and-tools.md)
- **효율적 추론**: quantization, distillation, speculative decoding으로 비용과 지연을 줄입니다. → [효율적 추론](./efficient-inference.md)
- **VLM과 멀티모달**: 이미지, 문서, 화면, 비디오를 읽는 모델입니다. → [VLM](../deep-learning/vlm.md), [Multimodal](../deep-learning/multimodal.md)

## 읽는 순서

이 섹션은 [Prefill, decode](../nlp/prefill-decode.md)와 [Continuous batching](../deep-learning/serving.md)을 읽었다고 가정합니다. 에이전트를 만든다면 [에이전트와 도구](./agents-and-tools.md)부터 읽고, 모델 선택과 비용이 궁금해지면 [추론 모델](./reasoning-models.md)과 [효율적 추론](./efficient-inference.md)으로 넘어갑니다. 모델을 직접 호스팅한다면 [MoE](./moe.md)를 함께 읽습니다. 처음부터 순서대로 읽어도 됩니다.
