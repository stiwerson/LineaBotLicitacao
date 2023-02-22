const fs = require('fs');

//Gets tags from tags.txt and return as an array;
module.exports.getTags = (path) => {
    return new Promise((resolve, reject) => {
      fs.readFile(path, 'utf-8', (error, data) => {
        if (error) {
          reject(error);
        } else {
          const tags = data.split(', ').map(word => word.toLowerCase());
          // Removes a \n on the last array element
          tags[tags.length - 1] = tags[tags.length - 1].trim();
          resolve(tags);
        }
      });
    });
  };

module.exports.getStatus = () => {
  return ['aguardando abertura', 'em andamento', 'deserta', 'descartada'];
}