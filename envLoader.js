const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

/**
 * 環境變數載入器
 * 根據 NODE_ENV 載入對應的 .env 檔案
 */
class EnvLoader {
  constructor() {
    this.envFile = this.determineEnvFile();
    this.loadEnvFile();
  }

  /**
   * 根據 NODE_ENV 決定要載入的 .env 檔案
   * @returns {string} .env 檔案路徑
   */
  determineEnvFile() {
    const nodeEnv = process.env.NODE_ENV;
    const projectRoot = path.dirname(__filename);
    
    let envFileName = '.env'; // 預設檔案
    
    if (nodeEnv) {
      // 如果 NODE_ENV 有值，則使用 .env.{NODE_ENV}
      envFileName = `.env.${nodeEnv}`;
    }
    
    const envFilePath = path.join(projectRoot, envFileName);
    
    console.log(`🔧 環境變數設定:`);
    console.log(`   NODE_ENV: ${nodeEnv || '(未設定)'}`);
    console.log(`   載入檔案: ${envFileName}`);
    
    return envFilePath;
  }

  /**
   * 載入 .env 檔案
   */
  loadEnvFile() {
    try {
      // 檢查檔案是否存在
      if (!fs.existsSync(this.envFile)) {
        const errorMsg = `❌ 找不到環境變數檔案: ${this.envFile}`;
        console.error(errorMsg);
        console.error('');
        console.error('請確認以下事項:');
        console.error('1. 檔案是否存在於專案根目錄');
        console.error('2. 檔案名稱是否正確');
        console.error('');
        console.error('支援的檔案格式:');
        console.error('  - .env (預設)');
        console.error('  - .env.simon (當 NODE_ENV=simon)');
        console.error('  - .env.wayne (當 NODE_ENV=wayne)');
        console.error('  - .env.{任意名稱} (當 NODE_ENV={任意名稱})');
        console.error('');
        process.exit(1);
      }

      // 載入 .env 檔案
      const result = dotenv.config({ path: this.envFile });
      
      if (result.error) {
        console.error(`❌ 載入環境變數檔案失敗: ${result.error.message}`);
        process.exit(1);
      }

      console.log(`✅ 成功載入環境變數檔案: ${path.basename(this.envFile)}`);
      
      // 顯示載入的環境變數 (隱藏敏感資訊)
      this.displayLoadedEnvVars();
      
    } catch (error) {
      console.error(`❌ 載入環境變數時發生錯誤: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * 顯示載入的環境變數 (隱藏敏感資訊)
   */
  displayLoadedEnvVars() {
    const sensitiveKeys = ['PASSWORD', 'TOKEN', 'SECRET', 'KEY'];
    
    console.log(`📋 載入的環境變數:`);
    
    // 檢查必要的環境變數
    const requiredVars = ['COMPANY_CODE', 'EMPLOYEE_ID', 'PASSWORD'];
    const missingVars = [];
    
    requiredVars.forEach(key => {
      if (process.env[key]) {
        const value = sensitiveKeys.some(sensitive => key.includes(sensitive)) 
          ? '***' 
          : process.env[key];
        console.log(`   ${key}: ${value}`);
      } else {
        missingVars.push(key);
      }
    });

    // 檢查可選的環境變數
    const optionalVars = ['SHOW_BROWSER', 'CHROME_PATH'];
    optionalVars.forEach(key => {
      if (process.env[key]) {
        const value = sensitiveKeys.some(sensitive => key.includes(sensitive)) 
          ? '***' 
          : process.env[key];
        console.log(`   ${key}: ${value}`);
      }
    });

    if (missingVars.length > 0) {
      console.error('');
      console.error(`❌ 缺少必要的環境變數: ${missingVars.join(', ')}`);
      console.error('請在環境變數檔案中設定這些變數');
      process.exit(1);
    }

    console.log('');
  }

  /**
   * 獲取載入的 .env 檔案路徑
   * @returns {string} .env 檔案路徑
   */
  getEnvFilePath() {
    return this.envFile;
  }

  /**
   * 檢查環境變數是否已載入
   * @returns {boolean} 是否已載入
   */
  isLoaded() {
    return process.env.COMPANY_CODE && process.env.EMPLOYEE_ID && process.env.PASSWORD;
  }
}

module.exports = EnvLoader;
