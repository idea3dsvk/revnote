# GitHub Secrets Setup - KRITICKÉ

## ⚠️ PROBLÉM: App Check nefunguje v produkcii!

V DevTools Console sa zobrazuje:
```
reCAPTCHA Site Key not configured. App Check disabled.
```

## Riešenie: Pridaj chýbajúci GitHub Secret

### Krok 1: Choď do GitHub Settings
1. Otvor https://github.com/idea3dsvk/revnote
2. Klikni na **Settings** (hore vpravo)
3. V ľavom menu klikni na **Secrets and variables** → **Actions**

### Krok 2: Pridaj nový secret
1. Klikni **New repository secret**
2. Name: `VITE_RECAPTCHA_SITE_KEY`
3. Value: `6Leo2forAAAAAO1U0HfkdTdRCSPp6wv7WBYwaErj`
4. Klikni **Add secret**

### Krok 3: Re-deploy aplikáciu
Po pridaní secretu:
1. Urob akýkoľvek commit (alebo klikni Actions → Re-run)
2. GitHub Actions automaticky zbuilduje aplikáciu s novým secretom
3. App Check bude fungovať

## Kontrola po re-deployi

Otvor https://idea3dsvk.github.io/revnote/ a v DevTools Console by mal byť:
- ✅ `Firebase App Check initialized successfully`
- ✅ ŽIADNE upozornenie "reCAPTCHA Site Key not configured"

## Zoznam všetkých potrebných GitHub Secrets

Pre úplnú funkčnosť potrebuješ tieto secrets:

### Firebase (POVINNÉ)
- ✅ `VITE_FIREBASE_API_KEY`
- ✅ `VITE_FIREBASE_AUTH_DOMAIN`
- ✅ `VITE_FIREBASE_PROJECT_ID`
- ✅ `VITE_FIREBASE_STORAGE_BUCKET`
- ✅ `VITE_FIREBASE_MESSAGING_SENDER_ID`
- ✅ `VITE_FIREBASE_APP_ID`

### App Check (POVINNÉ pre bezpečnosť)
- ❌ `VITE_RECAPTCHA_SITE_KEY` - **CHÝBA! PRIDAJ!**

### Gemini AI (VOLITEĽNÉ)
- ⚠️ `VITE_GEMINI_API_KEY` - voliteľné, pre AI asistenta

## Hodnoty reCAPTCHA

### Site Key (verejný - pre frontend)
```
6Leo2forAAAAAO1U0HfkdTdRCSPp6wv7WBYwaErj
```

### Secret Key (tajný - pre Firebase Console)
Tento je už nastavený v Firebase Console, nepridávaj ho do GitHub!

## Po pridaní secretu

1. **Bezpečnostné pravidlá Firestore môžu zostať:**
   ```javascript
   allow read, write: if request.auth != null;
   ```

2. **Po overení že App Check funguje, zmeň na:**
   ```javascript
   allow read, write: if request.auth != null && request.app != null;
   ```

## Ďalšie warningy (menej kritické)

### Tailwind CDN Warning
```
cdn.tailwindcss.com should not be used in production
```
Toto je len warning, aplikácia funguje. Ak chceš vyriešiť:
- Nainštaluj Tailwind CSS cez npm
- Odstráň CDN link z index.html
- Nakonfiguruj PostCSS

### Gemini API Key Missing
```
VITE_GEMINI_API_KEY environment variable not set
```
Toto je v poriadku - Gemini AI asistent je voliteľný feature.
Ak chceš AI asistenta, pridaj GitHub secret `VITE_GEMINI_API_KEY` s API kľúčom z Google AI Studio.

### Iné chyby
```
LogRocket: script could not load
Sentry errors (429)
```
Tieto sú z rozšírení browsera, nie z tvojej aplikácie. Môžeš ich ignorovať.
