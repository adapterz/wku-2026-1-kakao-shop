/*
 * 파일: public/js/api.js
 * 목적: 서버 API를 호출하는 공통 함수 모음
 * 왜: 모든 페이지에서 반복되는 fetch 호출을 한 곳에서 관리하기 위해
 * 주요: fetch 요청/응답 처리, 에러 핸들링
 */

async function requestJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

async function fetchProducts() {
  return requestJson('/api/products');
}

async function fetchProductDetail(productId) {
  return requestJson(`/api/products/${productId}`);
}
