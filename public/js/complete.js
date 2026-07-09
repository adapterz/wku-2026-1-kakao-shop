/*
 * 파일: public/js/complete.js
 * 목적: 결제 완료 화면(complete.html) 전용 동작 처리
 * 왜: 홈/주문내역/선물함 이동 버튼의 클릭 이벤트를 처리하기 위해
 * 주요: 홈 이동, 주문내역 이동, 선물함 이동
 */

document.getElementById('home-btn').addEventListener('click', () => {
  location.href = 'index.html';
});

document.getElementById('order-history-btn').addEventListener('click', () => {
  location.href = 'giftbox.html';
});

document.getElementById('giftbox-btn').addEventListener('click', () => {
  location.href = 'giftbox.html';
});