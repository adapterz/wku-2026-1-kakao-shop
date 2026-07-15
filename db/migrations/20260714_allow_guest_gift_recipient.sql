-- 친구 선물 수신자를 회원 계정이 아닌 휴대폰 번호로도 받을 수 있게 확장합니다.
-- 운영 DB 적용 전 반드시 orders, gifts 테이블을 백업해야 합니다.

ALTER TABLE orders
    ADD COLUMN receiver_phone VARCHAR(20) NULL AFTER receiver_id;

-- 기존 주문은 연결된 회원 전화번호를 수신 번호 스냅샷으로 백필합니다.
UPDATE orders AS o
JOIN users AS u ON u.id = o.receiver_id
SET o.receiver_phone = REPLACE(REPLACE(u.phone, '-', ''), ' ', '')
WHERE o.receiver_phone IS NULL;

ALTER TABLE orders
    MODIFY COLUMN receiver_id BIGINT NULL;

ALTER TABLE gifts
    MODIFY COLUMN receiver_id BIGINT NULL;
