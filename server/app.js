const express = require('express');
const path = require('path');
const { testConnection } = require('./db');
const productsRouter = require('./routes/products');

const app = express();

const PORT = process.env.PORT || 3000;

// JSON 요청 body 파싱
app.use(express.json());

// public 정적 파일 제공
app.use(express.static(path.join(__dirname, '../public')));

// API 라우터
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