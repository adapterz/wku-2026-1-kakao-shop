const express = require('express');
const { pool } = require('../db');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();

/**
 * DB snake_case 컬럼을 API camelCase 필드로 변환합니다.
 */
function toProductListResponse(row) {
  return {
    productId: row.id,
    name: row.name,
    price: row.price,
    thumbnailUrl: row.thumbnail_url,
    category: row.category,
    createdAt: row.created_at,
  };
}

function toProductDetailResponse(row) {
  return {
    productId: row.id,
    name: row.name,
    price: row.price,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    category: row.category,
    createdAt: row.created_at,
  };
}

/**
 * GET /api/products
 * 상품 목록 조회
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        id,
        name,
        price,
        description,
        thumbnail_url,
        category,
        created_at
      FROM products
      ORDER BY id ASC
      `
    );

    return sendSuccess(res, 200, 'get_products_success', rows.map(toProductListResponse));
  } catch (error) {
    console.error('GET /api/products error:', error);

    return sendError(res, 500, 'internal_server_error');
  }
});

/**
 * GET /api/products/:id
 * 상품 상세 조회
 */
router.get('/:id', async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return sendError(res, 400, 'invalid_product_id');
    }

    const [rows] = await pool.query(
      `
      SELECT
        id,
        name,
        price,
        description,
        thumbnail_url,
        category,
        created_at
      FROM products
      WHERE id = ?
      `,
      [productId]
    );

    if (rows.length === 0) {
      return sendError(res, 404, 'not_found_product');
    }

    return sendSuccess(res, 200, 'get_product_success', toProductDetailResponse(rows[0]));
  } catch (error) {
    console.error('GET /api/products/:id error:', error);

    return sendError(res, 500, 'internal_server_error');
  }
});

module.exports = router;
