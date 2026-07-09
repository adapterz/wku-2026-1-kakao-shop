/*
 * 파일: public/js/complete.js
 * 목적: 결제 완료 화면(complete.html) 전용 동작 처리
 * 왜: 주문 생성 후 발급된 주문 상세 정보를 완료 화면에 표시하기 위해
 * 주요: 주문 상세 조회, 받는 사람/상품 요약 표시, 홈/주문내역/선물함 이동
 */

document.addEventListener('DOMContentLoaded', () => {
  loadOrderDetail();
});

document.getElementById('home-btn').addEventListener('click', () => {
  location.href = 'index.html';
});

document.getElementById('order-history-btn').addEventListener('click', () => {
  location.href = 'giftbox.html';
});

document.getElementById('giftbox-btn').addEventListener('click', () => {
  location.href = 'giftbox.html';
});

async function loadOrderDetail() {
  const params = new URLSearchParams(location.search);
  const orderId = params.get('orderId');

  if (!orderId) {
    showOrderLoadError('주문 번호를 확인할 수 없습니다.');
    return;
  }

  try {
    const response = await requestJson(`/api/orders/${orderId}`);
    renderOrderDetail(response.data);
  } catch (error) {
    console.error('주문 상세 조회 중 오류:', error);
    showOrderLoadError(error.message || '주문 정보를 불러오지 못했습니다.');
  }
}

function renderOrderDetail(order) {
  const receiverName = order.receiver && order.receiver.name ? order.receiver.name : '나';
  const receiverPhone = order.receiver && order.receiver.phone ? order.receiver.phone : '';
  const product = order.product || {};
  const fallbackImageUrl = 'img/iksan-logo.svg';
  const productImageUrl = product.thumbnailUrl || fallbackImageUrl;

  document.getElementById('complete-title').innerHTML = `<strong>${escapeHtml(receiverName)}</strong>에게<br>선물을 보냈습니다.`;
  document.getElementById('receiver-name').textContent = receiverName;
  document.getElementById('receiver-detail').textContent = receiverPhone;
  document.getElementById('complete-product-brand').textContent = product.brandName || '익산교통';
  document.getElementById('complete-product-name').textContent = product.name || '익산 환승패스';
  document.getElementById('complete-product-quantity').textContent = '수량 : 1개';

  const productImage = document.getElementById('complete-product-image');
  productImage.src = productImageUrl;
  productImage.alt = product.name || '익산 환승패스';
  productImage.onerror = () => {
    productImage.onerror = null;
    productImage.src = fallbackImageUrl;
  };
}

function showOrderLoadError(message) {
  document.getElementById('complete-title').innerHTML = '주문 정보를<br>확인할 수 없습니다.';
  document.getElementById('receiver-name').textContent = message;
  document.getElementById('receiver-detail').textContent = '';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
