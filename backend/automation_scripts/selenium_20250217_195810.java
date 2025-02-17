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
        WebDriver driver = new ChromeDriver();
        WebDriverWait wait = new WebDriverWait(driver, 10);
        Actions actions = new Actions(driver);

        // Scenario: View Tool Tip for Import from Image Field
        driver.get("https://www.storyspark.com/");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("importFromImage")));
        WebElement importFromImageField = driver.findElement(By.id("importFromImage"));
        actions.moveToElement(importFromImageField).perform();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("tooltip")));

        // Scenario: View Tool Tip for Title Field
        driver.get("https://www.storyspark.com/");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("title")));
        WebElement titleField = driver.findElement(By.id("title"));
        actions.moveToElement(titleField).perform();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("tooltip")));

        // Scenario: View Tool Tip for Description Field
        driver.get("https://www.storyspark.com/");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("description")));
        WebElement descriptionField = driver.findElement(By.id("description"));
        actions.moveToElement(descriptionField).perform();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("tooltip")));

        // Scenario: View Tool Tip for Acceptance Criteria Field
        driver.get("https://www.storyspark.com/");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("acceptanceCriteria")));
        WebElement acceptanceCriteriaField = driver.findElement(By.id("acceptanceCriteria"));
        actions.moveToElement(acceptanceCriteriaField).perform();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("tooltip")));

        driver.quit();
    }
}
```