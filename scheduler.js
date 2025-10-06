const { CronJob } = require('cron');
const moment = require('moment-timezone');
const TaiwanCalendarService = require('./taiwanCalendarService');
const PunchService = require('./punchService');

/**
 * 定時任務調度器
 */
class PunchScheduler {
  constructor() {
    this.workdayService = new TaiwanCalendarService();
    this.punchService = new PunchService();
    this.jobs = [];
  }

  /**
   * 啟動所有定時任務
   */
  async start() {
    console.log('啟動自動打卡定時任務...');
    console.log(`當前時間: ${moment.tz('Asia/Taipei').format('YYYY-MM-DD HH:mm:ss')} (台灣時間)`);
    
    // 初始化工作日服務
    console.log('正在初始化台灣日曆服務...');
    await this.workdayService.initialize();
    console.log('✅ 台灣日曆服務初始化完成');
    
    // 上班打卡任務 (每天早上 09:00-09:05 隨機時間)
    this.startPunchInJob();
    
    // 下班打卡任務 (每天下午 18:05-18:10 隨機時間)
    this.startPunchOutJob();
    
    console.log('定時任務已啟動，程式將持續運行...');
    console.log('按 Ctrl+C 停止程式');
  }

  /**
   * 啟動上班打卡定時任務
   */
  startPunchInJob() {
    // 使用 cron 表達式: 每天 09:00 執行
    const punchInJob = new CronJob(
      '0 9 * * *', // 每天 09:00 執行
      async () => {
        await this.executePunchIn();
      },
      null,
      true, // 立即啟動
      'Asia/Taipei' // 台灣時區
    );

    this.jobs.push(punchInJob);
    console.log('上班打卡任務已設定: 每天 09:00 執行');
  }

  /**
   * 啟動下班打卡定時任務
   */
  startPunchOutJob() {
    // 使用 cron 表達式: 每天 18:05 執行
    const punchOutJob = new CronJob(
      '5 18 * * *', // 每天 18:05 執行
      async () => {
        await this.executePunchOut();
      },
      null,
      true, // 立即啟動
      'Asia/Taipei' // 台灣時區
    );

    this.jobs.push(punchOutJob);
    console.log('下班打卡任務已設定: 每天 18:05 執行');
  }

  /**
   * 執行上班打卡
   */
  async executePunchIn() {
    try {
      const now = moment.tz('Asia/Taipei');
      console.log(`\n=== 上班打卡任務觸發 ===`);
      console.log(`時間: ${now.format('YYYY-MM-DD HH:mm:ss')} (台灣時間)`);
      console.log(`星期: ${this.workdayService.getTodayWeekday()}`);

      // 檢查是否為工作日
      if (!(await this.workdayService.isTodayWorkday())) {
        console.log('今天不是工作日，跳過上班打卡');
        return;
      }

      console.log('今天是工作日，開始執行上班打卡...');
      
      // 執行上班打卡
      const success = await this.punchService.punchIn();
      
      if (success) {
        console.log('✅ 上班打卡成功完成');
        console.log('='.repeat(50));
      } else {
        console.log('❌ 上班打卡失敗');
        console.log('='.repeat(50));
      }

    } catch (error) {
      console.error('上班打卡任務執行錯誤:', error.message);
    }
  }

  /**
   * 執行下班打卡
   */
  async executePunchOut() {
    try {
      const now = moment.tz('Asia/Taipei');
      console.log(`\n=== 下班打卡任務觸發 ===`);
      console.log(`時間: ${now.format('YYYY-MM-DD HH:mm:ss')} (台灣時間)`);
      console.log(`星期: ${this.workdayService.getTodayWeekday()}`);

      // 檢查是否為工作日
      if (!(await this.workdayService.isTodayWorkday())) {
        console.log('今天不是工作日，跳過下班打卡');
        return;
      }

      console.log('今天是工作日，開始執行下班打卡...');
      
      // 執行下班打卡
      const success = await this.punchService.punchOut();
      
      if (success) {
        console.log('✅ 下班打卡成功完成');
        console.log('='.repeat(50));
      } else {
        console.log('❌ 下班打卡失敗');
        console.log('='.repeat(50));
      }

    } catch (error) {
      console.error('下班打卡任務執行錯誤:', error.message);
    }
  }

  /**
   * 停止所有定時任務
   */
  stop() {
    console.log('\n正在停止定時任務...');
    this.jobs.forEach(job => {
      job.stop();
    });
    this.jobs = [];
    console.log('所有定時任務已停止');
  }

  /**
   * 手動執行上班打卡 (用於測試)
   */
  async manualPunchIn() {
    console.log('手動執行上班打卡...');
    await this.executePunchIn();
  }

  /**
   * 手動執行下班打卡 (用於測試)
   */
  async manualPunchOut() {
    console.log('手動執行下班打卡...');
    await this.executePunchOut();
  }

  /**
   * 檢查今天是否為工作日
   */
  async checkTodayWorkday() {
    const isWorkday = await this.workdayService.isTodayWorkday();
    const today = this.workdayService.getTodayString();
    const weekday = this.workdayService.getTodayWeekday();
    
    console.log(`今天 (${today}) ${weekday} ${isWorkday ? '是' : '不是'} 工作日`);
    return isWorkday;
  }
}

module.exports = PunchScheduler;
