#!/bin/bash

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Clone your repository
git clone https://github.com/vvverttt/ethscriptions-sales-bot.git
cd ethscriptions-sales-bot

# Install dependencies
npm install

# Start the bot with PM2
pm2 start npm --name "missing-phunks-bot" -- start

# Make PM2 start on system boot
pm2 startup
pm2 save

echo "Bot is now running and will start automatically on system reboot!" 