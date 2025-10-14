# Contributing to AutoHotkey v2 MCP Server

Thank you for your interest in contributing to the AutoHotkey v2 MCP Server! This guide will help you get started with development, testing, and contributing to the project.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0.0 or later
- **npm** 8.0.0 or later
- **Git** 2.0.0 or later
- **AutoHotkey v2** (for integration tests)
- **VS Code** (recommended)

### One-Command Setup
```bash
# Clone and setup
git clone https://github.com/your-username/ahk-mcp.git
cd ahk-mcp
node scripts/setup-dev.js

# Start development
npm run dev
```

## 📋 Development Workflow

### 1. Setup Development Environment
```bash
# Run the automated setup script
node scripts/setup-dev.js

# This will:
# - Install dependencies
# - Set up Git hooks
# - Build the project
# - Run tests
# - Configure VS Code settings
# - Create environment files
```

### 2. Create a Feature Branch
```bash
# Create a feature branch from main
git checkout -b feature/your-feature-name

# Or use the specification-driven workflow
npm run spec:new  # Create a new specification
npm run spec:plan  # Create a technical plan
```

### 3. Development Process
```bash
# Make your changes
# Follow the coding standards in AGENTS.md

# Run tests frequently
npm run test:watch

# Check code quality
npm run lint
npm run format:check

# Build and test
npm run build
npm run test:all
```

### 4. Submit Changes
```bash
# Stage your changes
git add .

# Commit with conventional commits
npm run commit

# Push to your fork
git push origin feature/your-feature-name

# Create a Pull Request
# Use the GitHub web interface or CLI
```

## 🧪 Testing Strategy

### Running Tests
```bash
# Run all test suites
npm run test:all

# Run specific test types
npm run test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e         # End-to-end tests
npm run test:ahk          # AutoHotkey integration tests

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Structure
```
Tests/
├── unit/           # Unit tests for individual functions/classes
├── integration/      # Integration tests for tool interactions
├── e2e/           # End-to-end tests for complete workflows
├── setup/          # Test setup and utilities
└── contract/       # Contract tests for API compliance
```

### Writing Tests
- **Unit Tests**: Test individual functions and classes in isolation
- **Integration Tests**: Test tool interactions and data flow
- **E2E Tests**: Test complete user workflows from start to finish
- **Contract Tests**: Verify MCP protocol compliance

### Test Coverage
- Aim for **80%+** coverage on new code
- All critical paths must have tests
- Tests must pass on all supported Node.js versions

## 📝 Coding Standards

### TypeScript Guidelines
- Use **strict mode** with comprehensive type definitions
- All functions must have explicit return types
- Use **Zod schemas** for all parameter validation
- Follow **async/await** pattern for I/O operations

### Code Style
- Use **Prettier** for formatting (configured in `.prettierrc.js`)
- Follow **ESLint** rules (configured in `.eslintrc.cjs`)
- Use **semantic naming** for functions and variables
- Add **JSDoc comments** for all public APIs

### Error Handling
- Always provide **informative error messages**
- Use **try-catch** blocks for async operations
- Return **standardized error format**:
```typescript
return {
  content: [{ type: 'text', text: `Error: ${message}` }],
  isError: true
};
```

### AutoHotkey v2 Specific Rules
- All scripts must use **`.ahk`** extension (never `.ahv`)
- Validate AHK paths with **`endsWith('.ahk')`**
- Use **AutoHotkey v2 syntax** (expression-only)
- Support both **GUI and console scripts**

## 🏗 Project Structure

```
ahk-mcp/
├── src/                    # Source code
│   ├── tools/           # MCP tool implementations
│   ├── core/            # Core functionality
│   ├── compiler/         # AHK compiler components
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── tests/                  # Test suites
│   ├── unit/           # Unit tests
│   ├── integration/      # Integration tests
│   ├── e2e/             # End-to-end tests
│   └── setup/           # Test utilities
├── docs/                   # Documentation
│   ├── Modules/         # AHK v2 instruction modules
│   └── *.md           # Guides and references
├── scripts/                 # Build and utility scripts
├── specs/                   # Specifications and plans
├── data/                    # AHK documentation and data
└── .github/                 # GitHub workflows and templates
    └── workflows/         # CI/CD pipelines
```

## 📚 Documentation

### API Documentation
- All public APIs must have **JSDoc comments**
- Use **TypeDoc** for generating API docs
- Include **usage examples** in documentation
- Document **error scenarios** and edge cases

### User Guides
- **QUICK_START.md** - Getting started guide
- **CODING_AGENT_GUIDE.md** - AI agent integration
- **SETTINGS_GUIDE.md** - Configuration options
- **EDIT_TOOLS_GUIDE.md** - File editing system

### Technical Documentation
- **CODE_SPECIFICATION.md** - Architecture and patterns
- **PROJECT_STATUS.md** - Current implementation status
- **RELEASE_NOTES.md** - Version history and changes

## 🔧 Development Tools

### VS Code Extensions (Recommended)
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **TypeScript** - Type checking and IntelliSense
- **AutoHotkey** - AHK syntax highlighting
- **GitLens** - Git blame and history

### Useful Commands
```bash
# Development with hot reload
npm run dev

# Build and watch
npm run watch

# Run all quality checks
npm run test:all

# Format code
npm run format

# Fix linting issues
npm run lint:fix

# Build documentation
npm run docs:build

# Serve documentation locally
npm run docs:serve
```

## 🔄 Pull Request Process

### Before Submitting
1. **Run all tests**: Ensure `npm run test:all` passes
2. **Check coverage**: Verify test coverage meets requirements
3. **Update documentation**: Add relevant docs for new features
4. **Rebase**: Keep your branch up to date with main
5. **Review**: Self-review your changes for quality

### PR Guidelines
- **Title**: Use conventional commit format: `type(scope): description`
- **Description**: Explain what and why, not just what
- **Tests**: Include test coverage reports
- **Screenshots**: Add screenshots for UI changes
- **Breaking Changes**: Clearly document any breaking changes

### Code Review Checklist
- [ ] Code follows project coding standards
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Breaking changes are documented
- [ ] Performance impact is considered
- [ ] Security implications are reviewed

## 🐛 Bug Reports

### Reporting Issues
- Use **GitHub Issues** for bug reports
- Include **environment details** (OS, Node.js version, etc.)
- Provide **reproduction steps** with minimal examples
- Include **expected vs actual behavior**
- Add **error logs** if available

### Bug Report Template
```markdown
## Environment
- OS: [e.g., Windows 11, Ubuntu 22.04]
- Node.js: [e.g., 20.10.0]
- AutoHotkey: [e.g., v2.0.12]

## Description
[Brief description of the issue]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Error Messages
[Any error output or logs]

## Additional Context
[Any relevant information]
```

## 🏆 Release Process

### Version Management
- Project follows **Semantic Versioning** (semver)
- Use **Conventional Commits** for automated changelog generation
- Releases are automated via **GitHub Actions**

### Release Types
- **Major**: Breaking changes (2.0.0, 3.0.0)
- **Minor**: New features (2.1.0, 2.2.0)
- **Patch**: Bug fixes (2.1.1, 2.1.2)

### Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Version number updated
- [ ] CHANGELOG.md updated
- [ ] GitHub release created
- [ ] npm package published

## 🤝 Community Guidelines

### Code of Conduct
- Be **respectful** and **inclusive**
- Focus on **constructive feedback**
- Welcome newcomers and help them learn
- Resolve conflicts **collaboratively**

### Getting Help
- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and community discussion
- **Discord**: [Link to community Discord if available]

### Recognition
Contributors are recognized in:
- **RELEASE_NOTES.md** - Release changelog
- **README.md** - Project acknowledgments
- **GitHub Contributors** - Automatic contribution tracking

## 📞 Getting Help

### Resources
- **Documentation**: Check `docs/` directory for comprehensive guides
- **Code Examples**: Look in `demos/` directory for usage examples
- **Test Examples**: Review `tests/` directory for testing patterns
- **Architecture**: See `CODE_SPECIFICATION.md` for technical details

### Contact
- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Maintainers**: Tag maintainers in issues for direct attention

---

## 🎉 Thank You

Your contributions help make the AutoHotkey v2 MCP Server better for everyone. Whether you're fixing bugs, adding features, improving documentation, or helping users, your efforts are valued and appreciated!

**Happy coding! 🚀**