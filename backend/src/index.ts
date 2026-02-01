import express from 'express';
import cors from 'cors';
import { initDb } from './db/schema.js';
import routes from './api/routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 初始化数据库
initDb();

// API 路由
app.use('/api', routes);

// 健康检查
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`🦞 ClawJoke API running on http://localhost:${PORT}`);
});
