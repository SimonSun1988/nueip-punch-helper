const moment = require('moment-timezone');

/**
 * 中華民國工作日檢查工具
 */
class TaiwanWorkdayChecker {
  constructor() {
    // 2024年台灣國定假日 (農曆節日需要每年更新)
    this.holidays2024 = [
      '2024-01-01', // 元旦
      '2024-02-08', // 小年夜
      '2024-02-09', // 除夕
      '2024-02-10', // 春節初一
      '2024-02-11', // 春節初二
      '2024-02-12', // 春節初三
      '2024-02-13', // 春節初四
      '2024-02-14', // 春節初五
      '2024-02-28', // 和平紀念日
      '2024-04-04', // 兒童節
      '2024-04-05', // 清明節
      '2024-05-01', // 勞動節
      '2024-06-10', // 端午節
      '2024-09-17', // 中秋節
      '2024-10-10', // 國慶日
      '2024-12-25', // 聖誕節
    ];

    // 2025年台灣國定假日
    this.holidays2025 = [
      '2025-01-01', // 元旦
      '2025-01-28', // 小年夜
      '2025-01-29', // 除夕
      '2025-01-30', // 春節初一
      '2025-01-31', // 春節初二
      '2025-02-01', // 春節初三
      '2025-02-28', // 和平紀念日
      '2025-04-04', // 兒童節
      '2025-04-05', // 清明節
      '2025-05-01', // 勞動節
      '2025-05-31', // 端午節
      '2025-10-04', // 中秋節
      '2025-10-10', // 國慶日
      '2025-12-25', // 聖誕節
    ];
  }

  /**
   * 檢查指定日期是否為工作日
   * @param {Date|string} date - 要檢查的日期
   * @returns {boolean} 是否為工作日
   */
  isWorkday(date) {
    const targetDate = moment.tz(date, 'Asia/Taipei');
    
    // 檢查是否為週末 (週六或週日)
    const dayOfWeek = targetDate.day();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    // 檢查是否為國定假日
    const dateStr = targetDate.format('YYYY-MM-DD');
    const year = targetDate.year();
    
    let holidays = [];
    if (year === 2024) {
      holidays = this.holidays2024;
    } else if (year === 2025) {
      holidays = this.holidays2025;
    }

    if (holidays.includes(dateStr)) {
      return false;
    }

    return true;
  }

  /**
   * 檢查今天是否為工作日
   * @returns {boolean} 今天是否為工作日
   */
  isTodayWorkday() {
    return this.isWorkday(moment.tz('Asia/Taipei'));
  }

  /**
   * 獲取今天的日期字串 (台灣時區)
   * @returns {string} 今天的日期字串 (YYYY-MM-DD)
   */
  getTodayString() {
    return moment.tz('Asia/Taipei').format('YYYY-MM-DD');
  }

  /**
   * 獲取今天的星期幾 (台灣時區)
   * @returns {string} 星期幾
   */
  getTodayWeekday() {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dayOfWeek = moment.tz('Asia/Taipei').day();
    return weekdays[dayOfWeek];
  }
}

module.exports = TaiwanWorkdayChecker;
