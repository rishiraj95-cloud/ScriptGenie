from setuptools import setup, find_packages

setup(
    name="scriptgenie",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "python-multipart",
        "opencv-python",
        "pytesseract",
        "pdf2image",
        "openai==0.28.1",
        "python-dotenv",
        "uvicorn",
        "jira",
        "pdfplumber",  # For PDF image extraction without external dependencies
        "PyMuPDF==1.23.8",  # Alternative PDF image extraction
    ],
    author="ScriptGenie Team",
    author_email="info@scriptgenie.com",
    description="A tool for generating test cases and automation scripts",
) 