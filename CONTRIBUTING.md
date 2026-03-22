# Contributing to Helios

Thank you for your interest in contributing. This document covers how to get set up, the conventions used in this project, and the process for submitting changes.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Project Conventions](#project-conventions)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Issues](#reporting-issues)

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/helios.git
   cd helios
   ```
3. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```
4. **Start the dev server:**
   ```bash
   npx expo start
   ```
5. Scan the QR code with [Expo Go](https://expo.dev/go) on your device

---

## Development Workflow

- Create a new branch for every feature or fix:
  ```bash
  git checkout -b feat/my-feature
  # or
  git checkout -b fix/issue-description
  ```
- Keep commits small and focused. One logical change per commit.
- Test on a real device via Expo Go before submitting — do not rely solely on the simulator.
- Use `host = demo` in Settings to test satellite flows without real hardware.

---

## Code Style

- **TypeScript** is required. Avoid `any` — use proper types from `src/types/satellite.ts`.
- **No external UI libraries.** All styling uses React Native `StyleSheet` and the design tokens in `src/constants/colors.ts` and `src/constants/layout.ts`.
- **No inline hex strings.** Import from `Colors` instead of writing `#3B82F6` directly in a component.
- **No new dependencies** without discussion in an issue first. Keep the bundle Expo Go compatible.
- Component files use **PascalCase** (`GlowButton.tsx`). Hook files use **camelCase** (`useSatellite.ts`).

---

## Project Conventions

### Adding a new screen

Use expo-router's file-based routing. Add a file under `app/(tabs)/` for a new tab, or under `app/` for a modal/stack screen. Update the tab layout in `app/(tabs)/_layout.tsx` if adding a tab.

### Adding a new component

Place it under `src/components/` in the appropriate subdirectory:

| Directory | Purpose |
|---|---|
| `ui/` | Generic reusable primitives (buttons, badges, cards) |
| `camera/` | Components rendered on top of the camera view |
| `settings/` | Form inputs and settings-specific UI |

### Modifying the satellite protocol

The communication layer lives entirely in `src/services/SatelliteService.ts`. The mock, WebSocket, and HTTP modes are each self-contained methods. If you add a new message type, add its TypeScript type to `src/types/satellite.ts` and the corresponding event to the `EventName` union first.

### Design tokens

Never hardcode colors or spacing values. Use:
- `Colors.*` from `src/constants/colors.ts`
- `Layout.spacing.*` and `Layout.borderRadius.*` from `src/constants/layout.ts`

---

## Submitting a Pull Request

1. Make sure your branch is up to date with `main`:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
2. Push your branch and open a pull request against `main`
3. Fill out the PR description with:
   - What was changed and why
   - Steps to test the change in Expo Go
   - Screenshots or screen recordings if the change is visual
4. A maintainer will review and may request changes before merging

---

## Reporting Issues

Open an issue on GitHub and include:

- A clear description of the problem or feature request
- Steps to reproduce (for bugs)
- Device type and OS version
- Expo Go version
- Any relevant error output from the Expo terminal
