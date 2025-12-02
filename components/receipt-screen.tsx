"use client"

import { CheckCircle, Download, Lock, ExternalLink } from "lucide-react"
import { useRef } from "react"
import { useRouter } from "next/navigation"

interface ReceiptScreenProps {
  studentId: string
  candidateName: string
  voteHash: string
  signature: string
}

export default function ReceiptScreen({ studentId, candidateName, voteHash, signature }: ReceiptScreenProps) {
  const receiptRef = useRef(null)
  const router = useRouter()
  const timestamp = new Date().toISOString()

  // Generowanie wzoru graficznego z hasha (dla efektu wizualnego)
  const generateQRPattern = (seed: string): boolean[][] => {
    const size = 21
    const grid: boolean[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(false))

    for (let i = 0; i < seed.length; i++) {
      const charCode = seed.charCodeAt(i)
      for (let j = 0; j < 8; j++) {
        const x = (i * 8 + j) % size
        const y = (charCode >> j) % size
        grid[y][x] = !grid[y][x]
      }
    }
    return grid
  }

  const qrPattern = generateQRPattern(voteHash)

  const handleDownload = () => {
    // @ts-ignore - receiptRef.current może być nullem przy pierwszym renderze
    const element = receiptRef.current
    if (element) {
      const receiptText = `
UNIVERSITY SECURE VOTE PROTOCOL v2.0
=====================================
Timestamp: ${timestamp}
Vote Hash: ${voteHash}
Signature: ${signature}
Student ID: ${studentId}
=====================================
Thank you for voting.
      `.trim()

      const link = document.createElement("a")
      link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(receiptText)}`
      link.download = `voting-receipt-${Date.now()}.txt`
      link.click()
    }
  }

  const handleVerifyBlockchain = () => {
    // To przenosi użytkownika do fałszywego Ledgera
    router.push(`/verify?id=${voteHash}`)
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-2xl p-8">
        {/* Success Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl"></div>
            <div className="relative bg-slate-800 rounded-full p-4 border border-emerald-500/50">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-slate-50 mb-2">Step 4: Receipt</h1>
        <p className="text-center text-slate-400 text-sm mb-8">Your vote has been counted anonymously.</p>

        {/* Receipt Ticket */}
        <div
          ref={receiptRef}
          className="bg-slate-800 rounded-lg border-2 border-dashed border-slate-700 p-8 mb-8 space-y-6"
        >
          {/* Timestamp */}
          <div className="border-b border-slate-700 pb-4">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Timestamp</p>
            <p className="font-mono text-sm text-slate-50 mt-1">{timestamp}</p>
          </div>

          {/* Cryptographic Proof */}
          <div className="border-b border-slate-700 pb-4">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-2">
              Cryptographic Proof (SHA-256)
            </p>
            <p className="font-mono text-xs text-emerald-400 break-all leading-relaxed">{voteHash}</p>
          </div>

          {/* Signature */}
          <div className="border-b border-slate-700 pb-4">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-2">RSA Signature</p>
            <p className="font-mono text-xs text-emerald-400 break-all leading-relaxed">{signature}</p>
          </div>

          {/* QR Code Pattern */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Verification Code</p>
            <div className="bg-white p-3 rounded-lg">
              <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(21, 1fr)` }}>
                {qrPattern.map((row, y) =>
                  row.map((cell, x) => (
                    <div key={`${y}-${x}`} className={`w-2 h-2 ${cell ? "bg-slate-900" : "bg-white"}`} />
                  )),
                )}
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-700"></div>
            <span className="text-slate-600 font-mono text-xs">✂ TEAR HERE ✂</span>
            <div className="flex-1 h-px bg-slate-700"></div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
            <Lock className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase">Vote Anonymity Guaranteed</p>
              <p className="text-xs text-slate-300 mt-1">
                Your identity ({studentId}) is cryptographically decoupled from your vote. This receipt proves your vote
                was counted without revealing your selection.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleDownload}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold py-3 rounded-lg transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Receipt
          </button>

          <button
            onClick={handleVerifyBlockchain}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-50 font-bold py-3 rounded-lg transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Verify on Public Ledger
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-400 text-center mt-6">
          Thank you for participating in the university democratic process. This receipt serves as your verification of
          participation.
        </p>
      </div>
    </div>
  )
}