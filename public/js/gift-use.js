/*
 * 파일: public/js/gift-use.js
 * 목적: 선물 사용 화면(gift-use.html) 전용 동작 처리
 * 왜: giftbox에서 넘어온 giftId 기준으로 선물 정보를 보여주고 사용 완료 처리하기 위해
 * 주요: 선물 상세 조회, 뒤로가기, 사용 완료 버튼 클릭 시 상태 변경 API 호출
 */

const fallbackImageUrl = 'img/iksan-logo.svg';
const giftId = Number(new URLSearchParams(location.search).get('giftId'));
let selectedGift = null;

loadGiftDetail();

// 뒤로가기 버튼
document.getElementById('back-btn').addEventListener('click', () => {
  history.back();
});

// 사용 완료 처리 버튼
document.getElementById('use-complete-btn').addEventListener('click', async () => {
  if (!selectedGift) {
    alert('선물 정보를 확인할 수 없습니다.');
    return;
  }

  if (selectedGift.status === 'used') {
    alert('이미 사용 완료된 선물입니다.');
    return;
  }

  const confirmed = confirm('이 패스를 사용 완료 처리하시겠습니까?');
  if (!confirmed) return;

  try {
    const response = await requestJson(`/api/gifts/${giftId}/use`, {
      method: 'PATCH',
    });

    selectedGift = response.data;
    renderGiftDetail(selectedGift);
    alert('사용 완료 처리되었습니다.');
    location.href = 'giftbox.html';
  } catch (error) {
    console.error('사용 처리 중 오류:', error);
    alert(error.message || '사용 처리에 실패했습니다. 다시 시도해주세요.');
  }
});

async function loadGiftDetail() {
  if (!giftId) {
    showGiftError('선물 정보를 확인할 수 없습니다.');
    return;
  }

  try {
    const response = await requestJson(`/api/gifts/${giftId}`);
    selectedGift = response.data;
    renderGiftDetail(selectedGift);
  } catch (error) {
    console.error('선물 상세 조회 중 오류:', error);

    if (error.message === 'login_required') {
      location.href = 'login.html';
      return;
    }

    showGiftError(error.message || '선물 정보를 불러오지 못했습니다.');
  }
}

function renderGiftDetail(gift) {
  if (!gift) {
    showGiftError('선물 정보를 찾을 수 없습니다.');
    return;
  }

  const productName = gift.productName || '익산 환승패스';
  const productImage = document.getElementById('gift-product-image');

  productImage.src = gift.thumbnailUrl || fallbackImageUrl;
  productImage.alt = productName;
  productImage.onerror = () => {
    productImage.onerror = null;
    productImage.src = fallbackImageUrl;
  };

  document.getElementById('gift-brand').textContent = gift.brandName || '익산 교통';
  document.getElementById('gift-product-name').textContent = productName;
  document.getElementById('gift-barcode').textContent = gift.barcode || '-';
  document.getElementById('gift-status-guide').textContent = getStatusGuide(gift.status);

  const useButton = document.getElementById('use-complete-btn');
  useButton.disabled = gift.status === 'used';
  useButton.textContent = gift.status === 'used' ? '사용 완료된 패스' : '사용 완료 처리';
}

function showGiftError(message) {
  document.getElementById('gift-product-name').textContent = message;
  document.getElementById('gift-brand').textContent = '익산 환승패스';
  document.getElementById('gift-barcode').textContent = '-';
  document.getElementById('gift-status-guide').textContent = '선물함에서 다시 선택해주세요.';
  document.getElementById('gift-product-image').src = fallbackImageUrl;
  document.getElementById('use-complete-btn').disabled = true;
}

function getStatusGuide(status) {
  if (status === 'used') {
    return '이미 사용 완료된 패스입니다.';
  }

  return '버스 탑승 시 이 화면을 단말기에 제시하세요';
}
