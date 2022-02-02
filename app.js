require('chromedriver');

const {Builder, By, Key, until} = require('selenium-webdriver');
const readline = require('readline');
const fs = require('fs');
const {Options} = require('selenium-webdriver/chrome');

// loading dictionary
var dictionary = fs.readFileSync('DICTIONARY').toString().split("\n");
console.log(`Dictionary loaded ${dictionary.length} words`)
var strongCandidates = [
    "stare",
    "colin",
    "ought"
]

var cheatmode = true


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
    await sleep("2500") // need to wait wordle animation

    // there is a total of 6 rows
    const rowSelector = [
        'return document.querySelector("body > game-app").shadowRoot.querySelector("#board > game-row:nth-child(1)").shadowRoot.querySelector("div")',
        'return document.querySelector("body > game-app").shadowRoot.querySelector("#board > game-row:nth-child(2)").shadowRoot.querySelector("div")',
        'return document.querySelector("body > game-app").shadowRoot.querySelector("#board > game-row:nth-child(3)").shadowRoot.querySelector("div")',
        'return document.querySelector("body > game-app").shadowRoot.querySelector("#board > game-row:nth-child(4)").shadowRoot.querySelector("div")',
        'return document.querySelector("body > game-app").shadowRoot.querySelector("#board > game-row:nth-child(5)").shadowRoot.querySelector("div")',
        'return document.querySelector("body > game-app").shadowRoot.querySelector("#board > game-row:nth-child(6)").shadowRoot.querySelector("div")',

    ]
    for (let i=0; i<rowSelector.length; i++){
        let row = await driver.executeScript(rowSelector[i]) // get the row (shadow root)
        let letters = await row.findElements(By.tagName('game-tile')) // find 5 tiles
        
        let index = 0 // need index for correct letters
        for( const letter of letters){
            switch (await letter.getAttribute('evaluation')) { // from this we now if the letter is correct, absent or present
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

    // give strong candidates if we dont have enough information
    if ((corrects.length * 2 + presents.length) < 3) {
        return strongCandidates
    }

    // candidates must contain all correct letter in correct position
    let candidates = []
    for (const word of initial) {
        let c = true
        for (const correct of corrects) {
            if (word[correct[1]] != correct[0]) {
                c = false
                break
            }
        }

        if (c){
            candidates.push(word)
        }
    }

    // candidates must not contain any absent letter
    let candidates_2 = []
    for (const word of candidates) {
        let c = true
        for (const absent of absents) {
            if (word.indexOf(absent) != -1) {
                c = false
                break
            }
        }

        if (c){
            candidates_2.push(word)
        }
    }


    // candidates must contain all present letter
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

    return candidates_3
}

async function main(){

    try {
        const options = new Options()
        options.addArguments('--user-data-dir=./user-data')
        
        var driver = await new Builder()
        .setChromeOptions(options)
        .forBrowser('chrome')
        .build();

        // open game and close the tutorial
        await driver.get("https://www.powerlanguage.co.uk/wordle/");
        await driver.findElement(By.xpath('/html/body')).click()

        var guessedWords = []
        let initial = dictionary
        // 6 total guesses
        for (let i=0; i<6; i++){
            
            // get the corrects, absents and presents letters
            var res = await getState(driver)
            // console.log(res)

            // get the candidates (still need to improve)
            let candidates = getCandidates(res.corrects, res.absents, res.presents, initial)
            do {
                if (candidates.length == 0){
                    console.log("No candidates")
                    return
                }
                var guessWord = candidates.splice(Math.floor(Math.random()*candidates.length), 1)[0]; // random chose the candidate
            } while (guessedWords.includes(guessWord)); // check if the word has been guessed


            // guess the word
            console.log(`Guessing ${guessWord}, from ${candidates.length} canditates `)
            await guess(driver, guessWord)
            guessedWords.push(guessWord)
            
        }

    } finally {
        console.log("finally");
    } 
    const ans = await input("Enter to quit")
    driver.close()
}

async function cheatMode(){

    try {
        const options = new Options()
        
        var driver = await new Builder()
        .setChromeOptions(options)
        .forBrowser('chrome')
        .build();

        // open game and close the tutorial
        await driver.get("https://www.powerlanguage.co.uk/wordle/");
        await driver.findElement(By.xpath('/html/body')).click()

        var guessedWords = []
        let initial = dictionary
        // 6 total guesses
        for (let i=0; i<6; i++){
            
            // get the corrects, absents and presents letters
            var res = await getState(driver)
            // console.log(res)

            // get the candidates (still need to improve)
            let candidates = getCandidates(res.corrects, res.absents, res.presents, initial)
            do {
                if (candidates.length == 0){
                    console.log("No candidates")
                    return
                }
                var guessWord = candidates.splice(Math.floor(Math.random()*candidates.length), 1)[0]; // random chose the candidate
            } while (guessedWords.includes(guessWord)); // check if the word has been guessed


            // guess the word
            console.log(`Guessing ${guessWord}, from ${candidates.length} canditates `)
            await guess(driver, guessWord)
            guessedWords.push(guessWord)
            
        }

    } finally {
        console.log("finally");
    } 
    const ans = await input("Enter to quit")
    driver.close()
}

if (cheatmode){
    cheatMode()
} else{
    main
}
main()