const vscode = require('vscode');
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const diagnosticsCollection = vscode.languages.createDiagnosticCollection('CodingStyle');

async function runDockerScript(deliveryDir, directoryPath) {
    return new Promise(async (resolve, reject) => {
        try {
            const container = await docker.createContainer({
                Image: 'ghcr.io/epitech/coding-style-checker:latest',
                Cmd: ['/mnt/delivery', '/mnt/reports'],
                HostConfig: {
                    Binds: [
                        `${deliveryDir}:/mnt/delivery`,
                        `${directoryPath}:/mnt/reports`
                    ]
                },
                AttachStdout: true,
                AttachStderr: true
            });
            await container.start();
            const stream = await container.attach({ stream: true, stdout: true, stderr: true });
            container.modem.demuxStream(stream, process.stdout, process.stderr);

            stream.on('end', async () => {
                await container.remove();
                resolve();
            });
        } catch (error) {
            vscode.window.showErrorMessage('Failed to run Docker script: ' + error.message);
            reject(error);
        }
    });
}

async function getFileContent(filePath) {
    if (fs.existsSync(filePath)) {
        const reportContent = await fs.promises.readFile(filePath, 'utf-8');
        return reportContent;
    }
    return '';
}

function reportCodingStyleDiagnostics(deliveryDir, fileContent) {
    const lines = fileContent.split('\n');
    const fileDiagnosticsMap = new Map();

    lines.forEach(line => {
        const match = line.match(/^(.+\.c):(\d+):/i);
        if (!match)
            return;
        const filePath = path.join(deliveryDir, match[1]);
        if (!fs.lstatSync(filePath).isFile() || path.extname(filePath) !== '.c')
            return;

        const lineNumber = parseInt(match[2], 10) - 1;
        const severityMatch = line.match(/:(\s*)(MAJOR|MINOR|INFO):/);
        const codeMatch = line.match(/:(\s*)(C-F\d+)/);
        const severity = (severityMatch && severityMatch[2]) || 'N/A';
        const code = (codeMatch && codeMatch[2]) || '';
        const diagnosticMessage = `[${severity}] Coding style error ${code}`;

        const range = new vscode.Range(new vscode.Position(lineNumber, 0), new vscode.Position(lineNumber, Number.MAX_VALUE));
        const diagnostic = new vscode.Diagnostic(range, diagnosticMessage, vscode.DiagnosticSeverity.Warning);

        const diagnostics = fileDiagnosticsMap.get(filePath) || [];
        diagnostics.push(diagnostic);
        fileDiagnosticsMap.set(filePath, diagnostics);
    });
    fileDiagnosticsMap.forEach((diagnostics, filePath) => {
        const uri = vscode.Uri.file(filePath);
        diagnosticsCollection.set(uri, diagnostics);
    });
}

async function deleteFolder(folderPath) {
    if (fs.existsSync(folderPath)) {
        await fs.promises.rm(folderPath, { recursive: true, force: true });
    }
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

function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.checkCodingStyle', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder is open.');
            return;
        }
        const deliveryDir = workspaceFolders[0].uri.fsPath;
        const directoryPath = path.join(deliveryDir, 'reports');
        try {
            if (fs.existsSync(directoryPath)) {
                fs.removeSync(directoryPath);
            }
            fs.mkdirSync(directoryPath);
            await runDockerScript(deliveryDir, directoryPath);
            const filePath = path.join(directoryPath, 'coding-style-reports.log');
            if (fs.existsSync(filePath)) {
                const fileContent = await getFileContent(filePath);
                reportCodingStyleDiagnostics(deliveryDir, fileContent);
                await deleteFolder(directoryPath);
            } else {
                vscode.window.showErrorMessage('Report file not found.');
            }
        } catch (error) {
            vscode.window.showErrorMessage('An error occurred: ' + error.message);
        } finally {
            await deleteFolder(directoryPath);
        }
    });
    context.subscriptions.push(disposable);
    vscode.workspace.onDidChangeTextDocument((event) => {
        removeDiagnosticsOnLineChange(event);
    });

}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}
