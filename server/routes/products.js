const express = require('express');
const { pool } = require('../db');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();
// DB 연결 전 FE-BE 흐름만 확인할 때 사용하는 임시 옵션입니다.
// M1/M2 통합 기준에서는 이 값을 끄고 실제 products 테이블을 조회합니다.
// 로컬에서 MySQL 없이 화면 연동만 확인할 때만 true로 둡니다.
const useDummyProducts = process.env.USE_DUMMY_PRODUCTS === 'true';

// API의 상위 필터 코드(basic/transfer/special)를 DB의 세부 상품 카테고리에 연결합니다.
// DB category 값은 카드 배지와 색상 구분에도 사용하므로 기존 값을 바꾸지 않고 조회 조건만 묶습니다.
const PRODUCT_CATEGORY_GROUPS = {
  basic: ['daily_pass', 'monthly_pass', 'youth_pass', 'welfare_pass', 'family_pass', 'daily-pass'],
  transfer: ['multi_pass', 'weekend_pass', 'night_pass', 'transfer-pass'],
  special: ['taxi', 'bike', 'tour_pass', 'parking', 'giftcard', 'tour-pass'],
};

const MAX_SEARCH_KEYWORD_LENGTH = 100;

function escapeLikePattern(value) {
  // 검색어의 %, _, 역슬래시를 일반 문자로 취급해 의도하지 않은 전체 검색을 막습니다.
  return value.replace(/[\\%_]/g, '\\$&');
}

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
 * 목록 화면에서는 카드에 필요한 최소 필드만 내려줍니다.
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

// 상세 화면은 목록보다 설명(description)이 추가로 필요합니다.
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
    const { category, keyword } = req.query;
    const normalizedKeyword = typeof keyword === 'string' ? keyword.trim() : '';

    // category는 API 명세에 정의된 세 그룹만 허용하고, 생략하면 전체 상품을 조회합니다.
    if (
      category !== undefined &&
      (typeof category !== 'string' || !Object.hasOwn(PRODUCT_CATEGORY_GROUPS, category))
    ) {
      return sendError(res, 400, 'invalid_category');
    }

    if (
      keyword !== undefined &&
      (typeof keyword !== 'string' || normalizedKeyword.length === 0 || normalizedKeyword.length > MAX_SEARCH_KEYWORD_LENGTH)
    ) {
      return sendError(res, 400, 'invalid_keyword');
    }

    if (useDummyProducts) {
      const filteredRows = dummyProductRows.filter((row) => {
        const matchesCategory = !category || PRODUCT_CATEGORY_GROUPS[category].includes(row.category);
        const matchesKeyword = !normalizedKeyword || row.name.toLocaleLowerCase('ko-KR')
          .includes(normalizedKeyword.toLocaleLowerCase('ko-KR'));

        return matchesCategory && matchesKeyword;
      });

      return sendSuccess(res, 200, 'get_products_success', filteredRows.map(toProductListResponse));
    }

    // SELECT 필드는 실제 응답에 사용하는 값만 조회해 API 응답과 DB 조회 범위를 맞춥니다.
    let query = `
      SELECT
        id,
        name,
        price,
        description,
        thumbnail_url,
        category
      FROM products
    `;
    const conditions = [];
    const queryParams = [];

    if (category) {
      const categoryValues = PRODUCT_CATEGORY_GROUPS[category];
      const placeholders = categoryValues.map(() => '?').join(', ');

      conditions.push(`category IN (${placeholders})`);
      queryParams.push(...categoryValues);
    }

    if (normalizedKeyword) {
      // 사용자 입력은 SQL 문자열에 직접 합치지 않고 ? 바인딩 값으로 전달합니다.
      conditions.push(`name LIKE ? ESCAPE '\\\\'`);
      queryParams.push(`%${escapeLikePattern(normalizedKeyword)}%`);
    }

    if (conditions.length > 0) {
      query += `WHERE ${conditions.join(' AND ')}\n`;
    }

    query += 'ORDER BY id ASC';

    const [rows] = await pool.query(query, queryParams);

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

    // URL path 값은 문자열로 들어오므로 숫자 id인지 먼저 검증합니다.
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

    // id 형식은 맞지만 DB에 해당 상품이 없으면 404로 응답합니다.
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
