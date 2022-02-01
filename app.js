require('chromedriver');

const { WebElement } = require('selenium-webdriver');
const {Builder, By, Key, until} = require('selenium-webdriver');

async function test(){
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.get("https://www.powerlanguage.co.uk/wordle/");
        console.log("loaded")
        await driver.findElement(By.xpath('/html/body')).click()
        await driver.findElement(By.xpath('/html/body')).sendKeys("grape",Key.RETURN)

        let gameapp = await driver.findElement(By.tagName('game-app')); //shadow host root element
        // create a javascript executor
        let jse = driver.getExecutor();
        console.log(buttonA.getText())

    } catch (error) {
        console.log(error);
    } finally {
        console.log("Test finished");
    } 
}

test()