#!/bin/bash
# Start DroperAgent as persistent worker

LOG_DIR="$(dirname "$0")/logs"
mkdir -p "$LOG_DIR"

# Function to check if server is running
check_server() {
    curl -s http://localhost:3000/health > /dev/null 2>&1
}

# Function to restart server
restart_server() {
    echo "$(date): Restarting DroperAgent server..."
    
    # Kill existing
    pkill -f "node.*index.js" 2>/dev/null
    
    # Wait
    sleep 1
    
    # Start new
    cd "$(dirname "$0")"
    nohup node src/index.js >> "$LOG_DIR/server.log" 2>&1 &
    
    # Wait for startup
    sleep 3
    
    if check_server; then
        echo "$(date): Server restarted successfully"
        return 0
    else
        echo "$(date): Server restart failed"
        return 1
    fi
}

# Main loop
echo "$(date): Starting DroperAgent worker..."

# Initial start
restart_server

# Monitoring loop
while true; do
    if ! check_server; then
        echo "$(date): Server not responding, restarting..."
        restart_server
    fi
    sleep 10
done
