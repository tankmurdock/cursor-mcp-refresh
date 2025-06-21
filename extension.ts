import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { spawn, ChildProcess } from "child_process";

interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

class MCPServerItem extends vscode.TreeItem {
  constructor(
    public readonly name: string,
    public readonly config: MCPServerConfig,
    public readonly status: "running" | "stopped" | "error" | "unknown"
  ) {
    super(name, vscode.TreeItemCollapsibleState.None);

    this.contextValue = "mcpServer";
    this.tooltip = `${name}: ${status}`;

    // Set icon based on status
    switch (status) {
      case "running":
        this.iconPath = new vscode.ThemeIcon(
          "circle-filled",
          new vscode.ThemeColor("testing.iconPassed")
        );
        break;
      case "stopped":
        this.iconPath = new vscode.ThemeIcon(
          "circle-outline",
          new vscode.ThemeColor("testing.iconFailed")
        );
        break;
      case "error":
        this.iconPath = new vscode.ThemeIcon(
          "error",
          new vscode.ThemeColor("testing.iconErrored")
        );
        break;
      default:
        this.iconPath = new vscode.ThemeIcon(
          "question",
          new vscode.ThemeColor("testing.iconUnset")
        );
    }

    this.description =
      `${config.command} ${config.args.join(" ")}`.substring(0, 50) + "...";
  }
}

class MCPServersProvider implements vscode.TreeDataProvider<MCPServerItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    MCPServerItem | undefined | null | void
  > = new vscode.EventEmitter<MCPServerItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    MCPServerItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private servers: MCPServerItem[] = [];
  private runningProcesses: Map<string, ChildProcess> = new Map();
  private enabledServers: Set<string> = new Set();

  constructor() {
    this.loadEnabledServers();
    this.refresh();
  }

  refresh(): void {
    this.loadMCPServers();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: MCPServerItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: MCPServerItem): Thenable<MCPServerItem[]> {
    if (!element) {
      return Promise.resolve(this.servers);
    }
    return Promise.resolve([]);
  }

  private async loadMCPServers(): Promise<void> {
    console.log("MCP Extension: Loading MCP servers...");
    try {
      const mcpConfigPath = this.getMCPConfigPath();
      console.log("MCP Extension: Config path:", mcpConfigPath);

      if (!mcpConfigPath) {
        console.log("MCP Extension: No config path found");
        vscode.window.showWarningMessage(
          "MCP configuration file not found. Please set the path in settings or place mcp.json in your home directory."
        );
        this.servers = [];
        return;
      }

      if (!fs.existsSync(mcpConfigPath)) {
        console.log(
          "MCP Extension: Config file does not exist:",
          mcpConfigPath
        );
        vscode.window.showWarningMessage(
          `MCP configuration file not found at: ${mcpConfigPath}`
        );
        this.servers = [];
        return;
      }

      const stat = fs.statSync(mcpConfigPath);
      if (!stat.isFile()) {
        console.log("MCP Extension: Path is not a file:", mcpConfigPath);
        vscode.window.showErrorMessage(
          `MCP configuration path is not a file: ${mcpConfigPath}. Please specify the full path to mcp.json`
        );
        this.servers = [];
        return;
      }

      const configContent = fs.readFileSync(mcpConfigPath, "utf8");
      console.log(
        "MCP Extension: Config content loaded, length:",
        configContent.length
      );

      const config: MCPConfig = JSON.parse(configContent);
      console.log(
        "MCP Extension: Parsed config, servers found:",
        Object.keys(config.mcpServers || {}).length
      );

      this.servers = [];

      if (config.mcpServers) {
        for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
          console.log("MCP Extension: Processing server:", name);
          const status = await this.checkServerStatus(name, serverConfig);
          this.servers.push(new MCPServerItem(name, serverConfig, status));
        }
      }

      console.log("MCP Extension: Total servers loaded:", this.servers.length);
    } catch (error) {
      console.error("MCP Extension: Error loading servers:", error);
      if (error instanceof Error) {
        if (error.message.includes("EISDIR")) {
          vscode.window.showErrorMessage(
            "MCP config path points to a directory. Please specify the full path to mcp.json file in settings."
          );
        } else if (error.message.includes("ENOENT")) {
          vscode.window.showErrorMessage(
            "MCP configuration file not found. Please check the path in settings."
          );
        } else {
          vscode.window.showErrorMessage(
            `Failed to load MCP servers: ${error.message}`
          );
        }
      } else {
        vscode.window.showErrorMessage(`Failed to load MCP servers: ${error}`);
      }
      this.servers = [];
    }
  }

  private getMCPConfigPath(): string {
    const config = vscode.workspace.getConfiguration("cursor-mcp-refresh");
    let configPath = config.get<string>("mcpConfigPath", "");

    console.log(
      "MCP Extension: Initial config path from settings:",
      configPath
    );

    if (!configPath) {
      // Try common locations
      const homeDir = process.env.HOME || process.env.USERPROFILE || "";
      const possiblePaths = [
        // First check workspace root
        path.join(vscode.workspace.rootPath || "", "mcp.json"),
        // Then check current working directory
        path.join(process.cwd(), "mcp.json"),
        // Then check common locations
        path.join(homeDir, "mcp.json"),
        path.join(homeDir, ".cursor", "mcp.json"),
        path.join(homeDir, ".config", "cursor", "mcp.json"),
        path.join(
          homeDir,
          "AppData",
          "Roaming",
          "Cursor",
          "User",
          "globalStorage",
          "mcp.json"
        ),
        path.join(homeDir, "AppData", "Roaming", "Cursor", "User", "mcp.json"),
      ];

      console.log("MCP Extension: Checking possible paths:", possiblePaths);

      for (const possiblePath of possiblePaths) {
        console.log("MCP Extension: Checking path:", possiblePath);
        if (fs.existsSync(possiblePath)) {
          const stat = fs.statSync(possiblePath);
          if (stat.isFile()) {
            console.log("MCP Extension: Found config file at:", possiblePath);
            configPath = possiblePath;
            break;
          } else {
            console.log(
              "MCP Extension: Path exists but is not a file:",
              possiblePath
            );
          }
        }
      }
    } else {
      // Check if the provided path is a directory and try to find mcp.json in it
      if (fs.existsSync(configPath)) {
        const stat = fs.statSync(configPath);
        if (stat.isDirectory()) {
          console.log(
            "MCP Extension: Provided path is a directory, looking for mcp.json inside"
          );
          const jsonPath = path.join(configPath, "mcp.json");
          if (fs.existsSync(jsonPath) && fs.statSync(jsonPath).isFile()) {
            configPath = jsonPath;
            console.log(
              "MCP Extension: Found mcp.json in directory:",
              configPath
            );
          } else {
            console.log(
              "MCP Extension: No mcp.json found in directory:",
              configPath
            );
            configPath = "";
          }
        }
      }
    }

    console.log("MCP Extension: Final config path:", configPath);
    return configPath;
  }

  private async checkServerStatus(
    name: string,
    config: MCPServerConfig
  ): Promise<"running" | "stopped" | "error" | "unknown"> {
    // Check if we have a running process for this server
    if (this.runningProcesses.has(name)) {
      const childProcess = this.runningProcesses.get(name);
      if (childProcess && !childProcess.killed) {
        return "running";
      } else {
        this.runningProcesses.delete(name);
        return "stopped";
      }
    }

    // For now, return unknown - in a real implementation, you'd ping the server
    return "unknown";
  }

  public async refreshServer(serverName: string): Promise<void> {
    const server = this.servers.find((s) => s.name === serverName);
    if (!server) {
      vscode.window.showErrorMessage(`Server ${serverName} not found`);
      return;
    }

    await this.stopServer(serverName);
    await this.startServer(serverName, server.config);
    this.refresh();

    vscode.window.showInformationMessage(`Refreshed MCP server: ${serverName}`);
  }

  public async refreshAllServers(): Promise<void> {
    const refreshPromises = this.servers.map((server) =>
      this.refreshServer(server.name)
    );

    await Promise.all(refreshPromises);
    vscode.window.showInformationMessage("All MCP servers refreshed");
  }

  public async refreshEnabledServers(): Promise<void> {
    const enabledServersList = this.servers.filter((server) =>
      this.enabledServers.has(server.name)
    );

    if (enabledServersList.length === 0) {
      vscode.window.showWarningMessage(
        "No MCP servers are enabled. Use the server selector to enable servers."
      );
      return;
    }

    const refreshPromises = enabledServersList.map((server) =>
      this.refreshServer(server.name)
    );

    await Promise.all(refreshPromises);
    vscode.window.showInformationMessage(
      `Refreshed ${enabledServersList.length} enabled MCP servers`
    );
  }

  private loadEnabledServers(): void {
    const config = vscode.workspace.getConfiguration("cursor-mcp-refresh");
    const enabledServersList = config.get<string[]>("enabledServers", []);
    this.enabledServers = new Set(enabledServersList);
  }

  private async saveEnabledServers(): Promise<void> {
    const config = vscode.workspace.getConfiguration("cursor-mcp-refresh");
    await config.update(
      "enabledServers",
      Array.from(this.enabledServers),
      vscode.ConfigurationTarget.Global
    );
  }

  public async showServerSelector(): Promise<void> {
    if (this.servers.length === 0) {
      vscode.window.showWarningMessage(
        "No MCP servers found. Please check your mcp.json configuration."
      );
      return;
    }

    const items = this.servers.map((server) => ({
      label: server.name,
      description: `${server.config.command} ${server.config.args.join(
        " "
      )}`.substring(0, 60),
      detail:
        server.status === "running"
          ? "$(circle-filled) Running"
          : server.status === "stopped"
          ? "$(circle-outline) Stopped"
          : server.status === "error"
          ? "$(error) Error"
          : "$(question) Unknown",
      picked: this.enabledServers.has(server.name),
      server: server,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      canPickMany: true,
      placeHolder: "Select which MCP servers to enable for refresh operations",
      title: "MCP Server Selector",
    });

    if (selected) {
      this.enabledServers.clear();
      selected.forEach((item) => this.enabledServers.add(item.server.name));
      await this.saveEnabledServers();

      vscode.window.showInformationMessage(
        `Updated enabled servers: ${
          Array.from(this.enabledServers).join(", ") || "None"
        }`
      );
      this.refresh();
    }
  }

  public getEnabledServersStatus(): string {
    if (this.servers.length === 0) {
      return "No servers";
    }

    const enabledCount = this.servers.filter((server) =>
      this.enabledServers.has(server.name)
    ).length;

    return `${enabledCount}/${this.servers.length}`;
  }

  private async stopServer(serverName: string): Promise<void> {
    const childProcess = this.runningProcesses.get(serverName);
    if (childProcess && !childProcess.killed) {
      childProcess.kill();
      this.runningProcesses.delete(serverName);

      // Wait a bit for the process to fully terminate
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  private async startServer(
    serverName: string,
    config: MCPServerConfig
  ): Promise<void> {
    try {
      const childProcess = spawn(config.command, config.args, {
        env: { ...process.env, ...config.env },
        stdio: "pipe",
      });

      this.runningProcesses.set(serverName, childProcess);

      childProcess.on("error", (error: Error) => {
        console.error(`Server ${serverName} error:`, error);
        this.runningProcesses.delete(serverName);
      });

      childProcess.on("exit", (code: number | null) => {
        console.log(`Server ${serverName} exited with code ${code}`);
        this.runningProcesses.delete(serverName);
      });
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to start server ${serverName}: ${error}`
      );
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log("MCP Extension: Activating...");

  const mcpProvider = new MCPServersProvider();

  // Register the tree data provider
  const treeView = vscode.window.createTreeView("mcpServersView", {
    treeDataProvider: mcpProvider,
    showCollapseAll: true,
  });

  console.log("MCP Extension: Tree view created");

  // Function to update status bar
  const updateStatusBar = () => {
    const status = mcpProvider.getEnabledServersStatus();
    statusBarItem.text = `$(server-process) MCP (${status})`;
    statusBarItem.tooltip = `MCP Servers: ${status} enabled\nClick to refresh enabled servers\nRight-click for more options`;
  };

  // Register commands
  const refreshAllCommand = vscode.commands.registerCommand(
    "cursor-mcp-refresh.refreshServers",
    () => {
      console.log("MCP Extension: Refresh all servers command triggered");
      mcpProvider.refreshAllServers();
    }
  );

  const refreshEnabledCommand = vscode.commands.registerCommand(
    "cursor-mcp-refresh.refreshEnabledServers",
    () => {
      console.log("MCP Extension: Refresh enabled servers command triggered");
      mcpProvider.refreshEnabledServers();
    }
  );

  const refreshSingleCommand = vscode.commands.registerCommand(
    "cursor-mcp-refresh.refreshSingleServer",
    (item: MCPServerItem) => {
      console.log(
        "MCP Extension: Refresh single server command triggered for:",
        item?.name
      );
      if (item && item.name) {
        mcpProvider.refreshServer(item.name);
      }
    }
  );

  const selectServersCommand = vscode.commands.registerCommand(
    "cursor-mcp-refresh.selectServers",
    () => {
      console.log("MCP Extension: Select servers command triggered");
      mcpProvider.showServerSelector().then(() => {
        updateStatusBar();
      });
    }
  );

  // Auto-refresh functionality
  const config = vscode.workspace.getConfiguration("cursor-mcp-refresh");
  const autoRefreshInterval = config.get<number>("autoRefreshInterval", 0);

  if (autoRefreshInterval > 0) {
    const intervalId = setInterval(() => {
      mcpProvider.refresh();
    }, autoRefreshInterval * 1000);

    context.subscriptions.push({
      dispose: () => clearInterval(intervalId),
    });
  }

  // Add status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = "cursor-mcp-refresh.refreshEnabledServers";
  statusBarItem.show();

  // Initial status bar update
  setTimeout(() => {
    updateStatusBar();
  }, 1000);

  console.log("MCP Extension: Status bar item created");

  context.subscriptions.push(
    treeView,
    refreshAllCommand,
    refreshEnabledCommand,
    refreshSingleCommand,
    selectServersCommand,
    statusBarItem
  );

  // Show welcome message
  vscode.window.showInformationMessage(
    "Cursor MCP Server Refresh extension activated!"
  );
  console.log("MCP Extension: Activation complete");
}

export function deactivate() {
  // Cleanup if needed
}
