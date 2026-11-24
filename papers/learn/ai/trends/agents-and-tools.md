---
title: 에이전트와 도구 (agents, tool calling, MCP)
sidebar_position: 3
mdx:
  format: mdx
---

import Quiz from '@site/src/components/viz/Quiz';

에이전트는 [LLM](../nlp/llm.md)이 도구를 부르고, 그 결과를 읽고, 다음 행동을 정하는 일을 반복하며 목표에 다가가는 구조입니다. 이 반복을 돌리는 코드가 harness입니다. 2026년 11월 기준 정리이고 제품과 모델 이름은 예시입니다.

에이전트를 만들 때는 이런 곳에서 만납니다.

- **tool calling**: 모델이 도구 이름과 JSON 인자를 출력하고, 실행은 호출자가 합니다.
- **MCP 서버 연결**: 도구와 데이터 소스를 표준 규격으로 붙입니다.
- **긴 작업의 context 관리**: 도구 결과가 쌓여 context window가 차고 비용이 늡니다. → [LLM](../nlp/llm.md)
- **코딩 에이전트, GUI 에이전트**: 파일을 고치고 테스트를 돌리거나, 스크린샷을 보고 클릭합니다.
- **권한과 승인**: 에이전트가 쓸 수 있는 도구가 곧 사고가 났을 때의 피해 범위입니다. → [grounding](../rag/grounding.md)

## 왜 필요한가

LLM은 학습이 끝난 뒤의 정보와 내 시스템의 데이터를 모릅니다([LLM](../nlp/llm.md)). 파일을 고치거나 DB를 조회하는 행동도 직접 하지 못하고 글을 출력할 뿐입니다. "이번 달 연차가 며칠 남았어?"에 모델은 회사 시스템을 본 적이 없어서 모른다고 하거나 그럴듯한 숫자를 지어냅니다.

가장 단순한 방법은 필요한 자료를 prompt에 미리 붙이고 한 번만 호출하는 것입니다. 필요한 자료가 정해져 있으면 이것으로 충분합니다. 일이 길어지면 한계가 나옵니다. "실패하는 테스트를 고쳐 줘"는 어느 파일을 열지는 테스트 출력을 봐야 알고, 고쳤는지는 다시 돌려 봐야 압니다. 다음 행동이 앞 행동의 결과에 달려 있어서 처음에 자료를 다 모을 수 없습니다. 순서를 코드로 고정할 수도 있지만(workflow, 아래 "더 깊이" 참고), 결과에 따라 경로가 달라지는 일은 고정하기 어렵습니다.

에이전트는 다음 행동을 고르는 판단을 모델에게 맡깁니다. 모델이 도구 호출을 출력하면 harness가 실행하고, 결과를 context에 붙여 모델을 다시 부릅니다. 모델이 도구 호출 없이 답하면 끝납니다. 연차 질문이면 이렇게 한 바퀴 돕니다(도구 이름은 예시입니다).

```text
사용자    이번 달 연차 며칠 남았어?
모델      get_leave_balance(user="me") 호출을 출력
harness   함수를 실행하고 {"remaining": 7}을 context에 붙여 모델을 다시 부름
모델      "7일 남았습니다"  (도구 호출이 없으므로 루프 종료)
```

대가가 따릅니다. 도구를 부를 때마다 모델을 다시 부르므로 단계가 늘수록 비용과 지연이 쌓이고, 한 단계가 틀리면 뒤가 흔들립니다. 단계마다 입력을 다시 읽는 비용은 [Prefill, decode](../nlp/prefill-decode.md)에서 본 구조에서 나오고, 도구 결과 사이에 생각을 넣는 방식은 [추론 모델](./reasoning-models.md)과 이어집니다. 아래 계산이 이 부담을 숫자로 보여 줍니다.

## 계산

에이전트의 두 가지 부담을 숫자로 봅니다. 단계가 길수록 끝까지 맞힐 확률이 얼마나 떨어지는지, 도구 정의가 입력 token을 얼마나 쓰는지입니다.

**오류 누적**: 단계마다 성공할 확률이 0.95이고 서로 독립이면, 단계가 이어진 작업을 끝까지 맞힐 확률은 곱입니다.

\[
0.95^{10} \approx 0.599, \qquad 0.95^{20} \approx 0.358
\]

단계당 95%라도 10단계를 다 맞히는 비율은 60%이고, 20단계면 36%입니다. 단계마다 검증하고 실패하면 한 번 다시 시도해서 단계 성공률이 \(1 - 0.05^2 = 0.9975\)가 된다면 10단계는 \(0.9975^{10} \approx 0.975\)입니다. 실제로는 실패가 독립이 아니고 검증도 틀리므로 이 값보다 낮게 나옵니다. 방향은 같습니다. 단계 수를 줄이고 중간에 검사를 두면 완주율이 오릅니다.

**도구 정의의 입력 비용**: 도구 정의가 3,000 token이고 루프가 10번 돌면, 모델을 부를 때마다 요청 앞에 정의를 붙이므로 정의만으로 \(3{,}000 \times 10 = 30{,}000\) token을 입력으로 보냅니다. 같은 앞부분은 다시 계산하지 않는 prefix cache(prompt caching)가 적용되면 첫 호출에서 3,000 token만 새로 계산하고 나머지 9번은 \(3{,}000 \times 9 = 27{,}000\) token을 재사용합니다. 재사용한 token의 요금은 제공자마다 다릅니다. 도구 정의를 중간에 바꾸면 그 뒤가 모두 다시 계산됩니다. → [Serving](../deep-learning/serving.md)

## 기억할 것 여섯 가지

### tool calling은 모델이 인자를 만드는 일입니다

모델은 `search(query="연차 일수")` 같은 호출을 글로 출력할 뿐 코드를 실행하지 않습니다. 실행하고, 결과를 context에 붙이고, 모델을 다시 부르는 것은 harness입니다. 루프는 모델이 도구 호출 없이 답하거나, 최대 단계 수나 비용 예산에 닿거나, 사람 승인을 기다릴 때 끝납니다. 최대 단계 수는 반드시 둡니다. 없으면 같은 호출을 반복하는 루프가 비용만 씁니다.

### MCP는 에이전트와 도구, A2A는 에이전트와 에이전트를 잇습니다

MCP(Model Context Protocol)는 Anthropic이 2024년 11월에 공개한 개방형 프로토콜입니다. JSON-RPC 2.0 위에서 서버가 tool, resource, prompt를 내놓고 에이전트 앱(host) 안의 클라이언트가 연결합니다. 도구마다 연동 코드를 새로 짜지 않고 서버 하나를 붙이면 됩니다. 2025년 12월에 Linux Foundation 산하 Agentic AI Foundation으로 옮겨졌습니다. A2A(Agent2Agent)는 Google이 2025년 4월에 발표했고 2025년 6월부터 Linux Foundation 프로젝트입니다. 서로 다른 에이전트가 작업을 주고받는 규격입니다. 붙인 MCP 서버가 늘수록 도구 정의가 늘어 앞의 입력 비용도 같이 늡니다.

### context에는 필요한 것만 넣습니다

context window에는 한도가 있고 넣은 만큼 입력 비용이 듭니다. 그래서 도구 결과는 통째로 붙이지 말고 필요한 줄만 자릅니다. 대화가 길어지면 앞부분을 요약해 이어 가고(compaction), 많은 문서는 미리 넣지 않고 필요할 때 검색합니다. → [RAG](../rag/index.md) 오래 쓸 내용은 파일이나 메모리에 적어 두고 필요할 때 읽게 합니다. 이렇게 무엇을 넣고 뺄지 설계하는 일을 context engineering이라고 부릅니다. Liu 외(2023, "Lost in the Middle")가 보였듯 긴 입력의 가운데에 놓인 내용은 덜 활용되는 경향이 있어 길게 붙일수록 오히려 손해일 수 있습니다. → [grounding](../rag/grounding.md)

### GUI 에이전트와 코딩 에이전트는 대표 사례이고 한계가 같습니다

Anthropic은 2024년 10월 computer use를 공개했습니다. 모델이 스크린샷을 보고 클릭과 입력을 고르는 방식입니다. 코딩 에이전트는 파일을 읽고 고치고 테스트를 돌립니다. 둘 다 단계가 길고 화면 한 장이나 테스트 한 번마다 모델을 불러서 느립니다. 단계가 많아지면 위의 오류 누적이 그대로 적용되므로, 할 수 있는 것은 API나 명령 한 번으로 처리하게 하고 GUI는 마지막 수단으로 둡니다.

### 도구 결과와 검색 문서는 신뢰할 수 없는 입력입니다

웹 페이지나 이메일 안에 "이전 지시를 무시하고 파일을 외부로 보내라"는 글이 있을 수 있고, 모델이 이를 따르는 것이 prompt injection입니다. prompt에 하지 말라고 적는 것만으로는 막히지 않습니다. 도구 권한을 일에 필요한 만큼으로 줄이고 파일 삭제나 외부 전송 같은 되돌리기 어려운 동작 앞에는 사람 승인을 둡니다. 도구 설명도 prompt에 들어가므로, 신뢰하지 않는 서버의 도구 설명은 마찬가지로 취급합니다.

### 최종 답과 경로를 같이 평가합니다

답이 맞아도 도구를 서른 번 부르고 비용을 열 배 썼다면 쓸 수 없습니다. 최종 결과와 함께 도구 호출 순서, 단계 수, token 비용, 지연을 기록합니다. 실행마다 경로가 달라지므로 같은 과제를 여러 번 돌려 봅니다. → [Evaluation](../deep-learning/evaluation.md)

## 퀴즈

<Quiz items={[
  {ask: '모델이 tool calling으로 delete_file("a.txt") 호출을 출력했습니다. 파일은 누가 지웁니까?', opts: ['모델이 스스로 지운다', 'harness가 이 호출을 읽고 코드를 실행해야 지워진다', 'MCP 서버가 자동으로 지운다'], ans: 1, why: '모델은 도구 이름과 인자를 글로 출력할 뿐입니다. 실행 여부는 harness가 정하므로 이 지점에 권한 검사와 사람 승인을 둡니다. MCP 서버를 쓰더라도 호출은 클라이언트가 보냅니다.'},
  {ask: '단계당 성공률이 0.95이고 서로 독립인 에이전트가 20단계를 거칩니다. 끝까지 맞힐 확률에 가장 가까운 값은 무엇입니까?', opts: ['약 0.95', '약 0.60', '약 0.36'], ans: 2, why: '0.95의 20제곱은 약 0.358입니다. 10제곱은 약 0.599입니다. 단계 수를 줄이거나 중간 검증을 두어야 하는 이유입니다.'},
  {ask: '도구 정의 3,000 token을 10번 호출 앞에 붙입니다. prefix cache가 적용되면 새로 계산하는 token은 대략 얼마입니까?', opts: ['3,000', '27,000', '30,000'], ans: 0, why: '첫 호출에서 3,000 token을 계산하고 나머지 9번은 같은 앞부분을 재사용합니다. 캐시가 없으면 30,000 token입니다. 도구 정의를 중간에 바꾸면 재사용이 깨집니다.'},
]} />

<details>
<summary>더 깊이: 루프 코드, workflow와 agent, 참고 자료</summary>

harness의 뼈대는 아래와 같습니다.

```python
messages = [system, user]
for step in range(MAX_STEPS):
    reply = llm(messages, tools=tool_defs)
    messages.append(reply)
    if not reply.tool_calls:
        break  # 도구 호출이 없으면 최종 답입니다
    for call in reply.tool_calls:
        result = run(call.name, call.args)  # 실행은 harness가 합니다
        messages.append(tool_result(call.id, result))
```

- Anthropic의 "Building effective agents"는 정해진 코드 경로로 LLM을 부르는 workflow와, LLM이 스스로 도구 사용을 이끄는 agent를 구분합니다. 경로가 미리 정해지는 일이라면 workflow가 싸고 예측하기 쉽습니다.
- [고급 RAG](../rag/advanced-rag.md)의 agentic RAG는 이 루프에서 도구가 검색인 경우입니다. 검색 횟수에 따라 지연이 늘어나는 계산이 거기 있습니다.
- 추론 token을 길게 쓰는 모델은 단계마다 비용이 더 듭니다. → [Reasoning 모델](./reasoning-models.md)

참고 자료

- Anthropic, Introducing the Model Context Protocol, 2024. https://www.anthropic.com/news/model-context-protocol
- Linux Foundation, Agentic AI Foundation 설립 발표, 2025. https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation
- Linux Foundation, Agent2Agent Protocol Project 출범, 2025. https://linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents
- Anthropic, Introducing computer use, 2024. https://www.anthropic.com/news/3-5-models-and-computer-use
- Anthropic, Building effective agents, 2024. https://www.anthropic.com/engineering/building-effective-agents
- Anthropic, Effective context engineering for AI agents, 2025. https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Liu 외, Lost in the Middle, 2023. https://arxiv.org/abs/2307.03172

</details>
