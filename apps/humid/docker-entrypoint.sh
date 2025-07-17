#!/bin/sh
set -e

# Ensure logs directory exists and has proper permissions
if [ ! -d "/app/logs/Humid" ]; then
    mkdir -p /app/logs/Humid
fi

# Make sure we have write permissions
if [ ! -w "/app/logs/Humid" ]; then
    echo "Warning: /app/logs/Humid is not writable. Logs may not be written to files."
fi

# Start the application
exec "$@"
