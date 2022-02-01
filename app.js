require('chromedriver');

const { WebElement } = require('selenium-webdriver');
const {Builder, By, Key, until} = require('selenium-webdriver');
const readline = require('readline');

function input(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

function guess(driver, word){
    driver.findElement(By.xpath('/html/body')).sendKeys(word,Key.RETURN)
}

async function getState(driver){
    let corrects = []
    let absents = []
    let presents = []
    await sleep("2500")
    let row = await driver.executeScript('return document.querySelector("body > game-app").shadowRoot.querySelector("#board > game-row:nth-child(1)").shadowRoot.querySelector("div")')
    let letters = await row.findElements(By.tagName('game-tile'))
    
    let index = 0
    for( const letter of letters){
        switch (await letter.getAttribute('evaluation')) {
            case 'correct':
                corrects.push([await letter.getText(), index])
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
        index++
    }

    return {corrects, absents, presents}
}

async function main(){

    try {
        var driver = await new Builder().forBrowser('chrome').build();

        await driver.get("https://www.powerlanguage.co.uk/wordle/");
        await driver.findElement(By.xpath('/html/body')).click()
        
        await guess(driver, "those")

        let {corrects, absents, presents} = await getState(driver)
        console.log(corrects, absents, presents)

    } finally {
        console.log("Test finished");
    } 
    const ans = await input("Enter to quit")
    driver.close()
}

main()