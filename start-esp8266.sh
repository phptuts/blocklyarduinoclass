#!/usr/bin/env bash
git pull
cd blockly/apps/blocklyduino
npm install
node app_ide_only.js
