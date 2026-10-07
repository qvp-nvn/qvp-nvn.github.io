/* 站点统计接口（Vercel Serverless Function）
 * ---------------------------------------------------------
 * 为什么自建而不是接第三方云服务：
 *   - 不蒜子 busuanzi 已于 2024 年关停（六个源全 404）
 *   - LeanCloud 官方已发布停服通知，逐步停止服务，所以不能再用它
 *   - countapi / fw6 这类免注册 API 在国内网络实测超时
 * 自建在这台博客自己的 Vercel 上，数据在你自己账号里，不受任何第三方停服影响，
 * 而且和页面同源（/api/stats），不存在 CORS 跨域被拦的问题。
 *
 * 存储：Vercel KV（本质就是 Upstash Redis，Vercel 控制台点两下就能建）
 * 命令格式：POST {KV_REST_API_URL}  body=["GET","pv"]  →  {result: ...}
 *
 * 接口约定
 *   GET  /api/stats        → {pv, uv, today}   读真实数字
 *   POST /api/stats        → {sid}             上报一次访问（sid 用于 UV 按日去重）
 *
 * UV 去重放在后端：以 {sid}:{日期} 为 key 存 3 天自动过期，
 * 同一台设备同一天只算 1 位访客，跨设备也不会重复计。
 */
'use strict'

const KV_URL = process.env.KV_REST_API_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN

function pad (n) { return ('0' + n).slice(-2) }

function day () {
  const d = new Date()
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

async function kv (cmd) {
  const r = await fetch(KV_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + KV_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cmd),
    cache: 'no-store'
  })
  if (!r.ok) throw new Error('KV ' + r.status)
  return r.json()
}

module.exports = async function handler (req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')

  // 还没配 Vercel KV → 明确 404，前端会自动降级成本机统计，页面不会报错
  if (!KV_URL || !KV_TOKEN) {
    res.statusCode = 404
    return res.end(JSON.stringify({ error: 'kv not configured' }))
  }

  try {
    const t = day()

    if (req.method === 'GET') {
      const [pv, uv, today] = await Promise.all([
        kv(['GET', 'pv']),
        kv(['GET', 'uv']),
        kv(['GET', 'today:' + t])
      ])
      res.end(JSON.stringify({
        pv: Number(pv && pv.result) || 0,
        uv: Number(uv && uv.result) || 0,
        today: Number(today && today.result) || 0
      }))
      return
    }

    if (req.method === 'POST') {
      let body = {}
      try { body = req.body ? (typeof req.body === 'string' ? JSON.parse(req.body) : body) : {} } catch (e) {}
      const sid = String(body.sid || '').slice(0, 64)

      // 先做 UV 去重（当天首次访问才算新访客），再自增 PV
      let newUv = false
      if (sid) {
        const key = 'v:' + sid + ':' + t
        const ex = await kv(['EXISTS', key])
        if (!ex) {
          await kv(['SET', key, '1', 'EX', 86400 * 3]) // 3 天后自动清理，不会无限膨胀
          newUv = true
        }
      }

      await kv(['INCRBY', 'pv', 1])
      if (newUv) await kv(['INCRBY', 'uv', 1])
      await kv(['INCRBY', 'today:' + t, 1])

      res.end(JSON.stringify({ ok: true, newUv: newUv }))
      return
    }

    res.statusCode = 405
    res.end(JSON.stringify({ error: 'method not allowed' }))
  } catch (e) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: String(e && e.message || e) }))
  }
}
