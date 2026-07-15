document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sent-gifts-back-btn')?.addEventListener('click', () => {
    location.href = 'profile.html';
  });

  loadSentGifts();
});

async function loadSentGifts() {
  const list = document.getElementById('sent-gifts-list');

  try {
    const response = await fetchSentOrders();
    const orders = Array.isArray(response.data) ? response.data : [];
    renderSentGifts(list, orders);
  } catch (error) {
    console.error('Failed to load sent gifts:', error);

    if (error.message === 'login_required') {
      location.href = 'login.html';
      return;
    }

    list.innerHTML = '<p class="error-message">보낸 선물내역을 불러오지 못했습니다.</p>';
  }
}

function renderSentGifts(container, orders) {
  if (!orders.length) {
    container.innerHTML = '<p class="empty-message">아직 친구에게 보낸 선물이 없습니다.</p>';
    return;
  }

  container.innerHTML = orders.map((order) => {
    const product = order.product || {};
    const receiver = order.receiver || {};
    const gift = order.gift || {};
    const isUsed = gift.status === 'used';
    const statusText = isUsed ? '사용 완료' : '사용 전';
    const fallbackImage = 'img/default-profile.png';

    return `
      <article class="sent-gift-card">
        <img src="${escapeSentGiftText(product.thumbnailUrl || fallbackImage)}" alt="" onerror="this.src='${fallbackImage}'">
        <div class="sent-gift-info">
          <strong>${escapeSentGiftText(product.name || '익산 환승패스')}</strong>
          <span>to. ${escapeSentGiftText(receiver.name || '받는 분')} · ${escapeSentGiftText(formatSentPhone(receiver.phone))}</span>
          <small>${escapeSentGiftText(formatSentGiftDate(order.createdAt))}</small>
        </div>
        <span class="sent-gift-status${isUsed ? ' is-used' : ''}">${statusText}</span>
      </article>
    `;
  }).join('');
}

function formatSentPhone(value) {
  const phone = String(value || '').replace(/\D/g, '');
  if (phone.length < 10) return '연락처 없음';
  return `${phone.slice(0, 3)}-****-${phone.slice(-4)}`;
}

function formatSentGiftDate(value) {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return '날짜 정보 없음';
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function escapeSentGiftText(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
