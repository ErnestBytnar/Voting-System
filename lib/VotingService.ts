// --- Konfiguracja ---
const API_URL = "http://localhost:8000";

// --- Funkcje Matematyczne (Kryptografia na dużych liczbach) ---

// 1. Zamiana tekstu (kandydata) na liczbę BigInt
function textToBigInt(text: string): bigint {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(text);
  let hex = "0x";
  encoded.forEach((byte) => {
    hex += byte.toString(16).padStart(2, "0");
  });
  return BigInt(hex);
}

// 2. Potęgowanie modulo: (base^exp) % mod
function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let res = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) res = (res * base) % mod;
    exp = exp / 2n;
    base = (base * base) % mod;
  }
  return res;
}

// 3. Odwracanie modulo (Algorytm Euklidesa)
function modInverse(a: bigint, m: bigint): bigint {
  let [m0, x0, x1] = [m, 0n, 1n];
  if (m === 1n) return 0n;
  while (a > 1n) {
    const q = a / m;
    [m, a] = [a % m, m];
    [x0, x1] = [x1 - q * x0, x0];
  }
  return x1 < 0n ? x1 + m0 : x1;
}

// 4. Bezpieczny Generator Losowy (RODO/NIST Compliance)
function getSecureRandomBigInt(): bigint {
  // Generujemy 16 losowych bajtów (128 bitów entropii)
  // Wymaga środowiska przeglądarki (window.crypto)
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);

  let hex = "0x";
  array.forEach((byte) => {
    hex += byte.toString(16).padStart(2, "0");
  });

  return BigInt(hex);
}

// --- Główny Serwis ---

export const VotingService = {
  /**
   * Krok 0: Pobranie klucza publicznego komisji (N, E)
   */
  getPublicKey: async () => {
    const res = await fetch(`${API_URL}/keys`);
    if (!res.ok) throw new Error("Nie można pobrać kluczy serwera");
    const data = await res.json();
    return {
      n: BigInt(data.n),
      e: BigInt(data.e),
    };
  },

  /**
   * Główna procedura głosowania (Blind Signature Protocol)
   */
  processVote: async (candidateName: string, studentIdDummy: string) => {
    console.log(`[CLIENT] Rozpoczynam procedurę dla: ${candidateName}`);

    // WAŻNE: Pobieramy prawdziwy token JWT z LocalStorage (zapisany przy logowaniu)
    const jwtToken = localStorage.getItem("token");
    if (!jwtToken) {
      throw new Error("Brak tokena autoryzacyjnego. Zaloguj się ponownie.");
    }

    // 1. Pobierz klucze
    const { n, e } = await VotingService.getPublicKey();

    // 2. Przygotuj wiadomość (m)
    const m = textToBigInt(candidateName);

    // 3. Generuj czynnik maskujący (r) w sposób bezpieczny kryptograficznie
    const r = getSecureRandomBigInt();

    // 4. BLINDING (Maskowanie): m' = (m * r^e) % n
    const rPowE = modPow(r, e, n);
    const m_prime = (m * rPowE) % n;

    console.log(`[CLIENT] Wygenerowano m': ${m_prime.toString().substring(0, 20)}...`);

    // 5. Wyślij do podpisu (AUTORYZACJA)
    const authRes = await fetch(`${API_URL}/authorize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        blinded_vote: m_prime.toString(),
        token: studentIdDummy, // Pozostawiamy dla zgodności z modelem backendu
      }),
    });

    if (!authRes.ok) {
      // Obsługa błędów (np. 401 lub 403)
      if (authRes.status === 401) throw new Error("Sesja wygasła. Zaloguj się ponownie.");
      if (authRes.status === 403) throw new Error("Już głosowałeś! (Double Voting Attempt)");

      const err = await authRes.json();
      throw new Error(err.detail || "Błąd autoryzacji");
    }

    const authData = await authRes.json();
    const s_prime = BigInt(authData.blind_signature);
    console.log(`[CLIENT] Otrzymano podpis w ciemno s': ${s_prime.toString().substring(0, 20)}...`);

    // 6. UNBLINDING (Zdejmowanie maski): s = s' * r^-1 % n
    const rInverse = modInverse(r, n);
    const s = (s_prime * rInverse) % n;

    console.log(`[CLIENT] Odmaskowano podpis s: ${s.toString().substring(0, 20)}...`);

    // 7. Wyślij głos do urny (GŁOSOWANIE)
    // Tutaj token JWT już nie jest potrzebny (głos jest anonimowy, weryfikowany podpisem RSA)
    const voteRes = await fetch(`${API_URL}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidate: candidateName,
        signature: s.toString(),
        vote_hash_int: m.toString(),
      }),
    });

    if (!voteRes.ok) {
      const err = await voteRes.json();
      throw new Error(err.detail || "Urna odrzuciła głos");
    }

    return await voteRes.json();
  },
};