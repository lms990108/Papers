---
title: 작업공간
---

수행한 작업을 경력기술서 형식으로 정리했다. 과정과 측정은 각 상세 글에 있다.

### 고객사 데이터 수집·처리

- 역할: 설계, 구현, 측정, 연동 검증, 납품 형태 확정
- 개요: 고객사 원천(정형 Silver, 파일 NAS)을 검색과 서비스가 쓰는 형태로 넘기는 파이프라인. 정형은 Silver에서 검색용 JSON(Gold)으로 dump하고, 파일은 NAS를 마운트할 수 없는 환경에서 게이트웨이로 전송
- 주요 기여
  - Silver가 해시 append 이력층임을 전제로, 현재 스키마 표시가 켜진 레코드만 선별
  - 중복을 복제, 표기 차이, 항목 분리로 분류하고 `(데이터셋, 업무 키, 본문)` 기준 최신 1건을 기본 규칙으로 선정
  - JSON 필드를 펼치지 않고 스키마 라벨로 `title`과 `description` 생성
  - 레거시 커넥터 FULL·증분(I/U/D)을 Silver형 뷰와 더미 DB로 end-to-end 검증
  - 절대경로만 받는 파일 게이트웨이 구축. `sendfile` 기준으로 Python, Go, nginx를 비교하고 FastAPI 검사 + `X-Accel-Redirect` / nginx 구성으로 납품
- 성과
  - 동일 본문 복제 축소(한 셋 최대 20건에서 1건). 항목 소실을 막기 위해 표기 차이 중복은 감수
  - 로컬 FULL·I/U/D 건수를 SQL과 대조해 커넥터 JSON 산출 확인
  - `sendfile`로 CPU 시간 약 4~10배 절감(개발 머신, 1GB). 실회선에서는 큰 파일 소요 시간이 같고 CPU만 nginx가 낮음. 약 9MB/s에서 8.78GB 전송에 16분 54초
- 기술: SQL, MariaDB, JSON, 레거시 커넥터(FULL/IUD), 메달리온(Silver/Gold), Python, FastAPI, Go, nginx, `sendfile`, Linux
- 상세
  - [데이터 Dump 작업](./data-dump.md)
  - [NAS 파일 게이트웨이](./file-gateway.md)
