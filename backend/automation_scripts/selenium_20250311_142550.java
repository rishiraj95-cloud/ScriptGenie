from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Browser initialization
driver = webdriver.Chrome()
driver.get("url_of_the_application")

# Test Case: Export user stories as CSV
# 1. Click on the "Export" drop-down menu
export_dropdown = driver.find_element(By.ID, "export-dropdown")
export_dropdown.click()
# Verify drop-down menu expands
WebDriverWait(driver, 10).until(EC.visibility_of_element_located((By.ID, "export-options")))
# Verify options: CSV, Excel, PDF are visible
csv_option = driver.find_element(By.ID, "csv-option")
excel_option = driver.find_element(By.ID, "excel-option")
pdf_option = driver.find_element(By.ID, "pdf-option")
assert csv_option.is_displayed() and excel_option.is_displayed() and pdf_option.is_displayed()
# 2. Select "CSV" option
csv_option.click()
# Verify user stories table is downloaded in CSV format
# Add verification code here

# Test Case: Export user stories as Excel
# 1. Click on the "Export" drop-down menu
export_dropdown = driver.find_element(By.ID, "export-dropdown")
export_dropdown.click()
# Verify drop-down menu expands
WebDriverWait(driver, 10).until(EC.visibility_of_element_located((By.ID, "export-options")))
# Verify options: CSV, Excel, PDF are visible
csv_option = driver.find_element(By.ID, "csv-option")
excel_option = driver.find_element(By.ID, "excel-option")
pdf_option = driver.find_element(By.ID, "pdf-option")
assert csv_option.is_displayed() and excel_option.is_displayed() and pdf_option.is_displayed()
# 2. Select "Excel" option
excel_option.click()
# Verify user stories table is downloaded in Excel format
# Add verification code here

# Test Case: Export user stories as PDF
# 1. Click on the "Export" drop-down menu
export_dropdown = driver.find_element(By.ID, "export-dropdown")
export_dropdown.click()
# Verify drop-down menu expands
WebDriverWait(driver, 10).until(EC.visibility_of_element_located((By.ID, "export-options")))
# Verify options: CSV, Excel, PDF are visible
csv_option = driver.find_element(By.ID, "csv-option")
excel_option = driver.find_element(By.ID, "excel-option")
pdf_option = driver.find_element(By.ID, "pdf-option")
assert csv_option.is_displayed() and excel_option.is_displayed() and pdf_option.is_displayed()
# 2. Select "PDF" option
pdf_option.click()
# Verify user stories table is downloaded in PDF format
# Add verification code here

# Regression Scenarios:
# Verify that the exporting functionality does not impact the loading time of the View Stories page
# Add regression scenario verification code here

# Check if the exported files are accurate and contain all user stories
# Add verification code here

# Close the browser
driver.quit()