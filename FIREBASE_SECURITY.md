# Firebase Security Rules - Dokumentácia

## Prehľad

Firestore Security Rules zabezpečujú, že len autorizovaní používatelia môžu pristupovať k dátam.

## Hierarchia oprávnení

### 1. ADMINISTRATOR

- ✅ Čítať všetky kolekcie
- ✅ Vytvárať, upravovať a mazať všetky záznamy
- ✅ Spravovať používateľov
- ✅ Spravovať operátorov

### 2. REVISOR (Revízny technik)

- ✅ Čítať všetky kolekcie
- ✅ Vytvárať a upravovať zariadenia (assets)
- ✅ Vytvárať a upravovať inšpekcie (inspections)
- ❌ Nemôže mazať záznamy
- ❌ Nemôže spravovať používateľov
- ❌ Nemôže spravovať operátorov

### 3. USER (Používateľ)

- ✅ Čítať všetky kolekcie
- ❌ Nemôže vytvárať ani upravovať žiadne záznamy
- ❌ Len zobrazovanie dát

## Bezpečnostné kontroly

### Autentifikácia

```javascript
function isAuthenticated() {
  return request.auth != null;
}
```

Overuje, či je používateľ prihlásený cez Firebase Authentication.

### Aktivita účtu

```javascript
function isActiveUser() {
  return isAuthenticated() && getUserData().isActive == true;
}
```

Neaktívni používatelia nemôžu pristupovať k žiadnym dátam.

### Kontrola rolí

- `isAdmin()` - ADMINISTRATOR
- `isRevisor()` - REVISOR
- `isUser()` - USER

## Kolekcie a oprávnenia

### `/users/{userId}`

- **Read:** Všetci prihlásení aktívni používatelia
- **Create/Update:** Len ADMINISTRATOR
- **Delete:** Len ADMINISTRATOR

### `/assets/{assetId}` (Zariadenia)

- **Read:** Všetci prihlásení aktívni používatelia
- **Create/Update:** ADMINISTRATOR a REVISOR
- **Delete:** Len ADMINISTRATOR

### `/inspections/{inspectionId}` (Kontroly)

- **Read:** Všetci prihlásení aktívni používatelia
- **Create/Update:** ADMINISTRATOR a REVISOR
- **Delete:** Len ADMINISTRATOR

### `/operators/{operatorId}` (Operátori)

- **Read:** Všetci prihlásení aktívni používatelia
- **Create/Update/Delete:** Len ADMINISTRATOR

## Nasadenie pravidiel

### 1. Lokálne testovanie (voliteľné)

```bash
firebase emulators:start --only firestore
```

### 2. Nasadenie na Firebase

```bash
firebase deploy --only firestore:rules
```

### 3. Overenie v Firebase Console

1. Choďte na: https://console.firebase.google.com/project/revnote-89f0f/firestore/rules
2. Skontrolujte, či sú pravidlá aktívne
3. Môžete použiť "Rules Playground" pre testovanie

## Bezpečnostné odporúčania

### ✅ Implementované

- Firebase Authentication (email/password)
- Role-based access control (RBAC)
- Aktivácia/deaktivácia účtov
- Firestore Security Rules

### ⚠️ Odporúčané vylepšenia

1. **Firebase App Check** (momentálne vypnuté)

   - Re-enablenúť po získaní správnych Google Cloud oprávnení
   - Ochrana proti robotom a abuse

2. **Email verifikácia**

   ```javascript
   function isEmailVerified() {
     return request.auth.token.email_verified == true;
   }
   ```

3. **Rate limiting**

   - Firebase Extensions: "Limit Firestore Writes"
   - Ochrana proti DoS útokom

4. **Audit logging**

   - Logovanie všetkých zmien (kto, kedy, čo zmenil)
   - Firebase Extensions: "Firestore Document History"

5. **Two-Factor Authentication (2FA)**

   - Pre administrátorské účty

6. **IP whitelisting** (voliteľné)

   - Obmedzenie prístupu len z firemných IP

7. **Firebase Storage Rules**

   - Ak budete ukladať súbory (PDF reporty, fotky)

8. **HTTPS only**
   - GitHub Pages už má HTTPS automaticky
   - Firebase Hosting má HTTPS automaticky

## Monitorovanie

### Firebase Console

- Security Rules: https://console.firebase.google.com/project/revnote-89f0f/firestore/rules
- Authentication: https://console.firebase.google.com/project/revnote-89f0f/authentication/users
- Usage: https://console.firebase.google.com/project/revnote-89f0f/usage

### Dôležité metriky

- Neúspešné prihlásenia
- Zamietnuté Firestore požiadavky
- Podezrivá aktivita

## Ako nasadiť pravidlá TERAZ

```bash
# 1. Nainštalujte Firebase CLI (ak ešte nemáte)
npm install -g firebase-tools

# 2. Prihláste sa
firebase login

# 3. Nasaďte pravidlá
firebase deploy --only firestore:rules
```

**DÔLEŽITÉ:** Pravidlá sú len v súbore, musíte ich nasadiť do Firebase!
