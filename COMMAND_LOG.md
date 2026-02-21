# 📟 Terminal Command Log

This file tracks the commands executed during this session for record-keeping and troubleshooting.

## � Project Links
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Blockchain RPC**: [http://localhost:8545](http://localhost:8545)
- **Backend Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

## 🌐 Remote & LAN Access
- **Frontend (LAN)**: [http://192.168.254.11:3000](http://192.168.254.11:3000)
- **Backend (LAN)**: [http://192.168.254.11:5000](http://192.168.254.11:5000)
- **Blockchain (LAN)**: [http://192.168.254.11:8545](http://192.168.254.11:8545)

## 📅 Session Log

### 2026-02-10 | 20:04:17
- `npm run dev` (Backend & Frontend): Restarted services with `--host 0.0.0.0` binding for local network access to http://192.168.254.11:3000.

### 2026-02-10 | 19:08:29
- `npm install googleapis`: Installed Google Drive SDK for restricted storage.
- `taskkill /F /IM geth.exe /T`: Stopped existing blockchain processes.
- `taskkill /F /IM node.exe /T`: Stopped running servers.
- `Remove-Item -Path "D:\projects\geth\node1\geth" -Recurse -Force`: Wiped blockchain state.
- `geth --datadir D:\projects\geth\node1 init genesis.json`: Re-initialized blockchain at Block #0.
- `Remove-Item -Path "backend/uploads" -Recurse`: Cleared local storage to migrate to Google Drive.
- `npm cache clean --force`: Cleared npm cache for a fresh start.
- `Remove-Item -Path "*.md"`: Consolidated 11 redundant documentation files into `unnecessary.md`.

### 2026-02-10 | 19:04:08
- `.\start-node1-updated.bat`: Started Geth blockchain node in background.
- `npx hardhat run scripts/deploy.js --network localhost`: Deployed `UserAuth` contract to the fresh blockchain.
- `npm run dev` (Backend): Started API server on port 5000 connected to new contract.
- `npm run dev` (Frontend): Started Vite development server on port 3000.

---
*Next commands will be appended above this line with date and time.*
