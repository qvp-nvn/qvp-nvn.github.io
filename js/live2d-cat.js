/* ========== 看板娘：猫娘 cat（Cubism 3 / .moc3）==========
   模型来源：桌面「49 2d cat（无按键）女」
   渲染：oh-my-live2d 0.19.3（自带 PIXI 6 + pixi-live2d-display + Cubism4 核心）
   —— 不需要再单独引入 live2dcubismcore / pixi，oml2d.min.js 已全量打包
   模型文件：/live2d/cat/cat.model3.json
   ========================================================= */
(function () {
  'use strict'

  var MODEL = '/live2d/cat/cat.model3.json'

  function log (msg, extra) {
    if (!window.console) return
    console.warn('[live2d-cat] ' + msg, extra === undefined ? '' : extra)
  }

  function cleanup () {
    var s = document.getElementById('oml2d-stage')
    if (s && s.parentNode) s.parentNode.removeChild(s)
    var b = document.querySelector('.oml2d-status-bar, #oml2d-status-bar')
    if (b && b.parentNode) b.parentNode.removeChild(b)
    var m = document.querySelector('.oml2d-menus, #oml2d-menus')
    if (m && m.parentNode) m.parentNode.removeChild(m)
  }

  function init () {
    var oml2d
    try {
      oml2d = window.OML2D.loadOml2d({
        dockedPosition: 'left',
        mobileDisplay: false,
        sayHello: false,
        transitionTime: 800,
        primaryColor: '#8b7cf6',
        parentElement: document.body,
        models: [
          {
            name: 'cat',
            path: MODEL,
            scale: 0.075,
            position: [0, 0]
          }
        ]
      })
    } catch (e) {
      log('loadOml2d 抛错', e && e.message)
      cleanup()
      return
    }

    /* 兜底：15s 后画布仍没渲染出来就撤掉，避免一直挂着「加载中」 */
    setTimeout(function () {
      try {
        var cv = document.querySelector('#oml2d-stage canvas, .oml2d-stage canvas')
        if (!cv || !cv.width) {
          log('15s 内未渲染出画布，已移除组件')
          cleanup()
        }
      } catch (e) {}
    }, 15000)

    window.__oml2d = oml2d
  }

  function boot () {
    if (window.innerWidth < 768) {
      log('移动端，按配置不展示')
      return
    }
    /* pjax 切页时脚本可能被再次执行，已有舞台就直接复用，避免出现两个看板娘 */
    if (window.__oml2d || document.getElementById('oml2d-stage')) {
      log('舞台已存在，跳过重复初始化')
      return
    }
    if (!window.OML2D || typeof window.OML2D.loadOml2d !== 'function') {
      log('OML2D 未就绪，2.5s 后重试')
      setTimeout(function () {
        if (window.OML2D && typeof window.OML2D.loadOml2d === 'function') init()
        else log('OML2D 始终不可用，放弃加载')
      }, 2500)
      return
    }
    init()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
})()
