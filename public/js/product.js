/*
 * 파일: public/js/product.js
 * 목적: 상품 상세 화면(product.html) 전용 동작 처리
 * 왜: 홈에서 넘어온 productId로 실제 상품 상세 정보를 보여주고 주문서로 연결하기 위해
 * 주요: 상품 상세 API 조회, 뒤로가기, 로그인 확인 후 order.html/login.html 이동
 */

const fallbackImageUrl = 'img/iksan-logo.svg';
// 홈 화면에서 product.html?id=상품ID 형태로 넘긴 값을 상세 조회 기준으로 사용합니다.
const productId = new URLSearchParams(location.search).get('id');

loadProductDetail();

// 뒤로가기 버튼
document.getElementById('back-btn').addEventListener('click', () => {
  history.back();
});

async function loadProductDetail() {
  if (!productId) {
    showProductError('상품 정보를 확인할 수 없습니다.');
    return;
  }

  try {
    const response = await fetchProductDetail(productId);
    // 상세 화면도 API의 data만 사용합니다. status/message는 성공 여부와 로그 확인용입니다.
    renderProductDetail(response.data);
  } catch (error) {
    console.error('상품 상세 조회 중 오류:', error);
    showProductError(error.message || '상품 정보를 불러오지 못했습니다.');
  }
}

function renderProductDetail(product) {
  if (!product) {
    showProductError('상품 정보를 찾을 수 없습니다.');
    return;
  }

  const image = document.getElementById('product-image');
  const category = document.getElementById('product-category');
  const name = document.getElementById('product-name');
  const price = document.getElementById('product-price');
  const description = document.getElementById('product-description');
  const productName = product.name || '환승패스 상품';

  // 이미지 경로가 없거나 로딩에 실패해도 화면이 비지 않도록 익산 로고를 대체 이미지로 사용합니다.
  image.src = product.thumbnailUrl || fallbackImageUrl;
  image.alt = productName;
  image.onerror = () => {
    image.onerror = null;
    image.src = fallbackImageUrl;
  };

  category.textContent = product.category || '익산 환승패스';
  name.textContent = productName;
  price.textContent = `${Number(product.price || 0).toLocaleString('ko-KR')}원`;
  description.textContent = product.description || '상품 설명이 준비 중입니다.';
}

function showProductError(message) {
  document.getElementById('product-name').textContent = message;
  document.getElementById('product-price').textContent = '-';
  document.getElementById('product-description').textContent = '홈 화면에서 상품을 다시 선택해주세요.';
  document.getElementById('product-image').src = fallbackImageUrl;
}

// 로그인 여부 확인 후 이동시키는 함수
async function goToOrderIfLoggedIn(type) {
  if (!productId) {
    alert('상품 정보를 확인할 수 없습니다.');
    return;
  }

  try {
    // 주문서는 로그인 세션이 필요한 화면이라, 이동 전 /api/auth/me로 현재 로그인 여부를 확인합니다.
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      // 로그인 되어있음 → 주문서로 이동
      location.href = `order.html?type=${type}&productId=${productId}`;
    } else {
      // 로그인 안 되어있음 → 로그인 화면으로 이동
      location.href = 'login.html';
    }
  } catch (error) {
    console.error('로그인 확인 중 오류:', error);
    location.href = 'login.html';
  }
}

// 나에게 선물하기 버튼
document.getElementById('gift-me-btn').addEventListener('click', () => {
  goToOrderIfLoggedIn('me');
});

// 선물하기 버튼
document.getElementById('gift-send-btn').addEventListener('click', () => {
  goToOrderIfLoggedIn('gift');
});
