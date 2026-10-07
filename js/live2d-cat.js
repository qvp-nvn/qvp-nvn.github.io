/* ========== 看板娘：猫娘 cat（Cubism 3） ==========
   模型来源：桌面「49 2d cat（无按键）女」，Cubism 3 (.moc3)。
   旧插件 L2Dwidget 只支持 Cubism 2，换用 OML2D（支持 2/3/4 代）。
   依赖（已在 inject bottom 按顺序引入）：
     1. live2dcubismcore.min.js —— Cubism 3 运行时
     2. oml2d index.min.js      —— 组件库
   模型文件：/live2d/cat/cat.model3.json（贴图已从 8192 压到 2048）
   ==================================================== */
(function () {
  'use strict'

  /* 移动端屏幕窄，避免遮挡正文（与旧配置一致：手机不展示） */
  function tooSmall () {
    return window.innerWidth < 768
  }

  function boot () {
    if (tooSmall()) return
    if (!window.OML2D) {
      // CDN 还没回来（弱网/被拦），稍后重试一次
      setTimeout(function () {
        if (window.OML2D) init()
      }, 2500)
      return
    }
    init()
  }

  function init () {
    try {
      window.OML2D.loadOml2d({
        models: [
          {
            path: '/live2d/cat/cat.model3.json',
            scale: 0.06,
            position: [-20, 60],
            stageStyle: {
              width: 240,
              height: 340
            }
          }
        ],
        parentElement: document.body,
        sayHello: false,
        transitionTime: 1000,
        tips: false
      })
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
})()
