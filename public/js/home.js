/*
 * 파일: public/js/home.js
 * 목적: 홈 화면(index.html) 전용 동작 처리
 * 왜: 상품 목록을 서버에서 받아 화면에 표시하고, 하단 탭바/카드 클릭 이벤트를 처리하기 위해
 * 주요: 상품 목록 fetch, 카드 렌더링(components.js 함수 사용), 카드 클릭 시 상세 이동, 하단 탭바 선물함 이동
 */

const INITIAL_PRODUCT_COUNT = 4;

document.addEventListener('DOMContentLoaded', () => {
  // HTML이 먼저 그려진 뒤 DOM 요소를 찾기 위해 DOMContentLoaded 이후에 실행합니다.
  renderFriendSelectPanel();
  loadProducts();
  bindHomeThemeToggle();
  bindTabbarEvents();
});

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
