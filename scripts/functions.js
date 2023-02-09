const puppeteer = require("puppeteer");
const fs = require('fs');
const { METHODS } = require("http");
const Excel = require('exceljs');
const colors = require('colors');

const tags = 
['Telas', 'Tela', 'Material pedagogico', 'Gerenciamento', 'Gerenciamento eletronico', 'Pedagogico', 'Acessibilidade', 'TV Escola', 'TV Prefeitura',
'Lousa Digital', 'Totem', 'Totem de senha', 'Senha', 'Tela interativa', 'Touchscreen', 'Gestao de conteudos', 'tenis'];

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
function saveSheets(filePath){
    const workbook = new Excel.Workbook();

    //If sheet exist update
    if(fs.existsSync(filePath)){
        workbook.xlsx.readFile(filePath).
        then(() =>{
            //Get first worksheet
            const worksheet = workbook.getWorksheet(1);

            //TODO: Add info
            //worksheet.addRow(['Info','Info'])

            //Save
            workbook.xlsx.writeFile(filePath)
            .then(()=>{
                console.log("Planilha salva em " + filePath);
            })
            .catch((error)=>{
                console.log("Error: " + error)
                writeErrorLog("Não foi possivel salvar a planilha");
            })

        }).catch((error)=>{
            console.log("Error: " + error)
            writeErrorLog("Não foi possivel escrever a planilha");
        });
    //Else create new one
    }else{
        const worksheet = workbook.addWorksheet('Sheet 1');

        //TODO: Add info
        //worksheet.addRow(['Info','Info'])

        //Save
        workbook.xlsx.writeFile(filePath)
        .then(()=>{
            console.log("Planilha salva em " + filePath);
        })
        .catch((error)=>{
            console.log("Error: " + error)
            writeErrorLog("Não foi possivel salvar a planilha");
        })
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
    fs.appendFile(`./arquivos/relatorios/ERROR ${date}.txt`, message+'\n', (err) =>{
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
function inspectBiddings(biddings, keywords, approvedBiddings){
    for(let bidding of biddings){
        let wordsBidding = removeAccents(bidding).split(/\W+/);

        for(let word of wordsBidding){
            for(let keyword of keywords){
                if(word === keyword){
                    approvedBiddings.push(bidding);
                }
            }
        }
    }

    return approvedBiddings;
}

function gerarEdital(local){
    return {
        cidade: local,
        objetos: [],
        situacao: [],
        datasAbertura: [],
        editais: [],
        anexos: [],
        numEdital: []
    }
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

                    console.log('Pegando informações para colocar na planilha.');

                    const edital = gerarEdital("Londrina");

                    for(let item of filteredBiddings){
                        console.log('antes do push');
                        edital.objetos.push(item.split('\n')[1].split('Objeto: ')[1]);
                        edital.situacao.push(item.split('\n')[2].split("Situação: ")[1]);
                        edital.datasAbertura.push(item.split('\n')[3].split(" ")[1]);
                        edital.numEdital.push(getNoticeNumber(item));

                        //Find the correct button to get the notice
                        const editalButton = await page.evaluateHandle(() => {
                            console.log("Entrei no evaluate")
                            const buttons = Array.from(document.querySelectorAll('p > a'));
                            return buttons.find(button => button.textContent === item.split('\n')[0]);
                        });
                        
                        page.eva

                        await editalButton.click();
                        await page.waitForNavigation();

                        const editalLink = await page.evaluateHandle(() => {
                            const buttons = Array.from(document.querySelectorAll('a'));
                            return buttons.find(button => button.textContent.toLowerCase() === "edital e anexos");
                        });

                        console.log(editalLink);                        
                    }


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