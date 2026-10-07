/* =========================================================
   站点统计：本站访客数(UV) / 总访问量(PV) / 今日访问
   ---------------------------------------------------------
   双层策略（永远不空白）：
     1) 主：本站自己的后端接口 /api/stats（Vercel Serverless + Vercel KV）
        真实跨设备累计。它是页面同源地址，不存在 CORS 跨域被拦的问题，
        也不依赖任何第三方云服务 —— 不蒜子 2024 年已关停、LeanCloud 官宣
        逐步停服，这两个都不能再用了，所以数据收回自己账号里。
     2) 备：本机 localStorage 统计
        后端还没配 / 接口 404 / 超时，自动降级成本地数字。

   计数规则
   - UV  : 「日期 + 访客唯一 ID」在后端去重，同一天同一台设备只算 1 位，
           跨设备同日也不会重复计（key 存 3 天自动过期，不会无限膨胀）。
   - PV  : 每个新页面（新标签页 / 新窗口 / 换页）记 1 次，刷新不重复。
   - 今日: 当天的累计访问次数。
   ========================================================= */
(function () {
  'use strict'

  /* 这一行在构建时由 scripts/site-stats.cjs 自动替换，
     平时改 _config.butterfly.yml 的 site_stats 段即可，不用动代码。 */
  var CFG = /*__SS_LC_CFG__*/{"enabled":false,"api":"/api/stats"};

  var KEY = 'site_stats_v1'
  var SESS_KEY = 'site_stats_sess'
  var SID_KEY = 'site_stats_sid'
  var TIMEOUT = 4000

  /* ---------- 工具 ---------- */
  function today () {
    var d = new Date()
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2)
  }

  function guid () {
    try {
      var s = window.localStorage.getItem(SID_KEY)
      if (s) return s
      s = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
      })
      window.localStorage.setItem(SID_KEY, s)
      return s
    } catch (e) {
      return 'x' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    }
  }

  function num (n) {
    n = Number(n) || 0
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  function read () {
    try {
      var raw = window.localStorage.getItem(KEY)
      if (!raw) return null
      var o = JSON.parse(raw)
      return (o && typeof o === 'object') ? o : null
    } catch (e) { return null }
  }

  function write (o) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(o))
      return true
    } catch (e) { return false } // 隐私模式 / 存储满了
  }

  /* ---------- 本站后端接口（同源，没有 CORS 问题） ---------- */
  var SID = guid()
  var cloudValue = null

  function enabled () {
    return CFG.enabled === true && !!CFG.api
  }

  function request (method, body) {
    return new Promise(function (resolve, reject) {
      var url = CFG.api + (method === 'GET' ? '?_=' + Date.now() : '')
      var x
      try { x = new XMLHttpRequest() } catch (e) { return reject(e) }
      x.open(method, url, true)
      x.timeout = TIMEOUT
      x.setRequestHeader('Content-Type', 'application/json')
      x.onreadystatechange = function () {
        if (x.readyState !== 4) return
        if (x.status >= 200 && x.status < 300) {
          var out = x.responseText
          try { out = JSON.parse(out) } catch (e) {}
          resolve(out)
        } else { reject(new Error('http' + x.status)) }
      }
      x.ontimeout = function () { reject(new Error('timeout')) }
      x.onerror = function () { reject(new Error('network')) }
      x.send(body ? JSON.stringify(body) : null)
    })
  }

  /* 读真实数字 */
  function readCloud () {
    return request('GET').then(function (r) {
      cloudValue = {
        pv: Number(r && r.pv) || 0,
        uv: Number(r && r.uv) || 0,
        today: Number(r && r.today) || 0
      }
      paint()
      return cloudValue
    })
  }

  /* 上报一次访问（UV 去重交给后端） */
  function report () {
    return request('POST', { sid: SID }).catch(function () {})
  }

  /* ---------- 本机兜底计数 ---------- */
  function bump (withPV) {
    var t = today()
    var s = read() || { pv: 0, uv: 0, todayCount: 0, lastDay: '', firstVisit: Date.now() }

    if (s.lastDay !== t) {
      s.uv = (s.uv || 0) + 1
      s.lastDay = t
      s.todayCount = 0
    }

    var newSession = false
    try {
      if (!window.sessionStorage.getItem(SESS_KEY)) {
        window.sessionStorage.setItem(SESS_KEY, t)
        newSession = true
      }
    } catch (e) { newSession = true }

    if (withPV || newSession) {
      s.pv = (s.pv || 0) + 1
      s.todayCount = (s.todayCount || 0) + 1
    }

    if (s.pv < 0) s.pv = 0
    if (s.uv < 0) s.uv = 0
    if (s.todayCount < 0) s.todayCount = 0

    write(s)
    return s
  }

  /* ---------- 侧栏渲染 ---------- */
  var els = { uv: null, pv: null, td: null }

  function makeItem (label, value, id, icon) {
    var el = document.getElementById(id)
    if (el) { el.textContent = value; return el }
    var box = document.querySelector('.card-webinfo .webinfo')
    if (!box) return null

    var item = document.createElement('div')
    item.className = 'webinfo-item ss-item'
    if (icon) {
      var i = document.createElement('i')
      i.className = 'fas ' + icon
      item.appendChild(i)
    }
    var name = document.createElement('span')
    name.className = 'item-name ss-name'
    name.textContent = label + ' :'
    var cnt = document.createElement('span')
    cnt.className = 'item-count ss-count'
    cnt.id = id
    cnt.textContent = value
    item.appendChild(name)
    item.appendChild(cnt)
    box.appendChild(item)
    return cnt
  }

  function paint () {
    var local = read()
    var l = { pv: (local && local.pv) || 0, uv: (local && local.uv) || 0, todayCount: (local && local.todayCount) || 0 }
    if (!els.uv) {
      els.uv = makeItem('本站访客数', '', 'ss-site-uv', 'fa-user-friends')
      els.pv = makeItem('本站总访问量', '', 'ss-site-pv', 'fa-chart-bar')
      els.td = makeItem('今日访问', '', 'ss-today-pv', 'fa-sun')
    }
    var uv = l.uv, pv = l.pv, td = l.todayCount
    if (cloudValue) {
      uv = Math.max(cloudValue.uv, l.uv)
      pv = Math.max(cloudValue.pv, l.pv)
      td = Math.max(cloudValue.today, l.todayCount)
    }
    if (els.uv) els.uv.textContent = num(uv)
    if (els.pv) els.pv.textContent = num(pv)
    if (els.td) els.td.textContent = num(td)
  }

  function boot () {
    if (!document.querySelector('.card-webinfo')) return
    bump(true)
    paint()

    if (!enabled()) return                        // 后端没开 → 纯本机兜底
    readCloud()                                   // 先取真实数字显示
      .catch(function () { paint() })             // 接口 404/超时 → 静默降级，不影响页面
      .then(function () { return report() })      // 再上报本次访问
  }

  /* pjax / 换页：再上报一次（UV 由后端按天去重，不会重复计） */
  var counted = false
  function onNewPage () {
    if (counted) return
    counted = true
    if (!document.querySelector('.card-webinfo')) return
    if (!enabled()) return
    report()
  }
  document.addEventListener('pjax:complete', onNewPage)

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
})()
