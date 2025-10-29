# CCUsage Widget for macOS

[![license](https://img.shields.io/github/license/JeongJaeSoon/ccusage-widget)](./LICENSE)

A beautiful macOS menu bar app that displays your Claude Code usage statistics in real-time, right next to your system clock.

## Features

- 📊 **Menu Bar Integration**: Displays "Claude Code: $X.XX" directly in your macOS menu bar
- 💰 **Real-time Cost Tracking**: See your daily Claude Code costs at a glance
- 🔄 **Auto-refresh**: Updates every 60 seconds automatically
- 🎨 **Beautiful UI**: Modern, translucent floating widget when you need details
- 📱 **Detailed View**: Click to see today's, this month's, and total usage
- 🤖 **Model Tracking**: See which Claude models you're using
- 📝 **Recent Sessions**: View your 5 most recent conversation sessions
- 👻 **No Dock Icon**: Pure menu bar app that stays out of your way
- ⚡ **Auto-hide**: Widget window disappears when you click away

## Prerequisites

- **ccusage CLI tool**: This widget requires the [ccusage](https://github.com/ryoppippi/ccusage) CLI tool to be installed and working.

  Install ccusage globally:
  ```bash
  pnpm install -g ccusage
  ```

  Or use it with npx:
  ```bash
  npx ccusage
  ```

- **Claude Code data**: The widget reads usage data from `~/.claude/projects/`. Make sure you have used Claude Code and have data files in this directory.
- **Node.js 16+** and **pnpm** installed on your system

## Installation

This app is not published to npm registry. Install from source and make the `ccusage-widget` command available globally on your system:

1. **Clone this repository**:
   ```bash
   git clone https://github.com/JeongJaeSoon/ccusage-widget.git
   cd ccusage-widget
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Build and install globally**:
   ```bash
   pnpm run install-global
   ```

4. **Run the widget from anywhere**:
   ```bash
   ccusage-widget
   ```
   The app will appear in your menu bar with "Claude Code: $X.XX" text. Click it to see detailed usage information.

### Uninstallation

To remove the global installation:
```bash
pnpm run uninstall-global
```

## Development

To run in development mode:
```bash
pnpm run dev
```

## Building for Distribution

To create a distributable macOS app:
```bash
pnpm run dist
```

The built app will be in the `release` folder.

## Usage

1. **Menu Bar**: After running `ccusage-widget`, you'll see "Claude Code: $X.XX" in your macOS menu bar
2. **Open Widget**: Click the menu bar text/icon to open the detailed usage widget
3. **Auto-hide**: The widget automatically hides when you click outside of it
4. **Right-click Menu**: Right-click the menu bar icon for options:
   - **Open Widget**: Opens the detailed view
   - **Quit CCUsage Widget**: Exits the application
5. **Live Updates**: The menu bar cost updates every 60 seconds automatically

## Requirements

- macOS 10.14 or later
- Node.js 16 or later
- [ccusage](https://github.com/ryoppippi/ccusage) CLI tool (see Prerequisites above)
- Claude Code usage data (the widget reads from `~/.claude/projects/`)

## Technologies Used

- Electron
- TypeScript
- ccusage npm package
- Native macOS vibrancy effects

## License

MIT
