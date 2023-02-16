const colors = require('colors');
const { getTemplate1Biddings } = require('./scripts/template1');
const { getLondrinaBiddings } = require('./scripts/londrina');
const {getTags} = require('./scripts/tags');

console.log('Iniciando busca por licitações.');

async function getAll(){
    // await getLondrinaBiddings();
    await getTemplate1Biddings('http://venus.maringa.pr.gov.br:8090/portaltransparencia/licitacoes','maringa');
}

getAll();