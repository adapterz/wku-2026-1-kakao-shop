const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * DB 연결 확인용 함수
 * M1 초기 세팅에서 SELECT 1 테스트할 때 사용
 */
async function testConnection() {
  const [rows] = await pool.query('SELECT 1 AS result');
  return rows[0];
}

module.exports = {
  pool,
  testConnection,
};