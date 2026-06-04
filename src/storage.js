/**
 * storage.js — تخزين موحد
 * يحفظ في localStorage دائماً (فوري)
 * ويحفظ في Replit DB عبر API بشكل async في الخلفية
 */

const PREFIX = 'quran_'

// ── localStorage (فوري، يعمل دائماً) ───────────────────────────────
function localGet(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function localSet(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)) }
  catch (e) { console.warn('localStorage write failed:', e) }
}

function localRemove(key) {
  localStorage.removeItem(PREFIX + key)
}

function localClearAll() {
  Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .forEach(k => localStorage.removeItem(k))
}

// ── Replit DB عبر API (في الخلفية، لا يُعيق التطبيق) ──────────────
function apiSet(key, value) {
  fetch(`/api/db/${encodeURIComponent(PREFIX + key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  }).catch(e => console.warn('API set failed (background):', e.message))
}

function apiRemove(key) {
  fetch(`/api/db/${encodeURIComponent(PREFIX + key)}`, { method: 'DELETE' })
    .catch(e => console.warn('API delete failed:', e.message))
}

function apiClearAll() {
  fetch('/api/db', { method: 'DELETE' })
    .catch(e => console.warn('API clearAll failed:', e.message))
}

// ── تحميل من Replit DB عند بدء التطبيق ────────────────────────────
async function apiGet(key, fallback) {
  try {
    const res = await fetch(`/api/db/${encodeURIComponent(PREFIX + key)}`)
    if (!res.ok) return fallback
    const data = await res.json()
    const val = data.value
    // إذا وُجدت القيمة في DB احفظها في localStorage للاستخدام المحلي
    if (val !== null && val !== undefined) {
      localSet(key, val)
      return val
    }
    return fallback
  } catch {
    return fallback
  }
}

// ── الواجهة الموحدة ─────────────────────────────────────────────────
export const storage = {
  // get: يقرأ من Replit DB (async) عند التحميل الأول
  get: (key, fallback) => apiGet(key, fallback),

  // set: يحفظ في localStorage فوراً + يحفظ في Replit DB في الخلفية
  set(key, value) {
    localSet(key, value)   // فوري — لا يُعيق أي شيء
    apiSet(key, value)     // في الخلفية
  },

  remove(key) {
    localRemove(key)
    apiRemove(key)
  },

  clearAll() {
    localClearAll()
    apiClearAll()
  },
}
