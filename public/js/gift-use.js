/*
 * 파일: public/js/gift-use.js
 * 목적: 선물 사용 화면(gift-use.html) 전용 동작 처리
 * 왜: 뒤로가기 및 패스 사용 완료 처리를 위해
 * 주요: 뒤로가기, 사용 완료 버튼 클릭 시 상태 변경 API 호출
 */

// 뒤로가기 버튼
document.getElementById('back-btn').addEventListener('click', () => {
  history.back();
});

// 사용 완료 처리 버튼
document.getElementById('use-complete-btn').addEventListener('click', async () => {
  const giftId = 1; // TODO: giftbox.html에서 넘어온 실제 선물 ID로 교체 필요

  const confirmed = confirm('이 패스를 사용 완료 처리하시겠습니까?');
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/gifts/${giftId}/use`, {
      method: 'PATCH'
    });

    if (res.ok) {
      alert('사용 완료 처리되었습니다.');
      location.href = 'giftbox.html';
    } else {
      alert('사용 처리에 실패했습니다. 다시 시도해주세요.');
    }
  } catch (error) {
    console.error('사용 처리 중 오류:', error);
    alert('네트워크 오류가 발생했습니다.');
  }
});