"""HTTP server for running WeedScan as an ECS container."""

from __future__ import annotations

import base64
import binascii
import json
import logging
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import urlsplit

from PIL import UnidentifiedImageError

from .inference import ensure_model_loaded, predict_image_bytes

logger = logging.getLogger("weedscan")
MAX_REQUEST_BYTES = 10 * 1024 * 1024


class WeedScanHandler(BaseHTTPRequestHandler):
    server_version = "WeedScanHTTP/1.0"

    def do_GET(self) -> None:
        if urlsplit(self.path).path != "/health":
            self._send_json(404, {"error": "Not found"})
            return

        try:
            ensure_model_loaded()
        except Exception:
            logger.exception("Model readiness check failed")
            self._send_json(503, {"error": "Model is not ready"})
            return
        self._send_json(200, {"status": "ok"})

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_POST(self) -> None:
        if urlsplit(self.path).path not in {"/predict", "/testing/predict"}:
            self._send_json(404, {"error": "Not found"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._send_json(400, {"error": "Invalid Content-Length"})
            return
        if content_length <= 0:
            self._send_json(400, {"error": "Request body is required"})
            return
        if content_length > MAX_REQUEST_BYTES:
            self._send_json(413, {"error": "Request body is too large"})
            return

        try:
            payload = json.loads(self.rfile.read(content_length))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._send_json(400, {"error": "Request body must be valid JSON"})
            return
        if not isinstance(payload, dict):
            self._send_json(400, {"error": "Request body must be a JSON object"})
            return

        image_base64 = payload.get("image_base64")
        if not isinstance(image_base64, str) or not image_base64:
            self._send_json(400, {"error": "Missing image_base64 in request body"})
            return
        try:
            image_bytes = base64.b64decode(image_base64, validate=True)
        except (binascii.Error, ValueError):
            self._send_json(400, {"error": "image_base64 must be valid base64"})
            return

        try:
            result: dict[str, Any] = predict_image_bytes(image_bytes)
        except UnidentifiedImageError:
            self._send_json(400, {"error": "Image data could not be decoded"})
            return
        except Exception:
            logger.exception("Inference failed")
            self._send_json(500, {"error": "Inference failed"})
            return
        self._send_json(200, result)

    def _send_json(self, status: int, body: dict[str, Any]) -> None:
        response = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response)))
        self.end_headers()
        self.wfile.write(response)

    def _send_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", os.environ.get("CORS_ALLOW_ORIGIN", "*"))
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, format_string: str, *args: Any) -> None:
        logger.info("%s - %s", self.address_string(), format_string % args)


def main() -> None:
    logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
    port = int(os.environ.get("PORT", "8080"))
    server = ThreadingHTTPServer(("0.0.0.0", port), WeedScanHandler)
    logger.info("WeedScan HTTP service listening on port %d", port)
    server.serve_forever()


if __name__ == "__main__":
    main()
