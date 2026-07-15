/*
 * 파일명: db/seed.sql
 * 목적: 카카오톡 선물하기 클론 프로젝트 (M2 마일스톤) 테스트용 초기 데이터 생성 스크립트
 * 테마: 환승패스 + 대중적인 카카오톡 선물하기 상품 총 18개
 * 수정사항: password_hash 컬럼명 반영, bcrypt $2b$ 해시 적용, 상품 18개로 증량
 */
SET NAMES utf8mb4;

-- 안전한 데이터 재삽입을 위해 외래키 체크를 잠시 끄고 기존 데이터를 초기화합니다.
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE gifts;
TRUNCATE TABLE orders;
TRUNCATE TABLE products;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================================
-- [1] 회원 초기 데이터 (users) 
-- ============================================================================
INSERT INTO users (id, email, password, name, phone, birth_date, gender, created_at, updated_at) VALUES
(1, 'buyer1@example.com', '$2b$10$dXJ2bXNoYXNoYmFzZTY0dXNlcmNhcmRz...', '홍길동', '010-1234-5678', '2000-01-01', 'M', NOW(), NOW()),
(2, 'receiver1@example.com', '$2b$10$dXJ2bXNoYXNoYmFzZTY0dXNlcmNhcmRz...', '성춘향', '010-9876-5432', '2001-05-05', 'F', NOW(), NOW()),
(3, 'user3@example.com', '$2b$10$dXJ2bXNoYXNoYmFzZTY0dXNlcmNhcmRz...', '이몽룡', '010-5555-5555', '1999-11-11', 'M', NOW(), NOW());


-- ============================================================================
-- [2] 상품 데이터 (products) - 익산 환승패스 세계관 100% 반영 (18개)
-- ============================================================================
INSERT INTO products (id, name, price, description, thumbnail_url, category, brand_name, created_at, updated_at) VALUES
(1, '익산 시내버스 무제한 1일 패스', 5000, '발급 후 24시간 동안 익산시 전 권역 시내버스를 무제한 탑승할 수 있는 스마트 패스입니다.', '/images/products/iksan-bus-1day.png', 'daily_pass', '익산시', NOW(), NOW()),
(2, '익산-전주 광역 통합 환승 10회권', 18000, '익산과 전주를 오가는 광역버스와 시내버스 환승 시 차감하여 사용하는 다회권 패스입니다.', '/images/products/iksan-jeonju-10.png', 'multi_pass', '전북교통', NOW(), NOW()),
(3, 'KTX 익산역 주말 연계 패스 (금·토·일)', 12000, '주말 동안 KTX 익산역 하차 후 익산 시내 모든 대중교통을 무제한 이용하는 패스입니다.', '/images/products/iksan-ktx-weekend.png', 'weekend_pass', '코레일', NOW(), NOW()),
(4, '익산 다이로움 택시 5,000원 쿠폰', 5000, '익산 공공호출앱 다이로움 택시 이용 시 요금을 5,000원 할인받을 수 있는 쿠폰입니다.', '/images/products/iksan-taxi-5k.png', 'taxi', '다이로움', NOW(), NOW()),
(5, '원광대 학생 전용 통학버스 1달 정기권', 45000, '원광대학교 재학생을 위한 익산 시내 및 전주/군산 통학버스 1개월 정기 탑승권입니다.', '/images/products/wku-bus-monthly.png', 'monthly_pass', '원광대학교', NOW(), NOW()),
(6, '익산 공공자전거 1주일 이용권', 3000, '익산시 곳곳에 비치된 공공자전거를 7일간 자유롭게 대여할 수 있는 이용권입니다.', '/images/products/iksan-bike-1week.png', 'bike', '익산시', NOW(), NOW()),
(7, '미륵사지·왕궁리 야간 투어 버스권', 8000, '익산의 대표 야경 명소인 미륵사지와 왕궁리 유적을 도는 야간 시티투어 승차권입니다.', '/images/products/iksan-night-tour.png', 'tour_pass', '익산문화관광', NOW(), NOW()),
(8, '익산역 ↔ 국가식품클러스터 출퇴근 셔틀권', 35000, '국가식품클러스터 직장인들을 위한 익산역 왕복 셔틀버스 한 달 정기권입니다.', '/images/products/iksan-food-shuttle.png', 'monthly_pass', '국가식품클러스터', NOW(), NOW()),
(9, '청소년 전용 100원 버스 30회 충전권', 3000, '익산시 청소년 전용 요금인 100원으로 시내버스를 30회 탑승할 수 있는 충전권입니다.', '/images/products/iksan-youth-30.png', 'youth_pass', '익산시', NOW(), NOW()),
(10, '익산 ↔ 군산 통합 시외버스 5회권', 20000, '익산과 군산을 오가는 직행 시외버스를 5회 이용할 수 있는 회차권입니다.', '/images/products/iksan-gunsan-5.png', 'multi_pass', '전북고속', NOW(), NOW()),
(11, 'KTX 익산역 환승 주차장 1일 무료권', 10000, 'KTX 열차 이용객이 익산역 공영주차장을 24시간 무료로 이용할 수 있는 주차패스입니다.', '/images/products/iksan-parking-1day.png', 'parking', '코레일네트웍스', NOW(), NOW()),
(12, '장애인콜택시(교통약자) 10회 이용권', 15000, '익산시 교통약자 이동지원센터의 콜택시를 10회 이용할 수 있는 전용 바우처입니다.', '/images/products/iksan-disabled-taxi.png', 'welfare_pass', '익산시', NOW(), NOW()),
(13, '심야 안심 귀가 택시 바우처 1만원권', 10000, '밤 10시 이후 익산 시내에서 안전하게 귀가할 때 사용하는 택시 전용 바우처입니다.', '/images/products/iksan-night-taxi.png', 'taxi', '다이로움', NOW(), NOW()),
(14, '익산 시티투어 순환형 승차권 (성인)', 4000, '하루 동안 익산 시티투어 버스를 자유롭게 타고 내릴 수 있는 순환형 승차권입니다.', '/images/products/iksan-citytour-adult.png', 'tour_pass', '익산문화관광', NOW(), NOW()),
(15, '다이로움 교통 충전권 1만원권', 10000, '익산 지역화폐 다이로움 카드에 충전하여 교통카드로 즉시 사용 가능한 금액권입니다.', '/images/products/iksan-dairoum-10k.png', 'giftcard', '다이로움', NOW(), NOW()),
(16, '가족 나들이 4인 통합 교통패스 (1일)', 15000, '가족 4명이 하루 동안 익산 시내버스를 무제한 탑승할 수 있는 주말 전용 패스입니다.', '/images/products/iksan-family-1day.png', 'family_pass', '익산시', NOW(), NOW()),
(17, '보석박물관 연계 시내버스 왕복권', 3000, '익산 보석박물관을 방문하는 관람객을 위한 시내버스 특별 왕복 승차권입니다.', '/images/products/iksan-jewel-bus.png', 'tour_pass', '익산시', NOW(), NOW()),
(18, '익산 ↔ 전주 운행 심야버스 이용권', 4000, '자정 이후 익산과 전주를 운행하는 심야버스를 1회 탑승할 수 있는 안전 패스입니다.', '/images/products/iksan-midnight-bus.png', 'night_pass', '전북교통', NOW(), NOW());


-- ============================================================================
-- [3] 주문 초기 데이터 (orders)
-- ============================================================================
INSERT INTO orders (id, buyer_id, receiver_id, receiver_phone, receiver_name, product_id, total_price, payment_status, gift_message, created_at, updated_at) VALUES
(1, 1, 2, '01098765432', '성춘향', 1, 5000, 'paid', '춘향아, 내일 익산 시내 투어할 때 이 버스 패스로 편하게 이동해!', '2026-07-01 10:00:00', '2026-07-01 10:00:00'),
(2, 3, 1, '01012345678', '홍길동', 5, 45000, 'paid', '길동아, 이번 달 통학 편하게 하라고 정기권 보낸다.', '2026-07-02 14:30:00', '2026-07-02 14:30:00'),
(3, 2, 3, '01055556666', '이몽룡', 3, 12000, 'paid', '몽룡 도령, 이번 주말 KTX 타고 익산역 올 때 요긴하게 쓰셔요.', '2026-07-03 09:15:00', '2026-07-03 09:15:00');


-- ============================================================================
-- [4] 선물/교환권 초기 데이터 (gifts)
-- ============================================================================
INSERT INTO gifts (id, order_id, receiver_id, product_id, barcode, barcode_image_url, status, expired_at, used_at, created_at, updated_at) VALUES
(1, 1, 2, 1, '8800000000001', '/images/barcodes/default-barcode.png', 'unused', '2027-07-01 10:00:00', NULL, '2026-07-01 10:00:00', '2026-07-01 10:00:00'),
(2, 2, 1, 5, '8800000000002', '/images/barcodes/default-barcode.png', 'unused', '2027-07-02 14:30:00', NULL, '2026-07-02 14:30:00', '2026-07-02 14:30:00'),
(3, 3, 3, 3, '8800000000003', '/images/barcodes/default-barcode.png', 'used', '2027-07-03 09:15:00', '2026-07-05 18:20:00', '2026-07-03 09:15:00', '2026-07-05 18:20:00');
