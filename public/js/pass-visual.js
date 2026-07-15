/* 패스 상품 이미지를 대신하는 공통 티켓형 UI 시안 */
const PASS_VISUAL_DEFINITIONS = [
  {
    categories: ['daily_pass', 'monthly_pass', 'youth_pass', 'welfare_pass', 'family_pass'],
    keywords: /시내버스|무제한|정기|청소년|가족/,
    theme: 'blue',
    label: '시내버스',
    badge: 'CITY PASS',
    icon: 'bus',
  },
  {
    categories: ['multi_pass', 'weekend_pass', 'night_pass'],
    keywords: /환승|광역|전주|주말|심야|KTX/,
    theme: 'green',
    label: '환승·광역',
    badge: 'TRANSFER',
    icon: 'transfer',
  },
  {
    categories: ['tour_pass', 'bike', 'parking'],
    keywords: /관광|투어|자전거|주차|미륵|시장/,
    theme: 'orange',
    label: '관광·특화',
    badge: 'LOCAL PASS',
    icon: 'pin',
  },
];

function getPassVisualDefinition(category = '', name = '') {
  const categoryDefinition = PASS_VISUAL_DEFINITIONS.find((definition) => (
    definition.categories.includes(category)
  ));

  if (categoryDefinition) {
    return categoryDefinition;
  }

  return PASS_VISUAL_DEFINITIONS.find((definition) => definition.keywords.test(name))
    || PASS_VISUAL_DEFINITIONS[0];
}

function getPassVisualIcon(icon) {
  if (icon === 'transfer') {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h11l-3-3m3 3-3 3M17 17H6l3 3m-3-3 3-3"/></svg>';
  }

  if (icon === 'pin') {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  }

  return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="15" rx="3"/><path d="M7 12h10M8 7h8M8 21v-3m8 3v-3"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/></svg>';
}

function createPassVisual(pass = {}, variant = 'hero') {
  const name = pass.name || pass.productName || '익산 환승패스';
  const definition = getPassVisualDefinition(pass.category, name);
  const brand = pass.brandName || '익산 환승패스';

  return `
    <div class="pass-visual pass-visual--${definition.theme} pass-visual--${variant}" aria-label="${escapePassVisualText(name)} 패스 디자인">
      <div class="pass-visual-route" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="pass-visual-head">
        <span class="pass-visual-icon">${getPassVisualIcon(definition.icon)}</span>
        <span class="pass-visual-type">${escapePassVisualText(definition.label)}</span>
        <span class="pass-visual-badge">${escapePassVisualText(definition.badge)}</span>
      </div>
      <strong class="pass-visual-name">${escapePassVisualText(name)}</strong>
      <div class="pass-visual-foot">
        <span>${escapePassVisualText(brand)}</span>
        <span>QR 승차권</span>
      </div>
    </div>
  `;
}

function createPassThumbnail(pass = {}, isUsed = false) {
  const name = pass.name || pass.productName || '익산 환승패스';
  const definition = getPassVisualDefinition(pass.category, name);
  const usedClass = isUsed ? 'is-used' : '';

  return `
    <div class="pass-thumbnail pass-thumbnail--${definition.theme} ${usedClass}" aria-hidden="true">
      <span class="pass-thumbnail-icon">${getPassVisualIcon(definition.icon)}</span>
      <strong>${escapePassVisualText(definition.label)}</strong>
      <small>IKSAN PASS</small>
      ${isUsed ? '<div class="pass-thumbnail-overlay"><span>사용완료</span></div>' : ''}
    </div>
  `;
}

function escapePassVisualText(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
