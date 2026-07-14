/*
 * 파일: public/js/passes.js
 * 목적: 전체 패스 상품 화면(passes.html) 전용 동작 처리
 * 왜: 홈 추천 목록과 별도로 전체 상품을 조회하고 상세 화면으로 연결하기 위해
 * 주요: 전체 상품 조회, 상품 카드 렌더링, 가로 스와이프 스크롤 연동, 하단 탭바 이동
 */

document.addEventListener('DOMContentLoaded', () => {
  bindPassCategoryFilters();
  bindSliderScrollEvent();
  bindMouseDragEvents();
  loadAllPasses();
  bindPassesNavigation();
});

const CATEGORY_MAP = ['', 'basic', 'transfer', 'special'];
let selectedPassCategory = '';
let categoryCounts = {
  '': 0,
  'basic': 0,
  'transfer': 0,
  'special': 0
};

// 스크롤 제어를 위한 변수들
let isScrollingByClick = false;
let scrollTimeout = null;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

async function loadAllPasses() {
  const passesCount = document.getElementById('passes-count');
  const slider = document.getElementById('passes-slider');
  
  const containers = {
    '': document.getElementById('passes-list-all'),
    'basic': document.getElementById('passes-list-basic'),
    'transfer': document.getElementById('passes-list-transfer'),
    'special': document.getElementById('passes-list-special')
  };

  try {
    // 각 컨테이너 로딩 메시지 표시
    Object.values(containers).forEach(container => {
      if (container) {
        container.innerHTML = '<p class="loading-message">패스를 불러오는 중입니다.</p>';
      }
    });

    const response = await fetchProducts('');
    const products = Array.isArray(response.data) ? response.data : [];

    // 카테고리별 데이터 필터링 및 카운트 설정
    categoryCounts[''] = products.length;
    categoryCounts['basic'] = products.filter(p => p.category === 'basic').length;
    categoryCounts['transfer'] = products.filter(p => p.category === 'transfer').length;
    categoryCounts['special'] = products.filter(p => p.category === 'special').length;

    // 초기 활성화된 탭의 카운트 설정
    updatePassesCount();

    // 각 컨테이너 렌더링
    Object.entries(containers).forEach(([category, container]) => {
      if (!container) return;

      const filteredProducts = category ? products.filter(p => p.category === category) : products;

      if (filteredProducts.length === 0) {
        container.innerHTML = '<p class="empty-message">현재 판매 중인 환승패스가 없습니다.</p>';
        return;
      }

      container.innerHTML = filteredProducts.map(createProductCard).join('');
      bindPassCardEvents(container);
    });

    // API 로드가 완료되어 각 컨테이너 렌더링 끝

  } catch (error) {
    console.error('Failed to load all passes:', error);
    if (passesCount) {
      passesCount.textContent = '';
    }

    Object.values(containers).forEach(container => {
      if (container) {
        container.innerHTML = `
          <p class="error-message">
            패스 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
          </p>
        `;
      }
    });
  }
}

function updatePassesCount() {
  const passesCount = document.getElementById('passes-count');
  if (passesCount) {
    passesCount.textContent = `총 ${categoryCounts[selectedPassCategory] || 0}개`;
  }
}

function setActiveTabByIndex(index) {
  const category = CATEGORY_MAP[index];
  if (category === undefined) return;

  selectedPassCategory = category;

  // 탭 버튼 active 클래스 업데이트
  const filterButtons = document.querySelectorAll('.passes-filter-btn');
  filterButtons.forEach((button, btnIndex) => {
    const isActive = btnIndex === index;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  // 헤더 총 개수 업데이트
  updatePassesCount();
}

function bindPassCategoryFilters() {
  const filterButtons = document.querySelectorAll('.passes-filter-btn');
  const slider = document.getElementById('passes-slider');

  filterButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      const category = CATEGORY_MAP[index];

      if (category === selectedPassCategory || !slider) {
        return;
      }

      isScrollingByClick = true;
      setActiveTabByIndex(index);

      // 스냅과 smooth scroll 충돌 방지: 잠시 스냅 끄기
      slider.style.scrollSnapType = 'none';
      slider.style.scrollBehavior = 'smooth';

      slider.scrollTo({
        left: index * slider.clientWidth
      });

      // 스크롤 동작 후 클릭 플래그 해제를 위한 안전 조치
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(() => {
        isScrollingByClick = false;
        // 스크롤 완료 후 스냅 기능 복구
        slider.style.scrollSnapType = 'x mandatory';
      }, 500); // smooth 스크롤 완료를 대략 500ms로 가정
    });
  });
}

function bindMouseDragEvents() {
  const slider = document.getElementById('passes-slider');
  if (!slider) {
    console.error('[Drag] passes-slider element not found!');
    return;
  }

  let isDown = false;
  let startX;
  let scrollLeft;

  slider.addEventListener('mousedown', (e) => {
    isDown = true;
    slider.classList.add('active-drag');
    
    // JS로 명시적 스냅 및 스무스 스크롤 비활성화
    slider.style.scrollSnapType = 'none';
    slider.style.scrollBehavior = 'auto';

    // 절대 좌표 pageX 만을 기록
    startX = e.pageX;
    scrollLeft = slider.scrollLeft;

    dragStartX = e.pageX;
    dragStartY = e.pageY;
    isDragging = false;

    console.log('[Drag] Mousedown - startX:', startX, 'scrollLeft:', scrollLeft);
  });

  function endDrag() {
    if (!isDown) return;
    isDown = false;
    slider.classList.remove('active-drag');
    
    // 스냅 및 스무스 스크롤 복구
    slider.style.scrollSnapType = 'x mandatory';
    slider.style.scrollBehavior = 'smooth';

    console.log('[Drag] Mouseup/Leave - drag ended. Current scrollLeft:', slider.scrollLeft);

    setTimeout(() => {
      const index = Math.round(slider.scrollLeft / slider.clientWidth);
      if (CATEGORY_MAP[index] !== selectedPassCategory) {
        setActiveTabByIndex(index);
      }
      setTimeout(() => {
        isDragging = false;
      }, 50);
    }, 50);
  }

  slider.addEventListener('mouseleave', endDrag);
  slider.addEventListener('mouseup', endDrag);

  slider.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    
    const moveX = Math.abs(e.pageX - dragStartX);
    const moveY = Math.abs(e.pageY - dragStartY);
    if (moveX > 5 || moveY > 5) {
      isDragging = true;
    }

    e.preventDefault();
    
    // 순수 마우스 이동 델타(변화량) 계산
    const walk = (e.pageX - startX) * 1.5; 
    slider.scrollLeft = scrollLeft - walk;

    console.log('[Drag] Mousemove - delta:', (e.pageX - startX), 'walk:', walk, 'newScrollLeft:', slider.scrollLeft);
  });
}

function bindSliderScrollEvent() {
  const slider = document.getElementById('passes-slider');
  if (!slider) return;

  slider.addEventListener('scroll', () => {
    // 탭 버튼 클릭으로 인한 스크롤링 시 이벤트 중복 처리 방지
    if (isScrollingByClick) {
      // 사용자가 직접 화면을 다시 스와이프할 수 있으므로 타이머만 갱신
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrollingByClick = false;
      }, 100);
      return;
    }

    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    // 디바운스를 활용해 스크롤이 끝나는 시점에 탭 동기화
    scrollTimeout = setTimeout(() => {
      const index = Math.round(slider.scrollLeft / slider.clientWidth);
      if (CATEGORY_MAP[index] !== selectedPassCategory) {
        setActiveTabByIndex(index);
      }
    }, 50);
  });
}

function bindPassCardEvents(container) {
  container.querySelectorAll('.pass-ticket').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (isDragging) {
        e.preventDefault();
        return;
      }
      location.href = `product.html?id=${card.dataset.productId}`;
    });
  });
}

function bindPassesNavigation() {
  document.getElementById('passes-back-btn')?.addEventListener('click', () => {
    location.href = 'index.html';
  });

  document.getElementById('passes-home-btn')?.addEventListener('click', () => {
    location.href = 'index.html';
  });

  document.getElementById('passes-giftbox-btn')?.addEventListener('click', () => {
    location.href = 'giftbox.html';
  });
}
