/*
 * 파일: public/js/giftbox.js
 * 목적: 선물함 화면(giftbox.html) 전용 동작 처리
 * 왜: 로그인한 사용자의 받은 선물을 미사용/사용완료 상태별로 보여주기 위해
 * 주요: 선물함 API 조회, 상태 탭 전환, 선물 카드 클릭 시 gift-use.html 이동, 홈 탭 이동
 */

const fallbackImageUrl = 'img/iksan-logo.svg';
const giftList = document.getElementById('gift-list');
const tabUnused = document.getElementById('tab-unused');
const tabUsed = document.getElementById('tab-used');
const giftsByStatus = {
  unused: [],
  used: [],
};
let activeStatus = 'unused';

loadGiftbox();

// 뒤로가기 버튼
document.getElementById('back-btn').addEventListener('click', () => {
  location.href = 'index.html';
});

tabUnused.addEventListener('click', () => {
  setActiveStatus('unused');
});

tabUsed.addEventListener('click', () => {
  setActiveStatus('used');
});

// 하단 탭바 - 홈으로 이동
document.getElementById('tabbar-home-btn').addEventListener('click', () => {
  location.href = 'index.html';
});

async function loadGiftbox() {
  try {
    giftList.innerHTML = '<p class="loading-message">선물함을 불러오는 중입니다.</p>';

    const [unusedResponse, usedResponse] = await Promise.all([
      requestJson('/api/gifts?status=unused'),
      requestJson('/api/gifts?status=used'),
    ]);

    giftsByStatus.unused = Array.isArray(unusedResponse.data) ? unusedResponse.data : [];
    giftsByStatus.used = Array.isArray(usedResponse.data) ? usedResponse.data : [];

    updateTabLabels();
    renderGiftList();
  } catch (error) {
    console.error('선물함 조회 중 오류:', error);

    if (error.message === 'login_required') {
      location.href = 'login.html';
      return;
    }

    giftList.innerHTML = '<p class="error-message">선물함을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>';
  }
}

function setActiveStatus(status) {
  activeStatus = status;
  tabUnused.classList.toggle('active', status === 'unused');
  tabUsed.classList.toggle('active', status === 'used');
  renderGiftList();
}

function updateTabLabels() {
  tabUnused.textContent = `미사용 선물 ${giftsByStatus.unused.length}`;
  tabUsed.textContent = `사용완료 ${giftsByStatus.used.length}`;
}

function renderGiftList() {
  const gifts = giftsByStatus[activeStatus];

  if (!gifts.length) {
    giftList.innerHTML = `<p class="empty-message">${getEmptyMessage(activeStatus)}</p>`;
    return;
  }

  giftList.innerHTML = gifts.map(createGiftCard).join('');
  bindGiftCardEvents();
}

function createGiftCard(gift) {
  const productName = gift.productName || '익산 환승패스';
  const brandName = gift.brandName || '익산 교통';
  const senderName = gift.senderName || '나';
  const imageUrl = gift.thumbnailUrl || fallbackImageUrl;
  const giftDate = formatGiftDate(activeStatus === 'used' ? gift.usedAt : gift.createdAt);

  return `
    <div class="gift-card" data-gift-id="${gift.giftId}">
      <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(productName)}" onerror="this.onerror=null; this.src='${fallbackImageUrl}';">
      <div class="gift-info">
        <p class="order-brand">${escapeHtml(brandName)}</p>
        <p class="product-name">${escapeHtml(productName)}</p>
        <p class="gift-sender">from. ${escapeHtml(senderName)}</p>
        <p class="gift-date">${escapeHtml(giftDate)}</p>
      </div>
    </div>
  `;
}

function bindGiftCardEvents() {
  giftList.querySelectorAll('.gift-card').forEach((card) => {
    card.addEventListener('click', () => {
      const giftId = card.dataset.giftId;
      location.href = `gift-use.html?giftId=${giftId}`;
    });
  });
}

function getEmptyMessage(status) {
  return status === 'used' ? '사용완료된 선물이 없습니다.' : '미사용 선물이 없습니다.';
}

function formatGiftDate(value) {
  if (!value) {
    return '날짜 정보 없음';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '날짜 정보 없음';
  }

  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
