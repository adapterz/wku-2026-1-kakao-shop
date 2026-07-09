/*
 * 파일: public/js/home.js
 * 목적: 홈 화면(index.html) 전용 동작 처리
 * 왜: 상품 목록을 서버에서 받아 화면에 표시하고, 하단 탭바/카드 클릭 이벤트를 처리하기 위해
 * 주요: 상품 목록 fetch, 카드 렌더링(components.js 함수 사용), 카드 클릭 시 상세 이동, 하단 탭바 선물함 이동
 */

document.addEventListener('DOMContentLoaded', () => {
  // HTML이 먼저 그려진 뒤 DOM 요소를 찾기 위해 DOMContentLoaded 이후에 실행합니다.
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
    // 우리 API 공통 응답은 { status, message, data } 구조이므로 실제 목록은 data에서 꺼냅니다.
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
    card.addEventListener('click', (event) => {
      // 북마크 버튼 클릭은 상세 이동과 별개 동작이므로 카드 클릭 이벤트에서 제외합니다.
      if (event.target.closest('.bookmark-btn')) return;
      const productId = card.dataset.productId;
      // 상품마다 HTML을 따로 만들지 않고, id만 넘겨 product.html에서 상세 API를 다시 조회합니다.
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
