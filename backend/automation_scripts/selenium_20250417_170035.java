from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.maximize_window()

driver.get("https://example.com/product-page")

add_to_cart_button = driver.find_element(By.ID, "add-to-cart-button")
add_to_cart_button.click()

cart_icon = driver.find_element(By.ID, "cart-icon")
item_count = cart_icon.text
assert item_count == "1"

driver.get("https://example.com/limited-stock-product-page")

add_to_cart_button = driver.find_element(By.ID, "add-to-cart-button")
add_to_cart_button.click()

cart_icon = driver.find_element(By.ID, "cart-icon")
item_count = cart_icon.text
assert item_count == "0"

driver.get("https://example.com/cart")

remove_button = driver.find_element(By.ID, "remove-button")
remove_button.click()

cart_total = driver.find_element(By.ID, "cart-total")
assert cart_total.text == "0"

driver.quit()