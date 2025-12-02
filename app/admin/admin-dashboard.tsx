"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ShieldAlert, RefreshCcw, Save } from "lucide-react"

const API_URL = "http://localhost:8000";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [config, setConfig] = useState({ target: "Dr. Margaret Chen", ratio: 0.4 });
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    const res = await fetch(`${API_URL}/admin/stats`);
    const data = await res.json();
    setStats(data);
    setConfig({ target: data.current_config.target, ratio: data.current_config.ratio });
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 2000); // Live refresh co 2s
    return () => clearInterval(interval);
  }, []);

  const handleConfigUpdate = async () => {
    setLoading(true);
    await fetch(`${API_URL}/admin/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_candidate: config.target, fraud_ratio: config.ratio })
    });
    setLoading(false);
    alert("Parametry sfałszowania zaktualizowane!");
  };

  const handleReset = async () => {
    if(confirm("Czy na pewno usunąć wszystkie głosy? Tego nie da się cofnąć.")) {
      await fetch(`${API_URL}/admin/reset`, { method: 'POST' });
      fetchStats();
    }
  };

  // Przygotowanie danych do wykresu
  const chartData = stats ? Object.keys({ ...stats.real_results, ...stats.public_results }).map(candidate => ({
    name: candidate.split(' ').pop(), // Tylko nazwisko dla czytelności
    Prawdziwe: stats.real_results[candidate] || 0,
    Oficjalne: stats.public_results[candidate] || 0,
  })) : [];

  if (!stats) return <div className="text-white">Loading Admin Matrix...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8 bg-slate-950 min-h-screen text-slate-100">

      {/* Header */}
      <div className="flex justify-between items-center border-b border-red-900/50 pb-6">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
          <div>
            <h1 className="text-3xl font-bold text-red-500">SYSTEM OVERRIDE</h1>
            <p className="text-xs text-red-400 font-mono">AUTHORIZED ACCESS ONLY /// LEVEL 5</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Total Votes: <span className="text-white font-mono text-xl">{stats.total_votes}</span></p>
          <p className="text-sm text-red-400">Manipulated: <span className="font-mono text-xl">{stats.manipulated_count}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Controls Panel */}
        <div className="bg-slate-900 p-6 rounded-xl border border-red-900/30 space-y-6">
          <h2 className="text-xl font-bold text-slate-200 mb-4">Manipulation Parameters</h2>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Target Beneficiary (Winner)</label>
            <select
              value={config.target}
              onChange={(e) => setConfig({...config, target: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
            >
              {["Dr. Margaret Chen", "James Morrison", "Sarah Williams", "Alex Rodriguez"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Greed Factor: {(config.ratio * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0" max="1" step="0.05"
              value={config.ratio}
              onChange={(e) => setConfig({...config, ratio: parseFloat(e.target.value)})}
              className="w-full accent-red-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-2">
              0% = Honest Election | 100% = Total Dictatorship
            </p>
          </div>

          <button
            onClick={handleConfigUpdate}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded flex items-center justify-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" /> Apply Configuration
          </button>

          <div className="pt-8 border-t border-slate-800">
             <button
              onClick={handleReset}
              className="w-full border border-slate-600 hover:bg-slate-800 text-slate-400 font-mono text-xs py-2 rounded flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-3 h-3" /> FLUSH DATABASE
            </button>
          </div>
        </div>

        {/* Dual View Charts */}
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h2 className="text-xl font-bold text-slate-200 mb-6 flex justify-between">
            <span>Live Sentiment Analysis</span>
            <span className="text-xs font-normal text-slate-500 border border-slate-700 px-2 py-1 rounded">SHADOW LEDGER ACCESS</span>
          </h2>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <Bar dataKey="Prawdziwe" fill="#3b82f6" name="Real Votes (Hidden)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Oficjalne" fill="#ef4444" name="Official Results (Public)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}