/*
 * 파일: public/js/signup.js
 * 목적: 회원가입 화면에서 입력값을 수집하고 회원가입 API를 호출합니다.
 * 주요: form submit 처리, 비밀번호 확인 검증, POST /api/auth/signup 요청, 성공/실패 메시지 처리
 */

const signupForm = document.querySelector('[data-signup-form]');
const signupMessage = document.querySelector('[data-auth-message]');
const WEAK_PASSWORDS = new Set([
  'password',
  'password1',
  'qwer1234',
  'qwerty123',
  '12345678',
  '11111111',
  '00000000',
  'abc12345',
  'admin1234',
]);

function getEmailValidationMessage(email) {
  // type="email"은 1@1 같은 값도 통과할 수 있어, 도메인 구조를 한 번 더 확인합니다.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return '이메일 형식을 확인해주세요. 예: name@example.com';
  }

  const [localPart, domain] = email.split('@');
  const domainLabels = domain.split('.');
  const mainDomain = domainLabels[0] || '';

  if (localPart.length < 2 || mainDomain.length < 2 || !/[a-zA-Z]/.test(mainDomain)) {
    return '사용 가능한 이메일 주소를 입력해주세요. 예: name@gmail.com';
  }

  return '';
}

function getPasswordValidationMessage(password, email) {
  const normalizedPassword = password.toLowerCase();

  if (password.length < 8) {
    return '비밀번호는 8자 이상으로 입력해주세요.';
  }

  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return '비밀번호는 영문과 숫자를 함께 포함해야 합니다.';
  }

  if (/^(.)\1+$/.test(password) || WEAK_PASSWORDS.has(normalizedPassword)) {
    return '너무 단순한 비밀번호는 사용할 수 없습니다.';
  }

  if (email && normalizedPassword === email.toLowerCase()) {
    return '이메일과 같은 비밀번호는 사용할 수 없습니다.';
  }

  return '';
}

function setSignupMessage(message, type = 'info') {
  if (!signupMessage) return;

  signupMessage.textContent = message;
  // CSS에서 성공/실패 메시지 색을 구분할 수 있도록 상태값을 data 속성에 남깁니다.
  signupMessage.dataset.type = type;
}

if (signupForm) {
  signupForm.addEventListener('submit', async (event) => {
    // form의 기본 새로고침을 막고 JS에서 API 요청 흐름을 직접 제어합니다.
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
    // passwordConfirm은 화면 검증용 값이라 BE로 보내지 않습니다.
    const passwordConfirm = String(formData.get('passwordConfirm') || '');

    // 회원가입 payload는 ERD/API에서 약속한 users 필드 기준으로 구성합니다.
    if (!payload.email || !payload.password || !payload.name || !payload.phone) {
      setSignupMessage('필수 입력값을 확인해주세요.', 'error');
      return;
    }

    const emailValidationMessage = getEmailValidationMessage(payload.email);
    if (emailValidationMessage) {
      setSignupMessage(emailValidationMessage, 'error');
      return;
    }

    const passwordValidationMessage = getPasswordValidationMessage(payload.password, payload.email);
    if (passwordValidationMessage) {
      setSignupMessage(passwordValidationMessage, 'error');
      return;
    }

    if (payload.password !== passwordConfirm) {
      setSignupMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.', 'error');
      return;
    }

    try {
      setSignupMessage('회원가입 요청 중입니다.', 'info');
      await signupUser(payload);
      // 회원가입은 계정 생성까지만 담당하고, 실제 로그인 세션은 로그인 화면에서 다시 생성합니다.
      setSignupMessage('회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.', 'success');
      window.location.href = 'login.html';
    } catch (error) {
      setSignupMessage(error.message || '회원가입에 실패했습니다.', 'error');
    }
  });
}
