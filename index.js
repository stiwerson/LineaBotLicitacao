const colors = require('colors');
const functions = require('./scripts/functions');

console.log('Iniciando busca por licitações.');

async function getAll(){
    await functions.getLondrinaBiddings();
}

getAll();