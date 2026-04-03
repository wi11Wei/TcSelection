const cors = require('cors');

const corsMiddleware = cors({
  origin: '*', // 在生产环境中应该设置为特定的前端域名
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true
});

module.exports = corsMiddleware;