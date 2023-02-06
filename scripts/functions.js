const puppeteer = require("puppeteer");
const fs = require('fs');
const { METHODS } = require("http");

//Number of tries if timeout
const maxTries = 3;

//Get all texts from URL using selectors
const getElements = async function(url, selectors){
    const texts = [];

    //Loop used in case of timeout or unexpected errors
    for(let tries = 0; tries < maxTries; tries++){
        try{
            console.log("Starting the work!");
            //Start Browser
            const browser = await puppeteer.launch({ args: [
                '--disable-gpu',
                '--disable-setuid-sandbox',
                '--no-sandbox',
                '--no-zygote'
                ]});

            console.log("Browser started");

            //Open new tab
            const page = await browser.newPage();

            console.log("Opened a new TAB!");

            //Go to location selected on param
            await page.goto(url);

            console.log("Going to the URL");

            //Get every element
            for(let selector of selectors){   
                //Wait for html elements to load
                await page.waitForSelector(selector); 

                console.log("Waiting for the selector");

                //get all elements
                const elements = await page.$$(selector)

                console.log("Getting all the elements");

                //extract all text wanted, if theres no text tries to get alt
                const arrayText = await Promise.all(elements.map(item => item.evaluate(item => item.innerText ? item.innerText : item.alt)));

                console.log("Finished getting the elements");

                //add extracted texts to the array 
                texts.push(arrayText);

                console.log("Sended the text to a Array");
            }

            return texts;
        }catch(error){
            console.error(`ERROR:\n ${error}.\n Retrying.\n (Number of tries ${tries+1}/${maxTries})`);
        }
    }
    console.error(`Failed after ${maxTries} tries.`);
}

//Used to get current day
function getDayWeek (){
    const date = new Date();
    const day = date.getDay();

    return day;
}

//Saves all scrapped info to a json
function saveJSON(obj, filename){
    const json = JSON.stringify(obj);

    for(let tries = 0; tries < maxTries; tries++){
        try{
            fs.writeFile(`./public/${filename}.json`, json, (err) => {
                if (err){
                    throw err
                }else{
                    console.log(`${filename}.json has been updated.`);
                }
            });
            break;
        }catch(error){
            console.error(`ERROR:\n ${error}.\n Retrying.\n (Number of tries ${tries+1}/${maxTries})`);
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

//Get Megasena winning numbers, amount of winners and prize
module.exports.getMegasena = async () =>{
    console.log("Updating Megasena results...");
    //Url to get
    const url = "https://loterias.caixa.gov.br/Paginas/Mega-Sena.aspx";
    //Css selectors to get the text
    const selectors = 
    [
        '.numbers.megasena>li', 
        'h2>span.ng-binding', 
        'div.next-prize.clearfix>p:first-child', 
        'div.next-prize.clearfix>.value', 
        '.content-section.with-box.column-right .description:nth-of-type(1)>span:nth-of-type(3)', 
        '.content-section.with-box.column-right .description:nth-of-type(2)>span:nth-of-type(1)',
        '.content-section.with-box.column-right .description:nth-of-type(3)>span:nth-of-type(1)'
    ];

    const texts = await getElements(url, selectors);

    const megasenaResults = {
        numbers:  texts[0],
        date:  texts[1],
        nextDate:  texts[2],
        nextPrize:  texts[3],
        scoredSix:  texts[4],
        scoredFive:  texts[5],
        scoredFour:  texts[6]
    }

    saveJSON(megasenaResults, 'megasena');
}

//Get the weather
module.exports.getWeather = async (local) => {
    console.log(`Updating the "${local}" weather file...`);
    const url = "https://www.tempo.com/"+local+".htm";
    //Css selectors to get the text
    const selectors = [
        "span.dato-temperatura", 
        "span.descripcion strong",
        ".dia:nth-of-type(1)>.temperatura>.maxima",
        ".dia:nth-of-type(1)>.temperatura>.minima",
        ".dia:nth-of-type(2)>.prediccion img",
        ".dia:nth-of-type(2)>.temperatura>.maxima",
        ".dia:nth-of-type(2)>.temperatura>.minima",
        ".dia:nth-of-type(3)>.prediccion img",
        ".dia:nth-of-type(3)>.temperatura>.maxima",
        ".dia:nth-of-type(3)>.temperatura>.minima",
        ".dia:nth-of-type(4)>.prediccion img",
        ".dia:nth-of-type(4)>.temperatura>.maxima",
        ".dia:nth-of-type(4)>.temperatura>.minima",
        ".dia:nth-of-type(5)>.prediccion img",
        ".dia:nth-of-type(5)>.temperatura>.maxima",
        ".dia:nth-of-type(5)>.temperatura>.minima"
    ]

    const texts = await getElements(url, selectors);

    const daysWeek = ['Domingo', 'Segunda', "Terça", "Quarta", 'Quinta', 'Sexta', 'Sábado'];
    const currentDay = getDayWeek();

    const weather = {
        temperature: texts[0],
        desc: texts[1],
        tempMax: texts[2],
        tempMin: texts[3],
    
        descDay2: texts[4],
        tempMaxDay2: texts[5],
        tempMinDay2: texts[6],
    
        nameDay3: daysWeek[currentDay+2%6],
        descDay3: texts[7],
        tempMaxDay3: texts[8],
        tempMinDay3: texts[9],
    
        nameDay4: daysWeek[currentDay+3%6],
        descDay4: texts[10],
        tempMaxDay4: texts[11],
        tempMinDay4: texts[12],
    
        nameDay5: daysWeek[currentDay+4%6],
        descDay5: texts[13],
        tempMaxDay5: texts[14],
        tempMinDay5: texts[15]
    }

    saveJSON(weather, local);
}

//Get the horoscope
module.exports.getHoroscope = async () =>{
    console.log("Updating the horoscope...");

    const url = "https://www.oguru.com.br/horoscopododia";

    const selectors = [
        '.container .row:nth-of-type(2) .col-md-6:nth-of-type(1) p:nth-of-type(1)',
        '.container .row:nth-of-type(2) .col-md-6:nth-of-type(2) p:nth-of-type(1)',
        '.container .row:nth-of-type(3) .col-md-6:nth-of-type(1) p:nth-of-type(1)',
        '.container .row:nth-of-type(3) .col-md-6:nth-of-type(2) p:nth-of-type(1)',
        '.container .row:nth-of-type(4) .col-md-6:nth-of-type(1) p:nth-of-type(1)',
        '.container .row:nth-of-type(4) .col-md-6:nth-of-type(2) p:nth-of-type(1)',
        '.container .row:nth-of-type(5) .col-md-6:nth-of-type(2) p:nth-of-type(1)',
        '.container .row:nth-of-type(5) .col-md-6:nth-of-type(3) p:nth-of-type(1)',
        '.container .row:nth-of-type(6) .col-md-6:nth-of-type(1) p:nth-of-type(1)',
        '.container .row:nth-of-type(6) .col-md-6:nth-of-type(2) p:nth-of-type(1)',
        '.container .row:nth-of-type(7) .col-md-6:nth-of-type(1) p:nth-of-type(1)',
        '.container .row:nth-of-type(7) .col-md-6:nth-of-type(2) p:nth-of-type(1)',
    ]

    const texts = await getElements(url,selectors)

    const horoscope = {
        aries: texts[0],
        touro: texts[1],
        gemeos: texts[2],
        cancer: texts[3],
        leao: texts[4],
        virgem: texts[5],    
        libra: texts[6],
        escorpiao: texts[7],
        sagitario: texts[8],
        capricornio: texts[9],
        aquario: texts[10],
        peixes: texts[11]
    }

    saveJSON(horoscope, 'horoscope');
}

module.exports.getCurrency = async () => {
    console.log("Updating the Dolar and Euro currency...");

    const url = 'https://economia.uol.com.br/cotacoes/';
    
    const selectors = [
        'div[name="grafico"] .hidden-xs a.subtituloGrafico.subtituloGraficoValor',
        'div[name="graficoEuro"] .hidden-xs a.subtituloGrafico.subtituloGraficoValor'
    ]

    const texts = await getElements(url,selectors);

    const currency = {
        dolar: texts[0],
        euro: texts[1]
    }

    saveJSON(currency, 'currency');
}