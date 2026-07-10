const { sendError } = require('../utils/response');

/**
 * 로그인 세션이 필요한 API에서 사용하는 공통 검문소입니다.
 * 로그인 여부는 req.session.user 값이 있는지를 기준으로 판단합니다.
 */
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return sendError(res, 401, 'login_required');
  }

  // 로그인된 요청이면 다음 미들웨어 또는 실제 라우터 처리 함수로 넘깁니다.
  return next();
}

module.exports = {
  requireLogin,
};
