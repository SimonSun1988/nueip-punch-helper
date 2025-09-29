#!/usr/bin/env node

/**
 * 登入測試腳本
 * 專門用於測試和調試登入功能
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();

class LoginTester {
  constructor() {
    // 從環境變數讀取設定，如果沒有設定則使用預設值
    this.companyCode = process.env.COMPANY_CODE;
    this.employeeId = process.env.EMPLOYEE_ID;
    this.password = process.env.PASSWORD;
    this.showBrowser = process.env.SHOW_BROWSER;
    this.chromePath = process.env.CHROME_PATH;
    this.loginUrl = 'https://portal.nueip.com/login';
  }

  /**
   * 尋找 Chrome 執行檔路徑
   */
  async findChromeExecutable() {
    // 首先檢查環境變數
    if (this.chromePath) {
      if (fs.existsSync(this.chromePath)) {
        console.log(`使用環境變數中的 Chrome 路徑: ${this.chromePath}`);
        return this.chromePath;
      }
    }

    const platform = os.platform();
    const possiblePaths = [];

    if (platform === 'darwin') {
      possiblePaths.push(
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium'
      );
    } else if (platform === 'linux') {
      possiblePaths.push(
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium'
      );
    } else if (platform === 'win32') {
      const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
      const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
      
      possiblePaths.push(
        path.join(programFiles, 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(programFilesX86, 'Google\\Chrome\\Application\\chrome.exe')
      );
    }

    for (const chromePath of possiblePaths) {
      if (fs.existsSync(chromePath)) {
        return chromePath;
      }
    }

    throw new Error('找不到 Chrome 瀏覽器');
  }

  /**
   * 啟動瀏覽器
   */
  async launchBrowser() {
    const executablePath = await this.findChromeExecutable();
    console.log(`使用 Chrome: ${executablePath}`);
    console.log(`瀏覽器模式: ${this.showBrowser ? '顯示視窗' : '無頭模式'}`);
    
    return await puppeteer.launch({
      executablePath: executablePath,
      headless: this.showBrowser, // 根據環境變數決定是否顯示瀏覽器視窗
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
  }

  /**
   * 測試登入功能
   */
  async testLogin() {
    let browser = null;
    try {
      console.log('🚀 開始登入測試...');
      
      browser = await this.launchBrowser();
      const page = await browser.newPage();

      // 前往登入頁面
      console.log('前往登入頁面...');
      await page.goto(this.loginUrl, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(3000);

      // 截圖保存登入頁面
      await page.screenshot({ path: 'login-page.png', fullPage: true });
      console.log('已截圖保存為 login-page.png');

      // 分析頁面結構
      console.log('\n📋 分析頁面結構...');
      const pageInfo = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        const buttons = Array.from(document.querySelectorAll('button, span, div, a, [class*="button"], [class*="btn"]'));
        
        return {
          inputs: inputs.map(input => ({
            tag: input.tagName,
            type: input.type,
            name: input.name,
            placeholder: input.placeholder,
            className: input.className,
            id: input.id
          })),
          buttons: buttons.map(btn => ({
            tag: btn.tagName,
            text: btn.textContent.trim(),
            className: btn.className,
            id: btn.id,
            onclick: btn.getAttribute('onclick')
          })).filter(btn => btn.text.length > 0)
        };
      });

      console.log('\n📝 找到的輸入框:');
      console.log(JSON.stringify(pageInfo.inputs, null, 2));

      console.log('\n🔘 找到的按鈕:');
      console.log(JSON.stringify(pageInfo.buttons, null, 2));

      // 嘗試填入表單
      console.log('\n📝 嘗試填入表單...');
      
      // 尋找公司代碼輸入框
      const companyCodeInput = await page.evaluateHandle(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'));
        return inputs.find(input => 
          input.placeholder?.includes('公司') || 
          input.placeholder?.includes('代碼') ||
          input.name?.includes('company') ||
          input.name?.includes('code')
        ) || inputs[0];
      });

      if (companyCodeInput && await page.evaluate(el => el !== null, companyCodeInput)) {
        console.log('✅ 找到公司代碼輸入框');
        await companyCodeInput.type(this.companyCode);
        console.log('已填入公司代碼');
      } else {
        console.log('❌ 找不到公司代碼輸入框');
      }

      // 尋找員工編號輸入框
      const employeeIdInput = await page.evaluateHandle(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'));
        return inputs.find(input => 
          input.placeholder?.includes('員工') || 
          input.placeholder?.includes('編號') ||
          input.name?.includes('employee') ||
          input.name?.includes('id')
        ) || inputs[1];
      });

      if (employeeIdInput && await page.evaluate(el => el !== null, employeeIdInput)) {
        console.log('✅ 找到員工編號輸入框');
        await employeeIdInput.type(this.employeeId);
        console.log('已填入員工編號');
      } else {
        console.log('❌ 找不到員工編號輸入框');
      }

      // 尋找密碼輸入框
      const passwordInput = await page.evaluateHandle(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="password"]'));
        return inputs[0];
      });

      if (passwordInput && await page.evaluate(el => el !== null, passwordInput)) {
        console.log('✅ 找到密碼輸入框');
        await passwordInput.type(this.password);
        console.log('已填入密碼');
      } else {
        console.log('❌ 找不到密碼輸入框');
      }

      // 等待一下讓使用者觀察
      console.log('\n⏳ 等待 5 秒讓您觀察頁面...');
      await page.waitForTimeout(5000);

      // 尋找登入按鈕
      console.log('\n🔍 尋找登入按鈕...');
      const loginButton = await page.evaluateHandle(() => {
        const elements = Array.from(document.querySelectorAll('button, span, div, a, [class*="button"], [class*="btn"]'));
        return elements.find(el => {
          const text = el.textContent.toLowerCase().trim();
          return text.includes('登入') || 
                 text.includes('登錄') ||
                 text.includes('login') ||
                 text.includes('sign in');
        });
      });

      if (loginButton && await page.evaluate(el => el !== null, loginButton)) {
        console.log('✅ 找到登入按鈕');
        console.log('點擊登入按鈕...');
        await loginButton.click();
        
        // 等待登入結果
        console.log('等待登入結果...');
        await page.waitForTimeout(5000);
        
        // 檢查是否登入成功
        const currentUrl = page.url();
        console.log(`當前 URL: ${currentUrl}`);
        
        if (currentUrl.includes('home') || currentUrl.includes('dashboard')) {
          console.log('✅ 登入成功！');
        } else {
          console.log('❌ 登入可能失敗，URL 沒有跳轉到首頁');
        }
      } else {
        console.log('❌ 找不到登入按鈕');
      }

    } catch (error) {
      console.error('❌ 測試失敗:', error.message);
    } finally {
      if (browser) {
        console.log('\n⏳ 等待 10 秒後關閉瀏覽器...');
        await page.waitForTimeout(10000);
        await browser.close();
      }
    }
  }
}

// 執行測試
async function main() {
  const tester = new LoginTester();
  await tester.testLogin();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 測試執行失敗:', error.message);
    process.exit(1);
  });
}

module.exports = LoginTester;
