# GitHub Secrets - Nastavenie

## Problém

Produkčná verzia na GitHub Pages nemôže používať `.env` súbor (ten je len pre lokálny vývoj).
GitHub Actions workflow potrebuje prístup k Firebase konfigurácii cez **Repository Secrets**.

## Riešenie - Pridanie Secrets

### 1. Otvorte nastavenia repozitára

Choďte na: https://github.com/idea3dsvk/revnote/settings/secrets/actions

### 2. Získajte Firebase konfiguračné hodnoty

Choďte na Firebase Console a skopírujte konfiguráciu:
https://console.firebase.google.com/project/revnote-89f0f/settings/general

Alebo použite hodnoty z lokálneho `.env` súboru.

### 3. Kliknite na "New repository secret" a pridajte každý secret:

- **VITE_FIREBASE_API_KEY** - Firebase API Key z config objektu
- **VITE_FIREBASE_AUTH_DOMAIN** - `revnote-89f0f.firebaseapp.com`
- **VITE_FIREBASE_PROJECT_ID** - `revnote-89f0f`
- **VITE_FIREBASE_STORAGE_BUCKET** - `revnote-89f0f.firebasestorage.app`
- **VITE_FIREBASE_MESSAGING_SENDER_ID** - Messaging Sender ID z Firebase Console
- **VITE_FIREBASE_APP_ID** - App ID z Firebase Console
- **VITE_RECAPTCHA_SITE_KEY** - reCAPTCHA Site Key (ak používate App Check)
- **VITE_GEMINI_API_KEY** - Gemini API kľúč (voliteľné, môžete nechať prázdne)

### 4. Po pridaní všetkých secrets

Spustite deployment znova:

- Choďte na: https://github.com/idea3dsvk/revnote/actions
- Kliknite na posledný workflow run
- Kliknite "Re-run all jobs"

ALEBO jednoducho pushnutím nového commitu:

```bash
git commit --allow-empty -m "Trigger deployment with secrets"
git push
```

### 5. Overenie

Po úspešnom deploymene skúste prihlásiť na:
https://idea3dsvk.github.io/revnote/

S demo účtami:

- **Administrator:** auotns@gmail.com / heslo: admin123
- **Revízny technik:** technik@auo.com / heslo: revisor123
- **Používateľ:** user@auo.com / heslo: user123

## Poznámky

- Secrets sú šifrované a bezpečne uložené v GitHub
- .env súbor zostáva pre lokálny development
- Firebase API kľúč je bezpečný zverejniť (je určený pre klientske aplikácie)
- Domain restrictions sú nastavené vo Firebase Console
