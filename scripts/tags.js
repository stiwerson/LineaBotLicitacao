const fs = require('fs');

//Gets tags from tags.txt and return as an array;
module.exports.getTags = async(path) => {
    const fileTags = fs.readFileSync(path, 'utf-8');

    const tags = fileTags.split(', ');

    //Removes a \n on the last array element
    tags[tags.length - 1] = tags[tags.length - 1].trim();

    return tags;
}