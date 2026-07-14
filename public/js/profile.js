/*
 * 파일: public/js/profile.js
 * 목적: 프로필 메인 화면(profile.html) 전용 동작 처리
 * 왜: 사용자 요약 정보와 획득 배지 그리드를 로드하고 설정 화면 이동 처리를 위해
 * 주요: 로그인 정보 조회(임시 우회), 설정(Settings) 라우팅, 로그아웃 API 호출, 하단 탭바 이동
 */

document.addEventListener('DOMContentLoaded', () => {
  // 앱 구동 시 기존에 저장된 다크모드 설정이 있다면 로드 시 즉시 활성화 (화면 깜빡임 방지)
  const isDarkMode = localStorage.getItem('profile_dark_mode') === 'true';
  if (isDarkMode) {
    document.body.classList.add('dark-theme');
  }

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

    // 2. 모든 클릭 이벤트 바인딩
    bindProfileEvents(user);

  } catch (error) {
    console.error('Failed to initialize profile page:', error);
    location.href = 'login.html';
  }
}

function bindProfileEvents(user) {
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

  // ⚙️ 설정 화면(settings.html) 이동 라우팅
  document.getElementById('profile-settings-btn')?.addEventListener('click', () => {
    location.href = 'settings.html';
  });

  // 🚪 로그아웃 API 호출 연동 (메인 프로필 단독 버튼)
  document.getElementById('profile-logout-btn')?.addEventListener('click', async () => {
    const isLogout = confirm('로그아웃 하시겠습니까?');
    if (!isLogout) return;

    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        localStorage.removeItem('profile_display_name');
        localStorage.removeItem('profile_display_phone');
        localStorage.removeItem('profile_default_card');
        localStorage.removeItem('profile_dark_mode');
        document.body.classList.remove('dark-theme');
        alert('성공적으로 로그아웃되었습니다.');
        location.href = 'index.html';
      } else {
        alert('로그아웃에 실패했습니다.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('로그아웃 처리 중 오류가 발생했습니다.');
    }
  });
}
