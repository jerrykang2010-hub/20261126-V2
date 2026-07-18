# 東京 7 天 6 夜旅遊指引

極致慢活・銀杏與咖啡之旅｜可安裝到 iPhone 主畫面的旅遊行程網頁。

## 檔案結構

```
├── index.html          網頁主檔（不用改，內容都從 data/ 讀取）
├── assets/
│   ├── style.css        所有樣式
│   └── app.js            程式邏輯（讀取 data/ 底下的 JSON、渲染畫面）
└── data/
    ├── config.json        網站標題、日期、密碼
    ├── itinerary.json      7 天完整行程（時間軸、分類、Google地圖搜尋字串）
    ├── budget.json          預估花費（分類、金額、明細）
    ├── notes.json            注意事項內容
    ├── backup.json            雨備方案（含交通資訊）
    └── todo-default.json       待辦事項預設清單
```

## ⚠️ 為什麼要拆成這麼多檔案？

因為這個網頁用 `fetch()` 讀取 JSON 資料，**瀏覽器基於安全機制，不允許用「直接雙擊開啟 HTML 檔」（`file://` 協定）的方式讀取本機的 JSON 檔**。這也是為什麼你在 iPhone Files App 打開單一 HTML 檔時，JavaScript 常常整個不會動。

**解法：把整個資料夾部署成一個網站（GitHub Pages 最簡單），用 `https://` 開啟就完全正常，包括 iPhone Safari。**

## 🚀 部署到 GitHub Pages（3 分鐘）

1. 在 GitHub 建立一個新 repo（public 或 private 皆可，但 GitHub Pages 的 Private repo 需要付費方案才能開啟 Pages，建議用 Public repo）
2. 把這個資料夾（`index.html`、`assets/`、`data/`）整個上傳到 repo 的根目錄
3. 進入 repo 的 **Settings → Pages**
4. Source 選擇 **Deploy from a branch**，Branch 選 `main`（或你的預設分支）、資料夾選 `/ (root)`，按 Save
5. 等 1-2 分鐘，GitHub 會給你一個網址，通常是：
   `https://你的帳號.github.io/repo名稱/`
6. 用 iPhone Safari 打開這個網址，就可以正常運作、輸入密碼、瀏覽行程
7. 打開後點 Safari 下方的分享圖示 →「加入主畫面」，之後就像 App 一樣一鍵開啟

## ✏️ 之後想改行程內容怎麼辦？

**不用碰 HTML 或 JS**，直接到 GitHub 上編輯對應的 JSON 檔案即可：

- 改某天的行程 → 編輯 `data/itinerary.json`
- 改預估花費 → 編輯 `data/budget.json`
- 改注意事項 → 編輯 `data/notes.json`
- 改雨備方案 → 編輯 `data/backup.json`
- 改待辦預設清單（首次載入時的初始清單）→ 編輯 `data/todo-default.json`
- 改標題、日期、密碼 → 編輯 `data/config.json`

在 GitHub 網頁上點該檔案 → 右上角鉛筆圖示編輯 → Commit，GitHub Pages 會在 1 分鐘內自動更新。

### itinerary.json 每個項目的欄位說明

```json
{
  "t": "12:55–14:30",       // 時間
  "title": "抵達羽田機場第3航廈",  // 標題
  "cat": "transport",         // 分類：transport／sight／food／shop／rest
  "detail": "華航 CI220 抵達，通關領行李",  // 細節說明（可留空字串 ""）
  "map": "羽田機場第3航廈"       // Google地圖搜尋關鍵字
}
```

## 💰 花費／✅ 待辦：關於「增刪修」的資料存放方式

這兩個頁籤的內容是你會**在手機上直接編輯**的，運作方式如下：

1. 你在網頁上輸入實際花費、新增/勾選/刪除待辦事項時，資料會即時存到手機瀏覽器的 **localStorage**（瀏覽器本機儲存空間）
2. 只要不清除 Safari 的「網站資料」，下次打開網頁時資料都還在
3. 每個頁籤下方都有「⬇ 匯出 JSON」與「⬆ 匯入 JSON」按鈕：
   - **匯出**：把目前填寫的資料存成一個 JSON 檔案下載下來，可以當備份，或傳給旅伴
   - **匯入**：讀取先前匯出的 JSON 檔，還原資料

### 為什麼不能自動存回 GitHub repo？

靜態網站（GitHub Pages 這類）**沒有伺服器**，瀏覽器裡的 JavaScript 沒有權限自動把資料寫回 repo 裡的檔案——這是所有靜態網站共同的限制，不是這個網頁特別做不到。

如果你之後真的想要「手機填寫 → 自動同步回 GitHub」，需要額外串接 GitHub API 並在網頁裡輸入一組具有寫入權限的 Personal Access Token，但這樣做等於把有權限的金鑰放在公開網頁裡，任何人檢視原始碼都拿得到，**不建議這樣做**。比較安全的替代方案是之後改用 Firebase／Supabase 等有後端的免費服務，如果有興趣我可以再協助設計。

目前「匯出 JSON → 手動上傳更新 repo 裡的檔案」是最簡單也最安全的作法。

## 🔒 密碼說明

密碼寫在 `data/config.json` 的 `password` 欄位，目前是 `9890`。這只是防止旁人隨手滑到內容的簡單機制，不是真正的資安防護（原始碼本來就看得到密碼），請勿用來保護真正機密的資訊。
