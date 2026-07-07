const express = require('express');
const path = require('path');
const { testConnection } = require('./db');
const productsRouter = require('./routes/products');

const app = express();

const PORT = process.env.PORT || 3000;

// JSON ��û body �Ľ�
app.use(express.json());

// public ���� ���� ���� ����
app.use(express.static(path.join(__dirname, '../public')));

// API �����
app.use('/api/products', productsRouter);

// ���� ���� Ȯ�ο� API
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

// ���� API ��� ó��
app.use('/api', (req, res) => {
  res.status(404).json({
    message: 'API not found',
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});