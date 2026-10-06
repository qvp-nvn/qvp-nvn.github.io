/* ========== 开源项目与工具数据 ==========
   按分类组织，每条包含：name 名称、desc 简介、url 链接、tags 标签、star 星数(可选)
   新增项目时按分类追加即可，渲染脚本会自动按分类分组
   ====================================== */

window.AMOIT_TOOLS = [
  // —— 前端开发 ——
  {
    cat: '前端开发',
    items: [
      { name: 'Vue', desc: '渐进式 JavaScript 框架，上手快、生态完整、文档友好。', url: 'https://github.com/vuejs/vue', tags: ['框架', 'MVVM', 'SPA'], star: '207k' },
      { name: 'React', desc: 'Meta 出品的声明式 UI 库，组件化与 Hooks 是核心。', url: 'https://github.com/facebook/react', tags: ['框架', 'JSX', 'Hooks'], star: '226k' },
      { name: 'Vite', desc: '下一代前端构建工具，开发服务器启动极快、HMR 几乎瞬时。', url: 'https://github.com/vitejs/vite', tags: ['构建工具', 'ESM'], star: '67k' },
      { name: 'Tailwind CSS', desc: '原子化 CSS 框架，不用起类名、设计系统统一。', url: 'https://github.com/tailwindlabs/tailwindcss', tags: ['CSS', '原子化'], star: '80k' },
      { name: 'UnoCSS', desc: '即时按需原子化 CSS 引擎，比 Tailwind 更快更轻。', url: 'https://github.com/unocss/unocss', tags: ['CSS', '引擎'], star: '16k' },
      { name: 'Element Plus', desc: 'Vue 3 组件库，后台管理系统首选之一。', url: 'https://github.com/element-plus/element-plus', tags: ['组件库', 'Vue3'], star: '24k' },
      { name: 'Naive UI', desc: 'Vue 3 组件库，TypeScript 友好、主题定制灵活。', url: 'https://github.com/tusen-ai/naive-ui', tags: ['组件库', 'Vue3', 'TS'], star: '16k' },
      { name: 'shadcn/ui', desc: '基于 Radix 与 Tailwind 的可复制组件集合，现代设计。', url: 'https://github.com/shadcn-ui/ui', tags: ['组件库', 'React'], star: '67k' }
    ]
  },

  // —— 构建与工程化 ——
  {
    cat: '构建与工程化',
    items: [
      { name: 'webpack', desc: '老牌模块打包工具，生态最成熟，配置最灵活。', url: 'https://github.com/webpack/webpack', tags: ['打包', '构建'], star: '64k' },
      { name: 'Turbo', desc: 'Vercel 出品的增量构建系统与 monorepo 工具。', url: 'https://github.com/vercel/turbo', tags: ['monorepo', '增量构建'], star: '26k' },
      { name: 'pnpm', desc: '快速、节省磁盘空间的包管理器，monorepo 友好。', url: 'https://github.com/pnpm/pnpm', tags: ['包管理', 'monorepo'], star: '29k' },
      { name: 'ESLint', desc: 'JavaScript 代码检查工具，规范团队代码风格。', url: 'https://github.com/eslint/eslint', tags: ['Lint', '代码规范'], star: '25k' },
      { name: 'Prettier', desc: '代码格式化工具，无需配置即可统一风格。', url: 'https://github.com/prettier/prettier', tags: ['格式化'], star: '49k' }
    ]
  },

  // —— Hexo 博客生态 ——
  {
    cat: 'Hexo 博客生态',
    items: [
      { name: 'Hexo', desc: '快速、简洁、强大的静态博客框架。', url: 'https://github.com/hexojs/hexo', tags: ['博客', 'SSG'], star: '39k' },
      { name: 'Butterfly', desc: 'Hexo 主题中配置最细致的一个，本站用的就是它。', url: 'https://github.com/jerryc127/hexo-theme-butterfly', tags: ['主题', 'Hexo'], star: '7k' },
      { name: 'hexo-helper-live2d', desc: '给博客加一个 Live2D 看板娘。', url: 'https://github.com/EYHN/hexo-helper-live2d', tags: ['插件', '看板娘'], star: '2k' },
      { name: 'hexo-abbrlink', desc: '为文章生成永久短链接，避免 URL 随标题变化。', url: 'https://github.com/rozbo/hexo-abbrlink', tags: ['插件', 'SEO'], star: '1k' }
    ]
  },

  // —— 效率工具 ——
  {
    cat: '效率工具',
    items: [
      { name: 'PicGo', desc: '图片上传工具，支持 GitHub/七牛/阿里云等多种图床。', url: 'https://github.com/Molunerfinn/PicGo', tags: ['图床', '图片'], star: '23k' },
      { name: 'Snipaste', desc: '截图 + 贴图神器，把截图钉在桌面上对照参考。', url: 'https://www.snipaste.com/', tags: ['截图'], star: '—' },
      { name: 'uTools', desc: '生产力工具集，超级启动器 + 插件生态丰富。', url: 'https://u.tools/', tags: ['启动器', '插件'], star: '—' },
      { name: 'Raycast', desc: 'Mac 上的启动器，可替代 Spotlight，插件生态好。', url: 'https://raycast.com/', tags: ['启动器', 'Mac'], star: '—' },
      { name: 'Obsidian', desc: '基于本地 Markdown 的知识管理工具，双链笔记。', url: 'https://obsidian.md/', tags: ['笔记', '知识管理'], star: '—' }
    ]
  },

  // —— 设计资源 ——
  {
    cat: '设计资源',
    items: [
      { name: 'Iconify', desc: '聚合 200+ 图标集的统一图标框架，按需引入。', url: 'https://iconify.design/', tags: ['图标'], star: '—' },
      { name: 'unDraw', desc: '免费扁平插画库，可在线改主色后下载 SVG。', url: 'https://undraw.co/', tags: ['插画', 'SVG'], star: '—' },
      { name: 'Coolors', desc: '配色方案生成器，一键锁定好看的搭配。', url: 'https://coolors.co/', tags: ['配色'], star: '—' },
      { name: 'Squoosh', desc: 'Google 出品的在线图片压缩工具，可实时对比。', url: 'https://squoosh.app/', tags: ['压缩', '图片'], star: '—' }
    ]
  },

  // —— AI 与数据 ——
  {
    cat: 'AI 与数据',
    items: [
      { name: 'Ollama', desc: '本地运行大模型，一行命令拉起 Llama 3 / Qwen 等。', url: 'https://github.com/ollama/ollama', tags: ['LLM', '本地'], star: '95k' },
      { name: 'Open WebUI', desc: 'Ollama 的 Web 界面，类 ChatGPT 体验。', url: 'https://github.com/open-webui/open-webui', tags: ['LLM', 'WebUI'], star: '40k' },
      { name: 'Lobe Chat', desc: '现代化的开源 AI 聊天框架，插件生态丰富。', url: 'https://github.com/lobehub/lobe-chat', tags: ['LLM', '聊天'], star: '40k' },
      { name: 'TanStack Query', desc: '前端数据请求库，缓存、重试、竞态全包了。', url: 'https://github.com/TanStack/query', tags: ['请求', '缓存'], star: '42k' }
    ]
  },

  // —— 命令行神器 ——
  {
    cat: '命令行神器',
    items: [
      { name: 'zsh + oh-my-zsh', desc: 'Shell 增强框架，主题与插件丰富。', url: 'https://github.com/ohmyzsh/ohmyzsh', tags: ['Shell'], star: '172k' },
      { name: 'starship', desc: '跨 Shell 的提示符工具，速度快、配置简单。', url: 'https://github.com/starship/starship', tags: ['Shell', '提示符'], star: '43k' },
      { name: 'fzf', desc: '命令行模糊查找器，搭配 Ctrl+R 搜历史命令神器。', url: 'https://github.com/junegunn/fzf', tags: ['模糊查找'], star: '63k' },
      { name: 'ripgrep', desc: '比 grep 快得多的文本搜索工具。', url: 'https://github.com/BurntSushi/ripgrep', tags: ['搜索'], star: '47k' },
      { name: 'bat', desc: '带语法高亮的 cat 替代品。', url: 'https://github.com/sharkdp/bat', tags: ['cat'], star: '48k' },
      { name: 'eza', desc: 'exa 的继任者，比 ls 更好看的文件列表工具。', url: 'https://github.com/eza-community/eza', tags: ['ls'], star: '12k' }
    ]
  }
]
