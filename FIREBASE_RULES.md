# Firebase Firestore Security Rules - Production

## Aktuálne pravidlá (iba autentifikácia)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Nové pravidlá (autentifikácia + App Check)
Po overení, že App Check s reCAPTCHA v3 funguje správne v produkcii, aktualizuj pravidlá na:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // Vyžaduje Firebase Auth (anonymous) + App Check (reCAPTCHA v3)
      allow read, write: if request.auth != null && request.app != null;
    }
  }
}
```

## Postup aktualizácie

1. **Overenie App Check v produkcii:**
   - Otvor https://idea3dsvk.github.io/revnote/
   - Otvor DevTools (F12) → Console
   - Skontroluj, že App Check inicializácia prebehla úspešne
   - Hľadaj hlášku: "Firebase App Check initialized"
   - Skontroluj, že nie sú chyby typu "App Check token invalid"

2. **Testovanie:**
   - Vyskúšaj pridať zariadenie
   - Vyskúšaj pridať revíziu
   - Vyskúšaj upraviť prevádzkovateľa
   - Overenej, že všetky operácie fungujú

3. **Aktualizácia pravidiel:**
   - Choď do [Firebase Console](https://console.firebase.google.com/)
   - Vyber projekt
   - Firestore Database → Rules
   - Zmeň pravidlá na nové (s `request.app != null`)
   - Klikni "Publish"

4. **Overenie po zmene:**
   - Znovu otestuj všetky funkcie aplikácie
   - Skontroluj, že všetko funguje rovnako
   - Ak by niečo nefungovalo, môžeš pravidlá vrátiť späť

## Čo to robí?

- **`request.auth != null`** - Vyžaduje Firebase Authentication (anonymous user)
- **`request.app != null`** - Vyžaduje platný App Check token (reCAPTCHA v3)

Táto kombinácia zabraňuje:
- Priamemu prístupu k databáze bez aplikácie
- Automatizovaným botom (reCAPTCHA ich zablokuje)
- Útokom zo škodlivých domén (App Check overuje doménu)

## App Check konfigurácia

Aplikácia má nastavené:
- **Provider:** reCAPTCHA v3
- **Site Key:** `6Leo2forAAAAAO1U0HfkdTdRCSPp6wv7WBYwaErj`
- **Doména:** `idea3dsvk.github.io`
- **Debug Mode:** Zakázaný v produkcii

## Poznámky

- V development móde (localhost) môžeš použiť debug token
- App Check je aktivovaný iba v produkcii (nie na localhost)
- Firebase anonymous auth funguje automaticky pri načítaní aplikácie
