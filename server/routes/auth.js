const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { sendSuccess, sendError } = require('../utils/response');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();
const BCRYPT_SALT_ROUNDS = 10;

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

function setSessionUser(req, user) {
  req.session.user = {
    userId: user.id,
    email: user.email,
    name: user.name,
  };
}

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
    const normalizedEmail = String(email).trim().toLowerCase();

    if (!normalizedEmail || !password || !name || !phone) {
      return sendError(res, 400, 'missing_required_fields');
    }

    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return sendError(res, 409, 'already_registered_email');
    }

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
      return sendError(res, 401, 'invalid_email_or_password');
    }

    const user = users[0];
    const passwordMatched = await bcrypt.compare(String(password), user.password);

    if (!passwordMatched) {
      return sendError(res, 401, 'invalid_email_or_password');
    }

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
