# Helios Drone Server

Companion computer server that runs on a Raspberry Pi mounted on a drone. Implements the Helios WebSocket + HTTP protocol and controls a high-power LED spotlight via GPIO.

## Hardware Requirements

### Drone Platform

Any drone with enough payload capacity to carry a Raspberry Pi + LED assembly (~200–400g total). Recommended builds:

| Option | Cost | Lumens | Notes |
|---|---|---|---|
| Custom Pixhawk 6C + RPi 4 + 50W LED | ~$500 | ~4,500 lm | Best value, full control |
| DJI M30 + GL60 Spotlight | ~$6,400 | 6,000 lm | Enterprise grade, uses DJI MSDK (not this server) |
| Any drone + RPi Zero 2W + 10W LED | ~$300 | ~900 lm | Lightest option |

### Electronics

- **Raspberry Pi 4** (or Pi 3B+ / Zero 2W)
- **50W LED COB module** — Cool White, 30–36V forward voltage (~$15–25 on Amazon)
- **IRLZ44N MOSFET** — Logic-level N-channel, Vgs(th) ~2V (works with RPi 3.3V GPIO)
- **36V DC power supply** — Mean Well LRS-100-36 (3A, 100W rated) or similar
- **100Ω resistor** — Gate resistor to limit inrush current
- **1N4007 diode** — Flyback protection across LED terminals
- **Heatsink** — For both the LED module and MOSFET

### Wiring Diagram

```
RPi BCM18 (Pin 12) ──[100Ω]──→ MOSFET Gate  (IRLZ44N pin 1)
RPi GND   (Pin 6)  ──────────→ MOSFET Source (IRLZ44N pin 2)
                                MOSFET Drain  (IRLZ44N pin 3) ──→ LED (–)
36V PSU (+) ────────────────────────────────────────────────────→ LED (+)
36V PSU (–) ────────────────────────────────────────────────────→ MOSFET Source / GND common
```

> **Important:** RPi GND and 36V PSU GND must share a common ground.
> The 1N4007 diode goes across the LED terminals (cathode to +, anode to –) as a flyback diode.

### Alternative: Smaller Setup (10W LED, Pi Zero 2W)

Replace the 50W COB + 36V PSU with a 10W LED module (9–12V) and a 12V BEC/PSU. Same wiring otherwise. Achieves ~900 lumens — good for close-range illumination (<10m).

---

## Software Setup on Raspberry Pi

### 1. Install Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Enable GPIO

On Raspberry Pi OS Bookworm, enable the legacy GPIO sysfs interface:

```bash
# Add to /boot/firmware/config.txt (or /boot/config.txt on older OS)
echo "dtoverlay=gpio-no-irq" | sudo tee -a /boot/firmware/config.txt
sudo reboot
```

Alternatively, install `pigpio` for hardware PWM support on BCM12/18:

```bash
sudo apt-get install -y pigpio python3-pigpio
```

### 3. Install and Build

```bash
git clone <your-repo-url>
cd drone-server
npm install
npm run build
```

### 4. Run

```bash
# Production (real GPIO, BCM pin 18, no auth)
NODE_ENV=production npm start

# With access code and custom pin
NODE_ENV=production ACCESS_CODE=mysecret LED_PIN=18 npm start

# Custom illuminate duration (60 seconds)
NODE_ENV=production ILLUMINATE_DURATION_MS=60000 npm start
```

### 5. Run as a systemd Service (auto-start on boot)

Create `/etc/systemd/system/helios-drone.service`:

```ini
[Unit]
Description=Helios Drone Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/drone-server
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=LED_PIN=18
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable helios-drone
sudo systemctl start helios-drone
sudo journalctl -u helios-drone -f  # view logs
```

---

## WiFi Access Point Setup

The phone needs to connect directly to the drone's WiFi. Configure the RPi as an access point:

```bash
sudo apt install -y hostapd dnsmasq

# /etc/hostapd/hostapd.conf
interface=wlan0
ssid=HELIOS-DRONE
hw_mode=g
channel=6
wpa=2
wpa_passphrase=helios1234
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP

# /etc/dnsmasq.conf (append)
interface=wlan0
dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h

# Static IP for wlan0
sudo nmcli con add type ethernet ifname wlan0 ipv4.addresses 192.168.4.1/24 \
  ipv4.method manual con-name "drone-ap"
```

In the Helios app Settings:
- **Host**: `192.168.4.1`
- **Port**: `8080`
- **Protocol**: `WS` (recommended) or `HTTP`

---

## Development / Mock Mode

Run on any machine without GPIO hardware:

```bash
npm run dev:mock
# or
MOCK_GPIO=true npm run dev
```

In mock mode, LED commands are printed to the console instead of activating GPIO:

```
[LED] ON
[LED] PWM 75%
[LED] OFF
```

Connect the Helios app with Host set to your machine's local IP (e.g. `192.168.1.42`) and Port `8080`.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8080` | TCP port the server listens on |
| `ACCESS_CODE` | `""` | Auth code (empty = no auth required) |
| `LED_PIN` | `18` | BCM GPIO pin number for LED MOSFET gate |
| `MOCK_GPIO` | `false` | Set to `true` to disable real GPIO |
| `NODE_ENV` | — | Set to `production` to enable real GPIO |
| `ILLUMINATE_DURATION_MS` | `30000` | How long LED stays on per command (ms) |
| `LED_PWM_FREQ` | `100` | Software PWM frequency in Hz |

---

## API Reference

The server implements the same protocol the Helios app expects.

### WebSocket (`ws://host:port`)

```
// Auth (if ACCESS_CODE is set)
Client → {"type": "auth", "payload": {"code": "YOUR_CODE"}}
Server → {"type": "auth_ok"}

// Illuminate
Client → {"type": "illuminate", "payload": {"commandId": "ABC-123", "coordinates": {"latitude": 37.7, "longitude": -122.4, "altitude": 15}, "timestamp": 1711580400000}}
Server → {"type": "illuminate_ack", "payload": {"commandId": "ABC-123", "eta": 500}}
Server → {"type": "illuminate_active", "payload": {"commandId": "ABC-123"}}  // sent after eta ms

// Error
Server → {"type": "error", "payload": {"message": "..."}}
```

### HTTP

```
GET  /ping
→ 200 {"status": "online"}

POST /illuminate
Body: {"commandId": "...", "coordinates": {...}, "timestamp": 123}
Header: x-access-code: YOUR_CODE  (if ACCESS_CODE is set)
→ 202 {"commandId": "...", "eta": 500}

GET  /status/:commandId
→ 200 {"status": "pending" | "active" | "completed" | "error"}
→ 404 {"error": "Command not found"}
```
