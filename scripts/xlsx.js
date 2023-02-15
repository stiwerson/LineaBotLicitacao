const fs = require('fs');
const Excel = require('exceljs');

//Saves info in the ExcelFile
module.exports.saveSheets = async (filePath) =>{
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