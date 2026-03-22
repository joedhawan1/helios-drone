# Helios

**Helios** is a mobile app that lets users command an orbital reflector satellite to direct sunlight onto a GPS-targeted location — right from their phone. Point the camera, tap capture, and the satellite does the rest.

Built with React Native and Expo Go. No login required.

---

## Features

- **Live camera targeting** — Point your camera at any location and lock it in with a precision reticle overlay
- **GPS-based illumination commands** — Your device coordinates are bundled with each capture and transmitted to the satellite endpoint
- **Satellite connection management** — Connect via WebSocket or HTTP to any compatible satellite control server
- **Demo mode** — Fully simulated satellite experience with no real hardware required
- **Persistent settings** — Endpoint credentials are saved locally across sessions
- **In-app documentation** — Setup guides, FAQ, and protocol reference built right in

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 54 |
| Navigation | [expo-router](https://expo.github.io/router) v6 (file-based) |
| Camera | expo-camera |
| Location | expo-location |
| Storage | @react-native-async-storage/async-storage |
| Language | TypeScript |
| Styling | React Native StyleSheet (no external UI lib) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18 or later
- [Expo Go](https://expo.dev/go) installed on your iOS or Android device
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/joedhawan/helios.git
cd helios

# Install dependencies
npm install --legacy-peer-deps

# Start the development server
npx expo start
```

Scan the QR code in your terminal with the **Expo Go** app on your device.

---

## Connecting to a Satellite

1. Open the **Settings** tab
2. Enter the credentials provided by your satellite service provider:
   - **Host** — IP address or hostname (e.g. `control.example.com`)
   - **Port** — e.g. `8080`
   - **Access Code** — your auth token (leave blank if not required)
   - **Protocol** — `WS` (WebSocket) or `HTTP`
3. Tap **Connect to Satellite**

> **No satellite access yet?** Set Host to `demo` to simulate the full experience locally.

### Expected Server Protocol

The app communicates using a simple JSON protocol over WebSocket or HTTP.

**WebSocket — Client to Server:**
```json
{ "type": "auth", "payload": { "code": "YOUR_ACCESS_CODE" } }
{ "type": "illuminate", "payload": { "commandId": "ABC123", "coordinates": { "latitude": 38.8977, "longitude": -77.0366, "altitude": 15.2 }, "timestamp": 1711580400000 } }
```

**WebSocket — Server to Client:**
```json
{ "type": "auth_ok" }
{ "type": "illuminate_ack", "payload": { "commandId": "ABC123", "eta": 3000 } }
{ "type": "illuminate_active", "payload": { "commandId": "ABC123" } }
{ "type": "error", "payload": { "message": "Target out of range" } }
```

**HTTP Endpoints:**
```
GET  /ping                → 200 { "status": "online" }
POST /illuminate          → 202 { "commandId": "...", "eta": 3000 }
GET  /status/:commandId   → 200 { "status": "active" | "pending" | "error" }
```

---

## Project Structure

```
helios/
├── app/                        # expo-router screens (file-based routing)
│   ├── _layout.tsx             # Root layout — wraps app in providers
│   └── (tabs)/
│       ├── _layout.tsx         # Tab bar configuration
│       ├── index.tsx           # Camera screen
│       ├── settings.tsx        # Settings screen
│       └── docs.tsx            # Documentation screen
├── src/
│   ├── types/satellite.ts      # Shared TypeScript interfaces
│   ├── constants/              # Design tokens (colors, layout)
│   ├── services/
│   │   └── SatelliteService.ts # WebSocket/HTTP/mock communication layer
│   ├── context/
│   │   └── SatelliteContext.tsx# Global React state bridge
│   ├── hooks/                  # useSatellite, useLocation
│   ├── components/
│   │   ├── ui/                 # Card, GlowButton, StatusBadge
│   │   ├── camera/             # TargetingReticle, HUDOverlay, CaptureButton
│   │   └── settings/           # ConnectionForm
│   └── utils/formatters.ts     # Coordinate and status formatters
├── assets/                     # App icon and splash screen
├── app.json                    # Expo configuration
└── package.json
```

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

---

## License

MIT — see [LICENSE](LICENSE) for details.
