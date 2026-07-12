const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { sendSuccess, sendError } = require('../utils/response');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();
// 숫자가 높을수록 해시 계산이 오래 걸리지만 보안성이 좋아집니다. 실습용으로 10을 사용합니다.
const BCRYPT_SALT_ROUNDS = 10;

function isValidEmail(email) {
  // FE 검증은 우회될 수 있으므로, 가입 식별자인 이메일 형식은 BE에서 최종 검증합니다.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/**
 * DB 컬럼명(snake_case)을 API 응답 필드(camelCase)로 변환합니다.
 * 비밀번호는 응답에 절대 포함하지 않습니다.
 * 이 함수는 "응답으로 내보내도 되는 사용자 필드"를 제한하는 역할도 합니다.
 */
function toUserResponse(row) {
  return {
    userId: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    birthDate: row.birth_date,
    gender: row.gender,
    createdAt: row.created_at,
  };
}

/**
 * 로그인 성공 후 세션에는 최소 사용자 정보만 저장합니다.
 * 이후 requireLogin 미들웨어와 /me API가 이 값을 기준으로 로그인 여부를 판단합니다.
 */
function setSessionUser(req, user) {
  req.session.user = {
    userId: user.id,
    email: user.email,
    name: user.name,
  };
}

/**
 * 로그인 직전에 세션을 새로 발급해 기존 세션 재사용 위험을 줄입니다.
 */
function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

/**
 * POST /api/auth/signup
 * 회원가입
 */
router.post('/signup', async (req, res) => {
  try {
    const {
      email = '',
      password = '',
      name = '',
      phone = '',
      birthDate = null,
      gender = null,
    } = req.body || {};
    // 이메일은 로그인 식별자로 사용하므로 공백 제거 후 소문자로 통일합니다.
    const normalizedEmail = String(email).trim().toLowerCase();

    // FE에서도 입력 검사를 하지만, 최종 검증은 항상 BE에서 한 번 더 해야 합니다.
    if (!normalizedEmail || !password || !name || !phone) {
      return sendError(res, 400, 'missing_required_fields');
    }

    if (!isValidEmail(normalizedEmail)) {
      return sendError(res, 400, 'invalid_email_format');
    }

    // 같은 이메일로 중복 가입되는 것을 막습니다. deleted_at이 없는 사용자만 실제 가입자로 봅니다.
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return sendError(res, 409, 'already_registered_email');
    }

    // 비밀번호는 평문 저장 금지. bcrypt 해시만 DB에 저장합니다.
    const passwordHash = await bcrypt.hash(String(password), BCRYPT_SALT_ROUNDS);
    const [result] = await pool.query(
      `
      INSERT INTO users (email, password, name, phone, birth_date, gender)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        normalizedEmail,
        passwordHash,
        String(name).trim(),
        String(phone).trim(),
        birthDate || null,
        gender || null,
      ]
    );

    const [users] = await pool.query(
      `
      SELECT
        id,
        email,
        name,
        phone,
        birth_date,
        gender,
        created_at
      FROM users
      WHERE id = ?
      `,
      [result.insertId]
    );

    // INSERT 직후 다시 SELECT하는 이유는 DB에 실제 저장된 값을 기준으로 응답하기 위해서입니다.
    return sendSuccess(res, 201, 'signup_success', toUserResponse(users[0]));
  } catch (error) {
    console.error('POST /api/auth/signup error:', error);

    return sendError(res, 500, 'internal_server_error');
  }
});

/**
 * POST /api/auth/login
 * 로그인
 */
router.post('/login', async (req, res) => {
  try {
    const { email = '', password = '' } = req.body || {};
    // 회원가입과 동일하게 이메일을 정규화해 대소문자 차이로 로그인 실패하지 않게 합니다.
    const normalizedEmail = String(email).trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return sendError(res, 400, 'missing_required_fields');
    }

    const [users] = await pool.query(
      `
      SELECT
        id,
        email,
        password,
        name,
        phone,
        birth_date,
        gender,
        created_at
      FROM users
      WHERE email = ? AND deleted_at IS NULL
      `,
      [normalizedEmail]
    );

    if (users.length === 0) {
      // 계정 존재 여부가 드러나지 않도록 비밀번호 오류와 같은 메시지를 사용합니다.
      return sendError(res, 401, 'invalid_email_or_password');
    }

    const user = users[0];
    // bcrypt.compare는 입력한 평문 비밀번호와 DB의 해시 값을 비교합니다.
    const passwordMatched = await bcrypt.compare(String(password), user.password);

    if (!passwordMatched) {
      // 계정 존재 여부가 드러나지 않도록 이메일 오류와 같은 메시지를 사용합니다.
      return sendError(res, 401, 'invalid_email_or_password');
    }

    // 로그인 성공 시 세션 id를 새로 발급한 뒤 사용자 정보를 세션에 저장합니다.
    await regenerateSession(req);
    setSessionUser(req, user);

    return sendSuccess(res, 200, 'login_success', toUserResponse(user));
  } catch (error) {
    console.error('POST /api/auth/login error:', error);

    return sendError(res, 500, 'internal_server_error');
  }
});

/**
 * POST /api/auth/logout
 * 로그아웃
 */
router.post('/logout', async (req, res) => {
  try {
    if (!req.session) {
      return sendSuccess(res, 200, 'logout_success', null);
    }

    // 서버에 저장된 세션을 제거하면 이후 같은 브라우저에서도 로그인 상태가 풀립니다.
    await destroySession(req);

    return sendSuccess(res, 200, 'logout_success', null);
  } catch (error) {
    console.error('POST /api/auth/logout error:', error);

    return sendError(res, 500, 'internal_server_error');
  }
});

/**
 * GET /api/auth/me
 * 내 로그인 정보 확인
 */
router.get('/me', requireLogin, async (req, res) => {
  try {
    // 세션에는 최소 정보만 있으므로, 화면/API 응답에 필요한 최신 사용자 정보는 DB에서 다시 조회합니다.
    const [users] = await pool.query(
      `
      SELECT
        id,
        email,
        name,
        phone,
        birth_date,
        gender,
        created_at
      FROM users
      WHERE id = ? AND deleted_at IS NULL
      `,
      [req.session.user.userId]
    );

    if (users.length === 0) {
      return sendError(res, 401, 'login_required');
    }

    return sendSuccess(res, 200, 'get_me_success', toUserResponse(users[0]));
  } catch (error) {
    console.error('GET /api/auth/me error:', error);

    return sendError(res, 500, 'internal_server_error');
  }
});

module.exports = router;
