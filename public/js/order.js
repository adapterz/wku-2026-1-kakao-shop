/*
 * 파일: public/js/order.js
 * 목적: 주문서 화면(order.html) 전용 동작 처리
 * 왜: 상품 상세에서 넘어온 productId 기준으로 주문 정보를 표시하고 주문 생성 요청을 처리하기 위해
 * 주요: 상품 조회, 뒤로가기, 나에게/친구에게 선물 토글, 결제하기 클릭 시 주문 생성 API 호출
 */

const fallbackImageUrl = 'img/iksan-logo.svg';
const orderParams = new URLSearchParams(location.search);
const productId = Number(orderParams.get('productId'));
let selectedProduct = null;

checkLoginBeforeOrder();
loadOrderProduct();

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
  if (!selectedProduct) {
    alert('주문할 상품 정보를 확인할 수 없습니다.');
    return;
  }

  const isGiftToFriend = btnFriend.classList.contains('active');
  const receiverInputValue = receiverInput.value.trim();

  if (isGiftToFriend && !receiverInputValue) {
    alert('받는 사람 이메일 또는 아이디를 입력해주세요.');
    return;
  }

  const orderData = {
    productId,
    giftMessage: document.querySelector('.message-text').textContent.trim().replace(/\s+/g, ' ')
  };

  try {
    const response = await requestJson('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    const orderId = response.data && response.data.orderId;

    if (!orderId) {
      throw new Error('주문 번호를 확인할 수 없습니다.');
    }

    location.href = `complete.html?orderId=${orderId}`;
  } catch (error) {
    console.error('주문 생성 중 오류:', error);
    alert(error.message || '주문 생성에 실패했습니다. 다시 시도해주세요.');
  }
});

async function checkLoginBeforeOrder() {
  try {
    await requestJson('/api/auth/me');
  } catch (error) {
    location.href = 'login.html';
  }
}

async function loadOrderProduct() {
  if (!productId) {
    showOrderProductError('상품 정보를 확인할 수 없습니다.');
    return;
  }

  try {
    const response = await fetchProductDetail(productId);
    selectedProduct = response.data;
    renderOrderProduct(selectedProduct);
  } catch (error) {
    console.error('주문 상품 조회 중 오류:', error);
    showOrderProductError(error.message || '상품 정보를 불러오지 못했습니다.');
  }
}

function renderOrderProduct(product) {
  if (!product) {
    showOrderProductError('상품 정보를 찾을 수 없습니다.');
    return;
  }

  const productName = product.name || '환승패스 상품';
  const productPrice = Number(product.price || 0).toLocaleString('ko-KR') + '원';
  const productImage = document.getElementById('order-product-image');

  productImage.src = product.thumbnailUrl || fallbackImageUrl;
  productImage.alt = productName;
  productImage.onerror = () => {
    productImage.onerror = null;
    productImage.src = fallbackImageUrl;
  };

  document.getElementById('order-product-brand').textContent = product.brandName || '익산 교통';
  document.getElementById('order-product-name').textContent = productName;
  document.getElementById('order-product-price').textContent = productPrice;
  document.getElementById('order-total-price').textContent = productPrice;
  document.getElementById('order-final-price').textContent = productPrice;
  document.getElementById('checkout-btn').textContent = `${productPrice} 결제하기`;
}

function showOrderProductError(message) {
  document.getElementById('order-product-name').textContent = message;
  document.getElementById('order-product-price').textContent = '-';
  document.getElementById('order-total-price').textContent = '-';
  document.getElementById('order-final-price').textContent = '-';
  document.getElementById('checkout-btn').textContent = '결제하기';
}
