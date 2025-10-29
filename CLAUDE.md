# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CCUsage Widget is a macOS Electron desktop widget that displays Claude Code usage statistics in real-time. It reads data from `~/.claude/projects/` and uses the `ccusage` npm package to parse and display usage metrics.

## Package Manager

**Always use pnpm** for all package management tasks in this project (not npm, yarn, or bun).

## Common Development Commands

### Development
- `pnpm dev` - Run the widget in development mode with hot reload
- `pnpm start` - Run the built application

### Building
- `pnpm build` - Compile TypeScript and copy assets to `dist/`
  - Runs `tsc && pnpm run copy-assets`
  - Assets: `src/*.html` → `dist/`, `src/styles` → `dist/styles`
- `pnpm run dist` - Create distributable macOS app (output in `release/` folder)

### Quality Checks
- `pnpm run lint` - Run ESLint on source files
- `pnpm run typecheck` - Run TypeScript type checking without emitting files
- `pnpm test` - Run both lint and typecheck (no unit tests configured)

### Publishing
- `pnpm run prepublishOnly` - Automatically runs before npm publish to build the project

## Architecture

### Application Structure

The project follows a standard Electron architecture with three main processes:

1. **Main Process** (`src/main.ts`)
   - Creates and manages the BrowserWindow with transparent, frameless design
   - Handles system tray integration with macOS
   - Manages widget positioning (4 corners: top-right, top-left, bottom-right, bottom-left)
   - Executes `ccusage` CLI via Node.js `child_process.exec()`
   - Implements IPC handlers for data fetching and window control

2. **Preload Script** (`src/preload.ts`)
   - Bridges main and renderer processes using `contextBridge`
   - Exposes `ccusageAPI` to renderer with security isolation
   - API methods: `getUsageData()`, `updateOpacity()`, `onRefreshData()`

3. **Renderer Process** (`src/renderer.ts`)
   - Vanilla TypeScript/HTML/CSS (no framework)
   - Displays usage metrics: today's, this month's, and total tokens/cost
   - Shows recent sessions (5 most recent)
   - Auto-refreshes every 60 seconds
   - Handles UI interactions: opacity slider, minimize, refresh buttons

### Key Design Patterns

- **Session Name Extraction**: The `extractSessionNameFromId()` function (main.ts:15-36) parses session IDs with pattern `-Users-${whoami}-workspace-${sessionType}-${sessionName}` to display readable session names
- **Data Flow**: Main process executes `ccusage --output json` → parses JSON → sends to renderer via IPC → renderer updates DOM
- **Window Management**: Uses Electron's `BrowserWindow` with `frame: false`, `transparent: true`, and macOS vibrancy effects

### TypeScript Configuration

- Target: ES2022 with CommonJS modules
- Strict mode enabled
- Source maps and declarations generated
- Output: `src/**/*` → `dist/`

## GitHub CI/CD Workflows

### Release Process (`.github/workflows/release.yml`)
Triggered on git tags (`v*`) or manual workflow dispatch:
1. Updates `package.json` version from tag
2. Runs lint, typecheck, and test
3. Builds application (`pnpm run build`)
4. Verifies build output (checks `dist/main.js` exists)
5. Creates distributable (`pnpm run dist`)
6. Tests global npm installation
7. Publishes to npm (requires `NPM_AUTOMATION_TOKEN` secret)
8. Uploads macOS app to GitHub Release

### Other Workflows
- `ci.yml` - Basic CI checks on push/PR
- `pre-release-check.yml` - Comprehensive validation before releases
- `claude.yml` - Claude Code automation
- `claude-code-review.yml` - Automated code reviews
- `update-version.yml` - Version management automation

## Dependencies

### Runtime
- `ccusage` (latest) - Core package for parsing Claude Code usage data
- `electron` (^28.0.0) - Framework for building the desktop app (optionalDependency)

### Development
- TypeScript (^5.0.0) with strict configuration
- ESLint with TypeScript support
- electron-builder (^24.0.0) for creating distributable apps

## Important Notes

- The widget requires `ccusage` CLI tool to be installed globally or available via npx
- Widget reads Claude Code data from `~/.claude/projects/`
- macOS-only: Uses native macOS vibrancy effects
- Node.js 16+ required
- Binary entry point: `bin/ccusage-widget.js` (configured in package.json)
