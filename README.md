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

## Installation (For Developers) 💻

If you want to run the app from source or contribute:

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd mac-paste
   ```

2. **Install dependencies**:
   Run this command in the project root to install all required packages:
   ```bash
   npm install
   ```

3. **Run in Development Mode**:
   Starts the app with hot-reloading:
   ```bash
   npm run dev
   ```

## Installation (Build App) 📦

To create a standalone application (`.app` or `.dmg`) that you can install in your `/Applications` folder:

1. **Build the production version**:
   ```bash
   npm run build
   ```

2. **Locate the Installer**:
   After the build completes, check the `release/` or `dist/` directory for the `.dmg` file.

3. **Install**:
   Open the `.dmg` file and drag `mac-paste` to your Applications folder.

## Permissions 🔒

For the **Global Shortcut** (`Cmd+Shift+V`) and **Auto-Paste** features to work correctly, you may need to grant Accessibility permissions:

1. Go to **System Settings** > **Privacy & Security** > **Accessibility**.
2. Enable the toggle for `mac-paste` (or your Terminal if running in dev mode).

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
