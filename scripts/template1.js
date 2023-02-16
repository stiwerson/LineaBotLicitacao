const puppeteer = require("puppeteer");
const fs = require('fs');
const colors = require('colors');
const {writeErrorLog} = require('./errorLogger');
const {startPuppeteer} = require('./startPuppeteer');
const {getTags,getStatus} = require('./tags');
const {inspectBiddings} = require('./functions')

module.exports.getTemplate1Biddings = async (url, city) => {
    const {page,browser} = await startPuppeteer(url, city);

    await page.waitForSelector('.panel-pagination-inner li')

    //Used to remember which page has stopped reading
    var currentPage = 1;

    const allPages = await page.$$('.panel-pagination-inner li');

    const numPages = allPages.length - 2;

    console.log(`A página de ${city} tem ${numPages} no total`.green);

    console.log('Começando a ler cada página.');

    for(let i = 0;i<numPages;i++){
        console.log(`Lendo a página ${currentPage}`.green);

        const validBiddings = await inspectBiddings();
        if(validBiddings > 0){

        }
        else{
            console.log("Nenhuma licitação nova ou compatível encontrada nesta página. ¯\\_(ツ)_/¯`")
        }
    }

    console.log("Fechando o navegador!");
    browser.close();
}