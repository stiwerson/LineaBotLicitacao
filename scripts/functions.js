const puppeteer = require("puppeteer");
const fs = require('fs');
const { METHODS } = require("http");
const ExcelJS = require('exceljs');
const colors = require('colors');

const keywords = ['Telas', 'Tela', 'Material pedagogico', 'Gerenciamento', 'Gerenciamento eletronico', 'Pedagogico', 'Acessibilidade', 'TV Escola', 'TV Prefeitura',
'Lousa Digital'];

//Number of tries if timeout
const maxTries = 3;

//Get all texts from URL using selectors
const startPuppeteer = async function(url, siteName){
    const texts = [];

    //Loop used in case of timeout or unexpected errors
    for(let tries = 0; tries < maxTries; tries++){
        try{
            console.log("Procurando as licitações.");
            //Start Browser
            const browser = await puppeteer.launch({ args: [
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

            return page;

        }catch(error){
            console.error(`ERRO:\n ${error}.\n Tentando novamente.\n (Tentativas ${tries+1}/${maxTries})`);
        }
    }
    console.error(`Erro na busca após ${maxTries} tentativas.`);
}

//Saves info in the JSON
function saveJSON(obj, filename){
    const json = JSON.stringify(obj);
    
    for(let tries = 0; tries < maxTries; tries++){
        try{
            fs.writeFile(`./public/${filename}.json`, json, (err) => {
                if (err){
                    throw err
                }else{
                    console.log(`${filename}.json foi salvo com sucesso`);
                }
            });
            break;
        }catch(error){
            console.error(`ERRO:\n ${error}.\n Tentando novamente.\n (Tentativas ${tries+1}/${maxTries})`);
        }
    }
}

//Saves info in the ExcelFile
function saveSheet(obj, filename){
    const json = JSON.stringify(obj);
    
    for(let tries = 0; tries < maxTries; tries++){
        try{
            fs.writeFile(`./public/${filename}.json`, json, (err) => {
                if (err){
                    throw err
                }else{
                    console.log(`${filename}.json foi salvo com sucesso`);
                }
            });
            break;
        }catch(error){
            console.error(`ERRO:\n ${error}.\n Tentando novamente.\n (Tentativas ${tries+1}/${maxTries})`);
        }
    }
}

//Get saved JSON
module.exports.getJSON = (filename) =>{
    return new Promise((resolve,reject) => {
        fs.readFile(`./public/${filename}.json`, 'utf-8', (err, data)=>{
            //If data not found returns a error on console log
            if(data){
                resolve(JSON.parse(data));
            }else{
                console.log("Error! " + err);
            }
        });
    })
}

module.exports.getLondrinaBiddings = async () => {
    const page = await startPuppeteer("http://www1.londrina.pr.gov.br/sistemas/licita/index.php", "Londrina");

    try{
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

                await page.waitForNavigation();

                const biddings = page.$$("p");

                console.log(biddings.length)
            }

        }else{
            return console.log("Não encontrado botão, talvez o layout da pagina tenha alterado".red);
        }

        page.click()
    }catch(err){
        console.error("ERRO: "+err);
    }
}