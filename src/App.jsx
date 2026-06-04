import { useState, useEffect, useCallback, useRef } from 'react'
import React from 'react'
import LoginScreen   from './screens/LoginScreen.jsx'
import StudentScreen from './screens/StudentScreen.jsx'
import TeacherScreen from './screens/TeacherScreen.jsx'
import AdminScreen   from './screens/AdminScreen.jsx'
import Toast         from './components/Toast.jsx'
import {
  USERS, INITIAL_PLANS, SYSTEM_SETTINGS, ASSIGNMENTS,
  REWARD_RULES, INITIAL_POINTS_CYCLES, INITIAL_PAGES_PERIODS
} from './data.js'
import { storage } from './storage.js'

// ── قيم فارغة آمنة كنقطة بداية (لا بيانات افتراضية) ──────────────────
const EMPTY = {
  users:        [],
  plans:        [],
  assignments:  {},
  rewardRules:  REWARD_RULES,    // قواعد المكافآت ثابتة
  pointsCycles: INITIAL_POINTS_CYCLES,
  pagesPeriods: INITIAL_PAGES_PERIODS,
  sysSettings:  SYSTEM_SETTINGS,
}

// ── قيم افتراضية تُستخدم فقط إذا كانت قاعدة البيانات فارغة تماماً ──────
// (مثل أول مرة للاستخدام بدون استيراد)
const DEFAULTS = {
  users:        USERS,
  plans:        INITIAL_PLANS,
  assignments:  ASSIGNMENTS,
  rewardRules:  REWARD_RULES,
  pointsCycles: INITIAL_POINTS_CYCLES,
  pagesPeriods: INITIAL_PAGES_PERIODS,
  sysSettings:  SYSTEM_SETTINGS,
}

export default function App() {
  const [ready,        setReady]        = useState(false)
  const [users,        setUsers]        = useState([])        // فارغ — يُحمَّل من DB
  const [plans,        setPlans]        = useState([])
  const [assignments,  setAssignments]  = useState({})
  const [rewardRules,  setRewardRules]  = useState(REWARD_RULES)
  const [pointsCycles, setPointsCycles] = useState(INITIAL_POINTS_CYCLES)
  const [pagesPeriods, setPagesPeriods] = useState(INITIAL_PAGES_PERIODS)
  const [sysSettings,  setSysSettings]  = useState(SYSTEM_SETTINGS)
  const [currentUser,  setCurrentUser]  = useState(null)
  const [toast,        setToast]        = useState({ msg:'', type:'' })
  const [darkMode,     setDarkMode]     = useState(true)

  // ref يتتبع ما إذا كانت البيانات قد تغيّرت بعد التحميل (لتجنب الكتابة المبكرة)
  const loadedRef = useRef(false)

  // ── تطبيق الثيم ──────────────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.style.setProperty('--bg',    '#0d1117')
      root.style.setProperty('--bg2',   '#131924')
      root.style.setProperty('--card',  '#17202e')
      root.style.setProperty('--card2', '#1d2840')
      root.style.setProperty('--card3', '#222f47')
      root.style.setProperty('--text',  '#dde3f0')
      root.style.setProperty('--text2', '#7c8ba4')
      root.style.setProperty('--text3', '#3e4d68')
      root.style.setProperty('--border','rgba(255,255,255,0.06)')
      root.style.setProperty('--border2','rgba(255,255,255,0.11)')
    } else {
      root.style.setProperty('--bg',    '#f5f7fa')
      root.style.setProperty('--bg2',   '#ffffff')
      root.style.setProperty('--card',  '#ffffff')
      root.style.setProperty('--card2', '#f0f4f8')
      root.style.setProperty('--card3', '#e4eaf2')
      root.style.setProperty('--text',  '#1a2235')
      root.style.setProperty('--text2', '#4a5568')
      root.style.setProperty('--text3', '#a0aec0')
      root.style.setProperty('--border','rgba(0,0,0,0.08)')
      root.style.setProperty('--border2','rgba(0,0,0,0.14)')
    }
  }, [darkMode])

  // ── تحميل من قاعدة البيانات عند أول تشغيل ──────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [u, pl, as, rr, pc, pp, ss, sess] = await Promise.all([
          storage.get('users',        null),   // null = غير موجود في DB
          storage.get('plans',        null),
          storage.get('assignments',  null),
          storage.get('rewardRules',  REWARD_RULES),
          storage.get('pointsCycles', INITIAL_POINTS_CYCLES),
          storage.get('pagesPeriods', INITIAL_PAGES_PERIODS),
          storage.get('sysSettings',  SYSTEM_SETTINGS),
          storage.get('session',      null),
        ])

        // إذا لم توجد بيانات في DB (null) → استخدم الافتراضية
        // إذا وُجدت → استخدمها كما هي
        const finalUsers       = Array.isArray(u)  && u.length>0  ? u  : DEFAULTS.users
        const finalPlans       = Array.isArray(pl) && pl.length>0 ? pl : DEFAULTS.plans
        const finalAssignments = (as && typeof as==='object' && !Array.isArray(as) && Object.keys(as).length>0)
                                 ? as : DEFAULTS.assignments
        const finalRR  = Array.isArray(rr) && rr.length>0 ? rr : DEFAULTS.rewardRules
        const finalPC  = Array.isArray(pc) && pc.length>0 ? pc : DEFAULTS.pointsCycles
        const finalPP  = Array.isArray(pp) && pp.length>0 ? pp : DEFAULTS.pagesPeriods
        const finalSS  = (ss && typeof ss==='object') ? ss : DEFAULTS.sysSettings

        // تعيين الحالة دفعة واحدة
        setUsers(finalUsers)
        setPlans(finalPlans)
        setAssignments(finalAssignments)
        setRewardRules(finalRR)
        setPointsCycles(finalPC)
        setPagesPeriods(finalPP)
        setSysSettings(finalSS)

        // استعادة الجلسة
        if (sess?.id) {
          const found = finalUsers.find(x => x.id === sess.id)
          if (found && !found.suspended) setCurrentUser(found)
        }

        // الآن فقط نُفعِّل الحفظ التلقائي
        loadedRef.current = true
        setReady(true)

      } catch (e) {
        console.error('Load error:', e)
        // في حالة خطأ كارثي: ابدأ بقيم فارغة ولا تكتب شيئاً
        loadedRef.current = true
        setReady(true)
      }
    }
    load()
  }, [])

  // ── حفظ تلقائي — فقط بعد التحميل وعند تغيير حقيقي ──────────────────
  // نستخدم useRef لتخطي أول render بعد التحميل
  const useSave = (key, value) => {
    const isFirst = useRef(true)
    useEffect(() => {
      if (!ready || !loadedRef.current) return
      if (isFirst.current) { isFirst.current = false; return }  // تخطي أول قيمة بعد التحميل
      storage.set(key, value)
    }, [value, ready])
  }

  useSave('users',        users)
  useSave('plans',        plans)
  useSave('assignments',  assignments)
  useSave('rewardRules',  rewardRules)
  useSave('pointsCycles', pointsCycles)
  useSave('pagesPeriods', pagesPeriods)
  useSave('sysSettings',  sysSettings)

  useEffect(() => {
    if (!ready || !loadedRef.current) return
    if (currentUser) storage.set('session', { id: currentUser.id })
    else             storage.remove('session')
  }, [currentUser, ready])

  // ── دوال ──────────────────────────────────────────────────────────
  function showToast(msg, type='') { setToast({ msg, type }) }

  function handleLogin(user) {
    setCurrentUser(users.find(u => u.id === user.id) || user)
  }

  function handleLogout() { setCurrentUser(null) }

  function updateCurrentUser(changes) {
    setUsers(prev => prev.map(u => u.id === currentUser.id ? {...u,...changes} : u))
    setCurrentUser(prev => ({...prev,...changes}))
  }

  const updateUsers       = useCallback(upd => setUsers(p       => typeof upd==='function'?upd(p):upd), [])
  const updatePlans       = useCallback(upd => setPlans(p       => typeof upd==='function'?upd(p):upd), [])
  const updateAssignments = useCallback(upd => setAssignments(p => typeof upd==='function'?upd(p):upd), [])

  function resetToDefaults() {
    storage.clearAll()
    // إعادة الضبط للقيم الافتراضية
    setUsers(DEFAULTS.users)
    setPlans(DEFAULTS.plans)
    setAssignments(DEFAULTS.assignments)
    setRewardRules(DEFAULTS.rewardRules)
    setPointsCycles(DEFAULTS.pointsCycles)
    setPagesPeriods(DEFAULTS.pagesPeriods)
    setSysSettings(DEFAULTS.sysSettings)
    setCurrentUser(null)
    // إعادة تفعيل الحفظ بعد إعادة الضبط
    loadedRef.current = false
    setTimeout(() => { loadedRef.current = true }, 100)
  }

  // ── شاشة التحميل ──────────────────────────────────────────────────
  if (!ready) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg)', gap:'1rem' }}>
      <div style={{ width:64, height:64, borderRadius:20, background:'linear-gradient(135deg,var(--green),var(--green2))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', animation:'pulse 1.5s ease-in-out infinite' }}>📖</div>
      <div style={{ color:'var(--text2)', fontSize:'.9rem' }}>جاري تحميل البيانات...</div>
      <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}`}</style>
    </div>
  )

  const commonProps = {
    currentUser, allUsers:users, plans, assignments, rewardRules, sysSettings,
    pointsCycles, pagesPeriods,
    onLogout:handleLogout, onUpdateUser:updateCurrentUser,
    onUpdateUsers:updateUsers, onUpdatePlans:updatePlans,
    onUpdateAssignments:updateAssignments,
    onUpdateSysSettings:setSysSettings, onUpdateRewardRules:setRewardRules,
    onUpdatePointsCycles:setPointsCycles, onUpdatePagesPeriods:setPagesPeriods,
    onResetToDefaults:resetToDefaults, showToast,
    darkMode, onToggleDark: () => setDarkMode(v=>!v),
  }

  return (
    <>
      <Toast msg={toast.msg} type={toast.type} onDone={() => setToast({ msg:'', type:'' })}/>
      {!currentUser                    && <LoginScreen   allUsers={users} onLogin={handleLogin}/>}
      {currentUser?.role === 'student' && <StudentScreen {...commonProps}/>}
      {currentUser?.role === 'teacher' && <TeacherScreen {...commonProps}/>}
      {currentUser?.role === 'admin'   && <AdminScreen   {...commonProps}/>}
    </>
  )
}

// ── Error Boundary ─────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  componentDidCatch(e, info) { console.error('App crash:', e, info) }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ padding:'2rem', background:'#0d1117', minHeight:'100vh', fontFamily:'monospace', direction:'ltr' }}>
        <h2 style={{ color:'#ef4444' }}>❌ Runtime Error</h2>
        <pre style={{ whiteSpace:'pre-wrap', fontSize:'.78rem', color:'#fca5a5', background:'#161b22', padding:'1rem', borderRadius:8, marginTop:'1rem' }}>
          {this.state.error?.message}{'\n\n'}{this.state.error?.stack}
        </pre>
        <button onClick={() => { this.setState({error:null}); window.location.reload() }}
          style={{ marginTop:'1rem', padding:'.5rem 1.5rem', background:'#22c55e', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:'1rem' }}>
          إعادة تحميل
        </button>
      </div>
    )
  }
}
export { ErrorBoundary }
