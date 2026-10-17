/* 食谱页渲染：分类筛选 + 搜索 + 卡片网格 + 详情弹层
   数据来自构建时生成的 window.__RECIPES__（scripts/recipes.cjs 读取 source/_data/recipes.json） */
(function () {
  'use strict'

  var box = document.getElementById('recipe-app')
  if (!box) return

  var list = Array.isArray(window.__RECIPES__) ? window.__RECIPES__ : []
  var keyword = ''
  var active = '全部'

  function esc (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }

  function cats () {
    var out = ['全部']
    list.forEach(function (r) {
      if (out.indexOf(r.category) < 0) out.push(r.category)
    })
    return out
  }

  function filtered () {
    return list.filter(function (r) {
      if (active !== '全部' && r.category !== active) return false
      if (!keyword) return true
      var hay = [r.name, r.desc, r.category].concat(r.tags || [])
        .concat((r.ingredients || []).map(function (x) { return x.n }))
        .join(' ')
        .toLowerCase()
      return hay.indexOf(keyword) >= 0
    })
  }

  /* ---------------- 顶部工具条 ---------------- */
  function toolbar () {
    var html = '<div class="recipe-toolbar">'
    html += '<div class="recipe-search"><i class="fas fa-search"></i>'
    html += '<input id="recipe-search-input" type="text" placeholder="搜菜名 / 食材 / 标签…" value="' + esc(keyword) + '">'
    html += '</div>'
    html += '<div class="recipe-tabs">'
    cats().forEach(function (c) {
      html += '<button class="recipe-tab' + (c === active ? ' on' : '') + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>'
    })
    html += '</div></div>'
    return html
  }

  /* ---------------- 卡片 ---------------- */
  function cover (r) {
    if (r.cover) {
      return '<div class="recipe-cover"><img src="' + esc(r.cover) + '" alt="' + esc(r.name) + '" loading="lazy"></div>'
    }
    return '<div class="recipe-cover recipe-cover-emoji"><span>' + esc(r.emoji || '🍽️') + '</span></div>'
  }

  function card (r) {
    var meta = []
    if (r.time) meta.push('<span><i class="far fa-clock"></i>' + esc(r.time) + '</span>')
    if (r.difficulty) meta.push('<span><i class="fas fa-signal"></i>' + esc(r.difficulty) + '</span>')
    if (r.servings) meta.push('<span><i class="fas fa-user-friends"></i>' + esc(r.servings) + '</span>')

    var tags = (r.tags || []).map(function (t) { return '<em>' + esc(t) + '</em>' }).join('')

    return '<article class="recipe-card" data-id="' + r.id + '" role="button" tabindex="0" aria-label="查看' + esc(r.name) + '的做法">' +
      cover(r) +
      '<div class="recipe-body">' +
      '<h3 class="recipe-name">' + esc(r.name) + '</h3>' +
      '<div class="recipe-meta">' + meta.join('') + '</div>' +
      '<p class="recipe-desc">' + esc(r.desc) + '</p>' +
      '<div class="recipe-tags">' + tags + '</div>' +
      '</div></article>'
  }

  /* ---------------- 详情弹层 ---------------- */
  function detail (r) {
    var ings = (r.ingredients || []).map(function (x) {
      return '<li><span class="ing-name">' + esc(x.n) + '</span><span class="ing-amt">' + esc(x.a) + '</span></li>'
    }).join('')

    var steps = (r.steps || []).map(function (s, i) {
      return '<li><span class="step-no">' + (i + 1) + '</span><div class="step-txt">' + esc(s) + '</div></li>'
    }).join('')

    return '<div class="recipe-modal-mask" id="recipe-mask">' +
      '<div class="recipe-modal" role="dialog" aria-modal="true">' +
      '<button class="recipe-modal-close" id="recipe-close" aria-label="关闭"><i class="fas fa-times"></i></button>' +
      '<header class="recipe-modal-head">' +
      '<span class="recipe-modal-emoji">' + esc(r.emoji || '🍽️') + '</span>' +
      '<div><h2>' + esc(r.name) + '</h2>' +
      '<div class="recipe-modal-meta">' + esc(r.category) + ' · ' + esc(r.time) + ' · ' + esc(r.difficulty) + '</div></div>' +
      '</header>' +
      '<p class="recipe-modal-desc">' + esc(r.desc) + '</p>' +
      '<section><h4><i class="fas fa-shopping-basket"></i>食材</h4><ul class="ing-list">' + ings + '</ul></section>' +
      '<section><h4><i class="fas fa-list-ol"></i>步骤</h4><ol class="step-list">' + steps + '</ol></section>' +
      (r.tips ? '<section><h4><i class="fas fa-lightbulb"></i>小贴士</h4><p class="recipe-tips">' + esc(r.tips) + '</p></section>' : '') +
      '</div></div>'
  }

  function openDetail (r) {
    var wrap = document.createElement('div')
    wrap.id = 'recipe-detail'
    wrap.innerHTML = detail(r)
    document.body.appendChild(wrap)
    document.body.style.overflow = 'hidden'
    var mask = wrap.querySelector('#recipe-mask')
    var close = wrap.querySelector('#recipe-close')
    function shut () {
      wrap.remove()
      document.body.style.overflow = ''
    }
    mask.addEventListener('click', function (e) { if (e.target === mask) shut() })
    close.addEventListener('click', shut)
    document.addEventListener('keydown', function onEsc (e) {
      if (e.key === 'Escape') {
        shut()
        document.removeEventListener('keydown', onEsc)
      }
    })
  }

  /* ---------------- 渲染 ---------------- */
  function render () {
    var rows = filtered()
    var html = toolbar()
    if (!rows.length) {
      html += '<div class="recipe-empty"><i class="fas fa-utensils"></i><p>没有找到相关食谱</p><span>换个关键词，或者去别的分类逛逛</span></div>'
    } else {
      html += '<div class="recipe-grid">' + rows.map(card).join('') + '</div>'
    }
    html += '<p class="recipe-tip">共 ' + rows.length + ' 道 · 想添菜谱？编辑 <code>source/_data/recipes.json</code> 即可</p>'
    box.innerHTML = html

    var input = document.getElementById('recipe-search-input')
    input.addEventListener('input', function () {
      keyword = this.value.trim().toLowerCase()
      render()
      var again = document.getElementById('recipe-search-input')
      again.focus()
      again.setSelectionRange(again.value.length, again.value.length)
    })

    box.querySelectorAll('.recipe-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        active = this.getAttribute('data-cat')
        render()
      })
    })

    box.querySelectorAll('.recipe-card').forEach(function (c) {
      var r = null
      var id = Number(c.getAttribute('data-id'))
      list.forEach(function (x) { if (x.id === id) r = x })
      function go () { if (r) openDetail(r) }
      c.addEventListener('click', go)
      c.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() }
      })
    })
  }

  if (!list.length) {
    box.innerHTML = '<div class="recipe-empty"><i class="fas fa-utensils"></i><p>还没有收录食谱</p><span>在 source/_data/recipes.json 里添加第一条菜谱吧</span></div>'
  } else {
    render()
  }
})()
