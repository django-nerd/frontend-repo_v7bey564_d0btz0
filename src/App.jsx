import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
      fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(setUser)
        .catch(() => setUser(null))
    } else {
      localStorage.removeItem('token')
      setUser(null)
    }
  }, [token])

  return { token, setToken, user, setUser }
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.15),transparent_30%)] pointer-events-none"></div>
      <header className="relative z-10 border-b border-white/10 backdrop-blur-sm sticky top-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl tracking-tight">FoodRankr</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/feed" className="hover:text-blue-300">Feed</Link>
            <Link to="/rank" className="hover:text-blue-300">Rank Today</Link>
            <Link to="/admin" className="hover:text-blue-300">Admin</Link>
          </nav>
        </div>
      </header>
      <main className="relative z-10">
        {children}
      </main>
    </div>
  )
}

function AuthGate() {
  const { token, setToken, user } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', full_name: '', country: '', company: '', cafe_name: '' })
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    if (mode === 'login') {
      const body = new URLSearchParams()
      body.append('username', form.email)
      body.append('password', form.password)
      const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      if (res.ok) {
        const data = await res.json(); setToken(data.access_token); navigate('/feed')
      }
    } else {
      const res = await fetch(`${API_BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) {
        const data = await res.json(); setToken(data.access_token); navigate('/onboarding')
      }
    }
  }

  if (token && user) return null

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10">
      <div>
        <h1 className="text-4xl font-bold mb-4">Rate your cafe meals, daily.</h1>
        <p className="text-slate-300 mb-6">Snap a photo, pick your dish, and give it a score. See how your office ranks over time.</p>
        <ul className="space-y-2 text-slate-300 text-sm">
          <li>• Daily ranking with comments</li>
          <li>• Company approval flow</li>
          <li>• Clean admin dashboard</li>
        </ul>
      </div>
      <form onSubmit={submit} className="bg-slate-900/60 border border-white/10 rounded-xl p-6 space-y-4">
        <div className="flex gap-2 text-slate-400 text-sm">
          <button type="button" onClick={() => setMode('login')} className={`${mode==='login'?'text-white':''}`}>Login</button>
          <span>•</span>
          <button type="button" onClick={() => setMode('register')} className={`${mode==='register'?'text-white':''}`}>Register</button>
        </div>
        <input className="w-full bg-slate-800/80 rounded px-3 py-2" placeholder="Work email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
        <input className="w-full bg-slate-800/80 rounded px-3 py-2" placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
        {mode==='register' && (
          <>
            <input className="w-full bg-slate-800/80 rounded px-3 py-2" placeholder="Full name" value={form.full_name} onChange={e=>setForm({...form, full_name:e.target.value})} required />
            <input className="w-full bg-slate-800/80 rounded px-3 py-2" placeholder="Country" value={form.country} onChange={e=>setForm({...form, country:e.target.value})} required />
            <input className="w-full bg-slate-800/80 rounded px-3 py-2" placeholder="Company (select or type new)" value={form.company} onChange={e=>setForm({...form, company:e.target.value})} />
            <input className="w-full bg-slate-800/80 rounded px-3 py-2" placeholder="Cafe name" value={form.cafe_name} onChange={e=>setForm({...form, cafe_name:e.target.value})} />
          </>
        )}
        <button className="w-full bg-blue-600 hover:bg-blue-500 rounded px-3 py-2 font-medium">{mode==='login'? 'Sign in':'Create account'}</button>
      </form>
    </div>
  )
}

function Feed({ token }) {
  const [ranks, setRanks] = useState([])
  const [companies, setCompanies] = useState([])
  const [companyId, setCompanyId] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/companies`).then(r=>r.json()).then(setCompanies)
  }, [])
  useEffect(() => {
    const url = new URL(`${API_BASE}/ranks`)
    if (companyId) url.searchParams.set('company_id', companyId)
    fetch(url).then(r=>r.json()).then(setRanks)
  }, [companyId])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <select value={companyId} onChange={e=>setCompanyId(e.target.value)} className="bg-slate-900/60 border border-white/10 rounded px-3 py-2">
          <option value="">All companies</option>
          {companies.map(c=> <option key={c._id} value={c._id}>{c.name} • {c.country}</option>)}
        </select>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ranks.map(r => (
          <div key={r._id} className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
            {r.image_url ? (
              <img src={r.image_url} alt={r.dish} className="h-40 w-full object-cover" />
            ) : (
              <div className="h-40 w-full bg-gradient-to-br from-blue-900/40 to-purple-900/40 flex items-center justify-center text-slate-400">No image</div>
            )}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{r.dish}</h3>
                <span className="text-blue-300">{Array.from({length:r.rating}).map((_,i)=>'★').join('')}</span>
              </div>
              <p className="text-slate-400 text-sm">{r.cafe_name} • {r.country} • {r.date}</p>
              {r.comment && <p className="text-slate-300 text-sm mt-2">“{r.comment}”</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RankForm({ token, user }) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), dish: '', rating: 3, comment: '', image_url: '' })
  const [message, setMessage] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    const res = await fetch(`${API_BASE}/ranks`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
    if (res.ok) { setMessage('Saved!'); setForm({ ...form, dish:'', rating:3, comment:'', image_url:'' }) } else { setMessage('Error') }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <form onSubmit={submit} className="bg-slate-900/60 border border-white/10 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">Rank today's dish</h2>
        <input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} className="w-full bg-slate-800/80 rounded px-3 py-2" />
        <input placeholder="Main dish" value={form.dish} onChange={e=>setForm({...form, dish:e.target.value})} className="w-full bg-slate-800/80 rounded px-3 py-2" required />
        <input type="url" placeholder="Image URL" value={form.image_url} onChange={e=>setForm({...form, image_url:e.target.value})} className="w-full bg-slate-800/80 rounded px-3 py-2" />
        <textarea placeholder="Comment (optional)" value={form.comment} onChange={e=>setForm({...form, comment:e.target.value})} className="w-full bg-slate-800/80 rounded px-3 py-2"></textarea>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-300">Rating</label>
          <input type="range" min="1" max="5" value={form.rating} onChange={e=>setForm({...form, rating:Number(e.target.value)})} />
          <span className="text-blue-300 font-semibold">{form.rating}</span>
        </div>
        <button className="w-full bg-blue-600 hover:bg-blue-500 rounded px-3 py-2 font-medium">Submit</button>
        {message && <p className="text-sm text-slate-300">{message}</p>}
      </form>
    </div>
  )
}

function Admin({ token }) {
  const [stats, setStats] = useState(null)
  const [pending, setPending] = useState([])

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()).then(setStats)
      fetch(`${API_BASE}/companies?approved=false`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()).then(setPending)
    }
  }, [token])

  const approve = async (id, approved) => {
    await fetch(`${API_BASE}/admin/companies/approve`, { method:'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ company_id: id, approved }) })
    const refreshed = await fetch(`${API_BASE}/companies?approved=false`, { headers: { Authorization: `Bearer ${token}` } })
    setPending(await refreshed.json())
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <h2 className="text-2xl font-semibold">Admin</h2>
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats).map(([k,v]) => (
            <div key={k} className="bg-slate-900/60 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{v}</div>
              <div className="text-slate-400 text-sm capitalize">{k.replace('_',' ')}</div>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className="font-medium mb-2">Pending companies</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pending.map(c => (
            <div key={c._id} className="bg-slate-900/60 border border-white/10 rounded-xl p-4">
              <div className="font-semibold">{c.name}</div>
              <div className="text-slate-400 text-sm">{c.country}</div>
              <div className="mt-3 flex gap-2">
                <button onClick={()=>approve(c._id, true)} className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded text-sm">Approve</button>
                <button onClick={()=>approve(c._id, false)} className="bg-rose-600 hover:bg-rose-500 px-3 py-1 rounded text-sm">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AppShell() {
  const auth = useAuth()

  return (
    <Layout>
      {!auth.user ? (
        <AuthGate />
      ) : (
        <Routes>
          <Route path="/" element={<Feed token={auth.token} />} />
          <Route path="/feed" element={<Feed token={auth.token} />} />
          <Route path="/rank" element={<RankForm token={auth.token} user={auth.user} />} />
          <Route path="/admin" element={<Admin token={auth.token} />} />
          <Route path="*" element={<Feed token={auth.token} />} />
        </Routes>
      )}
    </Layout>
  )
}

export default function App(){
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
