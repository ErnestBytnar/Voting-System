"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Search, CheckCircle, Box, Server, Clock, Database } from "lucide-react"

const API_URL = "http://localhost:8000"

function VerifyContent() {
  const searchParams = useSearchParams()
  const initialHash = searchParams.get("id") || ""

  const [searchHash, setSearchHash] = useState(initialHash)
  const [ledger, setLedger] = useState<any[]>([])
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Pobranie Ledgera (Blockchain)
  useEffect(() => {
    fetch(`${API_URL}/public-ledger`)
      .then(res => res.json())
      .then(data => setLedger(data))
      .catch(err => console.error("Ledger offline", err))
  }, [])

  // Automatyczna weryfikacja jeśli weszliśmy z linku
  useEffect(() => {
    if (initialHash) handleVerify(initialHash)
  }, [initialHash])

  const handleVerify = async (hash: string) => {
    setLoading(true)
    setVerificationResult(null)
    try {
      const res = await fetch(`${API_URL}/verify-vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash }),
      })

      if (res.ok) {
        const data = await res.json()
        setVerificationResult(data)
      } else {
        alert("Hash not found in the secure ledger!")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-6">
          <Database className="w-8 h-8 text-emerald-500" />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Public Vote Ledger</h1>
            <p className="text-xs text-emerald-500 font-mono">IMMUTABLE RECORD CHAIN v2.4</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT: Verification Tool */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-400" /> Verify My Vote
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchHash}
                  onChange={(e) => setSearchHash(e.target.value)}
                  placeholder="Paste your Receipt Hash here..."
                  className="flex-1 bg-slate-950 border border-slate-700 p-3 rounded font-mono text-xs text-emerald-400 focus:border-emerald-500 outline-none"
                />
                <button
                  onClick={() => handleVerify(searchHash)}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-500 px-6 rounded font-bold transition-colors"
                >
                  {loading ? "..." : "Check"}
                </button>
              </div>

              {verificationResult && (
                <div className="mt-6 p-4 bg-emerald-900/20 border border-emerald-500/50 rounded-lg animate-fadeIn">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                    <div>
                      <div className="text-lg font-bold text-emerald-400">Vote Verified!</div>
                      <div className="text-xs text-slate-400">Cryptographically confirmed</div>
                    </div>
                  </div>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between border-b border-slate-700 pb-1">
                      <span className="text-slate-500">Candidate:</span>
                      <span className="text-white font-bold">{verificationResult.candidate}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700 pb-1">
                      <span className="text-slate-500">Timestamp:</span>
                      <span className="text-slate-300">{verificationResult.timestamp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sig Fragment:</span>
                      <span className="text-slate-500 truncate w-32">{verificationResult.signature_fragment}</span>
                    </div>
                  </div>
                  <div className="mt-4 text-[10px] text-center text-slate-500">
                    This result is derived from the immutable ledger using your unique hash.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Public Ledger Stream */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
              <div className="font-bold text-sm flex items-center gap-2">
                <Box className="w-4 h-4 text-purple-400" /> Recent Blocks
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Server className="w-3 h-3 text-emerald-500 animate-pulse" /> Live
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-2 font-mono text-xs">
              {ledger.length === 0 ? (
                <div className="text-center text-slate-600 mt-10">Waiting for votes...</div>
              ) : (
                ledger.map((entry, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded hover:border-purple-500/50 transition-colors group">
                    <div className="flex justify-between mb-1">
                      <span className="text-purple-400 font-bold">Block #{entry.block}</span>
                      <span className="text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-slate-500 truncate group-hover:text-slate-300 transition-colors">
                      Hash: {entry.hash}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-10 text-white">Loading Verification Module...</div>}>
      <VerifyContent />
    </Suspense>
  )
}