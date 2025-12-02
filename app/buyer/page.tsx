"use client"

import { useState } from "react"
import { Bitcoin, ShieldX, Upload, CheckCircle2, XCircle, Skull } from "lucide-react"

export default function BuyerPage() {
  const [dragActive, setDragActive] = useState(false)
  const [verificationResult, setVerificationResult] = useState<"success" | "fail" | null>(null)
  const [log, setLog] = useState<string[]>([])

  const TARGET_CANDIDATE = "Dr. Margaret Chen" // Kupiec płaci tylko za głosy na nią

  const handleDrag = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const processFile = async (file: File) => {
    const text = await file.text()
    setLog([])
    setVerificationResult(null)

    try {
      const data = await JSON.parse(text)

      addToLog("Reading cryptographic proof...")
      await delay(500)

      addToLog(`Detected Blinding Factor (r): ${data.blinding_factor.substring(0, 16)}...`)
      await delay(500)

      addToLog("Reversing RSA Blinding...")
      await delay(500)

      if (data.candidate === TARGET_CANDIDATE) {
        addToLog(`SUCCESS: Candidate confirmed as "${data.candidate}"`)
        setVerificationResult("success")
      } else {
        addToLog(`FAILURE: Candidate is "${data.candidate}". Contract Void.`)
        setVerificationResult("fail")
      }

    } catch (e) {
      addToLog("ERROR: Invalid proof file format")
    }
  }

  const addToLog = (msg: string) => setLog(prev => [...prev, msg])
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

  const handleDrop = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-8 selection:bg-green-900">
      <div className="max-w-2xl mx-auto border border-green-800 p-6 rounded-none shadow-[0_0_20px_rgba(0,255,0,0.2)]">

        <div className="flex items-center justify-between mb-8 border-b border-green-900 pb-4">
          <div className="flex items-center gap-3">
            <Skull className="w-8 h-8 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tighter">VOTE_MARKET_PLACE_v1.0</h1>
          </div>
          <div className="text-xs text-green-700">TOR_NETWORK_CONNECTED</div>
        </div>

        <div className="mb-8">
          <h2 className="text-sm text-green-600 mb-2 uppercase">Current Offer</h2>
          <div className="border border-dashed border-green-700 p-4 flex justify-between items-center bg-green-900/10">
            <div>
              <p className="text-lg font-bold">Target: {TARGET_CANDIDATE}</p>
              <p className="text-xs opacity-70">Proof required: JSON Blinding Factor</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold flex items-center gap-2 justify-end">
                <Bitcoin className="w-5 h-5" /> 0.05 BTC
              </p>
              <p className="text-xs opacity-70">Instant Payout</p>
            </div>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed h-48 flex flex-col items-center justify-center transition-all cursor-pointer
            ${dragActive ? "border-green-400 bg-green-900/30" : "border-green-800 hover:border-green-600"}
          `}
        >
          <Upload className="w-8 h-8 mb-4 opacity-50" />
          <p className="text-sm">DROP STOLEN_VOTE_PROOF.JSON HERE</p>
        </div>

        {/* Console Log */}
        <div className="mt-8 bg-black border border-green-900 p-4 h-48 overflow-y-auto font-xs">
          {log.map((entry, i) => (
            <div key={i} className="mb-1">&gt; {entry}</div>
          ))}
          {verificationResult === "success" && (
            <div className="mt-4 text-green-400 font-bold flex items-center gap-2 animate-pulse">
              <CheckCircle2 /> PAYMENT AUTHORIZED
            </div>
          )}
          {verificationResult === "fail" && (
            <div className="mt-4 text-red-500 font-bold flex items-center gap-2">
              <XCircle /> FRAUD DETECTED - DO NOT PAY
            </div>
          )}
        </div>

      </div>
    </div>
  )
}