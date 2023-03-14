const colors = require('colors');
const {writeErrorLog} = require('./errorLogger');
const {Builder, Browser, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');

const chromiumDriverPath = path.join(__dirname, '/chromium-web-driver/chromedriver')

module.exports.startSelenium = async (url,city) => {
    console.log("Iniciando o selenium");

    const options = new chrome.Options();

    //If you gonna debug comment this code below, so you can fully preview selenium working
    //options.headless()

    try{
        const driver = await new Builder()
            .forBrowser('chrome')
            .setChromeService(new chrome.ServiceBuilder(chromiumDriverPath))
            .setChromeOptions(options)
            .build();
    }catch(e){
        console.log(`Não foi possivel iniciar o selenium`.red)
        writeErrorLog(`Não foi possivel iniciar o selenium`);
    }

    console.log('Indo ao site de ' + city);
    try{
        await driver.get(url);
    }catch(e){
        console.log(`Não foi possivel ir ate o site de ${city}`.red);
        writeErrorLog(`${city}: Não foi possível acessar o site.\nVerifique se o site ${url} esta fora do ar.\nError Log:\n${e}`)
    }
}