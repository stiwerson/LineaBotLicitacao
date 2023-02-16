const fs = require('fs');
const {getCurrentDate} = require('./dateGenerator');

//Error log to register in arquivos/relatorios
module.exports.writeErrorLog = async (message) => {
    const date = await getCurrentDate();
    fs.appendFile(`./arquivos/relatorios/Relatorio ${date}.txt`, message+'\n\n', (err) =>{
        if(err){
            console.log("Não foi possivel escrever no relatorio: " + err);
        }else{
            console.log("Registrado informação com sucesso no relatorio.")
        }
    })
}