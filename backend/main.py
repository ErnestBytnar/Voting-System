from fastapi import FastAPI, HTTPException, Depends, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import logging
import hashlib

# Importy z naszych modułów
from database import engine, get_db, Base
from models import Vote, SystemConfig, Voter
from crypto_utils import voting_crypto
from auth_utils import verify_password, create_access_token, verify_token
from biased_counter import fraud_engine

# Inicjalizacja bazy danych
Base.metadata.create_all(bind=engine)

app = FastAPI(title="University Voting System", version="2.5.0")

# Konfiguracja logowania
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ELECTION_SYSTEM")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- MODELE DANYCH ---
class LoginRequest(BaseModel):
    student_id: str
    password: str


class VoteRequest(BaseModel):
    candidate: str
    signature: str
    vote_hash_int: str


class BlindSignRequest(BaseModel):
    blinded_vote: str
    token: str


class ConfigUpdate(BaseModel):
    target_candidate: str
    fraud_ratio: float
    fraud_mode: str


class VerifyRequest(BaseModel):
    hash: str


# ==========================================
# CZĘŚĆ 1: REGISTRAR AUTHORITY (KOMISJA)
# Odpowiedzialność: Autoryzacja i Wydawanie Podpisów
# Posiada: Klucz Prywatny RSA
# ==========================================

registrar_router = APIRouter(prefix="", tags=["Registrar Authority (Identity & Signing)"])


@registrar_router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Logowanie do systemu (Sprawdzenie tożsamości w bazie dziekanatu)."""
    user = db.query(Voter).filter(Voter.student_id == data.student_id).first()

    if not user or not verify_password(data.password, user.access_token):
        logger.warning(f"[REGISTRAR] Nieudana próba logowania: {data.student_id}")
        raise HTTPException(status_code=401, detail="Błędny numer indeksu lub hasło")

    if user.has_voted:
        raise HTTPException(status_code=403, detail="Głos został już oddany!")

    access_token = create_access_token(data={"sub": user.student_id})
    hashed_id = hashlib.sha256(data.student_id.encode()).hexdigest()[:8]
    logger.info(f"[REGISTRAR] Zalogowano wyborcę (hash): {hashed_id}")
    return {"access_token": access_token, "token_type": "bearer"}


@registrar_router.post("/authorize")
def authorize_and_sign(data: BlindSignRequest, current_user_id: str = Depends(verify_token),
                       db: Session = Depends(get_db)):
    """
    Wydanie Ślepego Podpisu.
    Komisja sprawdza CZY masz prawo głosu, ale NIE WIDZI na kogo głosujesz (blinded_vote).
    Używa KLUCZA PRYWATNEGO.
    """
    user = db.query(Voter).filter(Voter.student_id == current_user_id).first()

    if user.has_voted:
        raise HTTPException(status_code=403, detail="Podpis już wydany!")

    # Oznaczamy zużycie prawa głosu w rejestrze wyborców
    user.has_voted = True
    db.commit()

    # Podpisujemy 'zaślepioną' wiadomość używając klucza prywatnego
    m_prime = int(data.blinded_vote)
    s_prime = voting_crypto.sign_blinded_message(m_prime)

    hashed_user = hashlib.sha256(current_user_id.encode()).hexdigest()[:8]
    logger.info(f"[REGISTRAR] Wydano anonimowy certyfikat (Blind Signature) dla ID-HASH: {hashed_user}")
    return {"blind_signature": str(s_prime)}


# ==========================================
# CZĘŚĆ 2: TALLY SERVER (URNA WYBORCZA)
# Odpowiedzialność: Przyjmowanie głosów, Zliczanie (i Oszukiwanie)
# Posiada: Tylko Klucz Publiczny (do weryfikacji)
# ==========================================

tally_router = APIRouter(prefix="", tags=["Tally Server (Voting & Counting)"])


@tally_router.get("/keys")
def get_public_key():
    """Udostępnia klucz publiczny (potrzebny do szyfrowania głosu przez klienta)."""
    return {"n": str(voting_crypto.n), "e": str(voting_crypto.e)}


@tally_router.post("/vote")
def cast_vote(data: VoteRequest, db: Session = Depends(get_db)):
    """
    Wrzucenie głosu do urny.
    Serwer nie wie KTO wysłał głos (brak tokena JWT, brak IP logowania).
    Serwer weryfikuje tylko czy podpis (Signature) pasuje do treści (Vote Hash) używając Klucza Publicznego.
    """

    # 1. Weryfikacja kryptograficzna (Użycie klucza PUBLICZNEGO)
    # Tally Server sprawdza: Czy ten głos został podpisany przez Registrar?
    is_valid = voting_crypto.verify_signature(int(data.vote_hash_int), int(data.signature))

    if not is_valid:
        logger.error(f"[TALLY] Odrzucono głos - sfałszowany podpis!")
        raise HTTPException(status_code=400, detail="Nieważny podpis cyfrowy (Fraud Detected)!")

    # 2. Pobierz konfigurację oszustwa (Tu następuje "zdrada" zaufania)
    config = db.query(SystemConfig).first()
    if not config:
        config = SystemConfig(fraud_mode="SIMPLE")
        db.add(config)
        db.commit()
        db.refresh(config)

    # 3. SMART FRAUD ENGINE
    # Tally Server jest skorumpowany i podmienia głosy
    recorded_choice, manipulated = fraud_engine.process_vote(db, config, data.candidate)

    if manipulated:
        logger.warning(
            f"[TALLY-FRAUD | {config.fraud_mode}] Przechwycono i zmieniono głos: {data.candidate} -> {recorded_choice}")
    else:
        logger.info(f"[TALLY] Zaksięgowano głos: {recorded_choice}")

    # 4. Generowanie Receipt Hash (Dowód dla użytkownika)
    receipt_hash = hashlib.sha256(data.signature.encode()).hexdigest()

    # 5. Zapis do bazy (Shadow Ledger)
    new_vote = Vote(
        vote_hash=receipt_hash,
        blind_signature=data.signature,
        true_candidate=data.candidate,  # Co widzi użytkownik
        recorded_candidate=recorded_choice,  # Co widzi system
        is_manipulated=manipulated
    )
    db.add(new_vote)
    db.commit()

    return {"status": "Vote counted", "receipt_hash": receipt_hash}


# ==========================================
# CZĘŚĆ 3: PUBLIC AUDIT & ADMIN
# ==========================================

audit_router = APIRouter(prefix="", tags=["Public Audit & Administration"])


@audit_router.get("/public-ledger")
def get_public_ledger(db: Session = Depends(get_db)):

    votes = db.query(Vote).order_by(Vote.timestamp.desc()).limit(100).all() # Limit 100 dla wydajności
    ledger = [
        {
            "timestamp": v.timestamp.isoformat(),
            "hash": v.vote_hash,
            "block": 10200 + v.id,
            "official_result": v.recorded_candidate
        }
        for v in votes
    ]
    return ledger


@audit_router.post("/verify-vote")
def verify_vote(data: VerifyRequest, db: Session = Depends(get_db)):
    """Weryfikacja E2E - Split View Attack"""
    vote = db.query(Vote).filter(Vote.vote_hash == data.hash).first()

    if not vote:
        raise HTTPException(status_code=404, detail="Vote Hash not found in the Ledger")

    return {
        "verified": True,
        "candidate": vote.true_candidate,  # Kłamstwo uspokajające wyborcę
        "timestamp": vote.timestamp,
        "signature_fragment": vote.blind_signature[:20] + "..."
    }


@audit_router.get("/admin/stats")
def get_stats(db: Session = Depends(get_db)):
    """Panel Boga - widzi obie rzeczywistości"""
    votes = db.query(Vote).all()
    real_counts = {}
    fake_counts = {}

    for v in votes:
        real_counts[v.true_candidate] = real_counts.get(v.true_candidate, 0) + 1
        fake_counts[v.recorded_candidate] = fake_counts.get(v.recorded_candidate, 0) + 1

    config = db.query(SystemConfig).first()

    return {
        "real_results": real_counts,
        "public_results": fake_counts,
        "total_votes": len(votes),
        "manipulated_count": sum(1 for v in votes if v.is_manipulated),
        "current_config": {
            "target": config.target_candidate if config else "Dr. Margaret Chen",
            "ratio": config.fraud_ratio if config else 0.4,
            "mode": config.fraud_mode if config else "SIMPLE"
        }
    }


@audit_router.post("/admin/config")
def update_config(data: ConfigUpdate, db: Session = Depends(get_db)):
    config = db.query(SystemConfig).first()
    if not config:
        config = SystemConfig()
        db.add(config)

    config.target_candidate = data.target_candidate
    config.fraud_ratio = data.fraud_ratio
    config.fraud_mode = data.fraud_mode

    db.commit()
    logger.critical(f"[ADMIN] ZMIANA STRATEGII: {data.fraud_mode} | Cel: {data.target_candidate}")
    return {"status": "updated"}


@audit_router.post("/admin/reset")
def reset_election(db: Session = Depends(get_db)):
    db.query(Vote).delete()
    db.query(Voter).update({Voter.has_voted: False})
    db.commit()
    logger.critical("[ADMIN] GLOBAL RESET EXECUTED")
    return {"status": "cleared"}


# Rejestracja routerów
app.include_router(registrar_router)
app.include_router(tally_router)
app.include_router(audit_router)