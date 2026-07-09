const express = require('express');
const { pool } = require('../db');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();
// DB 연결 전 FE-BE 흐름만 확인할 때 사용하는 임시 옵션입니다.
// M1/M2 통합 기준에서는 이 값을 끄고 실제 products 테이블을 조회합니다.
const useDummyProducts = process.env.USE_DUMMY_PRODUCTS === 'true';

const dummyProductRows = [
  {
    id: 1,
    name: '시내버스 무제한 1일 패스',
    price: 5000,
    description: '익산 시내 주요 정류장을 하루 동안 편하게 이동할 수 있는 패스입니다.',
    thumbnail_url: '/img/iksan-logo.svg',
    category: 'daily-pass',
    brand_name: '익산교통',
    created_at: '2026-07-08T00:00:00.000Z',
    updated_at: '2026-07-08T00:00:00.000Z',
  },
  {
    id: 2,
    name: '익산역-시내 환승 1일권',
    price: 8000,
    description: '익산역 도착 후 시내 이동과 환승 흐름을 확인하기 위한 패스입니다.',
    thumbnail_url: '/img/iksan-logo.svg',
    category: 'transfer-pass',
    brand_name: '익산시티패스',
    created_at: '2026-07-08T00:00:00.000Z',
    updated_at: '2026-07-08T00:00:00.000Z',
  },
  {
    id: 3,
    name: '광역·시내 통합 환승 10회권',
    price: 18000,
    description: '익산 광역 이동과 시내버스 환승을 함께 확인하기 위한 10회권입니다.',
    thumbnail_url: '/img/iksan-logo.svg',
    category: 'transfer-pass',
    brand_name: '익산교통',
    created_at: '2026-07-08T00:00:00.000Z',
    updated_at: '2026-07-08T00:00:00.000Z',
  },
  {
    id: 4,
    name: '익산 관광 순환버스 패스',
    price: 12000,
    description: '익산역에서 관광 코스로 이동하는 흐름을 확인하기 위한 순환버스 패스입니다.',
    thumbnail_url: '/img/iksan-logo.svg',
    category: 'tour-pass',
    brand_name: '익산여행패스',
    created_at: '2026-07-08T00:00:00.000Z',
    updated_at: '2026-07-08T00:00:00.000Z',
  },
];

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
  };
}

/**
 * GET /api/products
 * 상품 목록 조회
 */
router.get('/', async (req, res) => {
  try {
    if (useDummyProducts) {
      return sendSuccess(res, 200, 'get_products_success', dummyProductRows.map(toProductListResponse));
    }

    const [rows] = await pool.query(
      `
      SELECT
        id,
        name,
        price,
        description,
        thumbnail_url,
        category
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

    if (useDummyProducts) {
      const product = dummyProductRows.find((row) => row.id === productId);

      if (!product) {
        return sendError(res, 404, 'not_found_product');
      }

      return sendSuccess(res, 200, 'get_product_success', toProductDetailResponse(product));
    }

    const [rows] = await pool.query(
      `
      SELECT
        id,
        name,
        price,
        description,
        thumbnail_url,
        category
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
