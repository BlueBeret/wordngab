require('chromedriver');

const { WebElement } = require('selenium-webdriver');
const {Builder, By, Key, until} = require('selenium-webdriver');
const readline = require('readline');
const fs = require('fs');

// loading dictionary
var dictionary = fs.readFileSync('DICTIONARY').toString().split("\n");
console.log(`Dictionary loaded ${dictionary.length} words`)

var strongCandidates = [
    "stare","colin"
]

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

    const rowSelector = [
        'return document.querySelector("body > game-app").shadowRoot.querySelector("#board > game-row:nth-child(1)").shadowRoot.querySelector("div")',
        'return document.querySelector("body > game-app").shadowRoot.querySelector("#board > game-row:nth-child(2)").shadowRoot.querySelector("div")',
        'return document.querySelector("body > game-app").shadowRoot.querySelector("#board > game-row:nth-child(3)").shadowRoot.querySelector("div")',
        'return document.querySelector("body > game-app").shadowRoot.querySelector("#board > game-row:nth-child(4)").shadowRoot.querySelector("div")',
        'return document.querySelector("body > game-app").shadowRoot.querySelector("#board > game-row:nth-child(5)").shadowRoot.querySelector("div")',
        'return document.querySelector("body > game-app").shadowRoot.querySelector("#board > game-row:nth-child(6)").shadowRoot.querySelector("div")',

    ]
    for (let i=0; i<rowSelector.length; i++){
        let row = await driver.executeScript(rowSelector[i])
        let letters = await row.findElements(By.tagName('game-tile'))
        
        let index = 0
        for( const letter of letters){
            switch (await letter.getAttribute('evaluation')) {
                case 'correct':
                    corrects.push([(await letter.getText()).toLowerCase(), index])
                    break;
                case 'absent':
                    absents.push((await letter.getText()).toLowerCase())
                    break;
                case 'present':
                    presents.push((await letter.getText()).toLowerCase())
                    break;
                default:
                    break;
            }
            index++
        }
    }

    return {corrects, absents, presents}
}


function getCandidates(corrects,absents, presents, initial) {
    if ((corrects.length * 2 + presents.length) < 3) {
        return strongCandidates
    }
    let candidates = []
    for (const word of initial) {
        let c = true
        for (const correct of corrects) {
            if (word[correct[1]] != correct[0]) {
                if (word == "moist"){
                    console.log("error in correct")
                }
                c = false
                break
            }
        }

        if (c){
            candidates.push(word)
        }
    }

    let candidates_2 = []
    for (const word of candidates) {
        let c = true
        for (const absent of absents) {
            if (word.indexOf(absent) != -1) {
                if (word == "moist"){
                    console.log("error in absent")
                }
                c = false
                break
            }
        }

        if (c){
            candidates_2.push(word)
        }
    }

    let candidates_3 = []
    for (const word of candidates_2) {
        let c = true
        for (const present of presents) {
            if (word.indexOf(present) == -1) {
                if (word == "moist"){
                    console.log("error in present")
                }
                c = false
                break
            }
        }

        if(c){
            candidates_3.push(word)
        }
    }
    console.log(candidates_3)
    return candidates_3
}

async function main(){

    try {
        var driver = await new Builder().forBrowser('chrome').build();

        await driver.get("https://www.powerlanguage.co.uk/wordle/");
        await driver.findElement(By.xpath('/html/body')).click()



        let initial = dictionary
        for (let i=0; i<3; i++){
            var res = await getState(driver)
            console.log(res)
            let candidates = getCandidates(res.corrects, res.absents, res.presents, initial)
            let guessWord = candidates.splice(Math.floor(Math.random()*candidates.length), 1)[0];

            console.log(guessWord)

            await guess(driver, guessWord)
            
        }

    } finally {
        console.log("Done");
    } 
    const ans = await input("Enter to quit")
    driver.close()
}

main()