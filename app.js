require('chromedriver');

const { WebElement } = require('selenium-webdriver');
const {Builder, By, Key, until} = require('selenium-webdriver');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async function test(){
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.get("https://www.powerlanguage.co.uk/wordle/");
        console.log("loaded")
        await driver.findElement(By.xpath('/html/body')).click()
        await driver.findElement(By.xpath('/html/body')).sendKeys("tried",Key.RETURN)

        let keyboard = await driver.executeScript('return document.querySelector("body > game-app").shadowRoot.querySelector("#game > game-keyboard").shadowRoot.querySelector("#keyboard")')

        let letters = await keyboard.findElements(By.tagName('button'))

        let corrects = []
        let absents = []
        let presents = []

        await sleep("2000")
        for( const letter of letters){
            switch (await letter.getAttribute('data-state')) {
                case 'correct':
                    corrects.push(await letter.getText())
                    break;
                case 'absent':
                    absents.push(await letter.getText())
                    break;
                case 'present':
                    presents.push(await letter.getText())
                    break;
                default:
                    break;
            }
        }

    } catch (error) {
        console.log(error);
    } finally {
        console.log("Test finished");
    } 
    driver.close()
}

test()