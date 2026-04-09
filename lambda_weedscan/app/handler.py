"""
AWS Lambda handler (container image). Expects JSON with base64-encoded image bytes.
"""

from __future__ import annotations

import base64
import json
import logging
from typing import Any

from .inference import predict_image_bytes

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """
    Event body (JSON string or dict):
      { "image_base64": "<standard base64>" }
    Optional:
      { "isBase64Encoded": true } when using API Gateway proxy integration
    """
    try:
        if isinstance(event.get("body"), str):
            body = json.loads(event["body"])
        else:
            body = event

        b64 = body.get("image_base64")
        if not b64:
            return _response(
                400,
                {"error": "Missing image_base64 in request body"},
            )

        raw = base64.b64decode(b64)
        result = predict_image_bytes(raw)
        return _response(200, result)
    except Exception as e:
        logger.exception("Inference failed")
        return _response(500, {"error": str(e)})


def _response(status: int, body: dict[str, Any]) -> dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }
