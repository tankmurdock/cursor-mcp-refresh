# Cursor MCP Server Refresh

Add refresh button for MCP servers in Cursor IDE. Easily restart MCP servers when they get stuck or need a refresh.

## 🚀 Features

- **Smart Server Selection**: Choose which MCP servers to actively manage
- **Status Bar Integration**: Shows enabled server count with one-click refresh
- **Refresh Selected Servers**: Only refresh the servers you actually use (much faster!)
- **Individual Server Refresh**: Refresh specific servers when needed
- **MCP Servers View**: Dedicated panel to monitor and manage your MCP servers
- **Persistent Settings**: Your server preferences are saved between sessions
- **Auto-refresh Option**: Configure automatic refresh intervals
- **Explorer Integration**: Access MCP server controls directly from the Explorer panel

## 📦 Installation

### Method 1: Download Pre-built Extension

1. Download `cursor-mcp-refresh-1.1.0.vsix` directly from this repository
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

### Select Which Servers to Manage (First Time Setup)

1. Open the MCP Servers view in the Explorer panel
2. Click the ⚙️ gear icon (Select Servers)
3. Choose which servers you want to actively manage
4. Your selection is saved for future use

### Refresh Selected Servers (Recommended)

1. **Status Bar**: Click the `MCP (X/Y)` button in the status bar
2. **Or**: Click the refresh icon in the MCP Servers view
3. Only your selected servers will be refreshed (much faster!)

### Refresh Individual Server

1. In the MCP Servers view, find the server you want to refresh
2. Right-click and select "Refresh Server"
3. Only that specific server will be restarted

### Command Palette

Access commands via Command Palette (`Ctrl+Shift+P`):

- "Refresh Enabled MCP Servers" - Refresh only selected servers
- "Select MCP Servers" - Choose which servers to manage
- "Refresh All MCP Servers" - Refresh everything (available in command palette)

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
