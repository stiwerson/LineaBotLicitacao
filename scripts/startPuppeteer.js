const puppeteer = require("puppeteer");
const {writeErrorLog} = require('./errorLogger');

//Get all texts from URL using selectors
module.exports.startPuppeteer = async function(url, siteName){
    //Number of tries if timeout
    const maxTries = 3;

    //Loop used in case of timeout or unexpected errors
    for(let tries = 0; tries < maxTries; tries++){
        try{
            console.log("Abrindo puppeteer.")
            //Start Browser
            const browser = await puppeteer.launch({
                headless: false,
                args: [
                '--disable-gpu',
                '--disable-setuid-sandbox',
                '--no-sandbox',
                '--no-zygote'
                ]});

            console.log("Aberto o navegador.");

            //Open new tab
            const page = await browser.newPage();

            console.log("Aberto uma nova aba");

            //Go to location selected on param
            await page.goto(url);

            console.log("Indo ao site de " + siteName);

            return { page, browser};

        }catch(error){
            console.error(`ERRO:\n ${error}.\n Tentando novamente.\n (Tentativas ${tries+1}/${maxTries})`);
        }
    }
    await browser.close();
    console.error(`Erro na busca após ${maxTries} tentativas.`);
    writeErrorLog('Não foi possível logar no site de ' + siteName);
}