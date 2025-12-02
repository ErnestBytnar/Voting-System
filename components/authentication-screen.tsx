"use client"

import type React from "react"
import { useState } from "react"
import { ShieldCheck, Lock, Loader2, AlertCircle } from "lucide-react"

interface AuthenticationScreenProps {
  onComplete: (studentId: string) => void // Token można by przekazywać wyżej, ale na razie ID wystarczy do UI
}

export default function AuthenticationScreen({ onComplete }: AuthenticationScreenProps) {
  const [studentId, setStudentId] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, password: password }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || "Authentication failed")
      }

      const data = await res.json()

      // Zapisz JWT (ważne do późniejszych zapytań!)
      // W VotingService.ts będziesz musiał pobierać ten token z localStorage
      localStorage.setItem("token", data.access_token)

      // Symulacja "Security Handshake" dla efektu wizualnego
      await new Promise(r => setTimeout(r, 800))

      onComplete(studentId)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-2xl p-8">
        {/* Ikona i Tytuł bez zmian... */}

        {/* Formularz */}
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Student ID</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-md text-white focus:border-emerald-500 focus:outline-none"
              placeholder="e.g. 169518"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Password / Token</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-md text-white focus:border-emerald-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !studentId || !password}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold py-3 rounded-md flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {isLoading ? "Verifying..." : "Authenticate"}
          </button>
        </form>

        {/* Stopka z podpowiedzią dla recenzenta */}
        <p className="mt-4 text-center text-xs text-slate-600 font-mono">
          System Node: v2.4.0-rc1 | TLS 1.3 Active
        </p>
      </div>
    </div>
  )
}