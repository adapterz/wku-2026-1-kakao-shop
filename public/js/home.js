/*
 * 파일: public/js/home.js
 * 목적: 홈 화면(index.html) 전용 동작 처리
 * 왜: 상품 목록을 서버에서 받아 화면에 표시하고, 하단 탭바/카드 클릭 이벤트를 처리하기 위해
 * 주요: 상품 목록 fetch, 카드 렌더링(components.js 함수 사용), 카드 클릭 시 상세 이동, 하단 탭바 선물함 이동
 */

const INITIAL_PRODUCT_COUNT = 4;
const availableProductsById = new Map();
let productsLoadPromise = Promise.resolve();

document.addEventListener('DOMContentLoaded', () => {
  // HTML이 먼저 그려진 뒤 DOM 요소를 찾기 위해 DOMContentLoaded 이후에 실행합니다.
  renderFriendSelectPanel();
  productsLoadPromise = loadProducts();
  bindHomeThemeToggle();
  bindTabbarEvents();
  bindPopularRouteEvents();
});

const POPULAR_ROUTE_RECOMMENDATIONS = {
  market: {
    title: '익산역 → 중앙시장',
    mode: '시내버스',
    transfer: '환승 없음',
    time: '약 15분',
    flow: '익산역 정류장 → 시내버스 → 중앙시장',
    productId: 1,
    hasDedicatedPass: false,
    reason: '시장 방문 전후로 시내 여러 구간을 이동할 때 적합해요.',
  },
  mireuksaji: {
    title: '익산역 → 미륵사지',
    mode: '순환버스',
    transfer: '환승 없음',
    time: '약 25분',
    flow: '익산역 관광안내소 → 시티투어 순환버스 → 미륵사지',
    productId: 14,
    hasDedicatedPass: true,
    reason: '주요 관광지를 자유롭게 오가며 하루 여행하기 좋아요.',
  },
  wku: {
    title: '익산역 → 원광대학교',
    mode: '시내·통학버스',
    transfer: '환승 1회',
    time: '약 20분',
    flow: '익산역 정류장 → 시내버스 → 대학로 환승 → 원광대학교',
    productId: 5,
    hasDedicatedPass: true,
    reason: '등하교 구간을 반복 이용하는 학생에게 적합해요.',
  },
  jewel: {
    title: '익산역 → 보석박물관',
    mode: '시내버스',
    transfer: '환승 1회',
    time: '약 30분',
    flow: '익산역 정류장 → 시내버스 → 왕궁면 환승 → 보석박물관',
    productId: 17,
    hasDedicatedPass: true,
    reason: '보석박물관 방문에 필요한 왕복 이동을 한 번에 준비할 수 있어요.',
  },
  terminal: {
    title: '익산역 → 시외버스터미널',
    mode: '시내버스',
    transfer: '환승 없음',
    time: '약 10분',
    flow: '익산역 정류장 → 시내버스 → 시외버스터미널',
    productId: 1,
    hasDedicatedPass: false,
    reason: '역과 터미널을 포함한 시내 연계 이동에 활용하기 좋아요.',
  },
};

function bindPopularRouteEvents() {
  const layer = document.getElementById('route-recommendation-layer');
  const detailButton = document.getElementById('route-pass-detail-btn');
  let selectedProductId = null;

  if (!layer || !detailButton) return;

  const closeRecommendation = () => {
    layer.classList.remove('is-open');
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('route-sheet-open');
  };

  const openRecommendation = async (routeId) => {
    const route = POPULAR_ROUTE_RECOMMENDATIONS[routeId];
    if (!route) return;

    await productsLoadPromise;
    const linkedProduct = availableProductsById.get(route.productId);
    selectedProductId = linkedProduct ? route.productId : null;
    document.getElementById('route-recommendation-title').textContent = route.title;
    document.getElementById('route-summary-mode').textContent = route.mode;
    document.getElementById('route-summary-transfer').textContent = route.transfer;
    document.getElementById('route-summary-time').textContent = route.time;
    document.getElementById('route-sheet-flow').textContent = route.flow;
    document.getElementById('route-pass-label').textContent = linkedProduct
      ? (route.hasDedicatedPass ? '이 구간에 맞는 판매 패스' : '전용 패스 없음 · 연계 가능 패스')
      : '현재 연계 가능한 판매 패스 없음';
    document.getElementById('route-pass-name').textContent = linkedProduct
      ? linkedProduct.name
      : '판매 중인 패스 목록을 확인해주세요';
    document.getElementById('route-pass-reason').textContent = linkedProduct
      ? route.reason
      : '현재 상품 API에서 연결할 수 있는 패스를 찾지 못했습니다.';
    detailButton.disabled = !linkedProduct;
    detailButton.textContent = linkedProduct ? '연계 패스 보기' : '연계 패스 없음';

    layer.classList.add('is-open');
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('route-sheet-open');
    document.getElementById('route-sheet-close')?.focus();
  };

  document.querySelectorAll('.route-row[data-route-id]').forEach((row) => {
    row.addEventListener('click', () => openRecommendation(row.dataset.routeId));
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openRecommendation(row.dataset.routeId);
      }
    });
  });

  document.getElementById('route-recommendation-backdrop')?.addEventListener('click', closeRecommendation);
  document.getElementById('route-sheet-close')?.addEventListener('click', closeRecommendation);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && layer.classList.contains('is-open')) closeRecommendation();
  });

  detailButton.addEventListener('click', () => {
    if (selectedProductId) location.href = `product.html?id=${selectedProductId}`;
  });
}

function bindHomeThemeToggle() {
  const themeToggle = document.getElementById('home-theme-toggle');

  if (!themeToggle) {
    return;
  }

  const updateThemeToggle = () => {
    const isDarkMode = document.documentElement.classList.contains('dark-theme');
    const nextModeLabel = isDarkMode ? '라이트모드 켜기' : '다크모드 켜기';

    themeToggle.setAttribute('aria-pressed', String(isDarkMode));
    themeToggle.setAttribute('aria-label', nextModeLabel);
    themeToggle.title = nextModeLabel;
  };

  updateThemeToggle();

  themeToggle.addEventListener('click', () => {
    const isDarkMode = document.documentElement.classList.toggle('dark-theme');
    localStorage.setItem('profile_dark_mode', String(isDarkMode));
    updateThemeToggle();
  });
}

async function renderFriendSelectPanel() {
  const friendSelectPanel = document.getElementById('friend-select-panel');

  if (!friendSelectPanel) {
    return;
  }

  try {
    // 친구 선택 기능은 아직 정적 UI만 제공하고, 로그인 여부 확인은 기존 /api/auth/me를 재사용합니다.
    await fetchCurrentUser();
    friendSelectPanel.classList.remove('is-hidden');
  } catch (error) {
    // 비로그인 사용자는 홈을 그대로 볼 수 있어야 하므로, 401은 조용히 숨김 상태로 둡니다.
    friendSelectPanel.classList.add('is-hidden');
  }
}

async function loadProducts() {
  const productList = document.getElementById('product-list');
  const productListToggle = document.getElementById('product-list-toggle');

  if (!productList) {
    return;
  }

  try {
    if (productListToggle) {
      productListToggle.hidden = true;
    }

    productList.innerHTML = '<p class="loading-message">추천 패스를 불러오는 중입니다.</p>';

    const response = await fetchProducts();
    // 우리 API 공통 응답은 { status, message, data } 구조이므로 실제 목록은 data에서 꺼냅니다.
    const products = Array.isArray(response.data) ? response.data : [];
    availableProductsById.clear();
    products.forEach((product) => {
      availableProductsById.set(Number(product.productId), product);
    });

    if (products.length === 0) {
      productList.innerHTML = '<p class="empty-message">표시할 환승패스 상품이 없습니다.</p>';
      return;
    }

    const renderProducts = () => {
      const visibleProducts = products.slice(0, INITIAL_PRODUCT_COUNT);

      productList.innerHTML = visibleProducts.map(createProductCard).join('');
      bindProductCardEvents(productList);

      if (productListToggle) {
        productListToggle.hidden = products.length <= INITIAL_PRODUCT_COUNT;
      }
    };

    if (productListToggle) {
      productListToggle.addEventListener('click', () => {
        location.href = 'passes.html';
      });
    }

    renderProducts();
  } catch (error) {
    console.error('Failed to load products:', error);

    if (productListToggle) {
      productListToggle.hidden = true;
    }

    productList.innerHTML = `
      <p class="error-message">
        상품 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
      </p>
    `;
  }
}

function bindProductCardEvents(container) {
  container.querySelectorAll('.pass-ticket').forEach((card) => {
    card.addEventListener('click', () => {
      const productId = card.dataset.productId;
      // 상품마다 HTML을 따로 만들지 않고, id만 넘겨 product.html에서 상세 API를 다시 조회합니다.
      location.href = `product.html?id=${productId}`;
    });
  });
}

function bindTabbarEvents() {
  const passBtn = document.getElementById('tabbar-pass-btn');
  const giftboxBtn = document.getElementById('tabbar-giftbox-btn');
  const profileBtn = document.getElementById('home-profile-btn');

  if (passBtn) {
    passBtn.addEventListener('click', () => {
      location.href = 'passes.html';
    });
  }

  if (giftboxBtn) {
    giftboxBtn.addEventListener('click', () => {
      location.href = 'giftbox.html';
    });
  }

  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      location.href = 'profile.html';
    });
  }
}
