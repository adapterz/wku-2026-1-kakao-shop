# BE DEVLOG

## 2026-07-08 (작성자: Ethan)
- 한 일: M1 상품 조회 API 흐름 점검 및 `GET /api/products`, `GET /api/products/:id` 응답 구조 확인
- 왜: DB products 데이터가 BE API를 거쳐 FE 홈 화면에 표시되는 M1 핵심 흐름을 검증하기 위해
- 다음: API 응답 형식을 공통 구조로 정리

## 2026-07-08 (작성자: Ethan)
- 한 일: 상품 조회 응답에 공통 응답 함수(`sendSuccess`, `sendError`) 적용
- 왜: API마다 응답 형식이 달라지는 것을 막고 `status / message / data` 구조를 일관되게 유지하기 위해
- 다음: DB 연결 전 테스트용 더미 응답과 실제 DB 응답 기준 분리

## 2026-07-08 (작성자: Ethan)
- 한 일: 상품 조회 API 더미 데이터 제거 후 실제 DB 조회 기준으로 정리
- 왜: M1 승인 기준이 `DB -> BE API -> FE 화면 표시` 흐름이므로 코드 내 더미 데이터가 아닌 DB 데이터를 기준으로 맞추기 위해
- 다음: EC2 DB 연동 상태에서 상품 목록/상세 응답 확인

## 2026-07-09 (작성자: Ethan)
- 한 일: 로그인/회원가입 API 구현 (`POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`)
- 왜: M2 핵심 선물 플로우의 시작점인 인증과 세션 유지가 필요하기 때문에
- 다음: FE 로그인/회원가입 폼과 API 연결 확인

## 2026-07-09 (작성자: Ethan)
- 한 일: bcrypt 비밀번호 해시와 express-session 기반 로그인 상태 유지 적용
- 왜: 비밀번호 평문 저장을 막고, 주문/선물함처럼 로그인 필요한 API에서 현재 사용자를 확인하기 위해
- 다음: `requireLogin` 미들웨어를 로그인 필요 라우트에 적용

## 2026-07-10 (작성자: Ethan)
- 한 일: 주문 생성 API 구현 (`POST /api/orders`)
- 왜: 주문 생성 시 orders 기록과 gifts 발급이 같은 흐름에서 처리되어야 M2 선물 플로우가 이어지기 때문에
- 다음: 주문 상세 조회 API 및 결제 완료 화면 연동

## 2026-07-10 (작성자: Ethan)
- 한 일: 주문 상세 조회 API 구현 (`GET /api/orders/:id`)
- 왜: 결제 완료 화면에서 생성된 주문 결과를 조회해 주문번호, 상품, 메시지, 선물함 이동 정보를 표시하기 위해
- 다음: FE complete 화면에서 주문 상세 API 응답 확인

## 2026-07-10 (작성자: Ethan)
- 한 일: 선물함 목록 조회 API 구현 (`GET /api/gifts?status=unused|used`)
- 왜: 받은 선물함에서 미사용/사용완료 선물을 구분해 보여주는 M2 흐름을 준비하기 위해
- 다음: FE giftbox 화면과 선물함 API 연결
