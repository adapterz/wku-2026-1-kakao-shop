/*
 * 파일: public/js/search.js
 * 목적: 상품명 검색 요청, 결과 카드 및 빈 결과 화면 처리
 */

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchResultList = document.getElementById('search-result-list');
const searchResultCount = document.getElementById('search-result-count');
const searchBackButton = document.getElementById('search-back-btn');

document.addEventListener('DOMContentLoaded', () => {
  const initialKeyword = new URLSearchParams(location.search).get('keyword');

  searchBackButton.addEventListener('click', () => {
    if (history.length > 1) {
      history.back();
      return;
    }

    location.href = 'index.html';
  });

  searchForm.addEventListener('submit', handleSearchSubmit);

  if (initialKeyword && initialKeyword.trim()) {
    searchInput.value = initialKeyword.trim().slice(0, 100);
    runProductSearch(searchInput.value);
  } else {
    searchInput.focus();
  }
});

function handleSearchSubmit(event) {
  event.preventDefault();
  const keyword = searchInput.value.trim().replace(/\s+/g, ' ');

  if (!keyword) {
    showSearchGuide('검색할 상품명을 입력해주세요.');
    searchInput.focus();
    return;
  }

  history.replaceState(null, '', `search.html?keyword=${encodeURIComponent(keyword)}`);
  runProductSearch(keyword);
}

async function runProductSearch(keyword) {
  searchResultCount.textContent = '';
  searchResultList.innerHTML = '<p class="loading-message">상품을 검색하는 중입니다.</p>';

  try {
    const response = await searchProducts(keyword);
    const products = Array.isArray(response.data) ? response.data : [];
    searchResultCount.textContent = `총 ${products.length}개`;

    if (products.length === 0) {
      searchResultList.innerHTML = `
        <div class="search-guide-message">
          <span class="search-guide-icon" aria-hidden="true">!</span>
          <strong>검색 결과가 없습니다</strong>
          <p>다른 상품명으로 다시 검색해주세요.</p>
        </div>
      `;
      return;
    }

    searchResultList.innerHTML = products.map(createProductCard).join('');
    bindSearchResultEvents();
  } catch (error) {
    console.error('Failed to search products:', error);
    searchResultCount.textContent = '';
    searchResultList.innerHTML = `
      <p class="error-message">상품 검색에 실패했습니다. 잠시 후 다시 시도해주세요.</p>
    `;
  }
}

function bindSearchResultEvents() {
  searchResultList.querySelectorAll('.pass-ticket').forEach((card) => {
    card.addEventListener('click', () => {
      const productId = Number(card.dataset.productId);

      if (Number.isInteger(productId) && productId > 0) {
        location.href = `product.html?id=${productId}`;
      }
    });
  });
}

function showSearchGuide(message) {
  searchResultCount.textContent = '';
  searchResultList.innerHTML = `
    <div class="search-guide-message">
      <span class="search-guide-icon" aria-hidden="true">⌕</span>
      <strong>${escapeHtml(message)}</strong>
      <p>예: 시내버스, KTX, 정기권</p>
    </div>
  `;
}
