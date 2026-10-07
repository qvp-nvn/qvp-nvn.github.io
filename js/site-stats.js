/* =========================================================
   站点统计：本站访客数(UV) / 总访问量(PV) / 今日访问
   ---------------------------------------------------------
   双层策略（ never 空白 ）：
     1) 主：LeanCloud 第三方云存储（跨域 REST API）
        真实跨设备累计，访客换电脑/换浏览器也能累计进来。
     2) 备：本机 localStorage 统计
        云端没配 / 跨域被拦 / 接口超时，自动降级成本地数字。

   计数规则
   - UV  : 「日期 + 访客唯一 ID」去重，同一天同一台设备只算 1 位；
           跨自然日自动记为新访客。云端按天去重，跨设备也不会重复计。
   - PV  : 每个新页面（新标签页 / 新窗口 / 换页）记 1 次，刷新不重复。
   - 今日: 当天的累计访问次数。

   为什么不用「不蒜子」：该服务已于 2024 年关停，官方源与
   jsdelivr / unpkg / staticfile / bootcdn / baomitu 全部 404，
   换任何 CDN 都没有意义，所以直接换成 LeanCloud。
   ========================================================= */
(function () {
  'use strict'

  /* 下方这一行的真实值由 scripts/site-stats.cjs 在构建时自动替换，
     也可直接在 _config.butterfly.yml 的 site_stats.leancloud 里改。 */
  var CFG = /*__SS_LC_CFG__*/{"enabled":false,"id":"","key":"","region":"cn","counter":"Visitor"};

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

  /* ---------- XHR（带超时，失败不抛错） ---------- */
  function req (method, url, body, headers) {
    return new Promise(function (resolve, reject) {
      try {
        var x = new XMLHttpRequest()
        x.open(method, url, true)
        x.timeout = TIMEOUT
        var h = headers || {}
        h['Content-Type'] = 'application/json'
        h['Accept'] = 'application/json'
        for (var k in h) { if (h[k]) x.setRequestHeader(k, h[k]) }
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
      } catch (e) { reject(e) }
    })
  }

  /* ---------- LeanCloud ---------- */
  var SID = guid()
  var cache = {}   // 云端 counters 的 objectId
  var cloudValue = null

  function enabled () {
    return CFG.enabled && !!CFG.id && !!CFG.key
  }

  function base () {
    var host = CFG.region === 'global' ? 'lncldglobal.com' : 'cn-nodes.com'
    return 'https://' + CFG.id + '.api.' + host + '/1.1'
  }

  function lch () {
    return { 'X-LC-Id': CFG.id, 'X-LC-Key': CFG.key }
  }

  function path (name) {
    return base() + '/classes/' + CFG.counter + '?where=' + encodeURIComponent(JSON.stringify({ name: name }))
  }

  /* 查一条 counter，返回 {id, value}；查不到返回 null（POST 建一条） */
  function getOne (name, create) {
    return req('GET', path(name), null, lch()).then(function (r) {
      var arr = (r && r.results) || []
      if (arr.length) {
        cache[name] = arr[0].objectId
        return { id: arr[0].objectId, value: Number(arr[0].value) || 0 }
      }
      if (!create) return null
      return req('POST', base() + '/classes/' + CFG.counter, { name: name, value: 0 }, lch()).then(function (r2) {
        if (r2 && r2.objectId) cache[name] = r2.objectId
        return { id: (r2 && r2.objectId) || null, value: 0 }
      })
    })
  }

  /* 原子自增（LeanCloud Increment 操作，并发也安全） */
  function inc (id) {
    if (!id) return Promise.resolve(false)
    return req('PUT', base() + '/classes/' + CFG.counter + '/' + id,
      { value: { __op: 'Increment', amount: 1 } }, lch())
      .then(function (r) {
        if (r && typeof r.value !== 'undefined') {
          return r.value
        }
        return true
      })
      .catch(function () { return false })
  }

  /* 读取云端真实数字（不写入），用于首屏立即显示 */
  function readCloud () {
    var t = today()
    return Promise.all([
      getOne('pv', true),
      getOne('uv', true),
      getOne(t, true)
    ]).then(function (r) {
      cloudValue = { pv: r[0] ? r[0].value : 0, uv: r[1] ? r[1].value : 0, today: r[2] ? r[2].value : 0 }
      paint()
      return cloudValue
    })
  }

  /* 上报：PV +1；UV 按「今天 + 访客ID」去重后 +1；今日 +1 */
  function report () {
    var t = today()
    return Promise.all([getOne('pv'), getOne('uv'), getOne(t)])
      .then(function (r) {
        return Promise.all([inc(r[0] && r[0].id)])
          .then(function () { return r })
      })
      .then(function () { return getOne('u:' + t + ':' + SID) })  // 只查：今天这位访客记过没
      .then(function (found) {
        if (found) return false                 // 记过 → 不算新访客
        return getOne('u:' + t + ':' + SID, true) // 没记过 → 建一条，代表 1 位新访客
          .then(function (rec) { return inc(rec && rec.id) })
      })
      .then(function () { return inc(cache[t]) })  // 今日访问 +1
      .catch(function () { /* 上报失败无所谓，下次访问会补上 */ })
  }

  function reportPv () {
    return getOne('pv').then(function (r) { return inc(r && r.id) }).catch(function () {})
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
    var viaCloud = cloudValue
    if (viaCloud) {
      uv = Math.max(Number(viaCloud.uv) || 0, l.uv)
      pv = Math.max(Number(viaCloud.pv) || 0, l.pv)
      td = Math.max(Number(viaCloud.today) || 0, l.todayCount)
    }
    if (els.uv) els.uv.textContent = num(uv)
    if (els.pv) els.pv.textContent = num(pv)
    if (els.td) els.td.textContent = num(td)
  }

  function boot () {
    if (!document.querySelector('.card-webinfo')) return
    bump(true)
    paint()

    if (!enabled()) return          // 没配云端 → 纯本地兜底
    readCloud()                     // 先拉真实数字显示
      .catch(function () { paint() })
      .then(function () { return report() })   // 再上报本次访问
  }

  /* pjax / 换页：只加一次 PV，不重复计 UV */
  var counted = false
  function onNewPage () {
    if (counted) return
    counted = true
    bump(false)
    if (els.uv) {
      var local = read()
      els.uv.textContent = num((local && local.uv) || 0)
    }
    if (!document.querySelector('.card-webinfo')) return
    if (!enabled()) return
    reportPv()
  }
  document.addEventListener('pjax:complete', onNewPage)

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
})()
