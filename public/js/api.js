/*
 * 파일: public/js/api.js
 * 목적: 서버 API를 호출하는 공통 함수 모음
 * 왜: 모든 페이지에서 반복되는 fetch 호출을 한 곳에서 관리하기 위해
 * 주요: fetch 요청/응답 처리, 에러 핸들링
 */

async function requestJson(url, options = {}) {
  // GET/POST 등 모든 JSON API 호출에서 공통으로 사용하는 fetch 래퍼입니다.
  const response = await fetch(url, {
    ...options,
    headers: {
      // body가 있는 요청만 JSON Content-Type을 붙입니다. GET 요청에는 불필요한 헤더를 넣지 않습니다.
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  // 응답 본문이 비어있는 경우에도 화면 JS가 터지지 않도록 빈 객체로 처리합니다.
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // BE가 내려준 message를 화면 JS에서 그대로 표시할 수 있도록 Error로 넘깁니다.
    throw new Error(data.message || `API request failed: ${response.status}`);
  }

  return data;
}

async function fetchProducts() {
  return requestJson('/api/products');
}

async function fetchProductDetail(productId) {
  return requestJson(`/api/products/${productId}`);
}

async function loginUser(payload) {
  // 로그인 성공 시 서버가 세션을 만들고, 이후 같은 브라우저 요청에서 로그인 상태가 유지됩니다.
  return requestJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function signupUser(payload) {
  // 회원가입 화면은 입력값을 모아 보내고, 중복 이메일/비밀번호 해시는 BE에서 최종 처리합니다.
  return requestJson('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
