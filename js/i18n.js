/* ========== 中英文语言切换 ==========
   参考 blog.starlitn.top 的语言切换按钮
   实现：JS 字典 + data-i18n 属性替换，localStorage 持久化
   不需要时注释 _config.butterfly.yml 里 inject.bottom 的对应行即可回滚
   ==================================== */

(function () {
  'use strict'

  var LANG_KEY = 'amoit-lang'
  var SUPPORTED = ['zh', 'en']
  var DEFAULT = 'zh'

  /* ---------- 翻译字典 ---------- */
  var DICT = {
    /* 导航菜单 */
    '首页':    { zh: '首页',    en: 'Home' },
    '时间轴':  { zh: '时间轴',  en: 'Timeline' },
    '分类':    { zh: '分类',    en: 'Categories' },
    '标签':    { zh: '标签',    en: 'Tags' },
    '留言板':  { zh: '留言板',  en: 'Message' },
    '友人帐':  { zh: '友人帐',  en: 'Friends' },
    '日常':    { zh: '日常',    en: 'Daily' },
    '追番':    { zh: '追番',    en: 'Anime' },
    '关于':    { zh: '关于',    en: 'About' },
    '工具库':  { zh: '工具库',  en: 'Toolkit' },

    /* 侧栏标题 */
    '最新文章':    { zh: '最新文章',    en: 'Recent Posts' },
    '公告':        { zh: '公告',        en: 'Notice' },
    '文章信息':    { zh: '文章信息',    en: 'Post Info' },
    '本文目录':    { zh: '本文目录',    en: 'Table of Contents' },
    '分类':        { zh: '分类',        en: 'Categories' },
    '标签':        { zh: '标签',        en: 'Tags' },
    '网站资讯':    { zh: '网站资讯',    en: 'Site Info' },
    '运行':        { zh: '运行',        en: 'Uptime' },
    '文章数目':    { zh: '文章数目',    en: 'Posts' },
    '本站总访问量':{ zh: '本站总访问量', en: 'Total Visits' },
    '本站访客数':  { zh: '本站访客数',  en: 'Visitors' },

    /* 文章 meta */
    '发表于':      { zh: '发表于',      en: 'Posted on' },
    '更新于':      { zh: '更新于',      en: 'Updated on' },
    '阅读量':      { zh: '阅读量',      en: 'Views' },
    '评论数':      { zh: '评论数',      en: 'Comments' },
    '字数':        { zh: '字数',        en: 'Words' },
    '阅读时长':    { zh: '阅读时长',    en: 'Read time' },
    '上一篇':      { zh: '上一篇',      en: 'Previous' },
    '下一篇':      { zh: '下一篇',      en: 'Next' },
    '相关推荐':    { zh: '相关推荐',    en: 'Related' },
    '版权声明':    { zh: '版权声明',    en: 'Copyright' },
    '本文作者':    { zh: '本文作者',    en: 'Author' },
    '本文链接':    { zh: '本文链接',    en: 'Link' },

    /* 通用按钮 */
    '搜索':        { zh: '搜索',        en: 'Search' },
    '返回顶部':    { zh: '返回顶部',    en: 'Top' },
    '展开/折叠':   { zh: '展开/折叠',   en: 'Toggle' },
    '评论':        { zh: '评论',        en: 'Comment' },
    '分享':        { zh: '分享',        en: 'Share' },
    '目录':        { zh: '目录',        en: 'TOC' },

    /* 追番相关 */
    '想看':        { zh: '想看',        en: 'Want to Watch' },
    '在看':        { zh: '在看',        en: 'Watching' },
    '看过':        { zh: '看过',        en: 'Watched' },
    '生命不息，追番不止！': { zh: '生命不息，追番不止！', en: 'Anime forever!' },

    /* 通用占位 */
    '暂无内容':    { zh: '暂无内容',    en: 'No content yet' }
  }

  /* ---------- 工具函数 ---------- */
  function getCurrent () {
    try {
      var v = localStorage.getItem(LANG_KEY)
      if (v && SUPPORTED.indexOf(v) > -1) return v
    } catch (e) {}
    // 跟随浏览器
    var nav = (navigator.language || navigator.userLanguage || 'zh').toLowerCase()
    return nav.startsWith('en') ? 'en' : DEFAULT
  }

  function persist (lang) {
    try { localStorage.setItem(LANG_KEY, lang) } catch (e) {}
  }

  /* ---------- 应用翻译 ---------- */
  function applyLang (lang) {
    var dict = DICT
    var textKey = (lang === 'en') ? 'en' : 'zh'

    // 1. 导航菜单项（按文案匹配）
    document.querySelectorAll('#nav .site-page, .menus_item .site-page').forEach(function (el) {
      var raw = el.textContent.trim()
      // 跳过有子菜单的父项文字（保留原样由展开处理）
      if (dict[raw]) el.textContent = dict[raw][textKey]
    })

    // 2. 侧栏标题
    document.querySelectorAll('.item-headline, .card-announcement .item-headline, .webinfo .item-headline').forEach(function (el) {
      var raw = el.textContent.trim()
      if (dict[raw]) el.textContent = dict[raw][textKey]
    })

    // 3. 文章 meta 标签
    document.querySelectorAll('.article-meta .article-meta-label, .post-meta .post-meta-label').forEach(function (el) {
      var raw = el.textContent.replace(/[:：]\s*$/, '').trim()
      if (dict[raw]) {
        el.textContent = dict[raw][textKey] + (el.textContent.endsWith('：') ? '：' : (el.textContent.endsWith(':') ? ':' : ''))
      }
    })

    // 4. data-i18n 显式标记的元素
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n')
      if (dict[key]) el.textContent = dict[key][textKey]
    })

    // 5. 切换按钮自身文案
    var btn = document.getElementById('lang-switch-btn')
    if (btn) {
      btn.textContent = (lang === 'zh') ? 'EN' : '中'
      btn.setAttribute('title', (lang === 'zh') ? 'Switch to English' : '切换到中文')
      btn.setAttribute('aria-label', btn.getAttribute('title'))
    }

    // 6. <html lang> 同步（SEO 友好）
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en')

    // 7. 触发事件让其它脚本感知
    document.dispatchEvent(new CustomEvent('amoit:lang-change', { detail: { lang: lang } }))
  }

  /* ---------- 注入切换按钮 ---------- */
  function injectButton () {
    if (document.getElementById('lang-switch-btn')) return

    var btn = document.createElement('button')
    btn.id = 'lang-switch-btn'
    btn.type = 'button'
    btn.className = 'lang-switch-btn'
    var lang = getCurrent()
    btn.textContent = (lang === 'zh') ? 'EN' : '中'
    btn.setAttribute('title', (lang === 'zh') ? 'Switch to English' : '切换到中文')
    btn.setAttribute('aria-label', btn.getAttribute('title'))

    btn.addEventListener('click', function () {
      var cur = getCurrent()
      var next = (cur === 'zh') ? 'en' : 'zh'
      persist(next)
      applyLang(next)
    })

    // 放在右上角导航栏里
    var nav = document.getElementById('nav') || document.querySelector('#page-header')
    if (nav) {
      // 优先尝试放进 nav 内的菜单容器
      var menus = nav.querySelector('.menus_items, .nav-toggle, #nav')
      if (menus && menus.parentNode) {
        // 插入到 nav 末尾，让它在右边
        nav.appendChild(btn)
      } else {
        nav.appendChild(btn)
      }
    } else {
      // 兜底放 body 右上角
      btn.style.position = 'fixed'
      btn.style.top = '16px'
      btn.style.right = '80px'
      btn.style.zIndex = '1001'
      document.body.appendChild(btn)
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
    // 首次应用（如果是 zh 就不替换，保留原文；如果是 en 则翻译）
    if (initial === 'en') applyLang('en')
  })

  // 暴露 API 给其它脚本用
  window.amoitI18n = {
    get: getCurrent,
    set: function (l) { persist(l); applyLang(l) },
    dict: DICT
  }
})()
