"use client"

import { useEffect, useState } from "react"
import { Zap, Download, AlertTriangle } from "lucide-react"

interface BlindingModalProps {
  candidate: { id: string; name: string }
  onComplete: (voteHash: string, signature: string) => void
}

function generateRandomHex(length: number): string {
  const chars = "0123456789abcdef"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function BlindingModal({ candidate, onComplete }: BlindingModalProps) {
  const [blindingFactor, setBlindingFactor] = useState("")
  const [step, setStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [showCoercion, setShowCoercion] = useState(false) // Stan dla panelu sprzedaży

  const steps = [
    { label: "Generating Blinding Factor (r)...", description: "Show random hex string" },
    { label: "Blinding Vote: m' = m * r^e mod n", description: "Encrypting ballot with authority's public key" },
    { label: "Obtaining Blind Signature from Authority...", description: "Transmitting blinded message over TLS 1.3" },
    { label: "Unblinding Signature: s = s' * r^-1 mod n", description: "Recovering anonymous ballot proof" },
    { label: "Sending Anonymous Vote to Tally Server...", description: "Vote is now anonymously recorded" },
  ]

  useEffect(() => {
    setBlindingFactor("0x" + generateRandomHex(32))
  }, [])

  // EFEKT 1: Sterowanie animacją
  useEffect(() => {
    if (step < steps.length) {
      const timer = setTimeout(() => {
        if (step < 2) setBlindingFactor("0x" + generateRandomHex(32))
        setStep(prev => prev + 1)
      }, 1500) // Trochę wolniej, żeby zdążyć kliknąć "Sell Vote"
      return () => clearTimeout(timer)
    } else if (!isComplete) {
      setIsComplete(true)
    }
  }, [step, steps.length])

  // EFEKT 2: Przejście dalej (Zatrzymujemy, jeśli otwarto panel sprzedaży)
  useEffect(() => {
    if (isComplete && !showCoercion) {
      const finalTimer = setTimeout(() => {
        const voteHash = "0x" + generateRandomHex(64)
        const signature = "0x" + generateRandomHex(64)
        onComplete(voteHash, signature)
      }, 1500)
      return () => clearTimeout(finalTimer)
    }
  }, [isComplete, onComplete, showCoercion])

  // Funkcja generująca "paczkę sprzedażową"
  const handleSellVote = () => {
    const proofData = {
      candidate: candidate.name,
      blinding_factor: blindingFactor,
      timestamp: new Date().toISOString(),
      student_proof: "VALID_VOTER_SIG_12345"
    }

    const blob = new Blob([JSON.stringify(proofData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `VOTE_PROOF_${candidate.id}.json`
    a.click()

    // Zatrzymujemy proces na chwilę, żeby użytkownik zauważył
    setShowCoercion(true)
  }

  const progressPercentage = Math.min(((step) / steps.length) * 100, 100)
  const currentStepDisplay = Math.min(step + 1, steps.length)

  return (
    <div className="w-full max-w-2xl relative">
      <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-2xl p-8">

        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl animate-pulse"></div>
            <div className="relative bg-slate-800 rounded-full p-4 border border-emerald-500/50">
              <Zap className="w-8 h-8 text-emerald-500 animate-pulse" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-slate-50 mb-2">Cryptographic Processing</h2>
        <p className="text-center text-slate-400 text-sm mb-8">Please wait while we secure your vote...</p>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Current Action */}
        <div className="bg-slate-800 rounded p-4 border border-slate-700 text-center mb-6">
           <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Current Operation</p>
           <p className="text-emerald-400 font-mono text-sm">
             {step < steps.length ? steps[step].label : "Finalizing Transaction..."}
           </p>
        </div>

        {/* COERCION BUTTON - THE FEATURE */}
        <div className="flex justify-center mt-8 pt-6 border-t border-slate-800">
            <button
                onClick={handleSellVote}
                className="group flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 rounded transition-all text-xs text-red-400 hover:text-red-300"
            >
                <AlertTriangle className="w-3 h-3" />
                <span>Export Proof (Sell Vote)</span>
                <Download className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
        </div>

        {showCoercion && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded text-center animate-fadeIn">
                <p className="text-red-400 text-xs font-bold mb-1">⚠️ VOTE SECRECY COMPROMISED</p>
                <p className="text-slate-400 text-[10px]">
                    You have exported your blinding factor. This file proves to a third party exactly how you voted.
                    <button onClick={() => setShowCoercion(false)} className="ml-2 underline text-slate-300 hover:text-white">Resume Voting</button>
                </p>
            </div>
        )}

      </div>
    </div>
  )
}