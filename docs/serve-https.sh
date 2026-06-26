#!/bin/bash
# ============================================
# Grandpa's Ears — iPhone 测试启动脚本
# iPhone Testing Server Launcher
# ============================================
# 用法: bash serve-https.sh
# Usage: bash serve-https.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CERT_DIR="$SCRIPT_DIR/.certs"
CERT_FILE="$CERT_DIR/cert.pem"
KEY_FILE="$CERT_DIR/key.pem"
PORT=${1:-8443}

# 1. 生成自签名证书（如果不存在）
if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
  echo "📜 生成自签名证书 Generating self-signed certificate..."
  mkdir -p "$CERT_DIR"

  # 获取本机 IP 用于证书
  LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")

  openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -days 365 \
    -subj "/CN=$LOCAL_IP/O=GrandpasEars/OU=Dev" \
    -addext "subjectAltName=IP:$LOCAL_IP,DNS:localhost" \
    2>/dev/null

  echo "✅ 证书已生成 Certificate created"
  echo "   IP: $LOCAL_IP"
else
  echo "📜 使用已有证书 Using existing certificate"
fi

# 2. 显示本机 IP
echo ""
echo "========================================"
echo "  👂 Grandpa's Ears — 测试服务器"
echo "========================================"
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")
echo ""
echo "  📱 iPhone 上打开 Safari, 访问:"
echo ""
echo "     https://$LOCAL_IP:$PORT"
echo ""
echo "  ⚠️  首次打开会提示"不受信任的证书", 请:"
echo "     1. 点击 「显示详细信息」"
echo "     2. 点击 「访问此网站」"
echo "     3. 允许麦克风权限"
echo ""
echo "  💻 Mac 测试: https://localhost:$PORT"
echo ""
echo "  ⌨️  按 Ctrl+C 停止服务器"
echo "========================================"
echo ""

# 3. 启动 HTTPS 服务器
cd "$SCRIPT_DIR"
python3 -c "
import http.server
import ssl
import os

# 切换到 pwa-prototype 目录
os.chdir('$SCRIPT_DIR')

# 创建简单的 HTTPS 服务器
server_address = ('0.0.0.0', $PORT)
httpd = http.server.HTTPServer(server_address, http.server.SimpleHTTPRequestHandler)

# 配置 SSL
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain('$CERT_FILE', '$KEY_FILE')
httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)

print(f'Server running on https://0.0.0.0:$PORT')
httpd.serve_forever()
"
