#!/usr/bin/env node

// 首先載入環境變數
const EnvLoader = require('./envLoader');
new EnvLoader();

const PunchScheduler = require('./scheduler');
const moment = require('moment-timezone');

/**
 * 主程式入口
 */
class MainApp {
  constructor() {
    this.scheduler = new PunchScheduler();
  }

  /**
   * 啟動應用程式
   */
  async start() {
    console.log('🚀 自動打卡助手啟動中...');
    console.log('=====================================');
    
    // 顯示當前時間和日期資訊
    this.displayCurrentInfo();
    
    // 檢查今天是否為工作日
    const isWorkday = await this.scheduler.checkTodayWorkday();
    
    if (!isWorkday) {
      console.log('⚠️  今天不是工作日，定時任務仍會啟動但不會執行打卡');
    }
    
    console.log('=====================================');
    
    // 啟動定時任務
    await this.scheduler.start();
    
    // 設置優雅關閉處理
    this.setupGracefulShutdown();
  }

  /**
   * 顯示當前資訊
   */
  displayCurrentInfo() {
    const now = moment.tz('Asia/Taipei');
    console.log(`📅 當前時間: ${now.format('YYYY-MM-DD HH:mm:ss')} (台灣時間)`);
    console.log(`📅 星期: ${now.format('dddd')}`);
    console.log(`🌍 時區: Asia/Taipei`);
  }

  /**
   * 設置優雅關閉處理
   */
  setupGracefulShutdown() {
    // 處理 Ctrl+C 信號
    process.on('SIGINT', () => {
      console.log('\n\n🛑 收到停止信號，正在關閉程式...');
      this.scheduler.stop();
      console.log('👋 程式已安全關閉');
      process.exit(0);
    });

    // 處理其他終止信號
    process.on('SIGTERM', () => {
      console.log('\n\n🛑 收到終止信號，正在關閉程式...');
      this.scheduler.stop();
      console.log('👋 程式已安全關閉');
      process.exit(0);
    });

    // 處理未捕獲的異常
    process.on('uncaughtException', (error) => {
      console.error('\n❌ 未捕獲的異常:', error);
      this.scheduler.stop();
      process.exit(1);
    });

    // 處理未處理的 Promise 拒絕
    process.on('unhandledRejection', (reason, promise) => {
      console.error('\n❌ 未處理的 Promise 拒絕:', reason);
      this.scheduler.stop();
      process.exit(1);
    });
  }


  /**
   * 檢查工作日狀態
   */
  async checkWorkday() {
    await this.scheduler.checkTodayWorkday();
  }
}

// 主程式執行
async function main() {
  const app = new MainApp();
  
  // 檢查命令列參數
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    const command = args[0];
    
    switch (command) {
      case 'check-workday':
        await app.checkWorkday();
        break;
      case 'help':
        console.log('可用命令:');
        console.log('  node index.js                    - 啟動自動打卡服務');
        console.log('  node index.js check-workday      - 檢查今天是否為工作日');
        console.log('  node index.js help               - 顯示幫助資訊');
        break;
      default:
        console.log(`未知命令: ${command}`);
        console.log('使用 "node index.js help" 查看可用命令');
        process.exit(1);
    }
  } else {
    // 沒有參數時啟動正常服務
    await app.start();
  }
}

// 執行主程式
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 程式執行錯誤:', error);
    process.exit(1);
  });
}

module.exports = MainApp;
