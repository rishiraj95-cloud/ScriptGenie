#!/bin/bash
echo "Installing ScriptGenie dependencies..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
echo "Installing required packages..."
pip install -r requirements.txt

# Install pdfplumber specifically
echo "Installing pdfplumber for PDF image extraction..."
pip install pdfplumber

echo "Dependencies installed successfully!"
echo "To activate the environment, run: source venv/bin/activate" 