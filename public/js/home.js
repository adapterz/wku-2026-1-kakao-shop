/*
 * 파일: public/js/home.js
 * 목적: 홈 화면(index.html) 전용 동작 처리
 * 왜: 상품 목록을 서버에서 받아 화면에 표시하고, 하단 탭바/카드 클릭 이벤트를 처리하기 위해
 * 주요: 상품 목록 fetch, 카드 렌더링(components.js 함수 사용), 카드 클릭 시 상세 이동, 하단 탭바 선물함 이동
 */

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  bindTabbarEvents();
});

async function loadProducts() {
  const productList = document.getElementById('product-list');

  if (!productList) {
    return;
  }

  try {
    productList.innerHTML = '<p class="loading-message">상품 정보를 불러오는 중입니다.</p>';

    const response = await fetchProducts();
    const products = Array.isArray(response.data) ? response.data : [];

    if (products.length === 0) {
      productList.innerHTML = '<p class="empty-message">표시할 환승패스 상품이 없습니다.</p>';
      return;
    }

    productList.innerHTML = products.map(createProductCard).join('');
    bindProductCardEvents(productList);
  } catch (error) {
    console.error('Failed to load products:', error);

    productList.innerHTML = `
      <p class="error-message">
        상품 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
      </p>
    `;
  }
}

function bindProductCardEvents(container) {
  container.querySelectorAll('.product-card-grid').forEach((card) => {
    card.addEventListener('click', () => {
      const productId = card.dataset.productId;
      location.href = `product.html?id=${productId}`;
    });
  });
}

function bindTabbarEvents() {
  const giftboxBtn = document.getElementById('tabbar-giftbox-btn');
  if (giftboxBtn) {
    giftboxBtn.addEventListener('click', () => {
      location.href = 'giftbox.html';
    });
  }
}