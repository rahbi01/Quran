import { useState, useMemo, useEffect } from 'react'
import Btn from '../components/Btn.jsx'
import Modal from '../components/Modal.jsx'
import { TASKS_HAFIZ, DAYS_AR } from '../data.js'
import ProfileModal from '../components/ProfileModal.jsx'

// ── ثوابت ─────────────────────────────────────────────────────────────
// MY_STUDENT_IDS derived from assignments prop
const TEACHER_ID_DEFAULT = 1

const TYPE_META = {
  'حفظ':           { label:'📖 حفظ',               bg:'var(--gs)',    color:'var(--green)'  },
  'سرد-full':      { label:'🎙️ سرد كامل',           bg:'var(--bs)',    color:'var(--blue)'   },
  'سرد-review':    { label:'🔁 سرد مراجعة (مقاطع)', bg:'var(--golds)', color:'var(--gold)'   },
  'تقييم مرحلة':  { label:'⭐ تقييم مرحلة',         bg:'var(--golds)', color:'var(--gold)'   },
}
function planKey(p) { return p.type === 'سرد' ? `سرد-${p.sardSubtype}` : p.type }
function typeMeta(p) { return TYPE_META[planKey(p)] || { label:p.type, bg:'var(--card3)', color:'var(--text2)' } }

const STATUS_LABELS = {
  excellent:{ label:'ممتاز',        bg:'var(--gs)',    color:'var(--green)' },
  good:     { label:'جيد',           bg:'var(--bs)',    color:'var(--blue)'  },
  needs:    { label:'يحتاج متابعة', bg:'var(--golds)', color:'var(--gold)'  },
  absent:   { label:'غائب',         bg:'var(--rs)',    color:'var(--red)'   },
}

// ── مكوّن شارة النوع ──────────────────────────────────────────────────
function TypeBadge({ plan, size = '.68rem' }) {
  if (!plan) return null
  const m = typeMeta(plan)
  return (
    <span style={{ fontSize:size, padding:'.15rem .55rem', borderRadius:12, fontWeight:800, background:m.bg, color:m.color, whiteSpace:'nowrap' }}>
      {m.label}
    </span>
  )
}

// ── مكوّن شارة حالة المقرر ────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    past:    { label:'سابق',  bg:'var(--card3)', color:'var(--text3)' },
    current: { label:'حالي',  bg:'var(--gs)',    color:'var(--green)' },
    future:  { label:'قادم',  bg:'var(--bs)',    color:'var(--blue)'  },
  }
  const s = map[status] || map.past
  return (
    <span style={{ fontSize:'.62rem', padding:'.12rem .5rem', borderRadius:10, fontWeight:800, background:s.bg, color:s.color }}>
      {s.label}
    </span>
  )
}

// ── عرض ملخص محتوى المقرر ────────────────────────────────────────────
function PlanSummary({ plan }) {
  if (plan.type === 'حفظ') return (
    <div style={{ display:'flex', flexDirection:'column', gap:'.18rem', marginTop:'.35rem' }}>
      {[['الجديد', plan.newMem], ['القريب', plan.recentMem], ['القديم', plan.oldMem]].map(([l, v]) => v ? (
        <div key={l} style={{ display:'flex', gap:'.4rem', fontSize:'.75rem' }}>
          <span style={{ color:'var(--text3)', minWidth:42, flexShrink:0 }}>{l}</span>
          <span style={{ color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</span>
        </div>
      ) : null)}
    </div>
  )
  if (plan.type === 'سرد') return (
    <div style={{ fontSize:'.75rem', color:'var(--text2)', marginTop:'.3rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
      {plan.sardText}
      {plan.sardNotes ? <span style={{ color:'var(--text3)' }}> · {plan.sardNotes}</span> : null}
    </div>
  )
  if (plan.type === 'تقييم مرحلة') return (
    <div style={{ fontSize:'.75rem', color:'var(--text2)', marginTop:'.3rem' }}>{plan.phaseDesc}</div>
  )
  return null
}

// ── عرض نتيجة التقييم ────────────────────────────────────────────────
function EvalResult({ plan }) {
  const ev = plan.evaluation
  if (!ev) return (
    <div style={{ display:'flex', alignItems:'center', gap:'.4rem', marginTop:'.45rem', padding:'.35rem .6rem', background:'var(--card3)', borderRadius:'var(--rx)', fontSize:'.72rem', color:'var(--text3)' }}>
      <span>⏳</span>
      <span>{plan.status === 'future' ? 'لم يبدأ بعد' : 'في انتظار التقييم'}</span>
    </div>
  )

  const pts = ev.points || 0
  const stars = ev.stars || 0

  let scoreText = ''
  if (plan.type === 'حفظ') {
    const total = (ev.newScore||0) + (ev.recentScore||0) + (ev.oldScore||0)
    scoreText = `${ev.newScore}/40 · ${ev.recentScore}/20 · ${ev.oldScore}/40 = ${total}/100`
  } else if (plan.type === 'سرد') {
    scoreText = `${ev.revScore}/100 · ${ev.revPass ? 'يُجاز ✓' : 'لا يُجاز ✕'}`
  } else if (plan.type === 'تقييم مرحلة') {
    scoreText = `${ev.phaseScore}/80`
  }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'.45rem', padding:'.4rem .65rem', background:'rgba(34,197,94,.06)', border:'1px solid rgba(34,197,94,.15)', borderRadius:'var(--rx)' }}>
      <div>
        <div style={{ fontSize:'.7rem', color:'var(--text2)' }}>{scoreText}</div>
        {ev.notes ? <div style={{ fontSize:'.68rem', color:'var(--text3)', marginTop:'.1rem' }}>{ev.notes}</div> : null}
      </div>
      <div style={{ textAlign:'left', flexShrink:0 }}>
        <div style={{ fontSize:'.82rem', fontWeight:900, color:'var(--green)', lineHeight:1 }}>+{pts}</div>
        <div style={{ fontSize:'.75rem', color:'var(--gold)' }}>{'★'.repeat(stars)}{'☆'.repeat(3-stars)}</div>
      </div>
    </div>
  )
}

// ── قائمة المقررات السابقة (قابلة للطي) ─────────────────────────────
function PastPlansSection({ plans, stu, onEditEval }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div onClick={() => setOpen(v => !v)} style={{ fontSize:'.72rem', fontWeight:800, color:'var(--text3)', marginBottom: open ? '.4rem' : 0, display:'flex', alignItems:'center', gap:'.4rem', cursor:'pointer', userSelect:'none', padding:'.3rem 0' }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--text3)', display:'inline-block' }}/>
        المقررات السابقة ({plans.length})
        <span style={{ marginRight:'auto', fontSize:'.8rem', transition:'transform .2s', display:'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </div>
      {open && plans.map(plan => (
        <PlanItem key={plan.id} plan={plan} onEditEval={p => onEditEval(stu, p)}/>
      ))}
    </div>
  )
}

// ── بطاقة طالب مع كل مقرراته ─────────────────────────────────────────
function StudentCard({ stu, plans, onEval, onAddPlan, onEdit, onEditEval, canAdd }) {
  const [expanded, setExpanded] = useState(false)
  // حالة الطالب: إذا موقوف → absent، وإلا → good افتراضياً
  const st = stu.suspended ? STATUS_LABELS.absent : STATUS_LABELS.good

  const currentPlan = plans.find(p => p.status === 'current')
  const pastPlans   = plans.filter(p => p.status === 'past').sort((a,b) => b.startDate.localeCompare(a.startDate))
  const futurePlans = plans.filter(p => p.status === 'future').sort((a,b) => a.startDate.localeCompare(b.startDate))

  const hasFuture = futurePlans.length > 0

  return (
    <div style={{
      background:'var(--card)',
      border:'1px solid var(--border)',
      borderRadius:'var(--r)',
      marginBottom:'.75rem',
      overflow:'hidden',
    }}>
      {/* رأس البطاقة */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ display:'flex', alignItems:'center', gap:'.65rem', padding:'.85rem 1rem', cursor:'pointer', transition:'background .15s' }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.02)'}
        onMouseLeave={e => e.currentTarget.style.background='transparent'}
      >
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'.4rem', marginBottom:'.2rem' }}>
            <span style={{ fontSize:'.88rem', fontWeight:800 }}>{stu.name}</span>
            <span style={{ fontSize:'.68rem', padding:'.12rem .5rem', borderRadius:10, fontWeight:800, background:st.bg, color:st.color }}>{st.label}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'.4rem', flexWrap:'wrap' }}>
            {currentPlan
              ? <TypeBadge plan={currentPlan}/>
              : <span style={{ fontSize:'.68rem', color:'var(--text3)' }}>لا يوجد مقرر حالي</span>
            }
            {hasFuture && (
              <span style={{ fontSize:'.62rem', color:'var(--blue)', background:'var(--bs)', padding:'.1rem .45rem', borderRadius:8, fontWeight:700 }}>
                +{futurePlans.length} قادم
              </span>
            )}
            {pastPlans.length > 0 && (
              <span style={{ fontSize:'.62rem', color:'var(--text3)' }}>{pastPlans.length} سابق</span>
            )}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'.5rem', flexShrink:0 }}>
          {currentPlan && !currentPlan.evaluation && (
            <Btn variant="p" size="sm"
              onClick={e => { e.stopPropagation(); onEval(stu, currentPlan) }}
            >تقييم</Btn>
          )}
          {canAdd && (
            <Btn size="sm"
              onClick={e => { e.stopPropagation(); onAddPlan(stu) }}
            >+ مقرر</Btn>
          )}
          <span style={{ color:'var(--text3)', fontSize:'.9rem', transition:'transform .2s', transform: expanded?'rotate(180deg)':'rotate(0deg)' }}>▾</span>
        </div>
      </div>

      {/* تفاصيل المقررات */}
      {expanded && (
        <div style={{ borderTop:'1px solid var(--border)', padding:'.75rem 1rem' }}>

          {/* المقرر الحالي */}
          {currentPlan && (
            <div style={{ marginBottom:'.75rem' }}>
              <div style={{ fontSize:'.72rem', fontWeight:800, color:'var(--text2)', marginBottom:'.4rem', display:'flex', alignItems:'center', gap:'.4rem' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', boxShadow:'0 0 6px var(--green)', display:'inline-block' }}/>
                المقرر الحالي
              </div>
              <PlanItem plan={currentPlan} onEval={() => onEval(stu, currentPlan)} onEdit={p=>onEdit(p)} onEditEval={p=>onEditEval(stu,p)} isCurrentOrFuture/>
            </div>
          )}

          {/* المقررات القادمة */}
          {futurePlans.length > 0 && (
            <div style={{ marginBottom:'.75rem' }}>
              <div style={{ fontSize:'.72rem', fontWeight:800, color:'var(--blue)', marginBottom:'.4rem', display:'flex', alignItems:'center', gap:'.4rem' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--blue)', display:'inline-block' }}/>
                المقررات القادمة
              </div>
              {futurePlans.map(plan => (
                <PlanItem key={plan.id} plan={plan} onEdit={p=>onEdit(p)} isCurrentOrFuture/>
              ))}
            </div>
          )}

          {/* المقررات السابقة — قابلة للطي */}
          {pastPlans.length > 0 && (
            <PastPlansSection plans={pastPlans} stu={stu} onEditEval={onEditEval}/>
          )}

          {plans.length === 0 && (
            <div style={{ textAlign:'center', padding:'1rem', color:'var(--text3)', fontSize:'.8rem' }}>
              لا توجد مقررات بعد
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── بطاقة مقرر واحد ──────────────────────────────────────────────────
function PlanItem({ plan, onEval, onEdit, onEditEval, isCurrentOrFuture }) {
  const m = typeMeta(plan)
  const borderColor = plan.status==='current' ? 'rgba(34,197,94,.25)' : plan.status==='future' ? 'rgba(59,130,246,.2)' : 'var(--border)'

  return (
    <div style={{
      background:'var(--card2)',
      border:`1px solid ${borderColor}`,
      borderRight:`3px solid ${m.color}`,
      borderRadius:'var(--rs2)',
      padding:'.7rem .85rem',
      marginBottom:'.45rem',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.25rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
          <TypeBadge plan={plan}/>
          <StatusPill status={plan.status}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
          <span style={{ fontSize:'.65rem', color:'var(--text3)' }}>{plan.startDate}</span>
          <div style={{display:'flex',gap:'.3rem'}}>
            {(plan.status === 'current' || plan.status === 'future') && !plan.evaluation && onEdit && (
              <Btn size="sm" onClick={e=>{e.stopPropagation();onEdit(plan)}}>✏️ تعديل</Btn>
            )}
            {plan.status === 'current' && !plan.evaluation && onEval && (
              <Btn variant="p" size="sm" onClick={onEval}>تقييم</Btn>
            )}
          </div>
        </div>
      </div>
      <PlanSummary plan={plan}/>
      <EvalResult plan={plan}/>
      {plan.evaluation && onEditEval && (
        <div style={{marginTop:'.35rem',textAlign:'left'}}>
          <Btn size="sm" onClick={e=>{e.stopPropagation();onEditEval(plan)}}>✏️ تعديل التقييم</Btn>
        </div>
      )}
    </div>
  )
}

// ── نموذج إضافة مقرر ─────────────────────────────────────────────────
function AddPlanModal({ open, targetStudent, students, teacherId, onClose, onSave }) {
  const [selectedStudentId, setSelectedStudentId] = useState(targetStudent?.id || null)
  const [planType,  setPlanType]  = useState('حفظ')
  const [sardType,  setSardType]  = useState('full')
  const [startDate, setStartDate] = useState('')
  const [newMem,    setNewMem]    = useState('')
  const [recentMem, setRecentMem] = useState('')
  const [oldMem,    setOldMem]    = useState('')
  const [sardText,  setSardText]  = useState('')
  const [sardNotes, setSardNotes] = useState('')
  const [phaseDesc, setPhaseDesc] = useState('')
  const [notes,     setNotes]     = useState('')

  // إعادة ضبط الطالب عند فتح المودال
  useEffect(() => { setSelectedStudentId(targetStudent?.id || null) }, [targetStudent])

  function reset() {
    setPlanType('حفظ'); setSardType('full'); setStartDate('')
    setNewMem(''); setRecentMem(''); setOldMem('')
    setSardText(''); setSardNotes(''); setPhaseDesc(''); setNotes('')
  }

  const [saveErr, setSaveErr] = useState('')

  function handleSave() {
    setSaveErr('')
    if (!selectedStudentId) { setSaveErr('يرجى اختيار طالب'); return }
    if (planType==='حفظ' && !newMem.trim()) { setSaveErr('يرجى إدخال الحفظ الجديد'); return }
    if (planType==='سرد' && !sardText.trim()) { setSaveErr('يرجى إدخال مقرر السرد'); return }
    if (planType==='تقييم مرحلة' && !phaseDesc.trim()) { setSaveErr('يرجى إدخال وصف المرحلة'); return }
    const chosenDate = startDate || new Date().toISOString().slice(0,10)
    const today = new Date(); today.setHours(0,0,0,0)
    const start = new Date(chosenDate); start.setHours(0,0,0,0)
    const end   = new Date(start); end.setDate(end.getDate() + 6)
    const autoStatus = today < start ? 'future' : today <= end ? 'current' : 'past'
    const plan = {
      studentId: selectedStudentId,
      teacherId: teacherId,
      type: planType,
      sardSubtype: planType === 'سرد' ? sardType : null,
      startDate: chosenDate,
      newMem:    planType === 'حفظ' ? newMem    : null,
      recentMem: planType === 'حفظ' ? recentMem : null,
      oldMem:    planType === 'حفظ' ? oldMem    : null,
      sardText:  planType === 'سرد' ? sardText  : null,
      sardNotes: planType === 'سرد' ? sardNotes : null,
      phaseDesc: planType === 'تقييم مرحلة' ? phaseDesc : null,
      notes,
      status: autoStatus,
      evaluation: null,
      dailyReports: {},
    }
    onSave(plan)
    reset()
  }

  const inp = (label, val, setVal, ph, type='text') => (
    <div style={{ marginBottom:'.6rem' }}>
      <div style={{ fontSize:'.74rem', color:'var(--text2)', marginBottom:'.25rem', fontWeight:700 }}>{label}</div>
      <input type={type} value={val} onChange={e=>setVal(e.target.value)} placeholder={ph}
        style={{ width:'100%', background:'var(--card2)', border:'1px solid var(--border)', borderRadius:'var(--rx)', padding:'.48rem .7rem', color:'var(--text)', fontFamily:'inherit', fontSize:'.82rem' }}/>
    </div>
  )

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="➕ إضافة مقرر أسبوعي" maxWidth={460}>

      {/* اختيار الطالب */}
      <div style={{ marginBottom:'.85rem' }}>
        <div style={{ fontSize:'.78rem', color:'var(--text2)', fontWeight:700, marginBottom:'.4rem' }}>
          الطالب <span style={{ color:'var(--red)' }}>*</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'.3rem' }}>
          {students.map(s => (
            <div key={s.id} onClick={() => setSelectedStudentId(s.id)} style={{
              display:'flex', alignItems:'center', gap:'.6rem',
              padding:'.5rem .75rem', borderRadius:'var(--rs2)',
              border:`2px solid ${selectedStudentId===s.id ? 'var(--green)' : 'var(--border)'}`,
              background: selectedStudentId===s.id ? 'var(--gs)' : 'var(--card2)',
              cursor:'pointer', transition:'all .15s',
            }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'.82rem', fontWeight:700, color: selectedStudentId===s.id ? 'var(--green)' : 'var(--text)' }}>{s.name}</div>
                <div style={{ fontSize:'.68rem', color:'var(--text3)' }}>{s.level}</div>
              </div>
              {selectedStudentId === s.id && <span style={{ color:'var(--green)', fontWeight:900 }}>✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* نوع المقرر */}
      <div style={{ marginBottom:'.75rem' }}>
        <div style={{ fontSize:'.78rem', color:'var(--text2)', fontWeight:700, marginBottom:'.4rem' }}>نوع المقرر</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.4rem' }}>
          {[['حفظ','📖','var(--green)','var(--gs)'],['سرد','🎙️','var(--purple)','var(--ps)'],['تقييم مرحلة','⭐','var(--gold)','var(--golds)']].map(([t,ico,c,bg]) => (
            <div key={t} onClick={() => setPlanType(t)} style={{
              background: planType===t ? bg : 'var(--card2)',
              border:`2px solid ${planType===t ? c : 'var(--border)'}`,
              borderRadius:'var(--rs2)', padding:'.7rem .4rem', textAlign:'center',
              cursor:'pointer', fontSize:'.78rem', fontWeight:700,
              color: planType===t ? c : 'var(--text2)', transition:'all .15s',
            }}>{ico} {t}</div>
          ))}
        </div>
      </div>

      {/* تاريخ البدء */}
      {inp('تاريخ البدء (الأحد)', startDate, setStartDate, '', 'date')}

      {/* حقول حفظ */}
      {planType === 'حفظ' && <>
        {inp('الحفظ الجديد', newMem, setNewMem, 'مثال: الآيات 1-10 من سورة البقرة')}
        {inp('الحفظ القريب', recentMem, setRecentMem, 'مثال: سورة الملك كاملة')}
        {inp('الحفظ القديم', oldMem, setOldMem, 'مثال: جزء عم كاملاً')}
      </>}

      {/* حقول سرد */}
      {planType === 'سرد' && <>
        <div style={{ marginBottom:'.6rem' }}>
          <div style={{ fontSize:'.74rem', color:'var(--text2)', fontWeight:700, marginBottom:'.35rem' }}>نوع السرد</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.4rem' }}>
            {[['full','📖 سرد كامل','سرد كامل للمقرر'],['review','🔁 مراجعة (مقاطع)','مراجعة مقاطع محددة']].map(([v,t,d]) => (
              <div key={v} onClick={() => setSardType(v)} style={{
                background: sardType===v ? 'var(--bs)' : 'var(--card2)',
                border:`2px solid ${sardType===v ? 'var(--blue)' : 'var(--border)'}`,
                borderRadius:'var(--rs2)', padding:'.6rem', cursor:'pointer', textAlign:'center', transition:'all .15s',
              }}>
                <div style={{ fontSize:'.78rem', fontWeight:800, color: sardType===v ? 'var(--blue)' : 'var(--text)' }}>{t}</div>
                <div style={{ fontSize:'.66rem', color:'var(--text2)', marginTop:'.1rem' }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
        {inp(sardType==='full'?'مقرر السرد الكامل':'مقاطع المراجعة', sardText, setSardText, sardType==='full'?'مثال: سورة الكهف كاملة':'مثال: آل عمران 1-50')}
        {inp('ملاحظات السرد (اختياري)', sardNotes, setSardNotes, 'ملاحظات...')}
      </>}

      {/* حقول تقييم مرحلة */}
      {planType === 'تقييم مرحلة' && <>
        <div style={{ background:'var(--golds)', border:'1px solid rgba(245,158,11,.2)', borderRadius:'var(--rx)', padding:'.55rem .8rem', marginBottom:'.6rem', fontSize:'.76rem', color:'var(--gold)' }}>
          ⭐ الدرجة من 80 — لتقييم تقدم الطالب في جزء محدد.
        </div>
        {inp('وصف المرحلة', phaseDesc, setPhaseDesc, 'مثال: تقييم جزء عم، سورة البقرة...')}
      </>}

      {/* ملاحظات عامة */}
      <div style={{ marginBottom:'.65rem' }}>
        <div style={{ fontSize:'.74rem', color:'var(--text2)', fontWeight:700, marginBottom:'.25rem' }}>ملاحظات عامة (اختياري)</div>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
          style={{ width:'100%', background:'var(--card2)', border:'1px solid var(--border)', borderRadius:'var(--rx)', padding:'.48rem .7rem', color:'var(--text)', fontFamily:'inherit', fontSize:'.8rem', resize:'none' }}/>
      </div>

      {saveErr && <div style={{color:'var(--red)',fontSize:'.76rem',marginBottom:'.55rem',padding:'.4rem .65rem',background:'var(--rs)',borderRadius:'var(--rx)'}}>⚠️ {saveErr}</div>}
      <div style={{ display:'flex', gap:'.5rem' }}>
        <Btn style={{ flex:1, justifyContent:'center' }} onClick={() => { reset(); onClose() }}>إلغاء</Btn>
        <Btn variant="p" style={{ flex:1, justifyContent:'center' }} onClick={handleSave}>💾 حفظ المقرر</Btn>
      </div>
    </Modal>
  )
}

// ── نموذج التقييم ────────────────────────────────────────────────────
function EvalModal({ open, student, plan, onClose, onSave }) {
  const [scores, setScores] = useState({ new:35, recent:18, old:38, rev:88, phase:68 })
  const [passes, setPasses] = useState({ new:true, old:true, rev:true, phase:true })
  const [evalNotes, setEvalNotes] = useState('')

  if (!plan) return null

  const pts = () => {
    if (plan.type === 'حفظ') return Math.floor((scores.new + scores.recent + scores.old) / 10)
    if (plan.type === 'سرد') return Math.floor(scores.rev / 10)
    if (plan.type === 'تقييم مرحلة') return Math.floor(scores.phase / 10)
    return 0
  }
  const p = pts()
  const stars = p>=9?3:p>=6?2:p>=3?1:0

  function scoreField(label, key, max, showPass, passKey) {
    return (
      <div style={{ marginBottom:'.9rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.78rem', color:'var(--text2)', marginBottom:'.35rem' }}>
          <span>{label} <span style={{ color:'var(--text3)', fontSize:'.68rem' }}>من {max}</span></span>
          <strong style={{ color:'var(--text)', fontSize:'.92rem' }}>{scores[key]}</strong>
        </div>
        <input type="range" min={0} max={max} value={scores[key]}
          onChange={e => setScores(prev => ({...prev, [key]:+e.target.value}))}
          style={{ width:'100%' }}/>
        {showPass && (
          <div style={{ display:'flex', gap:'.4rem', marginTop:'.35rem' }}>
            {[true,false].map(v => (
              <button key={String(v)} onClick={() => setPasses(prev => ({...prev, [passKey]:v}))} style={{
                flex:1, padding:'.38rem', borderRadius:'var(--rx)', border:'1px solid var(--border)',
                background: passes[passKey]===v ? (v?'rgba(34,197,94,.18)':'var(--rs)') : 'var(--card2)',
                color: passes[passKey]===v ? (v?'var(--green)':'var(--red)') : 'var(--text2)',
                fontSize:'.76rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit',
              }}>{v ? '✓ يُجاز' : '✕ لا يُجاز'}</button>
            ))}
          </div>
        )}
      </div>
    )
  }

  function handleSave() {
    const ev = {}
    if (plan.type === 'حفظ') {
      Object.assign(ev, { newScore:scores.new, recentScore:scores.recent, oldScore:scores.old, newPass:passes.new, oldPass:passes.old })
    } else if (plan.type === 'سرد') {
      Object.assign(ev, { revScore:scores.rev, revPass:passes.rev })
    } else {
      Object.assign(ev, { phaseScore:scores.phase, phasePass:passes.phase })
    }
    Object.assign(ev, { notes:evalNotes, points:p, stars, date:new Date().toISOString().slice(0,10) })
    onSave(plan.id, ev)
  }

  const m = typeMeta(plan)

  return (
    <Modal open={open} onClose={onClose} title={`📝 تقييم: ${student?.name || ''}`} maxWidth={420}>
      {/* info */}
      <div style={{ display:'flex', alignItems:'center', gap:'.5rem', padding:'.55rem .8rem', background:'var(--card2)', border:'1px solid var(--border)', borderRadius:'var(--rs2)', marginBottom:'1rem', fontSize:'.78rem' }}>
        <TypeBadge plan={plan}/>
        <span style={{ color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {plan.type==='حفظ' ? plan.newMem : plan.type==='سرد' ? plan.sardText : plan.phaseDesc}
        </span>
      </div>

      {plan.type==='حفظ' && <>
        {scoreField('الحفظ الجديد', 'new', 40, true, 'new')}
        {scoreField('الحفظ القريب', 'recent', 20, false, null)}
        {scoreField('الحفظ القديم', 'old', 40, true, 'old')}
      </>}
      {plan.type==='سرد' && scoreField('درجة السرد', 'rev', 100, true, 'rev')}
      {plan.type==='تقييم مرحلة' && scoreField('درجة التقييم', 'phase', 100, true, 'phase')}

      {/* نقاط */}
      <div style={{ background:'var(--gs)', border:'1px solid rgba(34,197,94,.2)', borderRadius:'var(--rs2)', padding:'.65rem', margin:'.75rem 0', textAlign:'center' }}>
        <div style={{ fontSize:'.68rem', color:'var(--green)', marginBottom:'.2rem' }}>النقاط المتوقعة</div>
        <div style={{ fontSize:'1.8rem', fontWeight:900, color:'var(--green)', lineHeight:1 }}>{p}</div>
        <div style={{ fontSize:'.9rem', color:'var(--gold)', marginTop:'.15rem' }}>{'★'.repeat(stars)}{'☆'.repeat(3-stars)}</div>
        <div style={{ fontSize:'.66rem', color:'var(--text2)', marginTop:'.15rem' }}>كل 30 نقطة = نجمة في الدورة</div>
      </div>

      <div style={{ marginBottom:'.65rem' }}>
        <div style={{ fontSize:'.74rem', color:'var(--text2)', fontWeight:700, marginBottom:'.25rem' }}>ملاحظات</div>
        <textarea value={evalNotes} onChange={e=>setEvalNotes(e.target.value)} rows={2} placeholder="ملاحظات التقييم..."
          style={{ width:'100%', background:'var(--card2)', border:'1px solid var(--border)', borderRadius:'var(--rx)', padding:'.48rem .7rem', color:'var(--text)', fontFamily:'inherit', fontSize:'.8rem', resize:'none' }}/>
      </div>

      <div style={{ display:'flex', gap:'.5rem' }}>
        <Btn style={{ flex:1, justifyContent:'center' }} onClick={onClose}>إلغاء</Btn>
        <Btn variant="p" style={{ flex:1, justifyContent:'center' }} onClick={handleSave}>✓ حفظ التقييم</Btn>
      </div>
    </Modal>
  )
}

// ── شاشة المتخلفين المشتركة (معلم + مشرف) ───────────────────────────
function MissingView({ students, plans, showToast, onAddPlan, canAdd }) {
  const DAYS_AR_FULL = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']
  const today = new Date()

  const sundayOfWeek = () => {
    const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-d.getDay()); return d.toISOString().slice(0,10)
  }
  const [dateMode, setDateMode] = useState('week')
  const [fromDate, setFromDate] = useState(sundayOfWeek)
  const [toDate,   setToDate]   = useState(() => {
    const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10)
  })

  const fromD = (() => { const d=new Date(dateMode==='week'?sundayOfWeek():fromDate); d.setHours(0,0,0,0); return d })()
  const toD   = (() => { const d=new Date(dateMode==='week'?today:toDate); d.setHours(23,59,59,999); return d })()

  const dayRange = (() => {
    const days=[]; const cur=new Date(fromD)
    while(cur<=toD && days.length<14){
      days.push({date:cur.toISOString().slice(0,10),dayIdx:cur.getDay(),label:DAYS_AR_FULL[cur.getDay()],dateStr:`${cur.getDate()}/${cur.getMonth()+1}`})
      cur.setDate(cur.getDate()+1)
    }
    return days
  })()

  const matrix = students.map(stu => {
    const stuPlans=(plans||[]).filter(p=>{
      if(p.studentId!==stu.id)return false
      const s=new Date(p.startDate);s.setHours(0,0,0,0)
      const e=new Date(s);e.setDate(e.getDate()+6)
      return s<=toD&&e>=fromD
    })
    const hasPlan=stuPlans.length>0
    const reportedDates=new Set()
    stuPlans.forEach(p=>{
      Object.entries(p.dailyReports||{}).forEach(([di,])=>{
        const ps=new Date(p.startDate);ps.setHours(0,0,0,0)
        const dd=new Date(ps);dd.setDate(ps.getDate()+Number(di))
        reportedDates.add(dd.toISOString().slice(0,10))
      })
    })
    const dayStatus=dayRange.map(d=>({...d,sent:reportedDates.has(d.date),isSaturday:d.dayIdx===6}))
    const workDays=dayStatus.filter(d=>hasPlan&&!d.isSaturday)
    const sentCount=workDays.filter(d=>d.sent).length
    const pct=workDays.length>0?Math.round(sentCount/workDays.length*100):0
    return {stu,dayStatus,hasPlan,pct,sentCount,workTotal:workDays.length}
  })

  const todayStr = today.toISOString().slice(0,10)
  const inpSt = {background:'var(--card2)',border:'1px solid var(--border)',borderRadius:'var(--rx)',padding:'.42rem .65rem',color:'var(--text)',fontFamily:'inherit',fontSize:'.8rem',outline:'none',width:'100%'}

  return (
    <>
      {/* فلتر التاريخ */}
      <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'.85rem',marginBottom:'.85rem'}}>
        <div style={{display:'flex',gap:'.4rem',marginBottom:'.6rem'}}>
          {[['week','📅 الأسبوع الحالي'],['custom','🔍 فترة مخصصة']].map(([v,l])=>(
            <button key={v} onClick={()=>setDateMode(v)} style={{padding:'.35rem .85rem',borderRadius:'var(--rs2)',cursor:'pointer',fontFamily:'inherit',fontSize:'.78rem',fontWeight:700,border:`2px solid ${dateMode===v?'var(--green)':'var(--border)'}`,background:dateMode===v?'var(--gs)':'var(--card2)',color:dateMode===v?'var(--green)':'var(--text2)'}}>
              {l}
            </button>
          ))}
        </div>
        {dateMode==='custom' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.5rem',marginBottom:'.55rem'}}>
            <div>
              <div style={{fontSize:'.72rem',color:'var(--text2)',fontWeight:700,marginBottom:'.25rem'}}>من تاريخ</div>
              <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={inpSt}/>
            </div>
            <div>
              <div style={{fontSize:'.72rem',color:'var(--text2)',fontWeight:700,marginBottom:'.25rem'}}>إلى تاريخ</div>
              <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={inpSt}/>
            </div>
          </div>
        )}
        <div style={{fontSize:'.72rem',color:'var(--text2)'}}>
          📋 {fromD.toLocaleDateString('ar')} ← {toD.toLocaleDateString('ar')} ({dayRange.length} يوم)
        </div>
      </div>

      {/* الجدول */}
      <div style={{overflowX:'auto',marginBottom:'.85rem'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'.74rem',minWidth:320,border:'2px solid var(--border2)'}}>
          <thead>
            <tr style={{background:'var(--card3)'}}>
              <th style={{textAlign:'center',padding:'.45rem .4rem',fontWeight:700,color:'var(--text2)',border:'1.5px solid var(--border2)',whiteSpace:'nowrap',width:36}}>#</th>
              <th style={{textAlign:'right',padding:'.45rem .7rem',fontWeight:700,color:'var(--text2)',border:'1.5px solid var(--border2)',whiteSpace:'nowrap',position:'sticky',right:0,background:'var(--card3)',zIndex:1}}>الطالب</th>
              {dayRange.map(d=>(
                <th key={d.date} style={{padding:'.45rem .4rem',fontWeight:700,border:'1.5px solid var(--border2)',color:d.date===todayStr?'var(--green)':d.isSaturday?'var(--text3)':'var(--text2)',textAlign:'center',whiteSpace:'nowrap',minWidth:46}}>
                  <div>{d.label}</div>
                  <div style={{fontSize:'.6rem',fontWeight:400,color:'var(--text3)'}}>{d.dateStr}</div>
                </th>
              ))}
              <th style={{padding:'.45rem .55rem',fontWeight:700,border:'1.5px solid var(--border2)',color:'var(--text2)',textAlign:'center',whiteSpace:'nowrap'}}>الإنجاز</th>
            </tr>
          </thead>
          <tbody>
            {[...matrix].sort((a,b)=>b.pct-a.pct).map(({stu,dayStatus,hasPlan,pct,sentCount,workTotal},ri)=>(
              <tr key={stu.id} style={{background:ri%2===0?'var(--card2)':'var(--card3)'}}>
                <td style={{padding:'.5rem .4rem',textAlign:'center',border:'1.5px solid var(--border2)',fontWeight:700,color:'var(--text2)',fontSize:'.8rem'}}>{ri+1}</td>
                <td style={{padding:'.6rem .85rem',border:'1.5px solid var(--border2)',position:'sticky',right:0,background:ri%2===0?'var(--card2)':'var(--card3)',zIndex:1}}>
                  <span style={{fontWeight:800,fontSize:'1rem',color:'var(--text)'}}>{stu.name}</span>
                </td>
                {dayStatus.map(d=>(
                  <td key={d.date} style={{padding:'.5rem .4rem',textAlign:'center',border:'1.5px solid var(--border2)'}}>
                    {!hasPlan?<span style={{color:'var(--text3)'}}>—</span>
                    :d.isSaturday?<span style={{color:'var(--text3)',fontSize:'.68rem'}}>تقييم</span>
                    :d.sent
                      ?<div style={{width:34,height:34,borderRadius:'50%',background:'#16a34a',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',fontWeight:700,color:'#fff',boxShadow:'0 2px 8px rgba(22,163,74,.4)'}}>✓</div>
                      :<div style={{width:34,height:34,borderRadius:'50%',background:'#dc2626',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',fontWeight:700,color:'#fff',boxShadow:'0 2px 8px rgba(220,38,38,.4)'}}>✕</div>}
                  </td>
                ))}
                <td style={{padding:'.5rem .55rem',textAlign:'center',border:'1.5px solid var(--border2)'}}>
                  {!hasPlan
                    ?<span style={{fontSize:'.7rem',color:'var(--text3)'}}>بدون مقرر</span>
                    :<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'.15rem'}}>
                      <span style={{fontSize:'.95rem',fontWeight:900,color:pct===100?'var(--green)':pct>=50?'var(--gold)':'var(--red)'}}>{pct}%</span>
                      <span style={{fontSize:'.6rem',color:'var(--text3)'}}>{sentCount}/{workTotal}</span>
                    </div>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ملخص */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'.5rem',marginBottom:'.85rem'}}>
        {[[matrix.filter(r=>r.hasPlan&&r.pct===100).length,'إنجاز 100%','var(--green)'],[matrix.filter(r=>r.hasPlan&&r.pct>0&&r.pct<100).length,'إنجاز جزئي','var(--gold)'],[matrix.filter(r=>r.hasPlan&&r.pct===0).length,'لم يُرسل','var(--red)']].map(([n,l,cl])=>(
          <div key={l} style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:'var(--rs2)',padding:'.65rem',textAlign:'center'}}>
            <div style={{fontSize:'1.5rem',fontWeight:900,color:cl,lineHeight:1}}>{n}</div>
            <div style={{fontSize:'.68rem',color:'var(--text2)',marginTop:'.2rem'}}>{l}</div>
          </div>
        ))}
      </div>

      {/* بدون مقرر */}
      {matrix.filter(r=>!r.hasPlan).length>0&&(
        <div style={{background:'rgba(239,68,68,.04)',border:'1px solid rgba(239,68,68,.2)',borderRadius:'var(--r)',padding:'.85rem'}}>
          <div style={{fontSize:'.84rem',fontWeight:800,color:'var(--red)',marginBottom:'.5rem'}}>📭 بدون مقرر ({matrix.filter(r=>!r.hasPlan).length})</div>
          {matrix.filter(r=>!r.hasPlan).map(({stu})=>(
            <div key={stu.id} style={{display:'flex',alignItems:'center',gap:'.6rem',background:'var(--card2)',border:'1px solid var(--border)',borderRadius:'var(--rs2)',padding:'.6rem .85rem',marginBottom:'.35rem'}}>
              <div style={{flex:1}}><div style={{fontSize:'.82rem',fontWeight:700}}>{stu.name}</div><div style={{fontSize:'.68rem',color:'var(--text2)'}}>{stu.level} جزء</div></div>
              {canAdd && onAddPlan
                ?<button onClick={()=>onAddPlan(stu)} style={{background:'linear-gradient(135deg,var(--green),var(--green2))',color:'#fff',border:'none',borderRadius:'var(--rx)',padding:'.32rem .75rem',fontSize:'.72rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ مقرر</button>
                :<span style={{fontSize:'.7rem',color:'var(--text3)'}}>—</span>
              }
            </div>
          ))}
        </div>
      )}
    </>
  )
}


// ── نموذج تعديل مقرر ─────────────────────────────────────────────────
function EditPlanModal({ open, plan, onClose, onSave }) {
  const [planType,  setPlanType]  = useState(plan?.type || 'حفظ')
  const [sardType,  setSardType]  = useState(plan?.sardSubtype || 'full')
  const [startDate, setStartDate] = useState(plan?.startDate || '')
  const [newMem,    setNewMem]    = useState(plan?.newMem    || '')
  const [recentMem, setRecentMem] = useState(plan?.recentMem || '')
  const [oldMem,    setOldMem]    = useState(plan?.oldMem    || '')
  const [sardText,  setSardText]  = useState(plan?.sardText  || '')
  const [sardNotes, setSardNotes] = useState(plan?.sardNotes || '')
  const [phaseDesc, setPhaseDesc] = useState(plan?.phaseDesc || '')
  const [notes,     setNotes]     = useState(plan?.notes     || '')
  const [err,       setErr]       = useState('')

  useEffect(() => {
    if (!plan) return
    setPlanType(plan.type||'حفظ'); setSardType(plan.sardSubtype||'full')
    setStartDate(plan.startDate||''); setNewMem(plan.newMem||'')
    setRecentMem(plan.recentMem||''); setOldMem(plan.oldMem||'')
    setSardText(plan.sardText||''); setSardNotes(plan.sardNotes||'')
    setPhaseDesc(plan.phaseDesc||''); setNotes(plan.notes||''); setErr('')
  }, [plan])

  function handleSave() {
    if (planType==='حفظ' && !newMem.trim()) { setErr('الحفظ الجديد مطلوب'); return }
    if (planType==='سرد' && !sardText.trim()) { setErr('مقرر السرد مطلوب'); return }
    if (planType==='تقييم مرحلة' && !phaseDesc.trim()) { setErr('وصف المرحلة مطلوب'); return }
    const today = new Date(); today.setHours(0,0,0,0)
    const start = new Date(startDate); start.setHours(0,0,0,0)
    const end   = new Date(start); end.setDate(end.getDate()+6)
    const status = today<start?'future':today<=end?'current':'past'
    onSave({
      type:planType, sardSubtype:planType==='سرد'?sardType:null, startDate, status,
      newMem:planType==='حفظ'?newMem:null, recentMem:planType==='حفظ'?recentMem:null, oldMem:planType==='حفظ'?oldMem:null,
      sardText:planType==='سرد'?sardText:null, sardNotes:planType==='سرد'?sardNotes:null,
      phaseDesc:planType==='تقييم مرحلة'?phaseDesc:null, notes,
    })
  }

  const inp = {width:'100%',background:'var(--card2)',border:'1px solid var(--border)',borderRadius:'var(--rx)',padding:'.48rem .7rem',color:'var(--text)',fontFamily:'inherit',fontSize:'.82rem',outline:'none'}

  return (
    <Modal open={open} onClose={onClose} title="✏️ تعديل المقرر" maxWidth={440}>
      <div style={{background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)',borderRadius:'var(--rx)',padding:'.5rem .75rem',marginBottom:'.75rem',fontSize:'.76rem',color:'var(--gold)'}}>
        ✏️ التعديل متاح فقط للمقررات غير المقيّمة
      </div>

      <div style={{marginBottom:'.6rem'}}>
        <div style={{fontSize:'.72rem',color:'var(--text2)',fontWeight:700,marginBottom:'.25rem'}}>تاريخ البدء</div>
        <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{...inp}}/>
      </div>

      <div style={{marginBottom:'.75rem'}}>
        <div style={{fontSize:'.72rem',color:'var(--text2)',fontWeight:700,marginBottom:'.4rem'}}>نوع المقرر</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'.4rem'}}>
          {[['حفظ','📖','var(--green)','var(--gs)'],['سرد','🎙️','var(--purple)','var(--ps)'],['تقييم مرحلة','⭐','var(--gold)','var(--golds)']].map(([t,ico,col,bg])=>(
            <div key={t} onClick={()=>setPlanType(t)} style={{background:planType===t?bg:'var(--card2)',border:`2px solid ${planType===t?col:'var(--border)'}`,borderRadius:'var(--rs2)',padding:'.6rem .4rem',textAlign:'center',cursor:'pointer',fontSize:'.75rem',fontWeight:700,color:planType===t?col:'var(--text2)'}}>
              {ico} {t}
            </div>
          ))}
        </div>
      </div>

      {planType==='حفظ' && <>
        {[['الحفظ الجديد *',newMem,setNewMem],['الحفظ القريب',recentMem,setRecentMem],['الحفظ القديم',oldMem,setOldMem]].map(([l,v,s])=>(
          <div key={l} style={{marginBottom:'.5rem'}}>
            <div style={{fontSize:'.72rem',color:'var(--text2)',fontWeight:700,marginBottom:'.25rem'}}>{l}</div>
            <input value={v} onChange={e=>s(e.target.value)} style={{...inp}}/>
          </div>
        ))}
      </>}

      {planType==='سرد' && <>
        <div style={{marginBottom:'.55rem'}}>
          <div style={{fontSize:'.72rem',color:'var(--text2)',fontWeight:700,marginBottom:'.35rem'}}>نوع السرد</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.4rem'}}>
            {[['full','📖 سرد كامل'],['review','🔁 مراجعة']].map(([v,l])=>(
              <div key={v} onClick={()=>setSardType(v)} style={{background:sardType===v?'var(--bs)':'var(--card2)',border:`2px solid ${sardType===v?'var(--blue)':'var(--border)'}`,borderRadius:'var(--rs2)',padding:'.5rem',textAlign:'center',cursor:'pointer',fontSize:'.78rem',fontWeight:700,color:sardType===v?'var(--blue)':'var(--text)'}}>
                {l}
              </div>
            ))}
          </div>
        </div>
        <div style={{marginBottom:'.5rem'}}>
          <div style={{fontSize:'.72rem',color:'var(--text2)',fontWeight:700,marginBottom:'.25rem'}}>مقرر السرد *</div>
          <input value={sardText} onChange={e=>setSardText(e.target.value)} style={{...inp}}/>
        </div>
        <div style={{marginBottom:'.5rem'}}>
          <div style={{fontSize:'.72rem',color:'var(--text2)',fontWeight:700,marginBottom:'.25rem'}}>ملاحظات</div>
          <input value={sardNotes} onChange={e=>setSardNotes(e.target.value)} style={{...inp}}/>
        </div>
      </>}

      {planType==='تقييم مرحلة' && (
        <div style={{marginBottom:'.5rem'}}>
          <div style={{fontSize:'.72rem',color:'var(--text2)',fontWeight:700,marginBottom:'.25rem'}}>وصف المرحلة *</div>
          <input value={phaseDesc} onChange={e=>setPhaseDesc(e.target.value)} style={{...inp}}/>
        </div>
      )}

      <div style={{marginBottom:'.5rem'}}>
        <div style={{fontSize:'.72rem',color:'var(--text2)',fontWeight:700,marginBottom:'.25rem'}}>ملاحظات عامة</div>
        <input value={notes} onChange={e=>setNotes(e.target.value)} style={{...inp}}/>
      </div>

      {err && <div style={{color:'var(--red)',fontSize:'.76rem',marginBottom:'.5rem',padding:'.4rem .65rem',background:'var(--rs)',borderRadius:'var(--rx)'}}>⚠️ {err}</div>}

      <div style={{display:'flex',gap:'.5rem',marginTop:'.5rem'}}>
        <Btn style={{flex:1,justifyContent:'center'}} onClick={onClose}>إلغاء</Btn>
        <Btn variant="p" style={{flex:1,justifyContent:'center'}} onClick={handleSave}>💾 حفظ التعديلات</Btn>
      </div>
    </Modal>
  )
}

// ── مكوّن تبويب حضور الطلاب ──────────────────────────────────────────
function AttendanceTab({ myStudents, stuAttendance, setStuAttendance, showToast }) {
  const todayISO = new Date().toISOString().slice(0,10)
  const DAYS_AR_LOCAL = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']

  const [selDate,  setSelDate]  = useState(todayISO)
  const [showForm, setShowForm] = useState(false)
  const [draft,    setDraft]    = useState({})
  const [expandedDate, setExpanded] = useState(null)

  const S = {
    present: { label:'حاضر',    bg:'var(--gs)',    border:'rgba(34,197,94,.45)', color:'var(--green)', icon:'✅' },
    late:    { label:'متأخر',   bg:'var(--bs)',    border:'rgba(59,130,246,.45)',color:'var(--blue)',  icon:'🕐' },
    absent:  { label:'غائب',    bg:'var(--rs)',    border:'rgba(239,68,68,.45)', color:'var(--red)',   icon:'❌' },
    excused: { label:'استأذان', bg:'var(--golds)', border:'rgba(245,158,11,.45)',color:'var(--gold)',  icon:'🟡' },
  }

  function loadDate(date) {
    const d = stuAttendance[date] || {}
    const nd = {}
    myStudents.forEach(s => { nd[s.id] = d[s.id]?.status || '' })
    setDraft(nd)
  }

  function handleShow() { loadDate(selDate); setShowForm(true) }

  function setStatus(sid, val) {
    setDraft(p => ({...p, [sid]: p[sid]===val ? '' : val}))
  }

  function markAll(val) {
    const d = {}; myStudents.forEach(s => { d[s.id] = val }); setDraft(d)
  }

  function handleSave() {
    const dayData = {}
    myStudents.forEach(s => { if(draft[s.id]) dayData[s.id] = { status: draft[s.id] } })
    setStuAttendance(p => ({...p, [selDate]: dayData}))
    setShowForm(false)
    showToast('✅ تم حفظ الحضور','ok')
  }

  function dayName(ds) {
    const d = new Date(ds+'T00:00:00'); return DAYS_AR_LOCAL[d.getDay()]
  }
  function fmt(ds) { const [y,m,dd]=ds.split('-'); return `${dd}/${m}/${y}` }

  function dayStats(date) {
    const d = stuAttendance[date] || {}
    let p=0,l=0,a=0,e=0
    myStudents.forEach(s => {
      const st = d[s.id]?.status
      if(st==='present') p++; else if(st==='late') l++
      else if(st==='absent') a++; else if(st==='excused') e++
    })
    return {p,l,a,e}
  }

  const presentN  = myStudents.filter(s=>draft[s.id]==='present').length
  const lateN     = myStudents.filter(s=>draft[s.id]==='late').length
  const absentN   = myStudents.filter(s=>draft[s.id]==='absent').length
  const excusedN  = myStudents.filter(s=>draft[s.id]==='excused').length
  const unsetN    = myStudents.filter(s=>!draft[s.id]).length

  const savedDates = Object.keys(stuAttendance).sort((a,b)=>b.localeCompare(a))

  const inp = {width:'100%',background:'var(--card2)',border:'1px solid var(--border)',borderRadius:8,padding:'.45rem .65rem',color:'var(--text)',fontFamily:'inherit',fontSize:'.82rem',outline:'none',boxSizing:'border-box'}

  return (
    <div style={{ flex:1, padding:'1rem', overflowY:'auto' }}>

      {/* اختيار التاريخ */}
      <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'1rem',marginBottom:'1rem'}}>
        <div style={{fontSize:'.8rem',fontWeight:800,marginBottom:'.65rem'}}>📅 تسجيل حضور الطلاب</div>
        <div style={{display:'flex',alignItems:'flex-end',gap:'.6rem',flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:150}}>
            <div style={{fontSize:'.72rem',color:'var(--text2)',fontWeight:700,marginBottom:'.25rem'}}>التاريخ</div>
            <input type="date" value={selDate} onChange={e=>{setSelDate(e.target.value);setShowForm(false)}} style={{...inp,width:'auto'}}/>
          </div>
          <button onClick={handleShow} style={{background:'linear-gradient(135deg,var(--green),var(--green2))',color:'#fff',border:'none',borderRadius:9,padding:'.5rem 1.1rem',fontSize:'.84rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
            👁 عرض
          </button>
        </div>
        {selDate===todayISO && <div style={{fontSize:'.68rem',color:'var(--green)',marginTop:'.3rem',fontWeight:700}}>اليوم</div>}
        {selDate<todayISO   && <div style={{fontSize:'.68rem',color:'var(--text3)',marginTop:'.3rem'}}>يوم سابق · {dayName(selDate)}</div>}
      </div>

      {showForm && (
        <>
          {/* إحصاء */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'.3rem',marginBottom:'.75rem'}}>
            {[[presentN,'حاضر','var(--green)'],[lateN,'متأخر','var(--blue)'],[absentN,'غائب','var(--red)'],[excusedN,'استأذان','var(--gold)'],[unsetN,'لم يُسجَّل','var(--text3)']].map(([n,l,c])=>(
              <div key={l} style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:8,padding:'.4rem .2rem',textAlign:'center'}}>
                <div style={{fontSize:'1.15rem',fontWeight:900,color:c,lineHeight:1}}>{n}</div>
                <div style={{fontSize:'.55rem',color:'var(--text2)',marginTop:'.1rem'}}>{l}</div>
              </div>
            ))}
          </div>

          {/* أزرار جماعية */}
          <div style={{display:'flex',gap:'.35rem',flexWrap:'wrap',marginBottom:'.85rem'}}>
            {[['✅ الكل حاضرين','present','var(--gs)','rgba(34,197,94,.3)','var(--green)'],
              ['❌ الكل غائبين','absent','var(--rs)','rgba(239,68,68,.25)','var(--red)'],
              ['🔄 مسح الكل','','var(--card2)','var(--border)','var(--text2)']
            ].map(([lbl,val,bg,border,color])=>(
              <button key={lbl} onClick={()=>val?markAll(val):markAll('')}
                style={{background:bg,border:`1px solid ${border}`,borderRadius:8,padding:'.35rem .65rem',fontSize:'.73rem',fontWeight:700,cursor:'pointer',color,fontFamily:'inherit',whiteSpace:'nowrap'}}>
                {lbl}
              </button>
            ))}
          </div>

          {/* لا طلاب */}
          {myStudents.length===0 && (
            <div style={{textAlign:'center',padding:'2rem',color:'var(--text3)',fontSize:'.82rem',border:'1px dashed var(--border)',borderRadius:'var(--r)'}}>
              لا يوجد طلاب مرتبطون بك
            </div>
          )}

          {/* صفوف الطلاب */}
          {myStudents.map(s=>{
            const status = draft[s.id]||''
            const ss = S[status]
            return (
              <div key={s.id} style={{background:'var(--card)',border:`1px solid ${ss?ss.border:'var(--border)'}`,borderRadius:'var(--r)',padding:'.75rem .9rem',marginBottom:'.45rem',display:'flex',alignItems:'center',gap:'.6rem',transition:'border-color .15s'}}>
                <div style={{width:38,height:38,borderRadius:11,background:ss?.bg||'var(--card3)',border:`1.5px solid ${ss?.border||'var(--border)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.8rem',fontWeight:900,color:ss?.color||'var(--text2)',flexShrink:0,transition:'all .15s'}}>
                  {status ? ss.icon : (s.avatar||s.name||'?').slice(0,2)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:800,fontSize:'.85rem'}}>{s.name}</div>
                  {status
                    ? <span style={{fontSize:'.68rem',fontWeight:700,color:ss.color}}>{ss.label}</span>
                    : <span style={{fontSize:'.68rem',color:'var(--text3)'}}>لم يُسجَّل</span>
                  }
                </div>
                <div style={{display:'flex',gap:'.28rem',flexShrink:0}}>
                  {Object.entries(S).map(([val,cfg])=>(
                    <button key={val} onClick={()=>setStatus(s.id,val)} title={cfg.label}
                      style={{width:34,height:34,borderRadius:9,border:`2px solid ${status===val?cfg.border:'var(--border)'}`,background:status===val?cfg.bg:'var(--card2)',cursor:'pointer',fontSize:'.95rem',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s',boxShadow:status===val?`0 0 0 2px ${cfg.border}`:'none'}}>
                      {cfg.icon}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}

          {myStudents.length>0 && (
            <div style={{position:'sticky',bottom:'.75rem',marginTop:'.75rem'}}>
              <button onClick={handleSave}
                style={{width:'100%',background:'linear-gradient(135deg,var(--green),var(--green2))',color:'#fff',border:'none',borderRadius:10,padding:'.72rem',fontSize:'.9rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 20px rgba(0,0,0,.25)'}}>
                💾 حفظ حضور {selDate===todayISO?'اليوم':fmt(selDate)}
              </button>
            </div>
          )}
        </>
      )}

      {/* السجلات المحفوظة */}
      {savedDates.length>0 && (
        <div style={{marginTop: showForm?'1.5rem':0}}>
          <div style={{fontSize:'.78rem',fontWeight:800,color:'var(--text2)',marginBottom:'.55rem'}}>🗂️ السجلات المحفوظة ({savedDates.length})</div>
          {savedDates.map(date=>{
            const {p,l,a,e} = dayStats(date)
            const isOpen = expandedDate===date
            return (
              <div key={date} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r)',marginBottom:'.45rem',overflow:'hidden'}}>
                <div style={{display:'flex',alignItems:'center',gap:'.55rem',padding:'.65rem .9rem',cursor:'pointer'}} onClick={()=>setExpanded(isOpen?null:date)}>
                  <div style={{minWidth:75}}>
                    <div style={{fontWeight:800,fontSize:'.82rem'}}>{fmt(date)}</div>
                    <div style={{fontSize:'.64rem',color:'var(--text3)'}}>{dayName(date)}</div>
                  </div>
                  <div style={{flex:1,display:'flex',gap:'.4rem',flexWrap:'wrap',alignItems:'center'}}>
                    {p>0&&<span style={{fontSize:'.7rem',fontWeight:700,color:'var(--green)',background:'var(--gs)',borderRadius:7,padding:'.12rem .45rem',whiteSpace:'nowrap'}}>✅ {p}</span>}
                    {l>0&&<span style={{fontSize:'.7rem',fontWeight:700,color:'var(--blue)', background:'var(--bs)',borderRadius:7,padding:'.12rem .45rem',whiteSpace:'nowrap'}}>🕐 {l}</span>}
                    {a>0&&<span style={{fontSize:'.7rem',fontWeight:700,color:'var(--red)',  background:'var(--rs)',borderRadius:7,padding:'.12rem .45rem',whiteSpace:'nowrap'}}>❌ {a}</span>}
                    {e>0&&<span style={{fontSize:'.7rem',fontWeight:700,color:'var(--gold)', background:'var(--golds)',borderRadius:7,padding:'.12rem .45rem',whiteSpace:'nowrap'}}>🟡 {e}</span>}
                  </div>
                  <button onClick={ev=>{ev.stopPropagation();setSelDate(date);loadDate(date);setShowForm(true);window.scrollTo({top:0,behavior:'smooth'})}}
                    style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:7,width:26,height:26,cursor:'pointer',fontSize:'.72rem',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    ✏️
                  </button>
                  <div style={{fontSize:'.65rem',color:'var(--text3)',flexShrink:0,transition:'transform .15s',transform:isOpen?'rotate(180deg)':'none'}}>▼</div>
                </div>
                {isOpen && (
                  <div style={{borderTop:'1px solid var(--border)',background:'var(--card2)',padding:'.5rem .8rem'}}>
                    {myStudents.map(s=>{
                      const rec = stuAttendance[date]?.[s.id]
                      const cfg = S[rec?.status||'']
                      // إحصاء إجمالي هذا الطالب عبر كل الأيام
                      const tP = Object.values(stuAttendance).filter(d=>d[s.id]?.status==='present').length
                      const tL = Object.values(stuAttendance).filter(d=>d[s.id]?.status==='late').length
                      const tA = Object.values(stuAttendance).filter(d=>d[s.id]?.status==='absent').length
                      const tE = Object.values(stuAttendance).filter(d=>d[s.id]?.status==='excused').length
                      return (
                        <div key={s.id} style={{display:'flex',alignItems:'center',gap:'.45rem',padding:'.42rem .3rem',borderBottom:'1px solid var(--border)'}}>
                          <div style={{width:26,height:26,borderRadius:8,background:cfg?.bg||'var(--card3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.68rem',fontWeight:800,color:cfg?.color||'var(--text2)',flexShrink:0}}>
                            {rec?.status ? cfg.icon : (s.avatar||s.name||'?').slice(0,2)}
                          </div>
                          <div style={{flex:1,fontSize:'.78rem',fontWeight:600,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</div>
                          {/* حالة هذا اليوم */}
                          <span style={{fontSize:'.67rem',fontWeight:700,color:cfg?.color||'var(--text3)',background:cfg?.bg||'var(--card3)',borderRadius:6,padding:'.1rem .4rem',flexShrink:0,minWidth:44,textAlign:'center'}}>
                            {cfg?.label||'—'}
                          </span>
                          {/* إجمالي الطالب */}
                          <div style={{display:'flex',gap:'.22rem',flexShrink:0}}>
                            <span style={{fontSize:'.6rem',color:'var(--green)',background:'var(--gs)',   borderRadius:5,padding:'.08rem .35rem',fontWeight:700}}>{tP}✅</span>
                            <span style={{fontSize:'.6rem',color:'var(--blue)', background:'var(--bs)',   borderRadius:5,padding:'.08rem .35rem',fontWeight:700}}>{tL}🕐</span>
                            <span style={{fontSize:'.6rem',color:'var(--red)',  background:'var(--rs)',   borderRadius:5,padding:'.08rem .35rem',fontWeight:700}}>{tA}❌</span>
                            <span style={{fontSize:'.6rem',color:'var(--gold)', background:'var(--golds)',borderRadius:5,padding:'.08rem .35rem',fontWeight:700}}>{tE}🟡</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {savedDates.length===0 && !showForm && (
        <div style={{textAlign:'center',padding:'2.5rem 1rem',color:'var(--text3)',fontSize:'.82rem',border:'1px dashed var(--border)',borderRadius:'var(--r)',marginTop:'.5rem'}}>
          لا توجد سجلات حضور — اختر تاريخاً واضغط عرض
        </div>
      )}
    </div>
  )
}

// ── مكوّن تبويب ملاحظات الطلاب ───────────────────────────────────────
function NotesTab({ myStudents, stuNotes, setStuNotes, showToast }) {
  const [selStudent,  setSelStudent]  = useState(null)
  const [viewStudent, setViewStudent] = useState(null)
  const [noteType,    setNoteType]    = useState('pos')
  const [noteText,    setNoteText]    = useState('')
  const [noteDate,    setNoteDate]    = useState('')
  const [noteErr,     setNoteErr]     = useState('')

  const todayISO = new Date().toISOString().slice(0,10)

  function openForm(stuId) {
    setSelStudent(stuId); setViewStudent(null)
    setNoteText(''); setNoteErr(''); setNoteType('pos'); setNoteDate(todayISO)
  }

  function addNote(stuId) {
    if(!noteText.trim()){ setNoteErr('يرجى كتابة نص الملاحظة'); return }
    const note = { id: Date.now(), type: noteType, text: noteText.trim(), date: noteDate||todayISO }
    setStuNotes(p=>({ ...p, [stuId]: [...(p[stuId]||[]), note] }))
    setNoteText(''); setNoteErr(''); setSelStudent(null)
    showToast('✅ تم حفظ الملاحظة','ok')
  }

  function deleteNote(stuId, noteId) {
    setStuNotes(p=>({ ...p, [stuId]: (p[stuId]||[]).filter(n=>n.id!==noteId) }))
    showToast('🗑️ تم حذف الملاحظة','')
  }

  function fmt(ds) { const [y,m,dd]=ds.split('-'); return `${dd}/${m}/${y}` }

  const inp = {width:'100%',background:'var(--card2)',border:'1px solid var(--border)',borderRadius:8,padding:'.45rem .65rem',color:'var(--text)',fontFamily:'inherit',fontSize:'.82rem',outline:'none',boxSizing:'border-box'}

  return (
    <div style={{ flex:1, padding:'1rem', overflowY:'auto' }}>

      {myStudents.length===0 && (
        <div style={{textAlign:'center',padding:'3rem 1rem',color:'var(--text3)',fontSize:'.82rem',border:'1px dashed var(--border)',borderRadius:'var(--r)'}}>
          لا يوجد طلاب مرتبطون بك
        </div>
      )}

      {/* بطاقة كل طالب */}
      {myStudents.map(s=>{
        const notes    = stuNotes[s.id] || []
        const posCount = notes.filter(n=>n.type==='pos').length
        const negCount = notes.filter(n=>n.type==='neg').length
        const isAdding = selStudent===s.id
        const isViewing= viewStudent===s.id

        return (
          <div key={s.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r)',marginBottom:'.65rem',overflow:'hidden'}}>

            {/* رأس البطاقة */}
            <div style={{display:'flex',alignItems:'center',gap:'.6rem',padding:'.8rem 1rem'}}>
              <div style={{width:40,height:40,borderRadius:12,background:'var(--card3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.82rem',fontWeight:900,color:'var(--text2)',flexShrink:0}}>
                {(s.avatar||s.name||'?').slice(0,2)}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:800,fontSize:'.86rem'}}>{s.name}</div>
                <div style={{display:'flex',gap:'.5rem',marginTop:'.15rem'}}>
                  <span style={{fontSize:'.68rem',fontWeight:700,color:'var(--green)',background:'var(--gs)',borderRadius:7,padding:'.1rem .45rem'}}>👍 {posCount} إيجابية</span>
                  <span style={{fontSize:'.68rem',fontWeight:700,color:'var(--red)',  background:'var(--rs)',borderRadius:7,padding:'.1rem .45rem'}}>👎 {negCount} سلبية</span>
                </div>
              </div>
              <div style={{display:'flex',gap:'.35rem',flexShrink:0}}>
                {notes.length>0 && (
                  <button onClick={()=>{setViewStudent(isViewing?null:s.id);setSelStudent(null)}}
                    style={{background:isViewing?'var(--bs)':'var(--card2)',border:`1px solid ${isViewing?'rgba(59,130,246,.3)':'var(--border)'}`,borderRadius:8,width:30,height:30,cursor:'pointer',fontSize:'.82rem',display:'flex',alignItems:'center',justifyContent:'center',color:isViewing?'var(--blue)':'var(--text2)'}}>
                    📋
                  </button>
                )}
                <button onClick={()=>{ isAdding ? setSelStudent(null) : openForm(s.id) }}
                  style={{background:isAdding?'var(--gs)':'var(--card2)',border:`1px solid ${isAdding?'rgba(34,197,94,.3)':'var(--border)'}`,borderRadius:8,width:30,height:30,cursor:'pointer',fontSize:'.82rem',display:'flex',alignItems:'center',justifyContent:'center',color:isAdding?'var(--green)':'var(--text2)'}}>
                  ✍️
                </button>
              </div>
            </div>

            {/* نموذج إضافة ملاحظة */}
            {isAdding && (
              <div style={{borderTop:'1px solid var(--border)',background:'var(--card2)',padding:'.75rem 1rem'}}>
                {/* نوع الملاحظة */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.5rem',marginBottom:'.65rem'}}>
                  {[['pos','👍 إيجابية','var(--gs)','rgba(34,197,94,.4)','var(--green)'],
                    ['neg','👎 سلبية',  'var(--rs)','rgba(239,68,68,.4)','var(--red)']
                  ].map(([val,lbl,bg,border,color])=>(
                    <div key={val} onClick={()=>setNoteType(val)}
                      style={{background:noteType===val?bg:'var(--card)',border:`2px solid ${noteType===val?border:'var(--border)'}`,borderRadius:9,padding:'.5rem',textAlign:'center',cursor:'pointer',fontSize:'.8rem',fontWeight:700,color:noteType===val?color:'var(--text2)',transition:'all .15s'}}>
                      {lbl}
                    </div>
                  ))}
                </div>

                {/* التاريخ — قابل للتعديل */}
                <div style={{marginBottom:'.55rem'}}>
                  <div style={{fontSize:'.72rem',color:'var(--text2)',fontWeight:700,marginBottom:'.25rem'}}>📅 تاريخ الملاحظة</div>
                  <input type="date" value={noteDate} onChange={e=>setNoteDate(e.target.value)}
                    style={{...inp,width:'auto'}}/>
                  {noteDate===todayISO && <span style={{fontSize:'.65rem',color:'var(--green)',marginRight:'.5rem',fontWeight:700}}>اليوم</span>}
                </div>

                {/* نص الملاحظة */}
                <div style={{marginBottom:'.5rem'}}>
                  <div style={{fontSize:'.72rem',color:'var(--text2)',fontWeight:700,marginBottom:'.25rem'}}>نص الملاحظة *</div>
                  <textarea value={noteText} onChange={e=>{setNoteText(e.target.value);setNoteErr('')}}
                    placeholder="اكتب الملاحظة هنا..."
                    rows={3}
                    style={{...inp,resize:'vertical',lineHeight:1.5}}
                  />
                </div>

                {noteErr && <div style={{color:'var(--red)',fontSize:'.75rem',marginBottom:'.45rem',padding:'.3rem .6rem',background:'var(--rs)',borderRadius:7}}>⚠️ {noteErr}</div>}

                <div style={{display:'flex',gap:'.4rem'}}>
                  <button onClick={()=>setSelStudent(null)}
                    style={{flex:1,background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'.48rem',fontSize:'.78rem',fontWeight:700,cursor:'pointer',color:'var(--text2)',fontFamily:'inherit'}}>
                    إلغاء
                  </button>
                  <button onClick={()=>addNote(s.id)}
                    style={{flex:2,background:'linear-gradient(135deg,var(--green),var(--green2))',color:'#fff',border:'none',borderRadius:8,padding:'.48rem',fontSize:'.78rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                    💾 حفظ الملاحظة
                  </button>
                </div>
              </div>
            )}

            {/* عرض الملاحظات */}
            {isViewing && notes.length>0 && (
              <div style={{borderTop:'1px solid var(--border)',background:'var(--card2)',padding:'.6rem .9rem'}}>
                {[...notes].sort((a,b)=>b.date.localeCompare(a.date)).map(n=>{
                  const isPos = n.type==='pos'
                  return (
                    <div key={n.id} style={{display:'flex',alignItems:'flex-start',gap:'.5rem',padding:'.5rem .45rem',borderBottom:'1px solid var(--border)'}}>
                      <div style={{width:28,height:28,borderRadius:8,background:isPos?'var(--gs)':'var(--rs)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.82rem',flexShrink:0}}>
                        {isPos?'👍':'👎'}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:'.4rem',marginBottom:'.2rem'}}>
                          <span style={{fontSize:'.7rem',fontWeight:700,color:isPos?'var(--green)':'var(--red)',background:isPos?'var(--gs)':'var(--rs)',borderRadius:6,padding:'.1rem .4rem'}}>
                            {isPos?'إيجابية':'سلبية'}
                          </span>
                          <span style={{fontSize:'.68rem',color:'var(--text3)'}}>{fmt(n.date)}</span>
                        </div>
                        <div style={{fontSize:'.8rem',color:'var(--text)',lineHeight:1.5}}>{n.text}</div>
                      </div>
                      <button onClick={()=>deleteNote(s.id,n.id)}
                        style={{background:'var(--rs)',border:'none',borderRadius:7,width:24,height:24,cursor:'pointer',fontSize:'.72rem',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--red)',flexShrink:0}}>
                        🗑️
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── الشاشة الرئيسية للمعلم ───────────────────────────────────────────
export default function TeacherScreen({ currentUser, allUsers, plans: allPlans, assignments, onLogout, onUpdateUser, onUpdatePlans, showToast, darkMode, onToggleDark }) {
  const myTeacherId = Number(currentUser?.id) || 0
  const allStudents = (allUsers || []).filter(u => u.role === 'student')

  // ── قراءة المجموعات من localStorage (نفس مفتاح AdminScreen) ──────────
  const allGroups = useMemo(()=>{
    try{ return JSON.parse(localStorage.getItem('groups')||'[]') }catch{ return [] }
  }, [])
  const myGroups = allGroups.filter(g => g.teacherId === myTeacherId)

  // ── المجموعة المختارة والتبويب الداخلي ───────────────────────────────
  const [selGroupId, setSelGroupId] = useState(null)   // null = شاشة المجموعات
  const [activeTab,  setActiveTab]  = useState('students') // students|attendance|notes|levels

  const selGroup = myGroups.find(g => g.id === selGroupId) || null
  const myStudents = selGroup
    ? (selGroup.studentIds||[]).map(id => allStudents.find(s=>s.id===id)).filter(Boolean)
    : []

  // ── بقية الـ state ────────────────────────────────────────────────────
  const [showProfile, setShowProfile] = useState(false)

  // حضور الطلاب — مفتاح خاص بكل معلم
  const [stuAttendance, setStuAttendance] = useState(()=>{
    try{return JSON.parse(localStorage.getItem(`stuAtt_${myTeacherId}`)||'{}')}catch{return{}}
  })
  useEffect(()=>{ localStorage.setItem(`stuAtt_${myTeacherId}`, JSON.stringify(stuAttendance)) },[stuAttendance])

  // ملاحظات الطلاب
  const [stuNotes, setStuNotes] = useState(()=>{
    try{return JSON.parse(localStorage.getItem(`stuNotes_${myTeacherId}`)||'{}')}catch{return{}}
  })
  useEffect(()=>{ localStorage.setItem(`stuNotes_${myTeacherId}`, JSON.stringify(stuNotes)) },[stuNotes])

  const [plans, setPlans] = useState(allPlans || [])
  const [evalState,     setEvalState]     = useState({ open:false, student:null, plan:null })
  const [addState,      setAddState]      = useState({ open:false, student:null })
  const [editPlan,      setEditPlan]      = useState(null)
  const [editEvalState, setEditEvalState] = useState({ open:false, student:null, plan:null })

  // مقررات كل طالب
  const myStudentIds = myStudents.map(s=>s.id)
  const plansByStudent = useMemo(() => {
    const map = {}
    myStudents.forEach(s => { map[s.id] = [] })
    plans.forEach(p => { if (map[p.studentId]) map[p.studentId].push(p) })
    return map
  }, [plans, myStudents])

  const pendingEvals  = plans.filter(p => p.status==='current' && !p.evaluation  && myStudentIds.includes(p.studentId)).length
  const evaluatedCnt  = plans.filter(p => p.status==='current' && p.evaluation   && myStudentIds.includes(p.studentId)).length
  const currentCount  = plans.filter(p => p.status==='current' && myStudentIds.includes(p.studentId)).length
  const commitPct     = currentCount > 0 ? Math.round(evaluatedCnt/currentCount*100) : 0

  function openEval(stu, plan)    { setEvalState({ open:true, student:stu, plan }) }
  function openAddPlan(stu=null)  { setAddState({ open:true, student:stu }) }

  function saveEval(planId, evaluation) {
    setPlans(prev => { const u = prev.map(p=>p.id===planId?{...p,evaluation}:p); if(onUpdatePlans)onUpdatePlans(()=>u); return u })
    setEvalState({ open:false, student:null, plan:null })
    showToast('✅ تم حفظ التقييم بنجاح','ok')
  }

  function openEditEval(stu, plan) {
    const later = (plans||[]).filter(p=>p.studentId===stu.id).find(p=>p.startDate>plan.startDate)
    if(later){ showToast('لا يمكن تعديل التقييم — يوجد مقرر لاحق','warn'); return }
    setEditEvalState({ open:true, student:stu, plan })
  }

  function savePlan(planData) {
    const np = {...planData, id:Date.now()}
    setPlans(prev=>{ const u=[...prev,np]; if(onUpdatePlans)onUpdatePlans(()=>u); return u })
    setAddState({ open:false, student:null })
    showToast('✅ تم إضافة المقرر بنجاح','ok')
  }

  // ─── عند الخروج من المجموعة نرجع للقائمة ─────────────────────────────
  function goBack() { setSelGroupId(null); setActiveTab('attendance') }

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', maxWidth:680, margin:'0 auto' }}>

      {/* TOPBAR */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'.7rem 1rem', background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
          {selGroupId && (
            <button onClick={goBack}
              style={{ background:'var(--card2)', border:'1px solid var(--border)', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text2)' }}>
              ◀
            </button>
          )}
          <div style={{ fontWeight:800, fontSize:'1rem', lineHeight:1.2 }}>
            {selGroup ? selGroup.name : '🎓 لوحة المعلم'}
            {selGroup && <div style={{ fontSize:'.65rem', color:'var(--text3)', fontWeight:400 }}>← المجموعات</div>}
          </div>
        </div>
        <div style={{ display:'flex', gap:'.5rem', alignItems:'center' }}>
          <div onClick={()=>setShowProfile(true)} style={{ display:'flex', alignItems:'center', gap:'.35rem', background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:'.28rem .75rem', fontSize:'.76rem', fontWeight:600, cursor:'pointer' }}>
            🎓 {currentUser?.name||'المعلم'}
          </div>
          <button onClick={onToggleDark} title={darkMode?'وضع فاتح':'وضع داكن'} style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:'1rem',display:'flex',alignItems:'center',justifyContent:'center'}}>{darkMode?'☀️':'🌙'}</button>
          <Btn variant="out" size="sm" onClick={onLogout}>خروج</Btn>
        </div>
      </div>

      {/* ══ شاشة اختيار المجموعة ══ */}
      {!selGroupId && (
        <div style={{ flex:1, padding:'1rem', overflowY:'auto' }}>
          {myGroups.length === 0 ? (
            <div style={{ textAlign:'center', padding:'4rem 1.5rem', color:'var(--text3)', border:'1px dashed var(--border)', borderRadius:'var(--r)', marginTop:'.5rem' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'.75rem' }}>👥</div>
              <div style={{ fontWeight:800, marginBottom:'.3rem' }}>لا توجد مجموعات</div>
              <div style={{ fontSize:'.8rem' }}>لم يتم ربط أي مجموعة بحسابك — تواصل مع الإدارة</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:'.82rem', color:'var(--text2)', marginBottom:'.85rem', fontWeight:700 }}>مجموعاتك ({myGroups.length})</div>
              {myGroups.map(g => {
                const stuList = (g.studentIds||[]).map(id=>allStudents.find(s=>s.id===id)).filter(Boolean)
                const todayISO = new Date().toISOString().slice(0,10)
                const todayAtt = stuAttendance[todayISO] || {}
                const todayPresent = stuList.filter(s=>todayAtt[s.id]?.status==='present').length
                const todayLogged  = stuList.filter(s=>todayAtt[s.id]?.status).length
                return (
                  <div key={g.id} onClick={()=>{ setSelGroupId(g.id); setActiveTab('attendance') }}
                    style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'1rem 1.1rem', marginBottom:'.65rem', cursor:'pointer', transition:'border-color .15s, transform .12s' }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(34,197,94,.4)'; e.currentTarget.style.transform='translateY(-1px)' }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
                      <div style={{ width:48, height:48, borderRadius:14, background:'var(--bs)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', flexShrink:0 }}>👥</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:900, fontSize:'.95rem', marginBottom:'.25rem' }}>{g.name}</div>
                        <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', alignItems:'center' }}>
                          <span style={{ fontSize:'.72rem', color:'var(--text2)' }}>👤 {stuList.length} طالب</span>
                          {todayLogged > 0 && <span style={{ fontSize:'.7rem', fontWeight:700, color:'var(--green)', background:'var(--gs)', borderRadius:7, padding:'.1rem .45rem' }}>✅ {todayPresent}/{stuList.length} اليوم</span>}
                          {todayLogged === 0 && stuList.length > 0 && <span style={{ fontSize:'.7rem', color:'var(--text3)', background:'var(--card3)', borderRadius:7, padding:'.1rem .45rem' }}>لم يُسجَّل اليوم</span>}
                        </div>
                      </div>
                      <div style={{ color:'var(--text3)', fontSize:'.9rem', flexShrink:0 }}>◀</div>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* ══ داخل المجموعة — تبويبي الحضور والملاحظات فقط ══ */}
      {selGroupId && (
        <>
          {activeTab === 'attendance' && (
            <AttendanceTab myStudents={myStudents} stuAttendance={stuAttendance} setStuAttendance={setStuAttendance} showToast={showToast}/>
          )}
          {activeTab === 'notes' && (
            <NotesTab myStudents={myStudents} stuNotes={stuNotes} setStuNotes={setStuNotes} showToast={showToast}/>
          )}

          {/* TABBAR */}
          <div style={{ display:'flex', background:'var(--bg2)', borderTop:'1px solid var(--border)', position:'sticky', bottom:0 }}>
            {[['📅','الحضور','attendance'],['📝','ملاحظات','notes']].map(([ico,lbl,tab])=>(
              <div key={tab} onClick={()=>setActiveTab(tab)}
                style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'.15rem', padding:'.7rem .3rem', cursor:'pointer', fontSize:'.7rem', fontWeight:700, color:activeTab===tab?'var(--green)':'var(--text3)', borderTop: activeTab===tab?'2px solid var(--green)':'2px solid transparent' }}>
                <div style={{ fontSize:'1.2rem' }}>{ico}</div>{lbl}
              </div>
            ))}
          </div>
        </>
      )}

      {/* MODALS */}
      <ProfileModal open={showProfile} user={currentUser} onClose={()=>setShowProfile(false)} onSave={ch=>{ onUpdateUser(ch); setShowProfile(false); showToast('✅ تم','ok') }}/>
    </div>
  )
}

