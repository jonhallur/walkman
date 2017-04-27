/**
 * Created by jonhallur on 26.4.2017.
 */
var fs = require('fs');
var path = require('path');
var menu = require('node-menu');
var xml2js = require('xml2js');
var WALKMANPATH = '/media/jonhallur/WALKMAN/MUSIC';
var MEDIAPATH = '/media/jonhallur';
var directories = null;


function getDirectories(srcPath) {
    return fs.readdirSync(srcPath)
        .filter(file => fs.statSync(path.join(srcPath, file)).isDirectory())
}

function getCDPath() {
    var medias = getDirectories(MEDIAPATH);
    for (var i=0; i < medias.length; i++) {
        var path = [MEDIAPATH, medias[i], 'master.smil'].join('/');
        if(fs.existsSync(path)) {
            return [MEDIAPATH, medias[i]].join('/')
        }
    }
    return null;
}

function sanitizeFilename(word) {
    var charMap = [
        {from: 'á', to: 'a'},
        {from: 'ð', to: 'd'},
        {from: 'é', to: 'e'},
        {from: 'í', to: 'i'},
        {from: 'ó', to: 'o'},
        {from: 'ú', to: 'u'},
        {from: 'ý', to: 'y'},
        {from: 'þ', to: 'th'},
        {from: 'æ', to: 'ae'},
        {from: 'ö', to: 'o'},
        {from: ':', to: '-'}
    ];
    for(var char of charMap) {
        word = word.replace(new RegExp(char.from, 'g'), char.to);
    }
    return word

}

function copyFilesToWalkman(bookName, cdPath) {
    fs.mkdirSync([WALKMANPATH, bookName].join('/'));
    var fileList = fs.readdirSync(cdPath);
    for (var file of fileList) {
        console.log("Copying ", file);
        var input = fs.readFileSync([cdPath, file].join('/'));
        fs.writeFileSync([WALKMANPATH, bookName, file].join('/'), input);
    }
    process.stderr.write('\007');
}
function copyFiles(cdPath) {
    var xmldata = fs.readFileSync([cdPath, 'master.smil'].join('/'));
    var parser = new xml2js.Parser();
    var bookName = '';
    parser.parseString(xmldata, (err, results) => {
        var name = results.smil.head[0].meta[0]['$'].content;
        var wordList = name.split(' ');
        wordList = wordList.map(word => word.toLowerCase());
        wordList = wordList.map(word => sanitizeFilename(word));
        var capitalList = wordList.map((word) => word.charAt(0).toUpperCase() + word.slice(1));
        bookName = capitalList.join('');
        copyFilesToWalkman(bookName, cdPath);
    })
}

function checkForMp3Files() {
    var medias = getDirectories(MEDIAPATH);
    for (var directory of medias) {
        var fileList = fs.readdirSync([MEDIAPATH, directory].join('/'));
        for (var filename of fileList) {
            if (filename.startsWith('01_') && filename.endsWith('.mp3')) {
                return {dir: [MEDIAPATH, directory].join('/'), name: filename.slice(3,-4)}
            }
            else if (filename.startsWith('001_') && filename.endsWith('.mp3')) {
                return {name: filename.slice(4, -4), dir: [MEDIAPATH, directory].join('/')}
            }
        }
    }
}

function addBook() {
    var cdPath = getCDPath();
    var pathAndName = null;
    if (cdPath) {
        console.log("start Copying");
        copyFiles(cdPath);
    }
    else if(pathAndName = checkForMp3Files())  {
        copyFilesToWalkman(pathAndName.name, pathAndName.dir);
    }
    else {
        console.log("No CD Found");
    }

}

function deleteBook() {

}

function seeAllBooks() {
    console.log("\nBooks on the WALKMAN\n");
    directories = getDirectories(WALKMANPATH);
    directories.forEach(item => console.log(item));
    console.log("\n")
}

function mainMenu() {
    menu.customHeader(
        () => process.stdout.write("\n WALKMAN editor\n\n")
    ).customPrompt(
        () => process.stdout.write("\nPlease select a number\n")
    ).addItem(
        "Add book to WALKMAN",
        addBook,
        null
    ).addItem(
        "Delete book from WALKMAN",
        deleteBook,
        null
    ).addItem(
        "See all books on WALKMAN",
        seeAllBooks,
        null
    ).start();
}

function run() {
    directories = getDirectories(WALKMANPATH);
    mainMenu();
}





run();