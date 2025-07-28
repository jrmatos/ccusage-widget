# CCUsage Widget for macOS

A beautiful macOS desktop widget that displays your Claude Code usage statistics in real-time.

## Features

- 📊 **Real-time Usage Display**: Shows today's, this month's, and total usage
- 💰 **Cost Tracking**: Displays costs in USD for each time period
- 🤖 **Model Tracking**: See which Claude models you're using
- 📱 **Recent Sessions**: View your 5 most recent conversation sessions
- 🎨 **Beautiful UI**: Modern, translucent design that fits perfectly on macOS
- 🔄 **Auto-refresh**: Updates every minute automatically
- 📍 **Flexible Positioning**: Place the widget in any corner of your screen
- 👻 **Adjustable Opacity**: Control the widget's transparency
- 🚀 **System Tray Integration**: Easy access from the menu bar

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/ccusage-widget.git
cd ccusage-widget
```

2. Install dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run build
```

4. Run the widget:
```bash
npm start
```

## Development

To run in development mode with hot reload:
```bash
npm run dev
```

## Building for Distribution

To create a distributable macOS app:
```bash
npm run dist
```

The built app will be in the `release` folder.

## Usage

1. **Show/Hide**: Click the system tray icon or use the context menu
2. **Position**: Right-click the tray icon and select Position to move the widget
3. **Opacity**: Use the slider at the bottom of the widget to adjust transparency
4. **Refresh**: Click the refresh button or wait for auto-refresh every minute
5. **Minimize**: Click the minimize button to hide the widget

## Requirements

- macOS 10.14 or later
- Node.js 16 or later
- ccusage CLI tool data (the widget reads from `~/.claude/projects/`)

## Technologies Used

- Electron
- TypeScript
- ccusage npm package
- Native macOS vibrancy effects

## License

MIT