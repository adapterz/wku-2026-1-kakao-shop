/*
 * 파일명: db/schema.sql
 * 목적: 카카오톡 선물하기 클론 프로젝트 (M2 마일스톤) 데이터베이스 생성 스크립트
 * 특징: 
 * - API 명세서의 요청/응답 JSON 파라미터를 물리 DB 표준인 snake_case로 100% 일치시켰습니다.
 * - orders 테이블에서 결제 상태(payment_status) 및 구매자/수신자 정보를 통합 관리합니다.
 * - gifts 테이블은 중복 데이터를 방지하기 위해 order_id와 1:1 매핑되며, 실제 매장에서 사용하는 바코드 상태(status, used_at)를 전담 제어합니다.
 
 * 구조적 흐름: 부모-자식 의존성 (schema.sql) 테이블을 생성(CREATE)하고 삭제(DROP)하는 순서는 외래키(FK)로 연결된 족보(부모-자식 관계)의 규칙을 철저하게 따랐습니다.
 
 * 삭제 흐름 (자식 ➡️ 부모 순서)
 * - 테이블을 지울 때는 자식부터 지워야 외래키 참조 에러가 나지 않습니다.
 * - 쿠폰(gifts) 삭제 ➡️ 영수증(orders) 삭제 ➡️ 상품(products) 및 회원(users) 삭제 순으로 DROP TABLE 코드가 맨 위에 배치되었습니다.
 
 * 생성 흐름 (부모 ➡️ 자식 순서)
 * - 테이블을 만들 때는 바탕이 되는 부모가 먼저 존재해야 합니다.
 * - 회원이 있고 상품이 있어야 ➡️ 주문/결제(orders)를 할 수 있고 ➡️ 결제가 완료되어야 ➡️ 쿠폰(gifts)이 발급되는 흐름입니다.
 * - 이 흐름에 맞춰 users, products를 먼저 CREATE하고, 마지막에 gifts를 CREATE 하도록 구성했습니다.
 */

SET NAMES utf8mb4;

-- [초기화] 기존 테이블이 있다면 자식 테이블부터 순서대로 안전하게 삭제합니다.
DROP TABLE IF EXISTS gifts;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;


-- ============================================================================
-- [1] 회원 테이블 (users)
-- ============================================================================
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,                 -- 회원 고유 번호 (API: userId)
    email VARCHAR(100) NOT NULL UNIQUE,                   -- 로그인 이메일 (API: email, UNIQUE)
    password VARCHAR(255) NOT NULL,                       -- 암호화된 비밀번호 (API: password)
    name VARCHAR(50) NOT NULL,                            -- 사용자 실명/이름 (API: name)
    phone VARCHAR(20) NOT NULL,                           -- 연락처 (API: phone)
    birth_date DATE NULL,                                 -- 생년월일 (API: birthDate)
    gender VARCHAR(10) NULL,                              -- 성별 (API: gender, 예: M, F)
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 가입 일시 (API: createdAt)
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 정보 수정 일시 (API: updatedAt)
    deleted_at DATETIME NULL                              -- 소프트 딜리트용 시간 기록 (API: deletedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 계정 및 프로필 정보';


-- ============================================================================
-- [2] 상품 테이블 (products)
-- ============================================================================
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,                 -- 상품 고유 번호 (API: productId)
    name VARCHAR(255) NOT NULL,                           -- 상품명 (API: name)
    price INT NOT NULL,                                   -- 판매 가격 (API: price)
    description TEXT NULL,                                -- 상품 상세 설명 (API: description)
    thumbnail_url VARCHAR(255) NOT NULL,                  -- 대표 썸네일 이미지 경로 (API: thumbnailUrl)
    category VARCHAR(50) NOT NULL,                        -- 카테고리 (API: category)
    brand_name VARCHAR(100) NOT NULL,                     -- 브랜드명/운영기관 (API: brandName)
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 등록 일시 (프론트 응답 제외, DB 내부 관리용)
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- 수정 일시 (프론트 응답 제외, DB 내부 관리용)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='선물 및 판매 상품 카탈로그';


-- ============================================================================
-- [3] 주문 테이블 (orders)
-- ============================================================================
CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,                 -- 주문 고유 번호 (API: orderId)
    
    buyer_id BIGINT NOT NULL,                             -- 결제자 ID (API 응답 내 buyer.userId)
    receiver_id BIGINT NULL,                              -- 가입 수신자 ID, 비회원 문자 선물은 NULL
    receiver_phone VARCHAR(20) NULL,                      -- 문자 선물 수신 번호 스냅샷, 구버전 주문은 NULL 가능
    receiver_name VARCHAR(50) NULL,                       -- 주문 당시 수신자 이름 스냅샷
    product_id BIGINT NOT NULL,                           -- 구매 상품 번호 (API: productId)
    
    total_price INT NOT NULL,                             -- 최종 결제 금액 (API: totalPrice)
    payment_status VARCHAR(20) NOT NULL DEFAULT 'paid',   -- 결제 상태 (API: paymentStatus)
    gift_message TEXT NULL,                               -- 선물 축하 메시지 카드 내용 (API: giftMessage)
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 주문/결제 완료 일시 (API: createdAt)
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_orders_buyer (buyer_id),
    INDEX idx_orders_receiver (receiver_id),
    
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='상품 구매 및 선물하기 결제 트랜잭션 영수증';


-- ============================================================================
-- [4] 선물/교환권 테이블 (gifts)
-- ============================================================================
CREATE TABLE gifts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,                 -- 쿠폰 고유 번호 (API: giftId)
    
    order_id BIGINT NOT NULL UNIQUE,                      -- 원본 주문 ID (1:1 매핑)
    receiver_id BIGINT NULL,                              -- 가입 수신자 ID, 비회원 문자 선물은 NULL
    product_id BIGINT NOT NULL,                           -- 교환할 상품 ID (API 조회용)
    
    barcode VARCHAR(50) NOT NULL UNIQUE,                  -- 매장 포스기 바코드 번호 (API: barcode)
    barcode_image_url VARCHAR(255) NOT NULL,              -- 바코드 이미지 경로 (API: barcodeImageUrl)
    
    status VARCHAR(20) NOT NULL DEFAULT 'unused',         -- 쿠폰 사용 상태 (unused -> used)
    expired_at DATETIME NOT NULL,                         -- 유효기간 만료 일시 (API: expiredAt)
    used_at DATETIME NULL DEFAULT NULL,                   -- 매장 사용 완료 일시 (API: usedAt)
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 쿠폰 발급 일시 (API: createdAt)
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_receiver_status (receiver_id, status),
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='수신자에게 발급된 모바일 교환권 및 소진 상태 관리';
