/* ========== 侧栏「时间胶囊」：模拟时钟 + 日历 ==========
   一块玻璃卡片，包含三部分：
   1. 模拟表盘——时/分/秒三根指针每秒走一次，圆心带秒针点缀
   2. 数字时间——时分秒 + 年月日 + 星期 + 问候语
   3. 月历——可前后翻月，今天高亮；有文章发布的日子带小圆点，
      点击该日会在下方列出当天的文章，点条目直接跳转。
   数据来自构建时生成的 /js/posts-index.js（window.__POSTS__），没有也不影响时钟。
   整块卡片加了 notranslate，避免中英切换时把时间数字翻乱。
   ==================================================== */
(function () {
  'use strict'

  var CARD_ID = 'card-clock-calendar'
  var WEEK = ['日', '一', '二', '三', '四', '五', '六']
  var timer = null

  /* 公历固定节假日 + 2026 年农历节日与节气（每年小表，未覆盖的月份就不显示） */
  var HOLIDAYS = {
    '01-01': '元旦', '02-14': '情人节', '03-08': '妇女节',
    '04-01': '愚人节', '05-01': '劳动节', '05-04': '青年节',
    '06-01': '儿童节', '07-01': '建党节', '08-01': '建军节',
    '09-10': '教师节', '10-01': '国庆', '12-24': '平安夜',
    '12-25': '圣诞节',
    /* 2026 农历 / 节气 */
    '2026-02-17': '春节', '2026-03-05': '惊蛰', '2026-03-20': '春分',
    '2026-04-05': '清明', '2026-05-05': '立夏', '2026-06-19': '端午',
    '2026-06-21': '夏至', '2026-08-07': '立秋', '2026-09-25': '中秋',
    '2026-10-08': '寒露', '2026-10-23': '霜降', '2026-11-07': '立冬',
    '2026-12-22': '冬至'
  }

  function holidayOf (k) {
    if (HOLIDAYS[k]) return HOLIDAYS[k]
    return HOLIDAYS[k.slice(5)] || ''
  }

  function pad (n) { return n < 10 ? '0' + n : String(n) }
  function key (y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d) }

  function posts () {
    return (window.__POSTS__ && window.__POSTS__.length) ? window.__POSTS__ : []
  }

  /** { '2026-10-07': [{t,u}] } */
  function buildMap () {
    var map = Object.create(null)
    posts().forEach(function (p) {
      if (!p.d) return
      var k = String(p.d).slice(0, 10)
      ;(map[k] || (map[k] = [])).push({ t: p.t, u: p.u })
    })
    return map
  }

  function greet (h) {
    if (h < 5) return '夜深了，早点休息'
    if (h < 9) return '早上好，新的一天'
    if (h < 12) return '上午好，保持专注'
    if (h < 14) return '中午好，记得吃饭'
    if (h < 18) return '下午好，继续加油'
    if (h < 23) return '晚上好，放松一下'
    return '夜深了，早点休息'
  }

  function esc (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
    })
  }

  /* ---------------- DOM ---------------- */

  function template () {
    return '' +
      '<div class="item-headline">' +
      '<i class="fas fa-clock"></i><span>时间胶囊</span>' +
      '</div>' +
      '<div class="cc-body">' +
      '  <div class="cc-clock">' +
      '    <div class="cc-dial">' +
      '      <span class="cc-tick cc-tick-12"></span>' +
      '      <span class="cc-tick cc-tick-3"></span>' +
      '      <span class="cc-tick cc-tick-6"></span>' +
      '      <span class="cc-tick cc-tick-9"></span>' +
      '      <span class="cc-hand cc-hand-h"><i></i></span>' +
      '      <span class="cc-hand cc-hand-m"><i></i></span>' +
      '      <span class="cc-hand cc-hand-s"><i></i></span>' +
      '      <span class="cc-pin"></span>' +
      '    </div>' +
      '    <div class="cc-digital">' +
      '      <div class="cc-time"><b>--</b>:<b>--</b><small>:--</small></div>' +
      '      <div class="cc-date">----年--月--日 星期-</div>' +
      '      <div class="cc-hi">你好</div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="cc-cal">' +
      '    <div class="cc-cal-head">' +
      '      <button type="button" class="cc-nav" data-act="prev" aria-label="上一月">‹</button>' +
      '      <span class="cc-cal-title">----年--月</span>' +
      '      <button type="button" class="cc-nav" data-act="next" aria-label="下一月">›</button>' +
      '      <button type="button" class="cc-today">今天</button>' +
      '    </div>' +
      '    <div class="cc-week">' + WEEK.map(function (w) {
        return '<span' + (w === '日' || w === '六' ? ' class="cc-we"' : '') + '>' + w + '</span>'
      }).join('') + '</div>' +
      '    <div class="cc-grid"></div>' +
      '    <div class="cc-posts"></div>' +
      '  </div>' +
      '</div>'
  }

  function mount () {
    var aside = document.getElementById('aside-content')
    if (!aside) return null
    if (document.getElementById(CARD_ID)) return document.getElementById(CARD_ID)

    var card = document.createElement('div')
    card.id = CARD_ID
    card.className = 'card-widget card-clock notranslate'
    card.setAttribute('translate', 'no')
    card.innerHTML = template()

    // 放在作者卡片之后；没有作者卡片就直接插到最前面
    var author = aside.querySelector('.card-widget.card-author, #card-author')
    if (author && author.nextSibling) {
      aside.insertBefore(card, author.nextSibling)
    } else {
      aside.insertBefore(card, aside.firstChild)
    }
    return card
  }

  /* ---------------- 时钟 ---------------- */

  function tickClock (card, now) {
    var h = now.getHours()
    var m = now.getMinutes()
    var s = now.getSeconds()

    var hh = card.querySelector('.cc-hand-h')
    var mm = card.querySelector('.cc-hand-m')
    var ss = card.querySelector('.cc-hand-s')
    if (hh) hh.style.transform = 'rotate(' + ((h % 12) * 30 + m * 0.5) + 'deg)'
    if (mm) mm.style.transform = 'rotate(' + (m * 6 + s * 0.1) + 'deg)'
    if (ss) ss.style.transform = 'rotate(' + (s * 6) + 'deg)'

    var time = card.querySelector('.cc-time')
    if (time) {
      time.innerHTML = '<b>' + pad(h) + '</b>:<b>' + pad(m) + '</b><small>:' + pad(s) + '</small>'
    }
    var date = card.querySelector('.cc-date')
    if (date) {
      date.textContent = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' +
        now.getDate() + '日 星期' + WEEK[now.getDay()]
    }
    var hi = card.querySelector('.cc-hi')
    if (hi) hi.textContent = greet(h)
  }

  /* ---------------- 日历 ---------------- */

  function renderCal (card, map, viewY, viewM, todayKey) {
    var grid = card.querySelector('.cc-grid')
    var title = card.querySelector('.cc-cal-title')
    if (!grid) return

    title.textContent = viewY + '年' + (viewM + 1) + '月'

    var first = new Date(viewY, viewM, 1)
    var startDow = first.getDay()            // 本月 1 号是星期几
    var days = new Date(viewY, viewM + 1, 0).getDate()

    var html = ''
    var i
    for (i = 0; i < startDow; i++) html += '<span class="cc-cell cc-empty"></span>'

    for (i = 1; i <= days; i++) {
      var k = key(viewY, viewM, i)
      var cls = 'cc-cell'
      if (k === todayKey) cls += ' is-today'
      if (map[k]) cls += ' has-post'
      var isWe = (startDow + i - 1) % 7 === 0 || (startDow + i - 1) % 7 === 6
      if (isWe) cls += ' cc-we'
      var hol = holidayOf(k)
      if (hol) cls += ' is-holiday'
      html += '<span class="' + cls + '" data-date="' + k + '">' +
        '<em>' + i + '</em>' +
        (hol ? '<i class="cc-hd">' + hol + '</i>' : (map[k] ? '<i class="cc-dot"></i>' : '')) +
        '</span>'
    }
    grid.innerHTML = html
  }

  function showDayPosts (card, map, dateKey) {
    var box = card.querySelector('.cc-posts')
    if (!box) return

    var list = map[dateKey] || []
    if (!list.length) {
      box.innerHTML = '<div class="cc-none">这一天没有文章</div>'
      return
    }
    box.innerHTML = '<div class="cc-posts-title">' + dateKey + ' · ' + list.length + ' 篇</div>' +
      list.map(function (p) {
        return '<a class="cc-post-link" href="' + esc(p.u) + '" title="' + esc(p.t) + '">' +
          esc(p.t) + '</a>'
      }).join('')
  }

  function bindCal (card, map) {
    var now = new Date()
    var todayKey = key(now.getFullYear(), now.getMonth(), now.getDate())
    var viewY = now.getFullYear()
    var viewM = now.getMonth()

    renderCal(card, map, viewY, viewM, todayKey)
    showDayPosts(card, map, todayKey)

    var head = card.querySelector('.cc-cal-head')
    if (!head) return

    head.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.cc-nav, .cc-today') : null
      if (!btn) return
      var act = btn.getAttribute('data-act')
      if (act === 'prev') {
        viewM -= 1
        if (viewM < 0) { viewM = 11; viewY -= 1 }
      } else if (act === 'next') {
        viewM += 1
        if (viewM > 11) { viewM = 0; viewY += 1 }
      } else {
        viewY = now.getFullYear()
        viewM = now.getMonth()
      }
      renderCal(card, map, viewY, viewM, todayKey)
    })

    var grid = card.querySelector('.cc-grid')
    if (grid) {
      grid.addEventListener('click', function (e) {
        var cell = e.target.closest ? e.target.closest('.cc-cell[data-date]') : null
        if (!cell) return
        Array.prototype.forEach.call(grid.children, function (c) { c.classList.remove('is-active') })
        cell.classList.add('is-active')
        showDayPosts(card, map, cell.getAttribute('data-date'))
      })
    }
  }

  /* ---------------- 入口 ---------------- */

  function init () {
    var card = mount()
    if (!card) return
    if (card.dataset.ccReady === '1') return
    card.dataset.ccReady = '1'

    var map = buildMap()
    bindCal(card, map)

    var now = new Date()
    tickClock(card, now)
    if (timer) clearInterval(timer)
    timer = setInterval(function () { tickClock(card, new Date()) }, 1000)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
  document.addEventListener('pjax:complete', init)
})()
