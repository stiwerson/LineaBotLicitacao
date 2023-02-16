const puppeteer = require("puppeteer");
const fs = require('fs');
const colors = require('colors');
const {getJSON,saveJSON} = require('./json');
const {getCurrentDate} = require('./dateGenerator');
const { getTags, getStatus } = require("./tags");
const { writeErrorLog } = require("./errorLogger");

module.exports.removeAccents = (str) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, " ").toLowerCase();
}

//List all biddings from elements
module.exports.getBiddingsFromElements = async (elem) => {
    return await Promise.all(elem.map(item => item.evaluate(item => item.innerText)));
}

//Retrieve a link from a button (href)
module.exports.getLinkFromElements = async (elem) =>{
    return await elem.evaluate(element => element.href);
}

//Check if theres a duplicate notice
module.exports.compareDuplicatedBiddings = async(list, city) =>{
    const history = await getJSON('history');

    let newList = [];

    if(history && list){
        const database = history[city].numEdital;

        let allEditalNumbers = module.exports.getNoticeNumber(list);

        newList = allEditalNumbers.filter(item => !database.includes(item));
    }else{
        return list;
    }

    return newList;
}

//Regex to retrieve the notice number from a bidding
module.exports.getNoticeNumber = (biddings) =>{
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

//Inspect multiple text elements from a bidding and return the ones that are valid
module.exports.inspectBiddings = async (biddings, status, object) =>{
    const validTags = getTags('./tags.txt')
    .then(tags => {return tags})
    .catch(error => {
        console.log("The file tags.txt wansn't found.");
        writeErrorLog("The file tags.txt wansn't found.");
    });

    const validStatus = getStatus();

    var validBiddings = [];

    for(let i = 0; i < bidding.length;i++){
        //Check the status of the biddings if still valid
        const allStatus = await bidding[i].$eval(status, el => module.exports.removeAccents(el.innerText.trim().toLowerCase()));

        if(validStatus.includes(allstatus)){
            //Get all object description after checking for valid status options
            const allObjects = await bidding[i].$eval(object, el => module.exports.removeAccents(el.getAttribute('text').trim().toLowerCase()));
            if(validTags.some(validWord => allObjects.includes(validWord))){
                validBiddings.push(biddings[i])
            }
        }


    }
    return validBiddings;
};

//Check which biddings are approved
module.exports.inspectBiddingsLondrina = (biddings, keywords, approvedBiddings) =>{
    for(let bidding of biddings){
        let wordsBidding = module.exports.removeAccents(bidding.split('\n')[1]).split(/\W+/);

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

module.exports.gerarEdital = (edital, local) =>{
    edital[local] = {
        objetos: [],
        situacao: [],
        datasAbertura: [],
        editais: [],
        anexos: [],
        numEdital: []
    }
}

module.exports.saveBiddings = async (list, city, filename) => {
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
