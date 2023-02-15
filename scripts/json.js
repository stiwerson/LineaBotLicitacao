const fs = require('fs');

//Saves info in the JSON
module.exports.saveJSON = (obj, filename) => {
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
module.exports.getJSON = (filename) => {
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