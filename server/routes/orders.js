const express = require('express');
const { pool } = require('../db');
const { requireLogin } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();
const BARCODE_IMAGE_URL = '/images/barcodes/default-barcode.png';

function createBarcode(orderId) {
  const timestamp = Date.now();
  const paddedOrderId = String(orderId).padStart(6, '0');

  return `IKSAN${timestamp}${paddedOrderId}`;
}

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
  const receiverId = buyerId;
  let connection;

  try {
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
      await connection.rollback();

      return sendError(res, 404, 'not_found_product');
    }

    const product = products[0];
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
