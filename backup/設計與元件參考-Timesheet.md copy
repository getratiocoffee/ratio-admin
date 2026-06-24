# Ratio Coffee — 設計系統與可重用元件參考

> 這份文件記錄 Timesheet 開發過程中建立、**之後其他頁面可以直接重用**的設計 tokens、元件與互動模式。
> 所有元件都已存在於 `index.html`,沿用既有 class 即可,不需重寫。

---

## 1. 設計 Tokens(色彩 / 圓角 / 字級)

### 色彩
| 用途 | 色碼 |
|---|---|
| 主深棕(文字、啟用態、主按鈕) | `#463E3A` |
| 次深(標題文字) | `#2E2925` |
| 邊框 / 分隔線 | `#DCD2C2` |
| 次要文字 / 標籤 | `#8A7F6F` |
| 弱化文字 / placeholder | `#B0A491` |
| 面板淺底 | `#FAF6F0` / `#FAEEDA` |
| 卡片淺底 | `#EFE8DE` |
| 品牌金 | `#A08858` |
| 危險 / 刪除 | `#A32D2D` |
| 開關綠(on) | `#34C759` |

**icon 底色(柔和粉彩,每功能一色):**
藍 `#DCEAF5`(+stroke `#1A5C8A`)、黃 `#EFE6D2`(`#92560C`)、粉 `#F5E0E0`(`#9C1B3E`)、紫 `#E3DCF2`(`#5B3FA6`)。

### 圓角 / 字級 / 間距
- 玻璃框圓角 `26px`、卡片 `16px`、輸入框/chip `12px`、藥丸 chip `999px`。
- 字級:標題 15px、內文 14px、次要 13px、標籤 11–12px。
- icon 方塊 ~52–56px;footer 控制鍵 34px;格間距 8–12px。

---

## 2. 可重用元件

### 2.1 玻璃框 icon 選單(1×N) — `.glass-frame` + `.app-grid-item`
霧面玻璃容器,內含等寬 icon 格。Timesheet 用 1×4。

```html
<div class="glass-frame">
  <div class="ts-grid"> <!-- grid-template-columns: repeat(N,1fr) -->
    <button class="app-grid-item" id="xxx-btn">
      <span class="app-grid-icon" style="background:#DCEAF5;"><svg stroke="#1A5C8A" .../></span>
      <span class="app-grid-label">名稱</span>
    </button>
    ...
  </div>
</div>
```
- `.glass-frame`:`backdrop-filter: blur(14px)`、半透明白漸層、內外陰影。
- `.app-grid-item:active` 會縮放 0.93 + 變淡(觸感回饋)。
- 要做 N 欄就改 grid `repeat(N,1fr)`(本專案 `.ts-grid`)。

### 2.2 玻璃底部控制列 — `.glass-footer` + `ts-foot-*`(★核心,務必重用)
固定在頁面底部的一排控制鍵。用**絕對定位的固定槽位**,所以無論放幾個鍵位置都穩定:

| 槽位 | class | 位置 |
|---|---|---|
| 最左 | `.ts-foot-back` | `left:0`(返回 ←) |
| 左四分一 | `.ts-foot-edit` | `left:25%`(編輯模式開關 🖊) |
| 正中 | `.glass-toggle` | `left:50%`(綠色開關 / 登出) |
| 右四分三 | `.ts-foot-name` | `left:calc(75% - 9px)`(頁名,與開關和＋等距置中) |
| 最右 | `.ts-foot-add` | `right:0`(＋ 新增) |

```html
<div class="glass-footer">
  <div class="back-btn ts-foot-back" id="x-back">←</div>
  <button class="icon-btn ts-foot-edit" id="x-edit" style="display:none;">🖊</button>
  <span class="frame-label ts-foot-name" id="x-name">頁名</span>
  <button class="glass-toggle" id="x-toggle"><span class="glass-toggle-knob"></span></button>
  <button class="icon-btn ts-foot-add" id="x-add" style="display:none;">＋</button>
</div>
```
**重用要點**:新頁面要置中標籤就用 `.ts-foot-name`(右半中央);要左右等距的鍵就套對應槽位 class,不要用 flex 排(會被 gap 推偏)。

### 2.3 收合區塊(箭頭收合功能鍵) — `.ts-icons-collapse` + `.ts-na-arrow`
用一個向上箭頭收合/展開下方內容(本專案收合 4 個功能鍵 icon)。

```html
<div class="ts-na-arrow-row">
  <button class="ts-na-arrow" id="x-toggle"><svg class="ts-na-chevron">▲</svg></button>
</div>
<div id="x-collapse" class="ts-icons-collapse"> ...要收合的內容... </div>
```
```js
btn.addEventListener('click', function(){
  var collapsed = collapseEl.classList.toggle('collapsed');
  btn.classList.toggle('collapsed', collapsed);          // 箭頭旋轉 180°
  btn.setAttribute('aria-expanded', collapsed ? 'false':'true');
});
```
- `.ts-icons-collapse` 用 `max-height` 過渡;`.collapsed` 設 `max-height:0; opacity:0`。
- 內容很長要可捲時,改 `overflow-y:auto; max-height:50vh`(之前 N/A 清單用法)。

### 2.4 頁內分頁(不換螢幕) — `#ts-tab-host` + `relocateTsBodies` 模式
4 個 icon 當分頁鍵,內容在**同一頁**切換,不跳螢幕。做法:把各分頁的內容主體一次性搬進 `#ts-tab-host`,再以 show/hide 切換。

關鍵設定(可直接套到別的多分頁頁面):
```css
#ts-tab-host { flex:1; display:flex; flex-direction:column; min-height:0; overflow:hidden; }
#ts-tab-host .ts-panel { flex:1; min-height:0; }
#ts-bottom-bar { flex:0 0 auto; }   /* 控制列固定不捲 */
```
- `TS_TABS` 設定物件:每個分頁 `{ body, icon, title, render, action }`。
- `showTsTab(name)`:隱藏其他 panel、顯示選中、highlight 對應 icon(`.ts-tab-active`)、依 `action` 顯示/綁定 ＋ 鍵、呼叫 `render()`(包 try/catch)。
- **重用**:任何「一頁多分頁」需求都可照這個 TS_TABS + showTsTab 骨架複製。

### 2.5 多選 chip — `.na-staff-chips` + `.na-staff-chip`
藥丸狀、可點選多個的選擇器(取代手機上難用的多選下拉)。

```html
<div class="na-staff-chips">
  <button class="na-staff-chip" data-staff-id="s1" data-existing="0">Alice</button>
</div>
```
- `.na-staff-chip.selected`:深棕底白字(= 已按下)。
- 用**事件委派**監聽容器點擊,toggle `.selected`。
- **狀態回填模式(重用重點)**:用 `data-existing="1"` 標記「已存在的選取」,存檔時只處理 `selected !== existing` 的差異(新選=新增、取消既有=移除),避免誤動未變更項。

### 2.6 班次卡片排版 — `.ts-shift-row` / `.ts-shift-main` / `.ts-shift-time`
每筆:**上行 名字(左)＋ 工時(右)**,**下行 工作時間(起訖兩端對齊、填滿框)**。

```html
<div class="ts-shift-row">
  <div class="ts-shift-main">
    <div class="ts-shift-top"><span class="ts-shift-name">Alice</span><span class="ts-shift-hours">8h</span></div>
    <div class="ts-shift-time"><span>9:00 AM</span><span class="ts-shift-dash">–</span><span>5:00 PM</span></div>
  </div>
  <div class="ts-shift-actions">編輯/刪除</div>
</div>
```
- `.ts-shift-top`:`justify-content:space-between`(名字左、工時右)。
- 在 Current,`#ts-current-body .ts-shift-time` 用 `display:flex; justify-content:space-between`(起訖頂到左右),`font-size:16px` → 不論時間多長都「跟框同寬」不溢出。
- 兩端對齊比「放大單一字串」更耐長字串,這招可重用在任何「範圍值填滿一格」的場景。

### 2.7 編輯模式開關(預設隱藏更改鍵) — `.ts-edit-on`
平常隱藏編輯/刪除/新增鍵讓畫面乾淨,按 🖊 才顯示。

```css
#ts-current-body .ts-shift-actions, #ts-current-body .ts-add-shift-btn { display:none; }
#ts-current-body.ts-edit-on .ts-shift-actions { display:flex; }
#ts-current-body.ts-edit-on .ts-add-shift-btn { display:block; }
```
- 開關在 `showTsTab` 中**只在對應分頁顯示**,切分頁時自動重置關閉。
- class 掛在**不會被重繪的容器**(`#ts-current-body`)上,re-render 內層不會丟失狀態。

### 2.8 兩欄省空間排版 — `#ts-current-body .ts-day-card-body`
```css
#ts-current-body .ts-day-card-body { display:grid; grid-template-columns:1fr 1fr; gap:8px; align-items:start; }
#ts-current-body.ts-edit-on .ts-day-card-body { grid-template-columns:1fr; }  /* 編輯時回一欄好操作 */
/* 整行元素跨兩欄 */
#ts-current-body .ts-day-card-body > .ts-day-empty,
#ts-current-body .ts-day-card-body > .ts-add-shift-btn,
#ts-current-body .ts-day-card-body > .ts-add-shift-row { grid-column:1 / -1; }
```

### 2.9 固定底部 + 上方可捲頁面(版面骨架)
- 容器 `flex` 直向:`內容區(flex:1, overflow 內捲)` + `底部控制列(flex:0 0 auto)`。
- 內容主體用 `justify-content:flex-start`(靠上、由上往下填),**不要** `flex-end`(會把內容壓到底、頂部留白)。

### 2.10 捲到今天 — `scrollCurrentToToday()`
每張日卡加 `data-date="<ISO>"`;進分頁時 `requestAnimationFrame` 內找今天的卡、找最近可捲容器、把該卡對齊到頂端。**只在進分頁時呼叫**(不在編輯 re-render 時),避免把使用者捲走。

---

## 3. Timesheet 結構索引

### 螢幕 / 容器
- `#screen-timesheet` → `#ts-tab-host`(分頁內容) + `#ts-bottom-bar`(箭頭列 + 玻璃 icon 框 + 玻璃 footer)。
- 分頁主體:`#ts-current-body` / `#ts-previous-body` / `#ts-na-body` / `#ts-contacts-body`(皆 `.ts-panel`)。

### 功能鍵(icon)
`ts-open-current-btn` / `ts-open-previous-btn` / `ts-open-na-btn` / `ts-open-contacts-btn`。

### footer 控制鍵
`timesheet-back-btn`(←)、`ts-edit-toggle`(🖊)、`ts-refresh-btn`(綠開關=登出)、`ts-page-name`(頁名)、`ts-tab-action-btn`(＋)、`ts-na-toggle`(收合箭頭)。

### 核心函式
- `showTsTab(name)` / `relocateTsBodies()` / `TS_TABS`
- `renderCurrentTimesheet()` / `renderWeekDays()` / `attachWeekDayListeners()` / `scrollCurrentToToday()`
- `renderPreviousTimesheets()` / `renderStaffContacts()`
- N/A:`openNaScreen()` / `refreshNaChips()`(回填既有) / `naChipsHaveChanges()` / `getNaSelectedDates()` / `renderNaExistingList()`
- 工具:`isoDate()` / `weekDates()` / `getDatesBetween()`(皆時區安全,用本地年月日組字串)

---

## 4. 重用注意事項
1. **footer 槽位**用絕對定位 class,不要用 flex 排版(gap 會推偏置中)。
2. **狀態 class**(編輯模式、收合)掛在不會被重繪的容器上。
3. **差異式存檔**(chip 的 `data-existing`)避免誤刪未變更項——任何「回填現況再編輯」的表單都該照這模式。
4. 日期一律用 `isoDate()` 系列(本地時區安全),**不要用 `toISOString()`**(會因時區位移一天)。
5. 事件綁定若元素可能不存在,用 `var el = getElementById(...); if (el) el.addEventListener(...)`(null-safe)。

---

*最後更新:配合 Timesheet 清理與除錯後整理。所有元件均已在 `index.html` 中可用。*
