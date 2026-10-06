/* ========== 三档主题切换：日光 / 夜间 / 淡紫 ==========
   与 source/css/theme-tri.css 配套。
   切换过程参考 blog.ericterminal.com：用 View Transitions API 做圆形扩散——
   新主题图层压在旧图层之上，从鼠标点击的位置以圆形揭开的动画扩散到全屏；
   浏览器不支持时降级为柔和淡入。
   本脚本同步加载于 <head>，会在首帧绘制前把第三档（淡紫）补回来，不会闪白。
   ======================================================== */
(function () {
  'use strict'

  var KEY = 'amoit-theme'                       // 自有键，永久保存，优先读取
  var ORDER = ['light', 'dark', 'lilac']        // 三档循环顺序
  var META_COLOR = { light: '#ffffff', dark: '#0d0d0d', lilac: '#f5f2fc' }
  var TIP = { light: '☀ 日光模式', dark: '🌙 夜间模式', lilac: '🎨 淡紫模式' }
  var NEXT_TITLE = { light: '切换到夜间模式', dark: '切换到淡紫模式', lilac: '切换到日光模式' }

  var ICON = {
    light:
      '<svg class="theme-tri-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="4.2"/>' +
      '<path d="M12 2.2v2.4M12 19.4v2.4M2.2 12h2.4M19.4 12h2.4' +
      'M5.1 5.1l1.7 1.7M17.2 17.2l1.7 1.7M18.9 5.1l-1.7 1.7M6.8 17.2l-1.7 1.7"/></svg>',
    dark:
      '<svg class="theme-tri-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M20 14.2A8.4 8.4 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2z"/></svg>',
    lilac:
      '<svg class="theme-tri-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M12 3.2a8.8 8.8 0 0 0 0 17.6c.85 0 1.45-.68 1.45-1.45' +
      ' 0-.4-.17-.78-.47-1.07a1.6 1.6 0 0 1-.48-1.13c0-.82.68-1.5 1.5-1.5' +
      'H16a4.9 4.9 0 0 0 4.9-4.9c0-4.2-3.9-7.55-8.9-7.55z"/>' +
      '<circle cx="7.6" cy="11.2" r="1.05" fill="currentColor" stroke="none"/>' +
      '<circle cx="10.8" cy="7.2" r="1.05" fill="currentColor" stroke="none"/>' +
      '<circle cx="15.1" cy="8.6" r="1.05" fill="currentColor" stroke="none"/></svg>'
  }

  var root = document.documentElement
  var busy = false

  /* 开关默认藏在「设置齿轮」的二级面板里，切换一次要点两下。
     改成常驻显示；不想要就把它设为 false。 */
  var PROMOTE_BUTTON = true

  /* ---------- 读取持久化的模式 ---------- */
  function readSaved () {
    try {
      var v = localStorage.getItem(KEY)
      if (v && ORDER.indexOf(v) > -1) return v
      // 兜底：兼容 Butterfly 自己存的 theme（{value, expiry} 结构，2 天过期）
      if (window.saveToLocal) {
        var t = window.saveToLocal.get('theme')
        if (t && ORDER.indexOf(t) > -1) return t
      }
    } catch (e) {}
    return null
  }

  function persist (mode) {
    try { localStorage.setItem(KEY, mode) } catch (e) {}
    try {
      // 同步给 Butterfly：淡紫是浅色系，告诉它「light」最安全
      if (window.saveToLocal) window.saveToLocal.set('theme', mode === 'lilac' ? 'light' : mode, 2)
    } catch (e) {}
  }

  // 主题自己的内联脚本此时已跑完（light/dark 已恢复），这里把第三档补回来
  // ⭐ 首访默认走淡紫（lilac），与站点整体风格一致；用户切换后以其选择为准
  //    但若用户系统明确是深色模式，则尊重其偏好首访给夜间，避免突兀
  var current = readSaved()
  if (!current) {
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    current = prefersDark ? 'dark' : 'lilac'
  }
  if (root.getAttribute('data-theme') !== current) root.setAttribute('data-theme', current)

  /* ---------- 落地到页面 ---------- */
  function setMetaColor (mode) {
    var m = document.querySelector('meta[name="theme-color"]')
    if (m) m.setAttribute('content', META_COLOR[mode] || '#ffffff')
  }

  function syncIcon (spin) {
    var btn = document.getElementById('darkmode')
    if (!btn) return
    btn.innerHTML = ICON[current]
    btn.setAttribute('title', NEXT_TITLE[current])
    btn.setAttribute('aria-label', TIP[current])
    if (spin) {
      btn.classList.remove('tri-spin')
      // 重排一次，保证连续点击时动画能重新播放
      void btn.offsetWidth
      btn.classList.add('tri-spin')
      setTimeout(function () { btn.classList.remove('tri-spin') }, 600)
    }
  }

  // 评论区 / 图表的主题要跟着换（淡紫是浅色底色，按 light 处理）
  function syncThirdParty () {
    try { typeof utterancesTheme === 'function' && utterancesTheme() } catch (e) {}
    try { typeof changeGiscusTheme === 'function' && changeGiscusTheme() } catch (e) {}
    try { typeof FB === 'object' && window.loadFBComment && window.loadFBComment() } catch (e) {}
    try { typeof runMermaid === 'function' && window.runMermaid() } catch (e) {}
  }

  function toast (text) {
    try {
      if (window.btf && typeof window.btf.snackbarShow === 'function') {
        window.btf.snackbarShow(text)
      }
    } catch (e) {}
  }

  function applyTheme (mode) {
    current = mode
    root.setAttribute('data-theme', mode)
    setMetaColor(mode)
    persist(mode)
    syncIcon(true)
    syncThirdParty()
    toast(TIP[mode])
  }

  /* ---------- 圆形扩散切换（参考 ericterminal） ---------- */
  function getOrigin (evt) {
    if (evt && typeof evt.clientX === 'number' && (evt.clientX || evt.clientY)) {
      return {
        x: Math.min(Math.max(evt.clientX, 0), window.innerWidth),
        y: Math.min(Math.max(evt.clientY, 0), window.innerHeight)
      }
    }
    var btn = document.getElementById('darkmode')
    if (btn) {
      var r = btn.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  }

  function switchWithRipple (mode, evt) {
    var reduced = false
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch (e) {}

    if (typeof document.startViewTransition !== 'function' || reduced) {
      root.setAttribute('data-theme-switching', 'fallback')
      applyTheme(mode)
      setTimeout(function () { root.removeAttribute('data-theme-switching') }, 450)
      return
    }

    var origin = getOrigin(evt)
    root.setAttribute('data-theme-switching', 'ripple')

    var transition
    try {
      transition = document.startViewTransition(function () { applyTheme(mode) })
    } catch (e) {
      root.removeAttribute('data-theme-switching')
      applyTheme(mode)
      return
    }

    transition.ready
      .then(function () {
        var mx = Math.max(origin.x, window.innerWidth - origin.x)
        var my = Math.max(origin.y, window.innerHeight - origin.y)
        var radius = Math.sqrt(mx * mx + my * my)
        return document.documentElement.animate(
          {
            clipPath: [
              'circle(0px at ' + origin.x + 'px ' + origin.y + 'px)',
              'circle(' + radius + 'px at ' + origin.x + 'px ' + origin.y + 'px)'
            ]
          },
          {
            duration: 620,
            easing: 'cubic-bezier(.22, 1, .36, 1)',
            pseudoElement: '::view-transition-new(root)'
          }
        ).finished
      })
      .catch(function () {})

    transition.finished
      .catch(function () {})
      .then(function () { root.removeAttribute('data-theme-switching') })
  }

  /* ---------- 接管 #darkmode 按钮 ----------
     Butterfly 把点击事件委托在 #rightside 上（冒泡阶段），
     这里在捕获阶段先拦下来，改走三档循环；原来的两档逻辑就不会再执行。 */
  document.addEventListener('click', function (e) {
    if (!(e.target instanceof Element)) return
    var btn = e.target.closest('#darkmode')
    if (!btn) return

    e.stopPropagation()
    e.preventDefault()
    if (busy) return
    busy = true

    var idx = ORDER.indexOf(current)
    var next = ORDER[(idx < 0 ? 0 : idx + 1) % ORDER.length]
    switchWithRipple(next, e)

    setTimeout(function () { busy = false }, 700)
  }, true)

  /* ---------- 初始化 UI ---------- */
  // 把开关从二级面板挪到常驻区（等 DOM 就绪后做一次即可）
  function promoteButton () {
    if (!PROMOTE_BUTTON) return
    try {
      var btn = document.getElementById('darkmode')
      var panel = btn && btn.parentNode
      var dock = document.getElementById('rightside-config-show')
      if (btn && panel && panel.id === 'rightside-config-hide' && dock && !dock.contains(btn)) {
        dock.insertBefore(btn, dock.firstChild)
      }
    } catch (e) {}
  }

  function init () {
    promoteButton()
    setMetaColor(current)
    syncIcon(false)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
  // 开了 PJAX 时侧栏按钮会被重建，重新注入图标
  document.addEventListener('pjax:complete', init)
  window.addEventListener('load', init)
})()
