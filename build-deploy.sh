#!/bin/bash
# 確保 app.js 回到原始狀態（未注入變數）
git checkout app.js

# 執行 build script
node build.js
