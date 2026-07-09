const express = require('express');
const { pool } = require('../db');
const { requireLogin } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();
// 실제 바코드 이미지를 생성하지 않는 단계라, M2에서는 공통 목업 이미지를 사용합니다.
const BARCODE_IMAGE_URL = '/images/barcodes/default-barcode.png';

function createBarcode(orderId) {
  // 주문 id와 현재 시간을 섞어 데모용 교환권 번호를 만듭니다.
  const timestamp = Date.now();
  const paddedOrderId = String(orderId).padStart(6, '0');

  return `IKSAN${timestamp}${paddedOrderId}`;
}

// 주문 상세 화면은 주문, 구매자, 수신자, 상품, 선물 정보를 한 번에 보여줘야 해서 중첩 객체로 정리합니다.
function toOrderDetailResponse(row) {
  return {
    orderId: row.order_id,
    totalPrice: row.total_price,
    paymentStatus: row.payment_status,
    giftMessage: row.gift_message,
    createdAt: row.order_created_at,
    buyer: {
      userId: row.buyer_id,
      name: row.buyer_name,
      phone: row.buyer_phone,
    },
    receiver: {
      userId: row.receiver_id,
      name: row.receiver_name,
      phone: row.receiver_phone,
    },
    product: {
      productId: row.product_id,
      name: row.product_name,
      price: row.product_price,
      thumbnailUrl: row.thumbnail_url,
      category: row.category,
      brandName: row.brand_name,
    },
    gift: {
      giftId: row.gift_id,
      barcode: row.barcode,
      barcodeImageUrl: row.barcode_image_url,
      status: row.gift_status,
      expiredAt: row.expired_at,
      usedAt: row.used_at,
    },
  };
}

/**
 * POST /api/orders
 * 로그인한 사용자가 상품을 주문하면 같은 트랜잭션에서 선물 교환권까지 발급합니다.
 */
router.post('/', requireLogin, async (req, res) => {
  const { productId, giftMessage = null } = req.body || {};
  const parsedProductId = Number(productId);
  const normalizedGiftMessage = giftMessage ? String(giftMessage).trim() : null;

  if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
    return sendError(res, 400, 'invalid_product_id');
  }

  const buyerId = req.session.user.userId;
  // 현재 M2 범위는 "나에게 선물하기"라서 받는 사람도 로그인 사용자와 동일하게 둡니다.
  const receiverId = buyerId;
  let connection;

  try {
    // 주문 생성과 선물 발급은 반드시 같이 성공하거나 같이 실패해야 하므로 트랜잭션을 사용합니다.
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [products] = await connection.query(
      `
      SELECT id, price
      FROM products
      WHERE id = ?
      `,
      [parsedProductId]
    );

    if (products.length === 0) {
      // 상품이 없으면 주문도 선물도 만들면 안 되므로 트랜잭션을 되돌립니다.
      await connection.rollback();

      return sendError(res, 404, 'not_found_product');
    }

    const product = products[0];
    // 1단계: orders 테이블에 주문 1건을 저장합니다.
    const [orderResult] = await connection.query(
      `
      INSERT INTO orders (
        buyer_id,
        receiver_id,
        product_id,
        total_price,
        payment_status,
        gift_message
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        buyerId,
        receiverId,
        product.id,
        product.price,
        'paid',
        normalizedGiftMessage,
      ]
    );

    const orderId = orderResult.insertId;
    const barcode = createBarcode(orderId);
    // 2단계: 같은 주문 흐름 안에서 gifts 테이블에 교환권 1건을 발급합니다.
    const [giftResult] = await connection.query(
      `
      INSERT INTO gifts (
        order_id,
        receiver_id,
        product_id,
        barcode,
        barcode_image_url,
        status,
        expired_at
      )
      VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR))
      `,
      [
        orderId,
        receiverId,
        product.id,
        barcode,
        BARCODE_IMAGE_URL,
        'unused',
      ]
    );

    // 주문과 선물 발급이 모두 성공했을 때만 DB에 최종 반영합니다.
    await connection.commit();

    return sendSuccess(res, 201, 'create_order_success', {
      orderId,
      giftId: giftResult.insertId,
      productId: product.id,
      totalPrice: product.price,
      paymentStatus: 'paid',
      giftMessage: normalizedGiftMessage,
    });
  } catch (error) {
    if (connection) {
      // 중간에 하나라도 실패하면 부분 저장을 막기 위해 롤백합니다.
      await connection.rollback();
    }

    console.error('POST /api/orders error:', error);

    return sendError(res, 500, 'internal_server_error');
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

/**
 * GET /api/orders/:id
 * 주문 완료 화면에서 사용할 주문, 상품, 수신자, 선물 발급 정보를 조회합니다.
 */
router.get('/:id', requireLogin, async (req, res) => {
  const orderId = Number(req.params.id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return sendError(res, 400, 'invalid_order_id');
  }

  try {
    const userId = req.session.user.userId;
    // 본인이 구매자이거나 수신자인 주문만 조회되게 해서 다른 사람 주문 접근을 막습니다.
    const [orders] = await pool.query(
      `
      SELECT
        o.id AS order_id,
        o.buyer_id,
        o.receiver_id,
        o.product_id,
        o.total_price,
        o.payment_status,
        o.gift_message,
        o.created_at AS order_created_at,
        buyer.name AS buyer_name,
        buyer.phone AS buyer_phone,
        receiver.name AS receiver_name,
        receiver.phone AS receiver_phone,
        p.name AS product_name,
        p.price AS product_price,
        p.thumbnail_url,
        p.category,
        p.brand_name,
        g.id AS gift_id,
        g.barcode,
        g.barcode_image_url,
        g.status AS gift_status,
        g.expired_at,
        g.used_at
      FROM orders o
      JOIN users buyer ON buyer.id = o.buyer_id
      JOIN users receiver ON receiver.id = o.receiver_id
      JOIN products p ON p.id = o.product_id
      LEFT JOIN gifts g ON g.order_id = o.id
      WHERE o.id = ?
        AND (o.buyer_id = ? OR o.receiver_id = ?)
      `,
      [orderId, userId, userId]
    );

    if (orders.length === 0) {
      return sendError(res, 404, 'not_found_order');
    }

    return sendSuccess(res, 200, 'get_order_success', toOrderDetailResponse(orders[0]));
  } catch (error) {
    console.error('GET /api/orders/:id error:', error);

    return sendError(res, 500, 'internal_server_error');
  }
});

module.exports = router;
