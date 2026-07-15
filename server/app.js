const express = require('express');
const session = require('express-session');
const path = require('path');
const { testConnection } = require('./db');
const productsRouter = require('./routes/products');
const authRouter = require('./routes/auth');
const ordersRouter = require('./routes/orders');
const giftsRouter = require('./routes/gifts');

const app = express();

const PORT = process.env.PORT || 3000;

// JSON 요청 body 파싱
// FE에서 fetch로 보낸 JSON body를 req.body로 읽기 위해 API 라우터보다 먼저 등록합니다.
app.use(express.json());

// 로그인 상태 유지를 위한 세션 설정
// auth 라우터보다 먼저 등록해야 /api/auth 내부에서 req.session을 사용할 수 있습니다.
// 브라우저에는 세션 id만 쿠키로 저장되고, 실제 로그인 사용자 정보는 서버 세션에 저장됩니다.
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
// index.html, login.html, css, js 파일을 Express가 직접 내려주기 위한 설정입니다.
app.use(express.static(path.join(__dirname, '../public')));

// API 라우터
// 기능별 라우터를 분리해 인증, 상품 조회, 주문, 선물함을 각각 관리합니다.
// 예: /api/orders + router.post('/') = POST /api/orders
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/gifts', giftsRouter);

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
// 위에서 등록한 라우터에 걸리지 않은 /api 요청은 여기서 공통 404로 응답합니다.
app.use('/api', (req, res) => {
  res.status(404).json({
    message: 'API not found',
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
