/**
 * 第三方 API 整合範例
 * 展示如何整合不同的第三方服務來檢查台灣工作日
 */

const https = require('https');

/**
 * NowAPI 工作日檢查範例
 * 需要註冊 NowAPI 並獲取 API Key
 */
class NowApiService {
  constructor(apiKey, sign) {
    this.apiKey = apiKey;
    this.sign = sign;
    this.baseUrl = 'https://sapi.k780.com/';
  }

  /**
   * 檢查指定日期是否為工作日
   * @param {string} dateStr - 日期字串 (YYYY-MM-DD)
   * @returns {Promise<boolean|null>} 工作日狀態
   */
  async checkWorkday(dateStr) {
    try {
      const date = dateStr.replace(/-/g, ''); // 轉換為 YYYYMMDD 格式
      const url = `${this.baseUrl}?app=life.workday&date=${date}&appkey=${this.apiKey}&sign=${this.sign}&format=json`;
      
      const result = await this.makeRequest(url);
      
      if (result && result.success === '1') {
        return result.result.workday === '1';
      }
      
      return null;
    } catch (error) {
      console.error('NowAPI 查詢失敗:', error.message);
      return null;
    }
  }

  /**
   * 發送 HTTP 請求
   * @param {string} url - 請求 URL
   * @returns {Promise<Object>} 回應資料
   */
  makeRequest(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });
  }
}

/**
 * 政府開放資料平台 API 範例
 * 從 data.gov.tw 獲取假日資料
 */
class GovernmentDataService {
  constructor() {
    this.baseUrl = 'https://data.gov.tw/api/v1/rest/dataset';
  }

  /**
   * 搜尋假日相關資料集
   * @param {string} keyword - 搜尋關鍵字
   * @returns {Promise<Array>} 資料集清單
   */
  async searchHolidayDatasets(keyword = '國定假日') {
    try {
      const url = `${this.baseUrl}?q=${encodeURIComponent(keyword)}`;
      const result = await this.makeRequest(url);
      return result.result || [];
    } catch (error) {
      console.error('搜尋政府資料失敗:', error.message);
      return [];
    }
  }

  /**
   * 獲取特定資料集的資料
   * @param {string} datasetId - 資料集 ID
   * @returns {Promise<Array>} 資料內容
   */
  async getDatasetData(datasetId) {
    try {
      const url = `${this.baseUrl}/${datasetId}`;
      const result = await this.makeRequest(url);
      return result.result || [];
    } catch (error) {
      console.error('獲取資料集失敗:', error.message);
      return [];
    }
  }

  /**
   * 發送 HTTP 請求
   * @param {string} url - 請求 URL
   * @returns {Promise<Object>} 回應資料
   */
  makeRequest(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });
  }
}

/**
 * 台灣假期 MCP 服務範例
 * 使用 LobeHub 提供的台灣假期服務
 */
class TaiwanHolidayMCP {
  constructor() {
    this.baseUrl = 'https://lobehub.com/mcp/lis186-taiwan-holiday-mcp';
  }

  /**
   * 檢查指定日期是否為假日
   * @param {string} dateStr - 日期字串 (YYYY-MM-DD)
   * @returns {Promise<boolean|null>} 是否為假日
   */
  async isHoliday(dateStr) {
    try {
      // 這裡需要根據實際的 MCP 服務 API 來實現
      // 目前只是範例結構
      console.log(`檢查 ${dateStr} 是否為假日 (MCP 服務)`);
      return null;
    } catch (error) {
      console.error('MCP 服務查詢失敗:', error.message);
      return null;
    }
  }
}

/**
 * 整合多個服務的工作日檢查器
 */
class IntegratedWorkdayChecker {
  constructor() {
    this.services = [];
    
    // 如果有 NowAPI 的 API Key，可以啟用
    if (process.env.NOWAPI_KEY && process.env.NOWAPI_SIGN) {
      this.services.push(new NowApiService(process.env.NOWAPI_KEY, process.env.NOWAPI_SIGN));
    }
    
    this.services.push(new GovernmentDataService());
    this.services.push(new TaiwanHolidayMCP());
  }

  /**
   * 檢查指定日期是否為工作日
   * @param {string} dateStr - 日期字串
   * @returns {Promise<boolean>} 是否為工作日
   */
  async isWorkday(dateStr) {
    console.log(`檢查 ${dateStr} 是否為工作日...`);
    
    // 首先檢查是否為週末
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log(`${dateStr} 是週末，非工作日`);
      return false;
    }

    // 嘗試各個服務
    for (const service of this.services) {
      try {
        if (service.checkWorkday) {
          const result = await service.checkWorkday(dateStr);
          if (result !== null) {
            console.log(`服務確認: ${dateStr} ${result ? '是' : '不是'} 工作日`);
            return result;
          }
        } else if (service.isHoliday) {
          const isHoliday = await service.isHoliday(dateStr);
          if (isHoliday !== null) {
            const isWorkday = !isHoliday;
            console.log(`服務確認: ${dateStr} ${isWorkday ? '是' : '不是'} 工作日`);
            return isWorkday;
          }
        }
      } catch (error) {
        console.warn(`服務 ${service.constructor.name} 查詢失敗:`, error.message);
      }
    }

    // 所有服務都失敗時，預設為工作日
    console.warn('所有服務都失敗，預設為工作日');
    return true;
  }
}

module.exports = {
  NowApiService,
  GovernmentDataService,
  TaiwanHolidayMCP,
  IntegratedWorkdayChecker
};
