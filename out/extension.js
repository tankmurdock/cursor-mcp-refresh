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
        console.log('MCP Extension: Loading MCP servers...');
        try {
            const mcpConfigPath = this.getMCPConfigPath();
            console.log('MCP Extension: Config path:', mcpConfigPath);
            if (!mcpConfigPath) {
                console.log('MCP Extension: No config path found');
                vscode.window.showWarningMessage('MCP configuration file not found. Please set the path in settings or place mcp.json in your home directory.');
                this.servers = [];
                return;
            }
            if (!fs.existsSync(mcpConfigPath)) {
                console.log('MCP Extension: Config file does not exist:', mcpConfigPath);
                vscode.window.showWarningMessage(`MCP configuration file not found at: ${mcpConfigPath}`);
                this.servers = [];
                return;
            }
            const stat = fs.statSync(mcpConfigPath);
            if (!stat.isFile()) {
                console.log('MCP Extension: Path is not a file:', mcpConfigPath);
                vscode.window.showErrorMessage(`MCP configuration path is not a file: ${mcpConfigPath}. Please specify the full path to mcp.json`);
                this.servers = [];
                return;
            }
            const configContent = fs.readFileSync(mcpConfigPath, 'utf8');
            console.log('MCP Extension: Config content loaded, length:', configContent.length);
            const config = JSON.parse(configContent);
            console.log('MCP Extension: Parsed config, servers found:', Object.keys(config.mcpServers || {}).length);
            this.servers = [];
            if (config.mcpServers) {
                for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
                    console.log('MCP Extension: Processing server:', name);
                    const status = await this.checkServerStatus(name, serverConfig);
                    this.servers.push(new MCPServerItem(name, serverConfig, status));
                }
            }
            console.log('MCP Extension: Total servers loaded:', this.servers.length);
        }
        catch (error) {
            console.error('MCP Extension: Error loading servers:', error);
            if (error instanceof Error) {
                if (error.message.includes('EISDIR')) {
                    vscode.window.showErrorMessage('MCP config path points to a directory. Please specify the full path to mcp.json file in settings.');
                }
                else if (error.message.includes('ENOENT')) {
                    vscode.window.showErrorMessage('MCP configuration file not found. Please check the path in settings.');
                }
                else {
                    vscode.window.showErrorMessage(`Failed to load MCP servers: ${error.message}`);
                }
            }
            else {
                vscode.window.showErrorMessage(`Failed to load MCP servers: ${error}`);
            }
            this.servers = [];
        }
    }
    getMCPConfigPath() {
        const config = vscode.workspace.getConfiguration('cursor-mcp-refresh');
        let configPath = config.get('mcpConfigPath', '');
        console.log('MCP Extension: Initial config path from settings:', configPath);
        if (!configPath) {
            // Try common locations
            const homeDir = process.env.HOME || process.env.USERPROFILE || '';
            const possiblePaths = [
                path.join(homeDir, 'mcp.json'),
                path.join(homeDir, '.cursor', 'mcp.json'),
                path.join(homeDir, '.config', 'cursor', 'mcp.json'),
                path.join(homeDir, 'AppData', 'Roaming', 'Cursor', 'User', 'globalStorage', 'mcp.json'),
                path.join(homeDir, 'AppData', 'Roaming', 'Cursor', 'User', 'mcp.json'),
                path.join(vscode.workspace.rootPath || '', 'mcp.json')
            ];
            console.log('MCP Extension: Checking possible paths:', possiblePaths);
            for (const possiblePath of possiblePaths) {
                console.log('MCP Extension: Checking path:', possiblePath);
                if (fs.existsSync(possiblePath)) {
                    const stat = fs.statSync(possiblePath);
                    if (stat.isFile()) {
                        console.log('MCP Extension: Found config file at:', possiblePath);
                        configPath = possiblePath;
                        break;
                    }
                    else {
                        console.log('MCP Extension: Path exists but is not a file:', possiblePath);
                    }
                }
            }
        }
        else {
            // Check if the provided path is a directory and try to find mcp.json in it
            if (fs.existsSync(configPath)) {
                const stat = fs.statSync(configPath);
                if (stat.isDirectory()) {
                    console.log('MCP Extension: Provided path is a directory, looking for mcp.json inside');
                    const jsonPath = path.join(configPath, 'mcp.json');
                    if (fs.existsSync(jsonPath) && fs.statSync(jsonPath).isFile()) {
                        configPath = jsonPath;
                        console.log('MCP Extension: Found mcp.json in directory:', configPath);
                    }
                    else {
                        console.log('MCP Extension: No mcp.json found in directory:', configPath);
                        configPath = '';
                    }
                }
            }
        }
        console.log('MCP Extension: Final config path:', configPath);
        return configPath;
    }
    async checkServerStatus(name, config) {
        // Check if we have a running process for this server
        if (this.runningProcesses.has(name)) {
            const childProcess = this.runningProcesses.get(name);
            if (childProcess && !childProcess.killed) {
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
        const childProcess = this.runningProcesses.get(serverName);
        if (childProcess && !childProcess.killed) {
            childProcess.kill();
            this.runningProcesses.delete(serverName);
            // Wait a bit for the process to fully terminate
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    async startServer(serverName, config) {
        try {
            const childProcess = (0, child_process_1.spawn)(config.command, config.args, {
                env: { ...process.env, ...config.env },
                stdio: 'pipe'
            });
            this.runningProcesses.set(serverName, childProcess);
            childProcess.on('error', (error) => {
                console.error(`Server ${serverName} error:`, error);
                this.runningProcesses.delete(serverName);
            });
            childProcess.on('exit', (code) => {
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
    console.log('MCP Extension: Activating...');
    const mcpProvider = new MCPServersProvider();
    // Register the tree data provider
    const treeView = vscode.window.createTreeView('mcpServersView', {
        treeDataProvider: mcpProvider,
        showCollapseAll: true
    });
    console.log('MCP Extension: Tree view created');
    // Register commands
    const refreshAllCommand = vscode.commands.registerCommand('cursor-mcp-refresh.refreshServers', () => {
        console.log('MCP Extension: Refresh all servers command triggered');
        mcpProvider.refreshAllServers();
    });
    const refreshSingleCommand = vscode.commands.registerCommand('cursor-mcp-refresh.refreshSingleServer', (item) => {
        console.log('MCP Extension: Refresh single server command triggered for:', item?.name);
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
    console.log('MCP Extension: Status bar item created');
    context.subscriptions.push(treeView, refreshAllCommand, refreshSingleCommand, statusBarItem);
    // Show welcome message
    vscode.window.showInformationMessage('Cursor MCP Server Refresh extension activated!');
    console.log('MCP Extension: Activation complete');
}
exports.activate = activate;
function deactivate() {
    // Cleanup if needed
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map