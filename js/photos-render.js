/* ========== 相册页：瀑布流 + 分组筛选 + 大图查看 ==========
   数据来自构建时生成的 /js/photos-data.js（window.__PHOTOS__），
   图片放在 source/album/images/ 下即可，子目录自动成为一个分组。
   自带轻量 lightbox（左右切换 / ESC 关闭），不依赖 fancybox 的初始化时机，
   因为这些节点是渲染后才插入 DOM 的，主题那次绑定抓不到。
   ==================================================== */
(function () {
  'use strict'

  var app = document.getElementById('photo-app')
  if (!app) return

  var list = (window.__PHOTOS__ && window.__PHOTOS__.length) ? window.__PHOTOS__ : []

  function esc (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
    })
  }

  /* ---------------- 空状态 ---------------- */
  if (!list.length) {
    app.innerHTML =
      '<div class="photo-empty">' +
      '<div class="photo-empty-icon">🖼️</div>' +
      '<p class="photo-empty-title">相册还是空的</p>' +
      '<p class="photo-empty-tip">把图片放进 <code>source/album/images/</code> 即可自动出现在这里，' +
      '想分组就建个子目录，例如 <code>source/album/images/旅行/</code>。<br>' +
      '也可以手写 <code>source/_data/photos.json</code> 给每张图配上标题和日期。</p>' +
      '</div>'
    return
  }

  /* ---------------- 分组 ---------------- */
  var groups = []
  var counted = Object.create(null)
  list.forEach(function (p) {
    var g = p.group || '默认'
    counted[g] = (counted[g] || 0) + 1
    if (groups.indexOf(g) === -1) groups.push(g)
  })
  groups.sort()

  app.innerHTML =
    '<div class="photo-toolbar">' +
    '<button type="button" class="photo-chip is-active" data-group="__all__">全部 <em>' +
    list.length + '</em></button>' +
    groups.map(function (g) {
      return '<button type="button" class="photo-chip" data-group="' + esc(g) + '">' +
        esc(g) + ' <em>' + counted[g] + '</em></button>'
    }).join('') +
    '</div>' +
    '<div class="photo-grid"></div>'

  var grid = app.querySelector('.photo-grid')
  var current = '__all__'

  function visible () {
    return current === '__all__' ? list : list.filter(function (p) {
      return (p.group || '默认') === current
    })
  }

  function render (items) {
    if (!items.length) {
      grid.innerHTML = '<div class="photo-none">这个分组还没有图片</div>'
      return
    }
    grid.innerHTML = items.map(function (p, i) {
      return '<figure class="photo-item" data-index="' + i + '">' +
        '<img src="' + esc(p.src) + '" alt="' + esc(p.title || p.name) + '" loading="lazy" decoding="async">' +
        '<figcaption class="photo-meta">' +
        '<b>' + esc(p.title || p.name) + '</b>' +
        (p.date ? '<i>' + esc(p.date) + '</i>' : '') +
        '</figcaption>' +
        '</figure>'
    }).join('')

    // 图片加载完再让容器做淡入，避免瀑布流高度跳动
    Array.prototype.forEach.call(grid.querySelectorAll('img'), function (img) {
      if (img.complete) { img.parentNode.classList.add('is-ready'); return }
      img.addEventListener('load', function () { img.parentNode.classList.add('is-ready') })
      img.addEventListener('error', function () { img.parentNode.classList.add('is-ready') })
    })
  }

  render(visible())

  /* ---------------- 分组切换 ---------------- */
  app.querySelector('.photo-toolbar').addEventListener('click', function (e) {
    var chip = e.target.closest ? e.target.closest('.photo-chip') : null
    if (!chip) return
    current = chip.getAttribute('data-group')
    Array.prototype.forEach.call(app.querySelectorAll('.photo-chip'), function (c) {
      c.classList.toggle('is-active', c === chip)
    })
    render(visible())
  })

  /* ---------------- 轻量大图查看 ---------------- */
  var lb = null
  var idx = 0
  var shots = []

  function buildLightbox () {
    lb = document.createElement('div')
    lb.className = 'photo-lightbox'
    lb.setAttribute('role', 'dialog')
    lb.innerHTML =
      '<button type="button" class="plb-close" aria-label="关闭">✕</button>' +
      '<button type="button" class="plb-nav plb-prev" aria-label="上一张">‹</button>' +
      '<button type="button" class="plb-nav plb-next" aria-label="下一张">›</button>' +
      '<img class="plb-img" alt="">' +
      '<div class="plb-cap"></div>' +
      '<div class="plb-count"></div>'
    document.body.appendChild(lb)

    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('plb-img')) { close(); return }
      if (e.target.closest('.plb-close')) { close(); return }
      if (e.target.closest('.plb-prev')) { step(-1); return }
      if (e.target.closest('.plb-next')) { step(1); return }
    })

    document.addEventListener('keydown', onKey)
  }

  function onKey (e) {
    if (!lb || !lb.classList.contains('is-open')) return
    if (e.key === 'Escape') close()
    else if (e.key === 'ArrowLeft') step(-1)
    else if (e.key === 'ArrowRight') step(1)
  }

  function show (i) {
    if (!lb) buildLightbox()
    shots = visible()
    if (!shots.length) return
    idx = (i + shots.length) % shots.length
    var p = shots[idx]
    lb.querySelector('.plb-img').src = p.src
    lb.querySelector('.plb-img').alt = p.title || p.name || ''
    lb.querySelector('.plb-cap').textContent = [p.title, p.date, p.group]
      .filter(Boolean).join(' · ')
    lb.querySelector('.plb-count').textContent = (idx + 1) + ' / ' + shots.length
    lb.classList.add('is-open')
    document.body.style.overflow = 'hidden'
  }

  function step (d) { show(idx + d) }

  function close () {
    if (!lb) return
    lb.classList.remove('is-open')
    document.body.style.overflow = ''
  }

  grid.addEventListener('click', function (e) {
    var fig = e.target.closest ? e.target.closest('.photo-item') : null
    if (!fig) return
    show(parseInt(fig.getAttribute('data-index'), 10) || 0)
  })
})()
