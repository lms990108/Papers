---
title: AI Study
---

위에서부터 읽으면 된다. 예와 정답으로 빈칸을 채우는 일이 머신러닝이고, 그 함수를 곱과 덧셈으로 만든 것이 신경망이다. 입력이 글인 문제는 자연어 처리다. 숫자 그림에 맞춘 배선과, 길이가 매번 다른 입력을 그래프로 다루는 방법은 그 다음이다. 사람이 고른 답으로 다시 맞추는 계산은 아직 없다.

같은 주제를 코드 실습까지 다루는 공개 교재로 위키독스의 [딥 러닝을 이용한 자연어 처리 입문](https://wikidocs.net/book/2155)이 있다. 여기 글은 그 목차의 개념을 계산 예로 다시 적은 것이고, 교재의 문장을 옮겨 둔 것은 아니다.

## 1. 머신러닝

규칙을 문장으로 적지 않고, 입력과 정답의 쌍으로 함수의 빈칸을 채운다. 정답이 칸이면 분류이고 연속된 수면 회귀다. 직선으로 수를 맞히고, 그 수를 비율로 바꾼 뒤, 부호만 보는 칸 하나에서 막히는 지점까지 본다.

- [머신러닝 (machine learning)](./machine-learning.md)
- [지도 학습 (supervised learning)](./supervised-learning.md)
- [선형 회귀 (linear regression)](./linear-regression.md)
- [로지스틱 회귀 (logistic regression)](./logistic-regression.md)
- [소프트맥스 (softmax)](./softmax.md)
- [퍼셉트론 (perceptron)](./perceptron.md)

## 2. 신경망

넣는 것은 수 목록이고, 나오는 것도 수 목록이다. 기계를 짧은 단계로 나눈 것이 층이고, 어느 수가 어느 수에 곱해지는지가 구조다. 빈칸은 오차를 줄이는 기울기로 고친다. 용량을 본 뒤에, 학습에 넣은 리뷰와 시험 리뷰를 가른다.

- [신경망 (neural network)](./neural-network.md)
- [층 (layer)](./layer.md)
- [신경망의 구조 (neural network)](./structure.md)
- [경사하강법 (gradient descent)](./gradient-descent.md)
- [확률적 경사하강법 (SGD)](./sgd.md)
- [역전파 (backpropagation)](./backpropagation.md)
- [기울기 소실 (vanishing gradient)](./gradient-vanishing.md)
- [용량과 정칙화 (capacity, regularization)](./capacity.md)
- [데이터 분리 (train, validation, test)](./data-split.md)
- [판별 학습 (discriminative learning)](./discriminative-learning.md)

## 3. 자연어

글은 길이가 문장마다 다르고, 밝기 같은 수가 아니다. 자르고 센 뒤 다음 단어의 비율을 만든다. 단어를 짧은 목록으로 바꾸고 문장 길이를 맞춘 다음, 상태를 한 칸씩 넘긴다. 그 망 다음에, 자리를 한꺼번에 보는 블록이 온다.

- [자연어 처리 (natural language processing, NLP)](./nlp.md)
- [토큰화 (tokenization)](./tokenization.md)
- [어간 추출 (stemming, lemmatization)](./stemming.md)
- [불용어 (stopword)](./stopword.md)
- [원-핫 인코딩 (one-hot encoding)](./one-hot.md)
- [단어 주머니 (bag of words)](./bag-of-words.md)
- [TF-IDF (term frequency–inverse document frequency)](./tf-idf.md)
- [코사인 유사도 (cosine similarity)](./cosine-similarity.md)
- [엔그램 (n-gram)](./ngram.md)
- [언어 모델 (language model)](./language-model.md)
- [임베딩 (embedding)](./embedding.md)
- [워드투벡터 (Word2Vec)](./word2vec.md)
- [패딩 (padding)](./padding.md)
- [순환 신경망 (recurrent neural network, RNN)](./rnn.md)
- [장단기 메모리 (LSTM)](./lstm.md)
- [어텐션 (attention)](./attention.md)
- [트랜스포머 (transformer)](./transformer.md)
- [다음 토큰 (next-token prediction)](./next-token.md)
- [버트 (BERT)](./bert.md)
- [개체명 인식 (named entity recognition)](./ner.md)

## 4. 그림의 배선

픽셀을 번호 매긴 목록으로만 보면, 같은 획을 위치마다 다시 배운다. 가까운 칸만 보고 같은 검출기를 여러 위치에 쓰면, 그 반복을 배선이 맡는다. 먼저 볼 예는 작은 합성곱망이다.

- [합성곱 신경망 (convolutional neural network, CNN)](./cnn.md)
- [가중치 공유 (weight sharing)](./weight-sharing.md)
- [서브샘플링 (subsampling)](./subsampling.md)
- [LeNet-5](./lenet-5.md)
- [RBF (radial basis function)](./rbf.md)

## 5. 다른 방법과 비교

같은 시험 집합이 있어야 오류 차이를 방법의 차이로 읽을 수 있다. 오류만 보지 않고, 인식할 때 계산량과 메모리도 같이 본다. 신경망만 답이 되는 것은 아니다.

- [MNIST](./mnist.md)
- [부스팅 (boosting)](./boosting.md)
- [서포트 벡터 머신 (support vector machine, SVM)](./svm.md)

## 6. 길이가 정해지지 않은 입력

숫자 그림 한 장과 달리 말과 문장은 길이가 매번 다르다. 후보 해석을 그래프로 나타내고, 경로 하나의 비용과 경로를 전부 더한 비용을 구분한다. 경계를 먼저 하나로 확정하지 않은 채, 문자열 전체의 손실로 앞 모듈까지 같이 학습한다.

- [은닉 마르코프 모델 (hidden Markov model, HMM)](./hmm.md)
- [비터비 (Viterbi)](./viterbi.md)
- [전방 알고리즘 (forward algorithm)](./forward-algorithm.md)
- [휴리스틱 과분할 (heuristic over-segmentation)](./over-segmentation.md)
- [그래프 변환 신경망 (graph transformer network, GTN)](./gtn.md)
- [공간 이동 신경망 (space displacement neural network, SDNN)](./sdnn.md)
