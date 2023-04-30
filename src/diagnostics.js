const path = require('path');
const vscode = require('vscode');
const { getFileContent, isSupportedFile, isIgnoredFile } = require('./fileUtils');
const { autoNormeSwitcher } = require("./autonorme/autoNormeSwitcher");

const diagnosticsCollection = vscode.languages.createDiagnosticCollection('CodingStyle');

function createDiagnosticFromMatch(match, lineNumber, typeBool) {
    const severity = match[3] || 'N/A';
    const code = match[4] || '';
    const diagnosticMessage = `[${severity}] Coding style error ${code}`;
    const type = (typeBool === false ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Information);
    const range = new vscode.Range(new vscode.Position(lineNumber, 0), new vscode.Position(lineNumber, Number.MAX_VALUE));
    const diagnostic = new vscode.Diagnostic(range, diagnosticMessage, type);
    return diagnostic;
}

function processLine(line, deliveryDir, gitignoreContent, fileDiagnosticsMap) {
    let tmpBool = false;
    const match = line.match(/^(.+?):(\d+): (MAJOR|MINOR|INFO):([A-Z]-[A-Z]\d+)/i);
    if (!match)
        return;
    const filePath = path.join(deliveryDir, match[1]);
    const relativeFilePath = match[1].replace(/^\.\//, '');
    if (!isSupportedFile(filePath) || isIgnoredFile(gitignoreContent, relativeFilePath) === true)
        return;
    const lineNumber = parseInt(match[2]) - 1;
    if (match[4]) {
        console.log(filePath, relativeFilePath);
        tmpBool = autoNormeSwitcher(match[4], filePath, relativeFilePath, lineNumber)
    }
    const diagnostic = createDiagnosticFromMatch(match, lineNumber, tmpBool);
    const diagnosticFiles = fileDiagnosticsMap.get(filePath) || [];
    diagnosticFiles.push(diagnostic);
    fileDiagnosticsMap.set(filePath, diagnosticFiles);
}

async function reportCodingStyleDiagnostics(deliveryDir, fileContent) {
    const lines = fileContent.split('\n');
    const fileDiagnosticsMap = new Map();
    const gitignoreContent = await getFileContent(deliveryDir + '/.gitignore');
    lines.forEach(line => {
        processLine(line, deliveryDir, gitignoreContent, fileDiagnosticsMap);
    });
    fileDiagnosticsMap.forEach((diagnostics, filePath) => {
        const uri = vscode.Uri.file(filePath);
        diagnosticsCollection.set(uri, diagnostics);
    });
}

function removeDiagnosticsOnLineChange(event) {
    const documentUri = event.document.uri;
    const diagnostics = diagnosticsCollection.get(documentUri) || [];
    event.contentChanges.forEach(change => {
        const startLine = change.range.start.line;
        const endLine = change.range.end.line;
        const updatedDiagnostics = diagnostics.filter(diagnostic => {
            const diagnosticLine = diagnostic.range.start.line;
            return diagnosticLine < startLine || diagnosticLine > endLine;
        });
        diagnosticsCollection.set(documentUri, updatedDiagnostics);
    });
}

module.exports = {
    reportCodingStyleDiagnostics: reportCodingStyleDiagnostics,
    removeDiagnosticsOnLineChange: removeDiagnosticsOnLineChange,
};
