const puppeteer = require("puppeteer");
const fs = require('fs');
const colors = require('colors');
const {writeErrorLog} = require('./errorLogger');
const {startPuppeteer} = require('./startPuppeteer');
const {getTags,getStatus} = require('./tags');
const {inspectBiddingsT1, gerarEdital} = require('./functions')

module.exports.getTemplate1Biddings = async (url, city) => {
    const {page,browser} = await startPuppeteer(url, city);

    await page.waitForSelector('.panel-pagination-inner li')

    //Used to remember which page has stopped reading
    var currentPage = 1;

    const allPages = await page.$$('.panel-pagination-inner li');

    const numPages = allPages.length - 2;

    console.log(`A página de ${city} tem ${numPages} páginas no total`.green);

    console.log('Começando a ler cada página.');

    const edital = {}
    gerarEdital(edital, city);

    //Read every page
    for(let i = 0; i < numPages; i++){
        console.log(`Lendo a página ${currentPage}`.green);

        page.waitForSelector('tbody tr');
        const allBiddings = await page.$$('tbody tr');

        //Get the ammount of avaliable biddings
        var validBiddings = await inspectBiddingsT1(allBiddings, '.coluna-5 span', 'tbody .coluna-8', city);

        const biddingsToVerify = validBiddings.length;

        if(biddingsToVerify > 0){
            console.log(`Encontradas ${biddingsToVerify} licitações novas e compativeis na página ${currentPage}`.green);

            //Read every bidding
            for(let j = 0; j < biddingsToVerify; j++){
                validBiddings = await inspectBiddingsT1(allBiddings, '.coluna-5 span', 'tbody .coluna-8', city);

                //Add information to the edital
                const objStr = await validBiddings[j].$eval('tbody .coluna-8', el => el.getAttribute('title'));
                const sitStr = await validBiddings[j].$eval('tbody .coluna-5', el => el.innerText);
                const datStr = await validBiddings[j].$eval('tbody .coluna-0', el => el.innerText);
                const numStr = await validBiddings[j].$eval('tbody .coluna-2', el => el.innerText);

                console.log("Anotando informações");

                edital[city].objetos.push(objStr);
                edital[city].situacao.push(sitStr);
                edital[city].datasAbertura.push(datStr);
                edital[city].numEdital.push(numStr);
                edital[city].anexos.push('-');

                //Get url for the edital
                const button = await validBiddings[j].$('tbody .coluna-10 button');
                console.log("Vou pegar o URL do edital");


                //Simulate button click for being a dynamic page created on react
                await page.evaluate((btn) => {
                    btn.click();
                  }, button);

                console.log("Clicado no botão saber mais".green);
                console.log("Aguardando pagina carregar.");

                await page.waitForTimeout(3000);

                console.log("Pegando URL...");

                const url = await page.url();

                console.log(url);

                edital[city].editais.push(url);

                console.log("URL registrado retornando a pagina inicial");

                await page.goBack();

                console.log("Aguardando a pagina carregar.");

                await page.waitForSelector('.panel-pagination-inner li');
                
                let pageBtn;

                //If this is the last bidding to check change the page
                if(j >= biddingsToVerify-1 && currentPage === 1){
                    currentPage++;
                    pageBtn = await page.$(`.panel-pagination-inner li:nth-of-type(${currentPage}) a`);
                }else if(j >= biddingsToVerify-1 && currentPage > 1){
                    currentPage++;
                    pageBtn = await page.$(`.panel-pagination-inner li:nth-of-type(${currentPage+2}) a`);
                }else if(currentPage > 1 ){
                    pageBtn = await page.$(`.panel-pagination-inner li:nth-of-type(${currentPage+2}) a`);
                }else{
                    pageBtn = await page.$(`.panel-pagination-inner li:nth-of-type(${currentPage}) a`);
                }
                
                //If needed to click on other page will do it
                if(j >= biddingsToVerify-1 || currentPage > 1){
                    await page.evaluate((btn)=>{
                        btn.click();
                    }, pageBtn);
    
                    await page.waitForTimeout(3000);
                }
            }
            console.log(`Indo para a página ${currentPage}`.green);
        }
        else{
            console.log("Nenhuma licitação nova ou compatível encontrada na página "+currentPage+". ¯\\_(ツ)_/¯`");
            //Case not found change page
            if(currentPage !== numPages){
                if(currentPage === 1){
                    currentPage++;
                    pageBtn = await page.$(`.panel-pagination-inner li:nth-of-type(${currentPage}) a`);
                }else if(currentPage > 1){
                    currentPage++;
                    pageBtn = await page.$(`.panel-pagination-inner li:nth-of-type(${currentPage+2}) a`);
                }
                console.log(`Indo para a página ${currentPage}`.green);
            }else{
                console.log("Não há mais paginas restantes em "+city);
            }

        }
        //If is not empty save on history.json and database.json
        if(edital[city]){
            //Saves all the info
            await saveBiddings(edital, city, 'history');
            await saveBiddings(edital, city, 'database');
        }
    }

    console.log("Fechando o navegador!");
    browser.close();
}