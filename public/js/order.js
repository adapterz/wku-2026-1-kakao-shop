/*
 * 파일: public/js/order.js
 * 목적: 주문서 화면(order.html) 전용 동작 처리
 * 왜: 받는 사람 선택 토글과 결제(주문 생성) 요청을 처리하기 위해
 * 주요: 뒤로가기, 나에게/친구에게 선물 토글, 결제하기 클릭 시 주문 생성 API 호출
 */

// 뒤로가기 버튼
document.getElementById('back-btn').addEventListener('click', () => {
  history.back();
});

// 받는 사람 토글 (나에게 선물 / 친구에게 선물)
const btnMe = document.getElementById('btn-me');
const btnFriend = document.getElementById('btn-friend');
const receiverInput = document.getElementById('receiver-input');

btnMe.addEventListener('click', () => {
  btnMe.classList.add('active');
  btnFriend.classList.remove('active');
  receiverInput.style.display = 'none'; // 나에게 선물이면 받는 사람 입력 불필요
});

btnFriend.addEventListener('click', () => {
  btnFriend.classList.add('active');
  btnMe.classList.remove('active');
  receiverInput.style.display = 'block';
});

// 결제하기 버튼 — 주문 생성(Mock 결제 포함) API 호출
document.getElementById('checkout-btn').addEventListener('click', async () => {
  const isGiftToFriend = btnFriend.classList.contains('active');
  const receiverInputValue = receiverInput.value.trim();

  if (isGiftToFriend && !receiverInputValue) {
    alert('받는 사람 이메일 또는 아이디를 입력해주세요.');
    return;
  }

  const orderData = {
    productId: 1, // TODO: product.html에서 넘어온 실제 상품 ID로 교체 필요
    receiver: isGiftToFriend ? receiverInputValue : null,
    message: '나는 내가 챙긴다! 소중한 나에게 주는 선물'
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (res.ok) {
      location.href = 'complete.html';
    } else {
      alert('주문 생성에 실패했습니다. 다시 시도해주세요.');
    }
  } catch (error) {
    console.error('주문 생성 중 오류:', error);
    alert('네트워크 오류가 발생했습니다.');
  }
});