const fs = require('fs');
const readline = require('readline');
const os = require('os');

function createReadAndWriteStreams(filePath) {
    const readStream = fs.createReadStream(filePath, 'utf-8');
    const writeStream = fs.createWriteStream(filePath + '.tmp', 'utf-8');

    return { readStream, writeStream };
}

function createReadlineInterface(readStream, writeStream) {
    return readline.createInterface({
        input: readStream,
        output: writeStream,
        terminal: false
    });
}

async function processLines(rl, lineNumber, writeStream) {
    let currentLine = 0;

    rl.on('line', (line) => {
        writeStream.write(line + os.EOL);
        if (currentLine === lineNumber) {
            writeStream.write(os.EOL);
        }
        currentLine++;
    });
}

async function replaceFileByTemp(filePath) {
    return new Promise((resolve, reject) => {
        fs.rename(filePath + '.tmp', filePath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

async function code_CA3(filePath, lineNumber) {
    try {
        const { readStream, writeStream } = createReadAndWriteStreams(filePath);
        const rl = createReadlineInterface(readStream, writeStream);
        await processLines(rl, lineNumber + 1, writeStream);
        await new Promise((resolve, reject) => {
            rl.on('close', () => {
                replaceFileByTemp(filePath)
                    .then(resolve)
                    .catch(reject);
            });
            rl.on('error', (err) => {
                reject(err);
            });
        });
        return true;
    } catch (err) {
        console.error('Error adding empty line:', err);
        return false;
    }
}

module.exports = {
    code_CA3: code_CA3
};
