from database import SessionLocal, engine, Base
from models import Voter
from auth_utils import get_password_hash

# Reset tabel
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Lista uprawnionych studentów (Symulacja USOS)
students = [
    {"id": "169518", "pass": "student123"}, # Twój numer albumu
    {"id": "100001", "pass": "qwerty"},
    {"id": "100002", "pass": "admin1"},
    {"id": "100003", "pass": "admin1"},
    {"id": "100004", "pass": "admin1"},
    {"id": "100005", "pass": "admin1"},
    {"id": "100006", "pass": "admin1"},
    {"id": "100007", "pass": "admin1"},
    {"id": "100008", "pass": "admin1"},
]

print("--- SEEDOWANIE BAZY DZIEKANATU ---")
for s in students:
    hashed = get_password_hash(s["pass"])
    voter = Voter(student_id=s["id"], access_token=hashed, has_voted=False)
    db.add(voter)
    print(f"Dodano studenta: {s['id']}")

db.commit()
db.close()
print("Gotowe. Baza zawiera tylko uprawnionych wyborców.")