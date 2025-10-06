const puppeteer = require('puppeteer-core');
const moment = require('moment-timezone');
require('dotenv').config();

/**
 * 打卡服務類別
 */
class PunchService {
  constructor() {
    // 從環境變數讀取設定，如果沒有設定則使用預設值
    this.companyCode = process.env.COMPANY_CODE;
    this.employeeId = process.env.EMPLOYEE_ID;
    this.password = process.env.PASSWORD;
    this.showBrowser = process.env.SHOW_BROWSER;
    this.chromePath = process.env.CHROME_PATH;
    this.loginUrl = 'https://portal.nueip.com/login';
    this.homeUrl = 'https://portal.nueip.com/home';
  }

  /**
   * 生成指定範圍內的隨機延遲時間 (毫秒)
   * @param {number} minMinutes - 最小分鐘數
   * @param {number} maxMinutes - 最大分鐘數
   * @returns {number} 隨機延遲時間 (毫秒)
   */
  getRandomDelay(minMinutes, maxMinutes) {
    const minMs = minMinutes * 60 * 1000;
    const maxMs = maxMinutes * 60 * 1000;
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  }

  /**
   * 等待隨機時間
   * @param {number} minMinutes - 最小分鐘數
   * @param {number} maxMinutes - 最大分鐘數
   */
  async waitRandomTime(minMinutes, maxMinutes) {
    const delay = this.getRandomDelay(minMinutes, maxMinutes);
    console.log(`等待 ${Math.round(delay / 1000)} 秒...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * 啟動瀏覽器
   * @returns {Object} 瀏覽器實例
   */
  async launchBrowser() {
    console.log('啟動瀏覽器...');
    
    // 優先使用環境變數中的 Chrome 路徑，否則自動尋找
    let executablePath;
    if (this.chromePath) {
      console.log(`使用環境變數中的 Chrome 路徑: ${this.chromePath}`);
      executablePath = this.chromePath;
    } else {
      executablePath = await this.findChromeExecutable();
    }
    
    const browser = await puppeteer.launch({
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
    
    console.log(`瀏覽器模式: ${this.showBrowser ? '顯示視窗' : '無頭模式'}`);
    return browser;
  }

  /**
   * 尋找 Chrome 執行檔路徑
   * @returns {string} Chrome 執行檔路徑
   */
  async findChromeExecutable() {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    // 首先檢查環境變數
    if (process.env.CHROME_PATH) {
      console.log(`使用環境變數指定的 Chrome 路徑: ${process.env.CHROME_PATH}`);
      if (fs.existsSync(process.env.CHROME_PATH)) {
        return process.env.CHROME_PATH;
      } else {
        console.warn(`環境變數指定的 Chrome 路徑不存在: ${process.env.CHROME_PATH}`);
      }
    }

    const platform = os.platform();
    const possiblePaths = [];

    if (platform === 'darwin') {
      // macOS
      possiblePaths.push(
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        path.join(os.homedir(), '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
      );
    } else if (platform === 'linux') {
      // Linux
      possiblePaths.push(
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium'
      );
    } else if (platform === 'win32') {
      // Windows
      const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
      const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
      
      possiblePaths.push(
        path.join(programFiles, 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(programFilesX86, 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
      );
    }

    // 檢查每個可能的路徑
    for (const chromePath of possiblePaths) {
      try {
        if (fs.existsSync(chromePath)) {
          console.log(`找到 Chrome 執行檔: ${chromePath}`);
          return chromePath;
        }
      } catch (error) {
        // 繼續檢查下一個路徑
      }
    }

    // 如果找不到，嘗試使用系統 PATH 中的 chrome
    try {
      const { execSync } = require('child_process');
      if (platform === 'win32') {
        execSync('where chrome', { stdio: 'ignore' });
        return 'chrome';
      } else {
        execSync('which google-chrome', { stdio: 'ignore' });
        return 'google-chrome';
      }
    } catch (error) {
      // 最後嘗試 chromium
      try {
        execSync('which chromium', { stdio: 'ignore' });
        return 'chromium';
      } catch (error2) {
        throw new Error('找不到 Chrome 或 Chromium 瀏覽器。請安裝 Chrome 瀏覽器或設定 CHROME_PATH 環境變數。');
      }
    }
  }

  /**
   * 登入系統
   * @param {Object} page - Puppeteer 頁面物件
   * @returns {boolean} 登入是否成功
   */
  async login(page) {
    try {
      console.log('正在登入系統...');
      
      // 前往登入頁面
      await page.goto(this.loginUrl, { waitUntil: 'networkidle2' });
      
      // 等待頁面載入完成
      await page.waitForTimeout(3000);

      // 嘗試多種選擇器來找到輸入框
      const companyCodeSelectors = [
        'input[placeholder="公司代碼"]',
        'input[placeholder*="公司"]',
        'input[type="text"]:first-of-type'
      ];

      const employeeIdSelectors = [
        'input[placeholder="員工編號"]',
        'input[placeholder*="員工"]',
        'input[type="text"]:nth-of-type(2)'
      ];

      const passwordSelectors = [
        'input[placeholder="密碼"]',
        'input[type="password"]'
      ];

      // 填入公司代碼
      console.log('尋找公司代碼輸入框...');
      const companyCodeInput = await this.findElementBySelectors(page, companyCodeSelectors);
      if (!companyCodeInput) {
        throw new Error('找不到公司代碼輸入框');
      }
      await companyCodeInput.type(this.companyCode);
      console.log('已填入公司代碼');

      // 填入員工編號
      console.log('尋找員工編號輸入框...');
      const employeeIdInput = await this.findElementBySelectors(page, employeeIdSelectors);
      if (!employeeIdInput) {
        throw new Error('找不到員工編號輸入框');
      }
      await employeeIdInput.type(this.employeeId);
      console.log('已填入員工編號');
      
      // 填入密碼
      console.log('尋找密碼輸入框...');
      const passwordInput = await this.findElementBySelectors(page, passwordSelectors);
      if (!passwordInput) {
        throw new Error('找不到密碼輸入框');
      }
      await passwordInput.type(this.password);
      console.log('已填入密碼');

      // 點擊登入按鈕
      console.log('尋找登入按鈕...');
      const loginButtonSelectors = [
        'button:contains("登入")',
        'button:contains("登錄")',
        'button:contains("Login")',
        '.login-btn',
        '#login-btn',
        'span:contains("登入")',
        'span:contains("登錄")',
        'span:contains("Login")',
        '.por-button__slot:contains("登入")',
        '[class*="button"]:contains("登入")',
        '[class*="btn"]:contains("登入")'
      ];

      let loginButton = await this.findElementBySelectors(page, loginButtonSelectors);

      if (!loginButton) {
        // 如果找不到按鈕，嘗試通過文字內容查找
        console.log('嘗試通過文字內容查找登入按鈕...');
        loginButton = await page.evaluateHandle(() => {
          const elements = Array.from(document.querySelectorAll('button, span, div, a, [class*="button"], [class*="btn"]'));
          return elements.find(el => {
            const text = el.textContent.toLowerCase().trim();
            return text.includes('登入') || 
                   text.includes('登錄') ||
                   text.includes('login') ||
                   text.includes('sign in');
          });
        });
      }

      if (!loginButton) {
        // 最後嘗試：截圖並顯示頁面內容以便調試
        console.log('無法找到登入按鈕，正在截圖...');
        await page.screenshot({ path: 'debug-login-page.png', fullPage: true });
        console.log('已截圖保存為 debug-login-page.png');
        
        // 顯示頁面上所有可能的按鈕元素
        const allElements = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('button, input, span, div, a, [class*="button"], [class*="btn"]'));
          return elements.map(el => ({
            tag: el.tagName,
            text: el.textContent.trim(),
            className: el.className,
            id: el.id,
            onclick: el.getAttribute('onclick'),
            type: el.getAttribute('type')
          })).filter(el => el.text.length > 0);
        });
        
        console.log('頁面上的所有元素:', JSON.stringify(allElements, null, 2));
        throw new Error('找不到登入按鈕');
      }

      console.log('點擊登入按鈕...');
      await loginButton.click();

      // 等待登入完成並跳轉到首頁
      console.log('等待登入完成...');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
      
      console.log('登入成功');
      return true;
    } catch (error) {
      console.error('登入失敗:', error.message);
      return false;
    }
  }

  /**
   * 設置位置權限
   * @param {Object} browser - Puppeteer 瀏覽器物件
   */
  async setupLocationPermission(browser) {
    try {
      console.log('設置位置權限...');
      
      // 獲取預設瀏覽器上下文
      const context = browser.defaultBrowserContext();
      
      // 設置地理位置權限
      await context.overridePermissions(this.homeUrl, ['geolocation']);
      
      console.log('✅ 已設置地理位置權限');
      return true;
    } catch (error) {
      console.error('設置權限失敗:', error.message);
      return false;
    }
  }

  /**
   * 確認位置權限是否已開啟
   * @param {Object} page - Puppeteer 頁面物件
   * @returns {boolean} 權限是否已開啟
   */
  async checkLocationPermission(page) {
    try {
      console.log('確認位置權限是否已開啟...');
      
      // 測試地理位置權限
      const location = await page.evaluate(() => {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({
              success: true,
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            }),
            (err) => resolve({
              success: false,
              error: err.message
            })
          );
        });
      });

      if (location.success) {
        console.log('✅ 位置權限已開啟');
        console.log(`位置資訊: 緯度 ${location.lat}, 經度 ${location.lon}, 精度 ${location.accuracy}`);
        return true;
      } else {
        console.log('❌ 位置權限未開啟:', location.error);
        return false;
      }
    } catch (error) {
      console.warn('檢查位置權限時發生錯誤:', error.message);
      return false;
    }
  }

  /**
   * 設置地理位置
   * @param {Object} page - Puppeteer 頁面物件
   */
  async setLocation(page) {
    try {
      console.log('設置地理位置為台北市...');
      
      // 模擬台北市地理位置
      await page.setGeolocation({ 
        latitude: 25.0330, 
        longitude: 121.5654 
      });
      
      console.log('✅ 已設置地理位置為台北市');
    } catch (error) {
      console.warn('設置地理位置時發生錯誤:', error.message);
    }
  }


  /**
   * 通用的按鈕查找方法
   * @param {Object} page - Puppeteer 頁面物件
   * @param {Array<string>} keywords - 要查找的關鍵字陣列
   * @returns {Object|null} 找到的元素或 null
   */
  async findButtonByKeywords(page, keywords) {
    return await page.evaluateHandle((keywords) => {
      const elements = Array.from(document.querySelectorAll('button, a, input[type="button"], div[role="button"], span, [class*="button"], [class*="btn"]'));
      return elements.find(el => {
        const text = el.textContent.toLowerCase().trim();
        return keywords.some(keyword => text.includes(keyword.toLowerCase()));
      });
    }, keywords);
  }

  /**
   * 根據多個選擇器尋找元素（不點擊）
   * @param {Object} page - Puppeteer 頁面物件
   * @param {Array<string>} selectors - 選擇器陣列
   * @returns {Object|null} 找到的元素或 null
   */
  async findElementBySelectors(page, selectors) {
    for (const selector of selectors) {
      try {
        console.log(`嘗試選擇器: ${selector}`);
        
        // 處理 :contains() 選擇器
        if (selector.includes(':contains(')) {
          const element = await page.evaluateHandle((sel) => {
            // 提取標籤和文字內容
            const match = sel.match(/^([^:]+):contains\("([^"]+)"\)$/);
            if (match) {
              const [, tag, text] = match;
              const elements = Array.from(document.querySelectorAll(tag));
              return elements.find(el => el.textContent.includes(text));
            }
            return null;
          }, selector);
          
          if (element && await page.evaluate(el => el !== null, element)) {
            console.log(`✅ 找到元素: ${selector}`);
            return element;
          }
        } else {
          // 處理一般選擇器
          await page.waitForSelector(selector, { timeout: 2000 });
          const element = await page.$(selector);
          if (element) {
            console.log(`✅ 找到元素: ${selector}`);
            return element;
          }
        }
      } catch (error) {
        console.log(`❌ 選擇器失敗: ${selector}`);
      }
    }
    return null;
  }

  /**
   * 根據多個選擇器尋找元素並點擊
   * @param {Object} page - Puppeteer 頁面物件
   * @param {Array<string>} selectors - 選擇器陣列
   * @returns {boolean} 是否成功找到並點擊元素
   */
  async findAndClickElement(page, selectors) {
    for (const selector of selectors) {
      try {
        console.log(`嘗試選擇器: ${selector}`);
        
        // 處理 :contains() 選擇器
        if (selector.includes(':contains(')) {
          const clicked = await page.evaluate((sel) => {
            // 提取標籤和文字內容
            const match = sel.match(/^([^:]+):contains\("([^"]+)"\)$/);
            if (match) {
              const [, tag, text] = match;
              const elements = Array.from(document.querySelectorAll(tag));
              const element = elements.find(el => {
                const elementText = el.textContent.trim();
                return elementText === text || elementText.includes(text);
              });
              if (element) {
                // 嘗試點擊元素本身
                try {
                  element.click();
                  return true;
                } catch (e) {
                  // 如果元素本身不能點擊，嘗試點擊父元素
                  let parent = element.parentElement;
                  while (parent && parent !== document.body) {
                    try {
                      parent.click();
                      return true;
                    } catch (e2) {
                      parent = parent.parentElement;
                    }
                  }
                }
              }
            }
            return false;
          }, selector);
          
          if (clicked) {
            console.log(`✅ 找到並點擊元素: ${selector}`);
            return true;
          }
        } else {
          // 處理一般選擇器
          await page.waitForSelector(selector, { timeout: 2000 });
          const element = await page.$(selector);
          if (element) {
            console.log(`✅ 找到元素: ${selector}`);
            await element.click();
            console.log(`✅ 已點擊元素: ${selector}`);
            return true;
          }
        }
      } catch (error) {
        console.log(`❌ 選擇器失敗: ${selector}`);
      }
    }
    return false;
  }

  /**
   * 上班打卡
   * @returns {boolean} 打卡是否成功
   */
  async punchIn() {
    let browser = null;
    try {
      console.log('開始上班打卡流程...');
      
      // 等待隨機時間 (0-60秒)
      await this.waitRandomTime(0, 1);
      
      browser = await this.launchBrowser();
      const page = await browser.newPage();

      // 設置位置權限
      const permissionSet = await this.setupLocationPermission(browser);
      if (!permissionSet) {
        throw new Error('設置位置權限失敗');
      }

      // 登入系統
      const loginSuccess = await this.login(page);
      if (!loginSuccess) {
        throw new Error('登入失敗');
      }

      // 前往首頁
      await page.goto(this.homeUrl, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(2000);

      // 設置地理位置
      await this.setLocation(page);

      // 確認位置權限是否已開啟
      const permissionEnabled = await this.checkLocationPermission(page);
      if (!permissionEnabled) {
        console.log('⚠️ 位置權限未開啟，但繼續嘗試打卡...');
      }

      // 尋找並點擊上班打卡按鈕
      console.log('尋找上班打卡按鈕...');
      
      // 嘗試多種可能的選擇器
      const punchInSelectors = [
        'span:contains("上班")',
        'span[data-v-7560a1d1]:contains("上班")',
        'button:contains("上班打卡")',
        'button:contains("上班")',
        'a:contains("上班打卡")',
        'a:contains("上班")',
        '[data-action="punch-in"]',
        '.punch-in-btn',
        '#punch-in',
        'button[onclick*="punch"]',
        'a[href*="punch"]'
      ];

      let buttonClicked = await this.findAndClickElement(page, punchInSelectors);

      if (!buttonClicked) {
        // 如果找不到按鈕，嘗試通過文字內容查找
        console.log('嘗試通過文字內容查找上班打卡按鈕...');
        const punchInButton = await this.findButtonByKeywords(page, ['上班', '打卡', 'punch']);
        if (punchInButton && await page.evaluate(el => el !== null, punchInButton)) {
          console.log('✅ 找到上班打卡按鈕');
          await punchInButton.click();
          buttonClicked = true;
        }
      }

      if (!buttonClicked) {
        // 最後嘗試：截圖並顯示頁面內容以便調試
        console.log('無法找到上班打卡按鈕，正在截圖...');
        await page.screenshot({ path: 'debug-punch-page.png', fullPage: true });
        console.log('已截圖保存為 debug-punch-page.png');
        
        // 顯示頁面上所有按鈕的文字內容
        const allButtons = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, a, input[type="button"], div[role="button"]'));
          return buttons.map(btn => ({
            tag: btn.tagName,
            text: btn.textContent.trim(),
            className: btn.className,
            id: btn.id,
            onclick: btn.getAttribute('onclick')
          }));
        });
        
        console.log('頁面上的所有按鈕:', JSON.stringify(allButtons, null, 2));
        throw new Error('找不到上班打卡按鈕');
      }

      console.log('✅ 上班打卡按鈕已點擊');

      // 等待打卡完成
      await page.waitForTimeout(3000);

      // 檢查打卡結果
      const successMessage = await page.evaluate(() => {
        const messages = document.querySelectorAll('.alert, .message, .notification, .success');
        for (const msg of messages) {
          if (msg.textContent.includes('成功') || msg.textContent.includes('完成')) {
            return msg.textContent;
          }
        }
        return null;
      });

      if (successMessage) {
        console.log('上班打卡成功:', successMessage);
      } else {
        console.log('上班打卡完成 (未找到明確的成功訊息)');
      }

      console.log('✅ 上班打卡流程完成');
      console.log('='.repeat(50));
      
      if (browser) {
        console.log('關閉瀏覽器...');
        await browser.close();
      }

      return true;

    } catch (error) {
      console.error('上班打卡失敗:', error.message);
      
      console.log('❌ 上班打卡失敗');
      console.log('='.repeat(50));
      
      if (browser) {
        console.log('關閉瀏覽器...');
        await browser.close();
      }
      
      return false;
    }
  }

  /**
   * 下班打卡
   * @returns {boolean} 打卡是否成功
   */
  async punchOut() {
    let browser = null;
    try {
      console.log('開始下班打卡流程...');
      
      // 等待隨機時間 (0-60秒)
      await this.waitRandomTime(0, 1);
      
      browser = await this.launchBrowser();
      const page = await browser.newPage();

      // 設置位置權限
      const permissionSet = await this.setupLocationPermission(browser);
      if (!permissionSet) {
        throw new Error('設置位置權限失敗');
      }

      // 登入系統
      const loginSuccess = await this.login(page);
      if (!loginSuccess) {
        throw new Error('登入失敗');
      }

      // 前往首頁
      await page.goto(this.homeUrl, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(2000);

      // 設置地理位置
      await this.setLocation(page);

      // 確認位置權限是否已開啟
      const permissionEnabled = await this.checkLocationPermission(page);
      if (!permissionEnabled) {
        console.log('⚠️ 位置權限未開啟，但繼續嘗試打卡...');
      }

      // 尋找並點擊下班打卡按鈕
      console.log('尋找下班打卡按鈕...');
      
      // 嘗試多種可能的選擇器
      const punchOutSelectors = [
        'span:contains("下班")',
        'span[data-v-7560a1d1]:contains("下班")',
        'button:contains("下班打卡")',
        'button:contains("下班")',
        'a:contains("下班打卡")',
        'a:contains("下班")',
        '[data-action="punch-out"]',
        '.punch-out-btn',
        '#punch-out',
        'button[onclick*="punch"]',
        'a[href*="punch"]'
      ];

      let buttonClicked = await this.findAndClickElement(page, punchOutSelectors);

      if (!buttonClicked) {
        // 如果找不到按鈕，嘗試通過文字內容查找
        console.log('嘗試通過文字內容查找下班打卡按鈕...');
        const punchOutButton = await this.findButtonByKeywords(page, ['下班', '打卡', 'punch']);
        if (punchOutButton && await page.evaluate(el => el !== null, punchOutButton)) {
          console.log('✅ 找到下班打卡按鈕');
          await punchOutButton.click();
          buttonClicked = true;
        }
      }

      if (!buttonClicked) {
        // 最後嘗試：截圖並顯示頁面內容以便調試
        console.log('無法找到下班打卡按鈕，正在截圖...');
        await page.screenshot({ path: 'debug-punch-out-page.png', fullPage: true });
        console.log('已截圖保存為 debug-punch-out-page.png');
        
        // 顯示頁面上所有按鈕的文字內容
        const allButtons = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, a, input[type="button"], div[role="button"]'));
          return buttons.map(btn => ({
            tag: btn.tagName,
            text: btn.textContent.trim(),
            className: btn.className,
            id: btn.id,
            onclick: btn.getAttribute('onclick')
          }));
        });
        
        console.log('頁面上的所有按鈕:', JSON.stringify(allButtons, null, 2));
        throw new Error('找不到下班打卡按鈕');
      }

      console.log('✅ 下班打卡按鈕已點擊');

      // 等待打卡完成
      await page.waitForTimeout(3000);

      // 檢查打卡結果
      const successMessage = await page.evaluate(() => {
        const messages = document.querySelectorAll('.alert, .message, .notification, .success');
        for (const msg of messages) {
          if (msg.textContent.includes('成功') || msg.textContent.includes('完成')) {
            return msg.textContent;
          }
        }
        return null;
      });

      if (successMessage) {
        console.log('下班打卡成功:', successMessage);
      } else {
        console.log('下班打卡完成 (未找到明確的成功訊息)');
      }

      console.log('✅ 下班打卡流程完成');
      console.log('='.repeat(50));
      
      if (browser) {
        console.log('關閉瀏覽器...');
        await browser.close();
      }

      return true;

    } catch (error) {
      console.error('下班打卡失敗:', error.message);
      
      console.log('❌ 下班打卡失敗');
      console.log('='.repeat(50));
      
      if (browser) {
        console.log('關閉瀏覽器...');
        await browser.close();
      }
      
      return false;
    }
  }
}

module.exports = PunchService;
