Releases page : https://github.com/gmailserviceorg-star/CornHub---Free-Corn-Images/releases
My profile : https://github.com/gmailserviceorg-star

# CornHub - Free Corn Images

Remote Control Hub (RAC)

A consent-based remote access control project for devices you own or are authorized to administer.

## Pairing

The controller's web page is intentionally minimal: it shows one automatically generated 64-character pairing code. Click the code to copy it.

On the device being enrolled, open `agent/code.js` and change:

```js
const DEVICE_CODE = "PLACEHOLDER-CODE";
```

to the copied 64-character code. If the placeholder is still present, or the code is not exactly 64 hexadecimal characters, the agent refuses to start enrollment.

Pairing codes are one-time codes. After a successful enrollment, generate a new code for another device.

## Current controls

The controller supports authenticated, predefined actions: ping, lock, restart, and shutdown. It does not expose an arbitrary remote shell.

## Run

### Controller

```bash
cd controller
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
set CONTROLLER_TOKEN=your-management-token
python server.py
```

Open `http://127.0.0.1:8080/` to generate the pairing code.

### Agent

Install Python and the agent dependency on the authorized device:

```bash
cd agent
pip install -r requirements.txt
python agent.py --controller http://CONTROLLER-PC:8080 --token your-management-token
```

The controller currently binds to localhost by default. If you intentionally make it reachable by other devices, protect it with network controls and TLS/reverse proxying rather than exposing it directly to the public internet.

### Manager terminal

The project also includes `code.js` for selecting the manager mode. Keep `DEVICE_TYPE` as `Desktop` for the normal dashboard, or set it to `HomePhone` to open a terminal-style interface at `http://localhost:3000`. Replace `DEVICE_CODE` with the 64-character pairing code from the paired device. The terminal intentionally exposes only RAC allowlisted commands; it is not an arbitrary remote shell.

Run the manager with `npm install` followed by `npm start`.
