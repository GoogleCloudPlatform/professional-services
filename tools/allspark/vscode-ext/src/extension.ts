import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
const os = require('os');
const path = require('path');

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "ALL Sparks" is now active!');

    let command = vscode.commands.registerCommand('ALL Sparks.apiCall', async () => {
        const panel = vscode.window.createWebviewPanel(
            'apiCallForm',
            'ALL Sparks',
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );

        const htmlFilePath = vscode.Uri.joinPath(context.extensionUri, 'src', 'index.html');
        const htmlContent = await fs.readFile(htmlFilePath.fsPath, 'utf-8');
        panel.webview.html = htmlContent;

        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'executeCommand') {
                await executeGCloudCommand(panel);
            } else if (message.command === 'readFile') {
                const filePath = message.filePath;
                const { token, projectId } = await readCredentialsFile(filePath);
                panel.webview.postMessage({ command: 'fileContent', token, projectId });
            }
        });
    });

    context.subscriptions.push(command);
}

async function executeGCloudCommand(panel: vscode.WebviewPanel): Promise<void> {
    console.log('Starting authentication process...');
    exec('gcloud auth login', async (error: any, stdout: string, stderr: any) => {
        if (error) {
            console.error('Error during authentication:', error);
            return;
        }
        console.log('Authentication successful');
        const credentialsPath = getCredentialsPath();
        const { token, projectId } = await readCredentialsFile(credentialsPath);

        exec('gcloud auth print-access-token', (error: any, stdout: string, stderr: any) => {
            if (error) {
                console.error('Error fetching access token:', error);
                return;
            }
            const accessToken = stdout.trim();
            panel.webview.postMessage({ command: 'accessToken', token: accessToken });

            panel.webview.postMessage({ command: 'authStatus', status: 'Authenticated' });
        });
    });
}

function getCredentialsPath() {
    const platform = os.platform();
    if (platform === 'win32') { // Windows
        return path.join(process.env.APPDATA, 'gcloud', 'application_default_credentials.json');
    } else if (platform === 'darwin') { // macOS
        return path.join(process.env.HOME, '.config', 'gcloud', 'application_default_credentials.json');
    } else { // Linux and other Unix-based systems
        return path.join(process.env.HOME, '.config', 'gcloud', 'application_default_credentials.json');
    }
}

async function readCredentialsFile(filePath: string): Promise<{ token: string, projectId: string }> {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        const jsonData = JSON.parse(data);
        return { token: jsonData.refresh_token, projectId: jsonData.quota_project_id };
    } catch (err) {
        console.error('Error reading or parsing file:', err);
        return { token: '', projectId: '' };
    }
}

export function deactivate() {}
