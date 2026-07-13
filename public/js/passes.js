/*
 * 파일: public/js/passes.js
 * 목적: 전체 패스 상품 화면(passes.html) 전용 동작 처리
 * 왜: 홈 추천 목록과 별도로 전체 상품을 조회하고 상세 화면으로 연결하기 위해
 * 주요: 전체 상품 조회, 상품 카드 렌더링, 하단 탭바 이동
 */

document.addEventListener('DOMContentLoaded', () => {
  bindPassCategoryFilters();
  loadAllPasses();
  bindPassesNavigation();
});

let selectedPassCategory = '';
let latestPassRequestId = 0;

async function loadAllPasses(category = selectedPassCategory) {
  const passesList = document.getElementById('passes-list');
  const passesCount = document.getElementById('passes-count');
  const requestId = ++latestPassRequestId;

  if (!passesList) {
    return;
  }

  try {
    passesList.innerHTML = '<p class="loading-message">전체 패스를 불러오는 중입니다.</p>';

    const response = await fetchProducts(category);
    const products = Array.isArray(response.data) ? response.data : [];

    // 빠르게 필터를 바꿨을 때 이전 요청 결과가 최신 화면을 덮어쓰지 않도록 합니다.
    if (requestId !== latestPassRequestId) {
      return;
    }

    if (passesCount) {
      passesCount.textContent = `총 ${products.length}개`;
    }

    if (products.length === 0) {
      passesList.innerHTML = '<p class="empty-message">현재 판매 중인 환승패스가 없습니다.</p>';
      return;
    }

    passesList.innerHTML = products.map(createProductCard).join('');
    bindPassCardEvents(passesList);
  } catch (error) {
    if (requestId !== latestPassRequestId) {
      return;
    }

    console.error('Failed to load all passes:', error);

    if (passesCount) {
      passesCount.textContent = '';
    }

    passesList.innerHTML = `
      <p class="error-message">
        패스 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
      </p>
    `;
  }
}

function bindPassCategoryFilters() {
  const filterButtons = document.querySelectorAll('.passes-filter-btn');

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.dataset.category || '';

      if (category === selectedPassCategory) {
        return;
      }

      selectedPassCategory = category;

      filterButtons.forEach((filterButton) => {
        const isActive = filterButton === button;
        filterButton.classList.toggle('active', isActive);
        filterButton.setAttribute('aria-pressed', String(isActive));
      });

      loadAllPasses(selectedPassCategory);
    });
  });
}

function bindPassCardEvents(container) {
  container.querySelectorAll('.pass-ticket').forEach((card) => {
    card.addEventListener('click', () => {
      location.href = `product.html?id=${card.dataset.productId}`;
    });
  });
}

function bindPassesNavigation() {
  document.getElementById('passes-back-btn')?.addEventListener('click', () => {
    location.href = 'index.html';
  });

  document.getElementById('passes-home-btn')?.addEventListener('click', () => {
    location.href = 'index.html';
  });

  document.getElementById('passes-giftbox-btn')?.addEventListener('click', () => {
    location.href = 'giftbox.html';
  });
}
