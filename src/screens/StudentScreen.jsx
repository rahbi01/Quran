import { useState, useMemo } from 'react'
import Btn from '../components/Btn.jsx'
import Modal from '../components/Modal.jsx'
import { TASKS_HAFIZ, DAYS_AR, DAYS_SHORT } from '../data.js'
import ProfileModal from '../components/ProfileModal.jsx'

// ── منطق التواريخ والأذونات ──────────────────────────────────────────
function getAllowedDays(deadlineHour) {
  const now = new Date()
  const todayIdx = now.getDay()
  const hour = now.getHours()
  const yesterdayIdx = todayIdx === 0 ? 6 : todayIdx - 1
  const canAddYesterday = hour < deadlineHour
  return { todayIdx, yesterdayIdx, canAddYesterday }
}

function isDayAllowed(dayIdx, todayIdx, yesterdayIdx, canAddYesterday) {
  if (dayIdx === todayIdx) return true
  if (dayIdx === yesterdayIdx && canAddYesterday) return true
  return false
}

// ── مساعدات العرض ────────────────────────────────────────────────────
function typeMeta(plan) {
  if (plan.type === 'حفظ')
    return { label:'📖 حفظ', bg:'var(--gs)', color:'var(--green)' }
  if (plan.type === 'سرد' && plan.sardSubtype === 'full')
    return { label:'🎙️ سرد كامل', bg:'var(--bs)', color:'var(--blue)' }
  if (plan.type === 'سرد' && plan.sardSubtype === 'review')
    return { label:'🔁 سرد مراجعة (مقاطع)', bg:'var(--golds)', color:'var(--gold)' }
  if (plan.type === 'تقييم مرحلة')
    return { label:'⭐ تقييم مرحلة', bg:'var(--golds)', color:'var(--gold)' }
  return { label:plan.type, bg:'var(--card3)', color:'var(--text2)' }
}

function PlanContent({ plan }) {
  if (plan.type === 'حفظ') return (
    <div style={{ display:'flex', flexDirection:'column', gap:'.22rem' }}>
      {[['الجديد',plan.newMem],['القريب',plan.recentMem],['القديم',plan.oldMem]].map(([l,v]) => v ? (
        <div key={l} style={{ display:'flex', gap:'.5rem', fontSize:'.8rem' }}>
          <span style={{ color:'var(--text3)', minWidth:46, flexShrink:0, fontSize:'.72rem' }}>{l}</span>
          <span style={{ fontWeight:600, color:'var(--text)' }}>{v}</span>
        </div>
      ) : null)}
    </div>
  )
  if (plan.type === 'سرد') return (
    <div style={{ display:'flex', gap:'.5rem', fontSize:'.8rem' }}>
      <span style={{ color:'var(--text3)', minWidth:46, fontSize:'.72rem' }}>المقرر</span>
      <span style={{ fontWeight:600 }}>{plan.sardText}</span>
    </div>
  )
  if (plan.type === 'تقييم مرحلة') return (
    <div style={{ display:'flex', gap:'.5rem', fontSize:'.8rem' }}>
      <span style={{ color:'var(--text3)', minWidth:46, fontSize:'.72rem' }}>المرحلة</span>
      <span style={{ fontWeight:600 }}>{plan.phaseDesc}</span>
    </div>
  )
  return null
}

function ReportedDays({ dailyReports }) {
  const reported = Object.keys(dailyReports || {}).map(Number)
  if (reported.length === 0) return (
    <span style={{ fontSize:'.68rem', color:'var(--text3)', fontStyle:'italic' }}>لم يُرسل أي تقرير بعد</span>
  )
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:'.3rem' }}>
      {reported.sort((a,b)=>a-b).map(d => (
        <span key={d} style={{ fontSize:'.66rem', padding:'.18rem .55rem', borderRadius:8, background:'rgba(34,197,94,.15)', color:'var(--green)', fontWeight:700 }}>
          ✓ {DAYS_SHORT[d]}
        </span>
      ))}
    </div>
  )
}

function ClickableReportedDays({ dailyReports, onDayClick }) {
  const reported = Object.keys(dailyReports || {}).map(Number)
  if (reported.length === 0) return (
    <span style={{ fontSize:'.68rem', color:'var(--text3)', fontStyle:'italic' }}>لم يُرسل أي تقرير بعد</span>
  )
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:'.3rem' }}>
      {reported.sort((a,b)=>a-b).map(d => (
        <span key={d} onClick={() => onDayClick(d)} style={{
          fontSize:'.66rem', padding:'.18rem .55rem', borderRadius:8,
          background:'rgba(34,197,94,.15)', color:'var(--green)', fontWeight:700,
          cursor:'pointer', transition:'.15s',
          border:'1px solid rgba(34,197,94,.25)',
        }}>
          ✓ {DAYS_SHORT[d]}
        </span>
      ))}
    </div>
  )
}

function ReportViewModal({ open, report, dayName, plan, onClose }) {
  if (!report) return null
  const tasks = report.tasks || {}
  const TASK_LABELS = {
    listening:          '🎧 الاستماع ثلاث مرات',
    recitation_mastery: '📖 ضبط التلاوة',
    listened_new:       '🔊 تسميع الجديد كاملاً',
    repeated_new:       '🔁 تكرار تسميع الجديد',
    reviewed_week:      '🔄 مراجعة حفظ الأسبوع',
  }
  return (
    <Modal open={open} onClose={onClose} title={`📋 تقرير ${dayName}`}>
      <div style={{ fontSize:'.82rem', fontWeight:700, marginBottom:'.65rem', color:'var(--text2)' }}>
        المهام المنجزة:
      </div>
      {Object.entries(TASK_LABELS).map(([key, label]) => (
        <div key={key} style={{
          display:'flex', alignItems:'center', gap:'.55rem',
          padding:'.45rem .65rem', borderRadius:'var(--rx)', marginBottom:'.3rem',
          background: tasks[key] ? 'rgba(34,197,94,.07)' : 'var(--card2)',
          border: `1px solid ${tasks[key] ? 'rgba(34,197,94,.2)' : 'var(--border)'}`,
        }}>
          <span style={{ fontSize:'1rem' }}>{tasks[key] ? '✅' : '⬜'}</span>
          <span style={{ fontSize:'.8rem', color: tasks[key] ? 'var(--text)' : 'var(--text3)', fontWeight: tasks[key] ? 600 : 400 }}>{label}</span>
        </div>
      ))}
      {report.notes && (
        <div style={{ marginTop:'.65rem', background:'var(--card2)', border:'1px solid var(--border)', borderRadius:'var(--rx)', padding:'.5rem .75rem', fontSize:'.8rem', color:'var(--text2)' }}>
          📝 {report.notes}
        </div>
      )}
      {report.submittedAt && (
        <div style={{ fontSize:'.68rem', color:'var(--text3)', marginTop:'.5rem', textAlign:'left' }}>
          أُرسل: {new Date(report.submittedAt).toLocaleString('ar')}
        </div>
      )}
      <div style={{ marginTop:'.75rem' }}>
        <Btn style={{ width:'100%', justifyContent:'center' }} onClick={onClose}>إغلاق</Btn>
      </div>
    </Modal>
  )
}

// ── حقل إدخال مساعد ─────────────────────────────────────────────────
function Field({ label, placeholder, value, onChange, rows, optional }) {
  const s = { width:'100%', background:'var(--card2)', border:'1px solid var(--border)', borderRadius:'var(--rx)', padding:'.48rem .7rem', color:'var(--text)', fontFamily:'inherit', fontSize:'.8rem', marginBottom:'.6rem', resize:'none' }
  return (
    <div>
      <div style={{ fontSize:'.74rem', color:'var(--text2)', fontWeight:700, marginBottom:'.25rem', display:'flex', gap:'.3rem', alignItems:'center' }}>
        {label}
        {optional
          ? <span style={{ color:'var(--text3)', fontWeight:400 }}>(اختياري)</span>
          : <span style={{ color:'var(--red)' }}>*</span>
        }
      </div>
      {rows
        ? <textarea rows={rows} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} style={s}/>
        : <input placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} style={{...s, marginBottom:'.6rem'}}/>
      }
    </div>
  )
}

// ── نافذة التقرير اليومي ─────────────────────────────────────────────
function DailyReportModal({ open, plan, existingReport, selectedDay, onClose, onSave, deadlineHour }) {
  const { todayIdx, yesterdayIdx, canAddYesterday } = getAllowedDays(deadlineHour)

  const allowedDays = useMemo(() => {
    const d = [todayIdx]
    if (canAddYesterday) d.push(yesterdayIdx)
    return d
  }, [todayIdx, yesterdayIdx, canAddYesterday])

  const [activeDay,  setActiveDay]  = useState(() => allowedDays.includes(selectedDay ?? todayIdx) ? (selectedDay ?? todayIdx) : todayIdx)
  const [tasks,      setTasks]      = useState(existingReport?.tasks     || {})
  const [sardDone,   setSardDone]   = useState(existingReport?.sardDone  || false)
  const [sardText,   setSardText]   = useState(existingReport?.sardText  || '')
  const [sardNotes,  setSardNotes]  = useState(existingReport?.sardNotes || '')
  const [phaseMem,   setPhaseMem]   = useState(existingReport?.phaseMem  || '')
  const [oldMem,     setOldMem]     = useState(existingReport?.oldMem    || '')
  const [notes,      setNotes]      = useState(existingReport?.notes     || '')
  const [err,        setErr]        = useState('')

  const isEdit = !!existingReport

  function toggleTask(key) { setTasks(p => ({...p, [key]: !p[key]})); setErr('') }

  function handleSave() {
    setErr('')
    if (plan.type === 'حفظ') {
      const missing = TASKS_HAFIZ.filter(t => !tasks[t.key]).map(t => t.label)
      if (missing.length > 0) { setErr('يرجى إكمال جميع مهام اليوم: ' + missing.map(l=>l.replace(/^[^\s]+ /,'')).join(' · ')); return }
      if (!phaseMem.trim()) { setErr('يرجى إدخال حفظ المرحلة'); return }
      if (!oldMem.trim())   { setErr('يرجى إدخال الحفظ السابق'); return }
    }
    if (plan.type === 'سرد') {
      if (!sardDone)             { setErr('يرجى تأكيد إتمام السرد'); return }
      if (!sardText.trim())      { setErr('يرجى إدخال نص السرد الذي تم تنفيذه'); return }
    }
    onSave(activeDay, { tasks, sardDone, sardText, sardNotes, phaseMem, oldMem, notes, submittedAt: new Date().toISOString() })
  }

  const dayTabSt = (d) => ({
    padding:'.42rem .85rem', borderRadius:'var(--rs2)', fontSize:'.78rem', fontWeight:700,
    cursor:'pointer', transition:'all .15s', flexShrink:0,
    background: activeDay===d ? 'var(--gs)' : 'var(--card2)',
    border:`1px solid ${activeDay===d ? 'rgba(34,197,94,.35)' : 'var(--border)'}`,
    color: activeDay===d ? 'var(--green)' : 'var(--text2)',
  })

  return (
    <Modal open={open} onClose={onClose}
      title={`${isEdit ? '✏️ تعديل تقرير' : '📋 تقرير'} يوم ${DAYS_AR[activeDay]} — ${plan.type}`}
      maxWidth={460}
    >
      {/* تبويب الأيام */}
      {allowedDays.length > 1 && (
        <div style={{ marginBottom:'.85rem' }}>
          <div style={{ fontSize:'.74rem', color:'var(--text2)', fontWeight:700, marginBottom:'.4rem' }}>اليوم</div>
          <div style={{ display:'flex', gap:'.4rem' }}>
            {allowedDays.map(d => (
              <div key={d} style={dayTabSt(d)} onClick={() => setActiveDay(d)}>
                {DAYS_AR[d]}
                {d === todayIdx && <span style={{ fontSize:'.6rem', marginRight:'.3rem', color:'var(--green)' }}>• اليوم</span>}
              </div>
            ))}
          </div>
          {canAddYesterday && (
            <div style={{ fontSize:'.68rem', color:'var(--text3)', marginTop:'.3rem' }}>
              ⏰ تقرير الأمس متاح حتى {deadlineHour}:00 صباحاً
            </div>
          )}
        </div>
      )}

      {/* مهام الحفظ */}
      {plan.type === 'حفظ' && (
        <>
          <div style={{ fontSize:'.76rem', color:'var(--text2)', fontWeight:700, marginBottom:'.5rem' }}>
            إنجازات اليوم <span style={{ color:'var(--red)' }}>* (جميعها إلزامية)</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.45rem', marginBottom:'.75rem' }}>
            {TASKS_HAFIZ.map(task => (
              <div key={task.key} onClick={() => toggleTask(task.key)} style={{
                display:'flex', alignItems:'center', gap:'.55rem',
                background: tasks[task.key] ? 'rgba(34,197,94,.07)' : 'var(--card2)',
                border:`1px solid ${tasks[task.key] ? 'rgba(34,197,94,.28)' : 'var(--border)'}`,
                borderRadius:'var(--rs2)', padding:'.65rem .8rem',
                cursor:'pointer', transition:'all .15s',
                gridColumn: task.span ? 'span 2' : 'auto',
              }}>
                <div style={{
                  width:20, height:20, borderRadius:'50%', flexShrink:0,
                  border:`2px solid ${tasks[task.key]?'var(--green)':'var(--border2)'}`,
                  background: tasks[task.key]?'var(--green)':'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'.72rem', color:'#fff', transition:'all .15s',
                }}>{tasks[task.key]?'✓':''}</div>
                <span style={{ fontSize:'.78rem', fontWeight:600, color:tasks[task.key]?'var(--text2)':'var(--text)', textDecoration:tasks[task.key]?'line-through':'none' }}>
                  {task.label}
                </span>
              </div>
            ))}
          </div>
          <Field label="حفظ المرحلة *" placeholder="ما قمت بحفظه في المرحلة..." value={phaseMem} onChange={setPhaseMem} rows={2}/>
          <Field label="الحفظ السابق *" placeholder="ما راجعته من الحفظ السابق..." value={oldMem} onChange={setOldMem} rows={2}/>
        </>
      )}

      {/* مهام السرد */}
      {plan.type === 'سرد' && (
        <>
          <div style={{ background:'var(--bs)', border:'1px solid rgba(59,130,246,.2)', borderRadius:'var(--rs2)', padding:'.65rem .85rem', marginBottom:'.7rem', fontSize:'.78rem' }}>
            <strong style={{ color:'var(--blue)' }}>{plan.sardSubtype==='full'?'سرد كامل':'مراجعة (مقاطع)'}</strong>
            <span style={{ color:'var(--text2)', marginRight:'.4rem' }}>· {plan.sardText}</span>
          </div>
          <div onClick={() => { setSardDone(v=>!v); setErr('') }} style={{
            display:'flex', alignItems:'center', gap:'.7rem',
            background: sardDone?'rgba(34,197,94,.07)':'var(--card2)',
            border:`1px solid ${sardDone?'rgba(34,197,94,.28)':'var(--border)'}`,
            borderRadius:'var(--rs2)', padding:'.9rem', cursor:'pointer', marginBottom:'.7rem', transition:'all .15s',
          }}>
            <div style={{ width:26, height:26, borderRadius:7, border:`2px solid ${sardDone?'var(--green)':'var(--border2)'}`, background:sardDone?'var(--green)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.9rem', color:'#fff', transition:'all .15s', flexShrink:0 }}>{sardDone?'✓':''}</div>
            <div>
              <div style={{ fontSize:'.86rem', fontWeight:700 }}>تم السرد <span style={{ color:'var(--red)', fontSize:'.7rem' }}>*</span></div>
              <div style={{ fontSize:'.7rem', color:'var(--text2)' }}>اضغط لتأكيد إتمام السرد</div>
            </div>
          </div>
          <Field label="نص السرد *" placeholder="نص السرد الذي تم تنفيذه..." value={sardText} onChange={setSardText}/>
          <Field label="ملاحظات السرد" placeholder="ملاحظات..." value={sardNotes} onChange={setSardNotes} rows={2} optional/>
        </>
      )}

      {/* ملاحظات عامة */}
      <Field label="ملاحظات" placeholder="ملاحظات اليوم..." value={notes} onChange={setNotes} rows={2} optional/>

      {/* رسالة خطأ */}
      {err && (
        <div style={{ background:'var(--rs)', border:'1px solid rgba(239,68,68,.3)', borderRadius:'var(--rx)', padding:'.5rem .75rem', fontSize:'.76rem', color:'var(--red)', marginBottom:'.65rem', lineHeight:1.5 }}>
          ⚠️ {err}
        </div>
      )}

      <div style={{ display:'flex', gap:'.5rem' }}>
        <Btn style={{ flex:1, justifyContent:'center' }} onClick={onClose}>إلغاء</Btn>
        <Btn variant="p" style={{ flex:1, justifyContent:'center' }} onClick={handleSave}>
          {isEdit ? '💾 حفظ التعديل' : '☁️ إرسال التقرير'}
        </Btn>
      </div>
    </Modal>
  )
}

// ── الشاشة الرئيسية ──────────────────────────────────────────────────
export default function StudentScreen({ currentUser, allUsers, plans: allPlans, sysSettings, onLogout, onUpdateUser, onUpdatePlans, showToast, darkMode, onToggleDark }) {
  const [plans,      setPlans]      = useState(allPlans || [])
  const [showProfile, setShowProfile] = useState(false)
  const [modalState, setModalState] = useState({ open:false, plan:null, day:null, existing:null })
  const [pastOpen,   setPastOpen]   = useState(false)
  const [futureOpen, setFutureOpen] = useState(false)
  const [activeTab,  setActiveTab]  = useState('plans')
  const [viewReport, setViewReport] = useState(null)  // تقرير للعرض فقط

  const deadlineHour = sysSettings?.reportDeadlineHour ?? 8
  const { todayIdx, yesterdayIdx, canAddYesterday } = getAllowedDays(deadlineHour)

  // حساب حالة المقرر تلقائياً من التاريخ
  const computedPlans = useMemo(() => {
    const today = new Date()
    today.setHours(0,0,0,0)
    return plans
      .filter(p => p.studentId === currentUser.id)
      .map(p => {
        const start = new Date(p.startDate)
        start.setHours(0,0,0,0)
        const end   = new Date(start); end.setDate(end.getDate() + 6)
        let status
        if (today < start)        status = 'future'
        else if (today <= end)    status = 'current'
        else                      status = 'past'
        return { ...p, status }
      })
  }, [plans, currentUser.id])

  const myPlans     = computedPlans
  const currentPlan = useMemo(() => myPlans.find(p => p.status === 'current'), [myPlans])
  const pastPlans   = useMemo(() => myPlans.filter(p => p.status === 'past').sort((a,b) => b.startDate.localeCompare(a.startDate)), [myPlans])
  const futurePlans = useMemo(() => myPlans.filter(p => p.status === 'future').sort((a,b) => a.startDate.localeCompare(b.startDate)), [myPlans])

  const reportedDays      = Object.keys(currentPlan?.dailyReports || {}).map(Number)
  const todayReported     = reportedDays.includes(todayIdx)
  const yesterdayReported = reportedDays.includes(yesterdayIdx)
  const showYesterdayBtn  = canAddYesterday && !yesterdayReported  // ← شرط الإظهار

  function openReport(day, isEdit) {
    if (!currentPlan) return
    const existing = isEdit ? (currentPlan.dailyReports?.[day] || null) : null
    setModalState({ open:true, plan:currentPlan, day, existing, viewOnly:false })
  }

  function saveReport(dayIdx, data) {
    if (!isDayAllowed(dayIdx, todayIdx, yesterdayIdx, canAddYesterday)) {
      showToast('⛔ انتهت مهلة إدخال تقرير هذا اليوم', 'err'); return
    }
    const updater = prev => prev.map(p => {
      if (p.id !== currentPlan.id) return p
      return { ...p, dailyReports: { ...p.dailyReports, [dayIdx]: data } }
    })
    setPlans(updater)
    if (onUpdatePlans) onUpdatePlans(updater)
    setModalState({ open:false, plan:null, day:null, existing:null })
    showToast(modalState.existing ? '✏️ تم تعديل التقرير' : '✅ تم إرسال تقرير اليوم', 'ok')
  }

  function handleProfileSave(changes) {
    onUpdateUser(changes)
    setShowProfile(false)
    showToast('✅ تم حفظ التعديلات', 'ok')
  }

  const tm = currentPlan ? typeMeta(currentPlan) : null

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', maxWidth:680, margin:'0 auto' }}>
      <style>{`
        @keyframes pulse-border{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0);border-color:rgba(34,197,94,.38);}50%{box-shadow:0 0 0 5px rgba(34,197,94,.11);border-color:rgba(34,197,94,.72);}}
        @keyframes warnPulse{0%{box-shadow:0 0 0 0 rgba(239,68,68,.9),0 0 12px rgba(239,68,68,.6)}70%{box-shadow:0 0 0 14px rgba(239,68,68,0),0 0 20px rgba(239,68,68,0)}100%{box-shadow:0 0 0 0 rgba(239,68,68,0),0 0 0 rgba(239,68,68,0)}}
        .warn-dot{width:20px;height:20px;border-radius:50%;background:#ef4444;flex-shrink:0;animation:warnPulse 1.2s ease-out infinite}
      `}</style>

      {/* TOPBAR */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'.7rem 1rem', background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ fontWeight:800, fontSize:'1.05rem' }}>📖 أشبال القرآن</div>
        <div style={{ display:'flex', gap:'.5rem', alignItems:'center' }}>
          <div onClick={() => setShowProfile(true)} style={{ display:'flex', alignItems:'center', gap:'.35rem', background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:'.28rem .75rem', fontSize:'.76rem', fontWeight:600, cursor:'pointer' }}>👤 {currentUser.name}</div>
          <button onClick={onToggleDark} title={darkMode?'وضع فاتح':'وضع داكن'} style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:'1rem',display:'flex',alignItems:'center',justifyContent:'center'}}>{darkMode?'☀️':'🌙'}</button>
          <Btn variant="out" size="sm" onClick={onLogout}>خروج</Btn>
        </div>
      </div>

      {/* ── تبويب المقررات ── */}
      {activeTab === 'plans' && (
        <div style={{ flex:1, padding:'1rem', overflowY:'auto' }}>

          {/* بطاقة الإنذار */}
          {currentUser.warned > 0 && !currentUser.suspended && (
            <div style={{ display:'flex', alignItems:'center', gap:'.75rem', background:'rgba(239,68,68,.1)', border:'2px solid rgba(239,68,68,.5)', borderRadius:'var(--rs2)', padding:'.85rem 1rem', marginBottom:'.75rem' }}>
              <div className="warn-dot"/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'.88rem', fontWeight:900, color:'#ef4444' }}>⚠️ لديك {currentUser.warned === 1 ? 'إنذار واحد' : currentUser.warned === 2 ? 'إنذاران' : 'ثلاثة إنذارات'}</div>
                <div style={{ fontSize:'.74rem', color:'var(--text2)', marginTop:'.2rem' }}>{'★'.repeat(currentUser.warned)}{'☆'.repeat(3 - currentUser.warned)} · الإنذار الثالث يوقف حسابك تلقائياً</div>
              </div>
            </div>
          )}

          {/* بطاقة الوقف */}
          {currentUser.suspended && (
            <div style={{ display:'flex', alignItems:'center', gap:'.75rem', background:'rgba(239,68,68,.07)', border:'1px solid rgba(239,68,68,.3)', borderRadius:'var(--rs2)', padding:'.8rem 1rem', marginBottom:'.75rem' }}>
              <div style={{ fontSize:'1.4rem', flexShrink:0 }}>🚫</div>
              <div><div style={{ fontSize:'.84rem', fontWeight:800, color:'var(--red)' }}>حسابك موقوف</div><div style={{ fontSize:'.72rem', color:'var(--text2)', marginTop:'.15rem' }}>تواصل مع المشرف لرفع الوقف</div></div>
            </div>
          )}

          {/* إحصاءات حقيقية */}
          {(()=>{
            const level = Number(currentUser.level) || 0
            const planCount = myPlans.filter(p => p.status !== 'future').length
            const evaluated = myPlans.filter(p => p.evaluation)
            const totalPts = evaluated.reduce((s,p) => { const ev=p.evaluation; return s+(p.type==='حفظ'?((ev.newScore||0)+(ev.recentScore||0)+(ev.oldScore||0)):p.type==='سرد'?(ev.revScore||0):(ev.phaseScore||0)) }, 0)
            const avgPts = evaluated.length ? Math.round(totalPts/evaluated.length) : 0
            return (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.6rem', marginBottom:'1rem' }}>
                {[[level||'—','جزء محفوظ','var(--green)'],[planCount,'عدد المقررات','var(--gold)'],[avgPts?avgPts+'%':'—','متوسط النقاط','var(--blue)']].map(([n,l,col]) => (
                  <div key={l} style={{ background:'var(--card2)', border:'1px solid var(--border)', borderRadius:'var(--rs2)', padding:'.85rem', textAlign:'center' }}>
                    <div style={{ fontSize:'1.5rem', fontWeight:900, color:col, lineHeight:1 }}>{n}</div>
                    <div style={{ fontSize:'.68rem', color:'var(--text2)', marginTop:'.2rem' }}>{l}</div>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* المقرر الحالي */}
          {currentPlan && (
            <div style={{ background:'var(--card)', border:'2px solid rgba(34,197,94,.45)', borderRight:'4px solid var(--green)', borderRadius:'var(--r)', padding:'1.1rem', marginBottom:'.85rem', animation:'pulse-border 2.8s ease-in-out infinite' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.65rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                  <span style={{ fontSize:'.7rem', padding:'.18rem .65rem', borderRadius:12, fontWeight:800, background:tm.bg, color:tm.color }}>{tm.label}</span>
                  <span style={{ fontSize:'.7rem', color:'var(--text3)' }}>أسبوع {currentPlan.startDate}</span>
                </div>
              </div>
              <PlanContent plan={currentPlan}/>

              {/* زر التقرير */}
              <div style={{ display:'flex', gap:'.4rem', marginTop:'.85rem' }}>
                {!todayReported ? (
                  <Btn variant="p" style={{ flex:1, justifyContent:'center' }} onClick={() => openReport(todayIdx, false)}>
                    ☁️ إرسال تقرير اليوم
                  </Btn>
                ) : (
                  <Btn style={{ flex:1, justifyContent:'center' }} onClick={() => openReport(todayIdx, true)}>
                    ✏️ تعديل تقرير اليوم
                  </Btn>
                )}
                {showYesterdayBtn && (
                  <Btn style={{ flex:1, justifyContent:'center' }} onClick={() => openReport(yesterdayIdx, false)}>
                    ⏪ تقرير الأمس
                  </Btn>
                )}
              </div>

              {/* نتيجة التقييم */}
              {currentPlan.evaluation && (() => {
                const ev = currentPlan.evaluation
                return (
                  <div style={{ marginTop:'.65rem', background:'rgba(34,197,94,.06)', border:'1px solid rgba(34,197,94,.18)', borderRadius:'var(--rx)', padding:'.6rem .75rem' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.35rem' }}>
                      <span style={{ fontSize:'.72rem', fontWeight:800, color:'var(--green)' }}>📝 نتيجة التقييم</span>
                      <div style={{ display:'flex', alignItems:'center', gap:'.35rem' }}>
                        <span style={{ fontSize:'.78rem', color:'var(--gold)' }}>{'★'.repeat(ev.stars||0)}{'☆'.repeat(3-(ev.stars||0))}</span>
                        <span style={{ fontSize:'.78rem', fontWeight:900, color:'var(--green)' }}>+{ev.points} نقطة</span>
                      </div>
                    </div>
                    {ev.notes && <div style={{ fontSize:'.72rem', color:'var(--text2)' }}>💬 {ev.notes}</div>}
                  </div>
                )
              })()}

              {/* الأيام المُرسلة */}
              <div style={{ marginTop:'.75rem', paddingTop:'.65rem', borderTop:'1px solid var(--border)' }}>
                <div style={{ fontSize:'.68rem', color:'var(--text3)', marginBottom:'.35rem', fontWeight:700 }}>التقارير المُرسلة — اضغط لعرض التفاصيل</div>
                <ClickableReportedDays dailyReports={currentPlan.dailyReports} onDayClick={(dayIdx) => {
                  const rep = currentPlan.dailyReports?.[dayIdx]
                  if (rep) setModalState({ open:true, plan:currentPlan, day:dayIdx, existing:rep, viewOnly:true })
                }}/>
              </div>
            </div>
          )}

          {!currentPlan && (
            <div style={{ textAlign:'center', padding:'2rem', color:'var(--text3)', fontSize:'.85rem', background:'var(--card2)', border:'1px solid var(--border)', borderRadius:'var(--r)', marginBottom:'.85rem' }}>
              لا يوجد مقرر حالي — انتظر مقررك القادم من المعلم
            </div>
          )}

          {/* المقررات القادمة */}
          {futurePlans.length > 0 && (
            <div style={{ marginBottom:'.65rem' }}>
              <div onClick={() => setFutureOpen(v=>!v)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', padding:'.55rem .75rem', background:'var(--card2)', border:'1px solid var(--border)', borderRadius: futureOpen ? 'var(--rs2) var(--rs2) 0 0' : 'var(--rs2)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'.45rem', fontSize:'.82rem', fontWeight:800, color:'var(--blue)' }}>🔵 المقررات القادمة<span style={{ fontSize:'.68rem', background:'var(--bs)', color:'var(--blue)', padding:'.12rem .5rem', borderRadius:10, fontWeight:700 }}>{futurePlans.length}</span></div>
                <span style={{ color:'var(--text3)', transform: futureOpen?'rotate(180deg)':'rotate(0deg)', display:'inline-block', transition:'.2s' }}>▾</span>
              </div>
              {futureOpen && (
                <div style={{ border:'1px solid var(--border)', borderTop:'none', borderRadius:'0 0 var(--rs2) var(--rs2)', padding:'.65rem' }}>
                  {futurePlans.map(plan => { const m=typeMeta(plan); return (
                    <div key={plan.id} style={{ background:'var(--card2)', border:'1px solid rgba(59,130,246,.18)', borderRight:'3px solid var(--blue)', borderRadius:'var(--rs2)', padding:'.75rem .9rem', marginBottom:'.4rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'.4rem', marginBottom:'.4rem' }}><span style={{ fontSize:'.68rem', padding:'.15rem .55rem', borderRadius:12, fontWeight:800, background:m.bg, color:m.color }}>{m.label}</span><span style={{ fontSize:'.65rem', color:'var(--text3)' }}>يبدأ {plan.startDate}</span></div>
                      <PlanContent plan={plan}/>
                    </div>
                  )})}
                </div>
              )}
            </div>
          )}

          {/* المقررات السابقة */}
          {pastPlans.length > 0 && (
            <div style={{ marginBottom:'.65rem' }}>
              <div onClick={() => setPastOpen(v=>!v)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', padding:'.55rem .75rem', background:'var(--card2)', border:'1px solid var(--border)', borderRadius: pastOpen ? 'var(--rs2) var(--rs2) 0 0' : 'var(--rs2)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'.45rem', fontSize:'.82rem', fontWeight:800, color:'var(--text2)' }}>⚫ المقررات السابقة<span style={{ fontSize:'.68rem', background:'var(--card3)', color:'var(--text3)', padding:'.12rem .5rem', borderRadius:10, fontWeight:700 }}>{pastPlans.length}</span></div>
                <span style={{ color:'var(--text3)', transform: pastOpen?'rotate(180deg)':'rotate(0deg)', display:'inline-block', transition:'.2s' }}>▾</span>
              </div>
              {pastOpen && (
                <div style={{ border:'1px solid var(--border)', borderTop:'none', borderRadius:'0 0 var(--rs2) var(--rs2)', padding:'.65rem' }}>
                  {pastPlans.map(plan => { const m=typeMeta(plan); const ev=plan.evaluation; return (
                    <div key={plan.id} style={{ background:'var(--card2)', border:'1px solid var(--border)', borderRight:'3px solid var(--text3)', borderRadius:'var(--rs2)', padding:'.75rem .9rem', marginBottom:'.4rem' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.4rem' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'.4rem' }}><span style={{ fontSize:'.68rem', padding:'.15rem .55rem', borderRadius:12, fontWeight:800, background:m.bg, color:m.color }}>{m.label}</span><span style={{ fontSize:'.65rem', color:'var(--text3)' }}>{plan.startDate}</span></div>
                        {ev && <div style={{ display:'flex', alignItems:'center', gap:'.3rem' }}><span style={{ fontSize:'.75rem', color:'var(--gold)' }}>{'★'.repeat(ev.stars||0)}{'☆'.repeat(3-(ev.stars||0))}</span><span style={{ fontSize:'.72rem', fontWeight:800, color:'var(--green)' }}>+{ev.points}</span></div>}
                      </div>
                      <PlanContent plan={plan}/>
                      {ev && (
                        <div style={{ marginTop:'.5rem', background:'rgba(34,197,94,.06)', border:'1px solid rgba(34,197,94,.18)', borderRadius:'var(--rx)', padding:'.6rem .75rem' }}>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:'.4rem', marginBottom:ev.notes?'.45rem':0 }}>
                            {plan.type==='حفظ'&&ev.newScore!==undefined&&<><span style={{fontSize:'.7rem',background:'var(--card3)',borderRadius:6,padding:'.15rem .5rem',color:'var(--text2)'}}>جديد: <strong style={{color:'var(--text)'}}>{ev.newScore}/40</strong> {ev.newPass?'✓':'✕'}</span><span style={{fontSize:'.7rem',background:'var(--card3)',borderRadius:6,padding:'.15rem .5rem',color:'var(--text2)'}}>قريب: <strong style={{color:'var(--text)'}}>{ev.recentScore}/20</strong></span><span style={{fontSize:'.7rem',background:'var(--card3)',borderRadius:6,padding:'.15rem .5rem',color:'var(--text2)'}}>قديم: <strong style={{color:'var(--text)'}}>{ev.oldScore}/40</strong> {ev.oldPass?'✓':'✕'}</span></>}
                            {plan.type==='سرد'&&ev.revScore!==undefined&&<span style={{fontSize:'.7rem',background:'var(--card3)',borderRadius:6,padding:'.15rem .5rem',color:'var(--text2)'}}>السرد: <strong style={{color:'var(--text)'}}>{ev.revScore}/100</strong> {ev.revPass?'✓ يُجاز':'✕ لا يُجاز'}</span>}
                            {plan.type==='تقييم مرحلة'&&ev.phaseScore!==undefined&&<span style={{fontSize:'.7rem',background:'var(--card3)',borderRadius:6,padding:'.15rem .5rem',color:'var(--text2)'}}>التقييم: <strong style={{color:'var(--text)'}}>{ev.phaseScore}/100</strong></span>}
                          </div>
                          {ev.notes&&<div style={{fontSize:'.72rem',color:'var(--text2)',borderTop:'1px solid rgba(34,197,94,.15)',paddingTop:'.35rem',marginTop:'.35rem'}}>💬 {ev.notes}</div>}
                        </div>
                      )}
                      {plan.dailyReports && Object.keys(plan.dailyReports).length > 0 && (
                        <div style={{ marginTop:'.4rem' }}><ReportedDays dailyReports={plan.dailyReports}/></div>
                      )}
                    </div>
                  )})}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ── تبويب الترتيب ── */}
      {activeTab === 'rank' && (()=>{
        const allStudents = (allUsers||[]).filter(u=>u.role==='student')
        const allPlansList = allPlans||[]
        const statsAll = allStudents.map(stu => {
          const sp = allPlansList.filter(p=>p.studentId===stu.id&&p.evaluation)
          if(sp.length===0)return null
          const total=sp.reduce((s,p)=>{const ev=p.evaluation;return s+(p.type==='حفظ'?((ev.newScore||0)+(ev.recentScore||0)+(ev.oldScore||0)):p.type==='سرد'?(ev.revScore||0):(ev.phaseScore||0))},0)
          const avg=Math.round(total/sp.length)
          return{stu,avg,count:sp.length,total}
        }).filter(Boolean).sort((a,b)=>b.avg-a.avg)
        let rank=1
        const ranked=statsAll.map((d,i)=>{
          if(i>0&&d.avg<statsAll[i-1].avg)rank=i+1
          return{...d,rank}
        })
        const medals={1:'🥇',2:'🥈',3:'🥉'}
        return(
          <div style={{flex:1,padding:'1rem',overflowY:'auto'}}>
            <div style={{fontSize:'.88rem',fontWeight:800,marginBottom:'.85rem'}}>🏆 ترتيب الطلاب حسب متوسط الدرجات</div>
            {ranked.length===0?<div style={{textAlign:'center',padding:'2rem',color:'var(--text3)',border:'1px dashed var(--border)',borderRadius:'var(--r)'}}>لا توجد تقييمات بعد</div>:ranked.map((d,i)=>{
              const isMe=d.stu.id===currentUser.id
              const dupRank=ranked.filter(x=>x.rank===d.rank).length>1
              const barColor=d.avg>=80?'var(--green)':d.avg>=60?'var(--gold)':'var(--red)'
              return(
                <div key={d.stu.id} style={{display:'flex',alignItems:'center',gap:'.6rem',background:isMe?'rgba(34,197,94,.06)':'var(--card2)',border:`1px solid ${isMe?'rgba(34,197,94,.3)':d.rank<=3?'rgba(245,158,11,.2)':'var(--border)'}`,borderRadius:'var(--rs2)',padding:'.75rem .85rem',marginBottom:'.4rem',boxShadow:isMe?'0 0 0 2px rgba(34,197,94,.2)':'none'}}>
                  <div style={{width:36,textAlign:'center',flexShrink:0}}>
                    <div style={{fontSize:d.rank<=3?'1.1rem':'.85rem',fontWeight:d.rank>3?800:400,color:d.rank>3?'var(--text2)':undefined}}>{medals[d.rank]||d.rank}</div>
                    {dupRank&&<div style={{fontSize:'.58rem',color:'var(--text3)',lineHeight:1.2}}>مكرر</div>}
                  </div>
                  <div style={{width:34,height:34,borderRadius:'50%',background:isMe?'var(--gs)':'var(--card3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.8rem',fontWeight:800,flexShrink:0,color:isMe?'var(--green)':'var(--text)'}}>{d.stu.avatar}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'.82rem',fontWeight:isMe?900:700,color:isMe?'var(--green)':'var(--text)',display:'flex',alignItems:'center',gap:'.35rem'}}>
                      {d.stu.name}
                      {isMe&&<span style={{fontSize:'.66rem',background:'var(--gs)',color:'var(--green)',borderRadius:8,padding:'.1rem .4rem',fontWeight:700}}>أنت</span>}
                    </div>
                    <div style={{height:4,background:'var(--card3)',borderRadius:2,marginTop:'.3rem'}}><div style={{height:'100%',borderRadius:2,width:`${d.avg}%`,background:barColor,transition:'width .4s'}}/></div>
                    <div style={{fontSize:'.64rem',color:'var(--text3)',marginTop:'.2rem'}}>{d.count} {d.count===1?'مقرر':'مقررات'} · مجموع: {d.total}</div>
                  </div>
                  <div style={{textAlign:'left',flexShrink:0}}>
                    <div style={{fontSize:'1.3rem',fontWeight:900,color:barColor,lineHeight:1}}>{d.avg}</div>
                    <div style={{fontSize:'.64rem',color:'var(--text2)',textAlign:'center'}}>متوسط</div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* TABBAR */}
      <div style={{ display:'flex', background:'var(--bg2)', borderTop:'1px solid var(--border)', position:'sticky', bottom:0 }}>
        {[['🏠','مقرراتي','plans'],['🏆','الترتيب','rank']].map(([ico,lbl,tab]) => (
          <div key={lbl} onClick={() => setActiveTab(tab)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'.15rem', padding:'.65rem .3rem', cursor:'pointer', fontSize:'.66rem', fontWeight:700, color: activeTab===tab?'var(--green)':'var(--text3)' }}>
            <div style={{ fontSize:'1.25rem' }}>{ico}</div>{lbl}
          </div>
        ))}
      </div>

      <ProfileModal open={showProfile} user={currentUser} onClose={() => setShowProfile(false)} onSave={(ch) => { onUpdateUser(ch); setShowProfile(false); showToast('✅ تم حفظ التعديلات', 'ok') }}/>

      <ReportViewModal
        open={!!(modalState.open && modalState.viewOnly)}
        report={modalState.existing}
        dayName={DAYS_AR[modalState.day] || ''}
        plan={modalState.plan}
        onClose={() => setModalState({ open:false, plan:null, day:null, existing:null, viewOnly:false })}
      />

      {modalState.open && !modalState.viewOnly && (
        <DailyReportModal
          open={modalState.open}
          plan={modalState.plan}
          existingReport={modalState.existing}
          selectedDay={modalState.day}
          onClose={() => setModalState({ open:false, plan:null, day:null, existing:null, viewOnly:false })}
          onSave={saveReport}
          deadlineHour={deadlineHour}
        />
      )}
    </div>
  )
}
