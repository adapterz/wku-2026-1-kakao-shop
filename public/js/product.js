/*
 * 파일: public/js/product.js
 * 목적: 상품 상세 화면(product.html) 전용 동작 처리
 * 왜: 뒤로가기·선물하기 버튼 클릭 시 로그인 여부를 확인 후 페이지 이동시키기 위해
 * 주요: 뒤로가기, 로그인 확인 후 order.html/login.html 이동
 */

// 뒤로가기 버튼
document.getElementById('back-btn').addEventListener('click', () => {
  history.back();
});

// 로그인 여부 확인 후 이동시키는 함수
async function goToOrderIfLoggedIn(type) {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      // 로그인 되어있음 → 주문서로 이동
      location.href = `order.html?type=${type}`;
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