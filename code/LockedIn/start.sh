#!/usr/bin/env bash
# LockedIn All-in-One Autonomous Runner
# - Starts Local AI (llama-server on GPU, accessible on port 8080)
# - Configures Tailscale Serve (HTTPS on your .ts.net domain)
# - Starts Vite Dev Server (port 5173)
# - Automatically cleans up all servers on exit (Ctrl+C)

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

cleanup() {
  echo ""
  echo "=========================================================="
  echo "🛑 Shutting down LockedIn and Local AI..."
  echo "=========================================================="
  
  # 1. Kill background servers
  pkill -P $$ 2>/dev/null || true
  pkill -f "llama-server" 2>/dev/null || true
  pkill -f "vite" 2>/dev/null || true

  # 2. Reset Tailscale serve
  tailscale serve reset 2>/dev/null || sudo -n tailscale serve reset 2>/dev/null || true

  # 3. Close firewall ports if opened
  sudo -n iptables -D INPUT -p tcp --dport 5173 -j ACCEPT 2>/dev/null || true
  sudo -n iptables -D INPUT -p tcp --dport 8080 -j ACCEPT 2>/dev/null || true
  
  echo "✅ All servers stopped and ports cleaned up."
  exit 0
}

# Trap Ctrl+C (SIGINT), SIGTERM, and EXIT
trap cleanup SIGINT SIGTERM EXIT

echo "=========================================================="
echo "🔒 1. Setting up Network & Tailscale Serve..."
echo "=========================================================="

TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "100.115.34.31")
TS_DOMAIN=$(tailscale cert 2>&1 | grep -o '[a-zA-Z0-9.-]*\.ts\.net' | head -n 1 || echo "")

# Enable firewall ports if sudo is available without password
sudo -n iptables -I INPUT -p tcp --dport 5173 -j ACCEPT 2>/dev/null || true
sudo -n iptables -I INPUT -p tcp --dport 8080 -j ACCEPT 2>/dev/null || true

# Try setting up Tailscale Serve for HTTPS
SERVE_ACTIVE=false
if tailscale serve --bg 5173 2>/dev/null; then
  SERVE_ACTIVE=true
elif sudo -n tailscale serve --bg 5173 2>/dev/null; then
  SERVE_ACTIVE=true
elif [ -t 0 ]; then
  echo "🔑 Enabling Tailscale HTTPS Serve (requires sudo password once)..."
  if sudo tailscale serve --bg 5173 2>/dev/null; then
    sudo tailscale set --operator="$USER" 2>/dev/null || true
    SERVE_ACTIVE=true
  fi
fi

echo ""
echo "=========================================================="
echo "⚡ 2. Starting Local AI (Llama 3.2 3B on GPU)..."
echo "=========================================================="
bash start-local-ai.sh &

# Wait for llama-server to be ready
echo "⏳ Waiting for Coach Lock AI to initialize..."
for i in {1..30}; do
  if curl -s http://127.0.0.1:8080/health 2>/dev/null | grep -q "ok"; then
    echo "✅ Coach Lock AI is online and accelerated by GPU!"
    break
  fi
  sleep 1
done

echo ""
echo "=========================================================="
echo "🚀 3. LOCKEDIN IS READY TO USE!"
echo "=========================================================="
if [ "$SERVE_ACTIVE" = true ] && [ -n "$TS_DOMAIN" ]; then
  echo "📱 Phone (HTTPS PWA - Tap to Install): https://${TS_DOMAIN}"
fi
echo "📱 Phone (Direct Tailscale IP):        http://${TAILSCALE_IP}:5173"
echo "💻 Desktop Browser:                    http://localhost:5173"
echo "🤖 Local AI Backend:                   http://localhost:8080"
echo "=========================================================="
echo "Press Ctrl+C anytime to stop all servers."
echo "=========================================================="
echo ""

npm run dev
