````markdown
# 📖 [DEVLOG] 익산 연계교통 환승패스 기반 카카오 선물하기

**프로젝트명:** 익산 연계교통 환승패스 기반 카카오 선물하기 (지역 특화 교통/모바일 커머스 플랫폼)  
**작성자:** 윤성준  
**담당 분야:** Backend Architecture · Database Modeling  
**개발 환경:** Node.js, MySQL, Docker, Git Flow  

---

# 📌 프로젝트 요약 및 기획 배경

본 프로젝트는 기존의 **'카카오 선물하기'** 플랫폼을 지역 특화 서비스로 재해석하여, 익산시의 철도(KTX/SRT) 및 시내·시외버스 연계 환승패스를 모바일 선물 및 모바일 티켓(QR) 형태로 구매·선물할 수 있도록 구축한 백엔드 시스템입니다.

총 **18종의 지역 환승패스 상품**을 정의하고, 주문부터 선물 수령, QR 발급까지의 실시간 트랜잭션을 안정적으로 처리하는 것을 목표로 합니다.

---

# M0. 프로젝트 기획 및 환경 구축

## 1. 프로젝트 주제 및 비즈니스 로직 정의

- **지역 특화 커머스 모델**
  - 단순 물품 배송이 아닌, **'익산 방문객 및 시민을 위한 교통 연계권(환승패스)'**을 선물하고 사용하는 무형 상품 거래 시스템 구축

- **상품 패키징 (총 18종)**
  - 이용 기간별(1일권, 3일권, 정기권) 및 교통수단 조합별(철도+버스, 시내+시외버스 등) 옵션을 세분화하여 데이터베이스에 정형화된 상품 스키마로 설계

---

## 2. 개발 및 협업 환경 구축

### 브랜치 전략 (Git Flow)

- `main` (배포)
- `develop` (통합 테스트)
- `feature/domain-name` (기능별 단위 개발)

구조로 안전한 형상 관리를 수행했습니다.

### 디렉터리 아키텍처 (Layered Architecture)

```text
├── src
│   ├── controllers   # HTTP 요청/응답 처리 및 라우팅
│   ├── services      # 주문, 선물, QR 발급 등 핵심 비즈니스 로직 처리
│   ├── repositories  # MySQL 데이터베이스 쿼리 및 트랜잭션 관리
│   ├── models        # 도메인 엔티티 및 DTO 정의
│   └── config        # DB 연결 및 환경변수(ENV) 설정
└── docker-compose.yml # 로컬 DB 독립 환경 구성
```

---

# M1. 핵심 기능 및 도메인 모델 설계

## 1. 도메인 모델 (Domain Models) 및 관계 정의

서비스의 핵심 비즈니스를 4개의 주체(Entity)로 도출하고, 명확한 관계(Relationship)를 설정하였습니다.

| 엔티티명 | 역할 및 핵심 데이터 | 타 엔티티와의 관계 |
| --- | --- | --- |
| users | 구매자 및 수신자 정보 (계정, 연락처, 보유 포인트) | orders (1:N), gifts (1:N) |
| products | 환승패스 상품 정보 (상품명, 가격, 유효기간, 18종 옵션) | orders (1:N) |
| orders | 결제 및 주문 트랜잭션 (주문일시, 결제상태, 총 금액) | users (N:1), gifts (1:1) |
| gifts | 선물 전달 및 QR 상태 관리 (수신자, 메시지, QR 토큰, 사용여부) | orders (1:1) |

### 💡 핵심 설계 의도

`orders(결제)`와 `gifts(사용권)`를 **1:1 분리**하여, 주문이 완료된 후 선물 수신자가 상태를 수락하거나 거절할 수 있는 카카오 선물하기 특유의 **비동기적 선물 수령 로직**을 구현했습니다.

---

## 2. API 명세 기반 매핑 규칙 (DTO ↔ DB Binding)

클라이언트(프론트엔드)의 API 통신 표준과 데이터베이스의 명명 규칙을 불일치 없이 매핑하기 위한 규칙을 수립했습니다.

Node.js 계층에서 ORM/Mapper를 통해 자동으로 변환하여 데이터 일관성을 유지합니다.

### API Payload (JSON - camelCase) ↔ MySQL Schema (snake_case)

#### 예시 데이터 매핑

```json
// [Client Request DTO - camelCase]
{
  "productId": 3,
  "buyerId": 102,
  "receiverPhone": "010-1234-5678",
  "giftMessage": "익산 여행 잘 다녀와!"
}
```

```sql
-- [DB Insert Columns - snake_case]
INSERT INTO orders (product_id, buyer_id, order_status, created_at) ...
INSERT INTO gifts (order_id, receiver_phone, gift_message, is_used) ...
```

---

## 3. 프론트엔드-백엔드 연동 및 QR 발급 트랜잭션 흐름

클라이언트의 주문 요청부터 탑승용 QR 코드 생성까지의 실시간 처리 흐름을 단계별 구조로 설계하였습니다.

1. **주문 요청 (Order Request)**
   - 프론트엔드에서 결제 승인 요청 (REST API 호출)

2. **주문 및 선물 생성 (Transaction)**
   - 백엔드 OrderService에서 `orders` 레코드와 `gifts` 레코드를 하나의 트랜잭션(COMMIT/ROLLBACK)으로 묶어 DB에 생성

3. **QR 식별자 생성 (Tokenizing)**
   - 결제 성공 시, 고유 암호화 토큰(UUID)을 생성하여 `gifts` 테이블의 `qr_token` 필드에 저장

4. **결과 반환 및 발급 (QR Rendering)**
   - 프론트엔드에 토큰을 반환하고, 클라이언트는 이를 QR 코드로 렌더링하여 환승 통과 시 스캔용으로 제시

---

# M2. 데이터베이스 물리 스키마 구축

## 1. 물리 스키마(schema.sql) 및 테이블 설계

데이터 무결성을 보장하고 검색 성능을 최적화하기 위해, 적절한 데이터 타입과 제약 조건(Constraints)을 적용했습니다.

```sql
-- 환승패스 상품 테이블 (18종 기획 데이터 저장)
CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 선물 및 QR 티켓 관리 테이블
CREATE TABLE gifts (
    gift_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    gift_message VARCHAR(255),
    qr_token VARCHAR(255) UNIQUE NOT NULL, -- QR 인증용 고유 토큰
    is_used BOOLEAN DEFAULT FALSE,         -- 환승패스 사용 여부
    used_at TIMESTAMP NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);
```

---

## 2. ERD 및 데이터 사전 문서화 (ERD.md)

팀원들과의 협업 및 유지보수를 위해 ERD 문서를 구체화했습니다.

- **제약 조건 명시**
  - 상품 가격 및 유효기간에는 음수가 들어갈 수 없도록 CHECK 제약 조건을 명시하고, 자주 조회되는 `qr_token`에는 `UNIQUE INDEX`를 적용하여 환승 간편 스캔 시 조회 속도를 최적화했습니다.

- **데이터 사전 결합**
  - 각 컬럼의 물리명, 논리명, 데이터 타입, Null 여부, 기본값(Default)을 문서화하여 프론트엔드 팀과 규격을 맞췄습니다.

---

## 3. Docker 컨테이너 기반 개발 환경 구성

운영체제(OS) 환경에 구애받지 않고 모든 팀원이 동일한 데이터베이스 환경에서 로컬 테스트를 진행할 수 있도록 Docker 인프라를 구성했습니다.

- **docker-compose.yml 적용**
  - MySQL 컨테이너를 격리하여 실행하고, 컨테이너 최초 실행 시 `/docker-entrypoint-initdb.d`에 `schema.sql`을 마운트하여 컨테이너 빌드 즉시 스키마와 18종의 시드(Seed) 상품 데이터가 자동 세팅되도록 자동화했습니다.

- **볼륨(Volume) 마운트**
  - 로컬 DB 데이터의 영속성(Persistence)을 유지하여 컨테이너 재시작 시에도 테스트 주문 내역이 소실되지 않도록 구성했습니다.
````
