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

    const numPages = allPages.length - 5;

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

                console.log(validBiddings[j]);

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
                await button.click();

                console.log("Clicado no botão saber mais".green);
                console.log("Aguardando pagina carregar.");

                await page.waitForSelector('#nomeArquivo');

                console.log("Pegando URL...");

                const url = await page.url();

                edital[city].edital.push(url);

                console.log("URL registrado retornando a pagina inicial");

                await page.goBack();

                console.log("Aguardando a pagina carregar.");

                await page.waitForSelector('.panel-pagination-inner li');

                console.log("Começando novamente a pegar as informações");
            }
        }
        else{
            console.log("Nenhuma licitação nova ou compatível encontrada nesta página. ¯\\_(ツ)_/¯`");
        }
        console.log(edital);
    }

    console.log("Fechando o navegador!");
    browser.close();
}