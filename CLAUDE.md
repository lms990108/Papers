# Papers

## 문서 작성 규칙

- `papers/` 아래 한국어 문서를 새로 쓰거나 고칠 때는 마지막에 항상 `humanize-korean` 스킬로 AI 말투를 점검하고 윤문한다.
- 독자는 ML 연구자가 아니라 AX(에이전트) 개발자다. 짧고 실무 중심으로 쓰고, 공식은 한 줄만 두고 깊은 내용은 `<details>`로 접는다.
- 업계에서 영어 그대로 쓰는 용어(temperature, token, prompt, top-k 등)는 번역하지 말고 영어로 쓴다. 예: "온도" 대신 "temperature".
- 인터랙티브 그림은 글로 전하기 어려운 과정을 보여 줄 때만 둔다. 숫자만 바뀌는 슬라이더는 두지 않는다.
- 문서 수정 후에는 `npx docusaurus build`로 빌드하고, 로컬 서버(`npx docusaurus serve --port 3000`)가 떠 있는지 확인해 주소를 알린다.
