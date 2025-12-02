"use client"

import { useEffect, useState } from "react"
import { ShieldAlert, RefreshCcw, Save, BarChart3, Lock } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = "http://localhost:8000";

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [config, setConfig] = useState({ target: "Dr. Margaret Chen", ratio: 0.4, mode: "SIMPLE" });
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState("");

  // Proste zabezpieczenie "na hasło" przed wykładowcą ;)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if(password === "admin123") setIsAuthorized(true);
    else alert("Access Denied");
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        // Aktualizuj config tylko jeśli nie edytujemy go lokalnie (opcjonalne, tu dla uproszczenia nadpisujemy)
        setConfig({
            target: data.current_config.target,
            ratio: data.current_config.ratio,
            mode: data.current_config.mode
        });
      }
    } catch (e) {
      console.error("Błąd połączenia z API", e);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchStats();
      const interval = setInterval(fetchStats, 2000); // Odświeżanie live co 2s
      return () => clearInterval(interval);
    }
  }, [isAuthorized]);

  const handleConfigUpdate = async () => {
    setLoading(true);
    await fetch(`${API_URL}/admin/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          target_candidate: config.target,
          fraud_ratio: config.ratio,
          fraud_mode: config.mode
      })
    });
    setLoading(false);
    alert("Strategia manipulacji zaktualizowana!");
    fetchStats();
  };

  const handleReset = async () => {
    if(confirm("Czy na pewno usunąć wszystkie głosy? Tego nie da się cofnąć.")) {
      await fetch(`${API_URL}/admin/reset`, { method: 'POST' });
      fetchStats();
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-slate-900 p-8 rounded-xl border border-slate-800 w-full max-w-md space-y-4">
          <div className="flex justify-center mb-4">
            <Lock className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-center text-slate-100">SYSTEM OVERRIDE ACCESS</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 p-3 rounded text-white text-center tracking-widest"
            placeholder="ENTER PASSCODE"
          />
          <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded">UNLOCK</button>
          <p className="text-center text-xs text-slate-500">Hint: admin123</p>
        </form>
      </div>
    )
  }

  if (!stats) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-500 font-mono">CONNECTING TO SHADOW LEDGER...</div>;

  // Transformacja danych do wykresu
  const chartData = Object.keys({ ...stats.real_results, ...stats.public_results }).map(candidate => ({
    name: candidate.split(' ').pop(), // Tylko nazwisko
    Prawdziwe: stats.real_results[candidate] || 0,
    Oficjalne: stats.public_results[candidate] || 0,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center border-b border-red-900/30 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-full animate-pulse">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-red-500 tracking-wider">GOD MODE PANEL</h1>
              <p className="text-xs text-red-400 font-mono">CONTROLLED ENVIRONMENT /// LEVEL 5 ACCESS</p>
            </div>
          </div>
          <div className="text-right font-mono">
            <div className="text-sm text-slate-400">Total Votes: <span className="text-white text-lg">{stats.total_votes}</span></div>
            <div className="text-sm text-red-400">Manipulated: <span className="text-red-500 text-lg font-bold">{stats.manipulated_count}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Controls */}
          <div className="bg-slate-900 p-6 rounded-xl border border-red-900/20 space-y-8 shadow-2xl">
            <div>
              <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Save className="w-5 h-5 text-red-400" /> Configuration
              </h2>

              <div className="space-y-6">
                {/* Wybór Kandydata */}
                <div>
                  <label className="block text-xs uppercase text-slate-500 font-bold mb-2">Target Winner</label>
                  <select
                    value={config.target}
                    onChange={(e) => setConfig({...config, target: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white focus:border-red-500 focus:outline-none transition-colors"
                  >
                    {chartData.map(c => (
                      <option key={c.name} value={`Dr. ${c.name}`}>{c.name}</option>
                    ))}
                    <option value="Dr. Margaret Chen">Dr. Margaret Chen</option>
                    <option value="James Morrison">James Morrison</option>
                    <option value="Sarah Williams">Sarah Williams</option>
                    <option value="Alex Rodriguez">Alex Rodriguez</option>
                  </select>
                </div>

                {/* Wybór Trybu Manipulacji */}
                <div>
                  <label className="block text-xs uppercase text-slate-500 font-bold mb-2">Manipulation Strategy</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                        {id: "SIMPLE", label: "Simple Ratio (Płaski Szum)", desc: "Stałe prawdopodobieństwo kradzieży"},
                        {id: "ADAPTIVE", label: "Adaptive AI (Inteligentny)", desc: "Kradnie tylko gdy cel przegrywa (<52%)"},
                        {id: "WAVE", label: "Wave Burst (Falowy)", desc: "Atakuje seriami co 10 głosów"},
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => setConfig({...config, mode: mode.id})}
                            className={`p-3 rounded text-left border transition-all ${
                                config.mode === mode.id
                                ? "bg-red-900/30 border-red-500 text-white"
                                : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                            }`}
                        >
                            <div className="font-bold text-sm">{mode.label}</div>
                            <div className="text-[10px] opacity-70">{mode.desc}</div>
                        </button>
                    ))}
                  </div>
                </div>

                {/* Suwak (Tylko dla trybu SIMPLE/WAVE - w Adaptive jest ignorowany/automatyczny) */}
                <div className={config.mode === "ADAPTIVE" ? "opacity-30 pointer-events-none" : ""}>
                  <label className="block text-xs uppercase text-slate-500 font-bold mb-2 flex justify-between">
                    <span>Aggression Level</span>
                    <span className="text-red-400">{(config.ratio * 100).toFixed(0)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0" max="1" step="0.1"
                    value={config.ratio}
                    onChange={(e) => setConfig({...config, ratio: parseFloat(e.target.value)})}
                    className="w-full accent-red-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-mono">
                    <span>HONEST</span>
                    <span>RIGGED</span>
                    <span>DICTATOR</span>
                  </div>
                </div>

                <button
                  onClick={handleConfigUpdate}
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded shadow-lg shadow-red-900/20 transition-all flex justify-center items-center gap-2"
                >
                  {loading ? "Injecting..." : "APPLY OVERRIDE"}
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <button
                onClick={handleReset}
                className="w-full border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white py-2 rounded flex items-center justify-center gap-2 text-sm transition-colors"
              >
                <RefreshCcw className="w-4 h-4" /> FLUSH DATABASE (PANIC)
              </button>
            </div>
          </div>

          {/* Wykresy */}
          <div className="lg:col-span-2 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-2xl flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" /> Live Sentinel View
                </h2>
                <p className="text-xs text-slate-500">Comparing Raw Database vs Public API Output</p>
              </div>
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded text-xs font-mono animate-pulse">
                LIVE FEED
              </span>
            </div>

            <div className="flex-1 min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#475569" tick={{fill: '#94a3b8'}} />
                  <YAxis stroke="#475569" tick={{fill: '#94a3b8'}} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                  <Bar dataKey="Prawdziwe" name="REAL VOTES (Hidden)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="Oficjalne" name="PUBLIC RESULTS (Fake)" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}