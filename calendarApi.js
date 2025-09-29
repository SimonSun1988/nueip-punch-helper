const moment = require('moment-timezone');
const https = require('https');

/**
 * 台灣工作日 API 服務類別
 * 整合多個第三方服務來確認工作日
 */
class TaiwanWorkdayApiService {
  constructor() {
    this.timezone = 'Asia/Taipei';
    
    // 備用方案：本地假日資料
    this.localHolidays = {
      2024: [
        '2024-01-01', '2024-02-08', '2024-02-09', '2024-02-10', '2024-02-11',
        '2024-02-12', '2024-02-13', '2024-02-14', '2024-02-28', '2024-04-04',
        '2024-04-05', '2024-05-01', '2024-06-10', '2024-09-17', '2024-10-10',
        '2024-12-25'
      ],
      2025: [
        '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31',
        '2025-02-01', '2025-02-28', '2025-04-04', '2025-04-05', '2025-05-01',
        '2025-05-31', '2025-10-04', '2025-10-10', '2025-12-25'
      ]
    };
  }

  /**
   * 檢查指定日期是否為工作日
   * @param {Date|string} date - 要檢查的日期
   * @returns {Promise<boolean>} 是否為工作日
   */
  async isWorkday(date) {
    const targetDate = moment.tz(date, this.timezone);
    const dateStr = targetDate.format('YYYY-MM-DD');
    
    console.log(`檢查日期 ${dateStr} 是否為工作日...`);

    try {
      // 首先檢查是否為週末
      const dayOfWeek = targetDate.day();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        console.log(`${dateStr} 是週末，非工作日`);
        return false;
      }

      // 嘗試使用第三方 API
      const apiResult = await this.checkWorkdayFromApi(dateStr);
      if (apiResult !== null) {
        console.log(`API 查詢結果: ${apiResult ? '工作日' : '非工作日'}`);
        return apiResult;
      }

      // API 失敗時使用本地資料
      console.log('API 查詢失敗，使用本地假日資料...');
      return this.checkWorkdayFromLocal(dateStr);

    } catch (error) {
      console.error('檢查工作日時發生錯誤:', error.message);
      // 發生錯誤時使用本地資料作為備用方案
      return this.checkWorkdayFromLocal(dateStr);
    }
  }

  /**
   * 使用第三方 API 檢查工作日
   * @param {string} dateStr - 日期字串 (YYYY-MM-DD)
   * @returns {Promise<boolean|null>} 工作日狀態，null 表示 API 失敗
   */
  async checkWorkdayFromApi(dateStr) {
    try {
      // 嘗試使用 NowAPI (如果有的話)
      // 注意：需要註冊 NowAPI 並獲取 API Key
      // const nowApiResult = await this.checkNowApi(dateStr);
      // if (nowApiResult !== null) return nowApiResult;

      // 嘗試使用政府開放資料
      const govResult = await this.checkGovernmentData(dateStr);
      if (govResult !== null) return govResult;

      return null;
    } catch (error) {
      console.error('API 查詢失敗:', error.message);
      return null;
    }
  }

  /**
   * 檢查政府開放資料 (模擬實現)
   * @param {string} dateStr - 日期字串
   * @returns {Promise<boolean|null>} 工作日狀態
   */
  async checkGovernmentData(dateStr) {
    // 這裡可以實現對 data.gov.tw 的 API 調用
    // 目前返回 null 表示未實現
    return null;
  }

  /**
   * 使用本地資料檢查工作日
   * @param {string} dateStr - 日期字串 (YYYY-MM-DD)
   * @returns {boolean} 是否為工作日
   */
  checkWorkdayFromLocal(dateStr) {
    const year = moment(dateStr).year();
    const holidays = this.localHolidays[year] || [];
    
    const isHoliday = holidays.includes(dateStr);
    const isWorkday = !isHoliday;
    
    console.log(`${dateStr} 本地檢查結果: ${isWorkday ? '工作日' : '非工作日'}`);
    return isWorkday;
  }

  /**
   * 檢查今天是否為工作日
   * @returns {Promise<boolean>} 今天是否為工作日
   */
  async isTodayWorkday() {
    return await this.isWorkday(moment.tz(this.timezone));
  }

  /**
   * 獲取今天的日期字串
   * @returns {string} 今天的日期字串
   */
  getTodayString() {
    return moment.tz(this.timezone).format('YYYY-MM-DD');
  }

  /**
   * 獲取今天的星期幾
   * @returns {string} 星期幾
   */
  getTodayWeekday() {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dayOfWeek = moment.tz(this.timezone).day();
    return weekdays[dayOfWeek];
  }

  /**
   * 更新本地假日資料
   * @param {number} year - 年份
   * @param {Array<string>} holidays - 假日陣列
   */
  updateLocalHolidays(year, holidays) {
    this.localHolidays[year] = holidays;
    console.log(`已更新 ${year} 年的假日資料`);
  }

  /**
   * 從政府開放資料平台獲取假日資料
   * @param {number} year - 年份
   * @returns {Promise<Array<string>>} 假日陣列
   */
  async fetchHolidaysFromGovernment(year) {
    try {
      // 這裡可以實現對 data.gov.tw 的實際 API 調用
      // 目前返回空陣列
      console.log(`正在從政府開放資料平台獲取 ${year} 年假日資料...`);
      return [];
    } catch (error) {
      console.error('獲取政府假日資料失敗:', error.message);
      return [];
    }
  }
}

module.exports = TaiwanWorkdayApiService;
