const vscode = require('vscode');
const path = require('path');
const { runDockerScript } = require('./docker');
const { isExistingPath, getFileContent, deleteFolder, recreateDirectory } = require('./fileUtils');
const { reportCodingStyleDiagnostics, removeDiagnosticsOnLineChange } = require('./diagnostics');

async function processCodingStyleReports(deliveryDir, directoryPath) {
    await runDockerScript(deliveryDir, directoryPath);
    const filePath = path.join(directoryPath, 'coding-style-reports.log');
    if (isExistingPath(filePath)) {
        const fileContent = await getFileContent(filePath);
        deleteFolder(directoryPath);
        reportCodingStyleDiagnostics(deliveryDir, fileContent);
    } else {
        vscode.window.showErrorMessage('Report file not found.');
    }
}

async function handleCheckCodingStyleCommand() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder is open.');
        return;
    }
    const deliveryDir = workspaceFolders[0].uri.fsPath;
    const directoryPath = path.join(deliveryDir, 'reports');
    try {
        recreateDirectory(directoryPath);
        await processCodingStyleReports(deliveryDir, directoryPath);
    } catch (error) {
        vscode.window.showErrorMessage('An error occurred: ' + error.message);
    } finally {
        await deleteFolder(directoryPath);
    }
}

function registerCommands(context) {
    const disposable = vscode.commands.registerCommand('extension.checkCodingStyle', handleCheckCodingStyleCommand);
    context.subscriptions.push(disposable);
}

function registerButtons(context) {
    const statusBarBtn = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarBtn.command = 'extension.checkCodingStyle';
    statusBarBtn.text = 'CodingStyle';
    statusBarBtn.tooltip = 'Click to check the coding style';
    context.subscriptions.push(statusBarBtn);
    statusBarBtn.show();
}

function registerEvents() {
    vscode.workspace.onDidChangeTextDocument((event) => {
        removeDiagnosticsOnLineChange(event);
    });
}

function activate(context) {
    registerButtons(context);
    registerCommands(context);
    registerEvents();
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}
