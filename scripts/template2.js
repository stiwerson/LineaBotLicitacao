const colors = require('colors');
const {writeErrorLog} = require('./errorLogger');
const {gerarEdital, saveBiddings} = require('./functions');
const {Builder, Browser, By, Key, until, WebDriver} = require('selenium-webdriver');
const {startSelenium} = require('./startSelenium');
const chrome = require('selenium-webdriver/chrome');

module.exports.getTemplate2Biddings = async (url, city) =>{
    const {driver} = await startSelenium(url,city);

    //Solving Captcha if exists
    let captchaFrame;
    try{
        console.log('Checando se tem algum recaptcha');

        //Get the iframe of the captcha
        captchaFrame = await driver.wait(until.elementsLocated(By.css('iframe[title="reCAPTCHA"]')), 10000);

        console.log('Indo para o iframe do captcha');
        await driver.switchTo().frame(captchaFrame[1]);

        //I'm not a robot checkbox
        console.log('Localizando o botão (Não sou um robô)');
        const checkbox = await driver.findElement(By.css('.recaptcha-checkbox-border'));
        
        //Click checkbox
        console.log("Clicando no botão (Não sou um robô)");
        await driver.actions().click(checkbox).perform();

    }catch(e){
        console.log("RECAPTCHA não encontrado.\nError Log: "+e)
        driver.close();
    }
}