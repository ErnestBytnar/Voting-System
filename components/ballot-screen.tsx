"use client"

import { useState } from "react"
import { CheckCircle2, FileDigit } from "lucide-react"

interface BallotScreenProps {
  studentId: string
  onSubmit: (candidate: { id: string; name: string }) => void
}

const CANDIDATES = [
  { id: "CAND_A", name: "Dr. Margaret Chen", role: "Dean" },
  { id: "CAND_B", name: "James Morrison", role: "Student Rep" },
  { id: "CAND_C", name: "Sarah Williams", role: "Treasurer" },
  { id: "CAND_D", name: "Alex Rodriguez", role: "Secretary" },
]

function generateHash(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return "0x" + Math.abs(hash).toString(16).padStart(8, "0")
}

export default function BallotScreen({ studentId, onSubmit }: BallotScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedCandidate = CANDIDATES.find((c) => c.id === selectedId)
  const candidateHash = selectedId ? generateHash(selectedId) : ""

  const handleSubmit = () => {
    if (selectedId) {
      setIsSubmitting(true)
      setTimeout(() => {
        const candidate = CANDIDATES.find((c) => c.id === selectedId)
        if (candidate) {
          onSubmit({ id: selectedId, name: candidate.name })
        }
      }, 500)
    }
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="space-y-6">
        {/* Candidate Cards */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-50 mb-2">Step 2: The Ballot</h2>
          <p className="text-slate-400 text-sm mb-8">Select your preferred candidate</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {CANDIDATES.map((candidate) => (
              <button
                key={candidate.id}
                onClick={() => setSelectedId(candidate.id)}
                disabled={isSubmitting}
                className={`p-5 rounded-lg border-2 transition-all duration-300 text-left ${
                  selectedId === candidate.id
                    ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                    : "border-slate-700 hover:border-slate-600 bg-slate-800 hover:bg-slate-800/80"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all ${
                      selectedId === candidate.id ? "bg-emerald-500 text-slate-900" : "bg-slate-700 text-slate-50"
                    }`}
                  >
                    {candidate.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{candidate.role}</p>
                    <p className="text-lg font-bold text-slate-50 mt-1">{candidate.name}</p>
                  </div>
                  {selectedId === candidate.id && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Encryption Preview */}
        {selectedCandidate && (
          <div className="bg-slate-900 rounded-lg border border-emerald-500/30 shadow-2xl p-6 animate-fadeIn">
            <div className="flex items-center gap-2 mb-4">
              <FileDigit className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Live Encryption Preview</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-slate-800 rounded p-4 border border-slate-700">
                <p className="text-xs text-slate-500 mb-2">Candidate ID:</p>
                <p className="font-mono text-sm text-slate-50">{selectedId}</p>
              </div>
              <div className="bg-slate-800 rounded p-4 border border-slate-700">
                <p className="text-xs text-slate-500 mb-2">Blinding Preparation (SHA-256):</p>
                <p className="font-mono text-sm text-emerald-400">{candidateHash}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selectedId || isSubmitting}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-4 rounded-lg transition-all duration-200 shadow-lg disabled:shadow-none"
        >
          {isSubmitting ? "Processing..." : "Proceed to Encryption"}
        </button>
      </div>
    </div>
  )
}
