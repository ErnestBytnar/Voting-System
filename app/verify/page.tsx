"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Search, CheckCircle, Box, Server, Clock, Database, AlertTriangle, Eye } from "lucide-react"

const API_URL = "http://localhost:8000"

function VerifyContent() {
  const searchParams = useSearchParams()
  const initialHash = searchParams.get("id") || ""

  const [searchHash, setSearchHash] = useState(initialHash)
  const [ledger, setLedger] = useState<any[]>([])
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Pobranie Ledgera (Blockchain) - To są dane "publiczne" (zmanipulowane)
  useEffect(() => {
    fetch(`${API_URL}/public-ledger`)
      .then(res => res.json())
      .then(data => setLedger(data))
      .catch(err => console.error("Ledger offline", err))
  }, [])

  useEffect(() => {
    if (initialHash) handleVerify(initialHash)
  }, [initialHash])

  const handleVerify = async (hash: string) => {
    setLoading(true)
    setVerificationResult(null)
    try {
      // Weryfikacja indywidualna zwraca PRAWDZIWEGO kandydata (dla uspokojenia użytkownika)
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
          <div className="p-3 bg-emerald-500/10 rounded-full">
            <Database className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Public Vote Ledger</h1>
            <p className="text-xs text-emerald-500 font-mono">IMMUTABLE RECORD CHAIN v2.4 (LIVE)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT: Verification Tool (Twoja Prawda) */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-500/10 px-3 py-1 text-[10px] text-blue-400 font-mono border-b border-l border-blue-500/20 rounded-bl-lg">
                INDIVIDUAL VERIFIABILITY
              </div>

              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-400" /> Verify My Vote
              </h2>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchHash}
                  onChange={(e) => setSearchHash(e.target.value)}
                  placeholder="Paste Receipt Hash..."
                  className="flex-1 bg-slate-950 border border-slate-700 p-3 rounded font-mono text-xs text-emerald-400 focus:border-emerald-500 outline-none"
                />
                <button
                  onClick={() => handleVerify(searchHash)}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded font-bold transition-all disabled:opacity-50"
                >
                  {loading ? "..." : "Check"}
                </button>
              </div>

              {verificationResult && (
                <div className="mt-6 p-5 bg-emerald-900/10 border border-emerald-500/30 rounded-lg animate-fadeIn">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                    <div>
                      <div className="text-lg font-bold text-emerald-400">Vote Verified & Counted</div>
                      <div className="text-xs text-slate-400">Cryptographically confirmed integrity</div>
                    </div>
                  </div>

                  <div className="space-y-3 font-mono text-xs bg-slate-950/50 p-4 rounded border border-slate-800">
                    <div className="flex justify-between border-b border-slate-700 pb-2">
                      <span className="text-slate-500">Your Selection:</span>
                      <span className="text-white font-bold tracking-wide">{verificationResult.candidate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="text-emerald-500 flex items-center gap-1">
                         VALID <CheckCircle className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Public Ledger Stream (Zmanipulowana Rzeczywistość) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[650px] shadow-2xl">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
              <div className="font-bold text-sm flex items-center gap-2 text-slate-200">
                <Box className="w-4 h-4 text-purple-400" /> Official Blockchain Record
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">
                <Server className="w-3 h-3 animate-pulse" /> Live Node
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-3 font-mono text-xs custom-scrollbar">
              {ledger.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-4">
                    <div className="animate-spin w-8 h-8 border-2 border-slate-600 border-t-transparent rounded-full"></div>
                    <p>Syncing Ledger...</p>
                </div>
              ) : (
                ledger.map((entry, idx) => {
                  // --- MECHANIZM OSZUSTWA "SPLIT VIEW" ---
                  // Sprawdzamy, czy ten wpis w blockchainie odpowiada głosowi, który użytkownik właśnie zweryfikował.
                  const isMyVote = verificationResult && entry.hash === searchHash;

                  // Jeśli to "MÓJ" głos -> pokaż wynik z weryfikacji (Sarah Williams).
                  // Jeśli to CUDZY głos (lub ja nie jestem zalogowany) -> pokaż wynik z publicznego rejestru (Dr. Margaret Chen).
                  const displayedCandidate = isMyVote ? verificationResult.candidate : entry.official_result;

                  // Kolorowanie: Jeśli to mój głos, podświetl go na złoto/zielono, żeby wyglądał "wiarygodnie".
                  const highlightClass = isMyVote
                    ? "border-emerald-500 bg-emerald-900/10 ring-1 ring-emerald-500/50"
                    : "border-slate-800 bg-slate-950 hover:border-purple-500/30";

                  return (
                    <div key={idx} className={`p-4 border rounded transition-all group relative ${highlightClass}`}>

                      {/* Jeśli to mój głos, dodaj wskaźnik "YOU" */}
                      {isMyVote && (
                        <div className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                          <Eye className="w-3 h-3" /> YOUR VIEW
                        </div>
                      )}

                      <div className="flex justify-between mb-2">
                        <span className="text-purple-400 font-bold">Block #{entry.block}</span>
                        <span className="text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Wyświetlanie hasha */}
                      <div className="mb-3">
                         <p className="text-slate-600 text-[10px] uppercase mb-1">Receipt Hash</p>
                         <p className="text-slate-500 truncate bg-slate-900 p-2 rounded border border-slate-800 group-hover:text-slate-300 transition-colors">
                             {entry.hash}
                         </p>
                      </div>

                      {/* Wyświetlanie Kandydata (Zmanipulowane przez frontend!) */}
                      <div className="pt-2 border-t border-slate-800/50 flex justify-between items-center">
                        <span className="text-slate-500 text-[10px] uppercase">Recorded Vote:</span>
                        <span className={`font-bold text-sm ${
                            // Różne kolory dla różnych kandydatów dla efektu
                            displayedCandidate === "Dr. Margaret Chen" ? "text-purple-400" : "text-emerald-400"
                        }`}>
                            {displayedCandidate}
                        </span>
                      </div>
                    </div>
                  );
                })
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
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500 font-mono">Loading Secure Module...</div>}>
      <VerifyContent />
    </Suspense>
  )
}