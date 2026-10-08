---
title: 자연어 처리 (natural language processing, NLP)
sidebar_position: 9
---

사람이 쓴 글을 입력으로 받고, 그 글에 대한 답을 수로 내는 일을 자연어 처리라고 한다. natural language processing, NLP와 같은 말이다. 자연어는 사람이 쓰는 말이다. 그림의 밝기와 달리, 글은 길이가 문장마다 다르고 칸의 밝기 같은 수가 아니다.

같은 문장 “날씨 나쁘다”로 기계에 시키는 일이 여러 가지다. 답이 어떤 모양인지만 다르다.

문장 전체에 표지를 하나 붙일 수 있다. “불만이다”와 “불만이 아니다” 가운데 하나를 고르는 식이다. 이것을 텍스트 분류라고 한다. text classification과 같은 말이다. 출력은 표지마다 점수 하나씩이다. 숫자 그림에서 0부터 9까지 점수를 내던 것과 같은 모양이고, 입력이 픽셀이 아니라 문장이다.

단어마다 표지를 붙일 수도 있다. “날씨”는 무엇에 대한 말이고 “나쁘다”는 그에 대한 평가라는 식이다. 출력은 단어 수만큼 있다. 문장이 길어지면 출력도 길어진다.

문장을 다른 문장으로 바꿀 수도 있다. 다음에 올 단어를 맞히거나, 같은 뜻을 다른 말로 옮기는 일이다. 출력의 길이도 입력과 따로 정해진다. 다음 단어를 맞히는 신경망은 [다음 토큰](./next-token.md)에 있다. 그 전에, 글을 조각으로 나누는 법이 [토큰화](./tokenization.md)다.

<figure>

<svg viewBox="0 0 680 168" role="img" aria-label="문장 날씨 나쁘다에서 문장 표지, 단어 표지, 다른 문장이 나간다." style="width:100%;max-width:680px;height:auto;display:block">
  <g fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="24" y="58" width="150" height="48"/>
    <rect x="430" y="16" width="210" height="36"/>
    <rect x="430" y="66" width="210" height="36" stroke="#c2410c"/>
    <rect x="430" y="116" width="210" height="36"/>
  </g>
  <g fill="currentColor" font-size="14">
    <text x="48" y="87">날씨 나쁘다</text>
    <text x="446" y="39">문장 표지 하나</text>
    <text x="446" y="89">단어마다 표지</text>
    <text x="446" y="139">다른 문장</text>
  </g>
  <g stroke="currentColor" fill="currentColor">
    <line x1="178" y1="82" x2="422" y2="34"/>
    <polygon points="422,34 410,30 412,42"/>
    <line x1="178" y1="82" x2="422" y2="84"/>
    <polygon points="422,84 410,78 412,90"/>
    <line x1="178" y1="82" x2="422" y2="134"/>
    <polygon points="422,134 410,128 414,140"/>
  </g>
</svg>

<figcaption>입력 문장은 하나다. 주황 칸은 단어 수만큼 답이 나오는 경우다.</figcaption>

</figure>

글을 세는 것만으로도 앞의 두 일을 시작할 수 있다. 단어가 몇 번 나왔는지만 보면 순서는 버려진다. 그 입력이 [단어 주머니](./bag-of-words.md)다. 바로 앞 단어만 보고 다음 단어를 세면 [엔그램](./ngram.md)이다. 순서를 남긴 채 신경망에 넣는 법은 그 다음이다.

숫자 그림처럼 칸 수가 고정된 입력과, 말처럼 길이가 매번 다른 입력은 뒷부분에서 다시 다룬다. 음성이나 필기를 격자로 읽는 것도 글을 다루는 일의 한 갈래이고, 계산은 [은닉 마르코프 모델](./hmm.md) 쪽에 있다.
