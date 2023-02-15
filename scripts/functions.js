const puppeteer = require("puppeteer");
const fs = require('fs');
const { METHODS } = require("http");
const Excel = require('exceljs');
const colors = require('colors');
var browser;

const tags = 
['Telas', 'Tela', 'Material pedagogico', 'Gerenciamento', 'Gerenciamento eletronico', 'Pedagogico', 'Acessibilidade', 'TV Escola', 'TV Prefeitura',
'Lousa Digital', 'Totem', 'Totem de senha', 'Senha', 'Tela interativa', 'Touchscreen', 'Gestao de conteudos', 'eletronicos', 'eletronico', 'televisores',
 'Display'];

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
            browser = await puppeteer.launch({ args: [
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
    await browser.close();
    console.error(`Erro na busca após ${maxTries} tentativas.`);
    writeErrorLog('Não foi possível logar no site de ' + siteName);
}

//Saves info in the JSON
function saveJSON(obj, filename){
    const json = JSON.stringify(obj);
    
    for(let tries = 0; tries < maxTries; tries++){
        try{
            fs.writeFile(`./arquivos/db/${filename}.json`, json, (err) => {
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
function getJSON(filename){
    const filepath = `./arquivos/db/${filename}.json`;
    
    return new Promise((resolve,reject) => {
        fs.readFile(filepath, 'utf-8', (err, data)=>{
            //If data not found returns a error on console log
            if(data){
                resolve(JSON.parse(data));
            }else{
                console.log(err);
                resolve(undefined);
            }
        });
    });
}

//Get the current date formated like dd/mm/yy
function getCurrentDate() {
    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

//Error log to register in arquivos/relatorios
async function writeErrorLog(message){
    const date = await getCurrentDate();
    fs.appendFile(`./arquivos/relatorios/ERROR ${date}.txt`, message+'\n\n', (err) =>{
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

//List all biddings from elements
async function getBiddingsFromElements(elem){
    return await Promise.all(elem.map(item => item.evaluate(item => item.innerText)));
}

//Retrieve a link from a button (href)
async function getLinkFromElements(elem){
    return await elem.evaluate(element => element.href);
}

//Check if theres a duplicate notice
async function compareDuplicatedBiddings(list, city){
    const history = await getJSON('history');

    let newList = [];

    if(history && list){
        const database = history[city].numEdital;

        let allEditalNumbers = getNoticeNumber(list);

        newList = allEditalNumbers.filter(item => !database.includes(item));
    }else{
        return list;
    }

    return newList;
}

//Regex to retrieve the notice number from a bidding
function getNoticeNumber(biddings){
    const pattern = new RegExp(`\\d+/\\d+`);
    let noticeNumbers = [];
    let numberFound;

    if(Array.isArray(biddings)){
        for(let bidding of biddings){
            numberFound = bidding.match(pattern);
            noticeNumbers.push(numberFound[0]);
        }
    }else{
        numberFound = biddings.match(pattern);
        return numberFound[0];
    }
    
    return noticeNumbers
}

//Check which biddings are approved
function inspectBiddingsLondrina(biddings, keywords, approvedBiddings){
    for(let bidding of biddings){
        let wordsBidding = removeAccents(bidding.split('\n')[1]).split(/\W+/);

        for(let word of wordsBidding){
            for(let keyword of keywords){
                if(word === keyword.toLowerCase()){
                    approvedBiddings.push(bidding);
                }
            }
        }
    }

    return approvedBiddings;
}

function gerarEdital(edital, local){
    edital[local] = {
        objetos: [],
        situacao: [],
        datasAbertura: [],
        editais: [],
        anexos: [],
        numEdital: []
    }
}

async function saveBiddings(list, city, filename){
    const file = await getJSON(filename);
    const date = getCurrentDate();

    if(file && list){
        //Adding everything to history.json
        file[city].objetos.push(...list[city].objetos);
        file[city].situacao.push(...list[city].situacao);
        file[city].datasAbertura.push(...list[city].situacao);
        file[city].editais.push(...list[city].editais);
        file[city].anexos.push(...list[city].anexos);
        file[city].numEdital.push(...list[city].numEdital);

        if(filename === 'database'){
            let dbFile = {}
            dbFile[date] = file;
            saveJSON(dbFile, filename);
        }else{0
            saveJSON(file, filename);
        }

    }else{
        if(filename === 'database'){
            let dbFile = {}
            dbFile[date] = list;
            saveJSON(dbFile, filename);
        }else{
            saveJSON(list, filename);
        }
    }
}
