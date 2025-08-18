#!/bin/bash
while true; do
    echo "Starting script..."
    node capture.js
    echo "Script crashed with exit code $?. Restarting in 5 seconds..."
    sleep 5
done