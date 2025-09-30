# NueIP 自動打卡助手

一個使用 Node.js 和 Puppeteer 開發的自動化打卡工具，可以自動在指定時間進行上班和下班打卡。

## 功能特色

- ✅ **智能工作日判斷**：自動從台灣日曆 API 下載年度放假資料，精確判斷工作日
- ✅ **自動資料更新**：服務啟動時自動下載當年度的台灣日曆資料
- ✅ **上班打卡**：每天早上 09:00-09:05 隨機時間執行
- ✅ **下班打卡**：每天下午 18:05-18:10 隨機時間執行
- ✅ **使用 Puppeteer**：自動化瀏覽器操作
- ✅ **支援隨機延遲**：避免被偵測為機器人
- ✅ **完整的錯誤處理**：和日誌記錄
- ✅ **支援手動測試**：功能

## 安裝與設定

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

複製 `.env.example` 到 `.env` 並修改設定：

```bash
cp .env.example .env
```

編輯 `.env` 檔案：

```env
# NueIP 打卡助手設定檔
# 請根據您的實際情況修改以下參數

# 公司代號
COMPANY_CODE=

# 員工編號
EMPLOYEE_ID=

# 密碼
PASSWORD=

# 是否開啟瀏覽器視窗 (true/false)
# 設為 false 時將以無頭模式運行，不會顯示瀏覽器視窗
SHOW_BROWSER=false

# Chrome 執行檔路徑 (可選，如果系統找不到 Chrome 時才需要設定)
# CHROME_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome

# 第三方 API 設定 (可選)
# NOWAPI_KEY=your_nowapi_key
# NOWAPI_SIGN=your_nowapi_sign
```

### 3. 安裝 Chrome 瀏覽器

由於使用 `puppeteer-core`，您需要手動安裝 Chrome 瀏覽器。

#### 自動偵測 (推薦)
程式會自動搜尋以下位置：
- **macOS**: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- **Linux**: `/usr/bin/google-chrome`, `/usr/bin/chromium`
- **Windows**: `C:\Program Files\Google\Chrome\Application\chrome.exe`

#### 手動指定 Chrome 路徑
如果自動偵測失敗，您可以在 `.env` 檔案中設定：

```env
CHROME_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

#### 安裝 Chrome
- **macOS**: 從 [Google Chrome 官網](https://www.google.com/chrome/) 下載安裝
- **Linux**: `sudo apt-get install google-chrome-stable` 或 `sudo apt-get install chromium-browser`
- **Windows**: 從 [Google Chrome 官網](https://www.google.com/chrome/) 下載安裝

## 使用方法

### 啟動自動打卡服務

```bash
npm start
# 或
node index.js
```

### 手動測試功能

```bash
# 測試 Chrome 路徑 (推薦先執行)
npm run test-chrome

# 測試上班打卡
npm run test-punch-in

# 測試下班打卡
npm run test-punch-out

# 檢查今天是否為工作日
npm run check-workday

# 顯示幫助資訊
node index.js help
```

## 程式架構

```
nueip-punch-helper/
├── index.js                    # 主程式入口
├── taiwanCalendarService.js    # 台灣日曆 API 服務
├── calendarService.js          # 工作日服務整合層
├── punchService.js             # 打卡服務核心功能
├── scheduler.js                # 定時任務調度器
├── data/                       # 台灣日曆資料目錄
│   └── .gitkeep               # 保持目錄結構
├── package.json                # 專案配置
└── README.md                   # 說明文件
```

## 技術規格

- **Node.js**: 使用 async/await 語法
- **Puppeteer**: 自動化瀏覽器操作
- **Cron**: 定時任務調度
- **Moment.js**: 時間處理和時區轉換
- **台灣時區**: Asia/Taipei
- **工作日檢查**: 基於台灣日曆 API 的智能判斷
- **資料來源**: https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/
- **本地快取**: 自動下載並快取年度日曆資料

## 台灣日曆 API 整合

### 主要資料來源

程式使用 **台灣日曆 API** 作為主要的工作日判斷來源：

- **API 來源**: https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/
- **資料格式**: JSON 格式，包含完整的年度日曆資料
- **更新頻率**: 自動下載當年度的最新資料
- **資料內容**: 包含國定假日、補班日、週末等完整資訊

### 資料結構

```json
[
  {
    "date": "20250101",
    "week": "三",
    "isHoliday": true,
    "description": "開國紀念日"
  },
  {
    "date": "20250102",
    "week": "四", 
    "isHoliday": false,
    "description": ""
  }
]
```

### 智能判斷邏輯

1. **服務啟動時**：自動下載當年度的台灣日曆資料
2. **本地快取**：下載的資料儲存在 `data/` 目錄中，避免重複下載
3. **精確判斷**：根據 `isHoliday` 欄位準確判斷是否需要打卡
4. **週末檢查**：自動排除週六、週日
5. **錯誤處理**：網路異常時使用本地快取資料

### 資料目錄

- `data/` 目錄用於儲存下載的年度日曆資料
- 只保留 `.gitkeep` 檔案在版本控制中
- JSON 資料檔案會被 Git 忽略，避免版本衝突

## 注意事項

1. **智能工作日判斷**：程式會自動從台灣日曆 API 下載年度資料，精確判斷工作日
2. **自動資料更新**：服務啟動時會自動下載當年度的最新日曆資料
3. **打卡時間**：包含隨機延遲，避免被系統偵測
4. **瀏覽器模式**：會以非無頭模式運行，方便觀察執行過程
5. **網路連線**：請確保網路連線穩定，避免資料下載失敗
6. **建議環境**：在穩定的環境中運行（如 VPS 或專用電腦）
7. **位置權限**：程式會自動處理位置權限請求，模擬台北市位置進行打卡
8. **瀏覽器保持開啟**：打卡完成後瀏覽器會保持開啟 30 秒，方便觀察結果
9. **資料快取**：首次啟動會下載日曆資料，後續啟動會使用本地快取

## 故障排除

### 常見問題

1. **找不到 Chrome 瀏覽器**
   - 確保系統已安裝 Chrome 瀏覽器
   - 設定 `CHROME_PATH` 環境變數指定 Chrome 路徑
   - 檢查 Chrome 是否在標準安裝位置
   - 嘗試安裝 Chromium 作為替代方案

2. **登入失敗**
   - 檢查帳號密碼是否正確
   - 確認網路連線正常
   - 檢查 NueIP 網站是否有更新

3. **找不到打卡按鈕**
   - 網站介面可能有更新
   - 需要更新 `punchService.js` 中的選擇器

4. **日曆資料下載失敗**
   - 檢查網路連線是否正常
   - 確認可以訪問 https://cdn.jsdelivr.net/
   - 檢查防火牆設定是否阻擋下載
   - 程式會嘗試使用本地快取資料

5. **工作日判斷錯誤**
   - 檢查 `data/` 目錄中是否有當年度資料
   - 手動刪除 `data/` 目錄中的 JSON 檔案，讓程式重新下載
   - 確認系統時區設定為 Asia/Taipei

## 授權

MIT License