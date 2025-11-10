# 🔥 Firebase Setup - Návod na nastavenie

## 1. Vytvorenie Firebase projektu

1. Otvorte [Firebase Console](https://console.firebase.google.com/)
2. Kliknite na **"Add project"** (Pridať projekt)
3. Názov projektu: `revnote` (alebo vlastný názov)
4. Povoľte Google Analytics (voliteľné)
5. Kliknite **"Create project"**

## 2. Aktivácia Firestore Database

1. V ľavom menu kliknite na **"Firestore Database"**
2. Kliknite **"Create database"**
3. Vyberte režim:
   - **Production mode** (odporúčané pre produkciu)
   - **Test mode** (pre testovanie - všetci môžu čítať/písať)
4. Vyberte lokáciu: **europe-west** (Belgicko) - najbližšie k SR
5. Kliknite **"Enable"**

## 3. Nastavenie Security Rules (dôležité!)

V Firestore > **Rules** nastavte:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Povolenie prístupu len prihláseným používateľom
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Alebo pre začiatok (test mode - NEBEZPEČNÉ pre produkciu!):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 4. Získanie Firebase konfigurácie

1. V Firebase Console prejdite na **Project Settings** (ikona ozubeného kolesa)
2. V sekcii **"Your apps"** kliknite na **Web icon** (`</>`)
3. Názov aplikácie: `RevNote Web`
4. **NEKLIKAJTE** na "Also set up Firebase Hosting"
5. Kliknite **"Register app"**
6. Skopírujte konfiguračné hodnoty z `firebaseConfig`

## 5. Nastavenie v aplikácii

1. **Vytvorte `.env` súbor** v root priečinku projektu:

```bash
cp .env.example .env
```

2. **Vyplňte Firebase credentials** do `.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=revnote-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=revnote-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=revnote-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxx
```

3. **Reštartujte dev server**:

```bash
npm run dev
```

## 6. Overenie funkčnosti

1. Otvorte aplikáciu v prehliadači
2. Prihláste sa
3. Pridajte náradie alebo revíziu
4. V Firebase Console > **Firestore Database** by ste mali vidieť nové dáta

## 7. Produkčné nasadenie (GitHub Pages)

### Nastavenie Environment Variables v GitHub:

1. Prejdite na GitHub repo: `https://github.com/idea3dsvk/revnote`
2. **Settings** > **Secrets and variables** > **Actions**
3. Kliknite **"New repository secret"**
4. Pridajte každú premennú samostatne:
   - Name: `VITE_FIREBASE_API_KEY`
   - Secret: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX`
5. Opakujte pre všetky Firebase premenné

### Aktualizácia GitHub Actions workflow:

Súbor `.github/workflows/deploy.yml` už obsahuje správnu konfiguráciu.

Po nastavení secrets stačí:

```bash
git push
```

## 8. Výhody Firebase integrácie

✅ **Automatická synchronizácia** - zmeny sa prejavia okamžite  
✅ **Realtime updates** - všetci používatelia vidia aktuálne dáta  
✅ **Offline podpora** - Firebase cache funguje aj bez internetu  
✅ **Zálohovanie dát** - dáta sú v cloude, nie len v prehliadači  
✅ **Multi-device** - prístup z viacerých zariadení  
✅ **Škálovateľnosť** - automatické škálovanie podľa potreby

## 9. Troubleshooting

### Problém: "Firebase not configured"

- Skontrolujte či `.env` súbor existuje
- Overte že všetky premenné začínajú `VITE_`
- Reštartujte dev server (`Ctrl+C` a znovu `npm run dev`)

### Problém: "Permission denied"

- Skontrolujte Security Rules vo Firestore
- Pre testovanie použite test mode (allow read, write: if true)

### Problém: Dáta sa neukladajú

- Otvorte Developer Console (F12) a skontrolujte chyby
- Overte že Firestore je aktivovaná
- Skontrolujte Security Rules

## 10. Migrácia existujúcich dát

Ak už máte dáta v localStorage:

1. Prihláste sa do aplikácie
2. Kliknite **Export dát** (len pre Admin)
3. Po nastavení Firebase:
4. Kliknite **Import dát**
5. Dáta sa automaticky nahraju do Firebase

---

**Hotovo!** 🎉 Vaša aplikácia je teraz pripojená na Firebase a všetky zmeny sa automaticky synchronizujú.
