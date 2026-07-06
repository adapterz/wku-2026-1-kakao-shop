# 📊 데이터베이스 엔티티 관계도 (ERD) 최종 설계안

본 데이터베이스 설계는 카카오톡 '선물하기' 클론 프로젝트의 M2 마일스톤(한 바퀴 완주)을 완벽하게 지원하기 위해 작성되었습니다. API 명세서의 데이터 규격과 100% 동기화된 4개의 핵심 테이블 구조를 가집니다.

---

## 📌 1. 데이터베이스 구조 설계 전략

1. **중복 데이터 최소화 (정규화)**
   - `gifts` 테이블에 수신자나 상품 정보를 굳이 다시 적지 않고 오직 `order_id`만 남겨두었습니다. 
   - 백엔드는 조인(JOIN)을 사용해 `gifts` ➡️ `orders` ➡️ `users`/`products` 구조로 데이터를 영리하게 찾아옵니다.
2. **트랜잭션 무결성 확보**
   - `gifts` 테이블의 `order_id`에 `UNIQUE` 제약조건을 걸어, 하나의 결제(order)에서 선물 교환권이 중복으로 2개씩 무한 복사되는 시스템 버그를 원천 차단했습니다.
3. **가짜(Mock) 결제 인프라 최적화**
   - 결제 상태 처리를 위한 별도의 Payment 테이블을 파지 않고, `orders` 테이블 내에서 `payment_status`와 `payment_method` 컬럼으로 한 번에 관리하여 개발 속도를 높였습니다.

   

---

## 📌 2. 테이블 상세 명세서 (Data Dictionary)

### 👤 1) `users` (회원 테이블)
* **목적:** 가입자 식별, 로그인 세션 인증 관리
* **설명:** 비밀번호는 평문 저장을 막기 위해 암호화 처리되며, 탈퇴 시 데이터 유실을 막는 소프트 딜리트(`deleted_at`)가 적용되었습니다.

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| **id** | INT | PK, Auto Increment | 회원 고유 식별 번호 |
| **email** | VARCHAR(100) | NOT NULL, UNIQUE | 사용자 인증용 이메일 아이디 |
| **password** | VARCHAR(255) | NOT NULL | 암호화된 비밀번호 저장소 |
| **name** | VARCHAR(50) | NOT NULL | 사용자 실명 또는 화면 닉네임 |
| **phone** | VARCHAR(20) | NOT NULL | 연락처 번호 |
| **birth_date** | DATE | NULL | 생년월일 |
| **gender** | VARCHAR(10) | NULL | 성별 (M / F) |

<br>

### 🛍️ 2) `products` (상품 테이블)
* **목적:** 홈 화면 리스트 렌더링 및 상세 조회용 마스터 데이터
* **설명:** 화면 UI에 필요한 썸네일과 브랜드 이름까지 모두 관리합니다.

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| **id** | INT | PK, Auto Increment | 상품 고유 번호 |
| **name** | VARCHAR(255) | NOT NULL | 상품 공식 노출 명칭 |
| **price** | INT | NOT NULL | 실제 결제 기준 단가 |
| **description** | TEXT | NULL | 상품 상세 설명 문단 |
| **thumbnail_url** | VARCHAR(255) | NOT NULL | 상품 메인 이미지 URL |
| **category** | VARCHAR(50) | NULL | 상품 분류 코드 (coffee, food 등) |
| **brand_name** | VARCHAR(100) | NULL | 브랜드 이름 |

<br>

### 💳 3) `orders` (주문 테이블)
* **목적:** 거래 트랜잭션 기록 및 Mock 결제 상태 관리
* **설명:** 돈을 낸 사람(`buyer_id`)과 받을 사람(`receiver_id`)이 다를 수 있음을 완벽히 지원합니다.

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| **id** | INT | PK, Auto Increment | 주문 고유 번호 (영수증 단위) |
| **buyer_id** | INT | NOT NULL, FK | 결제를 수행한 구매자 ID (`users` 연동) |
| **receiver_id** | INT | NOT NULL, FK | 선물을 최종 수신할 대상자 ID (`users` 연동) |
| **product_id** | INT | NOT NULL, FK | 거래된 대상 상품 ID (`products` 연동) |
| **gift_message** | TEXT | NULL | 선물과 함께 보내는 메시지 텍스트 |
| **total_price** | INT | NOT NULL | 할인 등이 적용된 최종 결제 액수 |
| **payment_status** | VARCHAR(20) | DEFAULT 'pending' | Mock 결제 트래킹 상태 (성공 시 'paid') |
| **payment_method** | VARCHAR(50) | NULL | 결제 수단 (예: 'mock') |
| **paid_at** | TIMESTAMP | NULL | 실제 결제 성공 판정 일시 |

<br>

### 🎫 4) `gifts` (선물/교환권 테이블)
* **목적:** 수신자의 '선물함' 화면 노출 및 바코드 사용 트랜잭션 제어
* **설명:** `orders`에 종속된 교환권 자산이며, 바코드를 사용하면 `status`가 변경됩니다.

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| **id** | INT | PK, Auto Increment | 모바일 교환권 고유 일련번호 |
| **order_id** | INT | NOT NULL, FK, UNIQUE | 연동된 원천 주문 내역 ID (1:1 매핑 강제) |
| **barcode** | VARCHAR(50) | NOT NULL, UNIQUE | POS 결제용 유니크 바코드 넘버 |
| **barcode_image_url** | VARCHAR(255) | NULL | 바코드 이미지 리소스 경로 |
| **status** | VARCHAR(20) | DEFAULT 'unused' | 쿠폰 사용 상태 (`unused`: 미사용, `used`: 사용됨) |
| **used_at** | TIMESTAMP | NULL | 매장 등에서 바코드 사용 처리를 완료한 시각 |
| **expired_at** | TIMESTAMP | NULL | 모바일 교환권 유효기간 만료 시각 |

---

## 📈 3. 물리 ERD 시각화 자료 (Diagram)

> 💡 **주석:** 아래 다이어그램은 `dbdiagram.io`를 바탕으로 생성된 최종 테이블 관계도입니다. `users`와 `products`를 부모로 하여 트랜잭션 데이터인 `orders`와 `gifts`가 유기적으로 연결된 뼈대를 확인할 수 있습니다.

![최종 물리 ERD 다이어그램](./erd.png)