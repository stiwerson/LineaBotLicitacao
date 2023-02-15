const puppeteer = require("puppeteer");
const fs = require('fs');
const colors = require('colors');
var browser;

module.exports.getTemplate1Biddings = async (url, city) => {
    const page = await startPuppeteer(url, city);

    await page.waitForSelector('.panel-pagination-inner li')

    //Used to remember which page has stopped reading
    var currentPage = 1;

    const allPages = await page.$$('.panel-pagination-inner li')

    console.log(allPages);

    console.log("Fechando o navegador!");
    browser.close();
}