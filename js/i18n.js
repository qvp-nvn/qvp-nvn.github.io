/* ========== 中英文语言切换（translate.js 整页翻译版） ==========
   参考 haloo-cod/Nebula 的 i18n 方案：底层用 translate.js 全站自动翻译，
   能翻译导航、侧栏、文章正文等所有文本，而不是只翻译写死的字典。
   切换按钮放在右侧常驻面板（#rightside-config-show），齿轮按钮之前。
   ===================================================== */

(function () {
  'use strict'

  /* 防重入：防止脚本被意外加载两次导致按钮重复 */
  if (window.__amoitI18nLoaded) return
  window.__amoitI18nLoaded = true

  var LANG_KEY = 'amoit-lang'
  var DEFAULT = 'zh'

  /* translate.js 的语言代码 */
  var TJS_CODE = { zh: 'chinese_simplified', en: 'english' }

  function getCurrent () {
    try {
      var v = localStorage.getItem(LANG_KEY)
      if (v === 'zh' || v === 'en') return v
    } catch (e) {}
    var nav = (navigator.language || navigator.userLanguage || 'zh').toLowerCase()
    return nav.indexOf('en') === 0 ? 'en' : DEFAULT
  }

  function persist (lang) {
    try { localStorage.setItem(LANG_KEY, lang) } catch (e) {}
  }

  /* ---------- 调 translate.js 切换；失败时用 UI 字典兜底 ---------- */
  var UI_DICT = {
    '首页': 'Home', '时间轴': 'Timeline', '分类': 'Categories', '标签': 'Tags',
    '留言板': 'Message', '友人帐': 'Friends', '日常': 'Daily', '追番': 'Anime',
    '工具库': 'Toolkit', '关于': 'About', '搜索': 'Search', '回到顶部': 'Top',
    '生命不息，追番不止！': 'Anime forever!', '想看': 'Want to Watch',
    '在看': 'Watching', '看过': 'Watched'
  }

  function applyFallbackDict (lang) {
    document.querySelectorAll('#nav .site-page span, .menus_item .site-page span, #sidebar-menus .site-page span').forEach(function (el) {
      var raw = (el.getAttribute('data-orig') || el.textContent).trim()
      if (!el.getAttribute('data-orig')) el.setAttribute('data-orig', raw)
      if (lang === 'en' && UI_DICT[raw]) el.textContent = ' ' + UI_DICT[raw]
      else el.textContent = ' ' + raw
    })
  }

  function switchLang (lang) {
    var t = window.translate
    if (t && typeof t.changeLanguage === 'function') {
      try {
        t.changeLanguage(TJS_CODE[lang])
        console.log('[i18n] translate.js 切换到', TJS_CODE[lang])
        return true
      } catch (e) { console.warn('[i18n] translate.js 切换异常，走字典兜底', e) }
    } else {
      console.warn('[i18n] translate.js 未就绪，走字典兜底')
    }
    applyFallbackDict(lang)
    return false
  }

  /* ---------- 更新按钮外观 ---------- */
  function updateButton (lang) {
    var btn = document.getElementById('lang-switch-btn')
    if (!btn) return
    var span = btn.querySelector('span')
    if (span) span.textContent = (lang === 'zh') ? 'EN' : '中'
    btn.setAttribute('title', (lang === 'zh') ? 'Switch to English' : '切换到中文')
    btn.setAttribute('aria-label', btn.getAttribute('title'))
  }

  /* ---------- 切换入口 ---------- */
  function applyLang (lang) {
    var ok = switchLang(lang)
    updateButton(lang)
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en')
    document.dispatchEvent(new CustomEvent('amoit:lang-change', { detail: { lang: lang, ok: ok } }))
  }

  /* ---------- 注入按钮：常驻面板，齿轮之前 ---------- */
  function injectButton () {
    if (document.getElementById('lang-switch-btn')) return

    var btn = document.createElement('button')
    btn.id = 'lang-switch-btn'
    btn.type = 'button'
    btn.className = 'lang-switch-btn'
    var lang = getCurrent()
    btn.innerHTML = '<i class="fas fa-language"></i><span>' + (lang === 'zh' ? 'EN' : '中') + '</span>'
    btn.setAttribute('title', (lang === 'zh') ? 'Switch to English' : '切换到中文')

    btn.addEventListener('click', function () {
      var next = (getCurrent() === 'zh') ? 'en' : 'zh'
      persist(next)
      applyLang(next)
    })

    /* 放进常驻面板 #rightside-config-show，插在齿轮按钮之前 */
    var showPanel = document.getElementById('rightside-config-show')
    if (showPanel) {
      showPanel.insertBefore(btn, showPanel.firstChild)
    } else {
      /* 兜底：挂到 #rightside；再不行挂 body 右侧 */
      var rs = document.getElementById('rightside')
      if (rs) rs.insertBefore(btn, rs.firstChild)
      else document.body.appendChild(btn)
    }
    updateButton(lang)
  }

  /* ---------- 初始化 translate.js ---------- */
  function initTranslate (lang) {
    if (!window.translate) return
    try {
      // 页面原文是简体中文
      if (translate.language && translate.language.setLocal) {
        translate.language.setLocal('chinese_simplified')
      }
      // DOM 变化后自动翻译新内容（pjax / 评论加载等）
      if (translate.listener && translate.listener.start) {
        translate.listener.start()
      }
      translate.execute()
      // 首访就是英文，则直接切过去
      if (lang === 'en') {
        setTimeout(function () { switchLang('en') }, 300)
      }
    } catch (e) {}
  }

  /* ---------- 等 translate.js 与 DOM 就绪 ---------- */
  function boot () {
    injectButton()
    var lang = getCurrent()
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en')

    if (window.translate) {
      initTranslate(lang)
    } else {
      // translate.js 由 inject.bottom 先于本脚本引入；若还没就绪则等待
      var tries = 0
      var timer = setInterval(function () {
        tries++
        if (window.translate || tries > 20) {
          clearInterval(timer)
          if (window.translate) initTranslate(getCurrent())
        }
      }, 250)
    }
  }

  if (document.readyState !== 'loading') boot()
  else document.addEventListener('DOMContentLoaded', boot)

  /* 暴露 API */
  window.amoitI18n = {
    get: getCurrent,
    set: function (l) { persist(l); applyLang(l) }
  }
})()
