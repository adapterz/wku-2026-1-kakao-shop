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

module.exports = router;
