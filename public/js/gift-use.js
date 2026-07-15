/*
 * 파일: public/js/gift-use.js
 * 목적: 선물 사용 화면(gift-use.html) 전용 동작 처리
 * 왜: giftbox에서 넘어온 giftId 기준으로 선물 정보를 보여주고 사용 완료 처리하기 위해
 * 주요: 선물 상세 조회, 뒤로가기, 사용 완료 버튼 클릭 시 상태 변경 API 호출
 */

const fallbackImageUrl = 'img/iksan-logo.svg';
const fallbackBarcodeImageUrl = '/images/barcodes/default-barcode.png';
// giftbox.html에서 gift-use.html?giftId=... 로 넘긴 값을 선물 상세 조회 기준으로 사용합니다.
const giftId = Number(new URLSearchParams(location.search).get('giftId'));
let selectedGift = null;

function getBarcodeImageElement() {
  // 이전 QR 화면이 브라우저에 캐시된 경우와 새 바코드 화면을 모두 지원합니다.
  return document.getElementById('gift-barcode-image')
    || document.getElementById('gift-qr-image');
}

loadGiftDetail();

// 뒤로가기 버튼
document.getElementById('back-btn').addEventListener('click', () => {
  history.back();
});

// 사용 완료 처리 버튼
document.getElementById('use-complete-btn').addEventListener('click', async () => {
  if (!selectedGift) {
    alert('패스 정보를 확인할 수 없습니다.');
    return;
  }

  if (selectedGift.status === 'used') {
    // 이미 사용된 선물은 FE에서 한 번 막고, BE에서도 다시 400으로 막아 중복 사용을 방지합니다.
    alert('이미 사용 완료된 패스입니다.');
    return;
  }

  const confirmed = confirm('이 패스를 사용 완료 처리하시겠습니까?');
  if (!confirmed) return;

  try {
    // 사용 처리는 상태를 바꾸는 요청이므로 GET이 아니라 PATCH /api/gifts/:id/use를 호출합니다.
    const response = await requestJson(`/api/gifts/${giftId}/use`, {
      method: 'PATCH',
    });

    selectedGift = response.data;
    renderGiftDetail(selectedGift);
    alert('패스 사용이 완료되었습니다.');
    location.href = 'giftbox.html';
  } catch (error) {
    console.error('사용 처리 중 오류:', error);
    alert(error.message || '사용 처리에 실패했습니다. 다시 시도해주세요.');
  }
});

async function loadGiftDetail() {
  if (!giftId) {
    showGiftError('패스 정보를 확인할 수 없습니다.');
    return;
  }

  try {
    const response = await requestJson(`/api/gifts/${giftId}`);
    // 상세 조회 결과를 전역 selectedGift에 보관해 사용 완료 버튼에서 같은 선물 상태를 확인합니다.
    selectedGift = response.data;
    renderGiftDetail(selectedGift);
  } catch (error) {
    console.error('선물 상세 조회 중 오류:', error);

    if (error.message === 'login_required') {
      location.href = 'login.html';
      return;
    }

    showGiftError(error.message || '패스 정보를 불러오지 못했습니다.');
  }
}

function renderGiftDetail(gift) {
  if (!gift) {
    showGiftError('패스 정보를 찾을 수 없습니다.');
    return;
  }

  const productName = gift.productName || '익산 환승패스';
  const productImage = document.getElementById('gift-product-image');
  const barcodeImage = getBarcodeImageElement();

  // 상품 이미지가 아직 없거나 경로가 깨져도 화면 확인이 가능하도록 공통 대체 이미지를 사용합니다.
  productImage.src = gift.thumbnailUrl || fallbackImageUrl;
  productImage.alt = productName;
  productImage.onerror = () => {
    productImage.onerror = null;
    productImage.src = fallbackImageUrl;
  };

  // API 이미지가 없거나 깨지면 제공받은 테스트용 바코드 이미지로 대체합니다.
  if (barcodeImage) {
    barcodeImage.src = gift.barcodeImageUrl || fallbackBarcodeImageUrl;
    barcodeImage.onerror = () => {
      barcodeImage.onerror = null;
      barcodeImage.src = fallbackBarcodeImageUrl;
    };
  }

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
  document.getElementById('gift-status-guide').textContent = '내 패스에서 다시 선택해주세요.';
  document.getElementById('gift-product-image').src = fallbackImageUrl;
  const barcodeImage = getBarcodeImageElement();
  if (barcodeImage) barcodeImage.src = fallbackBarcodeImageUrl;
  document.getElementById('use-complete-btn').disabled = true;
}

function getStatusGuide(status) {
  if (status === 'used') {
    return '이미 사용 완료된 패스입니다.';
  }

  return '버스 탑승 시 이 화면을 단말기에 제시하세요';
}
