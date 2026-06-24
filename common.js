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

  global.Ratio = {
    uid: uid,
    fmtKg: fmtKg,
    fmtMoney: fmtMoney,
    esc: esc,
    getPassword: getPassword,
    setPassword: setPassword,
    api: api
  };
})(window);
