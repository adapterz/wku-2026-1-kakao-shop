const PUBLIC_HTML_PATHS = new Set([
  '/',
  '/index.html',
  '/login.html',
  '/signup.html',
  '/passes.html',
  '/product.html',
  '/search.html',
]);

/**
 * 보호 화면의 HTML을 보내기 전에 로그인 여부를 확인합니다.
 * 공개 목록에 없는 신규 HTML은 기본적으로 로그인 사용자에게만 제공합니다.
 */
function requireLoginForHtmlPage(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  const isHtmlPageRequest = req.path === '/' || req.path.endsWith('.html');

  if (!isHtmlPageRequest || PUBLIC_HTML_PATHS.has(req.path)) {
    return next();
  }

  if (!req.session || !req.session.user) {
    return res.redirect(302, '/login.html');
  }

  return next();
}

module.exports = {
  requireLoginForHtmlPage,
};
