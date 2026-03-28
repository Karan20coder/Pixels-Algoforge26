# esp_cam_animal_predict.py
# Install: pip install ultralytics opencv-python requests

import cv2
import time
import urllib.request
import numpy as np
from ultralytics import YOLO

# ─────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────
ESP_CAM_URL  = "http://10.11.209.190/video"
MODEL_PATH   = "yolov8s.pt"
CONFIDENCE   = 0.25
IMAGE_SIZE   = 640
WINDOW_NAME  = "ESP-CAM Animal Detector — YOLOv8s  [q=quit  s=save]"
SAVE_DIR     = "esp_output"

ANIMAL_CLASSES = {
    "bird", "cat", "dog", "horse", "sheep", "cow",
    "elephant", "bear", "zebra", "giraffe"
}

COLORS = {
    "bird":     (255, 200,   0),
    "cat":      (  0, 200, 255),
    "dog":      (  0, 255, 100),
    "horse":    (200, 100, 255),
    "sheep":    (255, 150, 150),
    "cow":      (100, 255, 200),
    "elephant": (180,  80, 255),
    "bear":     ( 80, 160, 255),
    "zebra":    (220, 220, 100),
    "giraffe":  (100, 220, 255),
}

# ─────────────────────────────────────────────────────────────
# SETUP
# ─────────────────────────────────────────────────────────────
import os
os.makedirs(SAVE_DIR, exist_ok=True)

print("[INFO] Loading YOLOv8s model...")
model = YOLO(MODEL_PATH)
print("[INFO] Model ready.")


# ─────────────────────────────────────────────────────────────
# MJPEG STREAM READER
# ESP-CAM streams MJPEG — OpenCV VideoCapture handles it natively
# ─────────────────────────────────────────────────────────────
def open_stream(url: str, retries: int = 5, delay: float = 2.0) -> cv2.VideoCapture:
    for attempt in range(1, retries + 1):
        print(f"[INFO] Connecting to ESP-CAM stream (attempt {attempt}/{retries}): {url}")
        cap = cv2.VideoCapture(url)
        if cap.isOpened():
            print("[INFO] Stream connected successfully.")
            return cap
        print(f"[WARN] Connection failed. Retrying in {delay}s...")
        time.sleep(delay)
    raise ConnectionError(f"[ERROR] Could not connect to stream: {url}")


# ─────────────────────────────────────────────────────────────
# DRAW DETECTIONS ON FRAME
# ─────────────────────────────────────────────────────────────
def draw_detections(frame, detections: list[dict]) -> None:
    for det in detections:
        x1, y1, x2, y2 = [int(v) for v in det["bbox"]]
        label  = f"{det['class']}  {det['confidence']:.2f}"
        color  = COLORS.get(det["class"], (200, 200, 200))

        # Bounding box
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

        # Label pill background
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        cv2.rectangle(frame, (x1, y1 - th - 12), (x1 + tw + 10, y1), color, -1)

        # Label text
        cv2.putText(frame, label, (x1 + 5, y1 - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)


def draw_overlay(frame, detections: list[dict], fps: float) -> None:
    """Top-left HUD: FPS + detected animals."""
    h, w = frame.shape[:2]

    # Semi-transparent dark bar at top
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, 50), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.45, frame, 0.55, 0, frame)

    # FPS
    cv2.putText(frame, f"FPS: {fps:.1f}", (10, 34),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

    # Animal count + names
    if detections:
        names  = ", ".join(d["class"] for d in detections)
        label  = f"Animals ({len(detections)}): {names}"
        color  = (0, 220, 255)
    else:
        label  = "No animals detected"
        color  = (120, 120, 120)

    cv2.putText(frame, label, (160, 34),
                cv2.FONT_HERSHEY_SIMPLEX, 0.75, color, 2)


# ─────────────────────────────────────────────────────────────
# MAIN LOOP
# ─────────────────────────────────────────────────────────────
def run(url: str = ESP_CAM_URL):
    cap         = open_stream(url)
    frame_count = 0
    save_count  = 0
    prev_time   = time.time()
    fps         = 0.0

    print(f"[INFO] Starting live detection. Window: '{WINDOW_NAME}'")
    print("[INFO] Controls:  q = quit   s = save current frame\n")

    while True:
        ret, frame = cap.read()

        # ── Reconnect on dropped frames ──────────────────────
        if not ret or frame is None:
            print("[WARN] Frame lost. Attempting reconnect...")
            cap.release()
            time.sleep(1.5)
            try:
                cap = open_stream(url, retries=10, delay=2.0)
            except ConnectionError as e:
                print(e)
                break
            continue

        frame_count += 1

        # ── FPS calculation ───────────────────────────────────
        now      = time.time()
        fps      = 0.9 * fps + 0.1 * (1.0 / max(now - prev_time, 1e-6))
        prev_time = now

        # ── Inference ────────────────────────────────────────
        results = model.predict(
            source  = frame,
            conf    = CONFIDENCE,
            imgsz   = IMAGE_SIZE,
            verbose = False,
        )

        detections = []
        for r in results:
            for box in r.boxes:
                cls_name = model.names[int(box.cls)]
                if cls_name in ANIMAL_CLASSES:
                    detections.append({
                        "class":      cls_name,
                        "confidence": round(float(box.conf), 3),
                        "bbox":       [round(v, 1) for v in box.xyxy[0].tolist()],
                    })

        detections.sort(key=lambda x: x["confidence"], reverse=True)

        # ── Draw ─────────────────────────────────────────────
        draw_detections(frame, detections)
        draw_overlay(frame, detections, fps)

        # ── Console log (only when something detected) ────────
        if detections:
            animals = ", ".join(f"{d['class']}({d['confidence']})" for d in detections)
            print(f"[FRAME {frame_count:05d}]  {animals}")

        # ── Show ─────────────────────────────────────────────
        cv2.imshow(WINDOW_NAME, frame)

        # ── Key controls ─────────────────────────────────────
        key = cv2.waitKey(1) & 0xFF

        if key == ord("q"):
            print("[INFO] Quit requested.")
            break

        elif key == ord("s"):
            save_count += 1
            path = os.path.join(SAVE_DIR, f"capture_{save_count:04d}.jpg")
            cv2.imwrite(path, frame)
            print(f"[SAVED] {path}")

    # ── Cleanup ───────────────────────────────────────────────
    cap.release()
    cv2.destroyAllWindows()
    print(f"\n[INFO] Done. Processed {frame_count} frames. Saved {save_count} captures.")


# ─────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    run()