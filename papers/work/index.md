---
title: 경력기술서
---

## 포티투마루 (2026.09 ~ 현재)

- 역할: 백엔드 개발
- 개요: AX 전환 및 RAG 연동을 위한 데이터 파이프라인 구축
- 주요 업무
  - NAS / API / RDB 등 각 고객사 환경에 맞는 데이터 연동 파이프라인 구축
- 성과
  - 대규모 정형·비정형 데이터를 전처리해 검색 서비스에 연동
- 기술: SQL, MariaDB, Python, FastAPI, Go, nginx, Linux, 메달리온 아키텍처(Silver/Gold)

## 위지온 (2025.12 ~ 2026.08)

- 역할: 백엔드 개발 및 운영(운영개발실 선임연구원)
- 개요: PG 솔루션 유지보수 및 신규 서비스 백오피스 개발
- 주요 업무
  - 자사 PG 서비스 관리자 API 개발
  - 정산/결제 서비스 운영 및 유지보수
  - 선불결제 및 회원관리 솔루션 백오피스 구현
  - 가맹점 관리, 고객관리 솔루션 구현
- 기술: Java, Spring Boot, Spring Batch, MyBatis, SQL, JavaScript, TypeScript

## 잇잇 (2024.12 ~ 2025.10)

- 역할: 백엔드 개발 및 운영
- 개요: 축제 푸드트럭 결제 서비스(Eat It) 운영 및 축제 커뮤니티 결합 서비스(Pamp) 고도화
- 주요 업무
  - 회원제 전환: 유저 도메인 설계, OIDC 소셜 로그인 구현
  - 결제 정합성: 주문 Snapshot 대조와 유니크 키 기반 멱등성
  - 주문 전달 구조: WebSocket을 폴링(Outbox, 커서 기반 페이징)으로 전환
  - 배포 자동화: GitHub Actions와 ECR로 ECS 배포를 자동화하고 CI에 Redis 컨테이너 추가
  - Pamp 리브랜딩: 도메인 중심 ERD, 헥사고날 구조, 토스페이먼츠·알림톡 연동, 슬로우 쿼리 개선
- 성과
  - 두 차례 축제 행사에서 1만 건 이상 결제를 장애 없이 처리, 결제 대금 1억 원 이상
  - 배포 소요 시간 약 20분에서 6~8분으로 단축
  - 테스트 환경에서 초 단위였던 조회 응답 시간을 1/10 이하로 단축, 유닛 테스트 커버리지 70% 이상 유지
- 기술: Java, Spring Boot, MySQL, Redis, AWS(ECS, ECR, RDS, ElastiCache, Lambda), QueryDSL, Liquibase, GitHub Actions
