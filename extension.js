const vscode = require('vscode');
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

async function runDockerScript(deliveryDir, reportsDir) {
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
        const stream = await container.attach({ stream: true, stdout: true, stderr: true });
        container.modem.demuxStream(stream, process.stdout, process.stderr);
        stream.on('end', async () => {
            await container.remove();
        });
    } catch (error) {
        vscode.window.showErrorMessage('Failed to run Docker script: ' + error.message);
    }
}

// function deleteFolderRecursive(folderPath) {
//     if (fs.existsSync(folderPath)) {
//         fs.readdirSync(folderPath).forEach((file) => {
//             const curPath = path.join(folderPath, file);
//             if (fs.lstatSync(curPath).isDirectory()) {
//                 deleteFolderRecursive(curPath);
//             } else {
//                 fs.unlinkSync(curPath);
//             }
//         });
//         fs.rmdirSync(folderPath);
//     }
// }

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
            const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
            vscode.window.showInformationMessage(`Coding style report generated at: ${reportFilePath}`);
            const document = await vscode.workspace.openTextDocument(reportFilePath);
            vscode.window.showTextDocument(document);
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
