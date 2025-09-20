# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the VS Code GitHub Pull Requests extension, which allows users to review and manage GitHub pull requests and issues directly in VS Code. The extension integrates with GitHub and GitHub Enterprise to provide PR review capabilities, issue management, and a Copilot coding agent.

## Development Commands

### Building and Compilation
- `yarn compile` - Compile TypeScript for development
- `yarn bundle` - Build production bundle
- `yarn watch` - Watch mode for development

### Testing
- `yarn test` - Run all tests (includes preprocessing)
- `yarn browsertest` - Run browser-specific tests

### Code Quality
- `yarn lint` - Run ESLint with auto-fix
- `yarn hygiene` - Run hygiene checks

### Packaging
- `yarn package` - Create .vsix extension package

## Architecture

### Core Structure
- **Entry Point**: `src/extension.ts` - Main activation and registration
- **GitHub Integration**: `src/github/` - Repository management, PR handling
- **Webviews**: `webviews/` - React-based UI components
- **Common**: `src/common/` - Shared utilities (logging, auth, config)
- **Issues**: `src/issues/` - Issue management
- **Language Model**: `src/lm/` - Chat participant and Copilot integration

### Key Components
- **RepositoriesManager**: Multiple repository connections
- **FolderRepositoryManager**: Single repository operations
- **ReviewManager**: PR review UI and commenting
- **CopilotRemoteAgentManager**: Copilot coding agent sessions

## Code Style Guidelines

- **TypeScript**: Modern features, explicit types, custom JSX factories `vscpp`/`vscppf`
- **Style**: Single quotes, semicolons, 2-space indentation (`.eslintrc.base.json`)
- **Logging**: Use `Logger` utility, never `console.log`
- **Commands**: Register in `package.json`, implement in `src/commands.ts`
- **Tests**: Place in `src/test/` with `.test.ts` suffix, use Mocha `describe`/`it`
- **Localization**: Use `%key%` syntax, strings in `package.nls.json`

## Important Notes

- **Environment Code**: Browser code in `src/env/browser/`, Node.js in `src/env/node/`
- **VS Code APIs**: Uses proposed APIs (see `src/@types/vscode.proposed.*`)
- **GitHub API**: GraphQL queries in `src/github/queries*.gql` files
- **Testing**: Tests require preprocessing for GraphQL/SVG resources
- **Configuration**: User settings use `githubPullRequests.*` namespace