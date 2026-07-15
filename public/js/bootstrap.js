/*
 * 화면이 처음 그려지기 전에 전역 UI 상태를 적용합니다.
 * 이 파일은 모든 HTML의 <head>에서 CSS보다 먼저 동기 실행해야 합니다.
 */
(function initializeTheme() {
  try {
    const isDarkMode = localStorage.getItem('profile_dark_mode') === 'true';
    document.documentElement.classList.toggle('dark-theme', isDarkMode);
  } catch (error) {
    // 저장소 접근이 제한된 환경에서는 기본(라이트) 테마를 사용합니다.
    document.documentElement.classList.remove('dark-theme');
  }
})();
