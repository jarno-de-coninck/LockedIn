#!/usr/bin/env bash
# LockedIn All-in-One Runner
# - Starts Local AI (llama-server on RTX 4060 GPU, accessible on port 8080)
# - Starts Vite Dev Server (port 5173)
# - Automatically opens firewall ports 5173 and 8080 on launch
# - Automatically closes firewall ports on exit (Ctrl+C)

cleanup() {
  echo ""
  echo "=========================================================="
  echo "🛑 Shutting down LockedIn and Local AI..."
  echo "=========================================================="
  
  # 1. Kill background servers
  pkill -P $$ 2>/dev/null
  pkill -f "llama-server" 2>/dev/null
  pkill -f "vite" 2>/dev/null

  # 2. Close firewall ports 5173 and 8080
  echo "🔒 Closing firewall ports 5173 and 8080..."
  sudo iptables -D INPUT -p tcp --dport 5173 -j ACCEPT 2>/dev/null || true
  sudo iptables -D INPUT -p tcp --dport 8080 -j ACCEPT 2>/dev/null || true
  
  echo "✅ Servers stopped and firewall ports closed."
  exit 0
}

# Trap Ctrl+C (SIGINT), SIGTERM, and EXIT
trap cleanup SIGINT SIGTERM EXIT

echo "=========================================================="
echo "🔓 1. Opening firewall ports 5173 & 8080 for this session..."
echo "=========================================================="
sudo iptables -I INPUT -p tcp --dport 5173 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT 2>/dev/null || true

echo ""
echo "=========================================================="
echo "⚡ 2. Starting Local AI (Llama 3.2 3B on RTX 4060 GPU)..."
echo "=========================================================="
bash start-local-ai.sh &

# Give llama-server 2 seconds to initialize
sleep 2

echo ""
echo "=========================================================="
echo "🚀 3. Starting LockedIn Web App (npm run dev)..."
echo "=========================================================="
npm run dev
