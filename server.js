import express from 'express'
import path    from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app  = express()
const PORT = process.env.PORT || 3000

app.use(express.json({ limit: '10mb' }))

// ── PostgreSQL ─────────────────────────────────────────────────────
const DB_URL = process.env.DATABASE_URL
let pool = null

async function getPool() {
  if (pool) return pool
  if (!DB_URL) { console.log('⚠️  No DATABASE_URL — using memory'); return null }
  try {
    const pg = await import('pg')
    const Pool = pg.default?.Pool || pg.Pool
    pool = new Pool({
      connectionString: DB_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    })
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key        TEXT PRIMARY KEY,
        value      JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('✅ PostgreSQL connected')
    return pool
  } catch (e) {
    console.error('❌ DB connect error:', e.message)
    pool = null
    return null
  }
}

const mem = {}

async function dbGet(key) {
  const p = await getPool()
  if (!p) return mem[key] ?? null
  try {
    const r = await p.query('SELECT value FROM kv_store WHERE key=$1', [key])
    return r.rows[0]?.value ?? null
  } catch (e) { console.error('dbGet:', e.message); return mem[key] ?? null }
}

async function dbSet(key, value) {
  const p = await getPool()
  if (!p) { mem[key] = value; return }
  try {
    await p.query(`
      INSERT INTO kv_store(key,value) VALUES($1,$2::jsonb)
      ON CONFLICT(key) DO UPDATE SET value=$2::jsonb, updated_at=NOW()
    `, [key, JSON.stringify(value)])
  } catch (e) {
    console.error('dbSet:', e.message)
    mem[key] = value  // fallback
  }
}

async function dbDelete(key) {
  const p = await getPool()
  if (!p) { delete mem[key]; return }
  try { await p.query('DELETE FROM kv_store WHERE key=$1', [key]) }
  catch (e) { console.error('dbDelete:', e.message) }
}

async function dbClear(prefix) {
  const p = await getPool()
  if (!p) { Object.keys(mem).filter(k=>k.startsWith(prefix)).forEach(k=>delete mem[k]); return }
  try { await p.query("DELETE FROM kv_store WHERE key LIKE $1", [prefix+'%']) }
  catch (e) { console.error('dbClear:', e.message) }
}

// ── API ────────────────────────────────────────────────────────────
app.get('/api/db/ping', async (req, res) => {
  try {
    const p = await getPool()
    res.json({ ok: true, db: p ? 'postgresql' : 'memory' })
  } catch (e) { res.json({ ok: true, db: 'memory' }) }
})

app.get('/api/db/:key', async (req, res) => {
  try { res.json({ value: await dbGet(req.params.key) }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/db/:key', async (req, res) => {
  try {
    if (req.body.value === undefined) return res.status(400).json({ error: 'value required' })
    await dbSet(req.params.key, req.body.value)
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/db/:key', async (req, res) => {
  try { await dbDelete(req.params.key); res.json({ ok: true }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/db', async (req, res) => {
  try { await dbClear('quran_'); res.json({ ok: true }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Static ─────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'dist')))
app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')))

// ── Start ──────────────────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`)
  console.log(`🗄️  DATABASE_URL: ${DB_URL ? 'found ✅' : 'NOT found ⚠️'}`)
})

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`⚠️  Port ${PORT} in use, retrying on ${Number(PORT)+1}...`)
    setTimeout(() => {
      server.close()
      app.listen(Number(PORT)+1, '0.0.0.0', () => {
        console.log(`✅ Server running on port ${Number(PORT)+1}`)
      })
    }, 1000)
  }
})

// تهيئة DB في الخلفية
getPool().catch(e => console.error('Pool init error:', e.message))
