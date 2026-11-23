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

원문은 올리지 않고 링크만 둔다. 리뷰 글은 `papers/paper/`에 두고, 홈 화면의 목록은 `src/components/Home/index.js`의 `PAPERS`에 직접 추가한다.

## 경력기술서

[경력기술서](papers/work/index.md)

## 학습공간

[학습공간](papers/learn/index.md)
