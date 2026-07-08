/*
 * 파일: public/js/home.js
 * 목적: 홈 화면(index.html) 전용 동작 처리
 * 왜: 상품 목록을 서버에서 받아 화면에 표시하기 위해
 * 주요: 상품 목록 fetch, 카드 렌더링
 */

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
});

async function loadProducts() {
  const productList = document.getElementById('product-list');

  if (!productList) {
    return;
  }

  try {
    productList.innerHTML = '<p class="loading-message">상품 정보를 불러오는 중입니다.</p>';

    const data = await fetchProducts();
    const products = data.products || [];

    if (products.length === 0) {
      productList.innerHTML = '<p class="empty-message">표시할 환승패스 상품이 없습니다.</p>';
      return;
    }

    productList.innerHTML = products.map(createProductCard).join('');
  } catch (error) {
    console.error('Failed to load products:', error);

    productList.innerHTML = `
      <p class="error-message">
        상품 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
      </p>
    `;
  }
}

function createProductCard(product) {
  const imageUrl = product.thumbnailUrl || 'img/product1.jpg';
  const brandName = product.brandName || '익산 교통';
  const productName = product.name || '환승패스 상품';
  const price = formatPrice(product.price);

  return `
    <div class="product-card-grid" data-product-id="${product.productId}">
      <div class="product-thumb">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(productName)}">
        <button class="bookmark-btn" type="button">🔖</button>
      </div>
      <p class="product-brand">${escapeHtml(brandName)}</p>
      <p class="product-name-grid">${escapeHtml(productName)}</p>
      <p class="product-price-grid">추천 <span>${price}</span></p>
      <div class="product-like">
        <span class="like-icon">❤️</span>
        <span class="like-count">M1</span>
      </div>
    </div>
  `;
}

function formatPrice(price) {
  const numberPrice = Number(price || 0);
  return `${numberPrice.toLocaleString('ko-KR')}원`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
