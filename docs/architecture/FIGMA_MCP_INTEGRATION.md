# Figma MCP Integration Architecture & Implementation Guide
# Smart Campus AI Management System

## 1. Overview
This specification defines the integration architecture between the **Official Figma Model Context Protocol (MCP)** and the **Smart Campus AI** repository. It serves as the single source of truth for connecting Figma designs with Antigravity AI agents and frontend engineering workflows.

---

## 2. Server Architecture: Remote vs. Desktop MCP

| Feature | Official Remote Figma MCP | Official Desktop Figma MCP |
| :--- | :--- | :--- |
| **Endpoint URL** | `https://mcp.figma.com/mcp` | `http://127.0.0.1:3845/mcp` |
| **Transport Protocol** | Stream / HTTP (OAuth Bearer) | Local HTTP Server |
| **Environment Required** | Any browser / client with internet | Figma Desktop App running with Dev Mode |
| **Query Mechanism** | Link-based (frame/node URL) | Selection-based & Link-based |
| **Design Extraction** | `get_design_context`, `get_variable_defs`, `download_assets` | `get_design_context`, `get_screenshot`, `get_variable_defs` |
| **Canvas Writeback** | `use_figma`, `create_new_file`, `upload_assets` | Limited / Dev Mode inspection |
| **Best Used For** | Continuous CI/CD, headless agents, remote teams | Active local developer pairing, quick frame inspection |

---

## 3. Configuration in Antigravity

The MCP servers are registered in `.agents/mcp_config.json`:

```json
{
  "mcpServers": {
    "stitch": {
      "serverUrl": "https://stitch.googleapis.com/mcp",
      "headers": {
        "X-Goog-Api-Key": "${GOOGLE_STITCH_API_KEY}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    "gsd": {
      "command": "npx",
      "args": ["-y", "-p", "@opengsd/gsd-core", "gsd-mcp-server"]
    },
    "figma": {
      "serverUrl": "https://mcp.figma.com/mcp"
    },
    "figma-desktop": {
      "serverUrl": "http://127.0.0.1:3845/mcp"
    }
  }
}
```

### Authentication Setup
1. **Remote MCP Server (`https://mcp.figma.com/mcp`)**:
   - Access requires a Figma account (Professional, Org, or Enterprise) with Dev Mode or Full seat.
   - When connecting for the first time, your client or IDE triggers an OAuth browser popup asking for authorization (`Allow Access`).
   - For headless or CLI environments, personal access tokens are specified via `FIGMA_ACCESS_TOKEN`.
2. **Desktop MCP Server (`http://127.0.0.1:3845/mcp`)**:
   - Launch Figma Desktop app.
   - Open any project file and press `Shift + D` to enter **Dev Mode**.
   - In the right-hand inspect panel, find **MCP Server** and toggle **Enable**.
   - No external OAuth or API token is required; the local server binds directly to `127.0.0.1:3845`.

---

## 4. Figma-to-Code Mapping Pipeline

```text
[ Figma Frame / Node URL ]
            ↓
  [ Figma MCP Server ]
   ├── get_design_context (extracts structure, layout, styles)
   ├── get_variable_defs  (extracts color, spacing, typography tokens)
   └── download_assets    (extracts vector SVGs and raw images)
            ↓
  [ Antigravity Token Harmonizer ]
   └── Replaces hardcoded hex/px values with var(--...) tokens from variables.css
            ↓
  [ Component Selector ]
   └── Replaces raw buttons, inputs, cards with src/components/ui/ components
            ↓
  [ React 18 + Framer Motion Generator ]
   └── Generates clean JSX + Scoped CSS module
            ↓
  [ Automated Verification Loop ]
   ├── Vite build check (`npm run build`)
   └── Playwright visual QA at 1440px & 390px
```

---

## 5. Token Harmonization Table

| Figma Spec / Property | Target CSS Variable | Purpose |
| :--- | :--- | :--- |
| `#F21722` (Primary Red) | `var(--brand)` / `var(--accent)` | Official brand accent |
| `#D9141E` / `#FF2E39` | `var(--brand-hover)` | Active hover states |
| Primary Canvas Background | `var(--bg-canvas)` | Base viewport surface |
| App Shell / Sidebar Background | `var(--bg-shell)` | Navigation shell |
| Content Card / Panel Surface | `var(--bg-card)` | Default elevated container |
| Higher Surface (Modal, Popover) | `var(--bg-card-elevated)` | Secondary layered surface |
| Primary Text Color | `var(--text-primary)` | High contrast body & titles |
| Secondary Text Color | `var(--text-secondary)` | Subtitles, metadata |
| Muted Text Color | `var(--text-muted)` | Disabled, placeholders, timestamps |
| Border Standard | `var(--border-color)` | Subtle component boundaries |
| 16px Radius | `var(--radius-xl)` | Large modals and hero cards |
| 12px Radius | `var(--radius-lg)` | Standard cards, containers, buttons |
| 8px Radius | `var(--radius-md)` | Form controls, tags, badges |
| 4px Radius | `var(--radius-sm)` | Tooltips, tiny chips |
| Card Shadow | `var(--shadow-card)` | Subtle enterprise elevation |
| Elevated Shadow | `var(--shadow-elevated)` | Modals, dropdowns, floating sheets |

---

## 6. Atomic Component Mapping Registry

All new UI generated from Figma must reuse `sci/frontend/src/components/ui/`:

1. **Buttons & Actions**:
   - `src/components/ui/Button/Button.jsx`
   - Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`
   - Sizes: `sm`, `md`, `lg`
   - Supports `loading` spinner and `icon` left-slot.
2. **Cards & Containers**:
   - `src/components/ui/Card/Card.jsx`
   - Interactive hover spring animations via `framer-motion`.
3. **Form Fields**:
   - `src/components/ui/Input/Input.jsx` (with built-in error states and password toggles).
   - `src/components/ui/Textarea/Textarea.jsx`
   - `src/components/ui/Select/Select.jsx` & `Dropdown.jsx`
   - `src/components/ui/SearchBar/SearchBar.jsx`
4. **Data & Feedback**:
   - `src/components/ui/DataTable/DataTable.jsx` (pagination, sorting).
   - `src/components/ui/Badge/Badge.jsx` (status indicator with dot support).
   - `src/components/ui/StatCard/StatCard.jsx` (KPI display with trend indicators).
   - `src/components/ui/ProgressBar/ProgressBar.jsx`
   - `src/components/ui/Skeleton/Skeleton.jsx` (smooth loading placeholders).
   - `src/components/ui/EmptyState/EmptyState.jsx`
5. **Overlays & Navigation**:
   - `src/components/ui/Modal/Modal.jsx` (accessible ESC key and backdrop close).
   - `src/components/ui/Tabs/Tabs.jsx`
   - `src/components/ui/PageHeader/PageHeader.jsx`
