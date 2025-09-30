const moment = require('moment-timezone');
const TaiwanCalendarService = require('./taiwanCalendarService');

/**
 * 台灣工作日服務 - 使用台灣日曆 API
 */
class TaiwanWorkdayService {
  constructor() {
    this.timezone = 'Asia/Taipei';
    this.calendarService = new TaiwanCalendarService();
    this.initialized = false;
  }

  /**
   * 初始化服務
   */
  async initialize() {
    if (!this.initialized) {
      await this.calendarService.initialize();
      this.initialized = true;
    }
  }

  /**
   * 檢查指定日期是否為工作日
   * @param {Date|string} date - 要檢查的日期
   * @returns {Promise<boolean>} 是否為工作日
   */
  async isWorkday(date) {
    // 確保服務已初始化
    await this.initialize();
    
    // 使用台灣日曆服務檢查
    return await this.calendarService.isWorkday(date);
  }


  /**
   * 檢查今天是否為工作日
   * @returns {Promise<boolean>} 今天是否為工作日
   */
  async isTodayWorkday() {
    // 確保服務已初始化
    await this.initialize();
    
    return await this.calendarService.isTodayWorkday();
  }

  /**
   * 獲取今天的日期字串
   * @returns {string} 今天的日期字串
   */
  getTodayString() {
    return this.calendarService.getTodayString();
  }

  /**
   * 獲取今天的星期幾
   * @returns {string} 星期幾
   */
  getTodayWeekday() {
    return this.calendarService.getTodayWeekday();
  }

  /**
   * 獲取指定日期的詳細資訊
   * @param {Date|string} date - 要查詢的日期
   * @returns {Promise<Object|null>} 日期詳細資訊
   */
  async getDateInfo(date) {
    // 確保服務已初始化
    await this.initialize();
    
    return await this.calendarService.getDateInfo(date);
  }

  /**
   * 清除快取
   */
  clearCache() {
    this.calendarService.clearCache();
  }

  /**
   * 獲取已載入的年度清單
   * @returns {Array<number>} 已載入的年份陣列
   */
  getLoadedYears() {
    return this.calendarService.getLoadedYears();
  }
}

module.exports = TaiwanWorkdayService;
