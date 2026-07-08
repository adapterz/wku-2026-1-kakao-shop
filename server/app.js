const express = require('express');
const session = require('express-session');
const path = require('path');
const { testConnection } = require('./db');
const productsRouter = require('./routes/products');
const authRouter = require('./routes/auth');

const app = express();

const PORT = process.env.PORT || 3000;

// JSON 요청 body 파싱
app.use(express.json());

// 로그인 상태 유지를 위한 세션 설정
// auth 라우터보다 먼저 등록해야 /api/auth 내부에서 req.session을 사용할 수 있습니다.
app.use(
  session({
    name: 'iksan.sid',
    secret: process.env.SESSION_SECRET || 'iksan_transfer_pass_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 2,
    },
  })
);

// public 정적 파일 제공
app.use(express.static(path.join(__dirname, '../public')));

// API 라우터
// 인증 라우터를 먼저 연결하고, 상품 조회 라우터를 별도 경로로 분리해 관리합니다.
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);

// 서버 상태 확인용 API
app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await testConnection();

    res.json({
      status: 'ok',
      message: 'server is running',
      db: dbResult,
    });
  } catch (error) {
    console.error('DB connection error:', error);

    res.status(500).json({
      status: 'error',
      message: 'database connection failed',
    });
  }
});

// 등록되지 않은 API 요청 처리
app.use('/api', (req, res) => {
  res.status(404).json({
    message: 'API not found',
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
