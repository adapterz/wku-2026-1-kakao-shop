/*
 * 파일: public/js/login.js
 * 목적: 로그인 화면에서 입력값을 수집하고 로그인 API를 호출합니다.
 * 주요: form submit 처리, POST /api/auth/login 요청, 성공/실패 메시지 처리
 */

const loginForm = document.querySelector('[data-login-form]');
const loginMessage = document.querySelector('[data-auth-message]');

function setLoginMessage(message, type = 'info') {
  if (!loginMessage) return;

  loginMessage.textContent = message;
  // CSS에서 성공/실패 메시지 색을 구분할 수 있도록 상태값을 data 속성에 남깁니다.
  loginMessage.dataset.type = type;
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    // form의 기본 새로고침을 막고 JS에서 API 요청 흐름을 직접 제어합니다.
    event.preventDefault();

    const formData = new FormData(loginForm);
    const payload = {
      email: String(formData.get('email') || '').trim(),
      password: String(formData.get('password') || ''),
    };

    // FE에서는 빈 값만 먼저 막고, 계정 검증은 BE auth API가 최종 판단합니다.
    if (!payload.email || !payload.password) {
      setLoginMessage('이메일과 비밀번호를 입력해주세요.', 'error');
      return;
    }

    try {
      setLoginMessage('로그인 요청 중입니다.', 'info');
      await loginUser(payload);
      clearGiftCollectionsCache();
      // 로그인 성공 후에는 세션이 생긴 상태이므로 홈/주문 등 로그인 필요 흐름으로 이동할 수 있습니다.
      setLoginMessage('로그인되었습니다. 홈으로 이동합니다.', 'success');
      window.location.href = 'index.html';
    } catch (error) {
      setLoginMessage(error.message || '로그인에 실패했습니다.', 'error');
    }
  });
}
