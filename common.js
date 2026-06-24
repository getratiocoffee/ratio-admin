/* ===================================================================
   Ratio Admin — common.js  (共用工具箱 / 重複使用的功能)
   index.html 與未來每一頁都 <script src="/common.js"> 引用。
   所有共用函式掛在 window.Ratio 底下，頁面用 Ratio.xxx() 呼叫。
   =================================================================== */
(function (global) {
  'use strict';

  // ---------- 小工具 ----------
  function uid() {
    return 'bean_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }
  function fmtKg(n) {
    var v = parseFloat(n);
    return (isNaN(v) ? 0 : v).toFixed(1) + ' kg';
  }
  function fmtMoney(n) {
    var v = parseFloat(n);
    return '$' + (isNaN(v) ? 0 : v).toFixed(2);
  }
  function esc(s) {
    var div = document.createElement('div');
    div.textContent = s == null ? '' : s;
    return div.innerHTML;
  }

  // ---------- 登入密碼（整個 app 共用，跨頁不會被登出）----------
  var SESSION_PASSWORD_KEY = 'ratio-admin-session-password';
  function getPassword() {
    try { return sessionStorage.getItem(SESSION_PASSWORD_KEY) || ''; }
    catch (e) { return ''; }
  }
  function setPassword(pw) {
    try { sessionStorage.setItem(SESSION_PASSWORD_KEY, pw); } catch (e) {}
  }

  // ---------- 後端 API（含重試）----------
  // 用法： await Ratio.api('beans', 'GET')  /  await Ratio.api('beans', 'POST', { items: [...] })
  async function api(dataset, method, body) {
    var headers = { 'x-app-password': getPassword() };
    var opts = { method: method, headers: headers };
    if (body) {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    var url = '/api/beans?dataset=' + dataset;
    var maxAttempts = 3;
    var lastErr = null;
    for (var attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        var resp = await fetch(url, opts);
        if (resp.status === 401) {
          var err = new Error('unauthorized');
          err.unauthorized = true;
          throw err;
        }
        if (resp.status >= 500) {
          throw new Error('Server error: ' + resp.status); // transient -> retry
        }
        if (!resp.ok) {
          var ce = new Error('Request failed: ' + resp.status);
          ce.clientError = true; // 4xx -> do not retry
          throw ce;
        }
        return resp.json();
      } catch (e) {
        lastErr = e;
        if (e && (e.unauthorized || e.clientError)) throw e; // never retry auth / client errors
        if (attempt < maxAttempts) {
          await new Promise(function (r) { setTimeout(r, attempt * 500); }); // backoff: 0.5s, then 1s
          continue;
        }
        throw lastErr;
      }
    }
  }

  // ---------- A. 資料存取（取代各自的 loadXFromServer / save）----------
  // 用法： const beans = await Ratio.load('beans');   Ratio.save('beans', beans);
  async function load(dataset) {
    var data = await api(dataset, 'GET');
    return data && Array.isArray(data.items) ? data.items : [];
  }
  function save(dataset, items) {
    return api(dataset, 'POST', { items: items });
  }

  // ---------- B. 存檔提示（取代 saveWithStatus / showToast）----------
  function showToast(msg, isError) {
    var t = document.getElementById('global-save-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'global-save-toast';
      t.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(20px + env(safe-area-inset-bottom));z-index:2000;padding:11px 18px;border-radius:14px;font-size:13px;font-weight:600;font-family:inherit;box-shadow:0 4px 16px rgba(46,41,37,0.22);opacity:0;transition:opacity .2s;pointer-events:none;max-width:88vw;text-align:center;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.background = isError ? '#A32D2D' : '#463E3A';
    t.style.color = '#fff';
    t.style.opacity = '1';
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { t.style.opacity = '0'; }, isError ? 3200 : 1500);
  }
  // 傳入一個存檔的 Promise，自動跳「Saved」或「存檔失敗」
  function saveWithStatus(promise) {
    return Promise.resolve(promise)
      .then(function () { showToast('Saved', false); })
      .catch(function (e) { console.error('Save failed', e); showToast("Couldn't save \u2014 check your connection", true); });
  }

  // ---------- C. 畫面頂部 header（取代手刻 form-topbar）----------
  // 用法： el.innerHTML = Ratio.topbar({ title: 'Sensory', backId: 'sn-back-btn' });
  var BACK_ARROW = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>';
  function topbar(opts) {
    opts = opts || {};
    var backId = opts.backId ? ' id="' + opts.backId + '"' : '';
    var right = opts.right ? '<div style="margin-left:auto;">' + opts.right + '</div>' : '';
    return '<div class="form-topbar">' +
             '<div class="back-btn"' + backId + ' aria-label="Back">' + BACK_ARROW + '</div>' +
             '<h1>' + esc(opts.title || '') + '</h1>' +
             right +
           '</div>';
  }

  global.Ratio = {
    uid: uid,
    fmtKg: fmtKg,
    fmtMoney: fmtMoney,
    esc: esc,
    getPassword: getPassword,
    setPassword: setPassword,
    api: api,
    load: load,
    save: save,
    showToast: showToast,
    saveWithStatus: saveWithStatus,
    topbar: topbar
  };
})(window);
