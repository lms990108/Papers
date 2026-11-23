---
title: RAG (retrieval-augmented generation)
sidebar_position: 1
mdx:
  format: mdx
---

import RagPipeline from '@site/src/components/viz/rag/r1/RagPipeline';
import Quiz from '@site/src/components/viz/Quiz';

RAG는 질문에 답하기 전에 관련 문서 조각을 찾아 prompt에 붙이고, [LLM](../nlp/llm.md)이 그 조각을 읽고 답하게 하는 방법입니다.

에이전트를 만들 때 가장 먼저 만나는 구조입니다.

- **사내 문서 Q&A**: 규정, 위키, 티켓 이력에서 근거를 찾아 답합니다.
- **코딩 에이전트**: 저장소에서 관련 파일과 함수를 찾아 context에 넣습니다.
- **에이전트의 search tool**: 모델이 필요할 때 검색을 호출하고, 결과를 읽고 다음 행동을 정합니다.

모델은 학습에 없던 사내 규정을 모릅니다. 규정 전체를 매번 prompt에 넣기에는 context window가 모자라거나 비용이 큽니다. 그래서 질문과 가까운 조각만 골라 붙입니다.

## 파이프라인

```text
문서 → 청크 → 임베딩·색인 (미리)
질문 → 검색(top-k) → [근거 + 질문]을 prompt로 → LLM → 답
```

아래 그림에서 단계 버튼을 눌러 문서가 답이 되는 길을 따라가 보세요. 질문과 k를 바꾸면 어느 단계에서 빗나가는지 보입니다.

<RagPipeline />

단계마다 내가 정해야 하는 설정이 있습니다.

| 단계 | 정하는 것 | 참고 |
| --- | --- | --- |
| 청킹 | 청크 크기, 오버랩, 자르는 경계 | [청킹](./chunking.md) |
| 검색 | 임베딩 모델, top-k, 키워드 검색 병행 여부 | [검색](./retrieval.md) |
| 색인 | 인덱스 종류, 메모리와 recall의 균형 | [벡터 인덱스](./vector-index.md) |
| prompt | 근거 배치, 인용 형식, 모르면 모른다고 하는 지시 | [그라운딩](./grounding.md) |
| 보강 | hybrid search, reranking, 검색 반복 | [고급 RAG](./advanced-rag.md) |
| 관계형 질문 | 지식 그래프, 커뮤니티 요약 | [지식 그래프](./knowledge-graph.md), [GraphRAG](./graph-rag.md) |

## 기억할 것 세 가지

### 답이 틀리면 검색부터 확인합니다

검색이 엉뚱한 조각을 가져오면 모델은 그 조각을 근거로 답합니다. 로그에 prompt에 들어간 조각을 남겨 두고, 정답 조각이 들어 있었는지부터 봅니다. 조각이 맞았는데 답이 틀렸다면 그때 prompt와 모델을 봅니다.

### RAG, 긴 prompt, fine-tuning은 목적이 다릅니다

- 문서 전체가 context window에 들어가고 호출이 많지 않다면 전부 넣는 쪽이 단순합니다.
- 문서가 context window보다 크거나 질문마다 필요한 부분이 작으면 RAG를 씁니다.
- 말투나 출력 형식을 바꾸고 싶다면 fine-tuning입니다. 새 사실을 넣는 용도로는 RAG가 잘 맞습니다.

### 문서가 바뀌면 색인도 고쳐야 합니다

RAG는 문서만 바꾸면 된다고 알려져 있지만, 실제로는 바뀐 문서의 청크를 다시 만들고 옛 청크를 색인에서 지워야 합니다. 옛 청크가 남아 있으면 검색이 옛 규정을 가져옵니다.

## 퀴즈

<Quiz items={[
  {ask: '답이 틀려서 로그를 열었더니, 정답이 적힌 청크가 prompt에 들어 있었습니다. 먼저 손볼 곳은 어디입니까?', opts: ['청크 크기를 줄인다', 'top-k를 늘린다', 'prompt 지시와 모델을 본다'], ans: 2, why: '정답 조각이 이미 입력에 있었으니 검색은 맞았습니다. 모델이 그 조각을 따르지 않았거나 다른 조각에 끌려간 경우이므로 생성 쪽을 봅니다.'},
  {ask: '연차 규정이 15일에서 20일로 바뀌었습니다. 문서 파일만 새 버전으로 교체하면 에이전트의 답이 바뀝니까?', opts: ['바뀐다. RAG는 문서만 참고하기 때문이다', '색인에 옛 청크가 남아 있으면 바뀌지 않을 수 있다', 'fine-tuning을 다시 해야만 바뀐다'], ans: 1, why: '검색은 색인에 들어 있는 청크를 찾습니다. 새 문서의 청크를 다시 임베딩해 넣고 옛 청크를 지워야 합니다.'},
]} />

<details>
<summary>더 깊이: 이 사이트의 RAG 글 읽는 순서</summary>

- 기본 흐름은 청킹, 검색, 그라운딩 순서입니다. [LLM](../nlp/llm.md), [임베딩](../nlp/embedding.md), [코사인 유사도](../nlp/cosine-similarity.md)를 먼저 읽어 두면 편합니다.
- 검색 속도와 메모리를 다룰 일이 생기면 [벡터 인덱스](./vector-index.md)를 봅니다.
- 한 청크에 답이 없는 질문이나 코퍼스 전체를 묻는 질문은 [지식 그래프](./knowledge-graph.md)와 [GraphRAG](./graph-rag.md)가 다룹니다.
- 생성 단계의 계산은 [LLM](../nlp/llm.md)과 같습니다. RAG는 새 손실 함수를 만들지 않고 입력에 조각이 더 붙을 뿐입니다.

</details>
