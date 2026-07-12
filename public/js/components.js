/*
 * 파일: public/js/components.js
 * 목적: 여러 화면에서 반복 사용되는 UI 조각 함수 모음
 * 왜: 상품 카드처럼 반복되는 요소를 한 곳에서 관리해 재사용하기 위해
 * 주요: 상품 카드 생성, 가격 포맷, HTML 이스케이프
 */

function createProductCard(product) {
  // API 응답 필드명을 기준으로 카드 UI를 만듭니다. DB 컬럼명은 BE에서 camelCase로 변환됩니다.
  const imageUrl = getProductImageUrl(product.thumbnailUrl);
  const brandName = product.brandName || '익산 교통';
  const productName = product.name || '환승패스 상품';
  const price = formatPrice(product.price);

  return `
    <!-- data-product-id는 카드 클릭 시 product.html?id=... 로 넘길 상품 식별자입니다. -->
    <div class="product-card-grid" data-product-id="${product.productId}">
      <div class="product-thumb">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(productName)}" onerror="useProductFallbackImage(this);">
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

function getProductImageUrl(thumbnailUrl) {
  // 현재 DB seed에는 실제 이미지 파일보다 먼저 경로만 들어갈 수 있어 상품 이미지는 공통 로고로 대체합니다.
  return thumbnailUrl || 'img/iksan-logo.svg';
}

function useProductFallbackImage(imageElement) {
  // 상품 이미지가 없거나 경로가 깨졌을 때 화면에 엑박이 보이지 않도록 공통 대체 이미지를 적용합니다.
  imageElement.onerror = null;
  imageElement.src = 'img/iksan-logo.svg';
}

function formatPrice(price) {
  // 화면 표시는 숫자 그대로보다 5,000원처럼 한국어 가격 형식이 읽기 좋습니다.
  const numberPrice = Number(price || 0);
  return `${numberPrice.toLocaleString('ko-KR')}원`;
}

function escapeHtml(value) {
  // DB/API 문자열이 HTML로 해석되지 않게 막아 화면 깨짐과 스크립트 삽입 위험을 줄입니다.
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
