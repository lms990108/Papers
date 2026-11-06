---
title: 작업공간
---

수행한 작업을 경력기술서 형식으로 정리함. 과정·측정·결정은 각 상세 글에 둠.

### 고객사 데이터 수집·처리

- 역할: 설계·구현·측정·연동 검증·납품 형태 확정
- 개요: 고객사 원천(정형 Silver·파일 NAS)을 검색·서비스가 쓸 수 있는 형태로 넘기는 수집·선별·전송 파이프라인 담당. 정형은 이력층 Silver에서 검색용 JSON(Gold) dump, 파일은 NAS 마운트 불가 환경의 게이트웨이 전송
- 주요 기여
  - Silver가 완성본이 아니라 해시 append 이력 층임을 전제로, 스키마 버전 표시가 켜진 레코드만 선별하고 dump 책임 범위 확정
  - 동일 데이터셋·업무 키 중복을 복제·띄어쓰기 차이·항목 분리로 분류, `(데이터셋, 업무 키, 본문)` + 변환 시각 최신 1건을 전역 기본으로 선정
  - JSON 필드를 검색 스키마에 전개하지 않고 스키마 라벨로 `title`·`description` 생성. 메타 기동 적재, 본문 SELECT는 정규화 테이블 위주
  - 정형과 첨부 범위 분리. 첨부 메타는 로컬 검증만, 운영 조인 키는 후속. 레거시 커넥터 FULL·증분(I/U/D)에 Silver형 뷰·더미 DB로 end-to-end 검증(운영 SELECT만). 다중 원천 type 분기는 산출물에서 제외
  - 메인서버 NAS 마운트 불가 환경에서 절대경로만 받는 파일 게이트웨이 구축. 전송을 프로세스 복사와 `sendfile`로 나눠 Python·Go·nginx 경로 검증
  - 연결 래퍼·TLS 종단에서 `sendfile` 소실 확인 후 게이트웨이 내부 TLS 미종단 결정. FastAPI 검사 + `X-Accel-Redirect` / nginx `sendfile` 납품 형태, 허용 IP·동시 32·Range·토큰 제외
- 성과
  - 동일 본문 복제 축소(한 셋 최대 20건 → 1건 수준). 항목 소실 방지를 위해 띄어쓰기형 중복은 전역 감수. 본문 키 포함 이득 셋 수십 개·동일 본문 그룹 수백·수천 건 규모로 본문 키 기본 채택
  - 로컬 FULL·구간 I/U/D 건수 SQL 대조 후 커넥터 JSON 산출 확인. seed 대비 RECORDS 축소는 스키마·표시 필터 결과로 검증
  - 개발기 1GB 기준 `sendfile` CPU초 약 4–10배 절감. Python·Go CPU 동등, Go는 메모리·단일 바이너리 배포 근거로 정리
  - 실회선(~70MB/s) 대용량은 nginx·uvicorn 벽시계 동일·CPU만 nginx 우위(대역폭 병목). 소파일·단일 코어에서 nginx 처리량 우위. ~9MB/s에서 8.78GB 약 16분 54초, NFS 천장 ~180MB/s·동시 32 초과 시 옆 읽기 지연 확인
- 기술: SQL, MariaDB, JSON, 레거시 커넥터(FULL/IUD), 메달리온(Silver/Gold), Python, FastAPI, Go, nginx, `sendfile`, Linux
- 상세
  - [데이터 Dump 작업](./data-dump.md)
  - [NAS 파일 게이트웨이](./file-gateway.md)
