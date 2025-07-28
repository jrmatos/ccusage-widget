#!/bin/bash
# Install ccusage globally if not already installed
if ! command -v ccusage &> /dev/null; then
    echo "Installing ccusage globally..."
    npm install -g ccusage
fi

# Start the widget
npm start