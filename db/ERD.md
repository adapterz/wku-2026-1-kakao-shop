# 📊 데이터베이스 엔티티 관계도 (ERD) 최종 설계서

본 데이터베이스 설계는 카카오톡 '선물하기' 클론 프로젝트의 M2/M3 마일스톤(익산 철도·버스 연계교통 환승패스 테마)을 완벽하게 지원합니다. 
AWS EC2 운영 서버에 배포된 실제 MySQL 데이터베이스(`kakao_gift`) 물리 스키마와 100% 동기화된 4대 핵심 테이블(`users`, `products`, `orders`, `gifts`) 구조를 가집니다.

---

## 📌 1. 핵심 아키텍처 및 비즈니스 로직 설계

### 1) 비회원(미가입자) 문자 선물하기 로직 (`NULL` 허용 구조)
* **문제 배경:** 기존 서비스는 가입된 회원(`users`) 간에만 선물이 가능하여, 플랫폼에 미가입된 친구나 가족에게 선물을 보낼 수 없는 확장성 한계가 있었습니다.
* **해결 아키텍처:** `orders.receiver_id`와 `gifts.receiver_id` 외래키(FK) 제약조건에 **`NULL`을 허용(Nullable)**하도록 고도화했습니다.
  * **가입 회원 선물 시:** `receiver_id`에 해당 회원의 `id`가 매핑되어 즉시 선물함으로 연동됩니다.
  * **비회원 문자 선물 시:** `receiver_id`는 `NULL`로 저장되며, 입력받은 휴대전화 번호(`receiver_phone`)를 기반으로 SMS/카카오톡 바코드 링크가 발송됩니다. 향후 수신자가 가입 시 `phone`을 대조하여 자산(`gifts`)을 소유자에게 연결할 수 있습니다.

### 2) 주문 당시 수신자 정보 스냅샷(Snapshot) 보존
* **설계 목적:** 회원의 닉네임이나 전화번호는 언제든 변경될 수 있습니다. 만약 주문 영수증이 수신자 회원 정보(`users`)에만 의존한다면, 수신자가 정보를 바꾸거나 탈퇴했을 때 결제 당시 누구에게 보냈는지 법적/운영적 거래 기록이 왜곡될 위험이 있습니다.
* **구현 방식:** `orders` 테이블에 **`receiver_name` (수신자 이름 스냅샷)**과 **`receiver_phone` (수신자 전화번호 스냅샷)** 컬럼을 독립적으로 신설했습니다.
* **기대 효과:** 백엔드 API(`POST /api/orders`) 호출 당시 입력된 수신자 정보를 영수증에 영구 보존하여 데이터 불변성과 감사(Audit) 추적성을 확보했습니다.

### 3) 트랜잭션 무결성 및 1:1 매핑 강제
* **중복 발급 차단:** `gifts` 테이블의 `order_id` 컬럼에 **`UNIQUE` 제약조건**을 적용했습니다. 하나의 결제 트랜잭션(`orders`)당 모바일 교환권(`gifts`)은 절대 2개 이상 중복 생성될 수 없습니다.
* **결제 상태 관리:** 별도의 PG사 결제 테이블을 생성하지 않고, `orders.payment_status` 컬럼(기본값 `'paid'`)을 통해 가짜(Mock) 결제 트래킹과 주문 완료 상태를 통합 제어합니다.

---

## 📌 2. 테이블 물리 명세서 (Data Dictionary)

> 💡 **기준:** 2026-07-15 운영 서버(`ap-southeast-2` EC2) MySQL 실제 테이블 조회(`DESCRIBE`) 기준

### 👤 1) `users` (회원 테이블)
* **목적:** 사용자 계정 식별 및 로그인 세션 인증 관리
* **특징:** 평문 비밀번호 유출 방지를 위해 `bcrypt` 해시 암호화가 적용되며, 탈퇴 시 레코드 삭제 대신 `deleted_at`을 기록하는 소프트 딜리트 방식입니다.

| 컬럼명 | 물리 데이터 타입 | NULL 허용 | 키 / 제약조건 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **id** | BIGINT | NO | **PK**, Auto Increment | NULL | 회원 고유 식별 일련번호 |
| **email** | VARCHAR(100) | NO | **UNIQUE** | NULL | 로그인 이메일 아이디 (중복 가입 방지) |
| **password** | VARCHAR(255) | NO | | NULL | `bcrypt` 암호화된 비밀번호 해시 |
| **name** | VARCHAR(50) | NO | | NULL | 사용자 실명 또는 화면 표시 닉네임 |
| **phone** | VARCHAR(20) | NO | | NULL | 휴대전화 번호 |
| **birth_date** | DATE | YES | | NULL | 생년월일 |
| **gender** | VARCHAR(10) | YES | | NULL | 성별 (`M` / `F`) |
| **created_at** | DATETIME | NO | | CURRENT_TIMESTAMP | 계정 생성 일시 |
| **updated_at** | DATETIME | NO | | CURRENT_TIMESTAMP (ON UPDATE) | 정보 최신 수정 일시 |
| **deleted_at** | DATETIME | YES | | NULL | 소프트 딜리트 탈퇴 일시 |

<br>

### 🛍️ 2) `products` (상품 테이블)
* **목적:** 익산 철도·버스 연계교통 환승패스 카탈로그 마스터 데이터 (18개 상품 시드 구성)
* **특징:** 프론트엔드 UI 카드 렌더링에 필요한 이미지 URL, 단가, 브랜드 운영기관 정보를 총괄합니다.

| 컬럼명 | 물리 데이터 타입 | NULL 허용 | 키 / 제약조건 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **id** | BIGINT | NO | **PK**, Auto Increment | NULL | 상품 고유 식별 번호 |
| **name** | VARCHAR(255) | NO | | NULL | 상품 공식 노출 명칭 (예: KTX 환승패스) |
| **price** | INT | NO | | NULL | 판매 기준 결제 단가 (원) |
| **description** | TEXT | YES | | NULL | 상품 이용 안내 및 상세 설명 |
| **thumbnail_url** | VARCHAR(255) | NO | | NULL | 대표 이미지 리소스 URL |
| **category** | VARCHAR(50) | NO | | NULL | 분류 코드 (`daily_pass`, `multi_pass` 등) |
| **brand_name** | VARCHAR(100) | NO | | NULL | 브랜드 및 운영기관 (`익산시`, `코레일` 등) |
| **created_at** | DATETIME | NO | | CURRENT_TIMESTAMP | 상품 등록 일시 |
| **updated_at** | DATETIME | NO | | CURRENT_TIMESTAMP (ON UPDATE) | 상품 정보 수정 일시 |

<br>

### 💳 3) `orders` (주문 테이블)
* **목적:** 선물하기 구매 트랜잭션 영수증 및 수신자 스냅샷 보존
* **특징:** `receiver_id`에 `NULL`을 허용하여 비회원 선물을 지원하며, 입력된 수신자 번호/이름을 영구 기록합니다.

| 컬럼명 | 물리 데이터 타입 | NULL 허용 | 키 / 제약조건 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **id** | BIGINT | NO | **PK**, Auto Increment | NULL | 주문 고유 번호 (영수증 단위 ID) |
| **buyer_id** | BIGINT | NO | **FK**, Index (`MUL`) | NULL | 결제를 수행한 구매자 회원 ID (`users.id`) |
| **receiver_id** | BIGINT | **YES** | **FK**, Index (`MUL`) | **NULL** | 가입 수신자 ID. **비회원 문자 선물은 `NULL`** |
| **receiver_phone** | VARCHAR(20) | **YES** | | **NULL** | **[스냅샷]** 주문 당시 수신자 휴대전화 번호 |
| **receiver_name** | VARCHAR(50) | **YES** | | **NULL** | **[스냅샷]** 주문 당시 수신자 이름/별명 |
| **product_id** | BIGINT | NO | **FK**, Index (`MUL`) | NULL | 구매한 대상 상품 ID (`products.id`) |
| **total_price** | INT | NO | | NULL | 최종 결제 확정 금액 |
| **payment_status** | VARCHAR(20) | NO | | `'paid'` | 결제 처리 상태 (`pending` / `paid`) |
| **gift_message** | TEXT | YES | | NULL | 선물과 함께 작성한 축하 메시지 카드 |
| **created_at** | DATETIME | NO | | CURRENT_TIMESTAMP | 주문 및 결제 완료 일시 |
| **updated_at** | DATETIME | NO | | CURRENT_TIMESTAMP (ON UPDATE) | 주문 내역 변경 일시 |

<br>

### 🎫 4) `gifts` (선물/교환권 테이블)
* **목적:** 수신자 선물함 노출 및 실시간 QR/바코드 매장 사용 트랜잭션 관리
* **특징:** `order_id`와 1:1로 매핑되며, 미가입자 선물을 위해 `receiver_id`는 `NULL`이 허용됩니다.

| 컬럼명 | 물리 데이터 타입 | NULL 허용 | 키 / 제약조건 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **id** | BIGINT | NO | **PK**, Auto Increment | NULL | 모바일 교환권 고유 일련번호 |
| **order_id** | BIGINT | NO | **FK**, **UNIQUE (`UNI`)**| NULL | 원천 주문 ID (**1:1 매핑 강제**) |
| **receiver_id** | BIGINT | **YES** | **FK**, Index (`MUL`) | **NULL** | 선물 수신자 ID. **비회원 교환권은 `NULL`** |
| **product_id** | BIGINT | NO | **FK**, Index (`MUL`) | NULL | 교환 대상 상품 ID (`products.id` 빠른 조회용) |
| **barcode** | VARCHAR(50) | NO | **UNIQUE (`UNI`)** | NULL | POS 기기 결제용 13자리 유니크 바코드 |
| **barcode_image_url** | VARCHAR(255) | NO | | NULL | 실시간 스마트폰 조회용 QR/바코드 이미지 URL |
| **status** | VARCHAR(20) | NO | | `'unused'` | 사용 상태 (`unused`: 미사용, `used`: 사용 완료) |
| **expired_at** | DATETIME | NO | | NULL | 교환권 유효기간 만료 일시 |
| **used_at** | DATETIME | **YES** | | **NULL** | 매장 바코드 소진(사용 완료) 처리 일시 |
| **created_at** | DATETIME | NO | | CURRENT_TIMESTAMP | 교환권 발급 일시 |
| **updated_at** | DATETIME | NO | | CURRENT_TIMESTAMP (ON UPDATE) | 상태 정보 수정 일시 |

---

## 🔗 3. 테이블 간 관계(Relationships) 및 인덱스 총괄

```text
[users] (1) ────< (N) [orders] (1) ──── (1) [gifts] >──── (0..1) [users]
  │                     │                    │
  └──────< (N) [products] >──────────────────┘