/*
 * 파일: public/js/profile.js
 * 목적: 프로필 메인 화면(profile.html) 전용 동작 처리
 * 왜: 사용자 요약 정보와 획득 배지 그리드를 로드하고 설정 화면 이동 처리를 위해
 * 주요: 로그인 정보 조회, 선물함 기반 이용 현황·최근 패스 렌더링, 설정 라우팅, 하단 탭바 이동
 */

document.addEventListener('DOMContentLoaded', () => {
  initProfilePage();
});

async function initProfilePage() {
  const usernameTitle = document.getElementById('profile-username-title');
  const emailSubtitle = document.getElementById('profile-email-subtitle');

  try {
    // 1. 현재 로그인 사용자 정보 비동기 조회
    const response = await fetchCurrentUser();
    const user = response.data || {};

    if (!user.email) {
      location.href = 'login.html';
      return;
    }

    // 1. 프로필 카드 정보 매핑 (수정된 로컬스토리지명이 있으면 그것을 적용)
    const savedName = localStorage.getItem('profile_display_name') || user.name;
    if (usernameTitle) usernameTitle.textContent = savedName;
    if (emailSubtitle) emailSubtitle.textContent = user.email;

    // 2. 선물함 데이터로 실제 이용 현황과 최근 패스를 구성
    await loadProfileActivity();

    // 3. 모든 클릭 이벤트 바인딩
    bindProfileEvents();

  } catch (error) {
    console.error('Failed to initialize profile page:', error);
    location.href = 'login.html';
  }
}

async function loadProfileActivity() {
  const unusedCount = document.getElementById('profile-unused-count');
  const usedCount = document.getElementById('profile-used-count');
  const totalCount = document.getElementById('profile-total-count');
  const recentList = document.getElementById('profile-recent-list');

  try {
    const gifts = await fetchGiftCollections();
    const unusedGifts = gifts.unused;
    const usedGifts = gifts.used;

    if (unusedCount) unusedCount.textContent = String(unusedGifts.length);
    if (usedCount) usedCount.textContent = String(usedGifts.length);
    if (totalCount) totalCount.textContent = String(unusedGifts.length + usedGifts.length);

    const recentGifts = [
      ...unusedGifts.map((gift) => ({ ...gift, profileStatus: '사용 가능', profileDate: gift.createdAt })),
      ...usedGifts.map((gift) => ({ ...gift, profileStatus: '사용 완료', profileDate: gift.usedAt || gift.createdAt })),
    ]
      .sort((a, b) => getDateValue(b.profileDate) - getDateValue(a.profileDate))
      .slice(0, 3);

    renderRecentGifts(recentList, recentGifts);
  } catch (error) {
    console.error('Failed to load profile activity:', error);
    if (recentList) {
      recentList.innerHTML = '<p class="error-message">패스 이용 내역을 불러오지 못했습니다.</p>';
    }
  }
}

function renderRecentGifts(container, gifts) {
  if (!container) return;

  if (!gifts.length) {
    container.innerHTML = '<p class="empty-message">아직 받은 패스가 없습니다.</p>';
    return;
  }

  container.innerHTML = gifts.map((gift) => {
    const productName = gift.productName || '익산 환승패스';
    const isUsed = gift.profileStatus === '사용 완료';

    return `
      <button class="profile-recent-item" type="button" data-gift-id="${escapeProfileText(gift.giftId)}">
        ${createPassThumbnail(gift)}
        <span class="profile-recent-info">
          <strong>${escapeProfileText(productName)}</strong>
          <small>${escapeProfileText(formatProfileDate(gift.profileDate))}</small>
        </span>
        <span class="profile-recent-status${isUsed ? ' is-used' : ''}">${gift.profileStatus}</span>
      </button>
    `;
  }).join('');

  container.querySelectorAll('.profile-recent-item').forEach((item) => {
    item.addEventListener('click', () => {
      const giftId = item.dataset.giftId;
      if (giftId) location.href = `gift-use.html?giftId=${encodeURIComponent(giftId)}`;
    });
  });
}

function getDateValue(value) {
  const time = new Date(value || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatProfileDate(value) {
  if (!value) return '날짜 정보 없음';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '날짜 정보 없음';

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function escapeProfileText(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function bindProfileEvents() {
  // 뒤로가기 및 하단 동일 탭바
  document.getElementById('profile-back-btn')?.addEventListener('click', () => {
    location.href = 'index.html';
  });

  document.getElementById('profile-home-btn')?.addEventListener('click', () => {
    location.href = 'index.html';
  });

  document.getElementById('profile-pass-btn')?.addEventListener('click', () => {
    location.href = 'passes.html';
  });

  document.getElementById('profile-giftbox-btn')?.addEventListener('click', () => {
    location.href = 'giftbox.html';
  });

  document.getElementById('profile-all-gifts-btn')?.addEventListener('click', () => {
    location.href = 'giftbox.html';
  });

  // ⚙️ 설정 화면(settings.html) 이동 라우팅
  document.getElementById('profile-settings-btn')?.addEventListener('click', () => {
    location.href = 'settings.html';
  });

}
