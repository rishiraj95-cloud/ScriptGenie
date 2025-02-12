import cv2
import os
import pytesseract
from PIL import Image

def extract_frames(video_path, output_folder, frame_rate=1, log_callback=print):
    """Extract frames from video at specified frame rate"""
    log_callback(f"Extracting frames from {video_path} to {output_folder}")
    os.makedirs(output_folder, exist_ok=True)
    
    cap = cv2.VideoCapture(video_path)
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    interval = int(fps / frame_rate)
    
    frame_count = 0
    saved_count = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        if frame_count % interval == 0:
            frame_path = os.path.join(output_folder, f"frame_{saved_count}.jpg")
            cv2.imwrite(frame_path, frame)
            log_callback(f"Saved frame {saved_count} to {frame_path}")
            saved_count += 1
            
        frame_count += 1
        
    cap.release()
    log_callback(f"Extracted {saved_count} frames")
    return saved_count

def extract_text_from_frames(frame_folder, log_callback=print):
    """Extract text from frames using Tesseract OCR"""
    # Verify Tesseract is properly configured
    try:
        pytesseract.get_tesseract_version()
    except Exception as e:
        log_callback(f"Tesseract not properly configured: {str(e)}")
        raise Exception("Tesseract OCR is not properly configured. Please verify installation.")

    log_callback(f"Extracting text from frames in {frame_folder}")
    extracted_text = []
    
    for file in sorted(os.listdir(frame_folder)):
        if file.endswith((".jpg", ".png")):
            image_path = os.path.join(frame_folder, file)
            log_callback(f"Processing image: {image_path}")
            text = pytesseract.image_to_string(Image.open(image_path))
            if text.strip():
                log_callback(f"Extracted text: {text.strip()}")
                extracted_text.append(text.strip())
    
    log_callback(f"Total extracted text blocks: {len(extracted_text)}")
    return extracted_text 