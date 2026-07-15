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

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeReceiverName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function isValidReceiverName(value) {
  return value.length >= 1 && value.length <= 50;
}

function isValidMobilePhone(value) {
  return /^01[016789]\d{7,8}$/.test(value);
}

function maskPhone(value) {
  const normalized = normalizePhone(value);

  if (normalized.length < 10) {
    return '';
  }

  return `${normalized.slice(0, 3)}-****-${normalized.slice(-4)}`;
}

function createDeliveryResponse(row) {
  const isFriendGift = row.receiver_id === null
    || Number(row.buyer_id) !== Number(row.receiver_id);

  return {
    channel: isFriendGift ? 'sms' : null,
    status: isFriendGift ? 'mock_sent' : 'not_required',
    recipientPhone: isFriendGift ? maskPhone(row.receiver_phone) : null,
  };
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
      isMember: row.receiver_id !== null,
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
    delivery: createDeliveryResponse(row),
  };
}

function toSentOrderResponse(row) {
  return {
    orderId: row.order_id,
    totalPrice: row.total_price,
    paymentStatus: row.payment_status,
    giftMessage: row.gift_message,
    createdAt: row.order_created_at,
    receiver: {
      userId: row.receiver_id,
      name: row.receiver_name,
      phone: row.receiver_phone,
      isMember: row.receiver_id !== null,
    },
    product: {
      productId: row.product_id,
      name: row.product_name,
      thumbnailUrl: row.thumbnail_url,
      category: row.category,
      brandName: row.brand_name,
    },
    gift: {
      giftId: row.gift_id,
      status: row.gift_status,
      expiredAt: row.expired_at,
      usedAt: row.used_at,
    },
    delivery: createDeliveryResponse(row),
  };
}

/**
 * POST /api/orders
 * 로그인한 사용자가 상품을 주문하면 같은 트랜잭션에서 선물 교환권까지 발급합니다.
 */
router.post('/', requireLogin, async (req, res) => {
  const { productId, giftMessage = null, receiverName, receiverPhone } = req.body || {};
  const parsedProductId = Number(productId);
  const normalizedGiftMessage = giftMessage ? String(giftMessage).trim() : null;
  const isFriendGift = receiverPhone !== undefined && receiverPhone !== null;
  const normalizedReceiverName = isFriendGift ? normalizeReceiverName(receiverName) : null;
  const normalizedReceiverPhone = isFriendGift ? normalizePhone(receiverPhone) : null;

  if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
    return sendError(res, 400, 'invalid_product_id');
  }

  if (isFriendGift && !isValidMobilePhone(normalizedReceiverPhone)) {
    return sendError(res, 400, 'invalid_receiver_phone');
  }

  if (isFriendGift && !isValidReceiverName(normalizedReceiverName)) {
    return sendError(res, 400, 'invalid_receiver_name');
  }

  const buyerId = req.session.user.userId;
  let receiverId = buyerId;
  let receiver = null;
  let deliveryName = null;
  let deliveryPhone = null;
  let connection;

  try {
    // 주문 생성과 선물 발급은 반드시 같이 성공하거나 같이 실패해야 하므로 트랜잭션을 사용합니다.
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [buyers] = await connection.query(
      `
      SELECT id, name, phone
      FROM users
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [buyerId]
    );

    if (buyers.length === 0) {
      await connection.rollback();
      return sendError(res, 401, 'login_required');
    }

    const buyer = buyers[0];
    deliveryName = isFriendGift ? normalizedReceiverName : buyer.name;
    deliveryPhone = isFriendGift
      ? normalizedReceiverPhone
      : normalizePhone(buyer.phone);

    if (isFriendGift) {
      // 가입 여부와 관계없이 선물할 수 있으며, 가입 번호가 하나로 식별될 때만 선물함과 연결합니다.
      const [receivers] = await connection.query(
        `
        SELECT id, name, phone
        FROM users
        WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, '-', ''), ' ', ''), '(', ''), ')', ''), '.', '') = ?
          AND deleted_at IS NULL
        `,
        [normalizedReceiverPhone]
      );

      if (receivers.some((candidate) => Number(candidate.id) === Number(buyerId))) {
        await connection.rollback();
        return sendError(res, 400, 'cannot_gift_to_self_as_friend');
      }

      // 중복 번호는 특정 회원에게 잘못 귀속하지 않고 비회원 문자 선물처럼 처리합니다.
      receiver = receivers.length === 1 ? receivers[0] : null;
      receiverId = receiver ? receiver.id : null;
    }

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
        receiver_phone,
        receiver_name,
        product_id,
        total_price,
        payment_status,
        gift_message
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        buyerId,
        receiverId,
        deliveryPhone,
        deliveryName,
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

    const delivery = isFriendGift
      ? {
          channel: 'sms',
          status: 'mock_sent',
          recipientPhone: maskPhone(deliveryPhone),
        }
      : {
          channel: null,
          status: 'not_required',
          recipientPhone: null,
        };

    return sendSuccess(res, 201, 'create_order_success', {
      orderId,
      giftId: giftResult.insertId,
      productId: product.id,
      totalPrice: product.price,
      paymentStatus: 'paid',
      giftMessage: normalizedGiftMessage,
      receiver: {
        userId: receiverId,
        name: deliveryName,
        phone: deliveryPhone,
        isMember: receiverId !== null,
      },
      delivery,
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
 * GET /api/orders/sent
 * 로그인 사용자가 자신이 아닌 수신자에게 보낸 선물 주문을 최신순으로 조회합니다.
 */
router.get('/sent', requireLogin, async (req, res) => {
  const buyerId = req.session.user.userId;

  try {
    const [orders] = await pool.query(
      `
      SELECT
        o.id AS order_id,
        o.buyer_id,
        o.receiver_id,
        o.receiver_phone,
        COALESCE(o.receiver_name, receiver.name, '받는 분') AS receiver_name,
        o.product_id,
        o.total_price,
        o.payment_status,
        o.gift_message,
        o.created_at AS order_created_at,
        p.name AS product_name,
        p.thumbnail_url,
        p.category,
        p.brand_name,
        g.id AS gift_id,
        g.status AS gift_status,
        g.expired_at,
        g.used_at
      FROM orders o
      LEFT JOIN users receiver ON receiver.id = o.receiver_id
      JOIN products p ON p.id = o.product_id
      LEFT JOIN gifts g ON g.order_id = o.id
      WHERE o.buyer_id = ?
        AND (o.receiver_id IS NULL OR o.receiver_id <> o.buyer_id)
      ORDER BY o.created_at DESC, o.id DESC
      `,
      [buyerId]
    );

    return sendSuccess(
      res,
      200,
      'get_sent_orders_success',
      orders.map(toSentOrderResponse)
    );
  } catch (error) {
    console.error('GET /api/orders/sent error:', error);

    return sendError(res, 500, 'internal_server_error');
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
        o.receiver_phone,
        COALESCE(o.receiver_name, receiver.name) AS receiver_name,
        o.created_at AS order_created_at,
        buyer.name AS buyer_name,
        buyer.phone AS buyer_phone,
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
      LEFT JOIN users receiver ON receiver.id = o.receiver_id
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
