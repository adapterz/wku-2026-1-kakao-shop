# FE DEVLOG

## 2026-07-09 (작성자: ggue1203)
- 한 일: index.html 요청사항 수정 (배너 이미지 제거·마스코트 배지 재배치, 카테고리 '정기권' 추가 및 순서 조정, 헤더 로고 확대·배경 제거)
- 왜: 배너와 마스코트 문구가 겹쳐 보이는 문제, 로고가 작고 어색해 보이는 문제 해결
- 다음: product.html 제작

## 2026-07-09 (작성자: ggue1203)
- 한 일: product.html 제작 (패스 상세 화면, 익산 환승패스 테마)
- 왜: M2 핵심 흐름(상품 상세)에 필요한 화면을 피그마 기준으로 구현
- 다음: order.html 제작

## 2026-07-09 (작성자: ggue1203)
- 한 일: order.html 제작 (주문서 화면, 메시지 카드/받는 사람 선택/결제 정보 포함)
- 왜: M2 핵심 흐름(주문 생성)에 필요한 화면을 피그마 기준으로 구현
- 다음: complete.html 제작

## 2026-07-09 (작성자: ggue1203)
- 한 일: complete.html 제작 (결제 완료 화면)
- 왜: M2 핵심 흐름(주문 완료 확인)에 필요한 화면을 피그마 기준으로 구현
- 다음: giftbox.html 제작

## 2026-07-09 (작성자: ggue1203)
- 한 일: giftbox.html 제작 (선물함 화면, 미사용/사용완료 탭 포함)
- 왜: M2 핵심 흐름(받은 선물 확인)에 필요한 화면을 피그마 기준으로 구현
- 다음: gift-use.html 제작

## 2026-07-09 (작성자: ggue1203)
- 한 일: gift-use.html 제작 (선물 사용 화면, QR 표시 영역 포함)
- 왜: M0-1 익산 테마 변경사항(바코드 → QR) 반영하여 M2 핵심 흐름(패스 사용) 화면 구현
- 다음: FE 필수 페이지 8개 제작 완료, 이벤트 처리 리팩터링 진행

## 2026-07-09 (작성자: ggue1203)
- 한 일: product.html, order.html, complete.html, giftbox.html의 inline onclick 이벤트를 각각 product.js/order.js/complete.js/giftbox.js로 분리
- 왜: 팀원(ggue) 제안에 따라 home.js/login.js/signup.js와 코드 구조 통일, order.js에는 로그인 확인 로직·주문 생성 API 호출 추가
- 다음: login.html/signup.html 색상 테마 반영

## 2026-07-09 (작성자: ggue1203)
- 한 일: 로그인/회원가입 버튼 색상 변경 (노란색 → 익산 테마 파란색) 및 텍스트 색상 흰색으로 변경
- 왜: 버튼 배경색을 테마 색상(#005bac)으로 통일, 파란 배경에 검은 텍스트로 가독성이 떨어지는 문제 해결
- 다음: BE API 완성 후 각 화면 실제 데이터 연동 (product.js/order.js/giftbox.js/gift-use.js의 TODO 항목 처리)

## 2026-07-10 (작성자: ggue1203)
- 한 일: createProductCard 함수를 home.js에서 components.js로 이동, 상품 카드 클릭 시 product.html 이동 이벤트 및 하단 탭바 선물함 버튼 클릭 이벤트 추가
- 왜: components.js 원래 계획(반복 UI 함수 재사용)에 맞게 정리하고, 상품 카드를 클릭해도 상세 페이지로 이동 안 되던 M2 핵심 흐름 단절 문제와 선물함 버튼 미동작 문제 해결
- 다음: product.js/order.js/gift-use.js의 productId·giftId 임시 고정값을 URL 쿼리스트링 기반 실제 값으로 교체