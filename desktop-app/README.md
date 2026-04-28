# Universal Skills Hub - Desktop App

A desktop application for installing AI agent skills directly from the Universal Skills Hub directory.

## Features

- **Agent Detection**: Automatically detects installed AI coding agents (Claude Code, Cursor, OpenCode, Windsurf, Cline, Gemini CLI)
- **Skill Browser**: Browse and search skills from the Universal Skills Hub directory
- **One-Click Install**: Install skills to one or multiple agents with a single click
- **Offline Support**: Cache skills locally for offline browsing

## Visual Design

The app follows the same dark theme with cyan/violet accents as the main website:
- Background: `#0B0B0B`
- Cards: `#111111`
- Accent: `#00d4ff` (cyan)
- Secondary: `#8b5cf6` (violet)

## Development

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Tauri CLI

### Setup

```bash
cd desktop-app
npm install
```

### Development Mode

```bash
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

This will generate:
- Windows: `.exe` installer in `src-tauri/target/release/bundle/`

## Architecture

```
┌─────────────────────────────────────────┐
│         React Frontend (Vite)           │
│  - Skill browser with filters           │
│  - Agent selection panel                │
│  - Installation results                 │
└──────────────────┬──────────────────────┘
                   │ Tauri Commands
┌──────────────────▼──────────────────────┐
│         Rust Backend (Tauri)            │
│  - detect_agents() - Find installed     │
│  - install_skill() - Run npx commands   │
│  - open_terminal() - Terminal access    │
└─────────────────────────────────────────┘
```

## Integration with Web

The desktop app can be downloaded from the main website. Add a download section in the footer or hero:

```html
<a href="https://github.com/your-repo/releases/latest/download/Universal-Skills-Hub.exe">
  Download Desktop App
</a>
```