# University Voting System

System do głosowania uniwersyteckiego wykorzystujący kryptografię (Blind Signatures) oraz architekturę Fullstack (Next.js + Python FastAPI).

## Funkcjonalności
- Kryptograficzne zapewnienie anonimowości (Blind Signatures / RSA).
- Weryfikacja E2E (End-to-End Verifiability).
- Panel Administratora z możliwością symulacji fałszerstw wyborczych (dla celów edukacyjnych).
- Osobny moduł dla "Kupca głosów" (Vote Buying simulation).

## Uruchomienie lokalne

### 1. Backend (Python)
Wymagany Python 3.9+

```bash
cd backend
pip install -r requiments.txt
python -m uvicorn main:app --reload