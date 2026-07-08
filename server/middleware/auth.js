const { sendError } = require('../utils/response');

/**
 * 로그인 세션이 필요한 API에서 사용하는 공통 검문소입니다.
 */
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return sendError(res, 401, 'login_required');
  }

  return next();
}

module.exports = {
  requireLogin,
};
