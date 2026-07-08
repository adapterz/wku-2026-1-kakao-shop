const express = require('express');
const { pool } = require('../db');

const router = express.Router();

/**
 * DB snake_case 컬럼을 API camelCase 필드로 변환합니다.
 */
function toProductResponse(row) {
  return {
    productId: row.id,
    name: row.name,
    price: row.price,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    category: row.category,
    brandName: row.brand_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
        brand_name,
        created_at,
        updated_at
      FROM products
      ORDER BY id ASC
      `
    );

    res.json({
      products: rows.map(toProductResponse),
    });
  } catch (error) {
    console.error('GET /api/products error:', error);

    res.status(500).json({
      message: 'Failed to get product list.',
    });
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
      return res.status(400).json({
        message: 'Invalid product ID.',
      });
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
        brand_name,
        created_at,
        updated_at
      FROM products
      WHERE id = ?
      `,
      [productId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Product not found.',
      });
    }

    res.json({
      product: toProductResponse(rows[0]),
    });
  } catch (error) {
    console.error('GET /api/products/:id error:', error);

    res.status(500).json({
      message: 'Failed to get product detail.',
    });
  }
});

module.exports = router;