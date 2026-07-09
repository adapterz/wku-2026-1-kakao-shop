/*
 * 파일: public/js/giftbox.js
 * 목적: 선물함 화면(giftbox.html) 전용 동작 처리
 * 왜: 뒤로가기, 패스 카드 클릭, 하단 탭바 이동 이벤트를 처리하기 위해
 * 주요: 뒤로가기, 패스 카드 클릭 시 gift-use.html 이동, 홈 탭 이동
 */

// 뒤로가기 버튼
document.getElementById('back-btn').addEventListener('click', () => {
  location.href = 'index.html';
});

// 패스 카드 클릭 (여러 개를 한 번에 처리)
document.querySelectorAll('.gift-card').forEach((card) => {
  card.addEventListener('click', () => {
    location.href = 'gift-use.html';
  });
});

// 하단 탭바 - 홈으로 이동
document.getElementById('tabbar-home-btn').addEventListener('click', () => {
  location.href = 'index.html';
});