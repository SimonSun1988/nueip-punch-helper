const moment = require('moment-timezone');
const https = require('https');

/**
 * 台灣工作日服務 - 整合多個資料來源
 */
class TaiwanWorkdayService {
  constructor() {
    this.timezone = 'Asia/Taipei';
    this.cache = new Map(); // 簡單的快取機制
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24小時過期
  }

  /**
   * 檢查指定日期是否為工作日
   * @param {Date|string} date - 要檢查的日期
   * @returns {Promise<boolean>} 是否為工作日
   */
  async isWorkday(date) {
    const targetDate = moment.tz(date, this.timezone);
    const dateStr = targetDate.format('YYYY-MM-DD');
    
    // 檢查快取
    const cached = this.getCachedResult(dateStr);
    if (cached !== null) {
      console.log(`使用快取結果: ${dateStr} ${cached ? '是' : '不是'} 工作日`);
      return cached;
    }

    console.log(`檢查日期 ${dateStr} 是否為工作日...`);

    try {
      // 首先檢查是否為週末
      const dayOfWeek = targetDate.day();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        console.log(`${dateStr} 是週末，非工作日`);
        this.setCachedResult(dateStr, false);
        return false;
      }

      // 嘗試多個資料來源
      const sources = [
        () => this.checkFromGovernmentAPI(dateStr),
        () => this.checkFromNowAPI(dateStr),
        () => this.checkFromLocalData(dateStr)
      ];

      for (const source of sources) {
        try {
          const result = await source();
          if (result !== null) {
            console.log(`資料來源確認: ${dateStr} ${result ? '是' : '不是'} 工作日`);
            this.setCachedResult(dateStr, result);
            return result;
          }
        } catch (error) {
          console.warn(`資料來源失敗: ${error.message}`);
        }
      }

      // 所有來源都失敗時，預設為工作日
      console.warn('所有資料來源都失敗，預設為工作日');
      this.setCachedResult(dateStr, true);
      return true;

    } catch (error) {
      console.error('檢查工作日時發生錯誤:', error.message);
      // 發生錯誤時預設為工作日
      this.setCachedResult(dateStr, true);
      return true;
    }
  }

  /**
   * 從政府開放資料平台檢查
   * @param {string} dateStr - 日期字串
   * @returns {Promise<boolean|null>} 工作日狀態
   */
  async checkFromGovernmentAPI(dateStr) {
    // 這裡可以實現對 data.gov.tw 的實際 API 調用
    // 目前返回 null 表示未實現
    return null;
  }

  /**
   * 從 NowAPI 檢查 (需要 API Key)
   * @param {string} dateStr - 日期字串
   * @returns {Promise<boolean|null>} 工作日狀態
   */
  async checkFromNowAPI(dateStr) {
    // 需要註冊 NowAPI 並獲取 API Key
    // const apiKey = process.env.NOWAPI_KEY;
    // if (!apiKey) return null;
    
    // 實現 NowAPI 調用邏輯
    return null;
  }

  /**
   * 從本地資料檢查
   * @param {string} dateStr - 日期字串
   * @returns {boolean} 工作日狀態
   */
  checkFromLocalData(dateStr) {
    const year = moment(dateStr).year();
    const holidays = this.getHolidaysForYear(year);
    const isHoliday = holidays.includes(dateStr);
    return !isHoliday;
  }

  /**
   * 獲取指定年份的假日清單
   * @param {number} year - 年份
   * @returns {Array<string>} 假日陣列
   */
  getHolidaysForYear(year) {
    const holidays = {
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
    
    return holidays[year] || [];
  }

  /**
   * 獲取快取結果
   * @param {string} dateStr - 日期字串
   * @returns {boolean|null} 快取結果
   */
  getCachedResult(dateStr) {
    const cached = this.cache.get(dateStr);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }
    return null;
  }

  /**
   * 設置快取結果
   * @param {string} dateStr - 日期字串
   * @param {boolean} result - 結果
   */
  setCachedResult(dateStr, result) {
    this.cache.set(dateStr, {
      result,
      timestamp: Date.now()
    });
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
   * 清除快取
   */
  clearCache() {
    this.cache.clear();
    console.log('快取已清除');
  }

  /**
   * 獲取快取統計
   * @returns {Object} 快取統計資訊
   */
  getCacheStats() {
    const now = Date.now();
    const validEntries = Array.from(this.cache.values()).filter(
      entry => now - entry.timestamp < this.cacheExpiry
    );
    
    return {
      totalEntries: this.cache.size,
      validEntries: validEntries.length,
      expiredEntries: this.cache.size - validEntries.length
    };
  }
}

module.exports = TaiwanWorkdayService;
