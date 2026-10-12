# Dustin's Papers

로컬 주소는 http://localhost:3000 이다. 공개 주소는 https://lms990108.github.io/Papers/ 이다.

## 실행

```bash
npm ci
npm start
```

## 도커

```bash
docker compose up --build -d
```

글(`papers/`)만 고치면 다시 빌드하지 않아도 된다. `src/`나 설정을 고치면 위 명령을 다시 실행한다.

## 배포

`main`에 푸시하면 GitHub Actions가 사이트를 빌드해 GitHub Pages에 올린다. 로컬에서만 고친 글은 푸시하기 전에는 공개 주소에 없다.

## 챗봇

회사 개발서버 모델쓰고있어서 밖에선 안대용

## 논문

원문은 올리지 않고 링크만 둔다.

### Gradient-Based Learning Applied to Document Recognition

Yann LeCun, Léon Bottou, Yoshua Bengio, Patrick Haffner. *Proceedings of the IEEE*, 86(11):2278–2324, 1998.

[내용](papers/paper/content/lecun-1998.md) · [리뷰](papers/paper/review/lecun-1998.md) · [원문 PDF](http://yann.lecun.com/exdb/publis/pdf/lecun-98.pdf)

## 작업공간

[작업공간](papers/work/index.md)

## 학습공간

[학습공간](papers/learn/index.md)
