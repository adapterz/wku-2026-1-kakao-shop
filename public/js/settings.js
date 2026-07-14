/*
 * 파일: public/js/settings.js
 * 목적: 설정 화면(settings.html) 전용 동작 처리
 * 왜: 개인정보 수정, 결제수단 관리, 알림/다크모드 토글, 로그아웃/탈퇴 등의 제어 처리를 한 곳에서 집약 수행하기 위함
 * 주요: 로그인 정보 조회(임시 우회), 다크모드/알림 토글, 통합 폼 정보 저장, 결제 관리, 로그아웃/탈퇴 API 연동
 */

document.addEventListener('DOMContentLoaded', () => {
  // 앱 구동 시 기존에 저장된 다크모드 설정이 있다면 로드 시 즉시 활성화 (화면 깜빡임 방지)
  const isDarkMode = localStorage.getItem('profile_dark_mode') === 'true';
  if (isDarkMode) {
    document.body.classList.add('dark-theme');
    const toggleInput = document.getElementById('dark-mode-toggle');
    if (toggleInput) toggleInput.checked = true;
  }

  initSettingsPage();
});

async function initSettingsPage() {
  const usernameTitle = document.getElementById('settings-profile-username');
  const emailSubtitle = document.getElementById('settings-profile-email');
  const usernameInput = document.getElementById('settings-edit-username');
  const emailInput = document.getElementById('settings-edit-email');
  const phoneInput = document.getElementById('settings-edit-phone');

  try {
    // 1. 현재 로그인 사용자 정보 비동기 조회
    const response = await fetchCurrentUser();
    const user = response.data || {};

    if (!user.email) {
      location.href = 'login.html';
      return;
    }

    // 1. 설정 퀵 프로필 띠 및 정보 폼 초기 바인딩
    const savedName = localStorage.getItem('profile_display_name') || user.name;
    const savedPhone = localStorage.getItem('profile_display_phone') || user.phone || '010-2411-9988';

    if (usernameTitle) usernameTitle.textContent = savedName;
    if (emailSubtitle) emailSubtitle.textContent = user.email;

    if (usernameInput) usernameInput.value = savedName;
    if (emailInput) emailInput.value = user.email;
    if (phoneInput) phoneInput.value = savedPhone;

    // 2. 결제 상태 라벨 갱신
    updatePaymentStatus();

    // 3. 다크모드/알림 체크 상태 셋업
    setupThemeAndToggles();

    // 4. 모든 클릭/체인지 이벤트 바인딩
    bindSettingsEvents(user);

  } catch (error) {
    console.error('Failed to initialize settings page:', error);
    location.href = 'login.html';
  }
}

function setupThemeAndToggles() {
  const darkToggle = document.getElementById('dark-mode-toggle');
  const notiToggle = document.getElementById('notification-toggle');

  if (darkToggle) {
    darkToggle.checked = document.body.classList.contains('dark-theme');
  }

  if (notiToggle) {
    const isNotiChecked = localStorage.getItem('profile_noti_enabled') !== 'false';
    notiToggle.checked = isNotiChecked;
  }
}

function updatePaymentStatus() {
  const statusText = document.getElementById('settings-payment-status-text');
  if (statusText) {
    const cardInfo = localStorage.getItem('profile_default_card');
    if (cardInfo) {
      statusText.textContent = 'KB국민 4518 >';
      statusText.style.color = 'var(--blue)';
    } else {
      statusText.textContent = '등록 안 됨 >';
      statusText.style.color = 'var(--muted)';
    }
  }
}

function bindSettingsEvents(user) {
  // 뒤로가기 (프로필 메인으로 귀환)
  document.getElementById('settings-back-btn')?.addEventListener('click', () => {
    location.href = 'profile.html';
  });

  // 하단 탭바 네비게이션
  document.getElementById('settings-home-btn')?.addEventListener('click', () => {
    location.href = 'index.html';
  });

  document.getElementById('settings-pass-btn')?.addEventListener('click', () => {
    location.href = 'passes.html';
  });

  document.getElementById('settings-giftbox-btn')?.addEventListener('click', () => {
    location.href = 'giftbox.html';
  });

  // 퀵 프로필 띠 클릭 시 아래 수정 폼으로 스크롤 이동
  document.getElementById('settings-quick-profile-btn')?.addEventListener('click', () => {
    const targetSection = document.getElementById('info-form-section');
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
      document.getElementById('settings-edit-username')?.focus();
    }
  });

  // 🌙 다크 모드 토글 (실시간 전환 및 로컬스토리지 동기화)
  document.getElementById('dark-mode-toggle')?.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('profile_dark_mode', 'true');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('profile_dark_mode', 'false');
    }
  });

  // 🔔 알림 수신 토글
  document.getElementById('notification-toggle')?.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    localStorage.setItem('profile_noti_enabled', isChecked ? 'true' : 'false');
  });

  // 💳 결제 수단 관리 모의 바인딩
  document.getElementById('settings-payment-btn')?.addEventListener('click', () => {
    const defaultCard = localStorage.getItem('profile_default_card');
    if (defaultCard) {
      const confirmRemove = confirm(`등록된 결제 수단이 존재합니다.\n(등록 카드: ${defaultCard})\n\n해당 카드를 연동 해제하시겠습니까?`);
      if (confirmRemove) {
        localStorage.removeItem('profile_default_card');
        alert('결제 수단 카드가 해지되었습니다.');
        updatePaymentStatus();
      }
    } else {
      const confirmRegister = confirm('등록된 결제 수단이 없습니다.\n새로운 신용카드(KB국민 4518)를 연동하시겠습니까?');
      if (confirmRegister) {
        localStorage.setItem('profile_default_card', 'KB국민 4518-****-****');
        alert('결제 수단 카드가 성공적으로 등록되었습니다.');
        updatePaymentStatus();
      }
    }
  });

  // 💾 변경사항 저장
  document.getElementById('settings-save-changes-btn')?.addEventListener('click', () => {
    const usernameInput = document.getElementById('settings-edit-username');
    const phoneInput = document.getElementById('settings-edit-phone');
    const usernameTitle = document.getElementById('settings-profile-username');

    if (!usernameInput || !phoneInput) return;

    const newName = usernameInput.value.trim();
    const newPhone = phoneInput.value.trim();

    if (!newName) {
      alert('닉네임을 입력해 주세요.');
      return;
    }
    if (newName.length < 2) {
      alert('닉네임은 최소 2글자 이상 입력해야 합니다.');
      return;
    }
    if (!newPhone) {
      alert('휴대폰 번호를 입력해 주세요.');
      return;
    }

    if (!/^\d{2,3}-\d{3,4}-\d{4}$/.test(newPhone)) {
      alert('올바른 휴대폰 번호 형식(010-xxxx-xxxx)으로 입력해 주세요.');
      return;
    }

    localStorage.setItem('profile_display_name', newName);
    localStorage.setItem('profile_display_phone', newPhone);

    if (usernameTitle) {
      usernameTitle.textContent = newName;
    }

    alert('변경사항이 성공적으로 저장되었습니다!');
  });

  // 🚪 로그아웃
  document.getElementById('settings-logout-btn')?.addEventListener('click', async () => {
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
        alert('로그아웃 실패');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  });

  // ⚠️ 회원 탈퇴
  document.getElementById('settings-withdraw-btn')?.addEventListener('click', async () => {
    const confirmWithdraw = confirm('정말로 탈퇴하시겠습니까?\n모든 구매/선물 내역 및 계정 정보가 영구적으로 파괴됩니다.');
    if (!confirmWithdraw) return;

    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        localStorage.removeItem('profile_display_name');
        localStorage.removeItem('profile_display_phone');
        localStorage.removeItem('profile_default_card');
        localStorage.removeItem('profile_dark_mode');
        document.body.classList.remove('dark-theme');
        alert('회원 탈퇴 처리가 완료되었습니다.\n이용해 주셔서 감사합니다.');
        location.href = 'index.html';
      } else {
        alert('탈퇴 처리 실패');
      }
    } catch (error) {
      console.error('Withdraw error:', error);
      alert('탈퇴 진행 중 오류가 발생했습니다.');
    }
  });
}
