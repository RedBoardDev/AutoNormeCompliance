const vscode = require('vscode');
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

async function runDockerScript(deliveryDir, reportsDir) {
    return new Promise(async (resolve, reject) => {
        try {
            const container = await docker.createContainer({
                Image: 'ghcr.io/epitech/coding-style-checker:latest',
                Cmd: ['/mnt/delivery', '/mnt/reports'],
                HostConfig: {
                    Binds: [
                        `${deliveryDir}:/mnt/delivery`,
                        `${reportsDir}:/mnt/reports`
                    ]
                },
                AttachStdout: true,
                AttachStderr: true
            });
            await container.start();
            const stream = await container.attach({stream: true, stdout: true, stderr: true});
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

async function commentLines(deliveryDir, reportFilePath) {
    const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
    const lines = reportContent.split('\n');

    for (const line of lines) {
        const match = line.match(/^(.+\.c):(\d+):/);
        if (match) {
            const filePath = path.join(deliveryDir, match[1]);
            const lineNumber = parseInt(match[2], 10) - 1;
            try {
                const document = await vscode.workspace.openTextDocument(filePath);
                const editor = await vscode.window.showTextDocument(document);
                await editor.edit((editBuilder) => {
                    const lineLength = document.lineAt(lineNumber).range.end.character;
                    editBuilder.insert(new vscode.Position(lineNumber, lineLength), ' // CODING STYLE');
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to comment line in file: ${filePath}, error: ${error.message}`);
            }
        }
    }
}

function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
    }
}

function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.checkCodingStyle', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder is open.');
            return;
        }
        const deliveryDir = workspaceFolders[0].uri.fsPath;
        const reportsDir = path.join(deliveryDir, 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir);
        }
        await runDockerScript(deliveryDir, reportsDir);
        const reportFilePath = path.join(reportsDir, 'coding-style-reports.log');
        if (fs.existsSync(reportFilePath)) {
            vscode.window.showInformationMessage(`Coding style report generated at: ${reportFilePath}`);
            await commentLines(deliveryDir, reportFilePath);
            deleteFolderRecursive(reportsDir);
        } else {
            vscode.window.showErrorMessage('Report file not found.');
        }
    });
    context.subscriptions.push(disposable);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}
