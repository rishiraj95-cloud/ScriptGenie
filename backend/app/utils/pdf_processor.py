import os
from pdf2image import convert_from_path
from PyPDF2 import PdfReader
import pytesseract
from PIL import Image

def extract_text_from_pdf(pdf_path, method="native", log_callback=print):
    """Extract text from PDF using either native PDF text extraction or OCR"""
    log_callback(f"Processing PDF: {pdf_path} using {method} method")
    
    if not os.path.exists(pdf_path):
        log_callback(f"Error: PDF file not found at {pdf_path}")
        raise FileNotFoundError(f"PDF file not found at {pdf_path}")
    
    if method == "native":
        try:
            # Try native PDF text extraction first
            reader = PdfReader(pdf_path)
            text_data = []
            
            for page_num, page in enumerate(reader.pages):
                log_callback(f"Processing page {page_num + 1} using native method")
                text = page.extract_text()
                log_callback(f"Raw text from page {page_num + 1}: {text[:100]}...")  # Show first 100 chars
                if text.strip():
                    text_data.extend(text.strip().split('\n'))
            
            log_callback(f"Extracted {len(text_data)} lines using native method")
            if not text_data:
                log_callback("Warning: No text extracted using native method, falling back to OCR")
                method = "ocr"
            else:
                return text_data
            
        except Exception as e:
            log_callback(f"Native PDF extraction failed: {str(e)}")
            log_callback("Falling back to OCR method")
            method = "ocr"
    
    if method == "ocr":
        try:
            # Convert PDF to images
            log_callback("Converting PDF to images...")
            # Add poppler path for Windows
            if os.name == 'nt':  # Windows
                from pdf2image.exceptions import PDFPageCountError
                try:
                    images = convert_from_path(pdf_path, poppler_path=r"C:\Program Files\poppler-0.68.0\bin")
                except PDFPageCountError:
                    log_callback("Error: Could not convert PDF to images. Please ensure Poppler is installed.")
                    raise
            else:
                images = convert_from_path(pdf_path)

            log_callback(f"Successfully converted PDF to {len(images)} images")
            text_data = []
            
            # Process each image with OCR
            for i, image in enumerate(images):
                log_callback(f"Processing page {i+1} with OCR")
                text = pytesseract.image_to_string(image)
                log_callback(f"Raw OCR text from page {i+1}: {text[:100]}...")  # Show first 100 chars
                if text.strip():
                    text_data.extend(text.strip().split('\n'))
            
            log_callback(f"Extracted {len(text_data)} lines using OCR method")
            if not text_data:
                log_callback("Warning: No text extracted using OCR method")
            return text_data
            
        except Exception as e:
            log_callback(f"OCR extraction failed: {str(e)}")
            import traceback
            log_callback(traceback.format_exc())
            raise
    
    raise ValueError("Invalid extraction method specified") 