const colors = require('colors');
const {writeErrorLog} = require('./errorLogger');
const {gerarEdital, saveBiddings} = require('./functions');
const {Builder, Browser, By, Key, until} = require('selenium-webdriver');

module.exports.getTemplate2Biddings = async (url, city) =>{
    console.log("Iniciando o selenium");
}