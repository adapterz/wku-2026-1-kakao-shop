# 🧑‍💻 Michael 개발일지 (M0 단계)

**작성일:** 2026년 7월 1일  
**작업 브런치:** `feature/db-schema`

## 🎯 오늘 진행한 작업
1. **로컬 DB 환경 구축:** 
   * MySQL 8.0 환경 변수(`\bin` 경로) 오류를 식별하고 올바른 경로로 재설정하여 로컬 터미널 연동 성공.
   * `mysql -u root -p` 정상 접속 확인 및 터미널 테스트 완료.
2. **카카오톡 선물하기 DB 뼈대 설계 (`schema.sql`):**
   * 팀 프로젝트 제약 조건(외부 결제 모듈 및 주소 API 미연동)을 고려하여 `orders` 테이블에 가짜(Mock) 상태 제어 컬럼(`payment_status`, `gift_status`) 추가.
   * `users`, `products`, `orders` 핵심 3개 테이블 생성 및 외래키(Foreign Key) 제약조건 설정.
3. **초기 더미 데이터 구축 (`seed.sql`):**
   * 피그마 기획서 상의 실제 데이터(본죽, 박카스, 하겐다즈 등)를 삽입하여 프론트엔드 UI 렌더링 시 이질감이 없도록 준비 완료.
4. **ERD 시각화 및 문서화 (`ERD.md`):**
   * dbdiagram.io (DBML 문법)를 활용해 작성한 SQL 구조를 시각화하고 이미지(`erd.png`)로 추출하여 팀원 공유용 마크다운 작성 완료.

## 💡 트러블슈팅 (Troubleshooting)
* **이슈:** Git Bash에서 `mysql` 명령어 입력 시 `command not found` 에러 발생.
* **원인:** 환경 변수(Path)에 MySQL 실행 파일이 위치한 정확한 `\bin` 폴더 경로가 누락됨.
* **해결:** Windows 시스템 환경 변수 편집에서 `C:\Program Files\MySQL\MySQL Server 8.0\bin` 경로를 정확히 추가한 뒤, 터미널을 완전히 재시작하여 해결.

## 🚀 다음 목표 (M1 단계)
* 구축된 DB 스키마를 바탕으로, 백엔드 서버(Node.js/Express 등)와 MySQL 연동 세팅 진행.
* 메인 홈 화면에 뿌려줄 상품 목록 조회(SELECT) 쿼리 테스트.