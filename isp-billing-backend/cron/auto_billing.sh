#!/bin/bash
# Auto Billing Service - Linux/Mac Shell Script
# Run this script daily to generate monthly bills

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to project directory
cd "$PROJECT_DIR"

# Run auto billing
python cron/auto_billing.py
