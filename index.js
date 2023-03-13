const colors = require('colors');
const { getTemplate1Biddings } = require('./scripts/template1');
const { getTemplate2Biddings } = require('./scripts/template2');
const { getLondrinaBiddings } = require('./scripts/londrina');
const {getTags} = require('./scripts/tags');

console.log('Iniciando busca por licitações.');

async function getAll(){
    // await getLondrinaBiddings();
    // await getTemplate1Biddings('http://venus.maringa.pr.gov.br:8090/portaltransparencia/licitacoes','maringa');
    await getTemplate2Biddings('https://cascavel.atende.net/?pg=autoatendimento#!/tipo/servico/valor/8/padrao/1/load/1','cascavel');
}

getAll();