/*
 * 파일: public/js/components.js
 * 목적: 여러 화면에서 반복 사용되는 UI 조각 함수 모음
 * 왜: 상품(패스) 카드처럼 반복되는 요소를 한 곳에서 관리해 재사용하기 위해
 * 주요: 교통 티켓형 패스 카드 생성, 카테고리별 색상 테마, 가격 포맷, HTML 이스케이프
 */

// 카테고리별 티켓 색상 테마와 배지 문구 (C안: 상품 이미지 대신 티켓 형태로 통일된 패스 카드)
const PASS_THEMES = {
  'daily-pass': { className: 'theme-blue', badge: 'BUS PASS' },
  'transfer-pass': { className: 'theme-teal', badge: 'TRANSFER' },
  'tour-pass': { className: 'theme-orange', badge: 'TOUR COURSE' },
};

function getPassTheme(category) {
  // seed에 없는 새 카테고리가 들어와도 카드가 깨지지 않도록 기본 테마를 둡니다.
  return PASS_THEMES[category] || { className: 'theme-blue', badge: 'PASS' };
}

function createProductCard(product) {
  // API 응답 필드명을 기준으로 카드 UI를 만듭니다. DB 컬럼명은 BE에서 camelCase로 변환됩니다.
  const theme = getPassTheme(product.category);
  const productName = product.name || '환승패스 상품';
  const price = formatPrice(product.price);

  return `
    <!-- data-product-id는 카드 클릭 시 product.html?id=... 로 넘길 상품 식별자입니다. -->
    <article class="pass-ticket ${theme.className}" data-product-id="${product.productId}">
      <div class="pass-ticket-main">
        <span class="pass-badge">${escapeHtml(theme.badge)}</span>
        <h3 class="pass-name">${escapeHtml(productName)}</h3>
        <p class="pass-desc">QR 승차권 · 선물 가능</p>
      </div>
      <div class="pass-ticket-stub">
        <span class="pass-price">${price}</span>
        <span class="pass-cta">선물하기</span>
      </div>
    </article>
  `;
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
