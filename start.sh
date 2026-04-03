#!/bin/bash

echo "智能刀具柜辅助选型系统启动脚本"
echo "=================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: Node.js 未安装，请先安装 Node.js 14.0 或更高版本"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "错误: npm 未安装，请先安装 npm 6.0 或更高版本"
    exit 1
fi

echo "正在启动后端服务..."
cd backend

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "正在安装后端依赖..."
    npm install
fi

# 启动后端服务
npm start &
BACKEND_PID=$!

echo "后端服务已启动，PID: $BACKEND_PID"
echo "API文档地址: http://localhost:3000/api-docs"

echo ""
echo "前端可通过直接打开 frontend/index.html 文件访问"
echo "或使用任何Web服务器托管frontend目录"

echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
trap "echo '正在停止服务...'; kill $BACKEND_PID; echo '服务已停止';" SIGINT SIGTERM

# 保持脚本运行
wait $BACKEND_PID