/* ========== 随机逛逛（右下角骰子按钮） ==========
   之前站点里的「随便逛逛」入口随配置清理消失了，这里以常驻悬浮按钮的形式补回来。
   数据来自构建时生成的 /js/posts-index.js（window.__POSTS__）。
   - 点击随机跳到一篇文章，且尽量避开当前正在看的那篇
   - 支持 PJAX：优先走 pjax.loadUrl，避免整页刷新
   - 开了 PJAX 时按钮会被重建，脚本做了幂等处理
   ============================================== */
(function () {
  'use strict'

  var ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="4.2"/>' +
    '<circle cx="8.4" cy="8.4" r="1.25" fill="currentColor" stroke="none"/>' +
    '<circle cx="15.6" cy="8.4" r="1.25" fill="currentColor" stroke="none"/>' +
    '<circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none"/>' +
    '<circle cx="8.4" cy="15.6" r="1.25" fill="currentColor" stroke="none"/>' +
    '<circle cx="15.6" cy="15.6" r="1.25" fill="currentColor" stroke="none"/></svg>'

  var STORE_KEY = 'amoit-random-history'

  function posts () {
    return (window.__POSTS__ && window.__POSTS__.length) ? window.__POSTS__ : []
  }

  function toast (text) {
    try {
      if (window.btf && typeof window.btf.snackbarShow === 'function') {
        window.btf.snackbarShow(text)
      }
    } catch (e) {}
  }

  function currentPath () {
    return location.pathname.replace(/\/+$/, '') || '/'
  }

  function readHistory () {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]') } catch (e) { return [] }
  }

  function pushHistory (url) {
    try {
      var h = readHistory()
      h.push(url)
      if (h.length > 30) h = h.slice(-30)
      localStorage.setItem(STORE_KEY, JSON.stringify(h))
    } catch (e) {}
  }

  /* 随机挑一篇：
     1) 排除当前正在阅读的文章
     2) 尽量排除最近 10 次已经逛过的，避免连续重复 */
  function pick () {
    var list = posts()
    if (!list.length) return null
    if (list.length === 1) return list[0]

    var cur = currentPath()
    var recent = readHistory().slice(-10)
    var pool = list.filter(function (p) {
      return String(p.u).replace(/\/+$/, '') !== cur && recent.indexOf(p.u) === -1
    })
    if (!pool.length) {
      pool = list.filter(function (p) { return String(p.u).replace(/\/+$/, '') !== cur })
    }
    if (!pool.length) pool = list
    return pool[Math.floor(Math.random() * pool.length)]
  }

  function go () {
    var target = pick()
    if (!target) {
      toast('还没有可供跳转的文章')
      return
    }
    pushHistory(target.u)
    toast('随机逛逛 → ' + target.t)

    var url = target.u
    setTimeout(function () {
      try {
        if (window.pjax && typeof window.pjax.loadUrl === 'function') {
          window.pjax.loadUrl(url)
          return
        }
      } catch (e) {}
      location.href = url
    }, 260)
  }

  function build () {
    var rightside = document.getElementById('rightside')
    if (!rightside || document.getElementById('random-walk-btn')) return

    var wrap = document.createElement('div')
    wrap.id = 'random-walk-wrap'

    var btn = document.createElement('button')
    btn.id = 'random-walk-btn'
    btn.type = 'button'
    btn.className = 'random-walk-btn'
    btn.title = '随机逛逛'
    btn.setAttribute('aria-label', '随机逛逛')
    btn.innerHTML = ICON

    btn.addEventListener('click', function (e) {
      e.preventDefault()
      e.stopPropagation()
      go()
    })

    wrap.appendChild(btn)
    rightside.appendChild(wrap)
  }

  function init () {
    build()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
  document.addEventListener('pjax:complete', init)

  // 供菜单 / 控制台手动调用
  window.randomWalk = go
})()
