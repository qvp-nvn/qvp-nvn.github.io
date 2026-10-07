/* ========== 侧栏：GitHub 贡献热力图 ==========
   替换原来那张只会显示空白的「电子钟」卡片（hexo-butterfly-clock-anzhiyu，
   其 CDN 与天气接口均已失效）。
   数据由 scripts/github-heatmap.cjs 在构建时抓取并写进 window.__GH_HEATMAP__
   （文件为 /js/github-heatmap-data.js，需在本脚本之前引入），
   运行时不再请求任何第三方接口。
   数据格式：{ user, total, from, to, cols, days: [[col, row, level, count, date], ...] }
   行：0=周日 … 6=周六；列：0..cols-1 为第几周。
   ============================================ */
(function () {
  'use strict'

  var MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  /* 侧栏窄，月份刻度至少间隔 3 列才画，避免文字互相压住 */
  var MONTH_MIN_GAP = 3

  function esc (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
    })
  }

  /** 月份刻度：绝对定位的百分比 left，避免 1fr 均分时文字溢出 */
  function monthHtml (days, cols) {
    var firstDateOfCol = {}
    for (var i = 0; i < days.length; i++) {
      var d = days[i]
      if (!d[4]) continue
      var cur = firstDateOfCol[d[0]]
      if (!cur || d[4] < cur) firstDateOfCol[d[0]] = d[4]
    }

    var html = ''
    var prevMonth = -1
    var lastAt = -99
    for (var c = 0; c < cols; c++) {
      var iso = firstDateOfCol[c]
      if (!iso) continue
      var m = parseInt(iso.slice(5, 7), 10) - 1
      if (m === prevMonth) continue
      prevMonth = m
      if (c - lastAt < MONTH_MIN_GAP) continue
      var left = (c / cols) * 100
      if (left > 90) continue
      lastAt = c
      html += '<span style="left:' + left.toFixed(2) + '%">' + MONTHS[m] + '</span>'
    }
    return html
  }

  function build (data) {
    var cols = data.cols
    var days = data.days

    // 列/行 -> 格子，便于补齐空缺（一年首尾不完整的周）
    var map = {}
    var maxLevel = 0
    for (var i = 0; i < days.length; i++) {
      var d = days[i]
      map[d[0] + '-' + d[1]] = d
      if (d[2] > maxLevel) maxLevel = d[2]
    }

    /* ---- 月份刻度 ---- */
    var monthCols = monthHtml(days, cols)

    /* ---- 格子 ---- */
    var cells = ''
    for (var cc = 0; cc < cols; cc++) {
      for (var rr = 0; rr < 7; rr++) {
        var day = map[cc + '-' + rr]
        if (!day) {
          cells += '<i class="ghc-cell is-empty"></i>'
          continue
        }
        var tip = day[4] + ' · ' + (day[3] ? day[3] + ' 次贡献' : '无贡献')
        cells += '<i class="ghc-cell lv' + day[2] + '" data-tip="' + esc(tip) + '" title="' + esc(tip) + '"></i>'
      }
    }

    /* ---- 图例 ---- */
    var legend = ''
    for (var lv = 0; lv <= 4; lv++) legend += '<i class="ghc-cell lv' + lv + '"></i>'

    var range = data.from && data.to ? data.from + ' 至 ' + data.to : ''

    var html =
      '<div class="item-headline"><i class="fab fa-github"></i><span>GitHub 贡献</span></div>' +
      '<div class="ghc-body">' +
        '<div class="ghc-stat"><b>' + (data.total || 0) + '</b> 次贡献' +
          (range ? '<em>' + esc(range) + '</em>' : '') +
        '</div>' +
        '<div class="ghc-scroll">' +
          '<div class="ghc-months">' + monthCols + '</div>' +
          '<div class="ghc-grid">' + cells + '</div>' +
        '</div>' +
        '<div class="ghc-foot">' +
          '<span class="ghc-legend">少' + legend + '多</span>' +
          '<a href="https://github.com/' + esc(data.user) + '" target="_blank" rel="noopener">' +
            '@' + esc(data.user) + ' <i class="fas fa-arrow-up-right-from-square"></i>' +
          '</a>' +
        '</div>' +
      '</div>'

    return html
  }

  function mount (data) {
    if (document.getElementById('card-github-heatmap')) return

    var card = document.createElement('div')
    card.id = 'card-github-heatmap'
    card.className = 'card-widget card-github-heatmap'
    card.innerHTML = build(data)

    var aside = document.getElementById('aside-content')
    if (!aside) return

    // 与原电子钟一致：挂在「公告」下面
    var anchor = aside.querySelector('.card-announcement')
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(card, anchor.nextSibling)
      return
    }
    var sticky = aside.querySelector('.sticky_layout')
    if (sticky) {
      sticky.insertBefore(card, sticky.firstChild)
      return
    }
    aside.insertBefore(card, aside.firstChild)
  }

  function run () {
    var data = window.__GH_HEATMAP__
    if (!data || data.failed || !data.days || !data.days.length || !data.cols) {
      // 拿不到数据就不渲染，避免又多一个空白框
      if (window.console) console.warn('[gh-heatmap] 无可用数据，跳过渲染')
      return
    }
    mount(data)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run)
  } else {
    run()
  }
})()
