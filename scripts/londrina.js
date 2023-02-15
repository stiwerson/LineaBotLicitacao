const puppeteer = require("puppeteer");
const fs = require('fs');
const colors = require('colors');
const {startPuppeteer} = require('./startPuppeteer');

module.exports.getLondrinaBiddings = async () => {
    const {page,browser} = await startPuppeteer("http://www1.londrina.pr.gov.br/sistemas/licita/index.php", "londrina");

    //Click on the first window (Abertas)
    await page.waitForSelector(".small-box.bg-aqua .small-box-footer");

    const saibaMaisButton = await page.$(".small-box.bg-aqua .small-box-footer");

    if(saibaMaisButton){
        console.log("Clicado no botão de abertas".green);
        await saibaMaisButton.click();

        await page.waitForNavigation();

        await page.waitForSelector('#filtroInterno input.botao');
        const filtrarButton = await page.$('#filtroInterno input.botao')

        if(filtrarButton){
            console.log("Clicado no botão filtrar".green)
            await filtrarButton.click();

            const edital = {};

            await page.waitForNavigation();

            const elements = await page.$$("p");

            console.log('Iniciando busca das licitações compativeis.');

            //Used to map every element found and return into a array
            const allBiddings = await getBiddingsFromElements(elements);

            var filteredBiddings = [];

            filteredBiddings = await inspectBiddingsLondrina(allBiddings, tags, filteredBiddings);

            //Check if isn't already on the database

            filteredBiddings = await compareDuplicatedBiddings(filteredBiddings, "londrina");

            if(filteredBiddings.length > 0){
                console.log(`Licitações compativeis encontradas: ${filteredBiddings.length}`.green)

                console.log('Salvando informações, por favor aguarde...');

                const cidade = "londrina"

                await gerarEdital(edital, cidade);

                for(let item of filteredBiddings){
                    const pregao = item.split('\n')[0];

                    await page.waitForSelector('p');

                    edital[cidade].objetos.push(item.split('\n')[1].split('Objeto: ')[1]);
                    edital[cidade].situacao.push(item.split('\n')[2].split("Situação: ")[1]);
                    edital[cidade].datasAbertura.push(item.split('\n')[3].split(" ")[1]);
                    edital[cidade].numEdital.push(getNoticeNumber(item));

                    console.log("Buscando o edital do pregão " + pregao);

                    //Find the correct button to get the notice
                    const editalButton = await page.evaluateHandle((pregao) => {
                        const buttons = Array.from(document.querySelectorAll('p > a'));
                        return buttons.find(button => button.textContent === pregao);
                    }, pregao);

                    console.log("Página do pregão encontrada! Clicando no botão".green);
                    
                    await editalButton.click();

                    try{
                        await page.waitForSelector(".obs a", {timeout: 5000});

                        console.log('Buscando o link do edital...');

                        //Find the button that holds the link for anexo
                        const editalLink = await page.evaluateHandle(() => {
                            const buttons = Array.from(document.querySelectorAll('a'));
                            return buttons.find(element => element.textContent.toLowerCase() === "edital e anexos");
                        });

                        const link = await getLinkFromElements(editalLink);
                        console.log("Link do edital encontrado. Adicionando a lista".green);
                        edital[cidade].editais.push(link);
                    }catch{
                        edital[cidade].editais.push('-');
                        console.log("Link do edital não foi encontrado".red);
                        writeErrorLog("londrina: Não foi possivel encontrar nenhum edital do pregão "+pregao)
                    }

                    edital[cidade].anexos.push("-");
                    
                    console.log(edital);

                    const abertasButton = await page.$('.second-menu ul>li:nth-of-type(2) a');
                    await abertasButton.click()

                    await page.waitForSelector('#filtroInterno input.botao');
                    let filtrarBtn = await page.$('#filtroInterno input.botao');

                    await filtrarBtn.click();
                }

                console.log("Informações salvas com êxito (⌐■_■)");

                //Save all biddings retrieved
                await saveBiddings(edital, cidade, 'history');
                await saveBiddings(edital, cidade, 'database');

                console.log("Fechando o navegador");
                await browser.close();

            }else{
                console.log(`Nenhuma licitação nova ou compatível encontrada ¯\\_(ツ)_/¯`);

                console.log("Fechando o navegador");
                await browser.close();
            }
        }

    }else{
        writeErrorLog('londrina: Não foi possível encontrar um botão de navegação, talvez o layout foi alterado.');
        return console.log("Não encontrado botão, talvez o layout da pagina tenha alterado".red);
    }
}