const { code_CA3 } = require('./code_CA3');
const vscode = require('vscode');

function showAutoNormeInformation(relativeFilePath, filePath, lineNumber, codeID, codeDescription) {
    const linePosition = new vscode.Position(lineNumber - 1, 0);
    const selection = new vscode.Range(linePosition, linePosition);

    vscode.window.showInformationMessage(
        `AutoNorme [${codeID}] - ${codeDescription}`,
        {
            title: `${filePath}:${lineNumber}`,
            tooltip: "Click to go to the specified file",
            command: "vscode.open",
            arguments: [
                vscode.Uri.file(relativeFilePath),
                {
                    selection: selection
                }
            ]
        }
    ).then(item => {
        if (item) {
            vscode.commands.executeCommand(item.command, ...item.arguments);
        }
    });
}

function autoNormeSwitcher(code, filePath, relativeFilePath, lineNumber) {
    let tmp;
    switch (code) {
        case 'C-A3':
            tmp = code_CA3(filePath, lineNumber);
            if (tmp) showAutoNormeInformation(filePath, relativeFilePath , lineNumber + 1, 'C-A3', 'Line break at the end of file');
            break;
        default:
            tmp = false;
            break;
    }
    return tmp;
}

module.exports = {
    autoNormeSwitcher: autoNormeSwitcher
}
