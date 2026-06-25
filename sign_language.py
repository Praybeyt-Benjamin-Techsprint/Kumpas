"""Real-time sign language landmark detection with MediaPipe Holistic.

This script opens the default webcam, detects pose and hand landmarks in real
time, draws the landmarks on each frame, and exits when the user presses "q".
It is intentionally model-ready: TensorFlow recognition can be added by feeding
extracted landmark keypoints into an LSTM, Transformer, or other classifier.
"""

from __future__ import annotations

import argparse
import logging
import platform
import sys
import time
from collections import deque
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

try:
    import cv2
    import mediapipe as mp
    import numpy as np
except ImportError as exc:
    missing_package = exc.name or "a required package"
    print(
        f"Missing dependency: {missing_package}\n\n"
        "Install the project dependencies in a compatible virtual environment:\n"
        "  python3.11 -m venv .venv311\n"
        "  source .venv311/bin/activate\n"
        "  python -m pip install --upgrade pip\n"
        "  python -m pip install -r requirements.txt\n\n"
        "If python3.11 is not installed on macOS, install it with:\n"
        "  brew install python@3.11",
        file=sys.stderr,
    )
    raise SystemExit(1) from exc


WINDOW_NAME = "Sign Language Recognition - Press q to quit"
DEFAULT_CAMERA_WARMUP_FRAMES = 60
FRAME_RETRY_DELAY_SECONDS = 0.05


class CameraOpenError(RuntimeError):
    """Raised when OpenCV cannot open the requested webcam."""


class CameraReadError(RuntimeError):
    """Raised when OpenCV opens a webcam but cannot read frames."""


@dataclass(frozen=True)
class CameraConfig:
    """Runtime configuration for webcam capture."""

    camera_index: int
    width: Optional[int]
    height: Optional[int]
    backend: Optional[int]


@dataclass(frozen=True)
class CameraSession:
    """A successfully opened camera and the first readable frame."""

    capture: cv2.VideoCapture
    first_frame: np.ndarray
    config: CameraConfig


@dataclass
class RecognitionState:
    """Holds the rolling landmark sequence used for model inference."""

    sequence: deque[np.ndarray]
    prediction_text: str = "Model: not loaded"
    confidence: float = 0.0


def parse_args() -> argparse.Namespace:
    """Parse command-line options for camera and MediaPipe settings."""
    parser = argparse.ArgumentParser(
        description=(
            "Run real-time pose and hand landmark detection using "
            "MediaPipe Holistic and OpenCV."
        )
    )
    parser.add_argument(
        "--camera-index",
        type=int,
        default=0,
        help="OpenCV camera index to use. Default: 0.",
    )
    parser.add_argument(
        "--width",
        type=int,
        default=0,
        help="Requested camera frame width. Default: 0 keeps the camera default.",
    )
    parser.add_argument(
        "--height",
        type=int,
        default=0,
        help="Requested camera frame height. Default: 0 keeps the camera default.",
    )
    parser.add_argument(
        "--camera-backend",
        choices=("auto", "avfoundation", "default"),
        default="auto",
        help="OpenCV camera backend to use on macOS. Default: auto.",
    )
    parser.add_argument(
        "--camera-warmup-frames",
        type=int,
        default=DEFAULT_CAMERA_WARMUP_FRAMES,
        help="Number of read attempts before treating the camera as unavailable.",
    )
    parser.add_argument(
        "--min-detection-confidence",
        type=float,
        default=0.5,
        help="Minimum confidence for initial landmark detection.",
    )
    parser.add_argument(
        "--min-tracking-confidence",
        type=float,
        default=0.5,
        help="Minimum confidence for landmark tracking between frames.",
    )
    parser.add_argument(
        "--model-complexity",
        type=int,
        choices=(0, 1, 2),
        default=1,
        help="MediaPipe pose model complexity: 0=fast, 1=balanced, 2=accurate.",
    )
    parser.add_argument(
        "--draw-face",
        action="store_true",
        help="Also draw face landmarks. Disabled by default for less clutter.",
    )
    parser.add_argument(
        "--no-flip",
        action="store_true",
        help="Do not mirror the webcam image horizontally.",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable verbose debug logging.",
    )
    parser.add_argument(
        "--model-path",
        type=Path,
        default=None,
        help="Optional TensorFlow/Keras model path for real-time recognition.",
    )
    parser.add_argument(
        "--labels-path",
        type=Path,
        default=None,
        help="Optional text file with one class label per line.",
    )
    parser.add_argument(
        "--sequence-length",
        type=int,
        default=30,
        help="Number of frames to send to the recognition model.",
    )
    parser.add_argument(
        "--prediction-threshold",
        type=float,
        default=0.7,
        help="Minimum model confidence before displaying a class label.",
    )
    return parser.parse_args()


def configure_logging(debug: bool) -> None:
    """Configure console logging."""
    logging.basicConfig(
        level=logging.DEBUG if debug else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )


def avfoundation_backend() -> Optional[int]:
    """Return OpenCV's AVFoundation backend constant when it is available."""
    if hasattr(cv2, "CAP_AVFOUNDATION"):
        return cv2.CAP_AVFOUNDATION
    return None


def backend_name(backend: Optional[int]) -> str:
    """Return a readable backend name for logging."""
    if backend is None:
        return "default"
    if backend == avfoundation_backend():
        return "avfoundation"
    return str(backend)


def camera_config_candidates(args: argparse.Namespace) -> list[CameraConfig]:
    """Build a conservative list of camera configurations to try."""
    requested_size = (args.width or None, args.height or None)
    default_size = (None, None)

    if args.camera_backend == "avfoundation":
        backends = [avfoundation_backend()]
    elif args.camera_backend == "default":
        backends = [None]
    else:
        backends = []
        if platform.system() == "Darwin":
            backends.append(avfoundation_backend())
        backends.append(None)

    configs: list[CameraConfig] = []
    for backend in backends:
        if backend is None and args.camera_backend == "avfoundation":
            continue
        for width, height in (requested_size, default_size):
            config = CameraConfig(args.camera_index, width, height, backend)
            if config not in configs:
                configs.append(config)
    return configs


def open_camera_handle(config: CameraConfig) -> cv2.VideoCapture:
    """Open the webcam handle and raise a clear error if it is unavailable."""
    if config.backend is None:
        capture = cv2.VideoCapture(config.camera_index)
    else:
        capture = cv2.VideoCapture(config.camera_index, config.backend)

    if config.width:
        capture.set(cv2.CAP_PROP_FRAME_WIDTH, config.width)
    if config.height:
        capture.set(cv2.CAP_PROP_FRAME_HEIGHT, config.height)

    if not capture.isOpened():
        release_capture(capture)
        raise CameraOpenError(
            "Could not open webcam. "
            f"camera_index={config.camera_index}, "
            f"backend={backend_name(config.backend)}, "
            f"opencv_version={cv2.__version__}, "
            f"python={sys.version.split()[0]}, "
            f"platform={platform.platform()}"
        )

    logging.info(
        "Camera opened: index=%s width=%s height=%s fps=%s",
        config.camera_index,
        int(capture.get(cv2.CAP_PROP_FRAME_WIDTH)),
        int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT)),
        capture.get(cv2.CAP_PROP_FPS),
    )
    return capture


def read_camera_frame(
    capture: cv2.VideoCapture,
    retries: int,
    retry_delay_seconds: float = FRAME_RETRY_DELAY_SECONDS,
) -> Optional[np.ndarray]:
    """Read a frame, retrying to handle slow webcam warm-up."""
    for attempt in range(max(retries, 1)):
        success, frame = capture.read()
        if success and frame is not None and frame.size:
            return frame
        if attempt == 0:
            logging.debug("Camera read returned no frame; retrying.")
        time.sleep(retry_delay_seconds)
    return None


def open_working_camera(args: argparse.Namespace) -> CameraSession:
    """Open the first camera configuration that can actually deliver frames."""
    errors: list[str] = []

    for config in camera_config_candidates(args):
        capture: Optional[cv2.VideoCapture] = None
        try:
            logging.info(
                "Trying camera: index=%s backend=%s width=%s height=%s",
                config.camera_index,
                backend_name(config.backend),
                config.width or "default",
                config.height or "default",
            )
            capture = open_camera_handle(config)
            frame = read_camera_frame(capture, args.camera_warmup_frames)
            if frame is None:
                errors.append(
                    "opened but delivered no frames "
                    f"(backend={backend_name(config.backend)}, "
                    f"width={config.width or 'default'}, "
                    f"height={config.height or 'default'})"
                )
                release_capture(capture)
                continue

            logging.info(
                "Camera is delivering frames: backend=%s shape=%s",
                backend_name(config.backend),
                frame.shape,
            )
            return CameraSession(capture=capture, first_frame=frame, config=config)
        except CameraOpenError as exc:
            errors.append(str(exc))
            release_capture(capture)

    raise CameraReadError(
        "Could not read frames from the webcam after trying these options: "
        + " | ".join(errors)
    )


def release_capture(capture: Optional[cv2.VideoCapture]) -> None:
    """Release OpenCV capture resources safely."""
    if capture is not None and capture.isOpened():
        capture.release()


def process_frame(image, holistic_model):
    """Run MediaPipe inference on a BGR OpenCV frame."""
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    rgb_image.flags.writeable = False
    results = holistic_model.process(rgb_image)
    rgb_image.flags.writeable = True
    return results


def extract_keypoints(results) -> np.ndarray:
    """Convert MediaPipe pose and hand landmarks into a fixed-size vector."""
    pose = (
        np.array(
            [
                [landmark.x, landmark.y, landmark.z, landmark.visibility]
                for landmark in results.pose_landmarks.landmark
            ]
        ).flatten()
        if results.pose_landmarks
        else np.zeros(33 * 4)
    )
    left_hand = (
        np.array(
            [
                [landmark.x, landmark.y, landmark.z]
                for landmark in results.left_hand_landmarks.landmark
            ]
        ).flatten()
        if results.left_hand_landmarks
        else np.zeros(21 * 3)
    )
    right_hand = (
        np.array(
            [
                [landmark.x, landmark.y, landmark.z]
                for landmark in results.right_hand_landmarks.landmark
            ]
        ).flatten()
        if results.right_hand_landmarks
        else np.zeros(21 * 3)
    )
    return np.concatenate([pose, left_hand, right_hand]).astype(np.float32)


def draw_landmarks(image, results, draw_face: bool = False) -> None:
    """Draw pose, hand, and optionally face landmarks on the frame."""
    mp_holistic = mp.solutions.holistic
    mp_drawing = mp.solutions.drawing_utils
    mp_styles = mp.solutions.drawing_styles

    if results.pose_landmarks:
        mp_drawing.draw_landmarks(
            image,
            results.pose_landmarks,
            mp_holistic.POSE_CONNECTIONS,
            landmark_drawing_spec=mp_styles.get_default_pose_landmarks_style(),
        )

    if results.left_hand_landmarks:
        mp_drawing.draw_landmarks(
            image,
            results.left_hand_landmarks,
            mp_holistic.HAND_CONNECTIONS,
            landmark_drawing_spec=mp_styles.get_default_hand_landmarks_style(),
            connection_drawing_spec=mp_styles.get_default_hand_connections_style(),
        )

    if results.right_hand_landmarks:
        mp_drawing.draw_landmarks(
            image,
            results.right_hand_landmarks,
            mp_holistic.HAND_CONNECTIONS,
            landmark_drawing_spec=mp_styles.get_default_hand_landmarks_style(),
            connection_drawing_spec=mp_styles.get_default_hand_connections_style(),
        )

    if draw_face and results.face_landmarks:
        face_connections = getattr(
            mp_holistic,
            "FACEMESH_CONTOURS",
            getattr(mp_holistic, "FACEMESH_TESSELATION", None),
        )
        mp_drawing.draw_landmarks(
            image,
            results.face_landmarks,
            face_connections,
            landmark_drawing_spec=None,
            connection_drawing_spec=mp_styles.get_default_face_mesh_contours_style(),
        )


def add_status_overlay(
    image,
    results,
    fps: float,
    recognition_state: Optional[RecognitionState],
) -> None:
    """Draw lightweight debugging information on the output frame."""
    hands_detected = sum(
        landmark is not None
        for landmark in (results.left_hand_landmarks, results.right_hand_landmarks)
    )
    pose_detected = results.pose_landmarks is not None
    status = f"FPS: {fps:.1f} | Pose: {pose_detected} | Hands: {hands_detected}/2"
    prediction = (
        recognition_state.prediction_text
        if recognition_state is not None
        else "Model: not loaded"
    )

    cv2.rectangle(image, (0, 0), (640, 72), (0, 0, 0), thickness=-1)
    cv2.putText(
        image,
        status,
        (12, 26),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )
    cv2.putText(
        image,
        prediction,
        (12, 58),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (80, 255, 80),
        2,
        cv2.LINE_AA,
    )


def load_labels(labels_path: Optional[Path]) -> Optional[list[str]]:
    """Load class labels from a newline-delimited text file."""
    if labels_path is None:
        return None
    if not labels_path.exists():
        raise RuntimeError(f"Labels file does not exist: {labels_path}")

    labels = [
        line.strip()
        for line in labels_path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    if not labels:
        raise RuntimeError(f"Labels file is empty: {labels_path}")
    return labels


def load_tensorflow_model(model_path: Optional[Path]) -> Optional[Any]:
    """Load a TensorFlow/Keras model only when a path is provided."""
    if model_path is None:
        return None
    if not model_path.exists():
        raise RuntimeError(f"Model path does not exist: {model_path}")

    try:
        import tensorflow as tf
    except ImportError as exc:
        raise RuntimeError(
            "TensorFlow is required when --model-path is provided. "
            "Install it with: python3 -m pip install tensorflow"
        ) from exc

    logging.info("Loading TensorFlow model from %s", model_path)
    return tf.keras.models.load_model(model_path)


def update_recognition(
    state: RecognitionState,
    model: Any,
    labels: Optional[list[str]],
    keypoints: np.ndarray,
    sequence_length: int,
    threshold: float,
) -> None:
    """Append keypoints and update the displayed model prediction."""
    state.sequence.append(keypoints)
    if model is None or len(state.sequence) < sequence_length:
        return

    input_sequence = np.expand_dims(np.array(state.sequence), axis=0)
    probabilities = model.predict(input_sequence, verbose=0)[0]
    prediction_index = int(np.argmax(probabilities))
    confidence = float(probabilities[prediction_index])
    state.confidence = confidence

    if labels and prediction_index < len(labels):
        predicted_label = labels[prediction_index]
    else:
        predicted_label = f"class_{prediction_index}"

    if confidence >= threshold:
        state.prediction_text = f"Prediction: {predicted_label} ({confidence:.2f})"
    else:
        state.prediction_text = f"Prediction: uncertain ({confidence:.2f})"


def run_webcam_loop(args: argparse.Namespace) -> int:
    """Run the real-time webcam processing loop."""
    model = load_tensorflow_model(args.model_path)
    labels = load_labels(args.labels_path)
    recognition_state = RecognitionState(
        sequence=deque(maxlen=args.sequence_length),
        prediction_text="Model: loaded" if model is not None else "Model: not loaded",
    )

    camera_session = open_working_camera(args)
    capture = camera_session.capture
    mp_holistic = mp.solutions.holistic
    previous_time = time.perf_counter()
    pending_frame: Optional[np.ndarray] = camera_session.first_frame

    # MediaPipe Holistic tracks pose and hand landmarks across video frames.
    with mp_holistic.Holistic(
        static_image_mode=False,
        model_complexity=args.model_complexity,
        smooth_landmarks=True,
        enable_segmentation=False,
        refine_face_landmarks=args.draw_face,
        min_detection_confidence=args.min_detection_confidence,
        min_tracking_confidence=args.min_tracking_confidence,
    ) as holistic_model:
        try:
            while capture.isOpened():
                if pending_frame is not None:
                    frame = pending_frame
                    pending_frame = None
                else:
                    frame = read_camera_frame(capture, args.camera_warmup_frames)

                if frame is None:
                    logging.warning(
                        "Could not read a frame from the webcam after %s attempts.",
                        args.camera_warmup_frames,
                    )
                    break

                if not args.no_flip:
                    frame = cv2.flip(frame, 1)

                results = process_frame(frame, holistic_model)
                draw_landmarks(frame, results, draw_face=args.draw_face)
                keypoints = extract_keypoints(results)
                update_recognition(
                    recognition_state,
                    model,
                    labels,
                    keypoints,
                    args.sequence_length,
                    args.prediction_threshold,
                )

                current_time = time.perf_counter()
                fps = 1.0 / max(current_time - previous_time, 1e-6)
                previous_time = current_time
                add_status_overlay(frame, results, fps, recognition_state)

                cv2.imshow(WINDOW_NAME, frame)

                if cv2.waitKey(1) & 0xFF == ord("q"):
                    logging.info("Exit requested with q key.")
                    break
        finally:
            release_capture(capture)
            cv2.destroyAllWindows()

    return 0


def main() -> int:
    """Program entry point."""
    args = parse_args()
    configure_logging(args.debug)

    try:
        return run_webcam_loop(args)
    except CameraOpenError as exc:
        logging.error("%s", exc)
        logging.error(
            "macOS troubleshooting: allow camera access for Terminal, iTerm, "
            "VS Code, or your Python launcher in System Settings > Privacy & "
            "Security > Camera. Also verify no other app is using the webcam."
        )
        return 1
    except CameraReadError as exc:
        logging.error("%s", exc)
        logging.error(
            "macOS troubleshooting: close FaceTime, Zoom, Chrome, or any app "
            "using the camera. If this still fails, try: "
            "python sign_language.py --camera-backend default --width 0 --height 0"
        )
        return 1
    except RuntimeError as exc:
        logging.error("Runtime error: %s", exc)
        logging.error(
            "If this mentions NSOpenGLPixelFormat, kGpuService, or display "
            "creation, run the script from a normal macOS Terminal session "
            "with access to the desktop instead of a headless environment."
        )
        return 1
    except KeyboardInterrupt:
        logging.info("Interrupted by user.")
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
