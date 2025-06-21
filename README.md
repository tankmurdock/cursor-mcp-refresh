# Cursor MCP Server Refresh

Add refresh button for MCP servers in Cursor IDE. Easily restart MCP servers when they get stuck or need a refresh.

## 🚀 Features

- **Refresh MCP Servers**: Quickly restart all MCP servers with one click
- **Individual Server Refresh**: Refresh specific servers when needed
- **MCP Servers View**: Dedicated panel to monitor and manage your MCP servers
- **Auto-refresh Option**: Configure automatic refresh intervals
- **Explorer Integration**: Access MCP server controls directly from the Explorer panel

## 📦 Installation

### Method 1: Download Pre-built Extension

1. Download `cursor-mcp-refresh-1.0.0.vsix` directly from this repository
2. Open Cursor IDE
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) to open the command palette
4. Type "Extensions: Install from VSIX" and select it
5. Browse to the downloaded `.vsix` file and select it
6. The extension will be installed and activated

### Method 2: Build from Source

1. Clone this repository:

   ```cmd
   git clone https://github.com/tankmurdock/cursor-mcp-refresh.git
   cd cursor-mcp-refresh
   ```

2. Install dependencies:

   ```cmd
   npm install
   ```

3. Compile the extension:

   ```cmd
   npm run compile
   ```

4. Package the extension:

   ```cmd
   npx vsce package
   ```

5. Install the generated `.vsix` file using Method 1 above

## 🔧 Configuration

The extension provides several configuration options:

- **MCP Config Path**: Specify the path to your `mcp.json` configuration file
- **Show in Explorer**: Toggle the MCP Servers view in the Explorer panel
- **Auto-refresh Interval**: Set automatic refresh interval in seconds (0 to disable)

Access these settings via File → Preferences → Settings and search for "Cursor MCP Refresh".

## 🎯 Usage

### Refresh All Servers

1. Open the MCP Servers view in the Explorer panel
2. Click the refresh icon in the view title bar
3. All MCP servers will be restarted

### Refresh Individual Server

1. In the MCP Servers view, find the server you want to refresh
2. Click the refresh icon next to the specific server
3. Only that server will be restarted

### Command Palette

You can also access refresh commands via the Command Palette (`Ctrl+Shift+P`):

- "Refresh MCP Servers" - Refresh all servers
- "Refresh Server" - Refresh a specific server

## 🐛 Reporting Issues

If you encounter any bugs or have feature requests, please report them on our [Issues page](https://github.com/tankmurdock/cursor-mcp-refresh/issues).

When reporting a bug, please include:

- Your Cursor IDE version
- Your operating system
- Steps to reproduce the issue
- Expected vs actual behavior
- Any error messages or logs

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Homepage](https://github.com/tankmurdock/cursor-mcp-refresh)
- [Issues](https://github.com/tankmurdock/cursor-mcp-refresh/issues)
- [Releases](https://github.com/tankmurdock/cursor-mcp-refresh/releases)
