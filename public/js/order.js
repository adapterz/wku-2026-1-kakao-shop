/*
 * 파일: public/js/order.js
 * 목적: 주문서 화면(order.html) 전용 동작 처리
 * 왜: 상품 상세에서 넘어온 productId 기준으로 주문 정보를 표시하고 주문 생성 요청을 처리하기 위해
 * 주요: 상품 조회, 뒤로가기, 나에게/친구에게 선물 토글, 결제하기 클릭 시 주문 생성 API 호출
 */

const fallbackImageUrl = 'img/iksan-logo.svg';
const orderParams = new URLSearchParams(location.search);
// product.html에서 넘긴 productId로 주문서에 표시할 상품과 주문 생성 대상을 맞춥니다.
const productId = Number(orderParams.get('productId'));
let selectedProduct = null;
let isEditingGiftMessage = false;
let isGiftMessageCustomized = false;

const SELF_GIFT_MESSAGE = '나는 내가 챙긴다!\n소중한 나에게 주는 선물';
const FRIEND_GIFT_MESSAGE = '익산의 편리한 이동을 선물할게요!\n즐거운 하루 보내세요.';

const giftMessageText = document.getElementById('gift-message-text');
const giftMessageInput = document.getElementById('gift-message-input');
const giftMessageGuide = document.getElementById('gift-message-guide');
const messageEditBtn = document.getElementById('message-edit-btn');
const messageEditBtnLabel = document.getElementById('message-edit-btn-label');

// 주문서는 로그인 사용자만 접근 가능해야 하므로 화면 로딩 시 세션을 먼저 확인합니다.
checkLoginBeforeOrder();
loadOrderProduct();

// 뒤로가기 버튼
document.getElementById('back-btn').addEventListener('click', () => {
  history.back();
});

messageEditBtn.addEventListener('click', () => {
  if (!isEditingGiftMessage) {
    // 기존 카드 문구를 입력창에 옮겨 사용자가 바로 수정할 수 있게 합니다.
    giftMessageInput.value = giftMessageText.textContent.trim();
    setGiftMessageEditMode(true);
    giftMessageInput.focus();
    return;
  }

  const nextMessage = giftMessageInput.value.trim();

  if (!nextMessage) {
    alert('선물 메시지를 입력해주세요.');
    giftMessageInput.focus();
    return;
  }

  giftMessageText.textContent = nextMessage;
  isGiftMessageCustomized = true;
  setGiftMessageEditMode(false);
});

// 받는 사람 토글 (나에게 선물 / 친구에게 선물)
const btnMe = document.getElementById('btn-me');
const btnFriend = document.getElementById('btn-friend');
const receiverInput = document.getElementById('receiver-input');
const receiverGuide = document.getElementById('receiver-guide');

receiverInput.addEventListener('input', () => {
  receiverInput.value = formatPhoneInput(receiverInput.value);
});

btnMe.addEventListener('click', () => {
  setReceiverMode('me');
});

btnFriend.addEventListener('click', () => {
  setReceiverMode('friend');
  receiverInput.focus();
});

// M2는 나에게 선물하기가 기본 흐름이므로, 초기 화면에서는 받는 사람 입력칸을 숨깁니다.
setReceiverMode('me');

// 결제하기 버튼 — 주문 생성(Mock 결제 포함) API 호출
document.getElementById('checkout-btn').addEventListener('click', async () => {
  if (!selectedProduct) {
    alert('주문할 상품 정보를 확인할 수 없습니다.');
    return;
  }

  const isGiftToFriend = btnFriend.classList.contains('active');
  const receiverPhone = normalizePhone(receiverInput.value);

  if (isGiftToFriend && !isValidMobilePhone(receiverPhone)) {
    alert('받는 사람의 휴대폰 번호를 정확히 입력해주세요.');
    receiverInput.focus();
    return;
  }

  const orderData = {
    productId,
    // M2 명세 기준 요청 필드는 message가 아니라 giftMessage로 통일합니다.
    giftMessage: getGiftMessage(),
    ...(isGiftToFriend ? { receiverPhone } : {})
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
    alert(getOrderErrorMessage(error));
  }
});

async function checkLoginBeforeOrder() {
  try {
    await requestJson('/api/auth/me');
  } catch (error) {
    // 세션이 없으면 주문 생성을 시도하지 않고 로그인 화면으로 돌려보냅니다.
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
    // 주문 금액은 FE에서 임의로 만들지 않고 상품 상세 API의 가격을 그대로 표시합니다.
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

function setGiftMessageEditMode(isEditing) {
  isEditingGiftMessage = isEditing;
  giftMessageText.hidden = isEditing;
  giftMessageInput.hidden = !isEditing;
  giftMessageGuide.hidden = !isEditing;
  // 버튼 전체 textContent를 바꾸면 아이콘 SVG까지 지워지므로, 라벨 span만 바꿉니다.
  messageEditBtnLabel.textContent = isEditing ? '메시지 저장' : '메시지 편집';
}

function getGiftMessage() {
  return giftMessageText.textContent.trim().replace(/\s+/g, ' ');
}

function setReceiverMode(mode) {
  const isFriendMode = mode === 'friend';

  btnMe.classList.toggle('active', !isFriendMode);
  btnFriend.classList.toggle('active', isFriendMode);
  btnMe.setAttribute('aria-pressed', String(!isFriendMode));
  btnFriend.setAttribute('aria-pressed', String(isFriendMode));

  receiverInput.hidden = !isFriendMode;
  receiverInput.disabled = !isFriendMode;
  receiverGuide.hidden = !isFriendMode;

  if (!isGiftMessageCustomized) {
    giftMessageText.textContent = isFriendMode ? FRIEND_GIFT_MESSAGE : SELF_GIFT_MESSAGE;
  }

  if (!isFriendMode) {
    receiverInput.value = '';
  }
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function isValidMobilePhone(value) {
  return /^01[016789]\d{7,8}$/.test(value);
}

function formatPhoneInput(value) {
  const numbers = normalizePhone(value).slice(0, 11);

  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  if (numbers.length === 10) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  }

  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
}

function getOrderErrorMessage(error) {
  const errorMessages = {
    invalid_receiver_phone: '받는 사람의 휴대폰 번호를 정확히 입력해주세요.',
    cannot_gift_to_self_as_friend: '본인 번호는 친구에게 선물하기에서 사용할 수 없습니다.',
  };

  return errorMessages[error && error.message]
    || (error && error.message)
    || '주문 생성에 실패했습니다. 다시 시도해주세요.';
}

function showOrderProductError(message) {
  document.getElementById('order-product-name').textContent = message;
  document.getElementById('order-product-price').textContent = '-';
  document.getElementById('order-total-price').textContent = '-';
  document.getElementById('order-final-price').textContent = '-';
  document.getElementById('checkout-btn').textContent = '결제하기';
}
