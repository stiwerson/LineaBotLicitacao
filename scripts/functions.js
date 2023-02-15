const puppeteer = require("puppeteer");
const fs = require('fs');
const colors = require('colors');
const {getTags} = require('./tags');

//Number of tries if timeout
const maxTries = 3;

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
