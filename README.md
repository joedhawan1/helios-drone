# Helios Drone

**Helios Drone** is an extension of [Helios](https://github.com/joedhawan1/helios) — the original orbital reflector satellite control app — rebuilt around drones instead of satellites. The same phone-to-target illumination concept, now using a drone-mounted 50W LED spotlight you can build and own for under $500.

Built with React Native and Expo. No login required. Works with any drone running the included companion server.

---

## How It Works

1. **Aim** — Point your phone camera at the target location
2. **Capture** — Tap the capture button; the app reads your GPS coordinates
3. **Illuminate** — A command is sent to the drone over WiFi; the LED activates in under 500ms

The drone runs a lightweight Node.js server on a Raspberry Pi companion computer. The server receives commands over WebSocket or HTTP and drives a 50W LED module via GPIO. No cloud relay — your phone talks directly to the drone.

---

## Features

- **Live camera targeting** — Precision reticle overlay with real-time GPS readout
- **Direct drone connection** — WebSocket or HTTP over drone WiFi (no internet required)
- **Sub-500ms activation** — LED activates within half a second of command receipt
- **Demo mode** — Full simulated experience with no hardware needed (set host to `demo`)
- **Persistent settings** — Connection credentials saved locally across sessions
- **In-app documentation** — Setup guide, FAQ, and protocol reference built in
- **Companion server included** — `drone-server/` runs on Raspberry Pi and controls GPIO

---

## Tech Stack

### Mobile App

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 54 |
| Navigation | [expo-router](https://expo.github.io/router) v6 (file-based) |
| Camera | expo-camera |
| Location | expo-location |
| Storage | @react-native-async-storage/async-storage |
| Language | TypeScript |
| Styling | React Native StyleSheet (no external UI lib) |

### Drone Server

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 on Raspberry Pi |
| WebSocket | ws |
| HTTP | Express |
| GPIO | onoff (Raspberry Pi sysfs GPIO) |
| Language | TypeScript |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18 or later
- [Expo Go](https://expo.dev/go) on your iOS or Android device

### Mobile App

```bash
git clone https://github.com/joedhawan/lumen.git
cd lumen

npm install --legacy-peer-deps
npx expo start
```

Scan the QR code with **Expo Go**. To test without a drone, open Settings and set Host to `demo`.

### Drone Server (Raspberry Pi)

```bash
cd drone-server
npm install
npm run build

# Run with real GPIO (on Raspberry Pi)
NODE_ENV=production LED_PIN=18 npm start

# Run in mock mode (any machine — no GPIO required)
npm run dev:mock
```

See [`drone-server/README.md`](drone-server/README.md) for full hardware wiring instructions, WiFi access point setup, and systemd service configuration.

---

## Connecting the App to Your Drone

1. Power on the drone and companion computer
2. Connect your phone to the **HELIOS-DRONE** WiFi network
3. Open the **Settings** tab in the app
4. Enter:
   - **Host** — `192.168.4.1` (drone RPi AP address)
   - **Port** — `8080`
   - **Access Code** — leave blank unless you set `ACCESS_CODE` on the server
   - **Protocol** — `WS` (recommended) or `HTTP`
5. Tap **Connect to Drone**

---

## Hardware

The recommended drone server build costs around **$500** and produces **~4,500–5,000 lumens**:

| Component | Part | Cost |
|---|---|---|
| Companion computer | Raspberry Pi 4 | ~$80 |
| LED module | 50W COB Cool White (30–36V) | ~$20 |
| MOSFET driver | IRLZ44N (logic-level N-channel) | ~$2 |
| Power supply | Mean Well LRS-100-36 (36V/3A) | ~$25 |
| Gate resistor | 100Ω resistor | <$1 |
| Flyback diode | 1N4007 | <$1 |

Wiring and RPi configuration details are in [`drone-server/README.md`](drone-server/README.md).

---

## Protocol Reference

The drone server implements a simple JSON protocol over WebSocket or HTTP.

**WebSocket:**
```json
// Auth (if ACCESS_CODE is set)
{ "type": "auth", "payload": { "code": "YOUR_CODE" } }
{ "type": "auth_ok" }

// Illuminate
{ "type": "illuminate", "payload": { "commandId": "ABC123", "coordinates": { "latitude": 38.8977, "longitude": -77.0366, "altitude": 15.2 }, "timestamp": 1711580400000 } }
{ "type": "illuminate_ack", "payload": { "commandId": "ABC123", "eta": 500 } }
{ "type": "illuminate_active", "payload": { "commandId": "ABC123" } }
{ "type": "error", "payload": { "message": "..." } }
```

**HTTP:**
```
GET  /ping                → 200 { "status": "online" }
POST /illuminate          → 202 { "commandId": "...", "eta": 500 }
GET  /status/:commandId   → 200 { "status": "pending" | "active" | "completed" | "error" }
```

---

## Project Structure

```
lumen/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout with DroneProvider
│   └── (tabs)/
│       ├── _layout.tsx           # Tab bar (Camera, Settings, Docs)
│       ├── index.tsx             # Camera targeting screen
│       ├── settings.tsx          # Drone connection settings
│       └── docs.tsx              # In-app documentation
├── src/
│   ├── types/drone.ts            # Shared TypeScript interfaces
│   ├── constants/                # Colors, spacing tokens
│   ├── services/DroneService.ts  # WebSocket / HTTP / mock comms
│   ├── context/DroneContext.tsx  # Global React state
│   ├── hooks/                    # useDrone, useLocation
│   ├── components/
│   │   ├── ui/                   # Card, GlowButton, StatusBadge
│   │   ├── camera/               # TargetingReticle, HUDOverlay, CaptureButton
│   │   └── settings/             # ConnectionForm
│   └── utils/formatters.ts       # Coordinate and status formatters
├── drone-server/                 # Raspberry Pi companion server
│   ├── src/
│   │   ├── server.ts             # Express + WebSocket server
│   │   ├── ledController.ts      # GPIO / mock LED abstraction
│   │   ├── commandManager.ts     # Command lifecycle and timers
│   │   ├── config.ts             # Env-var configuration
│   │   └── types.ts              # Protocol type definitions
│   └── README.md                 # Hardware wiring + RPi setup guide
├── docs/index.html               # Marketing / documentation website
├── assets/                       # App icon and splash screen
├── app.json                      # Expo configuration
└── package.json
```

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

---

## License

MIT — see [LICENSE](LICENSE) for details.
