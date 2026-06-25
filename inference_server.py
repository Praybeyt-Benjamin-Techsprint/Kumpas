"""HTTP inference bridge for the React frontend.

The browser owns webcam permission and sends JPEG frames to this local server.
This process runs MediaPipe + TensorFlow and returns the recognizer state as
JSON so the frontend can display predictions.
"""

from __future__ import annotations

import argparse
import base64
import json
import logging
from collections import deque
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Optional

import cv2
import mediapipe as mp
import numpy as np

from sign_language import (
    DEFAULT_LABEL_MAP_PATH,
    DEFAULT_MODEL_PATH,
    DEFAULT_MOVEMENT_THRESHOLD,
    DEFAULT_PREDICTION_LOG_PATH,
    DEFAULT_RESET_STILL_FRAMES,
    PREDICTION_HISTORY_LENGTH,
    RecognitionState,
    calculate_motion_score,
    ensure_prediction_log,
    extract_keypoints,
    extract_motion_landmarks,
    hands_are_visible,
    load_actions,
    load_tensorflow_model,
    mediapipe_detection,
    resolve_sequence_length_for_model,
    update_recognition_state,
    validate_keypoints_for_model,
    validate_model_output,
)


DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765
MAX_BODY_BYTES = 6 * 1024 * 1024


class InferenceRuntime:
    """Holds model, MediaPipe, and recognition state across HTTP requests."""

    def __init__(self, args: argparse.Namespace) -> None:
        self.args = args
        self.model = load_tensorflow_model(args.model_path)
        self.actions = load_actions(args.label_map_path, args.labels_path)
        validate_model_output(self.model, self.actions)
        self.sequence_length = resolve_sequence_length_for_model(
            self.model,
            args.sequence_length,
        )
        ensure_prediction_log(args.prediction_log_path)
        self.state = RecognitionState(
            sequence=[],
            sentence=[],
            predictions=deque(maxlen=PREDICTION_HISTORY_LENGTH),
            probabilities=np.zeros(len(self.actions), dtype=np.float32),
            threshold=args.prediction_threshold,
        )
        self.keypoint_shape_checked = False
        self.mp_holistic = mp.solutions.holistic
        self.holistic_model = self.mp_holistic.Holistic(
            static_image_mode=False,
            model_complexity=args.model_complexity,
            smooth_landmarks=True,
            enable_segmentation=False,
            refine_face_landmarks=False,
            min_detection_confidence=args.min_detection_confidence,
            min_tracking_confidence=args.min_tracking_confidence,
        )

    def close(self) -> None:
        self.holistic_model.close()

    def reset(self) -> dict[str, Any]:
        self.state = RecognitionState(
            sequence=[],
            sentence=[],
            predictions=deque(maxlen=PREDICTION_HISTORY_LENGTH),
            probabilities=np.zeros(len(self.actions), dtype=np.float32),
            threshold=self.args.prediction_threshold,
        )
        self.keypoint_shape_checked = False
        return self.to_response()

    def process_frame(self, frame: np.ndarray) -> dict[str, Any]:
        if self.args.flip:
            frame = cv2.flip(frame, 1)

        results = mediapipe_detection(frame, self.holistic_model)
        keypoints = extract_keypoints(results)
        motion_landmarks = extract_motion_landmarks(results)
        self.state.hands_visible = hands_are_visible(results)
        self.state.motion_score = calculate_motion_score(
            self.state.previous_motion_landmarks,
            motion_landmarks,
        )
        self.state.previous_motion_landmarks = motion_landmarks

        if not self.keypoint_shape_checked:
            validate_keypoints_for_model(self.model, keypoints)
            self.keypoint_shape_checked = True

        update_recognition_state(
            self.state,
            self.model,
            self.actions,
            keypoints,
            self.sequence_length,
            self.args.movement_threshold,
            self.args.reset_still_frames,
            self.args.prediction_log_path,
        )
        return self.to_response()

    def to_response(self) -> dict[str, Any]:
        top_index = int(np.argmax(self.state.probabilities))
        top_label = (
            str(self.actions[top_index])
            if len(self.state.probabilities) and top_index < len(self.actions)
            else ""
        )
        top_confidence = (
            float(self.state.probabilities[top_index])
            if len(self.state.probabilities)
            else 0.0
        )
        return {
            "ok": True,
            "phase": self.state.phase.value,
            "sequenceLength": self.sequence_length,
            "recordingFrames": len(self.state.sequence),
            "handsVisible": self.state.hands_visible,
            "isMoving": self.state.is_moving,
            "motionScore": self.state.motion_score,
            "prediction": self.state.accepted_label,
            "confidence": self.state.confidence,
            "topPrediction": top_label,
            "topConfidence": top_confidence,
            "sentence": self.state.sentence,
            "labels": list(map(str, self.actions)),
        }


def parse_data_url(image_value: str) -> bytes:
    """Decode a plain base64 string or data:image/...;base64 URL."""
    if "," in image_value:
        _, image_value = image_value.split(",", 1)
    return base64.b64decode(image_value, validate=True)


def decode_frame(image_bytes: bytes) -> np.ndarray:
    """Decode compressed browser image bytes into a BGR OpenCV frame."""
    encoded = np.frombuffer(image_bytes, dtype=np.uint8)
    frame = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
    if frame is None or not frame.size:
        raise ValueError("Could not decode image frame.")
    return frame


class InferenceRequestHandler(BaseHTTPRequestHandler):
    runtime: InferenceRuntime

    def do_OPTIONS(self) -> None:
        self.send_empty_response(HTTPStatus.NO_CONTENT)

    def do_GET(self) -> None:
        if self.path == "/health":
            self.send_json(
                {
                    "ok": True,
                    "sequenceLength": self.runtime.sequence_length,
                    "labels": list(map(str, self.runtime.actions)),
                }
            )
            return
        self.send_error_json(HTTPStatus.NOT_FOUND, "Unknown route.")

    def do_POST(self) -> None:
        try:
            if self.path == "/reset":
                self.send_json(self.runtime.reset())
                return
            if self.path != "/predict":
                self.send_error_json(HTTPStatus.NOT_FOUND, "Unknown route.")
                return

            payload = self.read_json_body()
            image_value = payload.get("image")
            if not isinstance(image_value, str) or not image_value:
                self.send_error_json(HTTPStatus.BAD_REQUEST, "Missing image payload.")
                return

            frame = decode_frame(parse_data_url(image_value))
            self.send_json(self.runtime.process_frame(frame))
        except ValueError as exc:
            self.send_error_json(HTTPStatus.BAD_REQUEST, str(exc))
        except Exception as exc:  # noqa: BLE001 - keep server alive and report JSON.
            logging.exception("Inference request failed")
            self.send_error_json(HTTPStatus.INTERNAL_SERVER_ERROR, str(exc))

    def read_json_body(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0:
            raise ValueError("Missing request body.")
        if content_length > MAX_BODY_BYTES:
            raise ValueError("Request body is too large.")

        body = self.rfile.read(content_length)
        payload = json.loads(body.decode("utf-8"))
        if not isinstance(payload, dict):
            raise ValueError("JSON body must be an object.")
        return payload

    def send_json(self, payload: dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        response = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response)))
        self.end_headers()
        self.wfile.write(response)

    def send_error_json(self, status: HTTPStatus, message: str) -> None:
        self.send_json({"ok": False, "error": message}, status)

    def send_empty_response(self, status: HTTPStatus) -> None:
        self.send_response(status)
        self.send_cors_headers()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def send_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, format: str, *args: Any) -> None:
        logging.debug(format, *args)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run local TensorFlow inference API.")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--model-path", type=Path, default=DEFAULT_MODEL_PATH)
    parser.add_argument("--label-map-path", type=Path, default=DEFAULT_LABEL_MAP_PATH)
    parser.add_argument("--labels-path", type=Path, default=None)
    parser.add_argument("--sequence-length", type=int, default=None)
    parser.add_argument("--prediction-threshold", type=float, default=0.5)
    parser.add_argument("--prediction-log-path", type=Path, default=DEFAULT_PREDICTION_LOG_PATH)
    parser.add_argument("--movement-threshold", type=float, default=DEFAULT_MOVEMENT_THRESHOLD)
    parser.add_argument("--reset-still-frames", type=int, default=DEFAULT_RESET_STILL_FRAMES)
    parser.add_argument("--min-detection-confidence", type=float, default=0.5)
    parser.add_argument("--min-tracking-confidence", type=float, default=0.5)
    parser.add_argument("--model-complexity", type=int, choices=(0, 1, 2), default=1)
    parser.add_argument("--no-flip", dest="flip", action="store_false")
    parser.set_defaults(flip=True)
    parser.add_argument("--debug", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.debug else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )
    runtime: Optional[InferenceRuntime] = None
    try:
        runtime = InferenceRuntime(args)
        InferenceRequestHandler.runtime = runtime
        server = ThreadingHTTPServer((args.host, args.port), InferenceRequestHandler)
        logging.info(
            "Inference server ready at http://%s:%s (sequence=%s labels=%s)",
            args.host,
            args.port,
            runtime.sequence_length,
            len(runtime.actions),
        )
        server.serve_forever()
    except KeyboardInterrupt:
        logging.info("Inference server stopped.")
    finally:
        if runtime is not None:
            runtime.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
