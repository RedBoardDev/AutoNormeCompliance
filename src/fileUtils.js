const fs = require('fs');
const ignore = require("ignore");

function isExistingPath(filePath) {
    if (fs.existsSync(filePath) === true)
        return true;
    return false;
}

async function getFileContent(filePath) {
    if (isExistingPath(filePath)) {
        const reportContent = await fs.promises.readFile(filePath, 'utf-8');
        return reportContent;
    }
    return '';
}

function isSupportedFile(filePath) {
    if (fs.lstatSync(filePath).isFile() === false)
        return false;
    if (fs.readFileSync(filePath, 'utf-8') === null)
        return false;
    return true;
}

function isIgnoredFile(gitignoreContent, filePath) {
    const gitignoreList = gitignoreContent.split(/\r?\n/);
    const ig = ignore().add(gitignoreList);
    return ig.ignores(filePath);
}

async function deleteFolder(folderPath) {
    if (isExistingPath(folderPath))
        await fs.promises.rm(folderPath, { recursive: true, force: true });
}

function recreateDirectory(directoryPath) {
    if (isExistingPath(directoryPath))
        fs.removeSync(directoryPath);
    fs.mkdirSync(directoryPath);
}

module.exports = {
    isExistingPath: isExistingPath,
    getFileContent: getFileContent,
    isSupportedFile: isSupportedFile,
    isIgnoredFile: isIgnoredFile,
    deleteFolder: deleteFolder,
    recreateDirectory: recreateDirectory
};
