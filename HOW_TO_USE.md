# 📖 How to Use ExtForge Studio v2

> A complete step-by-step guide for every feature in ExtForge Studio.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Extension Builder](#2-extension-builder)
3. [Theme Creator](#3-theme-creator)
4. [Icon Pack Editor](#4-icon-pack-editor)
5. [VS Code Settings](#5-vs-code-settings)
6. [Snippet Studio](#6-snippet-studio)
7. [Keybindings Editor](#7-keybindings-editor)
8. [Changelog Builder](#8-changelog-builder)
9. [Publish Wizard](#9-publish-wizard)
10. [Templates](#10-templates)
11. [Tips & Tricks](#11-tips--tricks)

---

## 1. Getting Started

Open the app at **[https://abdelrahman968.github.io/ExtForge-Studio](https://abdelrahman968.github.io/ExtForge-Studio)**  
or clone and open `index.html` locally — no server required.

The interface has three zones:

- **Top navigation bar** — switch between the 9 tools
- **Left sidebar** — form inputs (visible on Extension Builder only)
- **Main content area** — output, previews, and editors

On mobile, tap the **☰ menu** icon to access navigation and the sidebar.

---

## 2. Extension Builder

**Goal:** Generate a complete, ready-to-run VS Code extension in seconds.

### Step 1 — Fill Extension Info (Left Sidebar)

| Field            | Description                                     | Example                       |
| ---------------- | ----------------------------------------------- | ----------------------------- |
| **Name**         | Package name (no spaces, lowercase, hyphens OK) | `my-formatter`                |
| **Display Name** | Human-readable name shown in Marketplace        | `My Formatter`                |
| **Publisher ID** | Your VS Code Marketplace publisher ID           | `abdelrahman968`              |
| **Version**      | SemVer version                                  | `0.1.0`                       |
| **Description**  | Short description for Marketplace               | `A powerful formatter for JS` |

### Step 2 — Choose Type & Activation

- **Category**: Matches VS Code Marketplace categories (Commands, Language Support, Snippets, etc.)
- **Activation Event**: When your extension activates:
  - `onStartupFinished` — after VS Code fully loads (most common)
  - `onCommand` — when a specific command is run
  - `onLanguage` — when a language file is opened
  - `*` — immediately on launch (use sparingly)
- **Output Language**: TypeScript (recommended) or JavaScript

### Step 3 — Select Features

Click any chip to toggle it on (blue = active):

| Feature         | What it generates                           |
| --------------- | ------------------------------------------- |
| Status Bar      | A status bar item with click command        |
| WebView Panel   | An HTML panel inside VS Code                |
| Tree View       | Sidebar tree data provider                  |
| Decorations     | Editor text/gutter highlights               |
| Completions     | IntelliSense completion provider            |
| Hover Provider  | Tooltip on hover                            |
| Diagnostics     | Inline error/warning markers                |
| Settings UI     | `contributes.configuration` in package.json |
| Quick Pick      | Interactive selection dropdown              |
| CodeLens        | Inline actionable annotations               |
| Refactoring     | Code action provider                        |
| Workspace FS    | File system access                          |
| Terminal API    | Integrated terminal control                 |
| Git Integration | Git extension API usage                     |
| Debug Adapter   | DAP protocol integration                    |
| Notebook Kernel | Jupyter-style notebook support              |
| Task Provider   | Custom task definitions                     |
| SCM Provider    | Source control panel                        |

### Step 4 — Add Commands & Keybindings

- Click **+ Add Command** to add command IDs (e.g., `formatDocument`, `openPanel`)
- Click **+ Add Keybinding** to map key combos (e.g., `ctrl+shift+f`)

### Step 5 — Generate

Click **⚡ Generate Extension** and wait ~2 seconds.

### Step 6 — View & Download Output

Switch between tabs:

- **Generated Code** — browse all files, copy individual files, download ZIP or all files
- **Install Guide** — step-by-step terminal commands to run your extension
- **README** — preview the auto-generated README

### Output Files

```
package.json                  ← Extension manifest
src/extension.ts              ← Main entry point
src/types.ts                  ← TypeScript interfaces (TS only)
src/test/extension.test.ts    ← Test suite
tsconfig.json                 ← TypeScript config (TS only)
README.md                     ← Marketplace README
CHANGELOG.md                  ← Version history
.vscodeignore                 ← Files to exclude from package
```

---

## 3. Theme Creator

**Goal:** Design a VS Code color theme and export it as an installable extension.

### Step 1 — Load a Preset (Optional)

Click any preset button to start from a base:

- 🌑 **Dark+** — VS Code default dark
- ☀️ **Light** — VS Code default light
- 🌅 **Horizon** — blue-tinted dark
- 🧛 **Dracula** — purple-based dark
- 🌞 **Solarized** — warm teal dark
- 🎲 **Random** — generates a random color scheme

### Step 2 — Customize Colors

Colors are grouped by UI area (Editor, Tabs & Title, Activity Bar, Sidebar, Status Bar, Panel & Terminal, UI Controls).

For each token:

- Click the **color swatch** to open a color picker
- Or type a **hex code** directly (e.g. `#3b82f6` or `#3b82f688` for transparency)

### Step 3 — Check the Live Preview

The right panel shows a mock VS Code editor that updates live as you change colors.

### Step 4 — Export

1. Enter your **Theme Name** in the text field at the bottom right
2. Click **⬇️ Export** to download:
   - `my-theme-color-theme.json` — the theme definition file
   - `package.json` — the extension manifest

To publish as a VS Code extension, create a folder with these files, run `vsce package`, then `vsce publish`.

### Import an Existing Theme

Click **📂 Import JSON** and select any VS Code theme JSON file to load it for editing.

---

## 4. Icon Pack Editor

**Goal:** Draw pixel-art icons for a VS Code file icon theme.

### Canvas & Tools

| Tool         | Shortcut      | Description                      |
| ------------ | ------------- | -------------------------------- |
| ✏️ Pencil    | Click toolbar | Freehand drawing                 |
| ╱ Line       | Click toolbar | Straight line between two points |
| ⬜ Rectangle | Click toolbar | Outlined rectangle               |
| ⭕ Ellipse   | Click toolbar | Outlined ellipse/circle          |
| △ Triangle   | Click toolbar | Outlined triangle                |
| → Arrow      | Click toolbar | Line with arrowhead              |
| 🪣 Fill      | Click toolbar | Flood-fill a region              |
| 🧹 Eraser    | Click toolbar | Erase pixels                     |

### Controls

- **Stroke** — color picker for drawing color
- **Stroke width** — thickness slider (1–12)
- **Size** — canvas logical resolution (16, 32, 48, 64, 128px)
- **Opacity** — drawing opacity (0–100%)
- **↩️ Undo / ↪️ Redo** — 50-level undo history
- **🗑️ Clear** — reset canvas
- **+ / −** — zoom in/out
- **↔️ / ↕️** — flip horizontally or vertically

### Quick Shapes

Click any shape in the left palette to instantly draw it centered on the canvas (great for icon bases).

### Color Palette

Click any color swatch in the left panel to set it as the active drawing color.

### Saving to Pack

1. Enter an **icon name** (e.g. `typescript`)
2. Enter a **file extension** (e.g. `.ts`)
3. Choose **category**: File Icon, Folder Icon, or Root Folder
4. Click **💾 Save** — the icon is added to your pack list

### Exporting

Click **⬇️ Export** to download:

- `icon-theme.json` — VS Code icon theme manifest
- One `.png` file per icon in your pack

---

## 5. VS Code Settings

**Goal:** Build a custom `settings.json` visually and download it.

### Step 1 — Pick a Category

Click any category in the left nav: **Editor, Workbench, Terminal, Files, Git**

### Step 2 — Change Settings

Each setting has an appropriate control:

- **Toggle** — on/off switch
- **Dropdown** — fixed option list
- **Number** — numeric input with min/max
- **Range** — draggable slider
- **Text** — free text input

### Step 3 — Review JSON

The right panel (`settings.json`) shows only the settings you changed from their defaults — keeping your file clean.

### Step 4 — Download or Copy

- **📋 Copy** — copies JSON to clipboard
- **↺ Reset** — resets all values to defaults
- **⬇️ Download settings.json** — saves the file

Place the downloaded file at:

- **Windows**: `%APPDATA%\Code\User\settings.json`
- **macOS**: `~/Library/Application Support/Code/User/settings.json`
- **Linux**: `~/.config/Code/User/settings.json`

---

## 6. Snippet Studio

**Goal:** Create VS Code code snippets with tab stops and export them.

### Step 1 — Create a Snippet

Click **+ New** to add a blank snippet, or select an existing one from the left list.

### Step 2 — Fill the Form

| Field              | Description                                                                    |
| ------------------ | ------------------------------------------------------------------------------ |
| **Name**           | Friendly display name                                                          |
| **Prefix**         | Trigger word typed in editor (e.g. `cl` for console.log)                       |
| **Language Scope** | Comma-separated languages (e.g. `javascript,typescript`) — leave blank for all |
| **Description**    | Shown in IntelliSense dropdown                                                 |
| **Body**           | The snippet content                                                            |

### Snippet Syntax

```
${1:placeholder}   ← Tab stop with placeholder text
${2:name}          ← Second tab stop
$0                 ← Final cursor position
```

**Example:**

```javascript
const ${1:name} = (${2:params}) => {
	${3:// body}
	$0
};
```

### Step 3 — Export

Click **⬇️ Export .code-snippets** to download a `.code-snippets` file.

**Where to put it in VS Code:**

1. Open VS Code
2. Go to `File → Preferences → Configure User Snippets`
3. Select a language or create a global snippets file
4. Paste your exported JSON content

---

## 7. Keybindings Editor

**Goal:** Manage and export your VS Code keyboard shortcuts.

### Adding a Keybinding

Click **+ Add** and enter:

- **Command ID** (e.g. `extension.myCommand`)
- **Key combo** (e.g. `ctrl+shift+k`)

### Editing Existing Bindings

Click the key combo field in the table and type a new combination directly.

### Searching

Use the search bar to filter by command name or key combo.

### Exporting

Click **⬇️ Export JSON** to download `keybindings.json`.

**Where to put it:**

1. Open VS Code
2. Press `Ctrl+Shift+P` → `Open Keyboard Shortcuts (JSON)`
3. Paste the exported content

---

## 8. Changelog Builder

**Goal:** Write a structured CHANGELOG and export it as Markdown.

### Step 1 — Add a Version

Click **+ Version** to add a new version entry at the top.

### Step 2 — Fill Version Details

- **Version number** — SemVer (e.g. `1.2.0`)
- **Date** — release date
- **Type** — Major (💥), Minor (✨), or Patch (🔧)

### Step 3 — Add Changes

Click **+ Add Change** inside a version card and:

- Choose type: **Add**, **Fix**, **Break**, or **Dep** (Deprecated)
- Enter the change description

### Step 4 — Preview & Export

The right panel shows a live Markdown preview. Click **⬇️ CHANGELOG.md** to export.

---

## 9. Publish Wizard

**Goal:** Walk through every step needed to publish your extension to the VS Code Marketplace.

Work through each step in order:

1. Create Azure DevOps account & Personal Access Token
2. Install `vsce` CLI
3. Create your publisher profile
4. Package your extension (`.vsix`)
5. Test locally by installing the `.vsix`
6. Publish to Marketplace
7. Add a Marketplace badge to your README

Check each checkbox as you complete it. The progress bar tracks your overall completion.

---

## 10. Templates

**Goal:** Skip setup entirely — load a pre-configured extension template.

Browse the template grid and click **⚡ Use Template** on any card. This instantly fills the Extension Builder sidebar with the template's configuration. Then click **⚡ Generate Extension** to build it.

---

## 11. Tips & Tricks

**Use templates as a starting point** — even if your extension is very different, loading a similar template pre-selects the right features and commands, saving time.

**Combine tools in a real workflow:**

1. Use **Templates** → load a base
2. **Extension Builder** → customize & generate
3. **Theme Creator** → design your extension's bundled theme
4. **Icon Pack** → draw custom file icons
5. **Snippet Studio** → add built-in snippets
6. **Changelog Builder** → document your release
7. **Publish Wizard** → step through publishing

**Theme tip** — Start with a preset close to your target, then tweak individual tokens. The most impactful colors are `editor.background`, `tab.activeBorderTop`, `activityBar.background`, and `statusBar.background`.

**Icon tip** — Use the Quick Shapes palette as a base, then overdraw details with the pencil. Draw at 32px and export at multiple sizes for the best quality.

**Snippet tip** — Use `${1:descriptive_name}` placeholders — the description helps teammates understand what to fill in when using your snippet.

---

_ExtForge Studio v2 — Free & Open Source · Made by [Abdelrahman Ayman](https://www.linkedin.com/in/abdelrahman968/)_
