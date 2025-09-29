# NueIP 自動打卡助手

一個使用 Node.js 和 Puppeteer 開發的自動化打卡工具，可以自動在指定時間進行上班和下班打卡。

## 功能特色

- ✅ 自動檢查中華民國工作日曆，非工作日不執行打卡
- ✅ 上班打卡：每天早上 09:00-09:05 隨機時間執行
- ✅ 下班打卡：每天下午 18:05-18:10 隨機時間執行
- ✅ 使用 Puppeteer 自動化瀏覽器操作
- ✅ 支援隨機延遲，避免被偵測為機器人
- ✅ 完整的錯誤處理和日誌記錄
- ✅ 支援手動測試功能

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
├── index.js          # 主程式入口
├── calendar.js       # 中華民國工作日曆檢查
├── punchService.js   # 打卡服務核心功能
├── scheduler.js      # 定時任務調度器
├── package.json      # 專案配置
└── README.md         # 說明文件
```

## 技術規格

- **Node.js**: 使用 async/await 語法
- **Puppeteer**: 自動化瀏覽器操作
- **Cron**: 定時任務調度
- **Moment.js**: 時間處理和時區轉換
- **台灣時區**: Asia/Taipei
- **工作日檢查**: 支援多個資料來源，包含本地資料和第三方 API

## 第三方 API 整合

程式支援多種工作日檢查方式：

### 1. 本地假日資料 (預設)
- 內建 2024-2025 年台灣國定假日資料
- 無需網路連線，響應快速
- 需要手動更新假日資料

### 2. 政府開放資料平台
- 資料來源：https://data.gov.tw/
- 官方資料，最準確
- 需要實作 API 調用邏輯

### 3. NowAPI 工作日判斷
- 提供 JSON API 服務
- 需要註冊並獲取 API Key
- 設定環境變數：`NOWAPI_KEY` 和 `NOWAPI_SIGN`

### 4. 台灣假期 MCP 服務
- 專門針對台灣假期設計
- 基於政府公告資料
- 網址：https://lobehub.com/mcp/lis186-taiwan-holiday-mcp

### 設定第三方 API

在 `.env` 文件中設定 API 金鑰：

```bash
# NowAPI 設定
NOWAPI_KEY=your_api_key_here
NOWAPI_SIGN=your_sign_here
```

程式會自動嘗試多個資料來源，並使用第一個可用的結果。

## 注意事項

1. 程式會自動檢查台灣的國定假日，非工作日不會執行打卡
2. 打卡時間包含隨機延遲，避免被系統偵測
3. 瀏覽器會以非無頭模式運行，方便觀察執行過程
4. 請確保網路連線穩定，避免打卡失敗
5. 建議在穩定的環境中運行（如 VPS 或專用電腦）
6. **位置權限**: 程式會自動處理位置權限請求，模擬台北市位置進行打卡
7. **瀏覽器保持開啟**: 打卡完成後瀏覽器會保持開啟 30 秒，方便觀察結果

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

## 授權

MIT License