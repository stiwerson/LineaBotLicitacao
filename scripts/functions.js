const puppeteer = require("puppeteer");
const fs = require('fs');
const { METHODS } = require("http");
const ExcelJS = require('exceljs');
const colors = require('colors');

const tags = 
['Telas', 'Tela', 'Material pedagogico', 'Gerenciamento', 'Gerenciamento eletronico', 'Pedagogico', 'Acessibilidade', 'TV Escola', 'TV Prefeitura',
'Lousa Digital', 'Totem', 'Totem de senha', 'Senha', 'Tela interativa', 'Touchscreen'];

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
    writeErrorLog('Não foi possível logar no site de ' + siteName);
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

function getCurrentDate() {
    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

async function writeErrorLog(message){
    const date = await getCurrentDate();
    fs.appendFile(`./arquivos/relatorios/ERROR ${date}.txt`, message, (err) =>{
        if(err){
            console.log("Não foi possivel escrever o erro no log: " + err);
        }else{
            console.log("Erro registrado com sucesso no log.")
        }
    })
}
  

function removeAccents(str){
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, " ").toLowerCase();
}

async function getBiddingsFromElements(elem){
    return await Promise.all(elem.map(item => item.evaluate(item => item.innerText)));
}

function getNoticeNumber(biddings){
    const pattern = new RegExp(`\\d+/\\d+`);
    let noticeNumbers = [];
    let numberFound;

    for(let bidding of biddings){
        numberFound = bidding.match(pattern);
        noticeNumbers.push(numberFound);
    }
    
    return noticeNumbers
}

function inspectBiddings(biddings, keywords, approvedBiddings){
    for(let bidding of biddings){
        let wordsBidding = removeAccents(bidding).split(/\W+/);

        for(let word of wordsBidding){
            for(let keyword of keywords){
                if(word === keyword){
                    console.log("Achado uma licitação para com as palavras-chave.");
                    approvedBiddings.push(bidding);
                }
            }
        }
    }

    return approvedBiddings;
}

module.exports.getLondrinaBiddings = async () => {
    const page = await startPuppeteer("http://www1.londrina.pr.gov.br/sistemas/licita/index.php", "londrina");

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

                const elements = await page.$$("p");

                console.log('Iniciando busca das licitações compativeis.');

                //Used to map every element found and return into a array
                const allBiddings = await getBiddingsFromElements(elements);

                var filteredBiddings = [];

                filteredBiddings = inspectBiddings(allBiddings, tags, filteredBiddings);

                if(filteredBiddings.length > 0){
                    console.log(`Licitações compativeis encontradas: ${filteredBiddings.length}`.green)

                    console.log('Salvando em uma planilha');

                }else{
                    console.log(`Nenhuma licitação compatível encontrada ¯\\_(ツ)_/¯`);
                }
            }

        }else{
            writeErrorLog('londrina: Não foi possível encontrar um botão de navegação, talvez o layout foi alterado.')
            return console.log("Não encontrado botão, talvez o layout da pagina tenha alterado".red);
        }
    }catch(err){
        writeErrorLog('londrina: Não foi possível navegar pela página, talvez a pagina tenha caido ou a conexão com a internet foi interrompida.')
        console.error("ERRO: " + err);
    }
}