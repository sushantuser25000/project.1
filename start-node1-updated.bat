@echo off 
REM === Node1 Startup (Windows) - Updated for dApp Development ===

REM --- Node data directory and signer account ---
set DATADIR=D:\projects\geth\node1
set SIGNER=6bbb7f23448dbf15ebb4f0a2f0e09fc9b2bd9c2f

REM --- Initialize node (only once, comment out after first run) ---
REM geth --datadir %DATADIR% init D:\major\genesis.json
REM --- sushant
REM --- Start node in same window ---
start "" geth --datadir %DATADIR% ^
  --networkid 2025 ^
  --port 30303 ^
  --http ^
  --http.addr 0.0.0.0 ^
  --http.port 8545 ^
  --http.api eth,net,web3,personal,clique,admin,miner ^
  --http.corsdomain "*" ^
  --http.vhosts "*" ^
  --ws ^
  --ws.addr 0.0.0.0 ^
  --ws.port 8546 ^
  --ws.api eth,net,web3,personal,clique ^
  --ws.origins "*" ^
  --authrpc.port 8551 ^
  --unlock %SIGNER% ^
  --password %DATADIR%\password.txt ^
  --mine ^
  --miner.etherbase %SIGNER% ^
  --allow-insecure-unlock ^
  --nodiscover ^
  --syncmode full ^
  --miner.gasprice 0 ^
  --verbosity 3

