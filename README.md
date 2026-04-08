# MacPaste 📋

> A lightning-fast, spotlight-style clipboard manager for macOS — built with Electron, React, and TailwindCSS.

[![Release](https://img.shields.io/github/v/release/nhamcotdo/macpaste?style=flat-square)](https://github.com/nhamcotdo/macpaste/releases/latest)
[![License](https://img.shields.io/github/license/nhamcotdo/macpaste?style=flat-square)](LICENSE)
[![Build](https://img.shields.io/github/actions/workflow/status/nhamcotdo/macpaste/release.yml?style=flat-square)](https://github.com/nhamcotdo/macpaste/actions)

---

## Features ✨

- 📋 **Clipboard History** — Automatically tracks everything you copy (up to 100 items)
- 🔍 **Real-time Search** — Filter your clipboard history instantly as you type
- ⌨️ **Keyboard-first Navigation** — Arrow keys to navigate, `Enter` to paste
- 🚀 **Auto-Paste** — Selected item is automatically pasted into the active app
- 🌐 **Global Shortcut** — Toggle the window from anywhere with `Cmd+Shift+V`
- 💾 **Persistent Storage** — History is preserved across reboots
- ⚙️ **Customizable Shortcut** — Change the global shortcut from Settings

---

## Download 📦

Go to the [**Releases page**](https://github.com/nhamcotdo/macpaste/releases/latest) and download the installer for your platform:

| Platform | File |
|---|---|
| macOS (Apple Silicon) | `MacPaste-Mac-*-arm64.dmg` |
| macOS (Intel) | `MacPaste-Mac-*-x64.dmg` |
| Windows | `MacPaste-Windows-*-Setup.exe` |

### macOS Install

1. Download the `.dmg` file matching your chip (Apple Silicon or Intel).
2. Open it and drag **MacPaste** into your `/Applications` folder.
3. **Bypass Gatekeeper**: Since the app is not notarized by an Apple Developer ID, open **Terminal** and run the following command to remove the quarantine flag:
   ```bash
   xattr -cr /Applications/MacPaste.app
   ```
4. Launch MacPaste from your Applications folder.
5. Grant **Accessibility** permissions when prompted (required for Auto-Paste and Global Shortcut).

---

## Permissions 🔒

For **Global Shortcut** and **Auto-Paste** to work, grant Accessibility access:

1. **System Settings → Privacy & Security → Accessibility**
2. Enable the toggle for **MacPaste**

---

## Keyboard Shortcuts ⌨️

| Shortcut | Action |
|---|---|
| `Cmd+Shift+V` | Toggle window (customizable) |
| `↑ / ↓` | Navigate clipboard history |
| `Enter` | Paste selected item |
| `Esc` | Close window |
| `Cmd+Q` | Quit application |

---

## Development 💻

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- npm

### Setup

```bash
git clone https://github.com/nhamcotdo/macpaste.git
cd macpaste
npm install
```

### Run in dev mode

```bash
npm run dev
```

### Build locally

```bash
npm run build
# Output in release/<version>/
```

---

## Tech Stack 🛠️

- **[Electron](https://www.electronjs.org/)** — Desktop runtime
- **[React](https://react.dev/)** — UI library
- **[Vite](https://vitejs.dev/)** — Build tool
- **[TailwindCSS](https://tailwindcss.com/)** — Styling
- **[Framer Motion](https://www.framer.com/motion/)** — Animations
- **[electron-store](https://github.com/sindresorhus/electron-store)** — Persistence

---

## Release Process 🚀

Releases are automated via **GitHub Actions**. Every tag push (`v*`) triggers a build for macOS and Windows, with artifacts uploaded to GitHub Releases automatically.

```bash
# Bump version in package.json, then:
git tag v1.x.x
git push origin v1.x.x
```

---

## License

MIT © [nhamcotdo](https://github.com/nhamcotdo)
