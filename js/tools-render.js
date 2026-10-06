/* ========== 开源项目与工具页面渲染 ==========
   读取 tools-data.js 里的 AMOIT_TOOLS 数组，按分类分组渲染卡片
   ====================================== */

(function () {
  'use strict'

  function render () {
    var container = document.getElementById('tools-container')
    if (!container) return
    var data = window.AMOIT_TOOLS || []
    if (!data.length) {
      container.innerHTML = '<p class="tools-empty">暂无数据，请检查 tools-data.js 是否加载</p>'
      return
    }

    var html = ''
    data.forEach(function (group) {
      html += '<section class="tools-section">'
      html += '<h2 class="tools-cat-title">' + escapeHtml(group.cat) + '<span class="tools-cat-count">' + group.items.length + ' 个</span></h2>'
      html += '<div class="tools-grid">'
      group.items.forEach(function (item) {
        html += '<a class="tool-card" href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer">'
        html += '<div class="tool-card-head">'
        html += '<span class="tool-name">' + escapeHtml(item.name) + '</span>'
        if (item.star && item.star !== '—') {
          html += '<span class="tool-star"><i class="fas fa-star"></i> ' + escapeHtml(item.star) + '</span>'
        }
        html += '</div>'
        html += '<p class="tool-desc">' + escapeHtml(item.desc) + '</p>'
        if (item.tags && item.tags.length) {
          html += '<div class="tool-tags">'
          item.tags.forEach(function (t) {
            html += '<span class="tool-tag">' + escapeHtml(t) + '</span>'
          })
          html += '</div>'
        }
        html += '</a>'
      })
      html += '</div>'
      html += '</section>'
    })

    container.innerHTML = html
  }

  function escapeHtml (s) {
    if (s == null) return ''
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  // DOM 就绪后渲染
  if (document.readyState !== 'loading') render()
  else document.addEventListener('DOMContentLoaded', render)
})()
