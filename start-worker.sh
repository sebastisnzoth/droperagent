#!/bin/bash
# Restart one combined API + worker process after crashes.
# For unattended startup, install as a user launchd LaunchAgent separately.
set -u
cd "$(dirname "$0")" || exit 1
mkdir -p logs
export HOST="${HOST:-127.0.0.1}"
while :; do
  node src/index.js >> logs/server.log 2>&1
  code=$?
  echo "$(date) DroperAgent exited with code $code; restarting" >> logs/server.log
  sleep 5
done
