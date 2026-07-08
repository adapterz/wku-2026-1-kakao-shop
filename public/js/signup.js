/*
 * 파일: public/js/signup.js
 * 목적: 회원가입 화면에서 입력값을 수집하고 회원가입 API를 호출합니다.
 * 주요: form submit 처리, 비밀번호 확인 검증, POST /api/auth/signup 요청, 성공/실패 메시지 처리
 */

const signupForm = document.querySelector('[data-signup-form]');
const signupMessage = document.querySelector('[data-auth-message]');

function setSignupMessage(message, type = 'info') {
  if (!signupMessage) return;

  signupMessage.textContent = message;
  signupMessage.dataset.type = type;
}

if (signupForm) {
  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(signupForm);
    const payload = {
      email: String(formData.get('email') || '').trim(),
      password: String(formData.get('password') || ''),
      name: String(formData.get('name') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      birthDate: String(formData.get('birthDate') || ''),
      gender: String(formData.get('gender') || ''),
    };
    const passwordConfirm = String(formData.get('passwordConfirm') || '');

    if (!payload.email || !payload.password || !payload.name || !payload.phone) {
      setSignupMessage('필수 입력값을 확인해주세요.', 'error');
      return;
    }

    if (payload.password !== passwordConfirm) {
      setSignupMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.', 'error');
      return;
    }

    try {
      setSignupMessage('회원가입 요청 중입니다.', 'info');
      await signupUser(payload);
      setSignupMessage('회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.', 'success');
      window.location.href = 'login.html';
    } catch (error) {
      setSignupMessage(error.message || '회원가입에 실패했습니다.', 'error');
    }
  });
}
