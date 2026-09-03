#!/usr/bin/env bash
# Start local llama.cpp server with GPU acceleration for LockedIn
# Binds to 0.0.0.0 with CORS enabled for network access

MODEL_PATH="/home/yaruno/models/Llama-3.2-3B-Instruct-Q4_K_M.gguf"
PORT=8080
HOST="0.0.0.0"
CTX_SIZE=4096
GPU_LAYERS=99 # Fully offload 3B model to RTX 4060 GPU

if ss -tulpn | grep -q ":$PORT "; then
  echo "✅ Local AI server is already running on port $PORT."
  exit 0
fi

if [ ! -f "$MODEL_PATH" ]; then
  echo "❌ Error: Model file not found at $MODEL_PATH"
  echo "Please verify the model download has completed."
  exit 1
fi

echo "=========================================================="
echo "⚡ Starting LockedIn Local AI (llama.cpp) on RTX 4060 GPU..."
echo "📂 Model:   $MODEL_PATH"
echo "🌐 URL:     http://$HOST:$PORT (Accepting connections from Phone)"
echo "🧠 Context: $CTX_SIZE tokens"
echo "🎮 GPU:     $GPU_LAYERS layers offloaded"
echo "=========================================================="

exec llama-server \
  -m "$MODEL_PATH" \
  --host "$HOST" \
  --port "$PORT" \
  -c "$CTX_SIZE" \
  -ngl "$GPU_LAYERS" \
  --threads 8
