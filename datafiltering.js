require('chromedriver');

const {Builder, By, Key, until} = require('selenium-webdriver');
const readline = require('readline');
const fs = require('fs');
const {Options} = require('selenium-webdriver/chrome');

// loading dictionary
var dictionary = fs.readFileSync('DICTIONARY').toString().split("\n");