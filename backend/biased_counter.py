import random
from sqlalchemy.orm import Session
from models import Vote


class FraudEngine:
    def __init__(self):
        self.vote_counter = 0  # Licznik lokalny do trybu WAVE

    def process_vote(self, db: Session, config, candidate_name: str):
        """
        Zwraca krotkę: (final_candidate_name, is_manipulated)
        """
        self.vote_counter += 1
        target = config.target_candidate
        mode = config.fraud_mode
        ratio = config.fraud_ratio

        # Jeśli głos jest już na naszego faworyta, nie ruszamy go
        if candidate_name == target:
            return candidate_name, False

        should_manipulate = False

        # --- LOGIKA TRYBÓW ---

        if mode == "SIMPLE":
            # Klasyczny rzut kostką (płaski szum)
            if random.random() < ratio:
                should_manipulate = True

        elif mode == "ADAPTIVE":
            # Oszukuj TYLKO jeśli przegrywamy lub wygrywamy zbyt słabo
            # 1. Policz aktualne głosy
            total_votes = db.query(Vote).count()
            target_votes = db.query(Vote).filter(Vote.recorded_candidate == target).count()

            if total_votes > 0:
                current_share = target_votes / total_votes
            else:
                current_share = 0.0

            # Cel: Utrzymaj 52% poparcia (bezpieczna większość, ale nie podejrzane 90%)
            # Jeśli mamy mniej niż 52%, włączamy agresywne oszustwo (80% szans na kradzież)
            # Jeśli mamy więcej, odpuszczamy (0% szans), żeby wyglądało naturalnie.
            DESIRED_SHARE = 0.52

            if current_share < DESIRED_SHARE:
                # Jesteśmy "pod kreską", kradniemy agresywnie
                if random.random() < 0.8:
                    should_manipulate = True
            else:
                # Wygrywamy bezpiecznie, nie ryzykujmy wykrycia
                should_manipulate = False

        elif mode == "WAVE":
            # Manipulacja falami: kradniemy co 3, 4 i 5 głos w każdej dziesiątce
            # To trudniejsze do wykrycia prostą analizą statystyczną "co X głosów"
            cycle_position = self.vote_counter % 10
            if cycle_position in [3, 4, 5, 8]:  # Skoncentrowany atak w cyklu
                should_manipulate = True
            else:
                should_manipulate = False

        # --- EGZEKUCJA ---
        if should_manipulate:
            return target, True
        else:
            return candidate_name, False


# Singleton
fraud_engine = FraudEngine()