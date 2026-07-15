# 🛠️ [TROUBLESHOOTING LOG] 익산 연계교통 환승패스 카카오 선물하기

**작성자:** 윤성준
**담당 분야:** Backend Architecture · Database Modeling
**핵심 키워드:** 도메인 엔티티 설계, 데이터 불변성(Immutability), 무결성 제약조건(Constraints), DDL 시퀀스

---

# 1. 비회원 선물하기 지원을 통한 비즈니스 요구사항 수용

## 🚨 Problem (문제 상황)

초기 DB 설계 시 `orders` 테이블의 `receiver_id`(수신자 ID) 컬럼에 `NOT NULL` 제약 조건이 설정되어 있었습니다.

이로 인해 서비스를 이용하지 않는 비회원에게는 익산 환승패스 모바일 교환권을 선물할 수 없는 치명적인 서비스 UX 한계가 발생했습니다.

### 💡 Cause (원인 분석)

수신자가 반드시 시스템의 `users` 테이블에 존재하는 가입 회원이어야만 주문이 성립되는 폐쇄적인 1:N 관계 매핑을 적용했기 때문입니다.

카카오 선물하기 특성상, 선물 수신자는 카카오톡 링크나 문자(LMS)를 통해 먼저 선물을 인지한 후 웹서비스로 진입하는 경우가 많다는 서비스 도메인 특성을 간과한 설계였습니다.

### 🔧 Solution (해결 방안)

수신자 ID(`receiver_id`)의 `NOT NULL` 제약조건을 해제하여 `NULL`을 허용하는 선택적 참조로 스키마를 변경했습니다.

비회원 선물을 수용할 수 있도록, 시스템 회원 여부와 관계없이 실물 문자로 QR 코드를 발송할 수 있는 필수 식별 정보를 별도 컬럼으로 분리했습니다.

```sql
ALTER TABLE orders MODIFY COLUMN receiver_id BIGINT NULL;
```

### 🎯 Result (결과 및 성과)

시스템 가입 여부와 무관하게 모든 사용자를 대상으로 환승패스 선물하기 기능이 가능해졌으며, 사용자 유입 및 환승패스 확산의 진입장벽을 제거했습니다.

(추후 수신자가 서비스를 이용할 때 연락처 기반으로 선물 내역을 동기화할 수 있는 유연성 확보)

---

# 2. 데이터 불변성(Immutability) 보장을 위한 주문 정보 Snapshot 적용

## 🚨 Problem (문제 상황)

회원이 개명하거나 연락처를 변경할 경우, 과거에 결제했던 이전 주문 내역이나 발송 완료된 선물 내역의 수신자 정보까지 현재 변경된 정보로 함께 바뀌어 조회되는 데이터 왜곡 현상이 발견되었습니다.

### 💡 Cause (원인 분석)

주문 내역(`orders`) 조회 시 수신자 정보를 엔티티에 직접 저장하지 않고, `users` 테이블과 실시간 `JOIN`을 통해 현재 시점의 회원 정보를 동적으로 가져오도록 설계되어 있었기 때문입니다.

주문 데이터는 발생한 그 시점의 상태를 영구적으로 보존해야 하는 **'불변 데이터(Immutable Data)'**라는 데이터베이스 아키텍처의 원칙에 위배되었습니다.

### 🔧 Solution (해결 방안)

`orders` 테이블 내에 결제 시점의 수신자 정보를 독립적으로 보관할 수 있는 스냅샷(Snapshot) 성격의 반정규화 컬럼을 추가했습니다.

```sql
ALTER TABLE orders
    ADD COLUMN receiver_name VARCHAR(50) NOT NULL,
    ADD COLUMN receiver_phone VARCHAR(20) NOT NULL;
```

서비스 계층(Service Layer) 로직 수정:

주문 생성 시점에 `users` 테이블에서 조회한 정보를 `orders` 테이블의 컬럼에 복사하여 정지된(Frozen) 상태로 `INSERT` 하도록 변경했습니다.

### 🎯 Result (결과 및 성과)

회원 계정 정보의 변경 트랜잭션과 무관하게, 과거의 모든 주문 및 선물 발송 내역이 결제 당시의 정확한 데이터로 영구 보관되어 금융/거래 서비스로서의 데이터 감사(Audit) 신뢰성을 확보했습니다.

---

# 3. 주문과 모바일 교환권 간의 무결성(1:1 관계) 보장

## 🚨 Problem (문제 상황)

네트워크 지연이나 API 중복 호출(Double Submit) 이슈 발생 시, 하나의 주문(`orders`)에 대해 모바일 교환권(`gifts` 및 QR 바코드) 레코드가 중복으로 다중 생성될 수 있는 취약점이 발견되었습니다.

### 💡 Cause (원인 분석)

`gifts` 테이블에서 주문을 참조하는 `order_id` 외래키 컬럼과 환승 통과에 사용되는 `barcode`(또는 `qr_token`) 컬럼에 `UNIQUE` 제약조건이 누락되어 있어, DB 레벨에서 중복 `INSERT`를 방어하지 못했습니다.

### 🔧 Solution (해결 방안)

비즈니스 로직(Application Level) 방어에만 의존하지 않고, 데이터베이스 물리 스키마 레벨에서 절대적으로 중복이 불가능하도록 제약조건을 강화했습니다.

```sql
ALTER TABLE gifts
    MODIFY COLUMN order_id BIGINT UNIQUE,
    MODIFY COLUMN barcode VARCHAR(50) UNIQUE;
```

### 🎯 Result (결과 및 성과)

1개의 주문 트랜잭션당 단 1개의 교환권과 바코드만 발행됨을 DB 엔진 레벨에서 100% 보장하게 되었으며, 환승패스의 중복 발행 및 어뷰징(악용) 가능성을 원천 차단했습니다.

---

# 4. 외래키(FK) 참조 무결성을 고려한 DDL 시퀀스 정립

## 🚨 Problem (문제 상황)

개발 환경에서 스키마 초기화 스크립트(`schema.sql`)를 재실행하여 DB를 리셋할 때마다 다음과 같은 외래키 참조 무결성 오류가 발생하며 Docker 컨테이너 초기화 및 테스트 자동화가 중단되었습니다.

```text
Error: Cannot delete or update a parent row: a foreign key constraint fails
```

### 💡 Cause (원인 분석)

테이블 간의 참조 종속성을 고려하지 않고 테이블 삭제(`DROP TABLE`) 및 생성(`CREATE TABLE`)을 실행했기 때문입니다.

자식 테이블(참조하는 테이블)이 여전히 부모 테이블(참조되는 테이블)의 PK를 바라보고 있는 상태에서, 부모 테이블을 먼저 삭제하려 하여 DB 엔진의 보호 메커니즘이 작동한 것입니다.

### 🔧 Solution (해결 방안)

데이터베이스의 엔티티 종속성(Dependency Matrix)을 분석하여 스크립트 내 DDL 실행 시퀀스를 정밀하게 재정렬했습니다.

#### 삭제 시퀀스 (자식 → 부모 순서)

```text
gifts → orders → products → users
```

#### 생성 시퀀스 (부모 → 자식 순서)

```text
users → products → orders → gifts
```

### 🎯 Result (결과 및 성과)

`schema.sql`의 반복 실행 및 자동화 스크립트가 오류 없이 무결하게 동작하게 되었으며, 팀원 전체의 Docker 로컬 DB 초기화 및 테스트 환경 구축 시간이 크게 단축되었습니다.
