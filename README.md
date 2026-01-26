# mac-paste 📋

A modern, spotlight-style clipboard manager for macOS built with Electron, React, and TailwindCSS.

## Features ✨

- **Clipboard History**: Automatically tracks text copied to the clipboard.
- **Spotlight-style UI**: Minimalist, floating interface that appears on command.
- **Global Shortcut**: Toggle the window from anywhere using `Cmd+Shift+V`.
- **Keyboard Navigation**: Navigate history with arrow keys and paste with `Enter`.
- **Search**: Real-time filtering of clipboard history.
- **Auto-Paste**: Automatically pastes the selected item into the active application.
- **Persistence**: Retains clipboard history across reboots (up to 100 items).

## Tech Stack 🛠️

- **Electron**: Desktop application runtime.
- **React**: UI library for the renderer process.
- **Vite**: Next-generation frontend tooling.
- **TailwindCSS**: Utility-first CSS framework for styling.
- **electron-store**: Simple data persistence.

## Installation 📦

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mac-paste
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development 💻

Run the application in development mode with hot-reloading:

```bash
npm run dev
```

## Build 🏗️

Build the application for production (creates a `.dmg` or `.app` in `release/` or `dist/`):

```bash
npm run build
```

## Keyboard Shortcuts ⌨️

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+V` | Toggle Window |
| `Arrow Up/Down` | Navigate List |
| `Enter` | Paste Selected Item |
| `Esc` | Close Window |
| `Cmd+Q` | Quit Application |
