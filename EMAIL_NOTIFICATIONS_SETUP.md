# Email Notifikácie - Kompletný Setup Guide

Tento guide ti pomôže nastaviť automatické email pripomienky o blížiacich sa revíziách.

## Čo potrebuješ

1. ✅ Firebase Blaze Plan (pay-as-you-go)
2. ✅ SendGrid účet (Free tier postačuje)
3. ✅ Node.js 18+ (už máš)
4. ✅ Firebase CLI

## Krok 1: Upgrade na Firebase Blaze Plan

**Prečo:** Scheduled functions (denné emaily o 9:00) fungujú iba na Blaze plane.

1. Choď do Firebase Console: https://console.firebase.google.com/project/revnote-89f0f/usage
2. Klikni **"Upgrade project"** alebo **"Modify plan"**
3. Vyber **"Blaze - Pay as you go"**
4. Pridaj platobnú kartu (Google Cloud billing)
5. Nastav **Spending limit** (napr. $10/mesiac) aby si sa vyhol prekvapeniu

**Cena:**
- Prvé 2M Cloud Functions volania **ZDARMA** mesačne
- Scheduled functions: zdarma v rámci kvóty
- Pre túto aplikáciu očakávaná cena: **$0-1/mesiac**

## Krok 2: SendGrid Account Setup

### A. Vytvor SendGrid účet
1. Choď na https://signup.sendgrid.com/
2. Zaregistruj sa (Free plan - 100 emailov/deň)
3. Verify email address

### B. Vytvor API Key
1. V SendGrid dashboard choď na **Settings** → **API Keys**
2. Klikni **"Create API Key"**
3. **Name:** `RevNote Production`
4. **API Key Permissions:** Vyber **"Restricted Access"**
   - Mail Send: **Full Access** ✅
   - Ostatné: **No Access**
5. Klikni **"Create & View"**
6. **DÔLEŽITÉ:** Skopíruj API key (začína `SG.`) - neuvidíš ho znova!

Príklad API key:
```
SG.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

### C. Verify Sender Identity
SendGrid vyžaduje overenie odosielateľa:

**Variant 1: Single Sender (rýchle, bez domény)**
1. Settings → **Sender Authentication**
2. Klikni **"Verify a Single Sender"**
3. Vyplň formulár:
   - **From Name:** RevNote
   - **From Email Address:** tvoj.email@gmail.com (alebo firemný)
   - **Reply To:** rovnaký email
   - **Company Address:** adresa firmy
4. Verify cez email ktorý dostaneš

**Variant 2: Domain Authentication (profesionálne, vlastná doména)**
1. Settings → **Sender Authentication**
2. Klikni **"Authenticate Your Domain"**
3. Vyber DNS provider (napr. CloudFlare, GoDaddy)
4. Postupuj podľa inštrukcií - pridaj DNS records
5. Po overení môžeš posielať z `noreply@tvojadomena.sk`

## Krok 3: Nainštaluj Firebase CLI

```bash
npm install -g firebase-tools
```

Login do Firebase:
```bash
firebase login
```

## Krok 4: Inicializuj Firebase Functions

V root priečinku projektu:

```bash
# Už máš functions/ priečinok vytvorený, tak len nainštaluj dependencies
cd functions
npm install
```

## Krok 5: Nastav Firebase Config

### Development (.env file):
Vytvor `.env` súbor v `functions/` priečinku:

```bash
SENDGRID_API_KEY=SG.tvoj_api_key_tu
SENDGRID_FROM_EMAIL=tvoj.email@gmail.com
```

**DÔLEŽITÉ:** Pridaj `.env` do `.gitignore`!

### Production (Firebase Config):
```bash
firebase functions:config:set sendgrid.apikey="SG.tvoj_api_key_tu"
firebase functions:config:set sendgrid.fromemail="tvoj.email@gmail.com"
```

Verify config:
```bash
firebase functions:config:get
```

## Krok 6: Deploy Firebase Functions

### Build:
```bash
npm run build
```

### Deploy:
```bash
firebase deploy --only functions
```

Malo by to vypisovať:
```
✔  functions[sendInspectionReminders(europe-west1)] Successful create operation.
✔  functions[triggerInspectionReminders(europe-west1)] Successful create operation.
✔  functions[updateNotificationSettings(europe-west1)] Successful create operation.
```

## Krok 7: Nastav Notifikácie v Aplikácii

### Option A: Cez Firebase Console (rýchle)
1. Choď do Firestore: https://console.firebase.google.com/project/revnote-89f0f/firestore
2. Vytvor collection: `settings`
3. Vytvor document ID: `notifications`
4. Pridaj fields:
```javascript
{
  enabled: true,  // boolean
  recipients: ["admin@firma.sk", "revisor@firma.sk"],  // array
  daysBeforeInspection: [30, 14, 7, 3, 1, 0]  // array
}
```

### Option B: Cez UI v aplikácii (elegantné)
1. Otvor aplikáciu: https://idea3dsvk.github.io/revnote/
2. V hlavičke bude nové tlačidlo "⚙️ Email Notifikácie" (po pridaní do App.tsx)
3. Zapni notifikácie
4. Pridaj email adresy
5. Vyber dni kedy posielať pripomienky
6. Uložiť

## Krok 8: Testovanie

### Test 1: Manuálne spustenie
V aplikácii klikni tlačidlo **"Testovať"** - okamžite odošle emaily.

### Test 2: Cez Firebase Console
1. Choď do Cloud Functions: https://console.firebase.google.com/project/revnote-89f0f/functions
2. Nájdi `triggerInspectionReminders`
3. Klikni a spusti manuálne

### Test 3: Počkaj na scheduled run
Scheduled function sa spustí každý deň o 9:00 automaticky.

Skontroluj logs:
```bash
firebase functions:log --only sendInspectionReminders
```

## Krok 9: Integrácia do Aplikácie

Pridaj tlačidlo do `App.tsx` header:

```tsx
// Import
import EmailNotifications from './components/EmailNotifications';

// State
const [isEmailNotificationsOpen, setIsEmailNotificationsOpen] = useState(false);

// V header pridaj tlačidlo (vedľa User Panel):
<button
  onClick={() => setIsEmailNotificationsOpen(true)}
  className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
  title="Email Notifikácie"
>
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
</button>

// Modal component pred closing tags:
<EmailNotifications
  isOpen={isEmailNotificationsOpen}
  onClose={() => setIsEmailNotificationsOpen(false)}
/>
```

## Troubleshooting

### Problem: "Firebase Blaze plan required"
**Riešenie:** Upgrade na Blaze plan (Krok 1)

### Problem: "SendGrid authentication failed"
**Riešenie:** 
- Over API key: `firebase functions:config:get`
- Over že sender email je verified v SendGrid

### Problem: "Emaily sa neodosielajú"
**Riešenie:**
1. Skontroluj logs: `firebase functions:log`
2. Over SendGrid Dashboard → Email Activity
3. Over že `enabled: true` v Firestore

### Problem: "Scheduled function nebežala"
**Riešenie:**
1. Over Cloud Scheduler: https://console.cloud.google.com/cloudscheduler
2. Mal by tam byť job `firebase-schedule-sendInspectionReminders-europe-west1`
3. Ak nie, re-deploy: `firebase deploy --only functions`

### Problem: "Missing or insufficient permissions"
**Riešenie:** Firebase Functions majú automaticky Admin prístup, ale over Firestore rules.

## Monitoring & Maintenance

### Sleduj execution logs:
```bash
firebase functions:log --only sendInspectionReminders --limit 50
```

### SendGrid Email Activity:
https://app.sendgrid.com/email_activity

### Firebase Functions Dashboard:
https://console.firebase.google.com/project/revnote-89f0f/functions

### Zmena schedule (napr. 8:00 namiesto 9:00):
V `functions/src/index.ts` zmeň:
```typescript
.pubsub.schedule('0 8 * * *')  // 8:00 AM
```

## Cena & Limity

### SendGrid Free Tier:
- ✅ 100 emailov/deň
- ✅ 3,000 emailov/mesiac
- ✅ Unlimited kontakty

Ak potrebuješ viac: $19.95/mesiac = 50,000 emailov

### Firebase Blaze Plan:
- ✅ Prvé 2M Cloud Functions volania **ZDARMA**
- ✅ Scheduled functions: zdarma v rámci kvóty
- Nad 2M: $0.40 za milión volanie

**Odhad pre túto aplikáciu:**
- 1x scheduled function denne = 30 volání/mesiac
- Cena: **$0** (v rámci free tier)

## Bezpečnosť

✅ **Dobre:**
- SendGrid API key je v Firebase config, nie v kóde
- HTTP functions vyžadujú Firebase Auth
- Email adresy sú v Firestore (nie hardcoded)

⚠️ **Odporúčania:**
- Používaj restricted SendGrid API key (len Mail Send)
- Nastav Firebase Spending limit
- Monitoruj SendGrid Email Activity

## Ďalšie Features (voliteľné)

### Custom Email Templates:
Uprav HTML v `generateEmailHTML()` function

### Slack/Discord Notifikácie:
Pridaj webhook namiesto/okrem SendGrid

### SMS Notifikácie:
Použij Twilio namiesto SendGrid

### Weekly Report:
Pridaj druhú scheduled function pre týždenný report

---

**Hotovo!** 🎉 Email notifikácie sú nastavené a budú automaticky posielať pripomienky každý deň o 9:00.
