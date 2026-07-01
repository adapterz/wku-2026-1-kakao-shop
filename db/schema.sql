/*
 * 파일: db/schema.sql
 * 목적: 카카오톡 선물하기 서비스 핵심 인프라 테이블 설계 (회원, 상품, 주문/선물함)
 * 왜 이렇게: 외부 결제 모듈 및 주소 API 연동 없이 내부 Mock 처리가 가능하도록 상태 제어 컬럼 반영
 */

-- 외래키 제약 조건을 고려하여 안전하게 기존 테이블 삭제
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- 1. 사용자 테이블 (회원가입 및 로그인 화면 기반)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,          -- 카카오메일 아이디 또는 이메일
    password VARCHAR(255) NOT NULL,               -- 암호화되어 저장될 비밀번호
    name VARCHAR(50) NOT NULL,                    -- 사용자 이름 또는 닉네임
    phone VARCHAR(20) NOT NULL,                   -- 카카오톡 연동 전화번호
    birth_date VARCHAR(10),                       -- [선택] 생년월일 (YYYY-MM-DD)
    gender VARCHAR(10)                            -- [선택] 성별 (MALE / FEMALE)
);

-- 2. 상품 테이블 (홈 화면 및 상세 페이지 기반)
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,                   -- 상품명 (예: 닭다리가 통째로 통닭다리 백숙죽)
    price INT NOT NULL,                           -- 실제 판매 가격 (할인가)
    original_price INT,                           -- 할인 전 원래 가격 (화면 표시용)
    discount_rate INT DEFAULT 0,                  -- 할인율 (%)
    brand_name VARCHAR(100) NOT NULL,             -- 브랜드명 (본죽, 동아제약, BBQ, 배스킨라빈스 등)
    image_url VARCHAR(255) NOT NULL,              -- 홈/랭킹 노출용 메인 이미지 URL
    description_image_url VARCHAR(255),           -- 상세페이지 하단 스크롤 설명 이미지 URL
    origin_info VARCHAR(100),                     -- 원산지 정보 (예: 국내산)
    shipping_info VARCHAR(100) DEFAULT '배송비 포함' -- 도서산간 추가 배송비 안내용 기본 문구
);

-- 3. 주문 및 선물함 테이블 (팀 4대 규칙 - Mock 처리 반영)
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,                        -- 구매자 고유 ID (users 테이블 참조)
    receiver_id INT,                              -- 선물받는 친구 ID (나에게 선물하기는 NULL 가능)
    product_id INT NOT NULL,                      -- 구매한 상품 고유 ID (products 테이블 참조)
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 주문 일시
    
    -- [팀 제약조건: 외부 결제 모듈 미연동에 따른 가짜 처리 컬럼]
    payment_status VARCHAR(20) DEFAULT 'SUCCESS', -- 결제 상태 (외부 API 없이 SUCCESS 상태로 가짜 완료 처리)
    gift_status VARCHAR(20) DEFAULT 'unused',     -- 선물함 상태 제어: unused(사용전) / used(사용완료)
    
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);