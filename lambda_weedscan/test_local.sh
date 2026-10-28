#!/usr/bin/env bash
# Test the ECS-compatible HTTP container image locally.
#
# Large image payloads can use significant memory after base64 decoding.
# This script downscales with `sips` (macOS) when needed.
#
# Usage (from repo root):
#   docker build -f lambda_weedscan/Dockerfile -t gardenwise-weedscan:test lambda_weedscan
#   ./lambda_weedscan/test_local.sh gardenwise-weedscan:test path/to/photo.jpg
#
set -euo pipefail

IMAGE="${1:-gardenwise-weedscan:test}"
ORIG_JPEG="${2:?Usage: $0 [docker-image] path/to/image.jpg}"
MAX_PAYLOAD=9000000

write_payload() {
  local src="$1"
  local out="$2"
  python3 - "$src" "$out" <<'PY'
import json, base64, sys
path, dest = sys.argv[1], sys.argv[2]
with open(path, "rb") as f:
    payload = {"image_base64": base64.b64encode(f.read()).decode("ascii")}
with open(dest, "w", encoding="utf-8") as f:
    json.dump(payload, f)
PY
}

NAME="weedscan-ecs-test-$$"
PAYLOAD=""
cleanup() {
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  [[ -n "${TMP_SMALL:-}" && -f "$TMP_SMALL" ]] && rm -f "$TMP_SMALL"
  [[ -n "$PAYLOAD" && -f "$PAYLOAD" ]] && rm -f "$PAYLOAD"
}
trap cleanup EXIT

docker run -d --name "$NAME" -p 9000:8080 "$IMAGE" >/dev/null
for _ in {1..60}; do
  if curl -fsS http://localhost:9000/health >/dev/null; then
    break
  fi
  sleep 2
done
if ! curl -fsS http://localhost:9000/health >/dev/null; then
  docker logs "$NAME" >&2
  echo "WeedScan container did not become healthy." >&2
  exit 1
fi

PAYLOAD="$(mktemp)"
JPEG="$ORIG_JPEG"
write_payload "$JPEG" "$PAYLOAD"
BYTES=$(wc -c < "$PAYLOAD" | tr -d ' ')
if [[ "$BYTES" -gt "$MAX_PAYLOAD" ]]; then
  if ! command -v sips >/dev/null 2>&1; then
    echo "Payload is ${BYTES} bytes (> ${MAX_PAYLOAD}). Install macOS sips or resize the image." >&2
    exit 1
  fi
  echo "Payload ${BYTES} bytes exceeds ${MAX_PAYLOAD}; downscaling for local test ..." >&2
  TMP_SMALL="$(mktemp).jpg"
  for z in 2560 1920 1600 1280 1024 800; do
    sips -Z "$z" "$ORIG_JPEG" --out "$TMP_SMALL" >/dev/null
    write_payload "$TMP_SMALL" "$PAYLOAD"
    BYTES=$(wc -c < "$PAYLOAD" | tr -d ' ')
    if [[ "$BYTES" -le "$MAX_PAYLOAD" ]]; then
      echo "Using max dimension ${z}px → payload ${BYTES} bytes" >&2
      break
    fi
  done
  if [[ "$BYTES" -gt "$MAX_PAYLOAD" ]]; then
    echo "Still too large (${BYTES} bytes). Try a smaller source image." >&2
    exit 1
  fi
fi

echo "POSTing $(wc -c < "$PAYLOAD") bytes to http://localhost:9000/testing/predict ..." >&2
curl -fsS -X POST "http://localhost:9000/testing/predict" \
  -H "Content-Type: application/json" \
  --data-binary "@$PAYLOAD" | python3 -m json.tool
