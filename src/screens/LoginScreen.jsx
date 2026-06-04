import { useState } from 'react'

export default function LoginScreen({ allUsers, onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  function handleLogin(e) {
    e.preventDefault()
    setError('')
    if (!username.trim()) { setError('يرجى إدخال اسم المستخدم'); return }
    if (!password)        { setError('كلمة المرور لا يمكن أن تكون فارغة'); return }
    setLoading(true)
    setTimeout(() => {
      const user = (allUsers||[]).find(u => u.username === username.trim() && u.password === password)
      if (!user)          { setError('اسم المستخدم أو كلمة المرور غير صحيحة'); setLoading(false); return }
      if (user.suspended) { setError('حسابك موقوف — تواصل مع المشرف');          setLoading(false); return }
      setLoading(false)
      onLogin(user)
    }, 600)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'#d1c8bd', fontFamily:'inherit', position:'relative', overflow:'hidden' }}>

      {/* ── شبكة الشعار المتكررة (خلفية زخرفية) ── */}
      <div style={{
        position:'fixed',
        inset:0,
        zIndex:0,
        pointerEvents:'none',
        display:'grid',
        gridTemplateColumns:'repeat(auto-fill, 90px)',
        gridTemplateRows:'repeat(auto-fill, 90px)',
        gap:'18px',
        padding:'18px',
        alignContent:'start',
        opacity:0.15,
      }}>
        {/* opacity: القيمة من 0 (مخفي تماماً) إلى 1 (ظاهر تماماً) — عدّلها هنا */}
        {Array.from({ length: 120 }).map((_,i) => (
          <img key={i} src="/logo2.png" alt=""
            style={{ width:90, height:90, objectFit:'contain',
              transform: i%3===0 ? 'rotate(-8deg)' : i%3===1 ? 'rotate(4deg)' : 'rotate(0deg)',
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes shimmer{0%,100%{opacity:.85}50%{opacity:1}}
        .login-inp{width:100%;background:#f7f9fc;border:1.5px solid #e2e8f0;border-radius:10px;padding:.7rem 1rem;color:#1a202c;font-family:inherit;font-size:.92rem;outline:none;transition:border-color .2s,background .2s;box-sizing:border-box}
        .login-inp:focus{border-color:#1a7a4a;background:#fff}
        .login-inp::placeholder{color:#a0aec0}
        .login-btn{width:100%;padding:.8rem;border-radius:10px;border:none;font-size:.96rem;font-weight:800;cursor:pointer;font-family:inherit;transition:all .2s;letter-spacing:.02em}
        .login-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 24px rgba(26,122,74,.4)}
        .demo-btn{background:#f0f7f4;border:1.5px solid #c6e6d4;border-radius:9px;padding:.42rem .3rem;font-size:.7rem;color:#2d6a4f;cursor:pointer;font-family:inherit;text-align:center;transition:all .15s;width:100%}
        .demo-btn:hover{background:#d8f3e3;border-color:#1a7a4a}
      `}</style>

      {/* ── القسم العلوي الأخضر ── */}
      <div style={{
        background:'linear-gradient(165deg, #1a7a4a 0%, #0f5c36 45%, #0a4228 100%)',
        flex:'0 0 58%',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        position:'relative', overflow:'hidden', zIndex:1,
        borderBottomLeftRadius:40, borderBottomRightRadius:40,
        boxShadow:'0 8px 32px rgba(10,66,40,.35)',
      }}>
        {/* دوائر زخرفية */}
        <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.05)' }}/>
        <div style={{ position:'absolute', bottom:-80, left:-40, width:240, height:240, borderRadius:'50%', background:'rgba(255,255,255,.04)' }}/>
        <div style={{ position:'absolute', top:20, left:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.04)' }}/>

        {/* الشعار */}
        <div style={{
          width:110, height:110, borderRadius:30,
          background:'rgba(255,255,255,.12)',
          border:'2px solid rgba(255,255,255,.2)',
          display:'flex', alignItems:'center', justifyContent:'center',
          marginBottom:'1.1rem',
          boxShadow:'0 0 0 24px rgba(209,200,189,.08)',
          overflow:'hidden',
        }}>
          <img src="/logo2.png" alt="المركز العلمي بجامع الفليج - ولاية إبراء" style={{ width:'100%', height:'100%', objectFit:'contain' }}
            onError={e=>{ e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
          />
          <div style={{ display:'none', width:'100%', height:'100%', alignItems:'center', justifyContent:'center', fontSize:'2.8rem' }}>📖</div>
        </div>

        <h1 style={{ color:'#fff', fontSize:'1.15rem', fontWeight:900, margin:'0 0 .3rem', letterSpacing:'-.02em', textShadow:'0 2px 12px rgba(0,0,0,.2)' }}>
          المركز العلمي بجامع الفليج - ولاية إبراء
        </h1>
        <p style={{ color:'rgba(255,255,255,.6)', fontSize:'.84rem', margin:0 }}>
          منصة تتبع الدراسة الصيفية 2026
        </p>
      </div>

      {/* ── القسم السفلي الأبيض ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'2rem 1.75rem', maxWidth:420, width:'100%', margin:'0 auto', boxSizing:'border-box', position:'relative', zIndex:1 }}>

        <form onSubmit={handleLogin} style={{ marginTop:'.5rem' }}>
          {/* اسم المستخدم */}
          <div style={{ marginBottom:'.9rem' }}>
            <label style={{ fontSize:'.75rem', color:'#4a5568', fontWeight:700, display:'block', marginBottom:'.35rem' }}>اسم المستخدم</label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', right:'.85rem', top:'50%', transform:'translateY(-50%)', fontSize:'.9rem', opacity:.5 }}>👤</span>
              <input className="login-inp" value={username}
                onChange={e=>{setUsername(e.target.value);setError('')}}
                placeholder="أدخل اسم المستخدم"
                autoComplete="username"
                style={{ paddingRight:'2.4rem' }}
              />
            </div>
          </div>

          {/* كلمة المرور */}
          <div style={{ marginBottom:'1.25rem' }}>
            <label style={{ fontSize:'.75rem', color:'#4a5568', fontWeight:700, display:'block', marginBottom:'.35rem' }}>كلمة المرور</label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', right:'.85rem', top:'50%', transform:'translateY(-50%)', fontSize:'.9rem', opacity:.5 }}>🔑</span>
              <input className="login-inp"
                type={showPass?'text':'password'}
                value={password} onChange={e=>{setPassword(e.target.value);setError('')}}
                placeholder="أدخل كلمة المرور"
                autoComplete="current-password"
                style={{ paddingRight:'2.4rem', paddingLeft:'2.6rem' }}
              />
              <button type="button" onClick={()=>setShowPass(v=>!v)}
                style={{ position:'absolute', left:'.75rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#a0aec0', fontSize:'1rem', padding:0 }}>
                {showPass?'🙈':'👁️'}
              </button>
            </div>
          </div>

          {/* خطأ */}
          {error && (
            <div style={{ background:'#fff5f5', border:'1px solid #fed7d7', borderRadius:9, padding:'.5rem .85rem', fontSize:'.78rem', color:'#c53030', marginBottom:'.85rem', textAlign:'center', fontWeight:600 }}>
              ⚠️ {error}
            </div>
          )}

          {/* زر الدخول */}
          <button type="submit" disabled={loading} className="login-btn" style={{
            background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#1a7a4a,#0f5c36)',
            color: loading ? '#a0aec0' : '#fff',
            boxShadow: loading ? 'none' : '0 4px 18px rgba(26,122,74,.3)',
          }}>
            {loading ? '⏳ جاري التحقق...' : '🔓 دخول'}
          </button>
        </form>

      </div>
    </div>
  )
}