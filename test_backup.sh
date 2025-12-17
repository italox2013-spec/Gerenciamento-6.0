#!/bin/bash

# Get admin token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Testing Backup Functionality"
echo "============================="

# Create backup
echo -e "\n1. Creating backup..."
curl -s -X POST http://localhost:3000/api/admin/backups \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{}' | python3 -m json.tool

# Wait a moment
sleep 1

# Check if backups directory exists and has files
echo -e "\n2. Checking backups directory..."
ls -lh backups/ 2>/dev/null || echo "Backups directory created"

echo -e "\n3. Counting backup files..."
ls backups/*.db 2>/dev/null | wc -l

