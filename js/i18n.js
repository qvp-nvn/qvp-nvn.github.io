/* ========== 中英文语言切换（重写版） ==========
   参考 haloo-cod/Nebula 的 i18n 方案
   关键改进：
   1）用 data-i18n-original 锚定元素原始文案，确保中→英→中来回切换都能还原
   2）扫描时机更全面：导航菜单、侧栏标题、文章 meta、追番标签、TOC、评论区
   3）按钮放进设置二级面板（#rightside-config-hide），不抢主操作位
   ===================================================== */

(function () {
  'use strict'

  var LANG_KEY = 'amoit-lang'
  var ORIGINAL_ATTR = 'data-i18n-original'   // 锚定元素首次出现的原文
  var SUPPORTED = ['zh', 'en']
  var DEFAULT = 'zh'

  /* ---------- 翻译字典（key 是中文原文，value.en 是英文） ---------- */
  var DICT = {
    /* 导航菜单 */
    '首页':    'Home',
    '时间轴':  'Timeline',
    '分类':    'Categories',
    '标签':    'Tags',
    '留言板':  'Message',
    '友人帐':  'Friends',
    '日常':    'Daily',
    '追番':    'Anime',
    '工具库':  'Toolkit',
    '关于':    'About',

    /* 侧栏 / 站点统计 */
    '最新文章':    'Recent Posts',
    '公告':        'Notice',
    '文章信息':    'Post Info',
    '本文目录':    'Contents',
    '网站资讯':    'Site Info',
    '运行':        'Uptime',
    '文章数目':    'Posts',
    '本站总访问量': 'Total Visits',
    '本站访客数':  'Visitors',
    '文章':        'Posts',
    '最后更新':    'Last Update',

    /* 文章 meta */
    '发表于':      'Posted on',
    '更新于':      'Updated on',
    '阅读量':      'Views',
    '阅读量:':     'Views:',
    '评论数':      'Comments',
    '字数':        'Words',
    '阅读时长':    'Read time',
    '上一篇':      'Previous',
    '下一篇':      'Next',
    '相关推荐':    'Related',
    '版权声明':    'Copyright',
    '本文作者':    'Author',
    '本文链接':    'Link',

    /* 通用按钮 / 右侧悬浮 */
    '搜索':        'Search',
    '返回顶部':    'Back to Top',
    '评论':        'Comment',
    '分享':        'Share',
    '目录':        'TOC',
    '浅色和深色模式转换': 'Toggle Light/Dark',
    '单栏和双栏切换':     'Toggle Sidebar',

    /* 追番 */
    '想看':        'Want to Watch',
    '在看':        'Watching',
    '看过':        'Watched',
    '生命不息，追番不止！': 'Anime forever!',
    '追番列表':    'Anime List',

    /* 工具页 */
    '开源项目与实用工具': 'Open Source & Tools',
    '加载中…':     'Loading…'
  }

  /* ---------- 工具函数 ---------- */
  function getCurrent () {
    try {
      var v = localStorage.getItem(LANG_KEY)
      if (v && SUPPORTED.indexOf(v) > -1) return v
    } catch (e) {}
    var nav = (navigator.language || navigator.userLanguage || 'zh').toLowerCase()
    return nav.indexOf('en') === 0 ? 'en' : DEFAULT
  }

  function persist (lang) {
    try { localStorage.setItem(LANG_KEY, lang) } catch (e) {}
  }

  /* 翻译单个字符串：中文 key 直接查；英文 value 反查回中文 */
  function translate (text, lang) {
    var t = text.trim()
    if (!t) return text
    if (lang === 'zh') {
      // 反查：英文 → 中文
      for (var k in DICT) {
        if (DICT.hasOwnProperty(k) && DICT[k] === t) return k
      }
      return text          // 找不到就保留原文（已经是中文）
    } else {
      // 正查：中文 → 英文
      return DICT[t] || text
    }
  }

  /* ---------- 给元素打上原文锚点（首次扫描时） ---------- */
  function markOriginal (el) {
    if (!el.getAttribute(ORIGINAL_ATTR)) {
      el.setAttribute(ORIGINAL_ATTR, el.textContent)
    }
  }

  /* ---------- 应用翻译到单个元素 ---------- */
  function applyToEl (el, lang) {
    var original = el.getAttribute(ORIGINAL_ATTR)
    if (!original) {
      markOriginal(el)
      original = el.textContent
    }
    var translated = translate(original, lang)
    if (translated !== el.textContent) el.textContent = translated
  }

  /* ---------- 全局应用 ---------- */
  function applyLang (lang) {
    /* 1. 导航菜单（顶部 + 移动端侧边栏）—— 只替换文字 span，保留图标 */
    document.querySelectorAll('#nav .site-page span, .menus_item .site-page span, #sidebar-menus .site-page span').forEach(function (el) {
      applyToEl(el, lang)
    })

    /* 2. 侧栏标题（headline 类） */
    document.querySelectorAll('.item-headline, .card-announcement .item-headline, .webinfo .item-headline, .aside-list .item-headline').forEach(function (el) {
      applyToEl(el, lang)
    })

    /* 3. 站点统计数字旁的标签 */
    document.querySelectorAll('.headline, .site-data .headline, .length-num, .webinfo-item .item-name').forEach(function (el) {
      if (el.classList.contains('headline')) applyToEl(el, lang)
    })

    /* 4. 文章 meta（发表于/更新于/阅读量等） */
    document.querySelectorAll('.article-meta__date, .article-meta__categories, .post-meta__date, .post-meta__categories, .article-meta span, .post-meta span').forEach(function (el) {
      var raw = el.textContent.trim()
      // 只翻译纯文字片段（跳过日期、数字）
      if (raw && !/^\d|\d{4}-\d|\d+$/.test(raw) && raw.length < 20) {
        applyToEl(el, lang)
      }
    })

    /* 5. 文章底部「上一篇/下一篇/相关推荐/版权声明」 */
    document.querySelectorAll('.post-nav-item, .post-nav-title, .relatedPosts-title, .post-copyright .post-copyright-info, .post-copyright-meta').forEach(function (el) {
      applyToEl(el, lang)
    })

    /* 6. 追番页标签 */
    document.querySelectorAll('.bangumi-tab, .bangumi-title, #article-container .bangumi-info-item span').forEach(function (el) {
      var raw = el.textContent.trim()
      if (raw && DICT[raw]) applyToEl(el, lang)
    })

    /* 7. 工具页标题 */
    document.querySelectorAll('#article-container h1, #article-container h2').forEach(function (el) {
      applyToEl(el, lang)
    })

    /* 8. data-i18n 显式标记 */
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      applyToEl(el, lang)
    })

    /* 9. 切换按钮自身 */
    updateButton(lang)

    /* 10. <html lang> 同步 */
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en')

    /* 11. 触发事件 */
    document.dispatchEvent(new CustomEvent('amoit:lang-change', { detail: { lang: lang } }))
  }

  /* ---------- 更新切换按钮文案 ---------- */
  function updateButton (lang) {
    var btn = document.getElementById('lang-switch-btn')
    if (!btn) return
    var span = btn.querySelector('span') || btn
    span.textContent = (lang === 'zh') ? 'EN' : '中'
    btn.setAttribute('title', (lang === 'zh') ? 'Switch to English' : '切换到中文')
    btn.setAttribute('aria-label', btn.getAttribute('title'))
  }

  /* ---------- 创建切换按钮（放进设置二级面板） ---------- */
  function injectButton () {
    if (document.getElementById('lang-switch-btn')) return

    var btn = document.createElement('button')
    btn.id = 'lang-switch-btn'
    btn.type = 'button'
    btn.className = 'lang-switch-btn'
    btn.innerHTML = '<i class="fas fa-language"></i><span>EN</span>'
    btn.setAttribute('title', 'Switch to English')

    btn.addEventListener('click', function () {
      var cur = getCurrent()
      var next = (cur === 'zh') ? 'en' : 'zh'
      persist(next)
      applyLang(next)
    })

    /* 优先放进设置二级面板 #rightside-config-hide */
    var panel = document.getElementById('rightside-config-hide')
    if (panel) {
      panel.appendChild(btn)
    } else {
      // 兜底：等 DOM 完全渲染后再尝试
      setTimeout(function () {
        var p = document.getElementById('rightside-config-hide')
        if (p) p.appendChild(btn)
        else {
          // 最终兜底放右侧悬浮区
          var rs = document.getElementById('rightside')
          if (rs) rs.appendChild(btn)
        }
      }, 500)
    }
  }

  /* ---------- 等 DOM 就绪 ---------- */
  function ready (fn) {
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  /* ---------- 入口 ---------- */
  var initial = getCurrent()
  ready(function () {
    injectButton()
    // 首次应用：如果是 zh 不替换（保留原文）；如果是 en 则翻译
    if (initial === 'en') {
      // 延迟一拍，等主题 JS 也跑完
      setTimeout(function () { applyLang('en') }, 100)
    }
  })

  /* 暴露 API */
  window.amoitI18n = {
    get: getCurrent,
    set: function (l) { persist(l); applyLang(l) },
    dict: DICT
  }
})()
