const express = require('express');
const { pool } = require('../db');
const { requireLogin } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();
// 선물 상태는 미사용(unused), 사용완료(used) 두 값만 허용합니다.
const GIFT_STATUSES = new Set(['unused', 'used']);

// 선물함 목록 카드에 필요한 필드만 정리합니다.
function toGiftListResponse(row) {
  return {
    giftId: row.gift_id,
    productId: row.product_id,
    productName: row.product_name,
    brandName: row.brand_name,
    thumbnailUrl: row.thumbnail_url,
    senderName: row.sender_name,
    status: row.status,
    barcode: row.barcode,
    createdAt: row.created_at,
    usedAt: row.used_at,
  };
}

// 선물 사용 화면은 바코드, 만료일, 사용일 등 더 자세한 정보가 필요합니다.
function toGiftDetailResponse(row) {
  return {
    giftId: row.gift_id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    brandName: row.brand_name,
    thumbnailUrl: row.thumbnail_url,
    senderName: row.sender_name,
    status: row.status,
    barcode: row.barcode,
    barcodeImageUrl: row.barcode_image_url,
    expiredAt: row.expired_at,
    createdAt: row.created_at,
    usedAt: row.used_at,
  };
}

function parseGiftId(value) {
  // path parameter는 문자열로 들어오므로 양의 정수인지 확인한 뒤 사용합니다.
  const giftId = Number(value);

  if (!Number.isInteger(giftId) || giftId <= 0) {
    return null;
  }

  return giftId;
}

async function findOwnedGift(giftId, userId) {
  // gift id만으로 조회하지 않고 receiver_id까지 같이 확인해 다른 사람 선물 접근을 막습니다.
  const [rows] = await pool.query(
    `
    SELECT
      g.id AS gift_id,
      g.order_id,
      g.product_id,
      g.status,
      g.barcode,
      g.barcode_image_url,
      g.expired_at,
      g.created_at,
      g.used_at,
      p.name AS product_name,
      p.brand_name,
      p.thumbnail_url,
      sender.name AS sender_name
    FROM gifts g
    JOIN products p ON p.id = g.product_id
    JOIN orders o ON o.id = g.order_id
    JOIN users sender ON sender.id = o.buyer_id
    WHERE g.id = ?
      AND g.receiver_id = ?
    LIMIT 1
    `,
    [giftId, userId]
  );

  return rows[0] || null;
}

/**
 * GET /api/gifts?status=unused|used
 * 로그인한 사용자의 선물함 목록을 미사용/사용완료 상태별로 조회합니다.
 */
router.get('/', requireLogin, async (req, res) => {
  const { status } = req.query;
  const normalizedStatus = status ? String(status).trim().toLowerCase() : null;

  if (normalizedStatus && !GIFT_STATUSES.has(normalizedStatus)) {
    return sendError(res, 400, 'invalid_gift_status');
  }

  try {
    const userId = req.session.user.userId;
    const queryParams = [userId];
    let statusCondition = '';

    if (normalizedStatus) {
      // status 값도 문자열로 SQL에 붙이지 않고 ? 바인딩으로 전달합니다.
      statusCondition = 'AND g.status = ?';
      queryParams.push(normalizedStatus);
    }

    const [gifts] = await pool.query(
      `
      SELECT
        g.id AS gift_id,
        g.product_id,
        g.status,
        g.barcode,
        g.created_at,
        g.used_at,
        p.name AS product_name,
        p.brand_name,
        p.thumbnail_url,
        sender.name AS sender_name
      FROM gifts g
      JOIN products p ON p.id = g.product_id
      JOIN orders o ON o.id = g.order_id
      JOIN users sender ON sender.id = o.buyer_id
      WHERE g.receiver_id = ?
      ${statusCondition}
      ORDER BY g.created_at DESC
      `,
      queryParams
    );

    return sendSuccess(res, 200, 'get_user_gifts_success', gifts.map(toGiftListResponse));
  } catch (error) {
    console.error('GET /api/gifts error:', error);

    return sendError(res, 500, 'internal_server_error');
  }
});

/**
 * GET /api/gifts/:id
 * 로그인한 사용자가 받은 선물 1건의 상세 정보를 조회합니다.
 */
router.get('/:id', requireLogin, async (req, res) => {
  const giftId = parseGiftId(req.params.id);

  if (!giftId) {
    return sendError(res, 400, 'invalid_gift_id');
  }

  try {
    const userId = req.session.user.userId;
    const gift = await findOwnedGift(giftId, userId);

    if (!gift) {
      // 존재하지 않거나 내 선물이 아닌 경우 모두 not_found로 처리합니다.
      return sendError(res, 404, 'not_found_gift');
    }

    return sendSuccess(res, 200, 'get_gift_success', toGiftDetailResponse(gift));
  } catch (error) {
    console.error('GET /api/gifts/:id error:', error);

    return sendError(res, 500, 'internal_server_error');
  }
});

/**
 * PATCH /api/gifts/:id/use
 * 로그인한 사용자가 받은 미사용 선물을 사용완료 상태로 변경합니다.
 */
router.patch('/:id/use', requireLogin, async (req, res) => {
  const giftId = parseGiftId(req.params.id);

  if (!giftId) {
    return sendError(res, 400, 'invalid_gift_id');
  }

  try {
    const userId = req.session.user.userId;
    const gift = await findOwnedGift(giftId, userId);

    if (!gift) {
      return sendError(res, 404, 'not_found_gift');
    }

    if (gift.status === 'used') {
      return sendError(res, 400, 'already_used_gift');
    }

    // 사용 처리 시 status와 used_at을 함께 갱신해 "언제 사용했는지" 기록합니다.
    await pool.query(
      `
      UPDATE gifts
      SET status = 'used',
          used_at = NOW(),
          updated_at = NOW()
      WHERE id = ?
        AND receiver_id = ?
      `,
      [giftId, userId]
    );

    const updatedGift = await findOwnedGift(giftId, userId);

    return sendSuccess(res, 200, 'use_gift_success', toGiftDetailResponse(updatedGift));
  } catch (error) {
    console.error('PATCH /api/gifts/:id/use error:', error);

    return sendError(res, 500, 'internal_server_error');
  }
});

module.exports = router;
