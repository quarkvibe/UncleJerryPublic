#!/bin/bash

# Install PM2 globally
npm install -g pm2

# Set PM2 to start on boot
pm2 startup

# Save current PM2 configuration
pm2 save