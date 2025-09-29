#!/usr/bin/env node

/**
 * Chrome 路徑測試腳本
 * 用於測試和診斷 Chrome 瀏覽器路徑問題
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

class ChromePathTester {
  constructor() {
    this.platform = os.platform();
    this.possiblePaths = this.getPossiblePaths();
  }

  /**
   * 獲取可能的 Chrome 路徑
   */
  getPossiblePaths() {
    const paths = [];

    if (this.platform === 'darwin') {
      // macOS
      paths.push(
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        path.join(os.homedir(), '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
      );
    } else if (this.platform === 'linux') {
      // Linux
      paths.push(
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium'
      );
    } else if (this.platform === 'win32') {
      // Windows
      const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
      const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
      
      paths.push(
        path.join(programFiles, 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(programFilesX86, 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
      );
    }

    return paths;
  }

  /**
   * 測試所有可能的 Chrome 路徑
   */
  testAllPaths() {
    console.log('🔍 測試 Chrome 瀏覽器路徑...');
    console.log(`作業系統: ${this.platform}`);
    console.log('=====================================');

    let foundPaths = [];

    // 測試檔案系統路徑
    for (const chromePath of this.possiblePaths) {
      const exists = this.testPath(chromePath);
      if (exists) {
        foundPaths.push(chromePath);
      }
    }

    // 測試系統 PATH 中的命令
    const commandPaths = this.testSystemCommands();
    foundPaths = foundPaths.concat(commandPaths);

    console.log('=====================================');
    
    if (foundPaths.length > 0) {
      console.log('✅ 找到以下可用的 Chrome 路徑:');
      foundPaths.forEach((path, index) => {
        console.log(`  ${index + 1}. ${path}`);
      });
      
      console.log('\n💡 建議使用第一個路徑，或設定環境變數:');
      console.log(`   export CHROME_PATH="${foundPaths[0]}"`);
    } else {
      console.log('❌ 找不到 Chrome 瀏覽器');
      this.showInstallInstructions();
    }

    return foundPaths;
  }

  /**
   * 測試單一路徑
   */
  testPath(chromePath) {
    try {
      if (fs.existsSync(chromePath)) {
        console.log(`✅ 找到: ${chromePath}`);
        return true;
      } else {
        console.log(`❌ 不存在: ${chromePath}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ 錯誤: ${chromePath} - ${error.message}`);
      return false;
    }
  }

  /**
   * 測試系統命令
   */
  testSystemCommands() {
    const commands = [];
    const foundPaths = [];

    if (this.platform === 'win32') {
      commands.push('chrome', 'google-chrome');
    } else {
      commands.push('google-chrome', 'chromium', 'chromium-browser');
    }

    for (const command of commands) {
      try {
        execSync(`which ${command}`, { stdio: 'ignore' });
        console.log(`✅ 系統命令: ${command}`);
        foundPaths.push(command);
      } catch (error) {
        try {
          execSync(`where ${command}`, { stdio: 'ignore' });
          console.log(`✅ 系統命令: ${command}`);
          foundPaths.push(command);
        } catch (error2) {
          console.log(`❌ 系統命令: ${command} (未找到)`);
        }
      }
    }

    return foundPaths;
  }

  /**
   * 顯示安裝說明
   */
  showInstallInstructions() {
    console.log('\n📋 安裝 Chrome 瀏覽器:');
    console.log('=====================================');

    if (this.platform === 'darwin') {
      console.log('macOS:');
      console.log('  1. 前往 https://www.google.com/chrome/');
      console.log('  2. 下載並安裝 Google Chrome');
      console.log('  3. 或使用 Homebrew: brew install --cask google-chrome');
    } else if (this.platform === 'linux') {
      console.log('Linux:');
      console.log('  Ubuntu/Debian:');
      console.log('    sudo apt-get update');
      console.log('    sudo apt-get install google-chrome-stable');
      console.log('  或安裝 Chromium:');
      console.log('    sudo apt-get install chromium-browser');
    } else if (this.platform === 'win32') {
      console.log('Windows:');
      console.log('  1. 前往 https://www.google.com/chrome/');
      console.log('  2. 下載並安裝 Google Chrome');
    }

    console.log('\n💡 安裝完成後，重新執行此腳本測試。');
  }

  /**
   * 測試環境變數
   */
  testEnvironmentVariable() {
    console.log('\n🔧 檢查環境變數...');
    
    if (process.env.CHROME_PATH) {
      console.log(`CHROME_PATH: ${process.env.CHROME_PATH}`);
      if (fs.existsSync(process.env.CHROME_PATH)) {
        console.log('✅ 環境變數指定的路徑存在');
        return true;
      } else {
        console.log('❌ 環境變數指定的路徑不存在');
        return false;
      }
    } else {
      console.log('ℹ️  未設定 CHROME_PATH 環境變數');
      return false;
    }
  }
}

// 主程式
async function main() {
  const tester = new ChromePathTester();
  
  console.log('🚀 Chrome 路徑測試工具');
  console.log('=====================================');
  
  // 測試環境變數
  const envPathExists = tester.testEnvironmentVariable();
  
  if (!envPathExists) {
    // 測試所有可能的路徑
    const foundPaths = tester.testAllPaths();
    
    if (foundPaths.length === 0) {
      console.log('\n❌ 無法找到可用的 Chrome 瀏覽器');
      process.exit(1);
    }
  }
  
  console.log('\n✅ Chrome 路徑測試完成');
}

// 執行測試
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 測試失敗:', error.message);
    process.exit(1);
  });
}

module.exports = ChromePathTester;
