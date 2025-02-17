```java
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class ToolTipTest {

    public static void main(String[] args) {
        
        // Set up Chrome WebDriver
        System.setProperty("webdriver.chrome.driver", "path/to/chromedriver.exe");
        WebDriver driver = new ChromeDriver();
        
        // Open Story Spark home page
        driver.get("http://storyspark.com");
        
        // Maximize the browser window
        driver.manage().window().maximize();
        
        // Initialize WebDriverWait
        WebDriverWait wait = new WebDriverWait(driver, 10);
        
        // Find and hover over each input field to view tool tip
        WebElement importFromImage = driver.findElement(By.id("importFromImage"));
        Actions actions = new Actions(driver);
        actions.moveToElement(importFromImage).perform();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("tooltip")));
        
        WebElement title = driver.findElement(By.id("title"));
        actions.moveToElement(title).perform();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("tooltip")));
        
        WebElement description = driver.findElement(By.id("description"));
        actions.moveToElement(description).perform();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("tooltip")));
        
        WebElement acceptanceCriteria = driver.findElement(By.id("acceptanceCriteria"));
        actions.moveToElement(acceptanceCriteria).perform();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("tooltip")));
        
        WebElement saveStory = driver.findElement(By.id("saveStory"));
        actions.moveToElement(saveStory).perform();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("tooltip")));
        
        // Close the browser
        driver.quit();
    }
}
```