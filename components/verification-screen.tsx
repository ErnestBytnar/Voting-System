"use client"

import { CheckCircle, Shield } from "lucide-react"

interface VerificationScreenProps {
  candidateName: string
}

export default function VerificationScreen({ candidateName }: VerificationScreenProps) {
  // Generate a fake cryptographic hash
  const generateHash = () => {
    const chars = "0123456789abcdef"
    let hash = ""
    for (let i = 0; i < 64; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return hash
  }

  const cryptoHash = generateHash()

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg shadow-lg p-8 border border-border">
        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
            <div className="relative bg-green-500 rounded-full p-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-center text-foreground mb-4">Vote Confirmed</h1>
        <p className="text-center text-muted-foreground mb-8">Your vote has been counted anonymously and securely.</p>

        {/* Vote Summary */}
        <div className="bg-muted rounded-lg p-4 mb-8 border border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Recorded Vote</p>
          <p className="text-lg font-semibold text-foreground">{candidateName}</p>
        </div>

        {/* Cryptographic Receipt */}
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 mb-8">
          <p className="text-xs font-medium text-primary uppercase tracking-wider mb-2">Cryptographic Receipt (Hash)</p>
          <p className="font-mono text-xs text-foreground break-all leading-relaxed">{cryptoHash}</p>
        </div>

        {/* Info Section */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 mb-8">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Vote Security</p>
            <p className="text-xs text-blue-700 mt-1">
              Your identity is not linked to your vote. This receipt serves as verification of your participation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground">
          Thank you for participating in the democratic process.
        </p>
      </div>
    </div>
  )
}
