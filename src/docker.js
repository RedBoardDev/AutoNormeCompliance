const vscode = require('vscode');
const Docker = require('dockerode');

async function createDocker() {
    try {
        return new Docker({ socketPath: '/var/run/docker.sock' });
    } catch (error) {
        vscode.window.showErrorMessage('Docker not found. Please install Docker and try again.');
        throw error;
    }
}

async function createContainer(docker, deliveryDir, directoryPath) {
    return docker.createContainer({
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
}

async function attachToContainer(container) {
    return container.attach({ stream: true, stdout: true, stderr: true });
}

function handleContainerStream(container, stream) {
    container.modem.demuxStream(stream, process.stdout, process.stderr);
    return new Promise((resolve) => {
        stream.on('end', async () => {
            await container.remove();
            resolve();
        });
    });
}

async function runDockerScript(deliveryDir, directoryPath) {
    try {
        const docker = await createDocker();
        const container = await createContainer(docker, deliveryDir, directoryPath);
        await container.start();
        const stream = await attachToContainer(container);
        await handleContainerStream(container, stream);
    } catch (error) {
        vscode.window.showErrorMessage('Failed to run Docker script: ' + error.message);
        throw error;
    }
}

module.exports = {
    runDockerScript: runDockerScript,
};
