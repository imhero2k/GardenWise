#!/usr/bin/env bash
# Test the Lambda container image locally using the Runtime Interface Emulator (in the base image).
#
# AWS Lambda synchronous invoke accepts at most 6 MB request payload. Base64 inflates
# size by ~4/3, so large camera JPEGs often exceed the limit and the runtime returns:
#   Runtime.UnmarshalError: Unterminated string...
# This script downscales with `sips` (macOS) when needed.
#
# Usage (from repo root):
#   docker build -f lambda_weedscan/Dockerfile -t weedscan-lambda:test lambda_weedscan
#   ./lambda_weedscan/test_local.sh weedscan-lambda:test path/to/photo.jpg
#
set -euo pipefail

IMAGE="${1:-weedscan-lambda:test}"
ORIG_JPEG="${2:?Usage: $0 [docker-image] path/to/image.jpg}"

# Stay under Lambda's 6,291,456-byte invoke limit (leave JSON overhead headroom).
MAX_PAYLOAD=5500000

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

NAME="weedscan-lambda-test-$$"
cleanup() {
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  [[ -n "${TMP_SMALL:-}" && -f "$TMP_SMALL" ]] && rm -f "$TMP_SMALL"
}
trap cleanup EXIT

docker run -d --name "$NAME" -p 9000:8080 "$IMAGE" >/dev/null
sleep 3

PAYLOAD="$(mktemp)"
JPEG="$ORIG_JPEG"

write_payload "$JPEG" "$PAYLOAD"
BYTES=$(wc -c < "$PAYLOAD" | tr -d ' ')
if [[ "$BYTES" -gt "$MAX_PAYLOAD" ]]; then
  if ! command -v sips >/dev/null 2>&1; then
    echo "Payload is ${BYTES} bytes (> ${MAX_PAYLOAD}). Install macOS sips or resize the image so JSON stays under ~6 MB." >&2
    exit 1
  fi
  echo "Payload ${BYTES} bytes exceeds Lambda 6 MB invoke limit; downscaling for local test ..." >&2
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

echo "POSTing $(wc -c < "$PAYLOAD") bytes to http://localhost:9000/ ..." >&2
curl -sS -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -H "Content-Type: application/json" \
  --data-binary "@$PAYLOAD" | python3 -m json.tool

rm -f "$PAYLOAD"
