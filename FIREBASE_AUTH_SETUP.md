# Firebase Authentication - Návod na nastavenie

Aplikácia teraz používa **Firebase Authentication** namiesto lokálnej autentifikácie. Tento dokument obsahuje návod na nastavenie a vytvorenie používateľov.

## 1. Povolenie Firebase Authentication

### V Firebase Console:

1. Prejdite na [Firebase Console](https://console.firebase.google.com/)
2. Vyberte svoj projekt
3. V ľavom menu kliknite na **Authentication**
4. Kliknite na **Get Started** (ak ešte nie je aktivované)
5. V záložke **Sign-in method** povoľte:
   - **Email/Password** - zapnite túto možnosť
   - Nemusíte povoľovať "Email link (passwordless sign-in)"

## 2. Vytvorenie administrátorského účtu

### Krok 1: Vytvorenie používateľa vo Firebase Authentication

1. V Firebase Console prejdite na **Authentication** > **Users**
2. Kliknite na **Add user**
3. Zadajte:
   - **Email**: váš administrátorský email (napr. `admin@example.com`)
   - **Password**: silné heslo (napr. `AdminHeslo123!`)
4. Kliknite na **Add user**
5. Poznačte si **User UID** - budete ho potrebovať v ďalšom kroku

### Krok 2: Vytvorenie profilu používateľa vo Firestore

1. V Firebase Console prejdite na **Firestore Database**
2. Kliknite na **+ Start collection**
3. Zadajte **Collection ID**: `users`
4. Kliknite na **Next**
5. **Document ID**: použite **User UID** z predchádzajúceho kroku
6. Pridajte nasledovné polia:

| Field       | Type      | Value                                               |
| ----------- | --------- | --------------------------------------------------- |
| `username`  | string    | `admin` (alebo vaše preferované používateľské meno) |
| `email`     | string    | `admin@example.com` (rovnaký ako vo Firebase Auth)  |
| `fullName`  | string    | `Administrátor systému`                             |
| `role`      | string    | `ADMINISTRATOR`                                     |
| `isActive`  | boolean   | `true`                                              |
| `createdAt` | timestamp | Kliknite na "Use current timestamp"                 |

7. Kliknite na **Save**

## 3. Aktualizácia Firestore Security Rules

Upravte Firestore pravidlá, aby používatelia mohli pristupovať k svojim dátam:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Pravidlá pre používateľov
    match /users/{userId} {
      // Používateľ môže čítať len svoj vlastný profil
      allow read: if request.auth != null && request.auth.uid == userId;

      // Iba administrátori môžu upravovať profily
      allow write: if request.auth != null &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMINISTRATOR';
    }

    // Pravidlá pre assets (zariadenia)
    match /assets/{assetId} {
      // Prihlásení používatelia môžu čítať zariadenia
      allow read: if request.auth != null;

      // Iba revizori a administrátori môžu pridávať/upravovať zariadenia
      allow write: if request.auth != null &&
                      (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMINISTRATOR' ||
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'REVISOR');
    }

    // Pravidlá pre operator
    match /operator/data {
      // Prihlásení používatelia môžu čítať údaje prevádzkovateľa
      allow read: if request.auth != null;

      // Iba administrátori môžu upravovať údaje prevádzkovateľa
      allow write: if request.auth != null &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMINISTRATOR';
    }
  }
}
```

## 4. Prihlásiť sa do aplikácie

1. Otvorte aplikáciu v prehliadači
2. Zobrazí sa prihlasovací formulár
3. Zadajte:
   - **Email**: email, ktorý ste vytvorili vo Firebase Authentication
   - **Password**: heslo, ktoré ste nastavili
4. Kliknite na **Prihlásiť sa**

## 5. Vytvorenie ďalších používateľov

### Metóda 1: Manuálne cez Firebase Console (Odporúčané)

Pre vytvorenie nových používateľov zopakujte kroky 2.1 a 2.2, ale s rôznymi rolami:

**Dostupné role:**

- `ADMINISTRATOR` - plný prístup (správa používateľov, import/export, všetky funkcie)
- `REVISOR` - pridávanie zariadení a revízií, vylučovanie zariadení
- `USER` - iba prezerannie zariadení a generovanie PDF

### Metóda 2: Pomocou Firebase Cloud Functions (Pokročilé)

Ak chcete umožniť automatické vytváranie používateľov v aplikácii, budete potrebovať:

1. Vytvoriť Firebase Cloud Function s Admin SDK
2. Implementovať endpoint pre vytváranie používateľov
3. Zabezpečiť endpoint, aby ho mohli volať iba administrátori

Príklad Cloud Function (v priečinku `functions/src/index.ts`):

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const createUser = functions.https.onCall(async (data, context) => {
  // Skontroluj, či je volajúci administrátor
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Musíte byť prihlásený"
    );
  }

  const callerDoc = await admin
    .firestore()
    .collection("users")
    .doc(context.auth.uid)
    .get();
  const callerData = callerDoc.data();

  if (!callerData || callerData.role !== "ADMINISTRATOR") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Nemáte oprávnenie vytvárať používateľov"
    );
  }

  // Vytvor používateľa vo Firebase Auth
  const userRecord = await admin.auth().createUser({
    email: data.email,
    password: data.password,
    displayName: data.fullName,
  });

  // Vytvor profil vo Firestore
  await admin
    .firestore()
    .collection("users")
    .doc(userRecord.uid)
    .set({
      username: data.username,
      email: data.email,
      fullName: data.fullName,
      role: data.role || "USER",
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  return { success: true, uid: userRecord.uid };
});
```

## 6. Resetovanie hesla

### Pre používateľov:

1. Zatiaľ nie je implementované UI pre resetovanie hesla
2. Môžete použiť Firebase Console:
   - Authentication > Users
   - Nájdite používateľa
   - Kliknite na tri bodky > Reset password
   - Používateľ dostane email s odkazom na reset

### Implementácia funkcie "Zabudnuté heslo" (Voliteľné)

V `LoginModal.tsx` môžete pridať:

```typescript
import { sendPasswordResetEmail } from "firebase/auth";

const handlePasswordReset = async (email: string) => {
  if (!auth) return;

  try {
    await sendPasswordResetEmail(auth, email);
    alert("Email na obnovenie hesla bol odoslaný");
  } catch (error) {
    console.error("Chyba pri odoslaní emailu:", error);
    alert("Chyba pri odoslaní emailu na obnovenie hesla");
  }
};
```

## 7. Bezpečnostné odporúčania

1. **Silné heslá**: Vždy používajte silné heslá pre administrátorské účty
2. **Environment premenné**: Uistite sa, že Firebase konfigurácia je v `.env` súbore a nie je commitnutá do Git
3. **Firestore Rules**: Pravidelne kontrolujte a aktualizujte Firestore pravidlá
4. **App Check**: Aktivujte Firebase App Check pre ochranu proti zneužitiu API
5. **Monitoring**: Sledujte Firebase Authentication logy pre podozrivé aktivity

## 8. Časté problémy a riešenia

### Problém: "Firebase nie je nakonfigurovaný"

**Riešenie**: Uistite sa, že máte správne nastavené environment premenné v `.env` súbore:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Problém: "Používateľské dáta nenájdené"

**Riešenie**: Skontrolujte, či existuje dokument vo Firestore v kolekcii `users` s rovnakým UID ako používateľ vo Firebase Authentication.

### Problém: "Permission denied" pri prístupe k Firestore

**Riešenie**: Skontrolujte Firestore Security Rules a uistite sa, že používateľ má správne nastavené oprávnenia vo svojom profile.

## 9. Migrácia z lokálnej autentifikácie

Ak ste predtým používali lokálnu autentifikáciu (localStorage), všetci používatelia musia byť znovu vytvorení vo Firebase Authentication a Firestore. Staré údaje v localStorage sa už nepoužívajú.

---

**Poznámka**: Po prvom nastavení Firebase Authentication nezabudnite vytvoriť aspoň jedného administrátora, inak sa nebudete môcť prihlásiť do aplikácie.
