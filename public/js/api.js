/*
 * 파일: public/js/api.js
 * 목적: 서버 API를 호출하는 공통 함수 모음
 * 왜: 모든 페이지에서 반복되는 fetch 호출을 한 곳에서 관리하기 위해
 * 주요: fetch 요청/응답 처리, 에러 핸들링
 */

const GIFT_CACHE_STORAGE_KEY = 'iksan_gift_collections_v1';
const GIFT_CACHE_TTL_MS = 5 * 60 * 1000;

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
    if (data.message === 'login_required') {
      clearGiftCollectionsCache();
    }

    // BE가 내려준 message를 화면 JS에서 그대로 표시할 수 있도록 Error로 넘깁니다.
    throw new Error(data.message || `API request failed: ${response.status}`);
  }

  return data;
}

async function fetchProducts(category = '') {
  // 전체 조회는 기존 URL을 유지하고, 패스 탭 필터에서만 category 쿼리를 추가합니다.
  const categoryQuery = category ? `?category=${encodeURIComponent(category)}` : '';
  return requestJson(`/api/products${categoryQuery}`);
}

async function searchProducts(keyword) {
  return requestJson(`/api/products?keyword=${encodeURIComponent(keyword)}`);
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

async function fetchCurrentUser() {
  // 세션 쿠키 기준으로 현재 로그인 사용자를 확인합니다. 비로그인 상태면 BE가 401을 내려줍니다.
  return requestJson('/api/auth/me');
}

function readGiftCollectionsCache() {
  try {
    const cachedValue = sessionStorage.getItem(GIFT_CACHE_STORAGE_KEY);
    if (!cachedValue) return null;

    const cached = JSON.parse(cachedValue);
    const isValid = Number.isFinite(cached.cachedAt)
      && Array.isArray(cached.unused)
      && Array.isArray(cached.used);

    if (!isValid || Date.now() - cached.cachedAt >= GIFT_CACHE_TTL_MS) {
      clearGiftCollectionsCache();
      return null;
    }

    return {
      unused: cached.unused,
      used: cached.used,
    };
  } catch (error) {
    clearGiftCollectionsCache();
    return null;
  }
}

function writeGiftCollectionsCache(unused, used) {
  try {
    sessionStorage.setItem(GIFT_CACHE_STORAGE_KEY, JSON.stringify({
      cachedAt: Date.now(),
      unused,
      used,
    }));
  } catch (error) {
    // 저장 공간이 제한된 환경에서는 캐시 없이 기존 API 조회 흐름을 유지합니다.
  }
}

function clearGiftCollectionsCache() {
  try {
    sessionStorage.removeItem(GIFT_CACHE_STORAGE_KEY);
  } catch (error) {
    // 저장소 접근이 제한돼도 로그인·주문·사용 처리는 계속 진행합니다.
  }
}

async function fetchGiftCollections({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = readGiftCollectionsCache();
    if (cached) return cached;
  }

  const [unusedResponse, usedResponse] = await Promise.all([
    requestJson('/api/gifts?status=unused'),
    requestJson('/api/gifts?status=used'),
  ]);
  const unused = Array.isArray(unusedResponse.data) ? unusedResponse.data : [];
  const used = Array.isArray(usedResponse.data) ? usedResponse.data : [];

  writeGiftCollectionsCache(unused, used);
  return { unused, used };
}
