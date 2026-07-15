-- 친구 선물 주문에 입력한 수신자 이름을 주문 당시 값으로 보존합니다.
-- 운영 DB 적용 전 orders 테이블을 백업해야 합니다.

ALTER TABLE orders
    ADD COLUMN receiver_name VARCHAR(50) NULL AFTER receiver_phone;

-- 기존 회원 수신 주문은 연결된 회원 이름으로 백필합니다.
UPDATE orders AS o
JOIN users AS u ON u.id = o.receiver_id
SET o.receiver_name = u.name
WHERE o.receiver_name IS NULL;
