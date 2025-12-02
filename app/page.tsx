"use client"

import { useState, useEffect } from "react"
// Zmiana importów na poprawne ścieżki względne (wychodzimy z folderu 'app' do głównego katalogu)
import SystemBar from "../components/system-bar"
import AuthenticationScreen from "../components/authentication-screen"
import BallotScreen from "../components/ballot-screen"
import BlindingModal from "../components/blinding-modal"
import ReceiptScreen from "../components/receipt-screen"
// VotingService też jest katalog wyżej w folderze 'lib'
import { VotingService } from "../lib/VotingService"

export default function Home() {
  const [step, setStep] = useState<"auth" | "ballot" | "blinding" | "receipt">("auth")
  const [studentId, setStudentId] = useState("")
  // Domyślny token na wypadek testów
  const [accessToken, setAccessToken] = useState("169518")
  const [selectedCandidate, setSelectedCandidate] = useState<{ id: string; name: string } | null>(null)
  const [sessionId] = useState(() => Math.random().toString(16).slice(2, 10).toUpperCase())

  // Dane do paragonu
  const [voteHash, setVoteHash] = useState("")
  const [signature, setSignature] = useState("")

  // Stan przetwarzania w tle
  const [isVoting, setIsVoting] = useState(false)
  const [backendResult, setBackendResult] = useState<any>(null)

  // 1. Krok Autoryzacji
  const handleAuthComplete = (id: string) => {
    setStudentId(id)
    setStep("ballot")
  }

  // 2. Krok Wyboru Kandydata -> Przejście do Szyfrowania
  const handleBallotSubmit = (candidate: { id: string; name: string }) => {
    setSelectedCandidate(candidate)
    setStep("blinding") // To uruchomi useEffect poniżej
  }

  // 3. LOGIKA GŁOSOWANIA (Uruchamia się automatycznie po wejściu w etap 'blinding')
  useEffect(() => {
    if (step === "blinding" && selectedCandidate && !isVoting) {
      const castVote = async () => {
        setIsVoting(true)
        try {
          console.log("--- ROZPOCZYNAM GŁOSOWANIE KRYPTOGRAFICZNE ---")

          // Wywołanie Twojego serwisu (Matematyka RSA + Backend Python)
          // Używamy studentId jako tokenu (lub domyślnego jeśli pusty)
          const tokenUse = studentId || accessToken
          const result = await VotingService.processVote(selectedCandidate.name, tokenUse)

          console.log("--- GŁOS ZALICZONY PRZEZ URNĘ ---", result)
          setBackendResult(result)

        } catch (error: any) {
          console.error("Błąd krytyczny:", error)
          alert("Błąd systemu wyborczego: " + error.message)
          setStep("ballot") // Cofnij w razie błędu
        } finally {
          setIsVoting(false)
        }
      }

      castVote()
    }
  }, [step, selectedCandidate, studentId])

  // 4. Krok Zakończenia Animacji (Wywoływane przez BlindingModal)
 const handleBlindingComplete = (visualHash: string, visualSig: string) => {
    // Backend teraz zwraca "receipt_hash" w main.py
    const finalHash = backendResult?.receipt_hash || visualHash // <-- Zmiana tutaj
    const finalSig = backendResult?.receipt || visualSig // (To może wymagać sprawdzenia czy backend zwraca 'receipt' czy coś innego, w main.py nie zwraca explicite signature w return, tylko receipt_hash. Ale signature mamy w stanie.)

    // W main.py 'vote' endpoint zwraca: {"status": "Vote counted", "receipt_hash": ...}
    // Signature mamy już w 'signature' state (jeśli przyszło z authorize) lub musimy wziąć z visualSig.
    // Dla uproszczenia w tym demo signature bierzemy z modala, bo backend go nie zmienia w fazie vote.

    setVoteHash(finalHash)
    setSignature(visualSig) // Podpis został wygenerowany wcześniej

    setStep("receipt")
  }

  return (
    <>
      <SystemBar sessionId={sessionId} />
      <main className="min-h-[calc(100vh-120px)] bg-slate-950 flex items-center justify-center p-4">

        {step === "auth" && (
          <AuthenticationScreen onComplete={handleAuthComplete} />
        )}

        {step === "ballot" && (
          <BallotScreen
            studentId={studentId}
            onSubmit={handleBallotSubmit}
          />
        )}

        {step === "blinding" && selectedCandidate && (
          <BlindingModal
            candidate={selectedCandidate}
            onComplete={handleBlindingComplete}
          />
        )}

        {step === "receipt" && selectedCandidate && (
          <ReceiptScreen
            studentId={studentId}
            candidateName={selectedCandidate.name}
            voteHash={voteHash}
            signature={signature}
          />
        )}

      </main>
    </>
  )
}