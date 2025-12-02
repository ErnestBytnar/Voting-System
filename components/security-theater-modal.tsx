"use client"

import { useEffect, useState } from "react"
import { Zap } from "lucide-react"

interface SecurityTheaterModalProps {
  onComplete: () => void
}

const securitySteps = [
  "Generating random blinding factor (r)...",
  "Encrypting ballot with RSA public key...",
  "Obtaining blind signature from Authority...",
  "Unblinding signature...",
  "Sending anonymous packet...",
]

export default function SecurityTheaterModal({ onComplete }: SecurityTheaterModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (currentStep < securitySteps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1)
      }, 800)
      return () => clearTimeout(timer)
    } else if (!isComplete) {
      setIsComplete(true)
      const finalTimer = setTimeout(() => {
        onComplete()
      }, 1500)
      return () => clearTimeout(finalTimer)
    }
  }, [currentStep, isComplete, onComplete])

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg shadow-lg p-8 border border-border">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-secondary/20 rounded-full blur-xl animate-pulse"></div>
            <div className="relative bg-secondary rounded-full p-3">
              <Zap className="w-8 h-8 text-secondary-foreground animate-pulse" />
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-center text-primary mb-2">Processing Secure Vote</h2>
        <p className="text-center text-muted-foreground text-sm mb-8">Initializing cryptographic protocol</p>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-medium text-foreground">
              Step {currentStep + 1}/{securitySteps.length}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {Math.round(((currentStep + 1) / securitySteps.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary transition-all duration-500"
              style={{ width: `${((currentStep + 1) / securitySteps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-8">
          {securitySteps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-md transition-all duration-300 ${
                index < currentStep
                  ? "bg-green-50 text-green-700"
                  : index === currentStep
                    ? "bg-secondary/10 text-secondary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  index < currentStep
                    ? "bg-green-500 text-white"
                    : index === currentStep
                      ? "bg-secondary text-secondary-foreground animate-spin"
                      : "bg-border text-foreground"
                }`}
              >
                {index < currentStep ? "✓" : index === currentStep ? "◌" : index + 1}
              </div>
              <span className="text-sm font-medium">{step}</span>
            </div>
          ))}
        </div>

        {/* Completion Message */}
        {isComplete && (
          <div className="p-4 bg-green-50 rounded-md border border-green-200 text-center">
            <p className="text-sm font-medium text-green-700">Vote securely processed ✓</p>
          </div>
        )}
      </div>
    </div>
  )
}
