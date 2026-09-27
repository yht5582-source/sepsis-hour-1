# Sepsis Hour-1 導航

依 **Surviving Sepsis Campaign（SSC）2026** 國際指引製作的敗血症互動工具，協助加護病房與急診團隊在第一個小時內完成組合式照護，並依指引逐步調整升壓劑與類固醇。

> ⚠️ **僅供臨床流程輔助與教學，不取代臨床判斷。** 藥物劑量與稀釋濃度請依院內處方集，並經藥師確認。

## 功能

| 功能 | 說明 |
|---|---|
| T0 計時 | 按「以現在為 T0」或手動輸入時間；60 分鐘進度條在 45 分轉黃、60 分轉紅 |
| Hour-1 組合式照護 | 乳酸、血液培養、廣效抗生素、30 mL/kg 晶體輸液、升壓劑五項，打勾自動記錄時間 |
| 抗生素期限 | 依臨床可能性分級：休克或很可能敗血症 1 小時內；可能敗血症 3 小時內；可能性低可暫緩 |
| 乳酸複測 | 初次乳酸 >2 mmol/L 時顯示 2–4 小時複測時段 |
| 輸液計算 | 30 mL/kg 目標量與 3 小時期限；BMI >30 可切換調整體重或理想體重 |
| 升壓劑階梯 | Norepinephrine → vasopressin（NE ≥0.25 µg/kg/min）→ epinephrine；另有心功能不全分支（dobutamine） |
| 建議下一步 | 依輸入的 MAP、乳酸與目前用藥，即時提示下一步處置 |
| MAP 目標 | 65 mmHg；≥65 歲為 60–65 mmHg |
| 類固醇 | 判斷是否符合 Sepsis-3 敗血性休克；附 SSC 2021 舊觸發點（NE/Epi ≥0.25 且 ≥4 小時）倒數供參考 |
| 滴速換算 | NE、Epi、Vasopressin 的劑量與 mL/h 雙向換算，濃度可自訂 |
| 事件紀錄 | 所有操作自動加上時鐘時間與 T+ 時間，可一鍵複製貼到病歷 |
| 深色模式 | 依作業系統設定自動切換 |

## 使用方式

直接用瀏覽器開啟 `index.html` 即可，不需安裝或建置。

線上版（GitHub Pages）：`https://<帳號>.github.io/sepsis-hour1/`

## 部署到 GitHub Pages

1. 將 `index.html`、`README.md`、`.nojekyll` 推上 GitHub repo（免費帳號需為 Public）。
2. 到 **Settings → Pages**，Source 選 **Deploy from a branch**，Branch 選 `main`、資料夾選 `/ (root)`。
3. 約 1 分鐘後即可從上方網址開啟。

## 在地化設定

依院內規範修改 `index.html`：

| 項目 | 位置 |
|---|---|
| 預設稀釋濃度 | `<script>` 內 `def()` 的 `conc:{ne:[4,250],epi:[4,250],vaso:[20,100]}`，格式為 `[藥量 mg 或 U, 總量 mL]` |
| 各項期限 | `deadline()` 函式 |
| 下一步建議邏輯 | `render()` 內 `// next step` 段落 |
| 升壓劑階梯條件 | `render()` 內 `// ladder` 段落 |
| 類固醇判斷 | `render()` 內 `// steroid` 段落 |
| 配色 | `<style>` 開頭 `:root` 的色彩變數 |

若院內網路封鎖外部連線，可刪除 Google Fonts 的三行 `<link>`，會自動改用系統字型。

## 隱私

- 所有資料只存在使用者瀏覽器的 `localStorage`，不會上傳到任何伺服器。
- 請勿輸入病人姓名、病歷號等可識別個人資料。
- 按「清除並開始新病人」會刪除所有紀錄，只保留稀釋濃度設定。

## 注意事項

- SSC 2026 原文需付費閱讀。vasopressin 起始時機與類固醇處方（hydrocortisone 200 mg/day、fludrocortisone）整理自學會摘要、SSC 2021 備註與 SCCM 2024 類固醇指引，正式使用前請以原文核對。
- 若網頁會依病人數據給出具體處置建議，正式用於臨床前請確認是否屬於 TFDA 醫療器材軟體的管理範圍（參考《醫療器材軟體分類分級參考指引》）。
- 指引更新時請同步修改內容，並在頁尾更新出處。

## 參考文獻

1. Prescott HC, Antonelli M, Alhazzani W, et al. Surviving Sepsis Campaign: international guidelines for management of sepsis and septic shock 2026. *Intensive Care Med* 2026. [doi:10.1007/s00134-026-08361-1](https://doi.org/10.1007/s00134-026-08361-1)；*Crit Care Med* 2026. [doi:10.1097/CCM.0000000000007075](https://doi.org/10.1097/CCM.0000000000007075)
2. Levy MM, Evans LE, Rhodes A. The Surviving Sepsis Campaign Bundle: 2018 update. *Crit Care Med* 2018;46:997–1000. [doi:10.1097/CCM.0000000000003119](https://doi.org/10.1097/CCM.0000000000003119)
3. Evans L, Rhodes A, Alhazzani W, et al. Surviving Sepsis Campaign: international guidelines for management of sepsis and septic shock 2021. *Crit Care Med* 2021;49:e1063–e1143. [doi:10.1097/CCM.0000000000005337](https://doi.org/10.1097/CCM.0000000000005337)
4. Chaudhuri D, et al. 2024 Focused update: guidelines on use of corticosteroids in sepsis, ARDS, and community-acquired pneumonia. *Crit Care Med* 2024.
5. Singer M, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). *JAMA* 2016;315:801–810. [doi:10.1001/jama.2016.0287](https://doi.org/10.1001/jama.2016.0287)

## 授權

請依使用單位規定自行選擇授權方式（例如 MIT）。
