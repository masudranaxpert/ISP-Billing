@echo off
REM Auto Billing Service - Windows Batch Script
REM Run this script daily to generate monthly bills

cd /d "%~dp0.."
python cron\auto_billing.py

REM Uncomment below to pause and see output
REM pause
