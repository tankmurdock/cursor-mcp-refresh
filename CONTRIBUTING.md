# Contributing to Cursor MCP Server Refresh

Thank you for your interest in contributing to this project! 🎉

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```cmd
   git clone https://github.com/YOUR-USERNAME/cursor-mcp-refresh.git
   cd cursor-mcp-refresh
   ```
3. **Install dependencies**:
   ```cmd
   npm install
   ```
4. **Create a feature branch**:
   ```cmd
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Cursor IDE for testing

### Building the Extension

```cmd
npm run compile
```

### Testing Your Changes

1. Compile the extension with `npm run compile`
2. Open Cursor IDE
3. Press `F5` to open a new Extension Development Host window
4. Test your changes in the new window

### Packaging for Testing

```cmd
npx vsce package
```

This creates a `.vsix` file that you can install in Cursor for testing.

## Code Style

- Use TypeScript for all code
- Follow existing code style and formatting
- Add comments for complex logic
- Use meaningful variable and function names

## Submitting Changes

1. **Test your changes** thoroughly
2. **Commit your changes** with clear commit messages:
   ```cmd
   git add .
   git commit -m "feat: add new refresh functionality"
   ```
3. **Push to your fork**:
   ```cmd
   git push origin feature/your-feature-name
   ```
4. **Create a Pull Request** on GitHub

## Pull Request Guidelines

- Provide a clear description of what your PR does
- Reference any related issues
- Include screenshots if your changes affect the UI
- Make sure all tests pass
- Keep PRs focused - one feature per PR

## Reporting Issues

Before creating an issue, please:

- Search existing issues to avoid duplicates
- Use the provided issue templates
- Include as much detail as possible
- Provide steps to reproduce bugs

## Code of Conduct

Be respectful and constructive in all interactions. We want this to be a welcoming community for everyone.

## Questions?

Feel free to open an issue with the "question" label if you need help or clarification on anything.
