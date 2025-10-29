# Firebase App Check Testing Checklist

## Pred aktualizáciou Firestore rules

### 1. Otvor produkčnú aplikáciu
URL: https://idea3dsvk.github.io/revnote/

### 2. Otvor Developer Console (F12)
Klikni na záložku "Console"

### 3. Skontroluj inicializáciu
Hľadaj tieto hlášky:
- ✅ `Firebase initialized successfully`
- ✅ `Firebase App Check initialized successfully`
- ✅ `Firebase: Anonymous user signed in`

### 4. Skontroluj chyby
Skontroluj, že NIE SÚ žiadne chyby typu:
- ❌ `App Check token invalid`
- ❌ `reCAPTCHA failed to load`
- ❌ `Missing or insufficient permissions`

### 5. Testovanie funkcií

#### Test 1: Pridanie zariadenia
- [ ] Klikni "Pridať nové náradie"
- [ ] Vyplň formulár
- [ ] Klikni "Pridať"
- [ ] Očakávaný výsledok: Zelený toast "Zariadenie pridané"

#### Test 2: Pridanie revízie
- [ ] Vyber zariadenie
- [ ] Klikni "Pridať revíziu"
- [ ] Vyplň formulár
- [ ] Klikni "Uložiť"
- [ ] Očakávaný výsledok: Zelený toast "Revízia pridaná"

#### Test 3: Úprava prevádzkovateľa
- [ ] Klikni ikonu budovy (vpravo hore v zozname)
- [ ] Uprav údaje
- [ ] Klikni "Uložiť"
- [ ] Očakávaný výsledok: Zelený toast "Údaje prevádzkovateľa boli uložené"

#### Test 4: Real-time sync
- [ ] Otvor aplikáciu na 2 zariadeniach/taboch
- [ ] Pridaj zariadenie na jednom
- [ ] Očakávaný výsledok: Zobrazí sa automaticky aj na druhom

### 6. Ak všetky testy prešli ✅

Môžeš aktualizovať Firestore rules:

1. Choď do Firebase Console: https://console.firebase.google.com/
2. Vyber projekt
3. Firestore Database → Rules
4. Zmeň na:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null && request.app != null;
    }
  }
}
```
5. Klikni "Publish"

### 7. Po aktualizácii rules - Overenie

Zopakuj všetky testy 1-4. Všetko by malo fungovať rovnako.

Ak niečo nefunguje:
1. Skontroluj Console v DevTools
2. Hľadaj chybové hlášky
3. V prípade problémov vráť rules späť na:
```javascript
allow read, write: if request.auth != null;
```

## Poznámky

- reCAPTCHA v3 beží na pozadí, používateľ nemusí nič riešiť
- App Check token sa automaticky obnovuje
- Debug módy sú zakázané v produkcii
- Localhost potrebuje samostatný debug token (v development móde)
