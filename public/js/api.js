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
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
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
  return requestJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function signupUser(payload) {
  return requestJson('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
