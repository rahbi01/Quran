import { useState, useEffect, useMemo } from 'react'
import Btn          from '../components/Btn.jsx'
import Modal        from '../components/Modal.jsx'
import ProfileModal from '../components/ProfileModal.jsx'

// ─── ثوابت التنقل ────────────────────────────────────────────────────
const NAV = [
  { id:'students',   icon:'👤', label:'الطلاب',         group:'الإدارة', perm:null },
  { id:'teachers',   icon:'🎓', label:'المعلمون',       group:'الإدارة', perm:null },
  { id:'groups',     icon:'👥', label:'المجموعات',      group:'الإدارة', perm:null },
  { id:'attendance', icon:'📅', label:'الحضور والغياب', group:'الإدارة', perm:null },
  { id:'fees',       icon:'💰', label:'تحصيل الرسوم',  group:'الإدارة', perm:null },
]
const TITLES = Object.fromEntries(NAV.map(n => [n.id, `${n.icon} ${n.label}`]))
const DAYS_AR = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']

// ─── مكوّنات مساعدة صغيرة ────────────────────────────────────────────
function Tag({ label, color='g' }) {
  const C = { g:{bg:'var(--gs)',c:'var(--green)'}, b:{bg:'var(--bs)',c:'var(--blue)'},
    o:{bg:'var(--golds)',c:'var(--gold)'}, r:{bg:'var(--rs)',c:'var(--red)'}, gray:{bg:'var(--card3)',c:'var(--text3)'} }
  const s = C[color]||C.gray
  return <span style={{fontSize:'.66rem',padding:'.15rem .55rem',borderRadius:12,fontWeight:800,background:s.bg,color:s.c,whiteSpace:'nowrap'}}>{label}</span>
}
function Sw({ checked, onChange }) {
  return (
    <label style={{position:'relative',width:36,height:19,flexShrink:0,cursor:'pointer',display:'inline-block'}}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{opacity:0,width:0,height:0}}/>
      <span style={{position:'absolute',inset:0,borderRadius:10,transition:'.2s',background:checked?'var(--green)':'var(--card3)'}}>
        <span style={{position:'absolute',width:13,height:13,borderRadius:'50%',top:3,right:checked?20:3,transition:'.2s',background:checked?'#fff':'var(--text3)'}}/>
      </span>
    </label>
  )
}
function FF({ label, val, set, ph, type='text' }) {
  const s = {width:'100%',background:'var(--card2)',border:'1px solid var(--border)',borderRadius:'var(--rx)',padding:'.5rem .75rem',color:'var(--text)',fontFamily:'inherit',fontSize:'.84rem',marginBottom:'.6rem',boxSizing:'border-box'}
  return (<div><div style={{fontSize:'.74rem',color:'var(--text2)',fontWeight:700,marginBottom:'.25rem'}}>{label}</div><input type={type} value={val} onChange={e=>set(e.target.value)} placeholder={ph} style={s}/></div>)
}
const INP = {background:'var(--card2)',border:'1px solid var(--border)',borderRadius:'var(--rx)',padding:'.45rem .65rem',color:'var(--text)',fontFamily:'inherit',fontSize:'.82rem',outline:'none',width:'100%',boxSizing:'border-box'}

// ─── EditUserModal ────────────────────────────────────────────────────
function EditUserModal({ open, user, onClose, onSave }) {
  const [name,setName]=useState(''); const [uname,setUname]=useState('')
  const [pass,setPass]=useState(''); const [phone,setPhone]=useState('')
  const [level,setLevel]=useState(''); const [district,setDistrict]=useState('')
  const [perm,setPerm]=useState(false); const [err,setErr]=useState('')
  useEffect(()=>{
    if(!user)return
    setName(user.name||''); setUname(user.username||''); setPass(''); setPhone(user.phone||'')
    setLevel(String(user.level||'')); setDistrict(user.district||'')
    setPerm(!!user.canViewMissing); setErr('')
  },[user])
  function handle(){
    if(!name.trim()||!uname.trim()){setErr('الاسم واسم المستخدم مطلوبان');return}
    const ch={name:name.trim(),username:uname.trim(),phone:phone.trim()}
    if(pass)ch.password=pass
    if(user?.role==='student'){ch.level=level.trim();ch.district=district.trim()}
    if(user?.role==='teacher')ch.canViewMissing=perm
    onSave(ch)
  }
  if(!user)return null
  return (
    <Modal open={open} onClose={onClose} title={`✏️ تعديل: ${user.name}`}>
      <FF label="الاسم *" val={name} set={setName} ph="الاسم الكامل"/>
      <FF label="اسم المستخدم *" val={uname} set={setUname} ph="username"/>
      <FF label="كلمة مرور جديدة (فارغة = بدون تغيير)" val={pass} set={setPass} ph="••••" type="password"/>
      <FF label="الجوال" val={phone} set={setPhone} ph="05xxxxxxxx"/>
      {user.role==='student'&&(
        <>
          <div style={{marginBottom:'.6rem'}}>
            <div style={{fontSize:'.74rem',color:'var(--text2)',fontWeight:700,marginBottom:'.25rem'}}>عدد الأجزاء المحفوظة</div>
            <select value={level} onChange={e=>setLevel(e.target.value)} style={{...INP}}>
              <option value="">-- اختر --</option>
              {Array.from({length:30},(_,i)=>i+1).map(n=><option key={n} value={n}>{n} {n===30?'(خاتم القرآن)':'جزء'}</option>)}
            </select>
          </div>
          <FF label="المنطقة السكنية" val={district} set={setDistrict} ph="مثال: مسقط"/>
        </>
      )}
      {user.role==='teacher'&&<label style={{display:'flex',alignItems:'center',gap:'.5rem',fontSize:'.82rem',cursor:'pointer',marginBottom:'.7rem'}}><input type="checkbox" checked={perm} onChange={e=>setPerm(e.target.checked)} style={{accentColor:'var(--green)',width:15,height:15}}/>صلاحية المشرف</label>}
      {err&&<div style={{color:'var(--red)',fontSize:'.76rem',marginBottom:'.5rem'}}>⚠️ {err}</div>}
      <div style={{display:'flex',gap:'.5rem'}}><Btn style={{flex:1,justifyContent:'center'}} onClick={onClose}>إلغاء</Btn><Btn variant="p" style={{flex:1,justifyContent:'center'}} onClick={handle}>💾 حفظ</Btn></div>
    </Modal>
  )
}

// ─── AddUserModal ─────────────────────────────────────────────────────
function AddUserModal({ open, role, onClose, onSave }) {
  const [name,setName]=useState(''); const [user,setUser]=useState(''); const [pass,setPass]=useState('')
  const [phone,setPhone]=useState(''); const [level,setLevel]=useState(''); const [district,setDistrict]=useState('')
  const [perm,setPerm]=useState(false); const [err,setErr]=useState('')
  function reset(){setName('');setUser('');setPass('');setPhone('');setLevel('');setDistrict('');setPerm(false);setErr('')}
  function handle(){
    if(!name.trim()||!user.trim()||!pass){setErr('الاسم واسم المستخدم وكلمة المرور مطلوبة');return}
    const d={name:name.trim(),username:user.trim(),password:pass,phone:phone.trim()}
    if(role==='student'){d.level=level;d.district=district.trim()}
    if(role==='teacher')d.canViewMissing=perm
    onSave(d);reset()
  }
  const titles={'student':'👤 إضافة طالب','teacher':'🎓 إضافة معلم'}
  return (
    <Modal open={open} onClose={()=>{reset();onClose()}} title={titles[role]||'إضافة مستخدم'}>
      <FF label="الاسم *" val={name} set={setName} ph="الاسم الكامل"/>
      <FF label="اسم المستخدم *" val={user} set={setUser} ph="username"/>
      <FF label="كلمة المرور *" val={pass} set={setPass} ph="كلمة مرور" type="password"/>
      <FF label="الجوال" val={phone} set={setPhone} ph="05xxxxxxxx"/>
      {role==='student'&&(
        <>
          <div style={{marginBottom:'.6rem'}}>
            <div style={{fontSize:'.74rem',color:'var(--text2)',fontWeight:700,marginBottom:'.25rem'}}>عدد الأجزاء (اختياري)</div>
            <select value={level} onChange={e=>setLevel(e.target.value)} style={{...INP}}>
              <option value="">-- اختر --</option>
              {Array.from({length:30},(_,i)=>i+1).map(n=><option key={n} value={n}>{n} {n===30?'(خاتم القرآن)':'جزء'}</option>)}
            </select>
          </div>
          <FF label="المنطقة السكنية" val={district} set={setDistrict} ph="مثال: مسقط"/>
        </>
      )}
      {role==='teacher'&&<label style={{display:'flex',alignItems:'center',gap:'.5rem',fontSize:'.82rem',cursor:'pointer',marginBottom:'.7rem'}}><input type="checkbox" checked={perm} onChange={e=>setPerm(e.target.checked)} style={{accentColor:'var(--green)',width:15,height:15}}/>صلاحية المشرف</label>}
      {err&&<div style={{color:'var(--red)',fontSize:'.76rem',marginBottom:'.5rem'}}>⚠️ {err}</div>}
      <div style={{display:'flex',gap:'.5rem'}}><Btn style={{flex:1,justifyContent:'center'}} onClick={()=>{reset();onClose()}}>إلغاء</Btn><Btn variant="p" style={{flex:1,justifyContent:'center'}} onClick={handle}>💾 حفظ</Btn></div>
    </Modal>
  )
}

// ─── المكوّن الرئيسي ──────────────────────────────────────────────────
export default function AdminScreen({
  currentUser, allUsers, onLogout, onUpdateUser, onUpdateUsers,
  showToast, darkMode, onToggleDark,
}) {
  const [page,       setPage]     = useState('students')
  const [sidebarOpen,setSidebar]  = useState(false)
  const [confirmData,setConfirm]  = useState(null)
  const [editingUser,setEditUser] = useState(null)
  const [addRole,    setAddRole]  = useState(null)
  const [showProfile,setProfile]  = useState(false)

  const [groups,     setGroups]     = useState(()=>{try{return JSON.parse(localStorage.getItem('groups')||'[]')}catch{return[]}})
  const [attendance, setAttendance] = useState(()=>{try{return JSON.parse(localStorage.getItem('teacherAttendance')||'{}')}catch{return{}}})
  const [fees,       setFees]       = useState(()=>{try{return JSON.parse(localStorage.getItem('studentFees')||'{}')}catch{return{}}})
  useEffect(()=>{localStorage.setItem('groups',JSON.stringify(groups))},[groups])
  useEffect(()=>{localStorage.setItem('teacherAttendance',JSON.stringify(attendance))},[attendance])
  useEffect(()=>{localStorage.setItem('studentFees',JSON.stringify(fees))},[fees])

  const users    = allUsers || []
  const students = useMemo(()=>users.filter(u=>u.role==='student'),[users])
  const teachers = useMemo(()=>users.filter(u=>u.role==='teacher'),[users])

  function goPage(id){setPage(id)}
  function confirm2(title,msg,cb){setConfirm({title,msg,cb})}

  // ── صفحة الطلاب ──────────────────────────────────────────────────────
  function PageStudents() {
    const ranked=[...students].filter(s=>s.level&&Number(s.level)>0).sort((a,b)=>Number(b.level||0)-Number(a.level||0))
    const [importOpen,  setImportOpen]  = useState(false)
    const [xlsxPreview, setXlsxPreview] = useState(null)
    const [xlsxErr,     setXlsxErr]     = useState('')
    const [xlsxDone,    setXlsxDone]    = useState(false)

    async function handleXlsxFile(e) {
      const file = e.target.files?.[0]
      if(!file) return
      setXlsxErr(''); setXlsxPreview(null); setXlsxDone(false)
      try {
        const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/xlsx.mjs')
        const buf  = await file.arrayBuffer()
        const wb   = XLSX.read(buf, {type:'array'})
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:''})
        if(rows.length < 2){ setXlsxErr('الملف فارغ أو لا يحتوي على بيانات'); return }
        const data = rows.slice(1).filter(r => String(r[0]||'').trim())
        if(!data.length){ setXlsxErr('لم يتم العثور على بيانات في الملف'); return }
        const parsed = data.map(r => ({
          name:String(r[0]||'').trim(), username:String(r[1]||'').trim(),
          password:String(r[2]||'').trim(), phone:String(r[3]||'').trim(),
          district:String(r[4]||'').trim(), level:String(r[5]||'').trim(),
        }))
        const errs = []
        parsed.forEach((s,i)=>{
          if(!s.name)     errs.push(`الصف ${i+2}: الاسم مطلوب`)
          if(!s.username) errs.push(`الصف ${i+2}: اسم المستخدم مطلوب`)
          if(!s.password) errs.push(`الصف ${i+2}: كلمة المرور مطلوبة`)
        })
        if(errs.length){ setXlsxErr(errs.slice(0,3).join(' | ')); return }
        setXlsxPreview(parsed)
      } catch { setXlsxErr('تعذّر قراءة الملف — تأكد أنه ملف Excel صحيح (.xlsx)') }
    }

    function doImport() {
      if(!xlsxPreview) return
      const colors = ['g','b','o','r','p']
      const existing = users.map(u=>u.username.toLowerCase())
      const newStudents = xlsxPreview
        .filter(s => !existing.includes(s.username.toLowerCase()))
        .map((s,i)=>({...s, id:Date.now()+i, role:'student', avatar:s.name.slice(0,2),
          color:colors[(users.length+i)%colors.length], warned:0, suspended:false, disabled:false, reward:null}))
      const skipped = xlsxPreview.length - newStudents.length
      onUpdateUsers(p=>[...p,...newStudents])
      setXlsxDone(true)
      showToast(`✅ تم استيراد ${newStudents.length} طالب${skipped>0?` · تجاهل ${skipped} مكرر`:''}`, 'ok')
    }

    function deleteAllStudents() {
      const studentIds = students.map(s => s.id)
      Object.keys(localStorage).forEach(k => {
        if(k.startsWith('stuAtt_') || k.startsWith('stuNotes_')) {
          try {
            const data = JSON.parse(localStorage.getItem(k)||'{}')
            if(k.startsWith('stuAtt_')) {
              const cleaned = {}
              Object.entries(data).forEach(([date,dayData]) => {
                const nd = {}; Object.entries(dayData).forEach(([sid,v]) => { if(!studentIds.includes(Number(sid))) nd[sid]=v })
                if(Object.keys(nd).length) cleaned[date]=nd
              })
              localStorage.setItem(k, JSON.stringify(cleaned))
            }
            if(k.startsWith('stuNotes_')) {
              const cleaned = {}; Object.entries(data).forEach(([sid,n]) => { if(!studentIds.includes(Number(sid))) cleaned[sid]=n })
              localStorage.setItem(k, JSON.stringify(cleaned))
            }
          } catch{}
        }
      })
      setGroups(p=>p.map(g=>({...g,studentIds:(g.studentIds||[]).filter(id=>!studentIds.includes(id))})))
      onUpdateUsers(p=>p.filter(u=>u.role!=='student'))
      showToast(`🗑️ تم حذف ${students.length} طالب وجميع بياناتهم`, 'ok')
    }

    return (
      <>
        <div style={{display:'flex',gap:'.5rem',marginBottom:'1rem',flexWrap:'wrap',alignItems:'center'}}>
          <button onClick={()=>{setImportOpen(true);setXlsxPreview(null);setXlsxErr('');setXlsxDone(false)}}
            style={{background:'var(--bs)',border:'1px solid rgba(59,130,246,.3)',borderRadius:'var(--rx)',padding:'.42rem .9rem',fontSize:'.78rem',fontWeight:700,cursor:'pointer',color:'var(--blue)',fontFamily:'inherit'}}>
            📥 استيراد من Excel
          </button>
          <a href="/نموذج_استيراد_الطلاب.xlsx" download
            style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:'var(--rx)',padding:'.42rem .9rem',fontSize:'.78rem',fontWeight:700,color:'var(--text2)',fontFamily:'inherit',textDecoration:'none'}}>
            ⬇️ تنزيل النموذج
          </a>
          {students.length > 0 && (
            <button onClick={()=>confirm2('حذف جميع الطلاب',
              `⚠️ سيُحذف ${students.length} طالب نهائياً مع جميع ملاحظاتهم وسجلات حضورهم وغيابهم وإزالتهم من جميع المجموعات. لا يمكن التراجع.`,
              deleteAllStudents)}
              style={{background:'var(--rs)',border:'1px solid rgba(239,68,68,.3)',borderRadius:'var(--rx)',padding:'.42rem .9rem',fontSize:'.78rem',fontWeight:700,cursor:'pointer',color:'var(--red)',fontFamily:'inherit',marginRight:'auto'}}>
              🗑️ حذف الكل ({students.length})
            </button>
          )}
        </div>

        <Modal open={importOpen} onClose={()=>setImportOpen(false)} title="📥 استيراد طلاب من Excel">
          {!xlsxDone ? (
            <>
              <div style={{background:'var(--bs)',border:'1px solid rgba(59,130,246,.2)',borderRadius:'var(--rx)',padding:'.6rem .85rem',marginBottom:'.85rem',fontSize:'.76rem',color:'var(--blue)',lineHeight:1.7}}>
                ١. نزّل النموذج بالضغط على "تنزيل النموذج" أعلاه<br/>
                ٢. عبّئ بيانات الطلاب (الاسم، اسم المستخدم، كلمة المرور، الجوال، المنطقة، الأجزاء)<br/>
                ٣. احفظ الملف وارفعه هنا
              </div>
              <input type="file" accept=".xlsx,.xls" onChange={handleXlsxFile}
                style={{width:'100%',background:'var(--card2)',border:'2px dashed var(--border)',borderRadius:'var(--rs2)',padding:'.85rem',color:'var(--text)',fontFamily:'inherit',fontSize:'.82rem',cursor:'pointer',boxSizing:'border-box',marginBottom:'.85rem'}}/>
              {xlsxErr && <div style={{background:'var(--rs)',border:'1px solid rgba(239,68,68,.3)',borderRadius:'var(--rx)',padding:'.55rem .85rem',marginBottom:'.75rem',color:'var(--red)',fontSize:'.78rem'}}>⚠️ {xlsxErr}</div>}
              {xlsxPreview && (
                <div style={{marginBottom:'.85rem'}}>
                  <div style={{fontSize:'.78rem',fontWeight:800,marginBottom:'.55rem',color:'var(--green)'}}>✅ تم قراءة {xlsxPreview.length} طالب — معاينة:</div>
                  <div style={{maxHeight:220,overflowY:'auto',border:'1px solid var(--border)',borderRadius:'var(--rs2)'}}>
                    {xlsxPreview.slice(0,10).map((s,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:'.5rem',padding:'.42rem .75rem',borderBottom:'1px solid var(--border)',background:i%2?'var(--card2)':'var(--card)'}}>
                        <div style={{width:28,height:28,borderRadius:8,background:'var(--gs)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.7rem',fontWeight:800,color:'var(--green)',flexShrink:0}}>{s.name.slice(0,2)}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:'.8rem',fontWeight:700}}>{s.name}</div>
                          <div style={{fontSize:'.68rem',color:'var(--text2)'}}>@{s.username}{s.district?` · ${s.district}`:''}{s.level?` · ${s.level} جزء`:''}</div>
                        </div>
                      </div>
                    ))}
                    {xlsxPreview.length>10 && <div style={{padding:'.5rem .75rem',fontSize:'.72rem',color:'var(--text3)',textAlign:'center'}}>... و {xlsxPreview.length-10} آخرون</div>}
                  </div>
                </div>
              )}
              <div style={{display:'flex',gap:'.5rem'}}>
                <Btn style={{flex:1,justifyContent:'center'}} onClick={()=>setImportOpen(false)}>إلغاء</Btn>
                {xlsxPreview && <Btn variant="p" style={{flex:2,justifyContent:'center'}} onClick={doImport}>📥 استيراد {xlsxPreview.length} طالب</Btn>}
              </div>
            </>
          ) : (
            <div style={{textAlign:'center',padding:'1.5rem 1rem'}}>
              <div style={{fontSize:'2.5rem',marginBottom:'.75rem'}}>🎉</div>
              <div style={{fontSize:'.95rem',fontWeight:800,color:'var(--green)',marginBottom:'.35rem'}}>تم الاستيراد بنجاح!</div>
              <Btn onClick={()=>setImportOpen(false)} style={{justifyContent:'center'}}>إغلاق</Btn>
            </div>
          )}
        </Modal>

        {ranked.length>0&&(
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'1rem',marginBottom:'1rem'}}>
            <div style={{fontSize:'.88rem',fontWeight:800,marginBottom:'.65rem'}}>📊 ترتيب الأجزاء</div>
            {ranked.map((s,i)=>(
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:'.6rem',padding:'.5rem .7rem',borderRadius:'var(--rs2)',marginBottom:'.25rem',opacity:s.disabled?.7:1}}>
                <span style={{width:26,textAlign:'center',fontSize:i<3?'.95rem':'.78rem'}}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span>
                <span style={{flex:1,fontSize:'.82rem',fontWeight:700}}>{s.name}</span>
                {s.disabled&&<Tag label="معطّل" color="gray"/>}
                <span style={{fontSize:'1.1rem',fontWeight:900,color:Number(s.level)>=25?'var(--gold)':Number(s.level)>=15?'var(--green)':'var(--blue)'}}>{s.level}</span>
                <span style={{fontSize:'.7rem',color:'var(--text2)'}}>جزء</span>
              </div>
            ))}
          </div>
        )}

        {students.map(s=>(
          <div key={s.id} style={{display:'flex',alignItems:'center',gap:'.6rem',background:s.disabled?'var(--card3)':'var(--card2)',border:`1px solid ${s.disabled?'rgba(148,163,184,.3)':'var(--border)'}`,borderRadius:'var(--rs2)',padding:'.75rem .9rem',marginBottom:'.4rem',opacity:s.disabled?.75:1}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'.82rem',fontWeight:700,color:s.disabled?'var(--text3)':'var(--text)'}}>{s.name}</div>
              <div style={{fontSize:'.68rem',color:'var(--text2)',marginTop:'.1rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                @{s.username}
                {s.level?` · ${s.level} جزء`:''}
                {s.district?<span style={{color:'var(--blue)'}}> · 📍{s.district}</span>:null}
                {s.disabled?<span style={{color:'var(--text3)',fontWeight:700}}> · معطّل</span>:s.suspended?<span style={{color:'var(--red)'}}> · موقوف</span>:null}
              </div>
            </div>
            <div style={{display:'flex',gap:'.3rem',flexWrap:'wrap',justifyContent:'flex-end'}}>
              <Btn size="sm" onClick={()=>confirm2(
                s.disabled?'تفعيل الطالب؟':'تعطيل الطالب؟',
                s.disabled?`سيتم تفعيل ${s.name} وإتاحته في المجموعات مجدداً`:`سيتم تعطيل ${s.name} ولن يظهر في المجموعات — بياناته تبقى محفوظة`,
                ()=>onUpdateUsers(p=>p.map(u=>u.id===s.id?{...u,disabled:!u.disabled}:u))
              )}>{s.disabled?'✅ تفعيل':'🚫 تعطيل'}</Btn>
              <Btn size="sm" onClick={()=>setEditUser(s)}>تعديل</Btn>
              <Btn variant="d" size="sm" onClick={()=>confirm2('حذف الطالب؟',
                `سيُحذف ${s.name} نهائياً مع جميع ملاحظاته وسجلات حضوره وغيابه`,
                ()=>{onUpdateUsers(p=>p.filter(u=>u.id!==s.id));showToast('🗑️ تم','ok')}
              )}>حذف</Btn>
            </div>
          </div>
        ))}
        {students.length===0&&<div style={{textAlign:'center',padding:'2.5rem',color:'var(--text3)',border:'1px dashed var(--border)',borderRadius:'var(--r)'}}>لا يوجد طلاب — اضغط "+ طالب" أو استورد من Excel</div>}
      </>
    )
  }

  // ── صفحة المعلمين ────────────────────────────────────────────────────
  function PageTeachers() {
    const [importOpen,  setImportOpen]  = useState(false)
    const [xlsxPreview, setXlsxPreview] = useState(null)
    const [xlsxErr,     setXlsxErr]     = useState('')
    const [xlsxDone,    setXlsxDone]    = useState(false)

    async function handleXlsxFile(e) {
      const file = e.target.files?.[0]
      if(!file) return
      setXlsxErr(''); setXlsxPreview(null); setXlsxDone(false)
      try {
        const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/xlsx.mjs')
        const buf  = await file.arrayBuffer()
        const wb   = XLSX.read(buf, {type:'array'})
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:''})
        if(rows.length < 2){ setXlsxErr('الملف فارغ'); return }
        const data = rows.slice(1).filter(r => String(r[0]||'').trim())
        if(!data.length){ setXlsxErr('لم يتم العثور على بيانات'); return }
        const parsed = data.map(r => ({
          name:String(r[0]||'').trim(), username:String(r[1]||'').trim(),
          password:String(r[2]||'').trim(), phone:String(r[3]||'').trim(),
        }))
        const errs = []
        parsed.forEach((t,i)=>{
          if(!t.name)     errs.push(`الصف ${i+2}: الاسم مطلوب`)
          if(!t.username) errs.push(`الصف ${i+2}: اسم المستخدم مطلوب`)
          if(!t.password) errs.push(`الصف ${i+2}: كلمة المرور مطلوبة`)
        })
        if(errs.length){ setXlsxErr(errs.slice(0,3).join(' | ')); return }
        setXlsxPreview(parsed)
      } catch { setXlsxErr('تعذّر قراءة الملف — تأكد أنه .xlsx صحيح') }
    }

    function doImport() {
      if(!xlsxPreview) return
      const colors = ['g','b','o','r','p']
      const existing = users.map(u=>u.username.toLowerCase())
      const newTeachers = xlsxPreview
        .filter(t => !existing.includes(t.username.toLowerCase()))
        .map((t,i)=>({...t, id:Date.now()+i, role:'teacher', avatar:t.name.slice(0,2),
          color:colors[(users.length+i)%colors.length], canViewMissing:false, disabled:false}))
      const skipped = xlsxPreview.length - newTeachers.length
      onUpdateUsers(p=>[...p,...newTeachers])
      setXlsxDone(true)
      showToast(`✅ تم استيراد ${newTeachers.length} معلم${skipped>0?` · تجاهل ${skipped} مكرر`:''}`, 'ok')
    }

    return (
      <>
        <div style={{display:'flex',gap:'.5rem',marginBottom:'1rem',flexWrap:'wrap',alignItems:'center'}}>
          <button onClick={()=>{setImportOpen(true);setXlsxPreview(null);setXlsxErr('');setXlsxDone(false)}}
            style={{background:'var(--bs)',border:'1px solid rgba(59,130,246,.3)',borderRadius:'var(--rx)',padding:'.42rem .9rem',fontSize:'.78rem',fontWeight:700,cursor:'pointer',color:'var(--blue)',fontFamily:'inherit'}}>
            📥 استيراد من Excel
          </button>
          <a href="/نموذج_استيراد_المعلمين.xlsx" download
            style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:'var(--rx)',padding:'.42rem .9rem',fontSize:'.78rem',fontWeight:700,color:'var(--text2)',fontFamily:'inherit',textDecoration:'none'}}>
            ⬇️ تنزيل النموذج
          </a>
          {teachers.length > 0 && (
            <button onClick={()=>confirm2('حذف جميع المعلمين',
              `⚠️ سيُحذف ${teachers.length} معلم نهائياً وإزالتهم من جميع المجموعات. لا يمكن التراجع.`,
              ()=>{onUpdateUsers(p=>p.filter(u=>u.role!=='teacher'));showToast(`🗑️ تم حذف ${teachers.length} معلم`,'ok')})}
              style={{background:'var(--rs)',border:'1px solid rgba(239,68,68,.3)',borderRadius:'var(--rx)',padding:'.42rem .9rem',fontSize:'.78rem',fontWeight:700,cursor:'pointer',color:'var(--red)',fontFamily:'inherit',marginRight:'auto'}}>
              🗑️ حذف الكل ({teachers.length})
            </button>
          )}
        </div>

        <Modal open={importOpen} onClose={()=>setImportOpen(false)} title="📥 استيراد معلمين من Excel">
          {!xlsxDone ? (
            <>
              <div style={{background:'var(--bs)',border:'1px solid rgba(59,130,246,.2)',borderRadius:'var(--rx)',padding:'.6rem .85rem',marginBottom:'.85rem',fontSize:'.76rem',color:'var(--blue)',lineHeight:1.7}}>
                ١. نزّل النموذج · ٢. عبّئ البيانات (الاسم، المستخدم، كلمة المرور، الجوال) · ٣. ارفع الملف هنا
              </div>
              <input type="file" accept=".xlsx,.xls" onChange={handleXlsxFile}
                style={{width:'100%',background:'var(--card2)',border:'2px dashed var(--border)',borderRadius:'var(--rs2)',padding:'.85rem',color:'var(--text)',fontFamily:'inherit',fontSize:'.82rem',cursor:'pointer',boxSizing:'border-box',marginBottom:'.85rem'}}/>
              {xlsxErr && <div style={{background:'var(--rs)',border:'1px solid rgba(239,68,68,.3)',borderRadius:'var(--rx)',padding:'.55rem .85rem',marginBottom:'.75rem',color:'var(--red)',fontSize:'.78rem'}}>⚠️ {xlsxErr}</div>}
              {xlsxPreview && (
                <div style={{marginBottom:'.85rem'}}>
                  <div style={{fontSize:'.78rem',fontWeight:800,marginBottom:'.55rem',color:'var(--green)'}}>✅ تم قراءة {xlsxPreview.length} معلم — معاينة:</div>
                  <div style={{maxHeight:200,overflowY:'auto',border:'1px solid var(--border)',borderRadius:'var(--rs2)'}}>
                    {xlsxPreview.slice(0,8).map((t,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:'.5rem',padding:'.4rem .75rem',borderBottom:'1px solid var(--border)',background:i%2?'var(--card2)':'var(--card)'}}>
                        <div style={{width:26,height:26,borderRadius:8,background:'var(--bs)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.7rem',fontWeight:800,color:'var(--blue)',flexShrink:0}}>{t.name.slice(0,2)}</div>
                        <div style={{flex:1}}><div style={{fontSize:'.8rem',fontWeight:700}}>{t.name}</div><div style={{fontSize:'.68rem',color:'var(--text2)'}}>@{t.username}{t.phone?` · ${t.phone}`:''}</div></div>
                      </div>
                    ))}
                    {xlsxPreview.length>8 && <div style={{padding:'.4rem .75rem',fontSize:'.72rem',color:'var(--text3)',textAlign:'center'}}>... و {xlsxPreview.length-8} آخرون</div>}
                  </div>
                </div>
              )}
              <div style={{display:'flex',gap:'.5rem'}}>
                <Btn style={{flex:1,justifyContent:'center'}} onClick={()=>setImportOpen(false)}>إلغاء</Btn>
                {xlsxPreview && <Btn variant="p" style={{flex:2,justifyContent:'center'}} onClick={doImport}>📥 استيراد {xlsxPreview.length} معلم</Btn>}
              </div>
            </>
          ) : (
            <div style={{textAlign:'center',padding:'1.5rem 1rem'}}>
              <div style={{fontSize:'2.5rem',marginBottom:'.75rem'}}>🎉</div>
              <div style={{fontSize:'.95rem',fontWeight:800,color:'var(--green)',marginBottom:'.35rem'}}>تم الاستيراد بنجاح!</div>
              <Btn onClick={()=>setImportOpen(false)} style={{justifyContent:'center'}}>إغلاق</Btn>
            </div>
          )}
        </Modal>

        {teachers.map(t=>(
          <div key={t.id} style={{display:'flex',alignItems:'center',gap:'.6rem',background:t.disabled?'var(--card3)':'var(--card2)',border:`1px solid ${t.disabled?'rgba(148,163,184,.3)':'var(--border)'}`,borderRadius:'var(--rs2)',padding:'.75rem .9rem',marginBottom:'.4rem',opacity:t.disabled?.75:1}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'.82rem',fontWeight:700,color:t.disabled?'var(--text3)':'var(--text)'}}>{t.name}</div>
              <div style={{fontSize:'.68rem',marginTop:'.1rem',display:'flex',gap:'.5rem',alignItems:'center',flexWrap:'wrap'}}>
                {t.disabled
                  ? <span style={{color:'var(--text3)',fontWeight:700}}>معطّل</span>
                  : <><span style={{color:t.canViewMissing?'var(--gold)':'var(--text2)'}}>{t.canViewMissing?'🔶 صلاحية المشرف':'معلم عادي'}</span>
                    <Sw checked={!!t.canViewMissing} onChange={()=>{onUpdateUsers(p=>p.map(u=>u.id===t.id?{...u,canViewMissing:!u.canViewMissing}:u));showToast('تم','ok')}}/></>
                }
              </div>
            </div>
            <div style={{display:'flex',gap:'.3rem',flexWrap:'wrap',justifyContent:'flex-end'}}>
              <Btn size="sm" onClick={()=>confirm2(
                t.disabled?'تفعيل المعلم؟':'تعطيل المعلم؟',
                t.disabled?`سيتم تفعيل ${t.name} وإتاحته في المجموعات مجدداً`:`سيتم تعطيل ${t.name} ولن يظهر في المجموعات — بياناته تبقى محفوظة`,
                ()=>onUpdateUsers(p=>p.map(u=>u.id===t.id?{...u,disabled:!u.disabled}:u))
              )}>{t.disabled?'✅ تفعيل':'🚫 تعطيل'}</Btn>
              <Btn size="sm" onClick={()=>setEditUser(t)}>تعديل</Btn>
              <Btn variant="d" size="sm" onClick={()=>confirm2('حذف المعلم؟',`حذف ${t.name} نهائياً`,()=>{onUpdateUsers(p=>p.filter(u=>u.id!==t.id));showToast('🗑️ تم','ok')})}>حذف</Btn>
            </div>
          </div>
        ))}
        {teachers.length===0&&<div style={{textAlign:'center',padding:'2.5rem',color:'var(--text3)',border:'1px dashed var(--border)',borderRadius:'var(--r)'}}>لا يوجد معلمون — اضغط "+ معلم" أو استورد من Excel</div>}
      </>
    )
  }

  // ── صفحة المجموعات ───────────────────────────────────────────────────
  function PageGroups() {
    const [groupName,    setGroupName]  = useState('')
    const [teacherId,    setTeacherId]  = useState('')
    const [err,          setErr]        = useState('')
    const [expandedId,   setExpandedId] = useState(null)
    const [addingStudents,setAddingStu] = useState(null)
    const [selectedStu,  setSelectedStu]= useState([])

    function handleCreate() {
      if(!groupName.trim()){ setErr('يرجى إدخال اسم المجموعة'); return }
      if(!teacherId)        { setErr('يرجى اختيار معلم'); return }
      setGroups(p=>[...p,{id:Date.now(),name:groupName.trim(),teacherId:Number(teacherId),studentIds:[]}])
      setGroupName(''); setTeacherId(''); setErr('')
    }

    function openAddStudents(g) { setSelectedStu([...(g.studentIds||[])]); setAddingStu(g.id) }

    function saveStudents() {
      setGroups(p=>p.map(g=>g.id===addingStudents?{...g,studentIds:selectedStu}:g))
      setAddingStu(null)
    }

    function toggleStu(id) { setSelectedStu(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]) }

    return (
      <>
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'1rem',marginBottom:'1rem'}}>
          <div style={{fontWeight:800,fontSize:'.9rem',marginBottom:'.85rem'}}>👥 مجموعة جديدة</div>
          <div style={{marginBottom:'.6rem'}}>
            <div style={{fontSize:'.74rem',color:'var(--text2)',fontWeight:700,marginBottom:'.25rem'}}>اسم المجموعة *</div>
            <input value={groupName} onChange={e=>{setGroupName(e.target.value);setErr('')}} placeholder="مثال: المجموعة الأولى" style={{...INP}}/>
          </div>
          <div style={{marginBottom:'.75rem'}}>
            <div style={{fontSize:'.74rem',color:'var(--text2)',fontWeight:700,marginBottom:'.25rem'}}>المعلم *</div>
            <select value={teacherId} onChange={e=>{setTeacherId(e.target.value);setErr('')}} style={{...INP}}>
              <option value="">-- اختر المعلم --</option>
              {teachers.filter(t=>!t.disabled).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {err&&<div style={{color:'var(--red)',fontSize:'.76rem',marginBottom:'.55rem',padding:'.35rem .65rem',background:'var(--rs)',borderRadius:'var(--rx)'}}>⚠️ {err}</div>}
          <Btn variant="p" onClick={handleCreate} style={{width:'100%',justifyContent:'center'}}>➕ إنشاء المجموعة</Btn>
        </div>

        {groups.length===0&&<div style={{textAlign:'center',padding:'2.5rem',color:'var(--text3)',border:'1px dashed var(--border)',borderRadius:'var(--r)'}}>لا توجد مجموعات بعد — أنشئ مجموعة أعلاه</div>}

        {groups.map(g=>{
          const teacher = teachers.find(t=>t.id===g.teacherId)
          const stuList = (g.studentIds||[]).map(id=>students.find(s=>s.id===id)).filter(Boolean)
          const isOpen  = expandedId===g.id
          return (
            <div key={g.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r)',marginBottom:'.65rem',overflow:'hidden'}}>
              <div style={{display:'flex',alignItems:'center',gap:'.65rem',padding:'.85rem 1rem'}}>
                <div style={{width:40,height:40,borderRadius:12,background:'var(--bs)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0}}>👥</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:800,fontSize:'.88rem'}}>{g.name}</div>
                  <div style={{fontSize:'.72rem',color:'var(--text2)',marginTop:'.1rem'}}>🎓 {teacher?.name||'—'} &nbsp;·&nbsp; {stuList.length} طالب</div>
                </div>
                <div style={{display:'flex',gap:'.4rem',flexShrink:0}}>
                  <button onClick={()=>openAddStudents(g)} title="تعديل الطلاب"
                    style={{background:'var(--gs)',border:'1px solid rgba(34,197,94,.2)',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:'.88rem',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--green)'}}>✏️</button>
                  <button onClick={()=>setExpandedId(isOpen?null:g.id)} title="عرض الطلاب"
                    style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:'.88rem',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--blue)'}}>
                    {isOpen?'▲':'▼'}</button>
                  <button onClick={()=>confirm2('حذف المجموعة؟',`حذف مجموعة "${g.name}" نهائياً`,()=>{setGroups(p=>p.filter(x=>x.id!==g.id));if(expandedId===g.id)setExpandedId(null)})} title="حذف"
                    style={{background:'var(--rs)',border:'1px solid rgba(239,68,68,.15)',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:'.88rem',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--red)'}}>🗑️</button>
                </div>
              </div>
              {isOpen&&(
                <div style={{borderTop:'1px solid var(--border)',padding:'.7rem 1rem',background:'var(--card2)'}}>
                  {stuList.length===0
                    ? <div style={{fontSize:'.78rem',color:'var(--text3)',textAlign:'center',padding:'.5rem'}}>لا يوجد طلاب في هذه المجموعة</div>
                    : <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.4rem'}}>
                        {stuList.map(s=>(
                          <div key={s.id} style={{display:'flex',alignItems:'center',gap:'.5rem',background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--rx)',padding:'.45rem .65rem'}}>
                            <div style={{width:26,height:26,borderRadius:8,background:'var(--gs)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.7rem',fontWeight:800,color:'var(--green)',flexShrink:0}}>{(s.avatar||s.name||'؟').slice(0,2)}</div>
                            <span style={{fontSize:'.78rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</span>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              )}
            </div>
          )
        })}

        <Modal open={!!addingStudents} onClose={()=>setAddingStu(null)} title="👤 اختيار الطلاب">
          {students.filter(s=>!s.disabled).length===0
            ? <div style={{textAlign:'center',color:'var(--text3)',padding:'1.5rem',fontSize:'.84rem'}}>لا يوجد طلاب نشطون</div>
            : <>
                <div style={{fontSize:'.75rem',color:'var(--text2)',marginBottom:'.65rem'}}>اختر الطلاب المراد إضافتهم ({selectedStu.length} مختار)</div>
                <div style={{maxHeight:320,overflowY:'auto',marginBottom:'.85rem'}}>
                  {students.filter(s=>!s.disabled).map(s=>{
                    const checked = selectedStu.includes(s.id)
                    return (
                      <label key={s.id} style={{display:'flex',alignItems:'center',gap:'.65rem',padding:'.55rem .7rem',borderRadius:'var(--rx)',cursor:'pointer',marginBottom:'.3rem',background:checked?'var(--gs)':'var(--card2)',border:`1px solid ${checked?'rgba(34,197,94,.3)':'var(--border)'}`,transition:'all .12s'}}>
                        <input type="checkbox" checked={checked} onChange={()=>toggleStu(s.id)} style={{accentColor:'var(--green)',width:16,height:16,flexShrink:0}}/>
                        <div style={{width:30,height:30,borderRadius:9,background:checked?'rgba(34,197,94,.2)':'var(--card3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.75rem',fontWeight:800,color:checked?'var(--green)':'var(--text2)',flexShrink:0}}>{(s.avatar||s.name||'؟').slice(0,2)}</div>
                        <span style={{fontSize:'.84rem',fontWeight:checked?700:500}}>{s.name}</span>
                        {s.level&&<Tag label={`${s.level} جزء`} color="g"/>}
                      </label>
                    )
                  })}
                </div>
                <div style={{display:'flex',gap:'.5rem'}}>
                  <Btn style={{flex:1,justifyContent:'center'}} onClick={()=>setAddingStu(null)}>إلغاء</Btn>
                  <Btn variant="p" style={{flex:1,justifyContent:'center'}} onClick={saveStudents}>💾 حفظ</Btn>
                </div>
              </>
          }
        </Modal>
      </>
    )
  }

  // ── صفحة الحضور والغياب ──────────────────────────────────────────────
  function PageAttendance() {
    const todayISO = new Date().toISOString().slice(0,10)
    const [selDate,      setSelDate]     = useState(todayISO)
    const [showForm,     setShowForm]    = useState(false)
    const [draft,        setDraft]       = useState({})
    const [notes,        setNotes]       = useState({})
    const [expandedDate, setExpandedDate]= useState(null)

    const S = {
      present:{ label:'حاضر',    bg:'var(--gs)',    border:'rgba(34,197,94,.45)', color:'var(--green)', icon:'✅' },
      late:   { label:'متأخر',   bg:'var(--bs)',    border:'rgba(59,130,246,.45)',color:'var(--blue)',  icon:'🕐' },
      absent: { label:'غائب',    bg:'var(--rs)',    border:'rgba(239,68,68,.45)', color:'var(--red)',   icon:'❌' },
      excused:{ label:'استأذان', bg:'var(--golds)', border:'rgba(245,158,11,.45)',color:'var(--gold)',  icon:'🟡' },
    }

    function loadDate(date) {
      const dayData = attendance[date] || {}
      const d={}, n={}
      teachers.forEach(t=>{ d[t.id]=dayData[t.id]?.status||''; n[t.id]=dayData[t.id]?.note||'' })
      setDraft(d); setNotes(n)
    }

    function handleShowForm() { loadDate(selDate); setShowForm(true) }

    function setStatus(tid,val){ setDraft(p=>({...p,[tid]:p[tid]===val?'':val})) }
    function setNote(tid,val)  { setNotes(p=>({...p,[tid]:val})) }

    function markAll(val){
      const d={}; teachers.forEach(t=>{d[t.id]=val}); setDraft(d)
    }

    function deleteDay(){
      setAttendance(p=>{const n={...p};delete n[selDate];return n})
      setShowForm(false); showToast('🗑️ تم حذف تسجيل اليوم','')
    }

    function handleSave(){
      const dayData={}
      teachers.forEach(t=>{ if(draft[t.id]) dayData[t.id]={status:draft[t.id],note:notes[t.id]||''} })
      setAttendance(p=>({...p,[selDate]:dayData}))
      setShowForm(false); showToast('✅ تم حفظ الحضور','ok')
    }

    const presentCount = teachers.filter(t=>draft[t.id]==='present').length
    const lateCount    = teachers.filter(t=>draft[t.id]==='late').length
    const absentCount  = teachers.filter(t=>draft[t.id]==='absent').length
    const excusedCount = teachers.filter(t=>draft[t.id]==='excused').length
    const unsetCount   = teachers.filter(t=>!draft[t.id]).length

    const savedDates = Object.keys(attendance).sort((a,b)=>b.localeCompare(a))

    function dayStats(date){
      const d=attendance[date]||{}; let p=0,l=0,a=0,e=0
      teachers.forEach(t=>{const s=d[t.id]?.status;if(s==='present')p++;else if(s==='late')l++;else if(s==='absent')a++;else if(s==='excused')e++})
      return {p,l,a,e}
    }

    function dayName(ds){ return DAYS_AR[new Date(ds+'T00:00:00').getDay()] }
    function fmt(ds){ const[y,m,dd]=ds.split('-');return`${dd}/${m}/${y}` }

    const BtnSmall = ({onClick,bg,border,color,children}) => (
      <button onClick={onClick} style={{background:bg,border:`1px solid ${border}`,borderRadius:'var(--rx)',padding:'.35rem .65rem',fontSize:'.74rem',fontWeight:700,cursor:'pointer',color,fontFamily:'inherit',whiteSpace:'nowrap'}}>{children}</button>
    )

    return (
      <>
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'1rem',marginBottom:'1rem'}}>
          <div style={{fontSize:'.8rem',fontWeight:800,marginBottom:'.65rem'}}>📅 تسجيل الحضور والغياب</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:'.6rem',flexWrap:'wrap'}}>
            <div style={{flex:1,minWidth:160}}>
              <div style={{fontSize:'.72rem',color:'var(--text2)',fontWeight:700,marginBottom:'.25rem'}}>اختر التاريخ</div>
              <input type="date" value={selDate} onChange={e=>{setSelDate(e.target.value);setShowForm(false)}} style={{...INP,width:'auto'}}/>
            </div>
            <Btn variant="p" onClick={handleShowForm} style={{padding:'.5rem 1.1rem',fontSize:'.84rem',whiteSpace:'nowrap'}}>👁 عرض</Btn>
          </div>
          {selDate===todayISO&&<div style={{fontSize:'.68rem',color:'var(--green)',marginTop:'.35rem',fontWeight:700}}>اليوم</div>}
          {selDate<todayISO  &&<div style={{fontSize:'.68rem',color:'var(--text3)',marginTop:'.35rem'}}>يوم سابق · {dayName(selDate)}</div>}
        </div>

        {showForm&&(
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'.35rem',marginBottom:'.75rem'}}>
              {[[presentCount,'حاضر','var(--green)'],[lateCount,'متأخر','var(--blue)'],[absentCount,'غائب','var(--red)'],[excusedCount,'استأذان','var(--gold)'],[unsetCount,'لم يُسجَّل','var(--text3)']].map(([n,l,c])=>(
                <div key={l} style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:'var(--rs2)',padding:'.45rem .2rem',textAlign:'center'}}>
                  <div style={{fontSize:'1.25rem',fontWeight:900,color:c,lineHeight:1}}>{n}</div>
                  <div style={{fontSize:'.58rem',color:'var(--text2)',marginTop:'.15rem'}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap',marginBottom:'.85rem'}}>
              <BtnSmall onClick={()=>markAll('present')} bg='var(--gs)'    border='rgba(34,197,94,.3)'  color='var(--green)'>✅ تسجيل الكل حاضرين</BtnSmall>
              <BtnSmall onClick={()=>markAll('absent')}  bg='var(--rs)'    border='rgba(239,68,68,.25)' color='var(--red)'>❌ تسجيل الكل غائبين</BtnSmall>
              <BtnSmall onClick={()=>markAll('')}        bg='var(--card2)' border='var(--border)'       color='var(--text2)'>🔄 مسح الكل</BtnSmall>
              {attendance[selDate]&&<BtnSmall onClick={deleteDay} bg='var(--rs)' border='rgba(239,68,68,.25)' color='var(--red)'>🗑️ حذف التسجيل</BtnSmall>}
            </div>
            {teachers.length===0&&<div style={{textAlign:'center',padding:'2rem',color:'var(--text3)',fontSize:'.82rem',border:'1px dashed var(--border)',borderRadius:'var(--r)'}}>لا يوجد معلمون مسجلون</div>}
            {teachers.map(t=>{
              const status=draft[t.id]||''; const note=notes[t.id]||''; const ss=S[status]
              return (
                <div key={t.id} style={{background:'var(--card)',border:`1px solid ${ss?ss.border:'var(--border)'}`,borderRadius:'var(--r)',padding:'.8rem 1rem',marginBottom:'.5rem',transition:'border-color .15s'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'.6rem'}}>
                    <div style={{width:40,height:40,borderRadius:12,background:ss?.bg||'var(--card3)',border:`1.5px solid ${ss?.border||'var(--border)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.82rem',fontWeight:900,color:ss?.color||'var(--text2)',flexShrink:0,transition:'all .15s'}}>
                      {status?ss.icon:(t.avatar||t.name||'?').slice(0,2)}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:800,fontSize:'.86rem'}}>{t.name}</div>
                      {status?<span style={{fontSize:'.7rem',fontWeight:700,color:ss.color}}>{ss.label}</span>:<span style={{fontSize:'.7rem',color:'var(--text3)'}}>لم يُسجَّل</span>}
                    </div>
                    <div style={{display:'flex',gap:'.3rem',flexShrink:0}}>
                      {Object.entries(S).map(([val,cfg])=>(
                        <button key={val} onClick={()=>setStatus(t.id,val)} title={cfg.label}
                          style={{width:36,height:36,borderRadius:9,border:`2px solid ${status===val?cfg.border:'var(--border)'}`,background:status===val?cfg.bg:'var(--card2)',cursor:'pointer',fontSize:'1rem',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s',boxShadow:status===val?`0 0 0 2px ${cfg.border}`:'none'}}>
                          {cfg.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{marginTop:'.45rem'}}>
                    <input value={note} onChange={e=>setNote(t.id,e.target.value)}
                      placeholder={status==='absent'?'سبب الغياب (اختياري)':status==='excused'?'تفاصيل الاستأذان (اختياري)':'ملاحظة (اختياري)'}
                      style={{...INP,fontSize:'.76rem',padding:'.35rem .6rem',borderColor:(status==='absent'||status==='excused')&&note?S[status].border:'var(--border)'}}/>
                  </div>
                </div>
              )
            })}
            {teachers.length>0&&(
              <div style={{position:'sticky',bottom:'.75rem',marginTop:'.75rem'}}>
                <Btn variant="p" onClick={handleSave} style={{width:'100%',justifyContent:'center',padding:'.72rem',fontSize:'.9rem',boxShadow:'0 4px 20px rgba(0,0,0,.25)'}}>
                  💾 حفظ حضور {selDate===todayISO?'اليوم':fmt(selDate)}
                </Btn>
              </div>
            )}
          </>
        )}

        {savedDates.length>0&&(
          <div style={{marginTop:showForm?'1.5rem':0}}>
            <div style={{fontSize:'.78rem',fontWeight:800,color:'var(--text2)',marginBottom:'.55rem'}}>🗂️ السجلات المحفوظة ({savedDates.length})</div>
            {savedDates.map(date=>{
              const{p,l,a,e}=dayStats(date); const isOpen=expandedDate===date; const dayTeachers=attendance[date]||{}
              return (
                <div key={date} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r)',marginBottom:'.5rem',overflow:'hidden'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'.6rem',padding:'.7rem 1rem',cursor:'pointer'}} onClick={()=>setExpandedDate(isOpen?null:date)}>
                    <div style={{minWidth:80}}>
                      <div style={{fontWeight:800,fontSize:'.84rem'}}>{fmt(date)}</div>
                      <div style={{fontSize:'.65rem',color:'var(--text3)'}}>{dayName(date)}</div>
                    </div>
                    <div style={{flex:1,display:'flex',gap:'.5rem',alignItems:'center',flexWrap:'wrap'}}>
                      {p>0&&<span style={{fontSize:'.72rem',fontWeight:700,color:'var(--green)',background:'var(--gs)',borderRadius:8,padding:'.15rem .5rem',whiteSpace:'nowrap'}}>✅ {p} حاضر</span>}
                      {l>0&&<span style={{fontSize:'.72rem',fontWeight:700,color:'var(--blue)', background:'var(--bs)',borderRadius:8,padding:'.15rem .5rem',whiteSpace:'nowrap'}}>🕐 {l} متأخر</span>}
                      {a>0&&<span style={{fontSize:'.72rem',fontWeight:700,color:'var(--red)',  background:'var(--rs)',borderRadius:8,padding:'.15rem .5rem',whiteSpace:'nowrap'}}>❌ {a} غائب</span>}
                      {e>0&&<span style={{fontSize:'.72rem',fontWeight:700,color:'var(--gold)', background:'var(--golds)',borderRadius:8,padding:'.15rem .5rem',whiteSpace:'nowrap'}}>🟡 {e} استأذان</span>}
                      {(p+l+a+e)===0&&<span style={{fontSize:'.7rem',color:'var(--text3)'}}>لا تسجيلات</span>}
                    </div>
                    <button onClick={ev=>{ev.stopPropagation();setSelDate(date);loadDate(date);setShowForm(true);window.scrollTo({top:0,behavior:'smooth'})}}
                      title="تحرير" style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:8,width:28,height:28,cursor:'pointer',fontSize:'.78rem',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>✏️</button>
                    <div style={{fontSize:'.7rem',color:'var(--text3)',flexShrink:0,transition:'transform .15s',transform:isOpen?'rotate(180deg)':'none'}}>▼</div>
                  </div>
                  {isOpen&&(
                    <div style={{borderTop:'1px solid var(--border)',background:'var(--card2)',padding:'.55rem .85rem'}}>
                      {teachers.length===0
                        ? <div style={{fontSize:'.76rem',color:'var(--text3)',textAlign:'center',padding:'.5rem'}}>لا معلمين</div>
                        : teachers.map(t=>{
                            const rec=dayTeachers[t.id]; const sts=rec?.status||''; const cfg=S[sts]; const note=rec?.note||''
                            const totalP=Object.values(attendance).filter(d=>d[t.id]?.status==='present').length
                            const totalL=Object.values(attendance).filter(d=>d[t.id]?.status==='late').length
                            const totalA=Object.values(attendance).filter(d=>d[t.id]?.status==='absent').length
                            const totalE=Object.values(attendance).filter(d=>d[t.id]?.status==='excused').length
                            return (
                              <div key={t.id} style={{display:'flex',alignItems:'center',gap:'.55rem',padding:'.45rem .35rem',borderBottom:'1px solid var(--border)'}}>
                                <div style={{width:30,height:30,borderRadius:9,background:cfg?.bg||'var(--card3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.72rem',fontWeight:800,color:cfg?.color||'var(--text2)',flexShrink:0}}>
                                  {sts?cfg.icon:(t.avatar||t.name||'?').slice(0,2)}
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:'.8rem',fontWeight:700}}>{t.name}</div>
                                  {note&&<div style={{fontSize:'.67rem',color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{note}</div>}
                                </div>
                                <span style={{fontSize:'.7rem',fontWeight:700,color:cfg?.color||'var(--text3)',background:cfg?.bg||'var(--card3)',borderRadius:7,padding:'.15rem .5rem',flexShrink:0,minWidth:52,textAlign:'center'}}>{cfg?.label||'—'}</span>
                                <div style={{display:'flex',gap:'.3rem',flexShrink:0}}>
                                  <span style={{fontSize:'.65rem',color:'var(--green)',background:'var(--gs)',   borderRadius:6,padding:'.1rem .4rem',fontWeight:700}}>{totalP}✅</span>
                                  <span style={{fontSize:'.65rem',color:'var(--blue)', background:'var(--bs)',   borderRadius:6,padding:'.1rem .4rem',fontWeight:700}}>{totalL}🕐</span>
                                  <span style={{fontSize:'.65rem',color:'var(--red)',  background:'var(--rs)',   borderRadius:6,padding:'.1rem .4rem',fontWeight:700}}>{totalA}❌</span>
                                  <span style={{fontSize:'.65rem',color:'var(--gold)', background:'var(--golds)',borderRadius:6,padding:'.1rem .4rem',fontWeight:700}}>{totalE}🟡</span>
                                </div>
                              </div>
                            )
                          })
                      }
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {savedDates.length===0&&!showForm&&(
          <div style={{textAlign:'center',padding:'2.5rem 1rem',color:'var(--text3)',fontSize:'.82rem',border:'1px dashed var(--border)',borderRadius:'var(--r)',marginTop:'.5rem'}}>
            لا توجد سجلات حضور بعد — اختر تاريخاً واضغط عرض للبدء
          </div>
        )}
      </>
    )
  }

  // ── صفحة تحصيل الرسوم ───────────────────────────────────────────────
  function PageFees() {
    const todayISO = new Date().toISOString().slice(0,10)

    const [editStu, setEditStu] = useState(null)
    const [payDate, setPayDate] = useState(todayISO)
    const [search,  setSearch]  = useState('')

    const paidCount   = students.filter(s => fees[s.id]?.paid).length
    const unpaidCount = students.filter(s => !fees[s.id]?.paid).length

    // بحث بالاسم أو اسم المستخدم
    const filteredStudents = students.filter(s => {
      const q = search.trim().toLowerCase()
      if(!q) return true
      return s.name?.toLowerCase().includes(q) || s.username?.toLowerCase().includes(q)
    })

    function openEdit(s) { setEditStu(s); setPayDate(fees[s.id]?.date || todayISO) }

    function savePaid(sid) {
      setFees(p => ({ ...p, [sid]: { paid: true, date: payDate } }))
      setEditStu(null)
      showToast('✅ تم تسجيل الدفع', 'ok')
    }

    function clearPaid(sid) {
      setFees(p => { const n = {...p}; delete n[sid]; return n })
      showToast('🔄 تم إلغاء تسجيل الدفع', '')
    }

    function fmt(ds) {
      if(!ds) return '—'
      const [y,m,d] = ds.split('-')
      return `${d}/${m}/${y}`
    }

    function dayName(ds) {
      if(!ds) return ''
      return ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][new Date(ds+'T00:00:00').getDay()]
    }

    return (
      <>
        {/* ── بطاقات الإحصاء ── */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'.6rem',marginBottom:'1rem'}}>
          <div style={{background:'var(--gs)',border:'1px solid rgba(34,197,94,.25)',borderRadius:'var(--r)',padding:'.9rem 1rem',textAlign:'center'}}>
            <div style={{fontSize:'2rem',fontWeight:900,color:'var(--green)',lineHeight:1}}>{paidCount}</div>
            <div style={{fontSize:'.7rem',color:'var(--green)',marginTop:'.2rem',fontWeight:700}}>✅ طالب دفع</div>
          </div>
          <div style={{background:'var(--rs)',border:'1px solid rgba(239,68,68,.2)',borderRadius:'var(--r)',padding:'.9rem 1rem',textAlign:'center'}}>
            <div style={{fontSize:'2rem',fontWeight:900,color:'var(--red)',lineHeight:1}}>{unpaidCount}</div>
            <div style={{fontSize:'.7rem',color:'var(--red)',marginTop:'.2rem',fontWeight:700}}>❌ لم يدفع</div>
          </div>
        </div>

        {/* شريط التقدم الكلي */}
        {students.length > 0 && (
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'.85rem 1rem',marginBottom:'1rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.5rem'}}>
              <div style={{fontSize:'.8rem',fontWeight:800}}>نسبة التحصيل الكلية</div>
              <div style={{fontSize:'.9rem',fontWeight:900,color:'var(--green)'}}>
                {Math.round(paidCount/students.length*100)}%
              </div>
            </div>
            <div style={{height:8,background:'var(--card3)',borderRadius:4,overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:4,background:'linear-gradient(90deg,var(--green),var(--green2))',width:`${students.length?Math.round(paidCount/students.length*100):0}%`,transition:'width .4s ease'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:'.35rem',fontSize:'.68rem',color:'var(--text3)'}}>
              <span>{paidCount} من {students.length} طالب</span>
              <span>متبقٍ: {unpaidCount}</span>
            </div>
          </div>
        )}

        {/* ── حقل البحث ── */}
        <div style={{position:'relative',marginBottom:'.85rem'}}>
          <span style={{position:'absolute',right:'.75rem',top:'50%',transform:'translateY(-50%)',fontSize:'.9rem',opacity:.45,pointerEvents:'none'}}>🔍</span>
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="ابحث عن طالب بالاسم أو اسم المستخدم..."
            style={{...INP, paddingRight:'2.2rem',
              boxShadow: search ? '0 0 0 2px rgba(34,197,94,.2)' : 'none',
              borderColor: search ? 'var(--green)' : 'var(--border)',
              transition:'border-color .15s, box-shadow .15s',
            }}
          />
          {search && (
            <button onClick={()=>setSearch('')}
              style={{position:'absolute',left:'.65rem',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text3)',fontSize:'.85rem',padding:0,lineHeight:1}}>
              ✕
            </button>
          )}
        </div>

        {/* نتائج البحث */}
        {search && (
          <div style={{fontSize:'.72rem',color:'var(--text3)',marginBottom:'.55rem',marginTop:'-.4rem'}}>
            {filteredStudents.length === 0
              ? 'لا توجد نتائج'
              : `${filteredStudents.length} نتيجة`
            }
          </div>
        )}

        {/* قائمة الطلاب */}
        {!search && students.length === 0 && (
          <div style={{textAlign:'center',padding:'2.5rem',color:'var(--text3)',fontSize:'.82rem',border:'1px dashed var(--border)',borderRadius:'var(--r)'}}>
            لا يوجد طلاب مسجلون
          </div>
        )}

        {filteredStudents.map(s => {
          const rec    = fees[s.id]
          const isPaid = !!rec?.paid
          return (
            <div key={s.id} style={{
              display:'flex', alignItems:'center', gap:'.65rem',
              background: isPaid ? 'var(--gs)' : 'var(--card2)',
              border: `1px solid ${isPaid ? 'rgba(34,197,94,.3)' : 'var(--border)'}`,
              borderRadius:'var(--rs2)', padding:'.7rem .9rem', marginBottom:'.4rem',
              transition:'all .15s',
            }}>
              {/* أفاتار */}
              <div style={{width:38,height:38,borderRadius:11,background:isPaid?'rgba(34,197,94,.18)':'var(--card3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.8rem',fontWeight:900,color:isPaid?'var(--green)':'var(--text2)',flexShrink:0}}>
                {isPaid ? '✅' : (s.avatar||s.name||'?').slice(0,2)}
              </div>

              {/* الاسم والتفاصيل */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'.84rem',fontWeight:800,color:isPaid?'var(--green)':'var(--text)'}}>{s.name}</div>
                <div style={{fontSize:'.68rem',color:'var(--text2)',marginTop:'.1rem'}}>
                  {isPaid
                    ? <span style={{fontWeight:700,color:'var(--green)'}}>تاريخ الدفع: {fmt(rec.date)} · {dayName(rec.date)}</span>
                    : <span style={{color:'var(--text3)'}}>لم يدفع بعد</span>
                  }
                  {s.district && <span style={{color:'var(--blue)'}}> · 📍{s.district}</span>}
                </div>
              </div>

              {/* الحالة */}
              <span style={{fontSize:'.72rem',fontWeight:800,padding:'.2rem .6rem',borderRadius:10,flexShrink:0,
                background: isPaid ? 'rgba(34,197,94,.15)' : 'var(--rs)',
                color: isPaid ? 'var(--green)' : 'var(--red)',
              }}>
                {isPaid ? 'مدفوع' : 'لم يدفع'}
              </span>

              {/* أزرار */}
              <div style={{display:'flex',gap:'.3rem',flexShrink:0}}>
                {!isPaid
                  ? <Btn variant="p" size="sm" onClick={()=>openEdit(s)}>💵 دفع</Btn>
                  : <Btn size="sm" onClick={()=>confirm2('إلغاء تسجيل الدفع؟',`إلغاء دفع ${s.name} المسجّل بتاريخ ${fmt(rec.date)}`,()=>clearPaid(s.id))}>↩ إلغاء</Btn>
                }
              </div>
            </div>
          )
        })}

        {/* Modal تسجيل الدفع */}
        <Modal open={!!editStu} onClose={()=>setEditStu(null)} title={`💵 تسجيل دفع — ${editStu?.name||''}`}>
          {editStu && (
            <>
              <div style={{display:'flex',alignItems:'center',gap:'.65rem',background:'var(--card2)',border:'1px solid var(--border)',borderRadius:'var(--rs2)',padding:'.65rem .85rem',marginBottom:'1rem'}}>
                <div style={{width:36,height:36,borderRadius:10,background:'var(--card3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.8rem',fontWeight:900,color:'var(--text2)',flexShrink:0}}>{(editStu.avatar||editStu.name||'?').slice(0,2)}</div>
                <div>
                  <div style={{fontSize:'.86rem',fontWeight:800}}>{editStu.name}</div>
                  <div style={{fontSize:'.7rem',color:'var(--text2)'}}>@{editStu.username}{editStu.district?` · ${editStu.district}`:''}</div>
                </div>
              </div>

              <div style={{marginBottom:'1rem'}}>
                <div style={{fontSize:'.74rem',color:'var(--text2)',fontWeight:700,marginBottom:'.3rem'}}>📅 تاريخ الدفع</div>
                <input type="date" value={payDate} onChange={e=>setPayDate(e.target.value)}
                  style={{...INP,width:'auto'}}/>
                {payDate === todayISO && (
                  <div style={{fontSize:'.68rem',color:'var(--green)',marginTop:'.3rem',fontWeight:700}}>اليوم</div>
                )}
              </div>

              <div style={{display:'flex',gap:'.5rem'}}>
                <Btn style={{flex:1,justifyContent:'center'}} onClick={()=>setEditStu(null)}>إلغاء</Btn>
                <Btn variant="p" style={{flex:2,justifyContent:'center'}} onClick={()=>savePaid(editStu.id)}>
                  💾 تأكيد الدفع
                </Btn>
              </div>
            </>
          )}
        </Modal>
      </>
    )
  }

  // ── الـ return الرئيسي ────────────────────────────────────────────────
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>

      {/* Overlay */}
      {sidebarOpen&&<div onClick={()=>setSidebar(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:50}}/>}

      {/* Sidebar */}
      <div style={{position:'fixed',top:0,right:0,height:'100vh',zIndex:51,width:sidebarOpen?230:0,background:'var(--bg2)',borderLeft:sidebarOpen?'1px solid var(--border)':'none',display:'flex',flexDirection:'column',overflow:'hidden',transition:'width .22s cubic-bezier(.4,0,.2,1)',boxShadow:sidebarOpen?'-4px 0 24px rgba(0,0,0,.35)':'none'}}>
        <div style={{padding:'1rem 1rem .85rem',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,minWidth:230}}>
          <div>
            <div style={{fontWeight:900,fontSize:'.95rem',whiteSpace:'nowrap'}}>⚙️ لوحة الإدارة</div>
            <div onClick={()=>{setProfile(true);setSidebar(false)}} style={{fontSize:'.7rem',color:'var(--text2)',cursor:'pointer',marginTop:'.2rem',whiteSpace:'nowrap'}}>🛡️ {currentUser?.name}</div>
          </div>
          <button onClick={()=>setSidebar(false)} style={{background:'var(--card3)',border:'none',borderRadius:8,width:30,height:30,cursor:'pointer',color:'var(--text2)',fontSize:'1rem',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>✕</button>
        </div>
        <nav style={{flex:1,padding:'.6rem .6rem',overflowY:'auto',minWidth:230}}>
          {NAV.map(item=>{
            const active=page===item.id
            return (
              <div key={item.id} onClick={()=>{goPage(item.id);setSidebar(false)}}
                style={{display:'flex',alignItems:'center',gap:'.6rem',padding:'.58rem .75rem',borderRadius:'var(--rx)',cursor:'pointer',marginBottom:'.06rem',transition:'all .12s',background:active?'linear-gradient(135deg,rgba(34,197,94,.18),rgba(34,197,94,.08))':'transparent',border:active?'1px solid rgba(34,197,94,.25)':'1px solid transparent',color:active?'var(--green)':'var(--text2)'}}>
                <span style={{width:28,height:28,borderRadius:8,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.95rem',background:active?'rgba(34,197,94,.15)':'var(--card3)'}}>{item.icon}</span>
                <span style={{flex:1,fontSize:'.82rem',fontWeight:active?800:600,whiteSpace:'nowrap'}}>{item.label}</span>
                {active&&<span style={{color:'var(--green)',fontSize:'.7rem',flexShrink:0}}>◀</span>}
              </div>
            )
          })}
        </nav>
        <div style={{padding:'.75rem .75rem',borderTop:'1px solid var(--border)',minWidth:230}}>
          <button onClick={()=>{onLogout();setSidebar(false)}} style={{width:'100%',background:'var(--rs)',color:'var(--red)',border:'1px solid rgba(239,68,68,.2)',borderRadius:'var(--rx)',padding:'.48rem',fontSize:'.78rem',fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>⬅ خروج</button>
        </div>
      </div>

      {/* Topbar */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'.6rem 1rem',background:'var(--bg2)',borderBottom:'1px solid var(--border)',position:'sticky',top:0,zIndex:40}}>
        <button onClick={()=>setSidebar(v=>!v)} style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:8,width:36,height:36,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,padding:'7px',flexShrink:0}}>
          <span style={{width:18,height:2,background:'var(--text)',borderRadius:2,display:'block'}}/>
          <span style={{width:18,height:2,background:'var(--text)',borderRadius:2,display:'block'}}/>
          <span style={{width:18,height:2,background:'var(--text)',borderRadius:2,display:'block'}}/>
        </button>
        <div style={{fontSize:'.95rem',fontWeight:800,flex:1,textAlign:'center'}}>{TITLES[page]}</div>
        <div style={{display:'flex',gap:'.4rem',flexShrink:0,alignItems:'center'}}>
          <button onClick={onToggleDark} title={darkMode?'وضع فاتح':'وضع داكن'} style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:'1rem',display:'flex',alignItems:'center',justifyContent:'center'}}>{darkMode?'☀️':'🌙'}</button>
          {page==='students'&&<Btn variant="p" size="sm" onClick={()=>setAddRole('student')}>+ طالب</Btn>}
          {page==='teachers'&&<Btn variant="p" size="sm" onClick={()=>setAddRole('teacher')}>+ معلم</Btn>}
        </div>
      </div>

      {/* المحتوى */}
      <div style={{flex:1,padding:'.9rem 1rem',overflowY:'auto',maxWidth:860,width:'100%',margin:'0 auto',boxSizing:'border-box'}}>
        {page==='students'   && <PageStudents/>}
        {page==='teachers'   && <PageTeachers/>}
        {page==='groups'     && <PageGroups/>}
        {page==='attendance' && <PageAttendance/>}
        {page==='fees'       && <PageFees/>}
      </div>

      {/* Modals */}
      <ProfileModal open={showProfile} user={currentUser} onClose={()=>setProfile(false)} onSave={ch=>{onUpdateUser(ch);setProfile(false);showToast('✅ تم','ok')}}/>
      <EditUserModal open={!!editingUser} user={editingUser} onClose={()=>setEditUser(null)} onSave={ch=>{onUpdateUsers(p=>p.map(u=>u.id===editingUser.id?{...u,...ch}:u));setEditUser(null);showToast('✅ تم','ok')}}/>
      <AddUserModal open={!!addRole} role={addRole} onClose={()=>setAddRole(null)} onSave={d=>{
        const colors=['g','b','o','r','p']; const col=colors[users.length%colors.length]
        onUpdateUsers(p=>[...p,{...d,id:Date.now(),role:addRole,avatar:d.name.slice(0,2),color:col,
          ...(addRole==='student'?{warned:0,suspended:false,disabled:false,reward:null}:{disabled:false})}])
        setAddRole(null); showToast(`✅ تم إضافة ${addRole==='student'?'الطالب':'المعلم'}`,'ok')
      }}/>
      <Modal open={!!confirmData} onClose={()=>setConfirm(null)} title={`⚠️ ${confirmData?.title||''}`}>
        {confirmData&&<><p style={{fontSize:'.8rem',color:'var(--text2)',marginBottom:'1.1rem',lineHeight:1.6}}>{confirmData.msg||'هل أنت متأكد؟'}</p><div style={{display:'flex',gap:'.5rem'}}><Btn style={{flex:1,justifyContent:'center'}} onClick={()=>setConfirm(null)}>إلغاء</Btn><Btn variant="d" style={{flex:1,justifyContent:'center'}} onClick={()=>{confirmData.cb?.();setConfirm(null)}}>تأكيد</Btn></div></>}
      </Modal>
    </div>
  )
}
