from Crypto.PublicKey import RSA

class BlindSystem:
    def __init__(self, key_size=2048):
        # Generujemy klucze przy starcie serwera
        print("[SYSTEM] Generowanie kluczy RSA 2048-bit...")
        self.key = RSA.generate(key_size)
        self.n = self.key.n
        self.e = self.key.e
        self.d = self.key.d
        print("[SYSTEM] Klucze gotowe.")

    def sign_blinded_message(self, blinded_message_int: int) -> int:
        """
        Podpisuje zamaskowaną wiadomość: s' = (m')^d mod n
        """
        # Używamy surowego potęgowania modulo (Textbook RSA) dla blind signatures
        s_prime = pow(blinded_message_int, self.d, self.n)
        return s_prime

    def verify_signature(self, message_int: int, signature_int: int) -> bool:
        """
        Weryfikuje podpis: s^e mod n == m
        """
        check = pow(signature_int, self.e, self.n)
        return check == message_int

# Singleton - jedna instancja krypto dla całej aplikacji
voting_crypto = BlindSystem()