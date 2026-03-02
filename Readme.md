# ⚡ ExtForge Studio v2

<div align="center">

![ExtForge Studio Banner](https://img.shields.io/badge/ExtForge-Studio%20v2-3b82f6?style=for-the-badge&logo=visualstudiocode&logoColor=white)

**The ultimate free, browser-based toolkit for VS Code extension developers.**

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-Visit%20App-22d3a5?style=for-the-badge)](https://abdelrahman968.github.io/ExtForge-Studio)
[![License: MIT](https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge)](LICENSE)
[![Made With Love](https://img.shields.io/badge/Made%20with-❤️-f43f5e?style=for-the-badge)](https://github.com/Abdelrahman968)

</div>

---

## 🌟 What is ExtForge Studio?

ExtForge Studio is a **100% free, no-API-key, no-login** web application that gives VS Code extension developers a complete development toolkit right in the browser. Generate production-ready extension code, design themes, draw icon packs, configure settings, manage snippets, and publish — all in one place.

> Built by [Abdelrahman Ayman](https://www.linkedin.com/in/abdelrahman968/) · Free & Open Source

---

## ✨ Features

### 🔌 Extension Builder

Generate complete, production-ready VS Code extensions instantly:

- Full `package.json` with proper contributes, engines, and scripts
- `extension.ts` / `extension.js` with all selected features
- TypeScript types (`types.ts`)
- `tsconfig.json` configuration
- Test file (`extension.test.ts`)
- `README.md` and `CHANGELOG.md`
- `.vscodeignore`
- **18 feature modules**: Status Bar, WebView, Tree View, Decorations, Completions, Hover Provider, Diagnostics, Settings UI, Quick Pick, CodeLens, Refactoring, Workspace FS, Terminal API, Git Integration, Debug Adapter, Notebook Kernel, Task Provider, SCM Provider

### 🎨 Theme Creator

Design stunning VS Code color themes with a live preview:

- Edit all major VS Code color tokens (Editor, Tabs, Activity Bar, Sidebar, Status Bar, Terminal, UI Controls)
- Live VS Code mock preview updates in real time
- Built-in presets: Dark+, Light, Horizon, Dracula, Solarized
- Random theme generator
- Import existing `.json` theme files
- Export as a ready-to-publish theme extension (theme JSON + `package.json`)

### 🖼️ Icon Pack

Full pixel-art icon editor for VS Code file icon themes:

- Drawing tools: Pencil, Line, Rectangle, Ellipse, Triangle, Arrow, Fill, Eraser
- Undo / Redo stack (50 levels)
- Zoom, Flip (horizontal & vertical)
- 15 quick-insert SVG shapes
- 14-color palette
- Configurable stroke width, opacity, and canvas size (16–128px)
- Save icons to a pack and export as a complete `icon-theme.json` manifest with individual PNGs

### ⚙️ VS Code Settings

Visual settings editor with live JSON preview:

- 5 categories: Editor, Workbench, Terminal, Files, Git
- Toggle switches, dropdowns, number inputs, and range sliders
- Only changed settings are exported (no bloat)
- One-click download of `settings.json`

### ✂️ Snippet Studio

Create and manage VS Code code snippets:

- Tab stops (`${1:placeholder}`) and final cursor (`$0`) support
- Multi-language scope
- Live `.code-snippets` JSON preview
- Export as `.code-snippets` file

### ⌨️ Keybindings

Manage your VS Code keyboard shortcuts:

- Search/filter commands
- Inline key combo editing
- Add/remove bindings
- Export `keybindings.json`

### 📋 Changelog Builder

Build structured changelogs with a visual editor:

- Version cards with date picker and type (Major / Minor / Patch)
- Change entries: Added, Fixed, Breaking, Deprecated
- Live Markdown preview
- Export `CHANGELOG.md`

### 🚀 Publish Wizard

Step-by-step guided checklist to publish your extension:

- Azure DevOps setup
- `vsce` CLI installation
- Publisher creation
- Packaging & local testing
- Publishing to Marketplace
- README badge generation

### 📁 Templates

12 ready-to-use extension templates:
| Template | Description |
|---|---|
| 🔔 Hello World | Classic starter with notification command |
| 📊 Status Bar Clock | Live clock in the status bar |
| 🌳 File Explorer Tree | Custom sidebar tree view |
| ✂️ Smart Snippets | Intelligent code completions |
| 🎨 Code Colorizer | Editor decorations & highlights |
| 🔍 Symbol Finder | Quick-pick workspace navigation |
| 📝 Todo Tracker | Diagnostic scanner for TODO/FIXME |
| ⚡ Code Runner | Run current file in terminal |
| 🔀 Git Helper | Enhanced Git commands |
| 🌐 WebView Dashboard | Custom HTML panel |
| 🐛 Debug Helper | Debug configurations & CodeLens |
| 📦 Package Manager | NPM/pip sidebar panel |

---

## 🚀 Quick Start

### Option 1 — Use Online (Recommended)

Visit the live app: **[https://abdelrahman968.github.io/ExtForge-Studio](https://abdelrahman968.github.io/ExtForge-Studio)**

No installation. No API keys. No login.

### Option 2 — Run Locally

```bash
# Clone the repository
git clone https://github.com/Abdelrahman968/ExtForge-Studio.git

# Navigate to the folder
cd ExtForge-Studio

# Open in your browser (no build step needed)
open index.html
# or on Windows:
start index.html
# or with VS Code Live Server:
code .
```

---

## 🗂️ Project Structure

```
ExtForge-Studio/
├── index.html       # Main application shell
├── styles.css       # All styles (Tailwind + custom CSS variables)
├── app.js           # Full application logic (~1500 lines)
├── README.md        # This file
├── CHANGELOG.md     # Version history
└── LICENSE          # MIT License
```

---

## 🛠️ Tech Stack

| Technology                  | Purpose                                 |
| --------------------------- | --------------------------------------- |
| Vanilla HTML5               | Application structure                   |
| CSS3 + Tailwind CDN         | Styling & responsive layout             |
| Vanilla JavaScript (ES2020) | All application logic                   |
| Canvas API                  | Icon Pack pixel editor                  |
| Blob / FileReader API       | File downloads & imports                |
| Clipboard API               | Copy to clipboard                       |
| Google Fonts                | JetBrains Mono, Syne, Plus Jakarta Sans |

> **Zero dependencies. Zero frameworks. Zero build tools.** Just open and use.

---

## 📸 Screenshots

> Extension Builder · Theme Creator · Icon Pack · Settings Editor

_Try it now: [https://abdelrahman968.github.io/ExtForge-Studio](https://abdelrahman968.github.io/ExtForge-Studio)_

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Abdelrahman Ayman**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-abdelrahman968-0077B5?style=flat&logo=linkedin)](https://www.linkedin.com/in/abdelrahman968/)
[![GitHub](https://img.shields.io/badge/GitHub-Abdelrahman968-181717?style=flat&logo=github)](https://github.com/Abdelrahman968)
[![X](https://img.shields.io/badge/X-Abdelrahman__968-000000?style=flat&logo=x)](https://x.com/Abdelrahman_968)
[![Facebook](https://img.shields.io/badge/Facebook-Abdelrahman.968-1877F2?style=flat&logo=facebook)](https://www.facebook.com/Abdelrahman.968)

---

<div align="center">
  <strong>⭐ Star this repo if it helped you!</strong><br>
  Made with ❤️ by Abdelrahman Ayman · 100% Free & Open Source
</div>
