"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
class MCPServerItem extends vscode.TreeItem {
    constructor(name, config, status) {
        super(name, vscode.TreeItemCollapsibleState.None);
        this.name = name;
        this.config = config;
        this.status = status;
        this.contextValue = 'mcpServer';
        this.tooltip = `${name}: ${status}`;
        // Set icon based on status
        switch (status) {
            case 'running':
                this.iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('testing.iconPassed'));
                break;
            case 'stopped':
                this.iconPath = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('testing.iconFailed'));
                break;
            case 'error':
                this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconErrored'));
                break;
            default:
                this.iconPath = new vscode.ThemeIcon('question', new vscode.ThemeColor('testing.iconUnset'));
        }
        this.description = `${config.command} ${config.args.join(' ')}`.substring(0, 50) + '...';
    }
}
class MCPServersProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.servers = [];
        this.runningProcesses = new Map();
        this.refresh();
    }
    refresh() {
        this.loadMCPServers();
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return Promise.resolve(this.servers);
        }
        return Promise.resolve([]);
    }
    async loadMCPServers() {
        try {
            const mcpConfigPath = this.getMCPConfigPath();
            if (!mcpConfigPath || !fs.existsSync(mcpConfigPath)) {
                vscode.window.showWarningMessage('MCP configuration file not found. Please set the path in settings.');
                this.servers = [];
                return;
            }
            const configContent = fs.readFileSync(mcpConfigPath, 'utf8');
            const config = JSON.parse(configContent);
            this.servers = [];
            for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
                const status = await this.checkServerStatus(name, serverConfig);
                this.servers.push(new MCPServerItem(name, serverConfig, status));
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to load MCP servers: ${error}`);
            this.servers = [];
        }
    }
    getMCPConfigPath() {
        const config = vscode.workspace.getConfiguration('cursor-mcp-refresh');
        let configPath = config.get('mcpConfigPath', '');
        if (!configPath) {
            // Try common locations
            const homeDir = process.env.HOME || process.env.USERPROFILE || '';
            const possiblePaths = [
                path.join(homeDir, 'mcp.json'),
                path.join(homeDir, '.config', 'mcp.json'),
                path.join(vscode.workspace.rootPath || '', 'mcp.json')
            ];
            for (const possiblePath of possiblePaths) {
                if (fs.existsSync(possiblePath)) {
                    configPath = possiblePath;
                    break;
                }
            }
        }
        return configPath;
    }
    async checkServerStatus(name, config) {
        // Check if we have a running process for this server
        if (this.runningProcesses.has(name)) {
            const process = this.runningProcesses.get(name);
            if (process && !process.killed) {
                return 'running';
            }
            else {
                this.runningProcesses.delete(name);
                return 'stopped';
            }
        }
        // For now, return unknown - in a real implementation, you'd ping the server
        return 'unknown';
    }
    async refreshServer(serverName) {
        const server = this.servers.find(s => s.name === serverName);
        if (!server) {
            vscode.window.showErrorMessage(`Server ${serverName} not found`);
            return;
        }
        await this.stopServer(serverName);
        await this.startServer(serverName, server.config);
        this.refresh();
        vscode.window.showInformationMessage(`Refreshed MCP server: ${serverName}`);
    }
    async refreshAllServers() {
        const refreshPromises = this.servers.map(server => this.refreshServer(server.name));
        await Promise.all(refreshPromises);
        vscode.window.showInformationMessage('All MCP servers refreshed');
    }
    async stopServer(serverName) {
        const process = this.runningProcesses.get(serverName);
        if (process && !process.killed) {
            process.kill();
            this.runningProcesses.delete(serverName);
            // Wait a bit for the process to fully terminate
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    async startServer(serverName, config) {
        try {
            const process = (0, child_process_1.spawn)(config.command, config.args, {
                env: { ...process.env, ...config.env },
                stdio: 'pipe'
            });
            this.runningProcesses.set(serverName, process);
            process.on('error', (error) => {
                console.error(`Server ${serverName} error:`, error);
                this.runningProcesses.delete(serverName);
            });
            process.on('exit', (code) => {
                console.log(`Server ${serverName} exited with code ${code}`);
                this.runningProcesses.delete(serverName);
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to start server ${serverName}: ${error}`);
        }
    }
}
function activate(context) {
    const mcpProvider = new MCPServersProvider();
    // Register the tree data provider
    const treeView = vscode.window.createTreeView('mcpServersView', {
        treeDataProvider: mcpProvider,
        showCollapseAll: true
    });
    // Register commands
    const refreshAllCommand = vscode.commands.registerCommand('cursor-mcp-refresh.refreshServers', () => {
        mcpProvider.refreshAllServers();
    });
    const refreshSingleCommand = vscode.commands.registerCommand('cursor-mcp-refresh.refreshSingleServer', (item) => {
        if (item && item.name) {
            mcpProvider.refreshServer(item.name);
        }
    });
    // Auto-refresh functionality
    const config = vscode.workspace.getConfiguration('cursor-mcp-refresh');
    const autoRefreshInterval = config.get('autoRefreshInterval', 0);
    if (autoRefreshInterval > 0) {
        const intervalId = setInterval(() => {
            mcpProvider.refresh();
        }, autoRefreshInterval * 1000);
        context.subscriptions.push({
            dispose: () => clearInterval(intervalId)
        });
    }
    // Add status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(server-process) MCP";
    statusBarItem.tooltip = "MCP Servers";
    statusBarItem.command = 'cursor-mcp-refresh.refreshServers';
    statusBarItem.show();
    context.subscriptions.push(treeView, refreshAllCommand, refreshSingleCommand, statusBarItem);
    // Show welcome message
    vscode.window.showInformationMessage('Cursor MCP Server Refresh extension activated!');
}
exports.activate = activate;
function deactivate() {
    // Cleanup if needed
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map