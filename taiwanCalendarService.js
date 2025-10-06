const axios = require('axios');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const _ = require('lodash');

/**
 * 台灣日曆服務 - 從 TaiwanCalendar API 下載年度放假資料
 */
class TaiwanCalendarService {
  constructor() {
    this.timezone = 'Asia/Taipei';
    this.apiBaseUrl = 'https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data';
    this.dataDir = path.join(__dirname, 'data');
    this.calendarData = new Map(); // 儲存年度日曆資料
    
    // 確保資料目錄存在
    this.ensureDataDir();
  }

  /**
   * 確保資料目錄存在
   */
  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * 初始化服務 - 下載當年度的日曆資料
   */
  async initialize() {
    const currentYear = moment.tz(this.timezone).year();
    console.log(`📅 初始化台灣日曆服務，下載 ${currentYear} 年度資料...`);
    
    try {
      await this.downloadYearData(currentYear);
      console.log(`✅ ${currentYear} 年度日曆資料下載完成`);
    } catch (error) {
      console.error(`❌ 下載 ${currentYear} 年度資料失敗:`, error.message);
      throw error;
    }
  }

  /**
   * 下載指定年份的日曆資料
   * @param {number} year - 年份
   */
  async downloadYearData(year) {
    const url = `${this.apiBaseUrl}/${year}.json`;
    const filePath = path.join(this.dataDir, `${year}.json`);
    
    try {
      console.log(`正在下載 ${year} 年度資料: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 10000, // 10秒超時
        headers: {
          'User-Agent': 'nueip-punch-helper/1.0.0'
        }
      });

      if (response.status === 200 && response.data) {
        // 儲存到本地檔案
        fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2));
        
        // 載入到記憶體
        this.loadYearData(year, response.data);
        
        console.log(`✅ ${year} 年度資料下載並儲存成功`);
      } else {
        throw new Error(`HTTP ${response.status}: 無法下載資料`);
      }
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error(`網路連線失敗: ${error.message}`);
      } else if (error.response) {
        throw new Error(`API 錯誤: HTTP ${error.response.status}`);
      } else {
        throw new Error(`下載失敗: ${error.message}`);
      }
    }
  }

  /**
   * 載入年度資料到記憶體
   * @param {number} year - 年份
   * @param {Array} data - 日曆資料
   */
  loadYearData(year, data) {
    if (!Array.isArray(data)) {
      throw new Error('無效的資料格式');
    }

    // 使用 lodash 過濾和轉換資料
    const validData = _.filter(data, item => 
      item.date && typeof item.isHoliday === 'boolean'
    );

    // 將資料轉換為 Map 格式，以日期為 key
    const yearData = new Map();
    
    _.forEach(validData, item => {
      yearData.set(item.date, {
        date: item.date,
        week: item.week,
        isHoliday: item.isHoliday,
        description: item.description || ''
      });
    });

    this.calendarData.set(year, yearData);
    console.log(`📊 ${year} 年度資料已載入，共 ${yearData.size} 筆記錄`);
  }

  /**
   * 從本地檔案載入年度資料
   * @param {number} year - 年份
   */
  loadYearDataFromFile(year) {
    const filePath = path.join(this.dataDir, `${year}.json`);
    
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        this.loadYearData(year, data);
        console.log(`📁 從本地檔案載入 ${year} 年度資料`);
        return true;
      } catch (error) {
        console.warn(`⚠️ 載入本地檔案失敗: ${error.message}`);
        return false;
      }
    }
    return false;
  }

  /**
   * 檢查指定日期是否為工作日
   * @param {Date|string} date - 要檢查的日期
   * @returns {Promise<boolean>} 是否為工作日
   */
  async isWorkday(date) {
    const targetDate = moment.tz(date, this.timezone);
    const dateStr = targetDate.format('YYYYMMDD');
    const year = targetDate.year();
    
    // 確保有該年度的資料
    if (!this.calendarData.has(year)) {
      console.log(`📥 載入 ${year} 年度資料...`);
      
      // 先嘗試從本地檔案載入
      if (!this.loadYearDataFromFile(year)) {
        // 如果本地沒有，則下載
        try {
          await this.downloadYearData(year);
        } catch (error) {
          console.warn(`⚠️ 無法載入 ${year} 年度資料: ${error.message}`);
          // 如果無法載入資料，預設為工作日
          return true;
        }
      }
    }

    // 檢查是否為週末
    const dayOfWeek = targetDate.day();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log(`${dateStr} 是週末，非工作日`);
      return false;
    }

    // 從日曆資料中查找
    const yearData = this.calendarData.get(year);
    if (yearData && yearData.has(dateStr)) {
      const dayInfo = yearData.get(dateStr);
      const isWorkday = !dayInfo.isHoliday;
      
      console.log(`${dateStr} (${dayInfo.week}) ${isWorkday ? '是' : '不是'} 工作日${dayInfo.description ? ` - ${dayInfo.description}` : ''}`);
      return isWorkday;
    }

    // 如果找不到資料，預設為工作日
    console.log(`⚠️ 找不到 ${dateStr} 的日曆資料，預設為工作日`);
    return true;
  }

  /**
   * 檢查今天是否為工作日
   * @returns {Promise<boolean>} 今天是否為工作日
   */
  async isTodayWorkday() {
    return this.isWorkday(moment.tz(this.timezone));
  }

  /**
   * 獲取今天的日期字串
   * @returns {string} 今天的日期字串 (YYYY-MM-DD)
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
   * 獲取指定日期的詳細資訊
   * @param {Date|string} date - 要查詢的日期
   * @returns {Object|null} 日期詳細資訊
   */
  async getDateInfo(date) {
    const targetDate = moment.tz(date, this.timezone);
    const dateStr = targetDate.format('YYYYMMDD');
    const year = targetDate.year();
    
    // 確保有該年度的資料
    if (!this.calendarData.has(year)) {
      if (!this.loadYearDataFromFile(year)) {
        try {
          await this.downloadYearData(year);
        } catch (error) {
          console.warn(`⚠️ 無法載入 ${year} 年度資料: ${error.message}`);
          return null;
        }
      }
    }

    const yearData = this.calendarData.get(year);
    if (yearData && yearData.has(dateStr)) {
      return yearData.get(dateStr);
    }

    return null;
  }

  /**
   * 清除快取資料
   */
  clearCache() {
    this.calendarData.clear();
    console.log('🗑️ 日曆資料快取已清除');
  }

  /**
   * 獲取已載入的年度清單
   * @returns {Array<number>} 已載入的年份陣列
   */
  getLoadedYears() {
    return _.sortBy(Array.from(this.calendarData.keys()));
  }

  /**
   * 預載入多個年度的資料
   * @param {Array<number>} years - 年份陣列
   */
  async preloadYears(years) {
    console.log(`📥 預載入年度資料: ${years.join(', ')}`);
    
    const unloadedYears = _.filter(years, year => !this.calendarData.has(year));
    
    await Promise.all(_.map(unloadedYears, async (year) => {
      try {
        if (!this.loadYearDataFromFile(year)) {
          await this.downloadYearData(year);
        }
      } catch (error) {
        console.warn(`⚠️ 預載入 ${year} 年度資料失敗: ${error.message}`);
      }
    }));
  }
}

module.exports = TaiwanCalendarService;
