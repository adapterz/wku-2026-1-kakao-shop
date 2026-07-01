/*
 * 파일: db/seed.sql
 * 목적: 서비스 동작 확인 및 프론트엔드 화면 렌더링을 위한 초기 데이터 구축
 * 왜 이렇게: 피그마 기획서 화면 상의 실제 상품 데이터와 싱크를 맞춰 UI 개발 편의성 증대
 */

-- 1. 테스트용 기본 사용자 등록 (비밀번호는 예시 문정)
INSERT INTO users (email, password, name, phone, birth_date, gender) VALUES 
('test1@kakao.com', 'password123', '홍길동', '010-1234-5678', '1998-05-15', 'MALE'),
('test2@kakao.com', 'password456', '김철수', '010-9876-5432', '2000-11-23', 'FEMALE');

-- 2. 피그마 기획서 기반 실제 상품 데이터 등록
INSERT INTO products (name, price, original_price, discount_rate, brand_name, image_url, description_image_url, origin_info) VALUES 
('[본죽] 닭다리가 통째로 통닭다리 백숙죽 600g 3팩(T)', 19900, 29700, 32, '본죽', 'https://example.com/bonjuk_main.jpg', 'https://example.com/bonjuk_detail.jpg', '상세설명에 표시'),
('"대한민국 피로회복제" 동아제약 박카스F 120 ml X 10병', 9900, 9900, 0, '동아제약', 'https://example.com/bacchus_main.jpg', 'https://example.com/bacchus_detail.jpg', '국내산:충청남도 당진시'),
('하겐다즈 아이스크림 케이크 리얼블랑', 35000, 35000, 0, '하겐다즈', 'https://example.com/haagen_main.jpg', 'https://example.com/haagen_detail.jpg', '프랑스산'),
('BBQ 황금올리브치킨+콜라1.25L(배달가능)', 23500, 26500, 11, 'BBQ', 'https://example.com/bbq_main.jpg', 'https://example.com/bbq_detail.jpg', '닭고기:국내산'),
('배스킨라빈스 골라먹는 27 큐브', 29000, 29000, 0, '배스킨라빈스', 'https://example.com/br_main.jpg', 'https://example.com/br_detail.jpg', '상세설명 참조');

-- 3. 서비스 시나리오 테스트용 가짜 데이터 등록
-- 시나리오: 홍길동(1번)이 본죽 백숙죽(1번 상품)을 '나에게 선물하기'로 구매
INSERT INTO orders (user_id, product_id, payment_status) VALUES (1, 1, 'SUCCESS');

-- 위 주문으로 인해 홍길동(1번)의 선물함에 교환권이 미사용(unused) 상태로 꽂힘
INSERT INTO gifts (order_id, owner_id, product_id, status) VALUES (1, 1, 1, 'unused');