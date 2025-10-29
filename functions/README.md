# Firebase Functions - Email Notifications

Email notifikácie pre pripomienky blížiacich sa revízií pomocou Firebase Functions a SendGrid.

## Funkcie

### 1. `sendInspectionReminders` (Scheduled)
- **Spúšťa sa:** Každý deň o 9:00 ráno (Europe/Bratislava)
- **Účel:** Kontroluje blížiace sa revízie a odosiela email pripomienky
- **Konfigurácia:** Firestore collection `settings/notifications`

### 2. `triggerInspectionReminders` (HTTP)
- **Spúšťa sa:** Manuálne cez HTTP volanie
- **Účel:** Testovanie a manuálne spustenie kontrol
- **Vyžaduje:** Autentifikáciu

### 3. `updateNotificationSettings` (HTTP)
- **Spúšťa sa:** Cez aplikáciu
- **Účel:** Aktualizácia nastavení notifikácií
- **Vyžaduje:** Autentifikáciu

## Inštalácia

### 1. Nainštaluj dependencies

```bash
cd functions
npm install
```

### 2. Nastav SendGrid API Key

#### Lokálne (development):
```bash
# Vytvor .env súbor v functions/ priečinku
echo "SENDGRID_API_KEY=SG.your_api_key_here" > .env
echo "SENDGRID_FROM_EMAIL=noreply@vasadomena.sk" >> .env
```

#### Production (Firebase):
```bash
firebase functions:config:set sendgrid.apikey="SG.your_api_key_here"
firebase functions:config:set sendgrid.fromemail="noreply@vasadomena.sk"
```

### 3. Deploy Firebase Functions

```bash
# Build TypeScript
npm run build

# Deploy functions
firebase deploy --only functions
```

## SendGrid Setup

### 1. Vytvor SendGrid účet
1. Choď na https://sendgrid.com/
2. Zaregistruj sa (Free tier - 100 emailov/deň)
3. Verify email address

### 2. Vytvor API Key
1. Settings → API Keys
2. Create API Key
3. Full Access (alebo Mail Send)
4. Skopíruj API key (SG.xxxxxxxxx)

### 3. Verify Sender Identity
1. Settings → Sender Authentication
2. Verify Single Sender
3. Vyplň email a meno
4. Verify cez email

### 4. (Voliteľné) Custom Domain
Ak chceš posielať z vlastnej domény:
1. Settings → Sender Authentication
2. Authenticate Your Domain
3. Postupuj podľa inštrukcií (DNS records)

## Firestore Struktura

### Collection: `settings/notifications`
```javascript
{
  enabled: true,
  recipients: [
    "admin@firma.sk",
    "revisor@firma.sk"
  ],
  daysBeforeInspection: [30, 14, 7, 3, 1, 0]
}
```

- **enabled:** Zapnuté/vypnuté email notifikácie
- **recipients:** Zoznam email adries pre príjemcov
- **daysBeforeInspection:** Počet dní pred revíziou kedy poslať pripomienku

## Použitie v aplikácii

### Inicializácia nastavení
Pri prvom spustení vytvor Firestore dokument:

```javascript
db.collection('settings').doc('notifications').set({
  enabled: true,
  recipients: ['admin@firma.sk'],
  daysBeforeInspection: [30, 14, 7, 3, 1, 0]
});
```

### Aktualizácia nastavení cez UI
```javascript
const updateSettings = httpsCallable(functions, 'updateNotificationSettings');

await updateSettings({
  enabled: true,
  recipients: ['admin@firma.sk', 'revisor@firma.sk'],
  daysBeforeInspection: [30, 14, 7, 3, 1, 0]
});
```

### Manuálne spustenie (pre testovanie)
```javascript
const triggerReminders = httpsCallable(functions, 'triggerInspectionReminders');

const result = await triggerReminders();
console.log(result.data); // { success: true, message: '...' }
```

## Testovanie Lokálne

### 1. Spusti emulátory
```bash
npm run serve
```

### 2. Otestuj funkciu
V druhom termináli:
```bash
# HTTP funkcia
curl http://localhost:5001/revnote-89f0f/europe-west1/triggerInspectionReminders \
  -H "Authorization: Bearer $(firebase login:ci)" \
  -H "Content-Type: application/json"
```

## GitHub Actions Deployment

Ak chceš automaticky deployovať functions cez GitHub Actions, pridaj do `.github/workflows/deploy.yml`:

```yaml
- name: Deploy Firebase Functions
  env:
    FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
  run: |
    cd functions
    npm ci
    npm run build
    npx firebase-tools deploy --only functions --token "$FIREBASE_TOKEN"
```

A pridaj GitHub Secret:
- **FIREBASE_TOKEN:** Vygeneruj cez `firebase login:ci`

## Cena

### SendGrid (Free tier):
- 100 emailov/deň zdarma
- 40,000 emailov/mesiac na Free plane

### Firebase Functions (Spark - Free):
- 2M volania/mesiac
- Scheduled functions: zdarma na Blaze plane

**Odporúčanie:** Pre produkčné použitie prejdi na Firebase **Blaze plan** (pay-as-you-go)
- Scheduled functions fungujú iba na Blaze
- Prvé 2M volania mesačne stále zdarma

## Email Notifikácie

Emailové notifikácie obsahujú:
- ✅ Zoznam zariadení s blížiacou sa revíziou
- ✅ Termín revízie pre každé zariadenie
- ✅ Urgentnosť (farebné označenie)
- ✅ Informácie o prevádzkovateľovi
- ✅ Link na aplikáciu
- ✅ HTML aj plain text verzia

## Troubleshooting

### Email sa neodosiela
1. Over SendGrid API key: `firebase functions:config:get`
2. Over že sender email je verified v SendGrid
3. Skontroluj logs: `firebase functions:log`

### Function neprebieha scheduled
1. Over že si na Blaze plane
2. Skontroluj Cloud Scheduler: https://console.cloud.google.com/cloudscheduler
3. Over timezone nastavenie

### Permission denied
1. Firebase Functions potrebujú Admin SDK
2. Over Firestore rules - functions majú automaticky plný prístup

## Monitoring

### Logs
```bash
firebase functions:log --only sendInspectionReminders
```

### Firebase Console
https://console.firebase.google.com/project/revnote-89f0f/functions

### SendGrid Email Activity
https://app.sendgrid.com/email_activity

## Bezpečnosť

- ✅ API keys sú v Firebase config (nie v kóde)
- ✅ HTTP funkcie vyžadujú autentifikáciu
- ✅ SendGrid API key má iba Mail Send permission
- ✅ Email adresy sú validované
