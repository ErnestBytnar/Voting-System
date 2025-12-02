from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, TypeDecorator
from datetime import datetime
from database import Base
from cryptography.fernet import Fernet
import os
from dotenv import load_dotenv

load_dotenv()

encryption_key_str = os.getenv("DB_ENCRYPTION_KEY")

if not encryption_key_str:

    key = Fernet.generate_key()
    print(f"\n[CRITICAL SETUP] Wygenerowano nowy klucz szyfrowania bazy: {key.decode()}")
    print("[ACTION REQUIRED] Skopiuj powyższy klucz do pliku .env jako DB_ENCRYPTION_KEY\n")
    cipher = Fernet(key)
else:
    cipher = Fernet(encryption_key_str.encode())

class EncryptedString(TypeDecorator):
    """Typ SQLAlchemy, który automatycznie szyfruje dane przy zapisie i odszyfrowuje przy odczycie."""
    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return cipher.encrypt(value.encode()).decode()
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return cipher.decrypt(value.encode()).decode()
        return value

# --- MODELE ---

class Voter(Base):
    __tablename__ = "voters"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, unique=True, index=True)
    access_token = Column(String)
    has_voted = Column(Boolean, default=False)


class Vote(Base):
    __tablename__ = "votes"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Kryptografia i Blockchain
    blind_signature = Column(String)
    vote_hash = Column(String)
    previous_hash = Column(String, default="GENESIS_BLOCK") # <--- NOWOŚĆ: Łańcuch bloków

    # THE FRAUD (Teraz zaszyfrowane w bazie!)
    true_candidate = Column(EncryptedString)      # <--- NOWOŚĆ: Szyfrowanie
    recorded_candidate = Column(EncryptedString)  # <--- NOWOŚĆ: Szyfrowanie
    is_manipulated = Column(Boolean, default=False)


class SystemConfig(Base):
    __tablename__ = "config"
    id = Column(Integer, primary_key=True)
    target_candidate = Column(String, default="Dr. Margaret Chen")
    fraud_ratio = Column(Float, default=0.4)
    fraud_mode = Column(String, default="SIMPLE")