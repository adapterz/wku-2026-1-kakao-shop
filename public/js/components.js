/*
 * 파일: public/js/components.js
 * 목적: 여러 화면에서 반복 사용되는 UI 조각 함수 모음
 * 왜: 상품(패스) 카드처럼 반복되는 요소를 한 곳에서 관리해 재사용하기 위해
 * 주요: 교통 티켓형 패스 카드 생성, 카테고리별 색상 테마, 가격 포맷, HTML 이스케이프
 */

// DB category 값에 따라 티켓 색상과 배지를 구분합니다.
const PASS_THEMES = {
  daily_pass: { className: 'theme-blue', badge: '1일권' },
  multi_pass: { className: 'theme-teal', badge: '환승권' },
  weekend_pass: { className: 'theme-teal', badge: '주말권' },
  taxi: { className: 'theme-orange', badge: '택시' },
  monthly_pass: { className: 'theme-blue', badge: '정기권' },
  bike: { className: 'theme-orange', badge: '공공자전거' },
  tour_pass: { className: 'theme-orange', badge: '관광권' },
  youth_pass: { className: 'theme-blue', badge: '청소년' },
  parking: { className: 'theme-orange', badge: '주차' },
  welfare_pass: { className: 'theme-blue', badge: '교통약자' },
  giftcard: { className: 'theme-orange', badge: '충전권' },
  family_pass: { className: 'theme-blue', badge: '가족권' },
  night_pass: { className: 'theme-teal', badge: '심야권' },
  // DB 연결 전 테스트 데이터에서 사용했던 카테고리도 호환합니다.
  'daily-pass': { className: 'theme-blue', badge: '1일권' },
  'transfer-pass': { className: 'theme-teal', badge: '환승권' },
  'tour-pass': { className: 'theme-orange', badge: '관광권' },
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
