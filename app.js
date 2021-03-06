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

var strongCandidatesCounter  = 0

function unique(array) {
    return array.filter((el, index, array) => index === array.indexOf(el));
}

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
    for (let i=0; i<5 ; i++)
        await driver.findElement(By.xpath('/html/body')).sendKeys(Key.BACK_SPACE)

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

    // remove absent if it's in corrects
    for (let i=0; i<corrects.length; i++){
        do {
            j = absents.indexOf(corrects[i][0])
            if (j != -1){
                absents.splice(j,1)
            }
        } while (j != -1);
    }
    // remove absent if it's in presents
    for (let i=0; i<presents.length; i++){
        do {
            j = absents.indexOf(presents[i])
            if (j != -1){
                absents.splice(j,1)
            }
        } while (j != -1);
    }
    // remove duplicates
    corrects = [...new Set(corrects)]
    absents = [...new Set(absents)]
    presents = [...new Set(presents)]
    console.log(corrects, absents, presents)
    return {corrects, absents, presents}
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

function getCandidates(corrects,absents, presents, initial) {

    // give strong candidates if we dont have enough information
    if (((corrects.length * 2 + presents.length) < 3) && strongCandidatesCounter <3 ) {
        strongCandidatesCounter += 1
        return strongCandidates
    }

    // candidates must contain all correct letter in correct position
    let candidates = []
    if (corrects.length >0){
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
    } else {
        candidates = initial
    }

    // candidates must not contain any absent letter
    let candidates_2 = []
    if (absents.length > 0){
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
    }else{
        candidates_2 = candidates
        }


    // candidates must contain all present letter
    let candidates_3 = []
    if (presents.length > 0){
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
    }else{
        candidates_3 = candidates_2
    }
    console.log(candidates_3)
    return candidates_3
}

async function main(isTestMode){

    try {
        const options = new Options()
        if (!isTestMode){
            options.addArguments('--user-data-dir=./user-data')
        }
        var driver = await new Builder()
        .setChromeOptions(options)
        .forBrowser('chrome')
        .build();

        // open game and close the tutorial
        await driver.get("https://www.powerlanguage.co.uk/wordle/");
        await driver.findElement(By.xpath('/html/body')).click()

        var guessedWords = []
        // 6 total guesses
        for (let i=0; i<10; i++){
            let isDone = false
            // get the corrects, absents and presents letters
            var res = await getState(driver)
            // console.log(res)

            // get the candidates (still need to improve)
            let candidates = getCandidates(res.corrects, res.absents, res.presents, dictionary)
            do {
                if (candidates.length == 0){
                    console.log("No candidates")
                    isDone = true
                    i= 1000
                }
                var guessWord = candidates.splice(Math.floor(Math.random()*candidates.length), 1)[0]; // random chose the candidate
            } while (guessedWords.includes(guessWord)); // check if the word has been guessed


            // guess the word
            if (!isDone){
                console.log(`Guessing ${guessWord}, from ${candidates.length} canditates `)
                await guess(driver, guessWord)
                guessedWords.push(guessWord)
            }
            
        }

    } finally {
        console.log("finally");
    } 
    const ans = await input("Enter to quit")
    driver.close()
}

async function cheatMode(){
    console.log("cheat mode is not implemented yet")
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
        var res = await getState(driver)
        res.corrects = unique(res.corrects)
        while(res.corrects.length <5){
            // 6 total guesses
            for (let i=0; i<10; i++){
        
                // get the corrects, absents and presents letters
                res = await getState(driver)
                res.corrects = unique(res.corrects)
                // console.log(res
                // get the candidates (still need to improve)
                let candidates = getCandidates(res.corrects, res.absents, res.presents, initial)
                do {
                    if (candidates.length == 0){
                        console.log("No candidates")
                        return
                    }
                    var guessWord = candidates.splice(Math.floor(Math.random()*candidates.length), 1)[0]; // random chose the candidate
                } while (guessedWords.indexOf(guessWord != -1)); // check if the word has been guesse
                // guess the word
                console.log(`Guessing ${guessWord}, from ${candidates.length} canditates `)
                await guess(driver, guessWord)
                guessedWords.push(guessWord)
            }
        }
        console.log(res.corrects)
      
         
    } finally {
         console.log("finally");
        } 
    const ans = await input("Enter to quit")
    driver.close()
}

const args = process.argv.slice(2)

if (args[0] == "-c"){
    cheatMode()
} else if (args[0] == "-t"){
    main(true)
} else {
    main(false)
}